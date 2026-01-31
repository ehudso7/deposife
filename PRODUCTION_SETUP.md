# Deposife Production Configuration Guide

## ✅ Completed Setup
- [x] Environment variables configured in all .env files
- [x] Database migrations completed
- [x] Frontend deployed to Vercel (https://deposife.vercel.app)
- [x] Backend API deployed to Railway
- [x] Sentry error monitoring configured

## 📋 Remaining Configuration Steps

### 1. Update Prisma to Latest Version
Run these commands in the API directory:
```bash
cd /Users/evertonhudson/Projects/deposife/apps/api
pnpm add -D prisma@latest
pnpm add @prisma/client@latest
pnpm run db:generate
```

### 2. Configure Custom Domain in Vercel

1. **Log into Vercel Dashboard**
   - Go to https://vercel.com/dashboard
   - Select your `deposife` project

2. **Add Custom Domain**
   - Navigate to Settings → Domains
   - Add `deposife.com` and `www.deposife.com`
   - Vercel will provide DNS records

3. **Configure DNS at Your Domain Registrar**
   - Add the following records:
   ```
   Type: A     Name: @      Value: 76.76.21.21
   Type: CNAME Name: www    Value: cname.vercel-dns.com
   ```

4. **Verify Domain**
   - Wait for DNS propagation (5-30 minutes)
   - Vercel will automatically provision SSL certificates

### 3. Set Up API Domain in Railway

1. **Access Railway Dashboard**
   - Go to https://railway.app/dashboard
   - Select your `deposife-api` service

2. **Configure Custom Domain**
   - Navigate to Settings → Networking
   - Add custom domain: `api.deposife.com`
   - Railway will provide a CNAME target

3. **Add DNS Record**
   - At your domain registrar, add:
   ```
   Type: CNAME
   Name: api
   Value: [Railway-provided-target].up.railway.app
   ```

4. **Enable HTTPS**
   - Railway automatically provisions SSL certificates
   - Update your frontend API_URL to: `https://api.deposife.com`

### 4. Configure Stripe Webhooks

1. **Access Stripe Dashboard**
   - Go to https://dashboard.stripe.com/webhooks
   - Click "Add endpoint"

2. **Configure Endpoint**
   - **Endpoint URL**: `https://api.deposife.com/api/webhooks/stripe`
   - **Description**: Deposife Production Webhooks
   - **API Version**: Select latest stable version

3. **Select Events to Listen For**
   Essential events for deposit protection:
   ```
   ✓ checkout.session.completed
   ✓ checkout.session.expired
   ✓ payment_intent.succeeded
   ✓ payment_intent.payment_failed
   ✓ payment_intent.canceled
   ✓ charge.succeeded
   ✓ charge.failed
   ✓ charge.refunded
   ✓ charge.dispute.created
   ✓ charge.dispute.updated
   ✓ charge.dispute.closed
   ✓ customer.created
   ✓ customer.updated
   ✓ customer.deleted
   ✓ customer.subscription.created
   ✓ customer.subscription.updated
   ✓ customer.subscription.deleted
   ✓ invoice.payment_succeeded
   ✓ invoice.payment_failed
   ✓ payout.created
   ✓ payout.paid
   ✓ payout.failed
   ```

4. **Get Webhook Secret**
   - Copy the webhook signing secret (starts with `whsec_`)
   - Update `STRIPE_WEBHOOK_SECRET` in your .env files

5. **Test Webhook**
   - Use Stripe CLI or dashboard test feature
   - Verify endpoint responds with 200 status

### 5. Verify Email Domain in Resend

1. **Access Resend Dashboard**
   - Go to https://resend.com/domains
   - Click "Add Domain"

2. **Add Your Domain**
   - Enter: `deposife.com`
   - Select region: US East (N. Virginia)

3. **Add DNS Records**
   Resend will provide records like:
   ```
   MX Records:
   Type: MX    Name: send    Priority: 10    Value: feedback-smtp.us-east-1.amazonses.com

   TXT Records:
   Type: TXT   Name: resend._domainkey    Value: [DKIM key provided]
   Type: TXT   Name: @                     Value: resend-verification=[code]

   CNAME Records:
   Type: CNAME Name: resend._domainkey    Value: [DKIM CNAME provided]
   ```

4. **Verify Domain**
   - Click "Verify DNS Records" in Resend
   - Wait for propagation (5-60 minutes)
   - Status will change to "Verified"

5. **Configure Email From Address**
   - Update `EMAIL_FROM` in .env to: `support@deposife.com`
   - Test sending with Resend API

## 🔒 Security Checklist

Before going live, ensure:

- [ ] Replace placeholder JWT secrets with secure random strings
- [ ] Generate new NEXTAUTH_SECRET: `openssl rand -base64 32`
- [ ] Enable rate limiting on all API endpoints
- [ ] Configure CORS to only allow your domains
- [ ] Set up monitoring alerts in Sentry
- [ ] Enable 2FA on all service accounts
- [ ] Review and restrict database permissions
- [ ] Set up regular database backups
- [ ] Configure firewall rules in Railway
- [ ] Implement API key rotation schedule

## 📊 Monitoring Setup

### Sentry Configuration
1. Visit: https://sentry.io/organizations/nsai-emagine-qu/projects/deposife/
2. Get real DSN from: Settings → Client Keys
3. Update `SENTRY_DSN` in .env.local
4. Configure alert rules for production errors

### Uptime Monitoring
Consider adding:
- BetterUptime or UptimeRobot for endpoint monitoring
- Set up alerts for:
  - API response time > 500ms
  - Error rate > 1%
  - SSL certificate expiration

## 🚀 Deployment Commands

### Deploy Frontend Updates
```bash
cd /Users/evertonhudson/Projects/deposife
vercel --prod
```

### Deploy API Updates
```bash
cd /Users/evertonhudson/Projects/deposife
railway up
```

### Run Database Migrations
```bash
cd /Users/evertonhudson/Projects/deposife/apps/api
pnpm run db:migrate:deploy
```

## 📝 Post-Launch Tasks

1. **Legal Compliance**
   - Review terms of service
   - Update privacy policy
   - Ensure GDPR/CCPA compliance
   - Add cookie consent banner

2. **Performance Optimization**
   - Enable CDN for static assets
   - Configure image optimization
   - Set up Redis caching
   - Implement database indexes

3. **Analytics Setup**
   - Google Analytics 4
   - Hotjar or FullStory for user sessions
   - Custom event tracking

## 🆘 Support Contacts

- **Vercel Support**: https://vercel.com/support
- **Railway Support**: https://railway.app/support
- **Stripe Support**: https://support.stripe.com
- **Resend Support**: https://resend.com/support
- **Supabase Support**: https://supabase.com/support

## 📅 Regular Maintenance

Weekly:
- Review Sentry errors
- Check API performance metrics
- Monitor database size and performance

Monthly:
- Update dependencies
- Review security alerts
- Audit user permissions
- Check SSL certificate expiration

Quarterly:
- Security audit
- Performance optimization review
- Disaster recovery test
- Documentation update