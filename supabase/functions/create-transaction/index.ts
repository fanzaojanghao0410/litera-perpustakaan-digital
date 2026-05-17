import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { book_id, user_id } = await req.json()

    if (!book_id || !user_id) {
      return new Response(
        JSON.stringify({ error: 'book_id and user_id are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get book details
    const { data: book, error: bookError } = await supabase
      .from('books')
      .select('id, title, price, is_free')
      .eq('id', book_id)
      .single()

    if (bookError || !book) {
      return new Response(
        JSON.stringify({ error: 'Book not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (book.is_free) {
      return new Response(
        JSON.stringify({ error: 'This book is free' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate price constraints
    const bookPrice = book.price || 0
    
    if (bookPrice < 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid book price: price cannot be negative' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (bookPrice > 1000000) {
      return new Response(
        JSON.stringify({ error: 'Invalid book price: maximum price is Rp 1.000.000' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    
    if (bookPrice === 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid book price: price must be greater than 0 for paid books' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user details
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
    
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const user = userData.user
    const email = user.email || 'customer@example.com'
    const name = user.user_metadata?.display_name || user.email?.split('@')[0] || 'Customer'

    // Create order in database
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id,
        book_id,
        amount: bookPrice,
        payment_status: 'pending',
        midtrans_order_id: orderId,
      })
      .select()
      .single()

    if (orderError) {
      return new Response(
        JSON.stringify({ error: 'Failed to create order', details: orderError }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Midtrans transaction
    const midtransServerKey = Deno.env.get('MIDTRANS_SERVER_KEY')!
    const midtransClientKey = Deno.env.get('MIDTRANS_CLIENT_KEY')!
    const isProduction = Deno.env.get('MIDTRANS_IS_PRODUCTION') === 'true'
    const midtransBaseUrl = isProduction 
      ? 'https://app.midtrans.com/snap/v1' 
      : 'https://app.sandbox.midtrans.com/snap/v1'

    const transactionDetails = {
      transaction_details: {
        order_id: orderId,
        gross_amount: bookPrice,
      },
      customer_details: {
        first_name: name.split(' ')[0],
        last_name: name.split(' ').slice(1).join(' ') || '',
        email: email,
      },
      item_details: [
        {
          id: book.id,
          name: book.title,
          price: bookPrice,
          quantity: 1,
        },
      ],
      callbacks: {
        finish: `${Deno.env.get('APP_URL')}/payment/success?order_id=${orderId}`,
        error: `${Deno.env.get('APP_URL')}/payment/error?order_id=${orderId}`,
        pending: `${Deno.env.get('APP_URL')}/payment/pending?order_id=${orderId}`,
      },
    }

    // Get Snap Token from Midtrans
    const authString = btoa(`${midtransServerKey}:`)
    
    const midtransResponse = await fetch(`${midtransBaseUrl}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Basic ${authString}`,
      },
      body: JSON.stringify(transactionDetails),
    })

    const midtransData = await midtransResponse.json()

    if (!midtransResponse.ok) {
      return new Response(
        JSON.stringify({ error: 'Failed to create Midtrans transaction', details: midtransData }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update order with snap token
    const { error: updateError } = await supabase
      .from('orders')
      .update({ midtrans_snap_token: midtransData.token })
      .eq('id', order.id)

    if (updateError) {
      console.error('Failed to update order with snap token:', updateError)
    }

    return new Response(
      JSON.stringify({
        snap_token: midtransData.token,
        client_key: midtransClientKey,
        order_id: orderId,
        order_id_db: order.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error in create-transaction:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
