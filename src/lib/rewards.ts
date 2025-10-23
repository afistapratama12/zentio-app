import { supabase } from './supabase'

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  criteria: string
  requirement: number
}

export const BADGES: Badge[] = [
  {
    id: 'first-budget',
    name: 'Budget Beginner',
    description: 'Create your first budget',
    icon: '🎯',
    criteria: 'budgets',
    requirement: 1,
  },
  {
    id: 'budget-master',
    name: 'Budget Master',
    description: 'Create 5 budgets',
    icon: '👑',
    criteria: 'budgets',
    requirement: 5,
  },
  {
    id: 'budget-legend',
    name: 'Budget Legend',
    description: 'Create 10 budgets',
    icon: '🏆',
    criteria: 'budgets',
    requirement: 10,
  },
  {
    id: 'first-transaction',
    name: 'Transaction Starter',
    description: 'Upload your first transaction',
    icon: '📝',
    criteria: 'transactions',
    requirement: 1,
  },
  {
    id: 'transaction-hunter',
    name: 'Transaction Hunter',
    description: 'Upload 10 transactions',
    icon: '🔍',
    criteria: 'transactions',
    requirement: 10,
  },
  {
    id: 'transaction-expert',
    name: 'Transaction Expert',
    description: 'Upload 25 transactions',
    icon: '💎',
    criteria: 'transactions',
    requirement: 25,
  },
  {
    id: 'savings-champion',
    name: 'Savings Champion',
    description: 'Set a savings target in your budget',
    icon: '💰',
    criteria: 'savings',
    requirement: 1,
  },
  {
    id: 'early-bird',
    name: 'Early Bird',
    description: 'Create budget in the first week of the month',
    icon: '🌅',
    criteria: 'early-budget',
    requirement: 1,
  },
  {
    id: 'consistent-budgeter',
    name: 'Consistent Budgeter',
    description: 'Create budgets for 3 consecutive months',
    icon: '📅',
    criteria: 'consecutive-months',
    requirement: 3,
  },
  {
    id: 'category-master',
    name: 'Category Master',
    description: 'Have transactions in all 9 categories',
    icon: '🎨',
    criteria: 'all-categories',
    requirement: 9,
  },
]

export async function checkAndAwardBadges(userId: string): Promise<string[]> {
  const newBadges: string[] = []

  try {
    // Get existing badges
    const { data: existingBadges } = await supabase
      .from('rewards')
      .select('badge')
      .eq('user_id', userId)

    const earnedBadgeIds = new Set(existingBadges?.map((b) => b.badge) || [])

    // Get user statistics
    const { data: budgetData } = await supabase
      .from('budget_history')
      .select('created_at, ai_generated_budget')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    const { data: transactionData } = await supabase
      .from('transactions')
      .select('created_at, extracted_data')
      .eq('user_id', userId)

    const budgetCount = budgetData?.length || 0
    const transactionCount = transactionData?.length || 0

    // Check each badge
    for (const badge of BADGES) {
      if (earnedBadgeIds.has(badge.id)) continue // Already earned

      let shouldAward = false

      switch (badge.criteria) {
        case 'budgets':
          shouldAward = budgetCount >= badge.requirement
          break

        case 'transactions':
          shouldAward = transactionCount >= badge.requirement
          break

        case 'savings':
          // Check if any budget has savings_target
          shouldAward = budgetData?.some((b) => {
            const aiData = b.ai_generated_budget as any
            return aiData?.savings_target && aiData.savings_target > 0
          }) || false
          break

        case 'early-budget':
          // Check if any budget was created in first 7 days of month
          shouldAward = budgetData?.some((b) => {
            const date = new Date(b.created_at)
            return date.getDate() <= 7
          }) || false
          break

        case 'consecutive-months':
          // Check for consecutive months
          if (budgetData && budgetData.length >= 3) {
            const months = budgetData.map((b) => {
              const date = new Date(b.created_at)
              return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
            })
            const uniqueMonths = Array.from(new Set(months)).sort()

            let maxConsecutive = 1
            let currentConsecutive = 1

            for (let i = 1; i < uniqueMonths.length; i++) {
              const [prevYear, prevMonth] = uniqueMonths[i - 1].split('-').map(Number)
              const [currYear, currMonth] = uniqueMonths[i].split('-').map(Number)

              const prevDate = new Date(prevYear, prevMonth - 1)
              const currDate = new Date(currYear, currMonth - 1)
              const monthDiff =
                (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
                currDate.getMonth() - prevDate.getMonth()

              if (monthDiff === 1) {
                currentConsecutive++
                maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
              } else {
                currentConsecutive = 1
              }
            }

            shouldAward = maxConsecutive >= badge.requirement
          }
          break

        case 'all-categories':
          // Check if user has transactions in all categories
          const categories = new Set<string>()
          transactionData?.forEach((t) => {
            const extracted = t.extracted_data as any
            if (Array.isArray(extracted)) {
              extracted.forEach((item: any) => {
                if (item.category) categories.add(item.category)
              })
            } else if (extracted?.category) {
              categories.add(extracted.category)
            }
          })
          shouldAward = categories.size >= badge.requirement
          break
      }

      if (shouldAward) {
        // Award the badge
        const { error } = await supabase.from('rewards').insert({
          user_id: userId,
          badge: badge.id,
        })

        if (!error) {
          newBadges.push(badge.id)
        }
      }
    }
  } catch (error) {
    console.error('Error checking badges:', error)
  }

  return newBadges
}

export async function getUserBadges(userId: string): Promise<Badge[]> {
  try {
    const { data } = await supabase
      .from('rewards')
      .select('badge, earned_at')
      .eq('user_id', userId)
      .order('earned_at', { ascending: false })

    if (!data) return []

    return data.map((reward) => {
      const badge = BADGES.find((b) => b.id === reward.badge)
      return badge!
    }).filter(Boolean)
  } catch (error) {
    console.error('Error getting user badges:', error)
    return []
  }
}

export async function getUserProgress(userId: string): Promise<{
  budgetCount: number
  transactionCount: number
  hasSavingsTarget: boolean
  hasEarlyBudget: boolean
  consecutiveMonths: number
  categoriesCount: number
}> {
  try {
    const { data: budgetData } = await supabase
      .from('budget_history')
      .select('created_at, ai_generated_budget')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })

    const { data: transactionData } = await supabase
      .from('transactions')
      .select('extracted_data')
      .eq('user_id', userId)

    // Check savings target
    const hasSavingsTarget = budgetData?.some((b) => {
      const aiData = b.ai_generated_budget as any
      return aiData?.savings_target && aiData.savings_target > 0
    }) || false

    // Check early budget
    const hasEarlyBudget = budgetData?.some((b) => {
      const date = new Date(b.created_at)
      return date.getDate() <= 7
    }) || false

    // Calculate consecutive months
    let consecutiveMonths = 0
    if (budgetData && budgetData.length >= 1) {
      const months = budgetData.map((b) => {
        const date = new Date(b.created_at)
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      })
      const uniqueMonths = Array.from(new Set(months)).sort()

      let maxConsecutive = 1
      let currentConsecutive = 1

      for (let i = 1; i < uniqueMonths.length; i++) {
        const [prevYear, prevMonth] = uniqueMonths[i - 1].split('-').map(Number)
        const [currYear, currMonth] = uniqueMonths[i].split('-').map(Number)

        const prevDate = new Date(prevYear, prevMonth - 1)
        const currDate = new Date(currYear, currMonth - 1)
        const monthDiff =
          (currDate.getFullYear() - prevDate.getFullYear()) * 12 +
          currDate.getMonth() - prevDate.getMonth()

        if (monthDiff === 1) {
          currentConsecutive++
          maxConsecutive = Math.max(maxConsecutive, currentConsecutive)
        } else {
          currentConsecutive = 1
        }
      }

      consecutiveMonths = maxConsecutive
    }

    // Count unique categories
    const categories = new Set<string>()
    transactionData?.forEach((t) => {
      const extracted = t.extracted_data as any
      if (Array.isArray(extracted)) {
        extracted.forEach((item: any) => {
          if (item.category) categories.add(item.category)
        })
      } else if (extracted?.category) {
        categories.add(extracted.category)
      }
    })

    return {
      budgetCount: budgetData?.length || 0,
      transactionCount: transactionData?.length || 0,
      hasSavingsTarget,
      hasEarlyBudget,
      consecutiveMonths,
      categoriesCount: categories.size,
    }
  } catch (error) {
    console.error('Error getting user progress:', error)
    return {
      budgetCount: 0,
      transactionCount: 0,
      hasSavingsTarget: false,
      hasEarlyBudget: false,
      consecutiveMonths: 0,
      categoriesCount: 0,
    }
  }
}
