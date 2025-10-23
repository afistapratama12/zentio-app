import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Transaction } from '../types'

// Query Keys
export const transactionKeys = {
  all: ['transactions'] as const,
  byUser: (userId: string) => ['transactions', userId] as const,
}

// Get user transactions
export function useTransactions(userId: string | undefined) {
  return useQuery({
    queryKey: transactionKeys.byUser(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error

      const allTransactions: Transaction[] = []
      data?.forEach((t) => {
        const extractedData = t.extracted_data as any
        if (Array.isArray(extractedData)) {
          extractedData.forEach((item: any) => {
            allTransactions.push({
              item: item.item || item.item_name || 'Unknown',
              amount: item.amount || 0,
              category: item.category || 'Lain-lain',
              date: item.date || t.created_at,
            })
          })
        } else if (extractedData) {
          allTransactions.push({
            item: extractedData.item || extractedData.item_name || 'Unknown',
            amount: extractedData.amount || 0,
            category: extractedData.category || 'Lain-lain',
            date: extractedData.date || t.created_at,
          })
        }
      })

      return allTransactions
    },
    enabled: !!userId,
  })
}

// Create transaction
export function useCreateTransaction() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      userId,
      transactions,
    }: {
      userId: string
      transactions: Transaction[]
    }) => {
      // Delete old transactions
      await supabase.from('transactions').delete().eq('user_id', userId)

      // Insert new transaction
      const { error } = await supabase.from('transactions').insert([
        {
          user_id: userId,
          extracted_data: transactions as any,
          source_file: 'manual_upload',
        },
      ])

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: transactionKeys.byUser(variables.userId),
      })
    },
  })
}

// Delete transaction (local only - requires save to persist)
export function useDeleteTransaction() {
  return {
    deleteTransaction: (index: number, transactions: Transaction[]) => {
      return transactions.filter((_, i) => i !== index)
    },
  }
}
