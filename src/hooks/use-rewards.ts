import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getUserBadges,
  getUserProgress,
  checkAndAwardBadges,
} from '~/lib/rewards'

// Query Keys
export const rewardsKeys = {
  all: ['rewards'] as const,
  badges: (userId: string) => ['rewards', 'badges', userId] as const,
  progress: (userId: string) => ['rewards', 'progress', userId] as const,
}

// Get user badges
export function useUserBadges(userId: string | undefined) {
  return useQuery({
    queryKey: rewardsKeys.badges(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      return await getUserBadges(userId)
    },
    enabled: !!userId,
  })
}

// Get user progress
export function useUserProgress(userId: string | undefined) {
  return useQuery({
    queryKey: rewardsKeys.progress(userId || ''),
    queryFn: async () => {
      if (!userId) throw new Error('User ID required')
      return await getUserProgress(userId)
    },
    enabled: !!userId,
  })
}

// Check and award badges
export function useCheckBadges() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (userId: string) => {
      return await checkAndAwardBadges(userId)
    },
    onSuccess: (_, userId) => {
      queryClient.invalidateQueries({ queryKey: rewardsKeys.badges(userId) })
      queryClient.invalidateQueries({ queryKey: rewardsKeys.progress(userId) })
    },
  })
}
