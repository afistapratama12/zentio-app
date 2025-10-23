import { createFileRoute, useNavigate, Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Loader2, TrendingUp, Wallet, Plus, Sparkles, Calendar, FileText, Eye, Trash2 } from 'lucide-react'
import { BudgetChart } from '~/components/BudgetChart'
import RewardsPanel from '~/components/RewardsPanel'
import AppLayout from '~/components/AppLayout'
import { toast } from 'sonner'
import { useAuth } from '~/hooks/use-auth'
import { useTransactions } from '~/hooks/use-transactions'
import { useLatestBudget } from '~/hooks/use-budget'
import { useDraftSessions, useDeleteBudgetSession } from '~/hooks/use-budget-session'

export const Route = createFileRoute('/app/')({
  component: AppDashboard,
})

function AppDashboard() {
  const navigate = useNavigate()
  const { user, isLoading: authLoading } = useAuth()
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactions(user?.id)
  const { data: budget = [], isLoading: budgetLoading } = useLatestBudget(user?.id)
  const { data: budgetSessions = [], isLoading: sessionsLoading } = useDraftSessions(user?.id || '')
  const deleteSessionMutation = useDeleteBudgetSession()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate({ to: '/login' })
    }
  }, [authLoading, user, navigate])

  const handleDeleteSession = async (sessionId: string) => {
    if (!user) return
    
    // Show confirmation toast
    toast.warning('Are you sure you want to delete this budget session?', {
      action: {
        label: 'Delete',
        onClick: async () => {
          try {
            await deleteSessionMutation.mutateAsync({ sessionId, userId: user.id })
            toast.success('Budget session deleted')
          } catch (error: any) {
            console.error('Error deleting session:', error)
            toast.error('Failed to delete session')
          }
        },
      },
      cancel: {
        label: 'Cancel',
        onClick: () => {},
      },
    })
  }

  if (authLoading || transactionsLoading || budgetLoading || sessionsLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    )
  }

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalBudget = budget.reduce((sum, b) => sum + b.amount, 0)

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

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h2 className="text-3xl font-bold">Dashboard</h2>
              <p className="text-gray-600 mt-1">Manage your budgets and track your spending</p>
            </div>
            <Link to="/app/create-budget">
              <Button size="lg" className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                <Sparkles className="w-5 h-5 mr-2" />
                Create New Budget
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Spending
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalSpending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  From {transactions.length} transactions
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Current Budget
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatCurrency(totalBudget)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budget.length > 0
                    ? `${budget.length} categories`
                    : 'No budget yet'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Budget Sessions
                </CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{budgetSessions.length}</div>
                <p className="text-xs text-muted-foreground">Draft & saved budgets</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">📊 Overview</TabsTrigger>
              <TabsTrigger value="sessions">� Budget Sessions</TabsTrigger>
              <TabsTrigger value="rewards">🏆 Rewards</TabsTrigger>
            </TabsList>

            {/* Tab: Overview */}
            <TabsContent value="overview" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Current Budget Overview</CardTitle>
                  <CardDescription>
                    Your latest active budget breakdown
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {budget.length > 0 ? (
                    <BudgetChart budget={budget} />
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Budget Yet
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Create your first AI-powered budget to get started
                      </p>
                      <Link to="/app/create-budget">
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Budget
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Budget Sessions */}
            <TabsContent value="sessions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div className='space-y-2'>
                      <CardTitle>Budget Sessions</CardTitle>
                      <CardDescription>
                        View and manage your budget planning sessions
                      </CardDescription>
                    </div>
                    <Link to="/app/create-budget">
                      <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        New Session
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent>
                  {budgetSessions.length > 0 ? (
                    <div className="space-y-4">
                      {budgetSessions.map((session) => {
                        const budgetData = session.ai_generated_budget?.budget || []
                        const totalAmount = budgetData.reduce((sum, item) => sum + item.amount, 0)

                        return (
                          <Card key={session.id} className="border-l-4 border-l-emerald-500">
                            <CardContent className="">
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Badge variant="outline">
                                      {session.budget_type === '1-month' && '1 Month'}
                                      {session.budget_type === '1-year' && '1 Year'}
                                      {session.budget_type === 'custom' && 'Custom'}
                                    </Badge>
                                    <Badge
                                      variant={
                                        session.status === 'draft' 
                                          ? 'secondary' 
                                          : session.status === 'saved'
                                          ? 'default'
                                          : 'outline'
                                      }
                                      className={
                                        session.status === 'exported'
                                          ? 'bg-purple-100 text-purple-700 border-purple-300'
                                          : session.status === 'saved'
                                          ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                                          : ''
                                      }
                                    >
                                      {session.status === 'draft' && '📝 Draft'}
                                      {session.status === 'saved' && '✅ Saved'}
                                      {session.status === 'exported' && '📤 Exported'}
                                      {!session.status && 'Draft'}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    <span>
                                      {session.start_date && session.end_date && (
                                        `${formatDate(session.start_date)} - ${formatDate(session.end_date)}`
                                      )}
                                    </span>
                                  </div>
                                  <div className="text-2xl font-bold text-emerald-600 mb-2">
                                    {formatCurrency(totalAmount)}
                                  </div>
                                  {session.estimated_expense && (
                                    <p className="text-sm text-gray-600">
                                      Max expense: {formatCurrency(session.estimated_expense)}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <Link to="/app/create-budget" search={{ sessionId: session.id }}>
                                    <Button variant="outline" size="sm">
                                      <Eye className="w-4 h-4 mr-1" />
                                      View
                                    </Button>
                                  </Link>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteSession(session.id)}
                                    disabled={deleteSessionMutation.isPending}
                                    className="text-red-600 hover:text-red-700"
                                  >
                                    {deleteSessionMutation.isPending ? (
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="w-4 h-4" />
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-700 mb-2">
                        No Budget Sessions
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Create your first budget session with AI assistance
                      </p>
                      <Link to="/app/create-budget">
                        <Button className="bg-gradient-to-r from-emerald-600 to-teal-600">
                          <Plus className="w-4 h-4 mr-2" />
                          Create Budget
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab: Rewards */}
            <TabsContent value="rewards" className="space-y-6">
              {user && <RewardsPanel userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}
