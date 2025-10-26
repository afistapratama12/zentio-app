"use client"

import { useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2, ArrowLeft, Calendar, TrendingUp } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import TransactionInputForm from '@/components/transactions/TransactionInputForm'
import TransactionList from '@/components/transactions/TransactionList'
import TransactionSummary from '@/components/transactions/TransactionSummary'
import { useAuth } from '@/hooks/use-auth'
import { useBudgetSession } from '@/hooks/use-budget-session'
import {
  useTransactionsBySession,
  useAddTransaction,
  useBulkAddTransactions,
  useUpdateTransaction,
  useDeleteTransaction,
  useTransactionSummary,
} from '@/hooks/use-budget-transactions'
import { toast } from 'sonner'
import Link from 'next/link'

export default function TransactionTrackingPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string

  const { user, isLoading: authLoading } = useAuth()
  const { data: session, isLoading: sessionLoading } = useBudgetSession(sessionId || null)
  const { data: transactions = [], isLoading: transactionsLoading } = useTransactionsBySession(sessionId, !!sessionId)
  const { data: summary } = useTransactionSummary(sessionId, !!sessionId)

  const addTransactionMutation = useAddTransaction()
  const bulkAddMutation = useBulkAddTransactions()
  const updateTransactionMutation = useUpdateTransaction()
  const deleteTransactionMutation = useDeleteTransaction()

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
    }
  }, [authLoading, user, router])

  // Check session validity
  useEffect(() => {
    if (!sessionLoading && !session) {
      toast.error('Budget session not found')
      router.push('/app')
    }
  }, [sessionLoading, session, router])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleAddTransaction = async (transaction: any) => {
    if (!user || !sessionId) return

    await addTransactionMutation.mutateAsync({
      userId: user.id,
      sessionId,
      transaction,
    })
  }

  const handleBulkUpload = async (transactions: any[]) => {
    if (!user || !sessionId) return

    await bulkAddMutation.mutateAsync({
      userId: user.id,
      sessionId,
      transactions,
    })
  }

  const handleUpdateTransaction = async (id: string, updates: any) => {
    await updateTransactionMutation.mutateAsync({
      transactionId: id,
      sessionId,
      updates,
    })
  }

  const handleDeleteTransaction = async (id: string) => {
    await deleteTransactionMutation.mutateAsync({
      transactionId: id,
      sessionId,
    })
  }

  if (authLoading || sessionLoading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      </AppLayout>
    )
  }

  if (!session) {
    return null
  }

  const budgetData = session.ai_generated_budget?.budget || []
  const categories = budgetData.map(b => b.category)
  const totalBudget = budgetData.reduce((sum, b) => sum + b.amount, 0)

  return (
    <AppLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center gap-4">
            <Link href="/app">
              <Button variant="outline" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </Link>
          </div>

          {/* Session Info Card */}
          <Card className="border-l-4 border-l-emerald-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Transaction Tracking</CardTitle>
                  <CardDescription className="mt-2">
                    Track your daily income and expenses for this budget period
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {session.budget_type === '1-month' && '1 Month'}
                    {session.budget_type === '1-year' && '1 Year'}
                    {session.budget_type === 'custom' && 'Custom'}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-emerald-100 text-emerald-700 border-emerald-300"
                  >
                    {session.status === 'draft' && '📝 Draft'}
                    {session.status === 'saved' && '✅ Active'}
                    {session.status === 'exported' && '📤 Exported'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    {session.start_date && session.end_date && (
                      `${formatDate(session.start_date)} - ${formatDate(session.end_date)}`
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Budget: <span className="font-semibold text-emerald-600">{formatCurrency(totalBudget)}</span>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-gray-600">
                    Transactions: <span className="font-semibold">{transactions.length}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content */}
          <Tabs defaultValue="input" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="input">📝 Input</TabsTrigger>
              <TabsTrigger value="list">📋 List ({transactions.length})</TabsTrigger>
              <TabsTrigger value="summary">📊 Summary</TabsTrigger>
            </TabsList>

            {/* Tab: Input */}
            <TabsContent value="input" className="space-y-6">
              <TransactionInputForm
                categories={categories}
                onAdd={handleAddTransaction}
                onBulkAdd={handleBulkUpload}
                isSubmitting={addTransactionMutation.isPending || bulkAddMutation.isPending}
              />
            </TabsContent>

            {/* Tab: List */}
            <TabsContent value="list" className="space-y-6">
              <TransactionList
                transactions={transactions}
                onUpdate={handleUpdateTransaction}
                onDelete={handleDeleteTransaction}
                isLoading={updateTransactionMutation.isPending || deleteTransactionMutation.isPending}
              />
            </TabsContent>

            {/* Tab: Summary */}
            <TabsContent value="summary" className="space-y-6">
              {transactions.length > 0 && summary ? (
                <TransactionSummary
                  summary={summary}
                  budgetPlan={budgetData}
                />
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <p className="text-sm">No transactions yet</p>
                      <p className="text-xs mt-1">Add transactions to see summary</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Quick Actions */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="font-medium text-blue-900">Ready to analyze your budget?</p>
                  <p className="text-sm text-blue-700 mt-1">
                    View realization and get AI-powered insights
                  </p>
                </div>
                <Link href={`/app/realize-budget/${sessionId}`}>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Go to Finishing
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}
