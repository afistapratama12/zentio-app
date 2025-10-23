import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '~/lib/supabase'

// Query Keys
export const authKeys = {
  user: ['user'] as const,
  session: ['session'] as const,
}

// Get current user
export function useUser() {
  return useQuery({
    queryKey: authKeys.user,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getUser()
      if (error) throw error
      return data.user
    },
  })
}

// Get current session
export function useSession() {
  return useQuery({
    queryKey: authKeys.session,
    queryFn: async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) throw error
      return data.session
    },
  })
}

// Login mutation
export function useLogin() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      queryClient.invalidateQueries({ queryKey: authKeys.session })
    },
  })
}

// Signup mutation
export function useSignup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: authKeys.user })
      queryClient.invalidateQueries({ queryKey: authKeys.session })
    },
  })
}

// Logout mutation
export function useLogout() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.clear() // Clear all queries on logout
    },
  })
}

// Check if user is authenticated
export function useAuth() {
  const { data: user, isLoading } = useUser()
  return {
    user,
    isAuthenticated: !!user,
    isLoading,
  }
}
