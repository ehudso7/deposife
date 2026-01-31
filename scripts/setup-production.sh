#!/bin/bash

# Deposife - Production Setup Script
# This script sets up all production services with credential caching

set -e

echo "🛡️  Deposife - Production Setup"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Config directory for storing credentials
CONFIG_DIR="$HOME/.deposife"
CONFIG_FILE="$CONFIG_DIR/credentials.env"

# Create config directory if it doesn't exist
mkdir -p "$CONFIG_DIR"

# Function to show status
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Load saved credentials if they exist
load_saved_credentials() {
    if [ -f "$CONFIG_FILE" ]; then
        print_info "Loading saved credentials from ~/.deposife/credentials.env"
        source "$CONFIG_FILE"
        return 0
    fi
    return 1
}

# Save credentials for future use
save_credentials() {
    cat > "$CONFIG_FILE" << EOF
# Deposife Saved Credentials
# Generated on $(date)

# Supabase
SUPABASE_URL="${SUPABASE_URL}"
SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_KEY="${SUPABASE_SERVICE_KEY}"
DATABASE_URL="${DATABASE_URL}"

# Upstash Redis
REDIS_URL="${REDIS_URL}"

# Resend Email
RESEND_API_KEY="${RESEND_API_KEY}"
EMAIL_FROM="${EMAIL_FROM}"

# Stripe
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"

# AWS S3/Cloudflare R2
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
AWS_REGION="${AWS_REGION}"
AWS_S3_BUCKET="${AWS_S3_BUCKET}"

# Sentry
SENTRY_DSN="${SENTRY_DSN}"

# Railway
RAILWAY_TOKEN="${RAILWAY_TOKEN}"
EOF
    chmod 600 "$CONFIG_FILE"
    print_status "Credentials saved to ~/.deposife/credentials.env"
}

# Check requirements
check_requirements() {
    echo "Checking requirements..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo "❌ Node.js is not installed. Please install Node.js 20+"
        exit 1
    fi

    # Check pnpm
    if ! command -v pnpm &> /dev/null; then
        echo "❌ pnpm is not installed. Installing..."
        npm install -g pnpm
    fi

    print_status "All requirements met"
}

# Setup Supabase
setup_supabase() {
    echo ""
    echo "Setting up Supabase..."

    # Check if credentials are already saved
    if [ ! -z "$SUPABASE_URL" ] && [ ! -z "$SUPABASE_ANON_KEY" ]; then
        print_status "Using saved Supabase credentials"
        echo "  URL: $SUPABASE_URL"
        return
    fi

    read -p "Enter Supabase URL: " SUPABASE_URL
    read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Enter Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    read -p "Enter Database URL: " DATABASE_URL

    # Test connection
    if curl -s "$SUPABASE_URL/rest/v1/" -H "apikey: $SUPABASE_ANON_KEY" > /dev/null; then
        print_status "Supabase connection verified"
    else
        print_warning "Could not verify Supabase connection"
    fi
}

# Setup Vercel with proper monorepo configuration
setup_vercel() {
    echo ""
    echo "Setting up Vercel..."

    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel@latest
    fi

    # Create or update vercel.json in the web app directory
    cat > apps/web/vercel.json << EOF
{
  "buildCommand": "cd ../.. && pnpm install && pnpm build --filter=web",
  "outputDirectory": ".next",
  "installCommand": "echo 'Skipping install'",
  "framework": "nextjs"
}
EOF

    print_info "Running Vercel setup from apps/web directory..."
    cd apps/web

    # Remove old .vercel if exists
    rm -rf .vercel

    # Link to Vercel project
    vercel link --yes --project=deposife

    # Pull environment variables
    vercel env pull .env.local

    # Deploy from the web directory
    print_info "Deploying to Vercel..."
    vercel --prod --yes

    cd ../..
    print_status "Vercel configured and deployed"
}

# Setup Railway
setup_railway() {
    echo ""
    echo "Setting up Railway..."

    if [ ! -z "$RAILWAY_TOKEN" ]; then
        print_status "Using saved Railway token"
        return
    fi

    # Check if Railway CLI is installed
    if ! command -v railway &> /dev/null; then
        print_info "Please install Railway CLI first:"
        echo "  npm install -g @railway/cli"
        read -p "Press enter after installing Railway CLI..."
    fi

    read -p "Enter Railway token (or press enter to login): " RAILWAY_TOKEN

    if [ -z "$RAILWAY_TOKEN" ]; then
        railway login
    fi

    print_status "Railway configured"
}

# Setup Redis (Upstash)
setup_redis() {
    echo ""
    echo "Setting up Redis (Upstash)..."

    if [ ! -z "$REDIS_URL" ]; then
        print_status "Using saved Redis credentials"
        return
    fi

    read -p "Enter Upstash Redis URL: " REDIS_URL

    # Test connection
    if echo "PING" | nc -w 1 $(echo $REDIS_URL | sed 's/redis:\/\///' | cut -d: -f1) $(echo $REDIS_URL | sed 's/.*://' | cut -d/ -f1) 2>/dev/null | grep -q "PONG"; then
        print_status "Redis connection verified"
    else
        print_warning "Could not verify Redis connection"
    fi
}

# Setup Email (Resend)
setup_email() {
    echo ""
    echo "Setting up Email (Resend)..."

    if [ ! -z "$RESEND_API_KEY" ]; then
        print_status "Using saved Resend credentials"
        return
    fi

    read -p "Enter Resend API Key: " RESEND_API_KEY
    read -p "Enter From Email: " EMAIL_FROM

    print_status "Email configured"
}

# Setup Stripe
setup_stripe() {
    echo ""
    echo "Setting up Stripe..."

    if [ ! -z "$STRIPE_SECRET_KEY" ]; then
        print_status "Using saved Stripe credentials"
        return
    fi

    read -p "Enter Stripe Publishable Key: " STRIPE_PUBLISHABLE_KEY
    read -p "Enter Stripe Secret Key: " STRIPE_SECRET_KEY
    read -p "Enter Stripe Webhook Secret (or press enter to skip): " STRIPE_WEBHOOK_SECRET

    print_status "Stripe configured"
}

# Setup File Storage
setup_storage() {
    echo ""
    echo "Setting up File Storage (S3/R2)..."

    if [ ! -z "$AWS_ACCESS_KEY_ID" ]; then
        print_status "Using saved storage credentials"
        return
    fi

    read -p "Enter AWS/R2 Access Key ID: " AWS_ACCESS_KEY_ID
    read -p "Enter AWS/R2 Secret Access Key: " AWS_SECRET_ACCESS_KEY
    read -p "Enter AWS Region (default: us-east-1): " AWS_REGION
    AWS_REGION=${AWS_REGION:-us-east-1}
    read -p "Enter S3 Bucket Name: " AWS_S3_BUCKET

    print_status "Storage configured"
}

# Setup Monitoring
setup_monitoring() {
    echo ""
    echo "Setting up Monitoring (Sentry)..."

    if [ ! -z "$SENTRY_DSN" ]; then
        print_status "Using saved Sentry credentials"
        return
    fi

    read -p "Enter Sentry DSN (or press enter to skip): " SENTRY_DSN

    if [ ! -z "$SENTRY_DSN" ]; then
        print_status "Sentry configured"
    else
        print_info "Skipping Sentry setup"
    fi
}

# Create environment files
create_env_files() {
    echo ""
    echo "Creating environment files..."

    # Create .env.production for root
    cat > .env.production << EOF
# Production Environment Variables
NODE_ENV=production

# Database
DATABASE_URL="${DATABASE_URL}"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY}"

# Redis
REDIS_URL="${REDIS_URL}"

# Email
RESEND_API_KEY="${RESEND_API_KEY}"
EMAIL_FROM="${EMAIL_FROM}"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY}"
STRIPE_SECRET_KEY="${STRIPE_SECRET_KEY}"
STRIPE_WEBHOOK_SECRET="${STRIPE_WEBHOOK_SECRET}"

# Storage
AWS_ACCESS_KEY_ID="${AWS_ACCESS_KEY_ID}"
AWS_SECRET_ACCESS_KEY="${AWS_SECRET_ACCESS_KEY}"
AWS_REGION="${AWS_REGION}"
AWS_S3_BUCKET="${AWS_S3_BUCKET}"

# Monitoring
SENTRY_DSN="${SENTRY_DSN}"
NEXT_PUBLIC_SENTRY_DSN="${SENTRY_DSN}"
EOF

    # Copy to app directories
    cp .env.production apps/web/.env.production
    cp .env.production apps/api/.env.production

    print_status "Environment files created"
}

# Run database migrations
run_migrations() {
    echo ""
    read -p "Run database migrations? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "Running database migrations..."

        export DATABASE_URL="${DATABASE_URL}"
        cd apps/api
        npx prisma generate
        npx prisma migrate deploy
        cd ../..

        print_status "Database migrations complete"
    fi
}

# Main execution
main() {
    check_requirements

    # Try to load saved credentials
    load_saved_credentials

    echo ""
    echo "This script will set up the following services:"
    echo "  • Supabase (Database)"
    echo "  • Vercel (Frontend)"
    echo "  • Railway (Backend API)"
    echo "  • Upstash (Redis)"
    echo "  • Resend (Email)"
    echo "  • Stripe (Payments)"
    echo "  • Sentry (Monitoring)"
    echo ""

    if [ -f "$CONFIG_FILE" ]; then
        print_info "Found saved credentials. Reuse them? (y/n)"
        read -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            rm "$CONFIG_FILE"
            unset SUPABASE_URL SUPABASE_ANON_KEY DATABASE_URL REDIS_URL RESEND_API_KEY STRIPE_SECRET_KEY AWS_ACCESS_KEY_ID SENTRY_DSN RAILWAY_TOKEN
        fi
    fi

    read -p "Continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 0
    fi

    # Setup services
    setup_supabase
    setup_vercel
    setup_railway
    setup_redis
    setup_email
    setup_stripe
    setup_storage
    setup_monitoring

    # Save credentials for future use
    save_credentials

    # Create environment files
    create_env_files

    # Run migrations
    run_migrations

    echo ""
    echo "======================================="
    print_status "Production setup complete!"
    echo ""
    echo "Your application is now deployed to:"
    echo "  Frontend: https://deposife.vercel.app"
    echo "  API: Check Railway dashboard for URL"
    echo ""
    echo "Credentials saved to: ~/.deposife/credentials.env"
    echo "To update deployment, run this script again."
    echo ""
    echo "Next steps:"
    echo "1. Configure custom domain in Vercel"
    echo "2. Set up API domain in Railway"
    echo "3. Configure webhooks in Stripe"
    echo "4. Verify email domain in Resend"
    echo ""
}

# Run main function
main