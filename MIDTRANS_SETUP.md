# Midtrans Payment Integration Setup

This document explains how to set up Midtrans payment integration for the Litera digital library application.

## Prerequisites

1. Midtrans Account - Sign up at [https://dashboard.midtrans.com/](https://dashboard.midtrans.com/)
2. Supabase Project with Edge Functions enabled
3. Node.js and npm installed

## Step 1: Get Midtrans Credentials

1. Log in to your Midtrans Dashboard
2. Go to Settings > Access Keys
3. Copy your:
   - **Server Key** (for backend/Edge Functions)
   - **Client Key** (for frontend)

For testing, use Sandbox mode. For production, switch to Production mode in the dashboard.

## Step 2: Update Environment Variables

Update your `.env` file with your Midtrans credentials:

```env
# Midtrans Configuration
VITE_MIDTRANS_CLIENT_KEY="SB-Mid-client-YOUR_CLIENT_KEY"
MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SERVER_KEY"
MIDTRANS_IS_PRODUCTION="false"

# App URL for callbacks (update for production)
APP_URL="http://localhost:5173"
```

**Important:**
- Replace `YOUR_CLIENT_KEY` and `YOUR_SERVER_KEY` with your actual Midtrans keys
- Set `MIDTRANS_IS_PRODUCTION` to `true` when going live
- Update `APP_URL` to your production domain

## Step 3: Deploy Edge Functions

### Option A: Using Supabase CLI

1. Install Supabase CLI:
```bash
npm install -g supabase
```

2. Login to Supabase:
```bash
supabase login
```

3. Link your project:
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

4. Deploy the Edge Functions:
```bash
supabase functions deploy create-transaction
supabase functions deploy webhook-midtrans
```

5. Set environment variables for Edge Functions:
```bash
supabase secrets set MIDTRANS_SERVER_KEY="SB-Mid-server-YOUR_SERVER_KEY"
supabase secrets set MIDTRANS_IS_PRODUCTION="false"
supabase secrets set APP_URL="http://localhost:5173"
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase Dashboard
2. Navigate to Edge Functions
3. Create new function named `create-transaction` and paste the code from `supabase/functions/create-transaction/index.ts`
4. Create new function named `webhook-midtrans` and paste the code from `supabase/functions/webhook-midtrans/index.ts`
5. Add environment variables in the Edge Functions settings

## Step 4: Run Database Migration

Apply the `purchased_books` table migration:

```bash
supabase db push
```

Or run the migration manually in the Supabase Dashboard SQL Editor:
- Open `supabase/migrations/20260416014000_add_purchased_books_table.sql`
- Copy and run the SQL in the SQL Editor

## Step 5: Configure Webhook URL

1. In Midtrans Dashboard, go to Settings > Notification
2. Add webhook URL: `https://YOUR_PROJECT_REF.supabase.co/functions/v1/webhook-midtrans`
3. Save the configuration

## Step 6: Update Frontend Client Key

Update the Midtrans Snap script in `index.html`:

```html
<script type="text/javascript"
  src="https://app.sandbox.midtrans.com/snap/snap.js"
  data-client-key="SB-Mid-client-YOUR_CLIENT_KEY"></script>
```

For production, use:
```html
<script type="text/javascript"
  src="https://app.midtrans.com/snap/snap.js"
  data-client-key="Mid-client-YOUR_PRODUCTION_CLIENT_KEY"></script>
```

## Step 7: Test the Integration

1. Start your development server:
```bash
npm run dev
```

2. Navigate to a book detail page
3. Click "Beli Buku" (Buy Book)
4. Complete the payment in the Midtrans popup
5. Verify that:
   - Order is created in the `orders` table
   - Payment status is updated via webhook
   - Book is added to `purchased_books` table
   - User can now read the purchased book

## Troubleshooting

### Edge Function Not Deploying
- Check that Supabase CLI is properly linked
- Verify your project reference is correct
- Check Edge Function logs in Supabase Dashboard

### Payment Not Processing
- Verify Midtrans credentials are correct
- Check Edge Function logs for errors
- Ensure webhook URL is properly configured in Midtrans Dashboard
- Check that `APP_URL` matches your current domain

### Webhook Not Receiving Updates
- Verify webhook URL is accessible from the internet
- Check Midtrans notification logs
- Ensure signature verification is working correctly

### Type Errors in TypeScript
- The Edge Functions use Deno runtime, so TypeScript errors in IDE are expected
- The functions will work correctly when deployed to Supabase

## Security Notes

- **Never commit** your Midtrans Server Key to version control
- Always use environment variables for sensitive data
- Enable webhook signature verification (already implemented)
- Use HTTPS in production
- Regularly rotate your API keys

## Production Checklist

- [ ] Switch to Production Midtrans keys
- [ ] Set `MIDTRANS_IS_PRODUCTION="true"`
- [ ] Update `APP_URL` to production domain
- [ ] Update Snap script URL to production
- [ ] Configure production webhook URL
- [ ] Test payment flow with real payment methods
- [ ] Enable fraud detection in Midtrans Dashboard
- [ ] Set up monitoring for failed transactions
- [ ] Configure email notifications for order status

## Support

For Midtrans-specific issues:
- [Midtrans Documentation](https://midtrans.com/docs)
- [Midtrans Support](https://support.midtrans.com/)

For Supabase Edge Functions:
- [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions)
