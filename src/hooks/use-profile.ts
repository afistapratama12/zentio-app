import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'

// Query Keys
export const profileKeys = {
  all: ['profile'] as const,
  detail: (userId: string) => ['profile', userId] as const,
  stats: (userId: string) => ['profile', 'stats', userId] as const,
}

interface UserProfile {
  name?: string
  age?: number
  gender?: string
  marital_status?: string
  job?: string
  location?: string
  investment_level?: string
  financial_type?: string
}

interface UserStats {
  totalBudgets: number
  totalTransactions: number
  memberSince: string
  lastActivity: string
}

// Get user profile
export function useUserProfile(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.detail(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')

      const { data, error } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) throw error

      return {
        name: data.name || undefined,
        age: data.age || undefined,
        gender: data.gender || undefined,
        marital_status: data.marital_status || undefined,
        job: data.job || undefined,
        location: data.location || undefined,
        investment_level: data.investment_level || undefined,
        financial_type: data.financial_type || undefined,
      } as UserProfile
    },
    enabled: !!userId,
  })
}

// Get user statistics
export function useUserStats(userId: string | undefined) {
  return useQuery({
    queryKey: profileKeys.stats(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')

      const [budgetResult, transactionResult, userResult] = await Promise.all([
        supabase
          .from('budget_history')
          .select('created_at')
          .eq('user_id', userId),
        supabase
          .from('transactions')
          .select('created_at')
          .eq('user_id', userId),
        supabase.auth.getUser(),
      ])

      return {
        totalBudgets: budgetResult.data?.length || 0,
        totalTransactions: transactionResult.data?.length || 0,
        memberSince: userResult.data.user?.created_at || new Date().toISOString(),
        lastActivity: budgetResult.data?.[0]?.created_at || userResult.data.user?.created_at || new Date().toISOString(),
      } as UserStats
    },
    enabled: !!userId,
  })
}

// Update user profile
export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, profile }: { userId: string; profile: Partial<UserProfile> }) => {
      const { error } = await supabase
        .from('user_profile')
        .update({
          name: profile.name,
          age: profile.age,
          gender: profile.gender,
          marital_status: profile.marital_status,
          job: profile.job,
          location: profile.location,
          investment_level: profile.investment_level,
          financial_type: profile.financial_type,
        })
        .eq('user_id', userId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) })
    },
  })
}

// Create user profile (for onboarding)
export function useCreateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, profile }: { userId: string; profile: UserProfile }) => {
      const { error } = await supabase
        .from('user_profile')
        .insert({
          user_id: userId,
          name: profile.name || '',
          age: typeof profile.age === 'number' ? profile.age : null,
          gender: profile.gender || null,
          marital_status: profile.marital_status || null,
          job: profile.job || null,
          location: profile.location || null,
          investment_level: profile.investment_level || null,
          financial_type: profile.financial_type || null,
        })

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: profileKeys.detail(variables.userId) })
      queryClient.invalidateQueries({ queryKey: profileKeys.all })
    },
  })
}
