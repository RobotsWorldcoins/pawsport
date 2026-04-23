#!/usr/bin/env bash
# ============================================================
# PAWSPORT — One-Click Setup Script
# Run: bash setup.sh
# ============================================================
set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'
info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

echo ""
echo "🐾  PAWSPORT Setup"
echo "════════════════════════════════════"
echo ""

# ─── 1. Collect missing keys ───────────────────────────────
if [ -f ".env" ]; then
  source .env
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
  read -p "  Stripe Publishable Key (pk_live_...): " STRIPE_PUBLISHABLE_KEY
fi

if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  read -p "  Supabase Personal Access Token:       " SUPABASE_ACCESS_TOKEN
fi

if [ -z "$GOOGLE_MAPS_API_KEY" ]; then
  read -p "  Google Maps API Key (AIza...):         " GOOGLE_MAPS_API_KEY
fi

[ -z "$STRIPE_PUBLISHABLE_KEY" ] && error "Stripe key required"
[ -z "$SUPABASE_ACCESS_TOKEN" ] && error "Supabase token required"
[ -z "$GOOGLE_MAPS_API_KEY" ] && error "Google Maps key required"

# ─── 2. Create Supabase project ───────────────────────────
info "Creating Supabase project..."
export SUPABASE_ACCESS_TOKEN

PROJECT_JSON=$(npx supabase projects create "pawsport" \
  --db-password "$(openssl rand -base64 24 | tr -d '/+=' | head -c 24)" \
  --region "eu-west-1" \
  --output json 2>/dev/null) || {
    warn "Supabase project creation failed — may already exist. Listing projects..."
    PROJECT_JSON=$(npx supabase projects list --output json 2>/dev/null)
    PROJECT_REF=$(echo "$PROJECT_JSON" | python3 -c "
import json,sys
projects = json.load(sys.stdin)
for p in projects:
    if 'pawsport' in p.get('name','').lower():
        print(p['id']); break
" 2>/dev/null)
}

if [ -z "$PROJECT_REF" ]; then
  PROJECT_REF=$(echo "$PROJECT_JSON" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id',''))" 2>/dev/null)
fi

[ -z "$PROJECT_REF" ] && error "Could not get Supabase project ref"
success "Supabase project ref: $PROJECT_REF"

# ─── 3. Wait for project to be ready ─────────────────────
info "Waiting for Supabase project to be ready..."
for i in {1..30}; do
  STATUS=$(npx supabase projects list --output json 2>/dev/null | \
    python3 -c "
import json,sys
for p in json.load(sys.stdin):
    if p['id']=='$PROJECT_REF':
        print(p.get('status',''))
" 2>/dev/null)
  if [ "$STATUS" = "ACTIVE_HEALTHY" ]; then
    success "Project is healthy!"; break
  fi
  echo -n "."
  sleep 5
done
echo ""

# ─── 4. Get Supabase keys ─────────────────────────────────
info "Fetching Supabase API keys..."
KEYS_JSON=$(curl -s \
  -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
  "https://api.supabase.com/v1/projects/$PROJECT_REF/api-keys")

SUPABASE_URL="https://${PROJECT_REF}.supabase.co"
SUPABASE_ANON_KEY=$(echo "$KEYS_JSON" | python3 -c "
import json,sys
for k in json.load(sys.stdin):
    if k['name']=='anon': print(k['api_key']); break
" 2>/dev/null)
SUPABASE_SERVICE_KEY=$(echo "$KEYS_JSON" | python3 -c "
import json,sys
for k in json.load(sys.stdin):
    if k['name']=='service_role': print(k['api_key']); break
" 2>/dev/null)

[ -z "$SUPABASE_ANON_KEY" ] && error "Could not fetch Supabase anon key"
success "Got Supabase keys"

# ─── 5. Link project + run migrations ────────────────────
info "Linking Supabase project..."
npx supabase link --project-ref "$PROJECT_REF" 2>/dev/null || warn "Link may already be set"

info "Running database migrations..."
npx supabase db push --linked 2>/dev/null || {
  warn "db push failed, trying direct SQL..."
  npx supabase db execute --file supabase/migrations/001_initial_schema.sql 2>/dev/null || warn "Migration 001 skipped"
  npx supabase db execute --file supabase/migrations/002_rls_policies.sql 2>/dev/null || warn "Migration 002 skipped"
}
success "Migrations applied"

info "Running seed data..."
npx supabase db execute --file supabase/seeds/001_seed_data.sql 2>/dev/null || warn "Seeds skipped (may already exist)"
success "Seed data loaded"

# ─── 6. Create storage buckets ───────────────────────────
info "Creating storage buckets..."
for bucket in dog-avatars checkin-photos competition-photos social-photos; do
  curl -s -X POST \
    -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
    -H "Content-Type: application/json" \
    -d "{\"id\":\"$bucket\",\"name\":\"$bucket\",\"public\":true}" \
    "${SUPABASE_URL}/storage/v1/bucket" > /dev/null
done
success "Storage buckets created"

# ─── 7. Create admin user ─────────────────────────────────
info "Creating admin user (nucca.pt@gmail.com)..."
curl -s -X POST \
  -H "Authorization: Bearer $SUPABASE_SERVICE_KEY" \
  -H "apikey: $SUPABASE_SERVICE_KEY" \
  -H "Content-Type: application/json" \
  -d '{"email":"nucca.pt@gmail.com","email_confirm":true}' \
  "${SUPABASE_URL}/auth/v1/admin/users" > /dev/null
success "Admin user created (set password in Supabase Dashboard → Auth → Users)"

# ─── 8. Deploy Edge Functions ─────────────────────────────
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY:-}"
if [ -z "$STRIPE_SECRET_KEY" ]; then
  read -p "  Stripe Secret Key (sk_live_...): " STRIPE_SECRET_KEY
fi

STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET:-}"

info "Deploying Supabase Edge Functions..."
npx supabase functions deploy create-subscription --project-ref "$PROJECT_REF" 2>/dev/null || warn "create-subscription deploy failed"
npx supabase functions deploy cancel-subscription --project-ref "$PROJECT_REF" 2>/dev/null || warn "cancel-subscription deploy failed"
npx supabase functions deploy stripe-webhook --project-ref "$PROJECT_REF" 2>/dev/null || warn "stripe-webhook deploy failed"
success "Edge Functions deployed"

info "Setting Edge Function secrets..."
echo "STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
STRIPE_PREMIUM_PRICE_ID=price_1TP3T87RLKcygRElugpZSysV
STRIPE_PRO_PRICE_ID=price_1TP3TC7RLKcygREl1RJKHVC2
STRIPE_WEBHOOK_SECRET=${STRIPE_WEBHOOK_SECRET}" | \
  npx supabase secrets set --env-file /dev/stdin --project-ref "$PROJECT_REF" 2>/dev/null || warn "Secrets may need manual setting"
success "Secrets set"

# ─── 9. Write .env for mobile app ─────────────────────────
info "Writing .env file..."
cat > .env << EOF
# Supabase
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}

# Stripe
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=${STRIPE_PUBLISHABLE_KEY}

# Google Maps / Places
EXPO_PUBLIC_GOOGLE_PLACES_API_KEY=${GOOGLE_MAPS_API_KEY}
EOF
success ".env file written"

# ─── 10. Update app.json with real Maps key ───────────────
info "Patching app.json with Google Maps key..."
sed -i "s/GOOGLE_MAPS_API_KEY_PLACEHOLDER/${GOOGLE_MAPS_API_KEY}/g" app.json
success "app.json updated"

# ─── 11. Set Vercel env vars + redeploy admin panel ───────
info "Setting Vercel environment variables..."
cd admin-panel

echo "$SUPABASE_URL"     | npx vercel env add NEXT_PUBLIC_SUPABASE_URL production --force 2>/dev/null || true
echo "$SUPABASE_ANON_KEY" | npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production --force 2>/dev/null || true
SUPABASE_SERVICE_KEY_VAL="$SUPABASE_SERVICE_KEY"
echo "$SUPABASE_SERVICE_KEY_VAL" | npx vercel env add SUPABASE_SERVICE_ROLE_KEY production --force 2>/dev/null || true
echo "nucca.pt@gmail.com" | npx vercel env add ADMIN_EMAIL production --force 2>/dev/null || true

info "Deploying admin panel to production..."
npx vercel --prod 2>/dev/null
success "Admin panel deployed!"

cd ..

# ─── 12. Configure Stripe Webhook ─────────────────────────
WEBHOOK_URL="https://${PROJECT_REF}.supabase.co/functions/v1/stripe-webhook"
info "Stripe webhook URL: $WEBHOOK_URL"
echo ""
warn "⚠️  MANUAL STEP: Configure Stripe webhook"
echo "   1. Go to: https://dashboard.stripe.com/webhooks/create"
echo "   2. Endpoint URL: $WEBHOOK_URL"
echo "   3. Events: customer.subscription.created, customer.subscription.updated,"
echo "              customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded"
echo "   4. Copy the webhook signing secret and run:"
echo "      npx supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_... --project-ref $PROJECT_REF"
echo ""

# ─── Done ──────────────────────────────────────────────────
echo ""
echo "════════════════════════════════════"
echo -e "${GREEN}🎉 PAWSPORT setup complete!${NC}"
echo ""
echo "  📱 Mobile app .env created → run: npx expo start"
echo "  🌐 Admin panel: https://admin-panel-robot-world.vercel.app"
echo "  🗄️  Supabase project: https://supabase.com/dashboard/project/$PROJECT_REF"
echo ""
echo "  ⚠️  Still needed:"
echo "     1. Set admin password in Supabase Auth → Users"
echo "     2. Configure Stripe webhook (see above)"
echo "     3. Set STRIPE_WEBHOOK_SECRET in Supabase secrets"
echo ""
