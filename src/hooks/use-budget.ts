import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'
import type { Budget, BudgetHistory } from '~/types'

// Query Keys
export const budgetKeys = {
  all: ['budgets'] as const,
  byUser: (userId: string) => ['budgets', userId] as const,
  history: (userId: string) => ['budgets', 'history', userId] as const,
  latest: (userId: string) => ['budgets', 'latest', userId] as const,
}

// Get latest budget
export function useLatestBudget(userId: string | undefined) {
  return useQuery({
    queryKey: budgetKeys.latest(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')

      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return [] // No data found
        throw error
      }

      const aiData = data.ai_generated_budget as any
      return (aiData?.budget || []) as Budget[]
    },
    enabled: !!userId,
  })
}

// Get budget history
export function useBudgetHistory(userId: string | undefined) {
  return useQuery({
    queryKey: budgetKeys.history(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')

      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []) as unknown as BudgetHistory[]
    },
    enabled: !!userId,
  })
}

// Save budget
export function useSaveBudget() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, budget }: { userId: string; budget: Budget[] }) => {
      const { error } = await supabase.from('budget_history').insert([
        {
          user_id: userId,
          period: new Date().toISOString().slice(0, 7), // YYYY-MM format
          ai_generated_budget: budget as any,
        },
      ])

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetKeys.byUser(variables.userId) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.latest(variables.userId) })
      queryClient.invalidateQueries({ queryKey: budgetKeys.history(variables.userId) })
    },
  })
}
