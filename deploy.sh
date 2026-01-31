#!/bin/bash

# Deposife - One-Click Deploy Script
# This script deploys the entire application to production

set -e

echo "🚀 Deposife - Production Deployment"
echo "==============================================="
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to show progress
show_progress() {
    echo -e "${BLUE}▶${NC} $1"
}

# Function to show success
show_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Function to show warning
show_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Check if .env.production exists
if [ ! -f ".env.production.local" ]; then
    show_warning "Production environment file not found!"
    echo "Please run: ./scripts/setup-production.sh first"
    exit 1
fi

# Load environment variables
export $(cat .env.production.local | grep -v '^#' | xargs)

# Install dependencies
show_progress "Installing dependencies..."
pnpm install --frozen-lockfile
show_success "Dependencies installed"

# Build packages
show_progress "Building packages..."
pnpm build --filter=@deposife/shared
pnpm build --filter=@deposife/state-laws
show_success "Packages built"

# Run database migrations
show_progress "Running database migrations..."
cd apps/api
npx prisma migrate deploy
cd ../..
show_success "Database migrations complete"

# Deploy Frontend to Vercel
show_progress "Deploying frontend to Vercel..."
if command -v vercel &> /dev/null; then
    vercel --prod --yes
    FRONTEND_URL=$(vercel ls --json | jq -r '.[0].url')
    show_success "Frontend deployed to: https://$FRONTEND_URL"
else
    show_warning "Vercel CLI not installed. Skipping frontend deployment."
    echo "Install with: npm install -g vercel"
fi

# Deploy Backend to Railway
show_progress "Deploying backend API to Railway..."
if command -v railway &> /dev/null; then
    railway up --detach
    show_success "Backend API deployed to Railway"
    echo "Check Railway dashboard for deployment URL"
else
    show_warning "Railway CLI not installed. Skipping backend deployment."
    echo "Install with: npm install -g @railway/cli"
fi

# Deploy Mobile App (if needed)
if [ "$1" == "--with-mobile" ]; then
    show_progress "Building mobile app..."
    cd apps/mobile

    # Build for iOS
    if [ "$(uname)" == "Darwin" ]; then
        eas build --platform ios --profile production --non-interactive
        show_success "iOS build submitted to EAS"
    fi

    # Build for Android
    eas build --platform android --profile production --non-interactive
    show_success "Android build submitted to EAS"

    cd ../..
fi

# Setup monitoring
show_progress "Setting up monitoring..."
if [ ! -z "$SENTRY_DSN" ]; then
    show_success "Sentry monitoring configured"
else
    show_warning "Sentry DSN not configured"
fi

# Run smoke tests
show_progress "Running smoke tests..."

# Test API health
if curl -f -s "https://api.deposife.com/api/v1/health" > /dev/null; then
    show_success "API health check passed"
else
    show_warning "API health check failed - may still be deploying"
fi

# Test frontend
if curl -f -s "https://deposife.com" > /dev/null; then
    show_success "Frontend is accessible"
else
    show_warning "Frontend not accessible yet - may still be deploying"
fi

echo ""
echo "================================================"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo ""
echo "Your application is deployed to:"
echo "  Frontend: https://deposife.com"
echo "  API: Check Railway dashboard"
echo ""
echo "Next steps:"
echo "1. Verify all services are running"
echo "2. Test user registration and login"
echo "3. Configure domain DNS if not done"
echo "4. Set up SSL certificates"
echo "5. Enable monitoring alerts"
echo ""
echo "Monitoring dashboards:"
echo "  Vercel: https://vercel.com/dashboard"
echo "  Railway: https://railway.app/dashboard"
echo "  Supabase: https://app.supabase.com"
echo "  Sentry: https://sentry.io"
echo ""
echo "For issues, check logs with:"
echo "  vercel logs"
echo "  railway logs"