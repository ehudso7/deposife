import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Lock,
  FileCheck,
  Users,
  TrendingUp,
  CheckCircle,
  ArrowRight,
  Star,
  Award,
  Globe
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-background py-20 lg:py-32">
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center">
            <Badge className="mb-4" variant="secondary">
              <Shield className="mr-1 h-3 w-3" />
              Trusted by 10,000+ Landlords & Tenants
            </Badge>
            <h1 className="mb-6 text-5xl font-bold tracking-tight lg:text-6xl">
              Secure Your Rental Deposits with{' '}
              <span className="text-primary">Complete Protection</span>
            </h1>
            <p className="mb-8 text-xl text-muted-foreground">
              Advanced deposit protection platform ensuring compliance, transparency,
              and fair dispute resolution for landlords and tenants.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link href="/register">
                  Get Started Free
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/demo">
                  View Demo
                </Link>
              </Button>
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>State Law Compliant</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>Bank-Grade Security</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span>24/7 Support</span>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute inset-0 bg-grid-slate-900/[0.03] dark:bg-grid-slate-100/[0.03] bg-[size:60px_60px]" />
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="mb-4 text-3xl font-bold tracking-tight lg:text-4xl">
              Everything You Need for Deposit Management
            </h2>
            <p className="text-lg text-muted-foreground">
              Comprehensive features designed to protect both landlords and tenants
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Lock className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Secure Protection</CardTitle>
                <CardDescription>
                  Deposits are protected in government-approved schemes with bank-grade encryption
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>TDS, DPS & MyDeposits integration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Automatic protection certificates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>256-bit SSL encryption</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <FileCheck className="h-10 w-10 text-primary mb-4" />
                <CardTitle>State Law Compliance</CardTitle>
                <CardDescription>
                  Automatic compliance with all 50 states&apos; deposit protection laws
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Real-time law updates</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Automated deadline reminders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Penalty protection</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Fair Dispute Resolution</CardTitle>
                <CardDescription>
                  Impartial dispute resolution with certified mediators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Evidence-based decisions</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>28-day resolution guarantee</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Transparent process tracking</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Smart Analytics</CardTitle>
                <CardDescription>
                  Comprehensive insights into your deposit portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Real-time dashboards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Financial reporting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Compliance metrics</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Award className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Document Management</CardTitle>
                <CardDescription>
                  Secure storage for all lease and deposit documentation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Digital signatures</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Automated reminders</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Cloud backup</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-colors">
              <CardHeader>
                <Globe className="h-10 w-10 text-primary mb-4" />
                <CardTitle>Multi-Property Support</CardTitle>
                <CardDescription>
                  Manage deposits across unlimited properties from one platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Bulk operations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Portfolio overview</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="mr-2 h-4 w-4 text-green-600 mt-0.5" />
                    <span>Team collaboration</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="bg-primary/5 py-20 lg:py-32">
        <div className="container">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">$2.5B+</div>
              <div className="mt-2 text-sm text-muted-foreground">Deposits Protected</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">50,000+</div>
              <div className="mt-2 text-sm text-muted-foreground">Active Properties</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">99.9%</div>
              <div className="mt-2 text-sm text-muted-foreground">Uptime Guarantee</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-primary">4.9/5</div>
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="flex justify-center gap-1 mt-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`h-4 w-4 ${i < 5 ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
                  ))}
                </div>
                Customer Rating
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32">
        <div className="container">
          <div className="rounded-2xl bg-gradient-primary p-8 text-center lg:p-16">
            <h2 className="mb-4 text-3xl font-bold text-white lg:text-4xl">
              Start Protecting Your Deposits Today
            </h2>
            <p className="mb-8 text-lg text-blue-100">
              Join thousands of landlords and tenants who trust our platform
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link href="/register">
                  Create Free Account
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-white/10 text-white hover:bg-white/20 border-white/20" asChild>
                <Link href="/contact">
                  Contact Sales
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}