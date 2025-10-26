"use client"

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Loader2, ArrowLeft, Calendar, TrendingUp, Save, Calculator, Wallet, FileText } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import RealizationAnalysis from '@/components/RealizationAnalysis'
import { useAuth } from '@/hooks/use-auth'
import { useBudgetSession } from '@/hooks/use-budget-session'
import {
  useRealizationBySession,
  useSaveRealization,
  useRealizationInsight,
  useSaveRealizationInsight,
  calculateRealizationAnalysis,
} from '@/hooks/use-realization'
import {
  useTransactionsBySession,
  // useTransactionSummary,
  calculateRealizationFromTransactions,
} from '@/hooks/use-budget-transactions'
import { analyzeRealization } from '@/lib/ai-service'
import { toast } from 'sonner'
import Link from 'next/link'

export default function RealizeBudgetPage() {
  const router = useRouter()
  const params = useParams()
  const sessionId = params?.sessionId as string

  const { user, isLoading: authLoading } = useAuth()
  const { data: session, isLoading: sessionLoading } = useBudgetSession(sessionId || null)
  const { data: existingRealization = [] } = useRealizationBySession(sessionId, !!sessionId)
  const { data: transactions = [] } = useTransactionsBySession(sessionId, !!sessionId)
  // const { data: transactionSummary } = useTransactionSummary(sessionId, !!sessionId)
  const { data: savedInsight } = useRealizationInsight(sessionId, !!sessionId)

  const saveRealizationMutation = useSaveRealization()
  const saveInsightMutation = useSaveRealizationInsight()

  // State for manual input (Tab 1)
  const [manualFormData, setManualFormData] = useState<Array<{
    category: string
    planned_amount: number
    realized_income: number
    realized_expense: number
    notes: string
  }>>([])

  // State for transaction-based input (Tab 2)
  const [transactionFormData, setTransactionFormData] = useState<Array<{
    category: string
    planned_amount: number
    realized_income: number
    realized_expense: number
    notes: string
  }>>([])

  // State for analysis
  const [currentAnalysis, setCurrentAnalysis] = useState<any>(null)
  const [aiInsight, setAiInsight] = useState<string | null>(null)
  const [isLoadingInsight, setIsLoadingInsight] = useState(false)
  const [activeTab, setActiveTab] = useState('quick-input')

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

  // Initialize form data
  useEffect(() => {
    if (!session) return

    const budgetData = session.ai_generated_budget?.budget || []

    // Initialize manual form
    if (existingRealization && existingRealization.length > 0) {
      setManualFormData(
        existingRealization.map((r) => ({
          category: r.category,
          planned_amount: r.planned_amount,
          realized_income: r.realized_income,
          realized_expense: r.realized_expense,
          notes: r.notes || '',
        }))
      )
    } else {
      setManualFormData(
        budgetData.map((b) => ({
          category: b.category,
          planned_amount: b.amount,
          realized_income: 0,
          realized_expense: 0,
          notes: '',
        }))
      )
    }

    // Initialize transaction-based form
    if (transactions && transactions.length > 0) {
      const categories = budgetData.map(b => b.category)
      const autoCalculated = calculateRealizationFromTransactions(transactions, categories)
      setTransactionFormData(
        autoCalculated.map((calc) => {
          const budgetItem = budgetData.find(b => b.category === calc.category)
          return {
            category: calc.category,
            planned_amount: budgetItem?.amount || 0,
            realized_income: calc.realized_income,
            realized_expense: calc.realized_expense,
            notes: '',
          }
        })
      )
    } else {
      setTransactionFormData(
        budgetData.map((b) => ({
          category: b.category,
          planned_amount: b.amount,
          realized_income: 0,
          realized_expense: 0,
          notes: '',
        }))
      )
    }

    // Load saved insight
    if (savedInsight) {
      setAiInsight(savedInsight.ai_insight)
    }
  }, [session, existingRealization, transactions, savedInsight])

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

  const calculateVariance = (planned: number, expense: number) => {
    const variance = expense - planned
    const percentage = planned > 0 ? (variance / planned) * 100 : 0
    return { variance, percentage }
  }

  // Handlers for manual input
  const handleManualInputChange = (index: number, field: 'realized_income' | 'realized_expense' | 'notes', value: string | number) => {
    const newData = [...manualFormData]
    if (field === 'notes') {
      newData[index][field] = value as string
    } else {
      newData[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setManualFormData(newData)
  }

  const handleSaveManual = async () => {
    if (!user || !sessionId) return

    const hasData = manualFormData.some(d => d.realized_income > 0 || d.realized_expense > 0)
    if (!hasData) {
      toast.error('Please enter at least one income or expense value')
      return
    }

    await saveRealizationMutation.mutateAsync({
      sessionId,
      userId: user.id,
      realizations: manualFormData,
    })
  }

  // Handlers for transaction-based input
  const handleTransactionInputChange = (index: number, field: 'realized_income' | 'realized_expense' | 'notes', value: string | number) => {
    const newData = [...transactionFormData]
    if (field === 'notes') {
      newData[index][field] = value as string
    } else {
      newData[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setTransactionFormData(newData)
  }

  const handleSaveFromTransactions = async () => {
    if (!user || !sessionId) return

    const hasData = transactionFormData.some(d => d.realized_income > 0 || d.realized_expense > 0)
    if (!hasData) {
      toast.error('No transaction data available')
      return
    }
    
    await saveRealizationMutation.mutateAsync({
      sessionId,
      userId: user.id,
      realizations: transactionFormData,
    })
  }

  // Analysis handler
  const handleGenerateAnalysis = async (formData: any[]) => {
    if (!user || !sessionId || !session) return

    const budgetData = session.ai_generated_budget?.budget || []
    
    // Calculate analysis
    const analysis = calculateRealizationAnalysis(formData)
    setCurrentAnalysis(analysis)

    // Generate AI insight
    setIsLoadingInsight(true)
    try {
      const insight = await analyzeRealization({
        realizations: formData,
        budgetPlan: budgetData,
        sessionInfo: {
          budget_type: session.budget_type || '1-month',
          start_date: session.start_date || '',
          end_date: session.end_date || '',
          estimated_expense: session.estimated_expense || undefined,
        },
      })
      setAiInsight(insight)

      // Save insight to database
      await saveInsightMutation.mutateAsync({
        sessionId,
        userId: user.id,
        aiInsight: insight,
        analysisData: analysis,
      })

      toast.success('Analysis generated!')
      setActiveTab('analysis')
    } catch (error) {
      console.error('Error generating insight:', error)
      toast.error('Failed to generate AI insight')
    } finally {
      setIsLoadingInsight(false)
    }
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
  const totalBudget = budgetData.reduce((sum, b) => sum + b.amount, 0)

  const manualTotalIncome = manualFormData.reduce((sum, d) => sum + d.realized_income, 0)
  const manualTotalExpense = manualFormData.reduce((sum, d) => sum + d.realized_expense, 0)
  const manualNetSavings = manualTotalIncome - manualTotalExpense

  const transTotalIncome = transactionFormData.reduce((sum, d) => sum + d.realized_income, 0)
  const transTotalExpense = transactionFormData.reduce((sum, d) => sum + d.realized_expense, 0)
  const transNetSavings = transTotalIncome - transTotalExpense

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
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>Budget Realization</CardTitle>
                  <CardDescription className="mt-2">
                    Enter actual income and expenses, or auto-calculate from tracked transactions
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
                  <Wallet className="w-4 h-4 text-gray-500" />
                  <span className="text-gray-600">
                    Transactions: <span className="font-semibold">{transactions.length}</span>
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="quick-input">⚡ Quick Input</TabsTrigger>
              <TabsTrigger value="from-transactions">🔄 From Transactions</TabsTrigger>
              <TabsTrigger value="analysis">📊 Analysis</TabsTrigger>
            </TabsList>

            {/* Tab 1: Quick Input - Manual Entry */}
            <TabsContent value="quick-input" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Manual Budget Realization</CardTitle>
                      <CardDescription>
                        Directly enter your actual income and expenses without tracking individual transactions
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => handleGenerateAnalysis(manualFormData)}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingInsight || (manualTotalIncome === 0 && manualTotalExpense === 0)}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                      <Button
                        onClick={handleSaveManual}
                        size="sm"
                        disabled={saveRealizationMutation.isPending}
                      >
                        {saveRealizationMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Planned</TableHead>
                          <TableHead className="text-right">Income</TableHead>
                          <TableHead className="text-right">Expense</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {manualFormData.map((item, index) => {
                          const variance = calculateVariance(item.planned_amount, item.realized_expense)
                          return (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{item.category}</TableCell>
                              <TableCell className="text-right">{formatCurrency(item.planned_amount)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.realized_income || ''}
                                  onChange={(e) => handleManualInputChange(index, 'realized_income', e.target.value)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.realized_expense || ''}
                                  onChange={(e) => handleManualInputChange(index, 'realized_expense', e.target.value)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={variance.variance > 0 ? 'destructive' : 'default'}
                                  className={variance.variance <= 0 ? 'bg-green-100 text-green-700' : ''}
                                >
                                  {variance.variance > 0 ? '+' : ''}{formatCurrency(variance.variance)}
                                  <br />
                                  <span className="text-xs">({variance.percentage > 0 ? '+' : ''}{variance.percentage.toFixed(1)}%)</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Textarea
                                  value={item.notes}
                                  onChange={(e) => handleManualInputChange(index, 'notes', e.target.value)}
                                  placeholder="Optional notes"
                                  className="min-w-[200px]"
                                  rows={2}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Totals Row */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalBudget)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(manualTotalIncome)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatCurrency(manualTotalExpense)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={manualNetSavings >= 0 ? 'default' : 'destructive'} className={manualNetSavings >= 0 ? 'bg-green-600' : ''}>
                              Net: {formatCurrency(manualNetSavings)}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 2: From Transactions - Auto-Calculate */}
            <TabsContent value="from-transactions" className="space-y-6">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>Calculate from Transactions</CardTitle>
                      <CardDescription>
                        {transactions.length > 0 
                          ? `Auto-calculated from ${transactions.length} tracked transactions. You can adjust values if needed.`
                          : 'No transactions found. Please track transactions first or use Quick Input.'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      {transactions.length === 0 && (
                        <Link href={`/app/transactions/${sessionId}`}>
                          <Button variant="outline" size="sm">
                            <Wallet className="w-4 h-4 mr-2" />
                            Track Transactions
                          </Button>
                        </Link>
                      )}
                      <Button
                        onClick={() => handleGenerateAnalysis(transactionFormData)}
                        variant="outline"
                        size="sm"
                        disabled={isLoadingInsight || (transTotalIncome === 0 && transTotalExpense === 0)}
                      >
                        <Calculator className="w-4 h-4 mr-2" />
                        Analyze
                      </Button>
                      <Button
                        onClick={handleSaveFromTransactions}
                        size="sm"
                        disabled={saveRealizationMutation.isPending || transactions.length === 0}
                      >
                        {saveRealizationMutation.isPending ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        Save
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Category</TableHead>
                          <TableHead className="text-right">Planned</TableHead>
                          <TableHead className="text-right">Income</TableHead>
                          <TableHead className="text-right">Expense</TableHead>
                          <TableHead className="text-right">Variance</TableHead>
                          <TableHead>Notes</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {transactionFormData.map((item, index) => {
                          const variance = calculateVariance(item.planned_amount, item.realized_expense)
                          const hasTransactionData = item.realized_income > 0 || item.realized_expense > 0
                          
                          return (
                            <TableRow key={index} className={hasTransactionData ? 'bg-blue-50/50' : ''}>
                              <TableCell className="font-medium">
                                {item.category}
                                {hasTransactionData && (
                                  <Badge variant="outline" className="ml-2 text-xs bg-blue-100 text-blue-700">
                                    Auto
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell className="text-right">{formatCurrency(item.planned_amount)}</TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.realized_income || ''}
                                  onChange={(e) => handleTransactionInputChange(index, 'realized_income', e.target.value)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell>
                                <Input
                                  type="number"
                                  value={item.realized_expense || ''}
                                  onChange={(e) => handleTransactionInputChange(index, 'realized_expense', e.target.value)}
                                  className="text-right"
                                  placeholder="0"
                                />
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge
                                  variant={variance.variance > 0 ? 'destructive' : 'default'}
                                  className={variance.variance <= 0 ? 'bg-green-100 text-green-700' : ''}
                                >
                                  {variance.variance > 0 ? '+' : ''}{formatCurrency(variance.variance)}
                                  <br />
                                  <span className="text-xs">({variance.percentage > 0 ? '+' : ''}{variance.percentage.toFixed(1)}%)</span>
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Textarea
                                  value={item.notes}
                                  onChange={(e) => handleTransactionInputChange(index, 'notes', e.target.value)}
                                  placeholder="Optional notes"
                                  className="min-w-[200px]"
                                  rows={2}
                                />
                              </TableCell>
                            </TableRow>
                          )
                        })}
                        {/* Totals Row */}
                        <TableRow className="bg-gray-50 font-semibold">
                          <TableCell>TOTAL</TableCell>
                          <TableCell className="text-right">{formatCurrency(totalBudget)}</TableCell>
                          <TableCell className="text-right text-green-600">{formatCurrency(transTotalIncome)}</TableCell>
                          <TableCell className="text-right text-orange-600">{formatCurrency(transTotalExpense)}</TableCell>
                          <TableCell className="text-right">
                            <Badge variant={transNetSavings >= 0 ? 'default' : 'destructive'} className={transNetSavings >= 0 ? 'bg-green-600' : ''}>
                              Net: {formatCurrency(transNetSavings)}
                            </Badge>
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>

                  {transactions.length > 0 && (
                    <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800">
                        💡 <strong>Note:</strong> Values are auto-calculated from your {transactions.length} tracked transactions. 
                        You can adjust any values manually if needed before saving.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Tab 3: Analysis */}
            <TabsContent value="analysis" className="space-y-6">
              {currentAnalysis || (existingRealization && existingRealization.length > 0) ? (
                <RealizationAnalysis
                  analysis={currentAnalysis || calculateRealizationAnalysis(existingRealization)}
                  aiInsight={aiInsight || undefined}
                  isLoadingInsight={isLoadingInsight}
                  onGenerateInsight={() => {
                    const dataToAnalyze = existingRealization && existingRealization.length > 0 
                      ? existingRealization 
                      : (activeTab === 'quick-input' ? manualFormData : transactionFormData)
                    handleGenerateAnalysis(dataToAnalyze)
                  }}
                />
              ) : (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center text-gray-500">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-sm font-medium">No analysis available</p>
                      <p className="text-xs mt-1 mb-4">
                        Enter realization data and click &quot;Analyze&quot; to generate insights
                      </p>
                      <div className="flex gap-2 justify-center">
                        <Button variant="outline" onClick={() => setActiveTab('quick-input')}>
                          Go to Quick Input
                        </Button>
                        <Button variant="outline" onClick={() => setActiveTab('from-transactions')}>
                          Go to Transactions
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </AppLayout>
  )
}
