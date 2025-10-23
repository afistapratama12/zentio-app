import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge as BadgeUI } from '~/components/ui/badge'
import { Progress } from '~/components/ui/progress'
import { getUserBadges, getUserProgress, BADGES, type Badge } from '~/lib/rewards'
import { Trophy, Lock } from 'lucide-react'

interface RewardsPanelProps {
  userId: string
}

export default function RewardsPanel({ userId }: RewardsPanelProps) {
  const [earnedBadges, setEarnedBadges] = useState<Badge[]>([])
  const [progress, setProgress] = useState({
    budgetCount: 0,
    transactionCount: 0,
    hasSavingsTarget: false,
    hasEarlyBudget: false,
    consecutiveMonths: 0,
    categoriesCount: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRewards()
  }, [userId])

  async function loadRewards() {
    try {
      setLoading(true)
      const [badges, progressData] = await Promise.all([
        getUserBadges(userId),
        getUserProgress(userId),
      ])
      setEarnedBadges(badges)
      setProgress(progressData)
    } catch (error) {
      console.error('Error loading rewards:', error)
    } finally {
      setLoading(false)
    }
  }

  function getBadgeProgress(badge: Badge): number {
    switch (badge.criteria) {
      case 'budgets':
        return Math.min((progress.budgetCount / badge.requirement) * 100, 100)
      case 'transactions':
        return Math.min((progress.transactionCount / badge.requirement) * 100, 100)
      case 'savings':
        return progress.hasSavingsTarget ? 100 : 0
      case 'early-budget':
        return progress.hasEarlyBudget ? 100 : 0
      case 'consecutive-months':
        return Math.min((progress.consecutiveMonths / badge.requirement) * 100, 100)
      case 'all-categories':
        return Math.min((progress.categoriesCount / badge.requirement) * 100, 100)
      default:
        return 0
    }
  }

  function getProgressText(badge: Badge): string {
    switch (badge.criteria) {
      case 'budgets':
        return `${progress.budgetCount} / ${badge.requirement} budgets`
      case 'transactions':
        return `${progress.transactionCount} / ${badge.requirement} transactions`
      case 'savings':
        return progress.hasSavingsTarget ? 'Completed!' : 'Not yet achieved'
      case 'early-budget':
        return progress.hasEarlyBudget ? 'Completed!' : 'Not yet achieved'
      case 'consecutive-months':
        return `${progress.consecutiveMonths} / ${badge.requirement} months`
      case 'all-categories':
        return `${progress.categoriesCount} / ${badge.requirement} categories`
      default:
        return ''
    }
  }

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id))
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.has(b.id))

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Achievements</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className='space-y-2'>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Achievements
            </CardTitle>
            <CardDescription>
              {earnedBadges.length} of {BADGES.length} badges earned
            </CardDescription>
          </div>
          <BadgeUI variant="default" className="text-lg px-3 py-1">
            {earnedBadges.length} / {BADGES.length}
          </BadgeUI>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Earned Badges */}
          {earnedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-emerald-700 mb-3">Earned Badges</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="relative p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-300 rounded-lg text-center hover:shadow-md transition-shadow"
                  >
                    <div className="absolute -top-2 -right-2">
                      <div className="bg-emerald-500 text-white rounded-full p-1">
                        <Trophy className="h-3 w-3" />
                      </div>
                    </div>
                    <div className="text-4xl mb-2">{badge.icon}</div>
                    <h5 className="font-semibold text-sm text-gray-900">{badge.name}</h5>
                    <p className="text-xs text-gray-600 mt-1">{badge.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Locked Badges with Progress */}
          {lockedBadges.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-500 mb-3">Locked Badges</h4>
              <div className="space-y-3">
                {lockedBadges.slice(0, 5).map((badge) => {
                  const progressPercent = getBadgeProgress(badge)
                  const progressText = getProgressText(badge)

                  return (
                    <div
                      key={badge.id}
                      className="p-4 bg-gray-50 border border-gray-200 rounded-lg opacity-75 hover:opacity-100 transition-opacity"
                    >
                      <div className="flex items-start gap-3">
                        <div className="text-3xl opacity-40">{badge.icon}</div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h5 className="font-semibold text-sm text-gray-700">{badge.name}</h5>
                            <Lock className="h-3 w-3 text-gray-400" />
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{badge.description}</p>
                          <div className="space-y-1">
                            <Progress value={progressPercent} className="h-2" />
                            <p className="text-xs text-gray-600">{progressText}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
              {lockedBadges.length > 5 && (
                <p className="text-xs text-gray-500 text-center mt-3">
                  +{lockedBadges.length - 5} more badges to unlock
                </p>
              )}
            </div>
          )}

          {/* All earned message */}
          {earnedBadges.length === BADGES.length && (
            <div className="text-center py-6 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-300">
              <div className="text-6xl mb-3">🎉</div>
              <h4 className="font-bold text-lg text-gray-900">Congratulations!</h4>
              <p className="text-sm text-gray-600 mt-1">
                You've earned all available badges!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
