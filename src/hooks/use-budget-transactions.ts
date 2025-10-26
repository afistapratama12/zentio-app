import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BudgetTransaction } from '@/types'

// Get all transactions for a session
export function useTransactionsBySession(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['budget-transactions', sessionId],
    queryFn: async (): Promise<BudgetTransaction[]> => {
      if (!sessionId) return []
      
      const { data, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('session_id', sessionId)
        .order('transaction_date', { ascending: false })

      if (error) throw error
      return data as BudgetTransaction[]
    },
    enabled: enabled && !!sessionId,
  })
}

// Add single transaction
export function useAddTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
      transaction,
    }: {
      userId: string
      sessionId: string
      transaction: {
        category: string
        item: string
        amount: number
        transaction_type: 'income' | 'expense'
        transaction_date: string
        source?: 'upload' | 'manual'
        notes?: string
      }
    }) => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .insert({
          user_id: userId,
          session_id: sessionId,
          ...transaction,
          source: transaction.source || 'manual',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary', variables.sessionId] })
    },
  })
}

// Bulk add transactions (for upload)
export function useBulkAddTransactions() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      sessionId,
      transactions,
    }: {
      userId: string
      sessionId: string
      transactions: Array<{
        category: string
        item: string
        amount: number
        transaction_type: 'income' | 'expense'
        transaction_date: string
        source?: 'upload' | 'manual'
        notes?: string
      }>
    }) => {
      const transactionsWithMeta = transactions.map((t) => ({
        user_id: userId,
        session_id: sessionId,
        ...t,
        source: t.source || 'upload',
      }))

      const { data, error } = await supabase
        .from('budget_transactions')
        .insert(transactionsWithMeta)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary', variables.sessionId] })
    },
  })
}

// Update transaction
export function useUpdateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionId,
      sessionId,
      updates,
    }: {
      transactionId: string
      sessionId: string
      updates: Partial<BudgetTransaction>
    }) => {
      const { data, error } = await supabase
        .from('budget_transactions')
        .update(updates)
        .eq('id', transactionId)
        .eq('session_id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary', variables.sessionId] })
    },
  })
}

// Delete transaction
export function useDeleteTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      transactionId,
      sessionId,
    }: {
      transactionId: string
      sessionId: string
    }) => {
      const { error } = await supabase
        .from('budget_transactions')
        .delete()
        .eq('id', transactionId)
        .eq('session_id', sessionId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['budget-transactions', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['transaction-summary', variables.sessionId] })
    },
  })
}

// Get transaction summary by category
export function useTransactionSummary(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['transaction-summary', sessionId],
    queryFn: async () => {
      if (!sessionId) return null
      
      const { data: transactions, error } = await supabase
        .from('budget_transactions')
        .select('*')
        .eq('session_id', sessionId)

      if (error) throw error

      // Group by category
      const summary = (transactions as BudgetTransaction[]).reduce((acc, t) => {
        if (!acc[t.category]) {
          acc[t.category] = {
            category: t.category,
            totalIncome: 0,
            totalExpense: 0,
            transactionCount: 0,
          }
        }

        if (t.transaction_type === 'income') {
          acc[t.category].totalIncome += t.amount
        } else {
          acc[t.category].totalExpense += t.amount
        }
        acc[t.category].transactionCount += 1

        return acc
      }, {} as Record<string, {
        category: string
        totalIncome: number
        totalExpense: number
        transactionCount: number
      }>)

      return Object.values(summary)
    },
    enabled: enabled && !!sessionId,
  })
}

// Calculate realization from transactions
export function calculateRealizationFromTransactions(
  transactions: BudgetTransaction[],
  budgetCategories: string[]
) {
  const realization = budgetCategories.map((category) => {
    const categoryTransactions = transactions.filter((t) => t.category === category)
    
    const totalIncome = categoryTransactions
      .filter((t) => t.transaction_type === 'income')
      .reduce((sum, t) => sum + t.amount, 0)
    
    const totalExpense = categoryTransactions
      .filter((t) => t.transaction_type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)

    return {
      category,
      realized_income: totalIncome,
      realized_expense: totalExpense,
    }
  })

  return realization
}
