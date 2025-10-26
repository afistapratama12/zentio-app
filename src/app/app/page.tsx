"use client"

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, Plus, Sparkles, Calendar, FileText, 
  Eye, Trash2, ArrowRight, BarChart3, CheckCircle2, Clock,
  Target, Activity, Edit2, ChevronDown,
  XIcon
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import AppLayout from '@/components/AppLayout'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/use-auth'
import { useDeleteBudgetSession, useBudgetSessions } from '@/hooks/use-budget-session'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useUserProfile } from '@/hooks/use-profile'

export default function AppDashboard() {
  const router = useRouter()
  const { user, isLoading: authLoading } = useAuth()
  const { data: budgetSessions = [], isLoading: sessionsLoading } = useBudgetSessions(user?.id || '')
  const deleteSessionMutation = useDeleteBudgetSession()
  
  const [showTrackDropdown, setShowTrackDropdown] = useState(false)
  const [showRealizeDropdown, setShowRealizeDropdown] = useState(false)

  const { data: userProfile, isLoading: userProfileLoading } = useUserProfile(user?.id || '')

  // using local storage to state welcome back
  // - state 'show' when user after login
  // - change state to 'hide' remove when user first login / register
  // - change state to 'hide' when user close it

  const [showQuickActions, setShowQuickActions] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }

    if (!localStorage.getItem('showQuickAction') || localStorage.getItem('showQuickAction') === 'true') {
      setShowQuickActions(true)
    }
  }, [authLoading, user, router])

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return
    
    if (window.confirm('Are you sure you want to delete this budget session?')) {
      try {
        await deleteSessionMutation.mutateAsync({ sessionId, userId: user.id })
        toast.success('Budget session deleted')
      } catch (error: any) {
        console.error('Error deleting session:', error)
        toast.error('Failed to delete session')
      }
    }
  }

  if (authLoading || sessionsLoading || userProfileLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    )
  }


  const handleHideQuickActions = () => {
    // Implement hide quick actions logic here
    setShowQuickActions(false)
    localStorage.setItem('showQuickAction', 'false')
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  // Calculate days remaining for sessions
  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate)
    const today = new Date()
    const diffTime = end.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Get workflow status icon and text
  const getWorkflowInfo = (session: any) => {
    if (session.status === 'draft') {
      return {
        icon: <Clock className="w-4 h-4" />,
        text: 'Draft - Complete your budget',
        color: 'text-orange-600 bg-orange-100',
        step: 1
      }
    }
    // For saved sessions, suggest next action
    return {
      icon: <CheckCircle2 className="w-4 h-4" />,
      text: 'Active - Track transactions',
      color: 'text-green-600 bg-green-100',
      step: 2
    }
  }

  // Stats
  const draftSessions = budgetSessions.filter(s => s.status === 'draft')
  const activeSessions = budgetSessions.filter(s => s.status === 'saved')
  const totalBudgetAmount = budgetSessions.reduce((sum, s) => {
    const budgetData = s.ai_generated_budget?.budget || []
    return sum + budgetData.reduce((total, item) => total + item.amount, 0)
  }, 0)

  // Helper to format session name
  const formatSessionName = (session: any) => {
    const budgetData = session.ai_generated_budget?.budget || []
    // @ts-expect-error - budgetData type from AI response
    const totalAmount = budgetData.reduce((sum, item) => sum + item.amount, 0)
    const type = session.budget_type === '1-month' ? '1M' : session.budget_type === '1-year' ? '1Y' : 'Custom'
    return `${type} - ${formatCurrency(totalAmount)}`
  }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* Hero Section with Quick Actions */}
          {showQuickActions && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 p-8 text-white">
            <div className="relative z-10">
              <div className='flex justify-between items-start'>
                <div>
                  <h1 className="text-4xl font-bold mb-2">Welcome, {userProfile?.name || 'user'}! 👋</h1>
                  <p className="text-emerald-100 mb-8">Manage your financial goals with AI-powered budgeting</p>
                </div>
                <XIcon onClick={handleHideQuickActions} className='hover:cursor-pointer' />
              </div>
              
              {/* Quick Action Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                {/* Create Budget */}
                <Link href="/app/create-budget">
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
                    <CardContent className="">
                      <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                          <Sparkles className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">Create Budget</h3>
                          <p className="text-sm text-emerald-100 mb-3">Start with AI-powered planning</p>
                          <div className="flex items-center text-sm font-medium">
                            Get Started <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>

                {/* Track Transactions */}
                {activeSessions.length > 0 ? (
                  <DropdownMenu open={showTrackDropdown} onOpenChange={setShowTrackDropdown}>
                    <DropdownMenuTrigger asChild>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
                        <CardContent>
                          <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                              <Activity className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">Track Daily</h3>
                              <p className="text-sm text-emerald-100 mb-3">Record income & expenses</p>
                              <div className="flex items-center text-sm font-medium">
                                Choose Budget <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 bg-white">
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-500 px-2 py-1.5">Select a budget to track:</p>
                        {activeSessions.map((session) => (
                          <DropdownMenuItem
                            key={session.id}
                            onClick={() => router.push(`/app/transactions/${session.id}`)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{formatSessionName(session)}</p>
                                {session.start_date && session.end_date && (
                                  <p className="text-xs text-gray-500">
                                    {formatDate(session.start_date)} - {formatDate(session.end_date)}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 opacity-60 cursor-not-allowed">
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-lg">
                          <Activity className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">Track Daily</h3>
                          <p className="text-sm text-emerald-100 mb-3">Record income & expenses</p>
                          <div className="flex items-center text-sm font-medium text-white/70">
                            Create a budget first
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Realize Budget */}
                {activeSessions.length > 0 ? (
                  <DropdownMenu open={showRealizeDropdown} onOpenChange={setShowRealizeDropdown}>
                    <DropdownMenuTrigger asChild>
                      <Card className="bg-white/10 backdrop-blur-sm border-white/20 hover:bg-white/20 transition-all cursor-pointer group">
                        <CardContent>
                          <div className="flex items-start gap-4">
                            <div className="bg-white/20 p-3 rounded-lg group-hover:scale-110 transition-transform">
                              <Target className="w-6 h-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-1">Analyze Results</h3>
                              <p className="text-sm text-emerald-100 mb-3">Get AI insights & reports</p>
                              <div className="flex items-center text-sm font-medium">
                                Choose Budget <ChevronDown className="w-4 h-4 ml-1 group-hover:translate-y-0.5 transition-transform" />
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-80 bg-white">
                      <div className="p-2">
                        <p className="text-xs font-medium text-gray-500 px-2 py-1.5">Select a budget to analyze:</p>
                        {activeSessions.map((session) => (
                          <DropdownMenuItem
                            key={session.id}
                            onClick={() => router.push(`/app/realize-budget/${session.id}`)}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center justify-between w-full">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{formatSessionName(session)}</p>
                                {session.start_date && session.end_date && (
                                  <p className="text-xs text-gray-500">
                                    {formatDate(session.start_date)} - {formatDate(session.end_date)}
                                  </p>
                                )}
                              </div>
                              <ArrowRight className="w-4 h-4 text-gray-400" />
                            </div>
                          </DropdownMenuItem>
                        ))}
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Card className="bg-white/10 backdrop-blur-sm border-white/20 opacity-60 cursor-not-allowed">
                    <CardContent>
                      <div className="flex items-start gap-4">
                        <div className="bg-white/20 p-3 rounded-lg">
                          <Target className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg mb-1">Analyze Results</h3>
                          <p className="text-sm text-emerald-100 mb-3">Get AI insights & reports</p>
                          <div className="flex items-center text-sm font-medium text-white/70">
                            Create a budget first
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full -ml-48 -mb-48"></div>
          </div>)}

          {/* Stats Overview */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Total Budget Value
                </CardTitle>
                <BarChart3 className="h-5 w-5 text-emerald-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-emerald-600">
                  {formatCurrency(totalBudgetAmount)}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Across {budgetSessions.length} sessions
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  Active Budgets
                </CardTitle>
                <CheckCircle2 className="h-5 w-5 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">
                  {activeSessions.length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {draftSessions.length} in draft
                </p>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-sm font-medium text-gray-600">
                  This Month
                </CardTitle>
                <Calendar className="h-5 w-5 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">
                  {budgetSessions.filter(s => {
                    if (!s.start_date) return false
                    const startDate = new Date(s.start_date)
                    const now = new Date()
                    return startDate.getMonth() === now.getMonth() && 
                           startDate.getFullYear() === now.getFullYear()
                  }).length}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Budgets started this month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Budget Sessions Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Your Budget Sessions</h2>
                <p className="text-gray-600 text-sm mt-1">Track and manage your budget planning workflow</p>
              </div>
              <Link href="/app/create-budget">
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  <Plus className="w-4 h-4 mr-2" />
                  New Budget
                </Button>
              </Link>
            </div>

            {budgetSessions.length > 0 ? (
              <div className="grid gap-4">
                {budgetSessions.map((session) => {
                  const budgetData = session.ai_generated_budget?.budget || []
                  const totalAmount = budgetData.reduce((sum, item) => sum + item.amount, 0)
                  const workflowInfo = getWorkflowInfo(session)
                  const daysLeft = session.end_date ? getDaysRemaining(session.end_date) : null

                  return (
                    <Card key={session.id} className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
                      <CardContent className="pt-6">
                        <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                          
                          {/* Left: Session Info */}
                          <div className="flex-1 space-y-3">
                            <div className="flex items-start gap-3">
                              <div className="mt-1">
                                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-300">
                                  {session.budget_type === '1-month' && '📅 1 Month'}
                                  {session.budget_type === '1-year' && '📆 1 Year'}
                                  {session.budget_type === 'custom' && '⚙️ Custom'}
                                </Badge>
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-xl font-bold text-gray-900">
                                    {formatCurrency(totalAmount)}
                                  </h3>
                                  {session.estimated_expense && (
                                    <span className="text-sm text-gray-500">
                                      / {formatCurrency(session.estimated_expense)} max
                                    </span>
                                  )}
                                </div>
                                
                                {session.start_date && session.end_date && (
                                  <div className="flex items-center gap-2 text-sm text-gray-600">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {formatDate(session.start_date)} - {formatDate(session.end_date)}
                                    </span>
                                    {daysLeft !== null && (
                                      <Badge variant="outline" className="ml-2">
                                        {daysLeft > 0 ? `${daysLeft} days left` : 'Expired'}
                                      </Badge>
                                    )}
                                  </div>
                                )}

                                <div className="flex items-center gap-2 text-sm text-gray-600 mt-2">
                                  <FileText className="w-4 h-4" />
                                  <span>{budgetData.length} categories</span>
                                </div>
                              </div>
                            </div>

                            {/* Workflow Status */}
                            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${workflowInfo.color}`}>
                              {workflowInfo.icon}
                              <span>{workflowInfo.text}</span>
                            </div>
                          </div>

                          {/* Right: Actions */}
                          <div className="flex flex-col gap-2 lg:min-w-[280px]">
                            {session.status === 'draft' ? (
                              /* Draft Actions */
                              <>
                                <Link href={`/app/create-budget?sessionId=${session.id}`} className="w-full">
                                  <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                                    <Edit2 className="w-4 h-4 mr-2" />
                                    Continue Editing
                                  </Button>
                                </Link>
                                <Button
                                  variant="outline"
                                  className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleDeleteSession(session.id)}
                                  disabled={deleteSessionMutation.isPending}
                                >
                                  {deleteSessionMutation.isPending ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-2" />
                                  )}
                                  Delete Draft
                                </Button>
                              </>
                            ) : (
                              /* Active Session Actions */
                              <div className="space-y-2">
                                {/* Primary Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                  <Link href={`/app/transactions/${session.id}`}>
                                    <Button variant="outline" size="sm" className="w-full border-blue-300 text-blue-700 hover:bg-blue-50">
                                      <Activity className="w-4 h-4 mr-1" />
                                      Track
                                    </Button>
                                  </Link>
                                  <Link href={`/app/realize-budget/${session.id}`}>
                                    <Button variant="outline" size="sm" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">
                                      <Target className="w-4 h-4 mr-1" />
                                      Analyze
                                    </Button>
                                  </Link>
                                </div>

                                {/* Secondary Actions */}
                                <div className="grid grid-cols-2 gap-2">
                                  <Link href={`/app/create-budget?sessionId=${session.id}`}>
                                    <Button variant="ghost" size="sm" className="w-full">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteSession(session.id)}
                                    disabled={deleteSessionMutation.isPending}
                                  >
                                    {deleteSessionMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            ) : (
              /* Empty State */
              <Card className="border-2 border-dashed">
                <CardContent className="py-16">
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-100 rounded-full mb-4">
                      <Sparkles className="w-8 h-8 text-emerald-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                      Start Your Financial Journey
                    </h3>
                    <p className="text-gray-600 mb-4 max-w-md mx-auto">
                      Create your first AI-powered budget and take control of your finances with intelligent insights and tracking
                    </p>
                    <Link href="/app/create-budget">
                      <Button size="lg" className="bg-gradient-to-r mb-4 from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white">
                        <Sparkles className="w-5 h-5 mr-2" />
                        Create Your First Budget
                      </Button>
                    </Link>
                    
                    {/* Quick Guide */}
                    <div className="grid md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-emerald-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                          <h4 className="font-semibold text-sm">Create Budget</h4>
                        </div>
                        <p className="text-xs text-gray-600">Let AI analyze your finances and suggest optimal budget allocation</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                          <h4 className="font-semibold text-sm">Track Daily</h4>
                        </div>
                        <p className="text-xs text-gray-600">Record transactions or upload CSV to monitor spending patterns</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-purple-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                          <h4 className="font-semibold text-sm">Get Insights</h4>
                        </div>
                        <p className="text-xs text-gray-600">Analyze results and receive AI recommendations for improvement</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
