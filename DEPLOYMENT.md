# PAWSPORT — Complete Deployment Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g expo-cli eas-cli`
- Supabase CLI: `npm install -g supabase`
- Vercel CLI: `npm install -g vercel`
- Stripe account (nucca.pt@gmail.com)
- Google Cloud account (Maps API)

---

## STEP 1: Supabase Setup

### 1.1 Create Project
1. Go to https://supabase.com → New Project
2. Name: `pawsport` | Region: `West EU (Ireland)`
3. Save the **Project URL** and **anon key** and **service role key**

### 1.2 Run Migrations
```bash
cd PAWSPORT
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push < supabase/migrations/001_initial_schema.sql
supabase db push < supabase/migrations/002_rls_policies.sql
supabase db push < supabase/seeds/001_seed_data.sql
```

### 1.3 Create Admin User
1. Supabase Dashboard → Authentication → Users → Add User
2. Email: `nucca.pt@gmail.com` | Password: (your chosen password — NEVER put in code)
3. After creation, run in Supabase SQL Editor:
```sql
UPDATE public.users 
SET is_admin = true 
WHERE email = 'nucca.pt@gmail.com';
```

### 1.4 Create Storage Buckets
In Supabase Dashboard → Storage → New Bucket:
- `dog-avatars` (public)
- `checkin-photos` (public)
- `competition-photos` (public)
- `social-photos` (public)

Set each to **Public** and add policy:
```sql
-- Allow authenticated uploads
CREATE POLICY "Authenticated can upload" ON storage.objects
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Public can read" ON storage.objects
  FOR SELECT USING (true);
```

### 1.5 Deploy Edge Functions
```bash
supabase functions deploy create-subscription --no-verify-jwt
supabase functions deploy cancel-subscription --no-verify-jwt  
supabase functions deploy stripe-webhook --no-verify-jwt

# Set secrets
supabase secrets set STRIPE_SECRET_KEY=sk_live_xxxxx
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_xxxxx
supabase secrets set STRIPE_PREMIUM_PRICE_ID=price_xxxxx
supabase secrets set STRIPE_PRO_PRICE_ID=price_xxxxx
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## STEP 2: Stripe Setup

### 2.1 Create Products & Prices
In Stripe Dashboard (nucca.pt@gmail.com):
1. Products → Add Product → "Pawsport Premium" → €9.99/month
2. Products → Add Product → "Pawsport Premium Pro" → €19.99/month
3. Copy the **Price IDs** (price_xxxx) for each

### 2.2 Set Up Webhook
1. Stripe Dashboard → Webhooks → Add Endpoint
2. URL: `https://YOUR_PROJECT.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy **Signing Secret** → use as `STRIPE_WEBHOOK_SECRET`

### 2.3 Payment Security
- Stripe handles all PCI compliance — card data never touches your servers
- Webhook signatures verified in `stripe-webhook/index.ts`
- One vote per user enforced at DB level
- RLS policies prevent unauthorized data access

---

## STEP 3: Google Maps API

1. Google Cloud Console → Create Project "Pawsport"
2. Enable APIs:
   - Maps SDK for Android
   - Maps SDK for iOS
   - Places API
3. Create API Key → restrict to your app's bundle ID
4. Note: $200/month free credit covers most usage at MVP scale

---

## STEP 4: Environment Variables

### Mobile App — create `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your-maps-key
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=your-places-key
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_xxxxx
EXPO_PUBLIC_STRIPE_PRO_PRICE_ID=price_xxxxx
```

Update `app.json` → replace `GOOGLE_MAPS_API_KEY_PLACEHOLDER` with your key.

---

## STEP 5: Deploy Admin Panel to Vercel

### 5.1 GitHub Push
```bash
cd PAWSPORT
git init
git add .
git commit -m "Initial Pawsport build"
gh repo create pawsport --private --source=. --push
```

### 5.2 Vercel Deploy
```bash
cd admin-panel
vercel login  # use nucca.pt@gmail.com
vercel --prod
```

When prompted, set these environment variables in Vercel:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_EMAIL=nucca.pt@gmail.com
```

Admin panel will be live at: `https://pawsport-admin.vercel.app`

---

## STEP 6: Build & Publish Mobile App

### 6.1 Install EAS
```bash
npm install -g eas-cli
eas login  # use your Expo account
```

### 6.2 Configure EAS (create eas.json)
```json
{
  "cli": { "version": ">= 5.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" },
      "ios": { "simulator": false }
    }
  }
}
```

### 6.3 Build
```bash
# Android (APK for testing)
eas build --profile preview --platform android

# Production builds
eas build --profile production --platform android
eas build --profile production --platform ios
```

### 6.4 Test with Expo Go (fastest)
```bash
npx expo start
# Scan QR code with Expo Go app on your phone
```

---

## STEP 7: Testing Checklist (Admin Pre-Release)

Admin must verify the following before release:

### Auth Flow
- [ ] Register new account
- [ ] Login / logout
- [ ] Dog profile creation
- [ ] Profile photo upload

### Core Features
- [ ] Home screen loads with dog card + XP
- [ ] Map shows nearby places
- [ ] Check-in awards XP
- [ ] Streak system updates
- [ ] Arena (level 20+ required — use seed dog)
- [ ] Competitions — enter + vote
- [ ] Social — post + like + comment

### Premium
- [ ] Stripe payment flow (use test card: 4242 4242 4242 4242)
- [ ] Premium features activate after payment
- [ ] Webhook received and subscription created in DB
- [ ] Cancel subscription works

### Admin Panel
- [ ] Login at /login with nucca.pt@gmail.com
- [ ] Dashboard shows correct stats
- [ ] Users list loads
- [ ] Subscriptions show revenue

---

## COST BREAKDOWN (Monthly at MVP Scale)

| Service | Cost |
|---------|------|
| Supabase Free Tier | €0 |
| Vercel Free Tier (admin) | €0 |
| Expo (development) | €0 |
| Google Maps ($200 credit) | €0 |
| Stripe | 0% + 1.4% + €0.25/transaction |
| **Total** | **~€0/month** (until scale) |

---

## PHASE 2 ROADMAP

- Spain expansion (Madrid, Barcelona, Seville)
- Push notifications (Expo Notifications)
- Real-time leaderboard (Supabase Realtime)
- PDF Dog Passport (react-native-pdf)
- Business listings with paid promotions
- Dog trainer booking system
- Event hosting for businesses

## PHASE 3 ROADMAP

- Full Europe expansion
- Multi-language (PT, ES, EN, DE, FR)
- AI breed recognition from photo
- Weather-aware place recommendations
- Dog health tracking integration
- Partnerships with vet chains
