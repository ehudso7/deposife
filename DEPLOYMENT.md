# 🚀 Deposife - Production Deployment Guide

## 📋 Prerequisites

Before starting, ensure you have:
- Node.js 20+ installed
- Git repository set up
- Credit card for service sign-ups (most have free tiers)

## 🏗️ Infrastructure Overview

| Service | Purpose | Cost | URL |
|---------|---------|------|-----|
| **Supabase** | PostgreSQL Database + Auth | Free tier: 500MB | [supabase.com](https://supabase.com) |
| **Vercel** | Frontend Hosting | Free tier: Unlimited | [vercel.com](https://vercel.com) |
| **Railway** | Backend API Hosting | $5/month credit | [railway.app](https://railway.app) |
| **Upstash** | Serverless Redis | Free tier: 10K requests/day | [upstash.com](https://upstash.com) |
| **Cloudflare R2** | File Storage (S3-compatible) | Free tier: 10GB | [cloudflare.com](https://cloudflare.com) |
| **Resend** | Transactional Email | Free tier: 100/day | [resend.com](https://resend.com) |
| **Stripe** | Payment Processing | 2.9% + 30¢ | [stripe.com](https://stripe.com) |
| **Sentry** | Error Monitoring | Free tier: 5K errors | [sentry.io](https://sentry.io) |

## 🔧 Step-by-Step Deployment

### Step 1: Database Setup (Supabase)

1. **Create Supabase Account**
   ```bash
   # Go to https://supabase.com and sign up
   ```

2. **Create New Project**
   - Click "New Project"
   - Project name: `deposife`
   - Database Password: Generate strong password (save it!)
   - Region: Choose closest to your users
   - Plan: Free tier

3. **Get Credentials**
   - Go to Settings → API
   - Copy:
     - `Project URL`
     - `anon` public key
     - `service_role` secret key
   - Go to Settings → Database
   - Copy connection string

4. **Run Migrations**
   ```bash
   # Set the database URL
   export DATABASE_URL="your-supabase-connection-string"

   # Run migrations
   cd apps/api
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Step 2: Frontend Deployment (Vercel)

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy Frontend**
   ```bash
   # From project root
   vercel --prod

   # Answer the prompts:
   # - Set up and deploy: Y
   # - Which scope: Your account
   # - Link to existing project: N
   # - Project name: deposife
   # - Directory: ./apps/web
   ```

4. **Configure Environment Variables**
   Go to Vercel Dashboard → Project Settings → Environment Variables

   Add these variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_API_URL=https://your-api-url
   NEXTAUTH_URL=https://your-domain.com
   NEXTAUTH_SECRET=generate-random-secret
   ```

5. **Configure Custom Domain**
   - Go to Settings → Domains
   - Add your domain: `tenantdepositshield.com`
   - Follow DNS configuration instructions

### Step 3: Backend API Deployment (Railway)

1. **Create Railway Account**
   ```bash
   # Go to https://railway.app and sign up with GitHub
   ```

2. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

3. **Create New Project**
   ```bash
   railway login
   railway init
   # Choose: Empty Project
   ```

4. **Add PostgreSQL Plugin** (Optional - if not using Supabase)
   ```bash
   railway add
   # Choose: PostgreSQL
   ```

5. **Deploy API**
   ```bash
   railway up
   ```

6. **Set Environment Variables**
   ```bash
   railway variables set NODE_ENV=production
   railway variables set DATABASE_URL="your-database-url"
   railway variables set JWT_SECRET="your-jwt-secret"
   railway variables set REDIS_URL="your-redis-url"
   # Add all other required variables
   ```

7. **Get Deployment URL**
   ```bash
   railway open
   # Copy the deployment URL from dashboard
   ```

### Step 4: Redis Setup (Upstash)

1. **Create Upstash Account**
   - Go to [upstash.com](https://upstash.com)
   - Sign up with GitHub

2. **Create Redis Database**
   - Click "Create Database"
   - Name: `deposife`
   - Region: Choose closest
   - Type: Regional (not Global)

3. **Get Connection Details**
   - Copy the `REDIS_URL` with auth

### Step 5: File Storage (Cloudflare R2)

1. **Create Cloudflare Account**
   - Go to [cloudflare.com](https://cloudflare.com)

2. **Enable R2**
   - Go to R2 in dashboard
   - Create bucket: `tenant-deposits`

3. **Create API Token**
   - Go to R2 → Manage R2 API Tokens
   - Create token with read/write permissions

4. **Configure CORS**
   ```json
   {
     "AllowedOrigins": ["https://tenantdepositshield.com"],
     "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
     "AllowedHeaders": ["*"],
     "MaxAgeSeconds": 3600
   }
   ```

### Step 6: Email Setup (Resend)

1. **Create Resend Account**
   - Go to [resend.com](https://resend.com)

2. **Verify Domain**
   - Add your domain
   - Add DNS records as instructed
   - Wait for verification

3. **Get API Key**
   - Go to API Keys
   - Create new key
   - Copy the key (starts with `re_`)

### Step 7: Payment Processing (Stripe)

1. **Create Stripe Account**
   - Go to [stripe.com](https://stripe.com)

2. **Get API Keys**
   - Dashboard → Developers → API Keys
   - Copy both publishable and secret keys

3. **Configure Webhooks**
   ```bash
   # Webhook endpoint:
   https://api.tenantdepositshield.com/api/v1/webhooks/stripe

   # Events to listen:
   - payment_intent.succeeded
   - payment_intent.failed
   - charge.succeeded
   - customer.subscription.created
   - customer.subscription.deleted
   ```

### Step 8: Monitoring (Sentry)

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io)

2. **Create Projects**
   - Create project for frontend (Next.js)
   - Create project for backend (Node.js)

3. **Get DSN**
   - Copy DSN for each project

4. **Install Sentry**
   ```bash
   # Frontend
   cd apps/web
   npx @sentry/wizard -i nextjs

   # Backend
   cd apps/api
   npm install @sentry/node @sentry/tracing
   ```

### Step 9: CI/CD Setup (GitHub Actions)

1. **Create GitHub Repository**
   ```bash
   git init
   git remote add origin https://github.com/yourusername/deposife
   git add .
   git commit -m "Initial commit"
   git push -u origin main
   ```

2. **Add GitHub Secrets**
   Go to Settings → Secrets → Actions

   Add these secrets:
   ```
   DATABASE_URL
   VERCEL_ORG_ID
   VERCEL_PROJECT_ID
   VERCEL_TOKEN
   RAILWAY_TOKEN
   SENTRY_AUTH_TOKEN
   SLACK_WEBHOOK (optional)
   ```

3. **Enable Actions**
   - Go to Actions tab
   - Enable workflows

### Step 10: DNS Configuration

1. **Configure Cloudflare DNS**
   ```
   A     @                   76.76.21.21 (Vercel IP)
   CNAME www                 cname.vercel-dns.com
   CNAME api                 your-railway-domain.up.railway.app
   MX    @                   Priority: 10, resend-mx.com
   TXT   _dmarc              v=DMARC1; p=none
   TXT   resend._domainkey   [Resend DKIM value]
   ```

2. **SSL/TLS Settings**
   - Set SSL/TLS to "Full"
   - Enable "Always Use HTTPS"
   - Enable "Automatic HTTPS Rewrites"

## 🚀 Quick Deployment Script

```bash
# Make the script executable
chmod +x scripts/setup-production.sh

# Run the setup script
./scripts/setup-production.sh
```

## ✅ Post-Deployment Checklist

- [ ] Database migrations completed
- [ ] Frontend accessible at custom domain
- [ ] API health check passing
- [ ] Email sending working
- [ ] File uploads working
- [ ] Payment processing working
- [ ] Error monitoring active
- [ ] SSL certificates active
- [ ] Environment variables set
- [ ] Webhooks configured
- [ ] CI/CD pipeline working
- [ ] Monitoring dashboards set up

## 🔍 Testing Production

1. **Test User Registration**
   ```bash
   curl -X POST https://api.tenantdepositshield.com/api/v1/auth/register \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","role":"TENANT"}'
   ```

2. **Test Health Check**
   ```bash
   curl https://api.tenantdepositshield.com/api/v1/health
   ```

3. **Test Frontend**
   - Visit https://tenantdepositshield.com
   - Check all pages load
   - Test registration/login
   - Test deposit creation flow

## 🔧 Troubleshooting

### Database Connection Issues
```bash
# Test connection
npx prisma db pull

# Reset database
npx prisma migrate reset --force
```

### Deployment Failures
```bash
# Check logs
vercel logs
railway logs

# Redeploy
vercel --prod --force
railway up --detach
```

### Environment Variables
```bash
# Verify in Vercel
vercel env pull

# Verify in Railway
railway variables
```

## 📊 Monitoring & Analytics

### Setup Dashboards

1. **Vercel Analytics**
   - Enable in project settings
   - Add Web Vitals monitoring

2. **Railway Metrics**
   - View in Railway dashboard
   - Set up alerting

3. **Sentry Dashboards**
   - Configure release tracking
   - Set up alerts for error rate

4. **Upstash Console**
   - Monitor Redis usage
   - Set up usage alerts

## 🔐 Security Best Practices

1. **Rotate Secrets Regularly**
   ```bash
   # Generate new secrets
   openssl rand -base64 32
   ```

2. **Enable 2FA**
   - GitHub
   - Vercel
   - Railway
   - Stripe
   - All service accounts

3. **Set Up RBAC**
   - Limit production access
   - Use service accounts for CI/CD

4. **Regular Backups**
   ```bash
   # Backup database
   pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql
   ```

## 📈 Scaling Considerations

When you need to scale:

1. **Database**: Upgrade Supabase plan or migrate to dedicated RDS
2. **API**: Railway auto-scales, or migrate to AWS ECS
3. **Redis**: Upgrade Upstash plan or use AWS ElastiCache
4. **Frontend**: Vercel auto-scales globally
5. **Files**: R2 auto-scales, consider CDN

## 💰 Cost Optimization

Monthly costs estimate:
- Supabase: $0-25 (Free tier → Pro)
- Vercel: $0-20 (Free → Pro)
- Railway: $5-20 (Usage based)
- Upstash: $0-10 (Free → Pay as you go)
- Cloudflare: $0-5 (R2 storage)
- Resend: $0-20 (Volume based)
- **Total**: $5-100/month

## 📞 Support

- Documentation: [docs.tenantdepositshield.com](https://docs.tenantdepositshield.com)
- Status Page: [status.tenantdepositshield.com](https://status.tenantdepositshield.com)
- Support: support@tenantdepositshield.com

---

**Last Updated**: January 2024
**Version**: 1.0.0