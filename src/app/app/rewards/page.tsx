'use client'

// import { createFileRoute } from '@tanstack/react-router'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge as BadgeUI } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { BADGES, type Badge } from '@/lib/rewards'
import { Trophy, Award, Target, Lock, TrendingUp } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import { useAuth } from '@/hooks/use-auth'
import { useUserBadges, useUserProgress } from '@/hooks/use-rewards'

export default function Rewards() {
  const { user } = useAuth()
  const { data: earnedBadges = [], isLoading: badgesLoading } = useUserBadges(user?.id || '')
  const { data: progress, isLoading: progressLoading } = useUserProgress(user?.id || '')
  
  const loading = badgesLoading || progressLoading

  const currentProgress = progress || {
    budgetCount: 0,
    transactionCount: 0,
    hasSavingsTarget: false,
    hasEarlyBudget: false,
    consecutiveMonths: 0,
    categoriesCount: 0,
  }

  function getBadgeProgress(badge: Badge): number {
    switch (badge.criteria) {
      case 'budgets':
        return Math.min((currentProgress.budgetCount / badge.requirement) * 100, 100)
      case 'transactions':
        return Math.min((currentProgress.transactionCount / badge.requirement) * 100, 100)
      case 'savings':
        return currentProgress.hasSavingsTarget ? 100 : 0
      case 'early-budget':
        return currentProgress.hasEarlyBudget ? 100 : 0
      case 'consecutive-months':
        return Math.min((currentProgress.consecutiveMonths / badge.requirement) * 100, 100)
      case 'all-categories':
        return Math.min((currentProgress.categoriesCount / badge.requirement) * 100, 100)
      default:
        return 0
    }
  }

  function getProgressText(badge: Badge): string {
    switch (badge.criteria) {
      case 'budgets':
        return `${currentProgress.budgetCount} / ${badge.requirement} budgets created`
      case 'transactions':
        return `${currentProgress.transactionCount} / ${badge.requirement} transactions uploaded`
      case 'savings':
        return currentProgress.hasSavingsTarget ? '✓ Completed!' : 'Set a savings target in your budget'
      case 'early-budget':
        return currentProgress.hasEarlyBudget
          ? '✓ Completed!'
          : 'Create budget in first 7 days of month'
      case 'consecutive-months':
        return `${currentProgress.consecutiveMonths} / ${badge.requirement} consecutive months`
      case 'all-categories':
        return `${currentProgress.categoriesCount} / ${badge.requirement} categories used`
      default:
        return ''
    }
  }

  const earnedBadgeIds = new Set(earnedBadges.map((b) => b.id))
  const lockedBadges = BADGES.filter((b) => !earnedBadgeIds.has(b.id))
  const completionPercent = Math.round((earnedBadges.length / BADGES.length) * 100)

  if (loading) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid gap-6">
              <div className="h-96 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto py-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500" />
            Achievements & Rewards
          </h1>
          <p className="text-gray-600">
            Track your progress and unlock badges by reaching milestones
          </p>
        </div>

        {/* Overall Progress */}
        <Card className="mb-8 border-2 border-emerald-300">
          <CardHeader className="bg-gradient-to-r from-emerald-50 to-teal-50">
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Target className="h-5 w-5 text-emerald-600" />
                Overall Progress
              </span>
              <BadgeUI variant="default" className="text-lg px-4 py-2">
                {completionPercent} %
              </BadgeUI>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <Progress value={completionPercent} className="h-4" />
            </div>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-emerald-600">
                  {earnedBadges.length}
                </div>
                <div className="text-sm text-gray-600 mt-1">Badges Earned</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-blue-600">{currentProgress.budgetCount}</div>
                <div className="text-sm text-gray-600 mt-1">Budgets Created</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-purple-600">
                  {currentProgress.transactionCount}
                </div>
                <div className="text-sm text-gray-600 mt-1">Transactions</div>
              </div>
              <div className="text-center p-4 bg-white rounded-lg border">
                <div className="text-3xl font-bold text-orange-600">
                  {currentProgress.consecutiveMonths}
                </div>
                <div className="text-sm text-gray-600 mt-1">Consecutive Months</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earned Badges */}
        {earnedBadges.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Earned Badges ({earnedBadges.length})
              </CardTitle>
              <CardDescription>Congratulations on your achievements!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {earnedBadges.map((badge) => (
                  <div
                    key={badge.id}
                    className="relative p-6 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-400 rounded-xl text-center hover:shadow-lg hover:scale-105 transition-all duration-300"
                  >
                    <div className="absolute -top-3 -right-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white rounded-full p-2 shadow-lg">
                      <Trophy className="h-4 w-4" />
                    </div>
                    <div className="text-6xl mb-3 animate-bounce">{badge.icon}</div>
                    <h5 className="font-bold text-base text-gray-900 mb-2">{badge.name}</h5>
                    <p className="text-sm text-gray-600">{badge.description}</p>
                    <div className="mt-3 pt-3 border-t border-emerald-200">
                      <BadgeUI variant="default" className="text-xs">
                        ✓ Completed
                      </BadgeUI>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Locked Badges */}
        {lockedBadges.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5 text-gray-400" />
                Locked Badges ({lockedBadges.length})
              </CardTitle>
              <CardDescription>Keep going to unlock these achievements!</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid lg:grid-cols-2 gap-4">
                {lockedBadges.map((badge) => {
                  const progressPercent = getBadgeProgress(badge)
                  const progressText = getProgressText(badge)
                  const isClose = progressPercent >= 50

                  return (
                    <div
                      key={badge.id}
                      className={`p-5 rounded-lg border-2 transition-all ${
                        isClose
                          ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-300 hover:shadow-md'
                          : 'bg-gray-50 border-gray-200 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`text-5xl ${
                            isClose ? 'filter-none' : 'opacity-40 grayscale'
                          }`}
                        >
                          {badge.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h5 className="font-bold text-base text-gray-900">{badge.name}</h5>
                            {isClose && (
                              <BadgeUI variant="outline" className="text-xs">
                                Almost there!
                              </BadgeUI>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3">{badge.description}</p>
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <Progress value={progressPercent} className="h-3 flex-1" />
                              <span className="text-sm font-semibold text-gray-700">
                                {Math.round(progressPercent)}%
                              </span>
                            </div>
                            <div className="flex items-start gap-2 text-xs text-gray-600">
                              <TrendingUp className="h-4 w-4 mt-0.5 flex-shrink-0" />
                              <span>{progressText}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* All Completed */}
        {earnedBadges.length === BADGES.length && (
          <Card className="mt-8 border-2 border-yellow-400">
            <CardContent className="py-12">
              <div className="text-center">
                <div className="text-8xl mb-4 animate-bounce">🎉</div>
                <h2 className="text-4xl font-bold text-gray-900 mb-3">
                  Perfect Score!
                </h2>
                <p className="text-xl text-gray-600 mb-6">
                  You&apos;ve unlocked all {BADGES.length} badges! You&apos;re a budgeting champion! 🏆
                </p>
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-full font-semibold text-lg shadow-lg">
                  <Trophy className="h-6 w-6" />
                  Master Budgeter
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
