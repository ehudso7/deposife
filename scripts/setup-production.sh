#!/bin/bash

# Deposife - Production Setup Script
# This script sets up all production services

set -e

echo "🛡️  Deposife - Production Setup"
echo "==========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if required tools are installed
check_requirements() {
    echo "Checking requirements..."

    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi

    if ! command -v pnpm &> /dev/null; then
        print_warning "pnpm is not installed. Installing..."
        npm install -g pnpm
    fi

    if ! command -v git &> /dev/null; then
        print_error "Git is not installed"
        exit 1
    fi

    print_status "All requirements met"
}

# Setup Supabase
setup_supabase() {
    echo ""
    echo "Setting up Supabase..."
    echo "1. Go to https://supabase.com"
    echo "2. Create a new project"
    echo "3. Copy the following values:"
    echo "   - Project URL"
    echo "   - Anon Key"
    echo "   - Service Role Key"
    echo "   - Database URL"
    read -p "Press enter when you have these values..."

    read -p "Enter Supabase Project URL: " SUPABASE_URL
    read -p "Enter Supabase Anon Key: " SUPABASE_ANON_KEY
    read -p "Enter Supabase Service Role Key: " SUPABASE_SERVICE_KEY
    read -p "Enter Database URL: " DATABASE_URL

    print_status "Supabase configured"
}

# Setup Vercel
setup_vercel() {
    echo ""
    echo "Setting up Vercel..."

    if ! command -v vercel &> /dev/null; then
        print_warning "Installing Vercel CLI..."
        npm install -g vercel
    fi

    echo "Running Vercel setup..."
    vercel --confirm

    print_status "Vercel configured"
}

# Setup Railway
setup_railway() {
    echo ""
    echo "Setting up Railway..."

    if ! command -v railway &> /dev/null; then
        print_warning "Installing Railway CLI..."
        npm install -g @railway/cli
    fi

    echo "1. Go to https://railway.app"
    echo "2. Create a new project"
    echo "3. Get your API token from Account Settings"
    read -p "Enter Railway API Token: " RAILWAY_TOKEN

    railway login --token $RAILWAY_TOKEN
    railway link

    print_status "Railway configured"
}

# Setup Upstash Redis
setup_redis() {
    echo ""
    echo "Setting up Upstash Redis..."
    echo "1. Go to https://upstash.com"
    echo "2. Create a new Redis database"
    echo "3. Copy the Redis URL"
    read -p "Enter Upstash Redis URL: " REDIS_URL

    print_status "Redis configured"
}

# Setup Resend
setup_resend() {
    echo ""
    echo "Setting up Resend..."
    echo "1. Go to https://resend.com"
    echo "2. Create an account and verify your domain"
    echo "3. Get your API key"
    read -p "Enter Resend API Key: " RESEND_API_KEY

    print_status "Resend configured"
}

# Setup Stripe
setup_stripe() {
    echo ""
    echo "Setting up Stripe..."
    echo "1. Go to https://stripe.com"
    echo "2. Get your API keys from the Dashboard"
    read -p "Enter Stripe Publishable Key: " STRIPE_PK
    read -p "Enter Stripe Secret Key: " STRIPE_SK

    print_status "Stripe configured"
}

# Setup Sentry
setup_sentry() {
    echo ""
    echo "Setting up Sentry..."
    echo "1. Go to https://sentry.io"
    echo "2. Create a new project"
    echo "3. Get your DSN"
    read -p "Enter Sentry DSN: " SENTRY_DSN

    print_status "Sentry configured"
}

# Generate secrets
generate_secrets() {
    echo ""
    echo "Generating secure secrets..."

    JWT_SECRET=$(openssl rand -base64 32)
    JWT_REFRESH_SECRET=$(openssl rand -base64 32)
    NEXTAUTH_SECRET=$(openssl rand -base64 32)

    print_status "Secrets generated"
}

# Create production env file
create_env_file() {
    echo ""
    echo "Creating production environment file..."

    cat > .env.production.local << EOF
# Database
DATABASE_URL="${DATABASE_URL}"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="${SUPABASE_URL}"
NEXT_PUBLIC_SUPABASE_ANON_KEY="${SUPABASE_ANON_KEY}"
SUPABASE_SERVICE_ROLE_KEY="${SUPABASE_SERVICE_KEY}"

# Authentication
JWT_SECRET="${JWT_SECRET}"
JWT_REFRESH_SECRET="${JWT_REFRESH_SECRET}"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

# Redis
REDIS_URL="${REDIS_URL}"

# Email
RESEND_API_KEY="${RESEND_API_KEY}"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="${STRIPE_PK}"
STRIPE_SECRET_KEY="${STRIPE_SK}"

# Monitoring
SENTRY_DSN="${SENTRY_DSN}"
NEXT_PUBLIC_SENTRY_DSN="${SENTRY_DSN}"

# Railway
RAILWAY_TOKEN="${RAILWAY_TOKEN}"
EOF

    print_status "Environment file created"
}

# Run database migrations
run_migrations() {
    echo ""
    echo "Running database migrations..."

    export DATABASE_URL="${DATABASE_URL}"
    cd apps/api
    npx prisma migrate deploy
    npx prisma db seed
    cd ../..

    print_status "Database migrations complete"
}

# Deploy services
deploy_services() {
    echo ""
    echo "Deploying services..."

    # Deploy to Vercel
    echo "Deploying frontend to Vercel..."
    vercel --prod

    # Deploy to Railway
    echo "Deploying API to Railway..."
    railway up

    print_status "All services deployed"
}

# Main execution
main() {
    check_requirements

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
    read -p "Continue? (y/n) " -n 1 -r
    echo ""

    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Setup cancelled"
        exit 1
    fi

    setup_supabase
    setup_vercel
    setup_railway
    setup_redis
    setup_resend
    setup_stripe
    setup_sentry
    generate_secrets
    create_env_file
    run_migrations
    deploy_services

    echo ""
    echo "======================================="
    print_status "Production setup complete!"
    echo ""
    echo "Your application is now deployed to:"
    echo "  Frontend: https://deposife.vercel.app"
    echo "  API: Check Railway dashboard for URL"
    echo ""
    echo "Next steps:"
    echo "1. Configure custom domain in Vercel"
    echo "2. Set environment variables in Vercel dashboard"
    echo "3. Set environment variables in Railway dashboard"
    echo "4. Configure webhook endpoints in Stripe"
    echo "5. Test the production deployment"
}

# Run main function
main