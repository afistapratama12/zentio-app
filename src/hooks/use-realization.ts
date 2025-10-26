import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { BudgetRealization, BudgetRealizationInsight, RealizationAnalysis } from '@/types'
import { Tables } from '@/types/database'

// type BudgetRealizationRow = Tables<'budget_realization'>
// type BudgetRealizationInsightRow = Tables<'budget_realization_insights'>

// Get realizations for a specific session
export function useRealizationBySession(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['realization', sessionId],
    queryFn: async (): Promise<BudgetRealization[]> => {
      if (!sessionId) return []
      
      const { data, error } = await supabase
        .from('budget_realization')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as BudgetRealization[]
    },
    enabled: enabled && !!sessionId,
  })
}

// Get AI insight for a specific session
export function useRealizationInsight(sessionId: string | null, enabled: boolean = true) {
  return useQuery({
    queryKey: ['realization-insight', sessionId],
    queryFn: async (): Promise<BudgetRealizationInsight | null> => {
      if (!sessionId) return null
      
      const { data, error } = await supabase
        .from('budget_realization_insights')
        .select('*')
        .eq('session_id', sessionId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // No rows found
        throw error
      }
      return data as BudgetRealizationInsight
    },
    enabled: enabled && !!sessionId,
  })
}

// Get all realizations for a user (history)
export function useRealizationHistory(userId: string | null) {
  return useQuery({
    queryKey: ['realization-history', userId],
    queryFn: async (): Promise<BudgetRealization[]> => {
      if (!userId) return []
      
      const { data, error } = await supabase
        .from('budget_realization')
        .select(`
          *,
          budget_sessions:session_id (
            budget_type,
            start_date,
            end_date,
            ai_generated_budget
          )
        `)
        .eq('user_id', userId)
        .order('realization_date', { ascending: false })

      if (error) throw error
      return data as any
    },
    enabled: !!userId,
  })
}

// Create or update realization (bulk upsert)
export function useSaveRealization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
      realizations,
    }: {
      sessionId: string
      userId: string
      realizations: Array<{
        category: string
        planned_amount: number
        realized_income: number
        realized_expense: number
        notes?: string
      }>
    }) => {
      // Delete existing realizations for this session
      const { error: deleteError } = await supabase
        .from('budget_realization')
        .delete()
        .eq('session_id', sessionId)

      if (deleteError) throw deleteError

      // Insert new realizations
      const realizationsWithMeta = realizations.map((r) => ({
        ...r,
        user_id: userId,
        session_id: sessionId,
        realization_date: new Date().toISOString().split('T')[0],
      }))

      const { data, error } = await supabase
        .from('budget_realization')
        .insert(realizationsWithMeta)
        .select()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['realization', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['realization-history', variables.userId] })
    },
  })
}

// Delete realization
export function useDeleteRealization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
    }: {
      sessionId: string
      userId: string
    }) => {
      const { error } = await supabase
        .from('budget_realization')
        .delete()
        .eq('session_id', sessionId)
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['realization', variables.sessionId] })
      queryClient.invalidateQueries({ queryKey: ['realization-history', variables.userId] })
    },
  })
}

// Save or update AI insight
export function useSaveRealizationInsight() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      sessionId,
      userId,
      aiInsight,
      analysisData,
    }: {
      sessionId: string
      userId: string
      aiInsight: string
      analysisData?: any
    }) => {
      const { data, error } = await supabase
        .from('budget_realization_insights')
        .upsert(
          {
            session_id: sessionId,
            user_id: userId,
            ai_insight: aiInsight,
            analysis_data: analysisData,
          },
          {
            onConflict: 'session_id',
          }
        )
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['realization-insight', variables.sessionId] })
    },
  })
}

// Calculate analysis from realization data
export function calculateRealizationAnalysis(
  realizations: BudgetRealization[]
): RealizationAnalysis {
  const totalPlanned = realizations.reduce((sum, r) => sum + r.planned_amount, 0)
  const totalIncome = realizations.reduce((sum, r) => sum + r.realized_income, 0)
  const totalExpense = realizations.reduce((sum, r) => sum + r.realized_expense, 0)
  const netSavings = totalIncome - totalExpense
  const savingsPercentage = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0
  const expenseToIncomeRatio = totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0

  const categories = realizations.map((r) => {
    const variance = r.realized_expense - r.planned_amount
    const variancePercentage = r.planned_amount > 0 ? (variance / r.planned_amount) * 100 : 0
    
    let status: 'saved' | 'overspent' | 'ontrack' = 'ontrack'
    if (variance > r.planned_amount * 0.1) {
      status = 'overspent'
    } else if (variance < -r.planned_amount * 0.05) {
      status = 'saved'
    }

    return {
      category: r.category,
      planned: r.planned_amount,
      income: r.realized_income,
      expense: r.realized_expense,
      variance,
      variancePercentage,
      status,
    }
  })

  return {
    totalPlanned,
    totalIncome,
    totalExpense,
    netSavings,
    savingsPercentage,
    expenseToIncomeRatio,
    categories,
  }
}
