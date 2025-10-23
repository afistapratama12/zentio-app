import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { supabase } from '~/lib/supabase'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Button } from '~/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { Loader2, Upload, TrendingUp, Wallet, Save } from 'lucide-react'
import { TransactionUploader } from '~/components/TransactionUploader'
import { TransactionsList } from '~/components/TransactionsList'
import { ChatPanel } from '~/components/ChatPanel'
import { BudgetChart } from '~/components/BudgetChart'
import { BudgetTable } from '~/components/BudgetTable'
import RewardsPanel from '~/components/RewardsPanel'
import { checkAndAwardBadges } from '~/lib/rewards'
import { toast } from 'sonner'
import type { Database } from '~/types/database'

export interface Budget {
  category: string
  amount: number
  percentage: number
  [key: string]: string | number
}

type Transaction = {
  item: string
  amount: number
  category: string
  date?: string
}

type UserProfile = {
  name?: string
  age?: number
  job?: string
  location?: string
  investment_level?: string
  financial_type?: string
}

type TransactionInsert = Database['public']['Tables']['transactions']['Insert']
type BudgetHistoryInsert =
  Database['public']['Tables']['budget_history']['Insert']

export const Route = createFileRoute('/app/')({
  component: AppDashboard,
})

function AppDashboard() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | undefined>()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [budget, setBudget] = useState<Budget[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      navigate({ to: '/login' })
      return
    }

    setUser(user)
    await loadUserProfile(user.id)
    await loadTransactions(user.id)
    await loadBudget(user.id)
    setLoading(false)
  }

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      if (data) {
        setUserProfile({
          name: data.name || undefined,
          age: data.age || undefined,
          job: data.job || undefined,
          location: data.location || undefined,
          investment_level: data.investment_level || undefined,
          financial_type: data.financial_type || undefined,
        })
      }
    } catch (error: any) {
      console.error('Error loading user profile:', error)
    }
  }

  const loadBudget = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        // No budget yet, that's okay
        return
      }

      if (data && data.ai_generated_budget) {
        const budgetData = data.ai_generated_budget as any
        if (Array.isArray(budgetData)) {
          setBudget(budgetData)
        }
      }
    } catch (error: any) {
      console.error('Error loading budget:', error)
    }
  }

  const loadTransactions = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      if (data) {
        const allTransactions: Transaction[] = []
        data.forEach((t) => {
          const extractedData = t.extracted_data as any
          if (Array.isArray(extractedData)) {
            // If extracted_data is an array of transactions
            extractedData.forEach((item: any) => {
              allTransactions.push({
                item: item.item || item.item_name || 'Unknown',
                amount: item.amount || 0,
                category: item.category || 'Lain-lain',
                date: item.date || t.created_at,
              })
            })
          } else if (extractedData) {
            // If extracted_data is a single transaction
            allTransactions.push({
              item: extractedData.item || extractedData.item_name || 'Unknown',
              amount: extractedData.amount || 0,
              category: extractedData.category || 'Lain-lain',
              date: extractedData.date || t.created_at,
            })
          }
        })
        setTransactions(allTransactions)
      }
    } catch (error: any) {
      console.error('Error loading transactions:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate({ to: '/' })
  }

  const handleTransactionsProcessed = (newTransactions: Transaction[]) => {
    setTransactions((prev) => [...newTransactions, ...prev])
  }

  const handleDeleteTransaction = (index: number) => {
    setTransactions((prev) => prev.filter((_, i) => i !== index))
    toast.success('Transaksi dihapus')
  }

  const handleSaveToDatabase = async () => {
    if (!user || transactions.length === 0) return

    setSaving(true)
    try {
      // Delete old transactions
      await supabase.from('transactions').delete().eq('user_id', user.id)

      // Insert new transaction with all data in extracted_data as JSONB
      const transactionInsert: TransactionInsert = {
        user_id: user.id,
        extracted_data: transactions as any, // Store all transactions in JSONB
        source_file: 'manual_upload',
      }

      const { error } = await supabase
        .from('transactions')
        .insert([transactionInsert])

      if (error) throw error

      toast.success('Transaksi berhasil disimpan!')
      
      // Check and award badges after saving transactions
      if (user?.id) {
        const newBadges = await checkAndAwardBadges(user.id)
        if (newBadges.length > 0) {
          toast.success(`🎉 Badge baru terbuka: ${newBadges.length} achievement!`)
        }
      }
    } catch (error: any) {
      console.error('Error saving transactions:', error)
      toast.error('Gagal menyimpan transaksi')
    } finally {
      setSaving(false)
    }
  }

  const handleBudgetGenerated = (generatedBudget: Budget[]) => {
    setBudget(generatedBudget)
  }

  const handleBudgetUpdate = (updatedBudget: Budget[]) => {
    setBudget(updatedBudget)
  }

  const handleSaveBudget = async () => {
    if (!user || budget.length === 0) return

    try {
      const budgetInsert: BudgetHistoryInsert = {
        user_id: user.id,
        period: new Date().toISOString().slice(0, 7), // YYYY-MM format
        ai_generated_budget: budget as any,
      }

      const { error } = await supabase
        .from('budget_history')
        .insert([budgetInsert])

      if (error) throw error

      toast.success('Budget berhasil disimpan ke database!')
      
      // Check and award badges after saving budget
      if (user?.id) {
        const newBadges = await checkAndAwardBadges(user.id)
        if (newBadges.length > 0) {
          toast.success(`🎉 Badge baru terbuka: ${newBadges.length} achievement!`)
        }
      }
    } catch (error: any) {
      console.error('Error saving budget:', error)
      toast.error('Gagal menyimpan budget')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-4 animate-spin text-emerald-600" />
      </div>
    )
  }

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0)
  const totalBudget = budget.reduce((sum, b) => sum + b.amount, 0)

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-emerald-600">Zentio</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <Button variant="outline" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-3xl font-bold">Dashboard</h2>
            {transactions.length > 0 && (
              <Button onClick={handleSaveToDatabase} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Simpan ke Database
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Pengeluaran
                </CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(totalSpending)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Dari {transactions.length} transaksi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Budget
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Intl.NumberFormat('id-ID', {
                    style: 'currency',
                    currency: 'IDR',
                    minimumFractionDigits: 0,
                  }).format(totalBudget)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {budget.length > 0
                    ? `${budget.length} kategori`
                    : 'Belum ada budget'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Transaksi
                </CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{transactions.length}</div>
                <p className="text-xs text-muted-foreground">Total transaksi</p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs untuk organize features */}
          <Tabs defaultValue="transactions" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="transactions">📊 Transaksi</TabsTrigger>
              <TabsTrigger value="budget">💰 Budget</TabsTrigger>
              <TabsTrigger value="chat">🤖 AI Assistant</TabsTrigger>
              <TabsTrigger value="rewards">🏆 Rewards</TabsTrigger>
            </TabsList>

            {/* Tab: Transactions */}
            <TabsContent value="transactions" className="space-y-6">
              <TransactionUploader
                onTransactionsProcessed={handleTransactionsProcessed}
              />
              <TransactionsList
                transactions={transactions}
                onDelete={handleDeleteTransaction}
              />
            </TabsContent>

            {/* Tab: Budget */}
            <TabsContent value="budget" className="space-y-6">
              <BudgetChart budget={budget} />
              <BudgetTable
                budget={budget}
                onBudgetUpdate={handleBudgetUpdate}
                onSave={handleSaveBudget}
              />
            </TabsContent>

            {/* Tab: AI Chat */}
            <TabsContent value="chat" className="space-y-6">
              <ChatPanel
                transactions={transactions}
                userProfile={userProfile}
                onBudgetGenerated={handleBudgetGenerated}
              />
            </TabsContent>

            {/* Tab: Rewards */}
            <TabsContent value="rewards" className="space-y-6">
              {user && <RewardsPanel userId={user.id} />}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
