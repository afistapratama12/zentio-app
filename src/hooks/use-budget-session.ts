import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { BudgetItem, ChatMessage } from '../lib/ai-service'
import type { UploadedFile } from '../lib/file-upload'
import type { Database } from '../types/database'

type BudgetHistoryInsert = Database['public']['Tables']['budget_history']['Insert']

export const budgetSessionKeys = {
  all: ['budget-sessions'] as const,
  byUser: (userId: string) => [...budgetSessionKeys.all, userId] as const,
  detail: (id: string) => [...budgetSessionKeys.all, 'detail', id] as const,
}

export interface BudgetSession {
  id: string
  user_id: string
  period: string
  budget_type: string | null
  start_date: string | null
  end_date: string | null
  estimated_expense: number | null
  ai_generated_budget: {
    budget: BudgetItem[]
    explanation?: string
    savingsTarget?: number
    insights?: string[]
  }
  manual_adjustments?: any
  chat_history: ChatMessage[]
  first_prompt: ChatMessage
  uploaded_files: UploadedFile[]
  edit_count: number | null
  status: string | null
  last_ai_feedback: string | null
  created_at: string
}

interface CreateBudgetSessionParams {
  userId: string
  budgetType: '1-month' | '1-year' | 'custom'
  startDate: string
  endDate: string
  estimatedExpense?: number
  budget: BudgetItem[]
  explanation: string
  chatHistory: ChatMessage[]
  firstPrompt: ChatMessage
  uploadedFiles: UploadedFile[]
  insights?: string[]
  savingsTarget?: number
}

interface UpdateBudgetSessionParams {
  sessionId: string
  budget?: BudgetItem[]
  chatHistory?: ChatMessage[]
  uploadedFiles?: UploadedFile[]
  editCount?: number
  lastAiFeedback?: string
  status?: 'draft' | 'saved' | 'exported' | 'on-edit'
}

// Create new budget session
export function useCreateBudgetSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: CreateBudgetSessionParams) => {
      const period = `${params.startDate}_${params.endDate}`

      const insertData: BudgetHistoryInsert = {
        user_id: params.userId,
        period,
        budget_type: params.budgetType,
        start_date: params.startDate,
        end_date: params.endDate,
        estimated_expense: params.estimatedExpense,
        ai_generated_budget: {
          budget: params.budget,
          explanation: params.explanation,
          savingsTarget: params.savingsTarget,
          insights: params.insights || [],
        } as any,
        chat_history: params.chatHistory as any,
        first_prompt: params.firstPrompt as any,
        uploaded_files: params.uploadedFiles as any,
        edit_count: 0,
        status: 'draft',
      }

      const { data, error } = await supabase
        .from('budget_history')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetSessionKeys.byUser(variables.userId) })
    },
  })
}

// Update budget session
export function useUpdateBudgetSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (params: UpdateBudgetSessionParams) => {
      const updateData: any = {}

      if (params.budget) {
        // Update the budget in ai_generated_budget
        const { data: current } = await supabase
          .from('budget_history')
          .select('ai_generated_budget')
          .eq('id', params.sessionId)
          .single()

        const currentBudget = current?.ai_generated_budget as any

        updateData.ai_generated_budget = {
          ...(currentBudget || {}),
          budget: params.budget,
        }
      }

      if (params.chatHistory) {
        updateData.chat_history = params.chatHistory
      }

      if (params.uploadedFiles) {
        updateData.uploaded_files = params.uploadedFiles
      }

      if (params.editCount !== undefined) {
        updateData.edit_count = params.editCount
      }

      if (params.lastAiFeedback) {
        updateData.last_ai_feedback = params.lastAiFeedback
      }

      if (params.status) {
        updateData.status = params.status
      }

      const { data, error } = await supabase
        .from('budget_history')
        .update(updateData)
        .eq('id', params.sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetSessionKeys.detail(variables.sessionId) })
    },
  })
}

// Get budget session by ID
export function useBudgetSession(sessionId: string | null) {
  return useQuery({
    queryKey: budgetSessionKeys.detail(sessionId || ''),
    queryFn: async () => {
      if (!sessionId) return null

      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('id', sessionId)
        .single()

      if (error) throw error
      return data as unknown as BudgetSession
    },
    enabled: !!sessionId,
  })
}

// Get user's draft and saved sessions, on-edit (exclude exported)
export function useBudgetSessions(userId: string) {
  return useQuery({
    queryKey: [...budgetSessionKeys.byUser(userId), 'active'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('budget_history')
        .select('*')
        .eq('user_id', userId)
        // .in('status', ['draft', 'saved', 'on-edit'])
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as unknown as BudgetSession[]
    },
    enabled: !!userId,
  })
}

// Get user's exported sessions
// export function useExportedSessions(userId: string) {
//   return useQuery({
//     queryKey: [...budgetSessionKeys.byUser(userId), 'exported'],
//     queryFn: async () => {
//       const { data, error } = await supabase
//         .from('budget_history')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('status', 'exported')
//         .order('created_at', { ascending: false })

//       if (error) throw error
//       return data as unknown as BudgetSession[]
//     },
//     enabled: !!userId,
//   })
// }

// Delete budget session
export function useDeleteBudgetSession() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId }: { sessionId: string; userId: string }) => {
      const { error } = await supabase
        .from('budget_history')
        .delete()
        .eq('id', sessionId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: budgetSessionKeys.byUser(variables.userId) })
    },
  })
}
