import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"
import { createHmac } from "https://deno.land/std@0.168.0/crypto/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const { order_id, transaction_status, fraud_status, payment_type, gross_amount, signature_key } = body

    // Verify signature
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!
    const orderId = order_id
    const statusCode = transaction_status
    const grossAmount = String(gross_amount)
    
    const rawSignature = `${orderId}${statusCode}${grossAmount}${midtransServerKey}`
    const encoder = new TextEncoder()
    const keyData = encoder.encode(midtransServerKey)
    const data = encoder.encode(rawSignature)
    
    const hmac = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-512' },
      false,
      ['sign']
    )
    
    const signature = await crypto.subtle.sign('HMAC', hmac, data)
    const signatureArray = Array.from(new Uint8Array(signature))
    const signatureHex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('')

    if (signature_key !== signatureHex) {
      console.error('Invalid signature')
      return new Response('Invalid signature', { status: 403, headers: corsHeaders })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Find order by midtrans_order_id
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('midtrans_order_id', order_id)
      .single()

    if (orderError || !order) {
      console.error('Order not found:', order_id)
      return new Response('Order not found', { status: 404, headers: corsHeaders })
    }

    // Validate amount matches
    const midtransAmount = parseInt(gross_amount)
    const orderAmount = order.amount
    
    if (midtransAmount !== orderAmount) {
      console.error(`Amount mismatch: Midtrans ${midtransAmount} vs Order ${orderAmount}`)
      return new Response('Amount mismatch', { status: 400, headers: corsHeaders })
    }

    // Update order status based on transaction status
    let paymentStatus = 'pending'
    let paidAt = null

    if (transaction_status === 'capture') {
      if (fraud_status === 'accept') {
        paymentStatus = 'paid'
        paidAt = new Date().toISOString()
      } else if (fraud_status === 'challenge') {
        paymentStatus = 'pending'
      }
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'paid'
      paidAt = new Date().toISOString()
    } else if (transaction_status === 'cancel' || transaction_status === 'deny' || transaction_status === 'expire') {
      paymentStatus = 'failed'
    } else if (transaction_status === 'pending') {
      paymentStatus = 'pending'
    }

    // Update order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: paymentStatus,
        paid_at: paidAt,
        payment_method: payment_type,
        updated_at: new Date().toISOString(),
      })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order:', updateError)
      return new Response('Failed to update order', { status: 500, headers: corsHeaders })
    }

    // If payment is successful, add book to user's purchased books
    if (paymentStatus === 'paid') {
      // Check if user already has this book
      const { data: existingPurchase } = await supabase
        .from('purchased_books')
        .select('*')
        .eq('user_id', order.user_id)
        .eq('book_id', order.book_id)
        .single()

      if (!existingPurchase) {
        // Add to purchased books
        const { error: purchaseError } = await supabase
          .from('purchased_books')
          .insert({
            user_id: order.user_id,
            book_id: order.book_id,
            order_id: order.id,
            purchased_at: paidAt,
          })

        if (purchaseError) {
          console.error('Failed to add purchased book:', purchaseError)
        }
      }
    }

    console.log(`Webhook processed: ${order_id} - ${transaction_status}`)

    return new Response('OK', { headers: corsHeaders })

  } catch (error) {
    console.error('Error in webhook-midtrans:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
