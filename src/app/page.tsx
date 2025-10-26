'use client'

// import { createFileRoute, Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Sparkles,
  TrendingUp,
  Shield,
  Zap,
  Camera,
  Brain,
  Trophy,
  ArrowRight,
} from 'lucide-react'
import { useUser } from '@/hooks/use-auth'
import { useCallback } from 'react'
import Link from 'next/link'

export default function Home() {
  const user = useUser()

  const handleStart = useCallback(() => {
    if (user.data) {
      // Redirect to dashboard
      window.location.href = '/app'
      return
    } else {
      // Redirect to login page
      window.location.href = '/login'
    }
  }, [user.data])

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-emerald-200/50">
        <nav className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between max-w-7xl mx-auto">
            {/* Logo */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
                Zentio
              </span>
            </div>

            {/* Navigation Menu - Desktop - Centered */}
            <div className="hidden md:flex items-center gap-8 absolute left-1/2 transform -translate-x-1/2">
              <a href="#features" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group whitespace-nowrap">
                Features
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all group-hover:w-full"></span>
              </a>
              <a href="#how-it-works" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group whitespace-nowrap">
                How It Works
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all group-hover:w-full"></span>
              </a>
              <a href="#pricing" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group whitespace-nowrap">
                Pricing
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all group-hover:w-full"></span>
              </a>
              <a href="#about" className="text-gray-700 hover:text-emerald-600 font-medium transition-colors relative group whitespace-nowrap">
                About
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-emerald-600 to-teal-600 transition-all group-hover:w-full"></span>
              </a>
            </div>

            {/* CTA Buttons */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Button variant="ghost" className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50/50" onClick={handleStart}>
                Login
              </Button>
              <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md hover:shadow-lg transition-all" onClick={handleStart}>
                Sign Up Free
              </Button>
            </div>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-24">
        {/* Background gradients with animation */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
        <div className="absolute top-40 right-10 w-72 h-72 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
        {/* <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000" /> */}
        
        <div className="container mx-auto px-4 py-20 relative">
          <div className="max-w-5xl mx-auto text-center">
            {/* Enhanced Badge */}
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-5 py-2.5 rounded-full text-sm font-semibold mb-8 shadow-sm hover:shadow-md transition-shadow">
              <Sparkles className="w-4 h-4 animate-pulse" />
              AI-Powered Budgeting Assistant
            </div>
            
            {/* Main heading */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent leading-tight">
              Zentio: Smart Budgeting <br/> with AI
            </h1>
            
            {/* Description */}
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Upload receipt photos, let our AI analyze your expenses, and get personalized budget recommendations tailored to your lifestyle.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-24">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white" onClick={handleStart}>
                Get Started
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
              <Button size="lg" variant="outline">
                View Demo
              </Button>
            </div>
            
            {/* Social Proof Stats */}
            <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto pt-12 border-t-2 border-emerald-200/50 mt-12">
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  10K+
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  Active Users
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  99%
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  AI Accuracy
                </div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                  4.9★
                </div>
                <div className="text-sm md:text-base text-gray-600 font-medium">
                  User Rating
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-20 px-4 overflow-hidden">
        {/* Background gradients with animation */}
        <div className="absolute top-20 right-10 w-96 h-96 bg-teal-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob" />
        {/* <div className="absolute bottom-20 left-10 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-2000" /> */}
        
        <div className="container mx-auto relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-teal-200 text-teal-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-sm">
              <Zap className="w-4 h-4" />
              Complete & Powerful Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              Key Features
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto text-lg">
              Zentio uses cutting-edge AI technology to help you manage finances more easily and effectively
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Camera className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>Auto Receipt Scan</CardTitle>
                <CardDescription>
                  Upload receipt photos, AI will automatically recognize and record all your transactions
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>AI Conversational Onboarding</CardTitle>
                <CardDescription>
                  Chat with AI to set up your financial profile. Easy, fast, and personal!
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>AI Personal Budget</CardTitle>
                <CardDescription>
                  AI analyzes your expenses and creates a budget that fits your lifestyle and financial goals
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Secure & Private Data</CardTitle>
                <CardDescription>
                  Your financial data is stored securely with end-to-end encryption on Supabase
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-emerald-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <CardTitle>Real-time Insights</CardTitle>
                <CardDescription>
                  Real-time expense visualization with interactive charts and deep insights
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="border-teal-200 hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <Trophy className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Gamification & Rewards</CardTitle>
                <CardDescription>
                  Earn points and badges when you reach your budgeting targets. Learning finance is fun!
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="relative py-20 px-4 overflow-hidden">
        {/* Background gradients with animation */}
        {/* <div className="absolute top-1/2 left-1/4 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-blob animation-delay-4000" /> */}
        
        <div className="container mx-auto max-w-6xl relative">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-sm">
              <ArrowRight className="w-4 h-4" />
              Easy & Fast
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 bg-clip-text text-transparent">
              How It Works
            </h2>
            <p className="text-gray-600 text-lg">
              Start smart budgeting in just 3 simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                1
              </div>
              <h3 className="text-xl font-semibold mb-3">Setup Profile</h3>
              <p className="text-gray-600">
                Chat with AI to set up your financial profile. AI will ask simple questions about your lifestyle and financial goals
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-teal-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                2
              </div>
              <h3 className="text-xl font-semibold mb-3">Upload Transactions</h3>
              <p className="text-gray-600">
                Take photos of your receipts, upload to Zentio. AI Vision will automatically read and record all transactions
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4 mx-auto">
                3
              </div>
              <h3 className="text-xl font-semibold mb-3">Get AI Budget</h3>
              <p className="text-gray-600">
                AI analyzes your spending patterns and creates a realistic and achievable personal budget
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 px-4 overflow-hidden">
        {/* Background gradients with animation */}
        <div className="absolute top-10 left-20 w-96 h-96 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob" />
        <div className="absolute bottom-10 right-20 w-96 h-96 bg-teal-400 rounded-full mix-blend-multiply filter blur-xl opacity-15 animate-blob animation-delay-2000" />
        
        <div className="container mx-auto max-w-4xl relative">
          <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 border-0 text-white shadow-2xl">
            <CardContent className="p-12 text-center">
              <Sparkles className="w-12 h-12 mx-auto mb-4 animate-pulse" />
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Start Smart Budgeting?
              </h2>
              <p className="text-emerald-50 text-lg mb-8 max-w-2xl mx-auto">
                Join thousands of users who have achieved their financial goals with AI assistance
              </p>
              <Link href="/login">
                <Button
                  size="lg"
                  className="bg-white text-emerald-600 hover:bg-emerald-50 shadow-lg hover:shadow-xl transition-all"
                >
                  Sign Up Now - Free!
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300 py-12 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 to-teal-900/20" />
        <div className="container mx-auto max-w-6xl relative">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-white font-bold text-lg bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">Zentio</h3>
              </div>
              <p className="text-sm">
                AI-powered budgeting assistant untuk membantu Anda mencapai tujuan finansial
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    FAQ
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Contact
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Privacy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Terms
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-emerald-400 transition-colors">
                    Security
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-sm text-center">
            <p>© 2024 Zentio. All rights reserved. Built with ❤️ using AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
