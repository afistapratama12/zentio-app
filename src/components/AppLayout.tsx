'use client'

// import { Link, useLocation, useRouter } from '@tanstack/react-router'
// import { useLocation } from "next/Navigation"
import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  History,
  Trophy,
  User,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  Wallet,
} from 'lucide-react'
import { Button } from './ui/button'
import { useLogout } from '../hooks/use-auth'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'

interface AppLayoutProps {
  children: React.ReactNode
  hideLayout?: boolean
  defaultSidebarCollapse?: boolean
}

export default function AppLayout({ children, hideLayout = false, defaultSidebarCollapse = false }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const logoutMutation = useLogout()

  const handleLogout = async () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        router.push('/login')
      }
    })
  }

  useEffect(() => {
    setSidebarCollapsed(defaultSidebarCollapse)
  }, [defaultSidebarCollapse])

  if (hideLayout) {
    return <>{children}</>
  }

  const navItems = [
    { to: '/app', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { to: '/app/history', icon: History, label: 'History' },
    { to: '/app/rewards', icon: Trophy, label: 'Rewards' },
    { to: '/app/profile', icon: User, label: 'Profile' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
        <div className="flex items-center justify-between px-4 h-16">
          {/* Left: Logo & Menu */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="h-5 w-5 text-gray-700" />
            </button>

            <Link href="/app" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
                <img src="/logo.svg" alt="Zentio" className="w-8 h-8" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Zentio
                </h1>
                <p className="text-xs text-gray-500">AI Budgeting</p>
              </div>
            </Link>
          </div>

          {/* Right: User Menu */}
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:cursor-pointer"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Sidebar Desktop */}
      <aside
        className={`fixed top-16 left-0 bottom-0 z-30 bg-white border-r border-gray-200 transition-all duration-300 hidden lg:block ${
          sidebarCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-6 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 shadow-sm"
          >
            <ChevronLeft
              className={`h-4 w-4 text-gray-600 transition-transform ${
                sidebarCollapsed ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Navigation */}
          <nav className={`flex-1 space-y-2 ${
            sidebarCollapsed ? 'px-2 py-4' : 'px-4 py-4'
          }`}>
            {navItems.map((item) => {
              const isActive = item.exact
                ? pathname === item.to
                : pathname.startsWith(item.to)
              const Icon = item.icon

              return (
                <Link
                  key={item.to}
                  href={item.to}
                  className={`flex items-center gap-3 px-4 py-4 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-gray-700 hover:bg-gray-100'
                  } ${sidebarCollapsed ? 'justify-center' : ''}`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && (
                    <span className="font-medium">{item.label}</span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          {!sidebarCollapsed && (
            <div className="p-4 border-t border-gray-200">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-emerald-600" />
                  <span className="text-sm font-semibold text-gray-900">
                    Pro Tip
                  </span>
                </div>
                <p className="text-xs text-gray-600">
                  Upload receipts weekly for better budget insights!
                </p>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {sidebarOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="fixed top-0 left-0 bottom-0 w-72 bg-white z-50 lg:hidden shadow-2xl">
            <div className="flex flex-col h-full">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <img src="/logo.svg" alt="Zentio" className="w-8 h-8" />
                  </div>
                  <div>
                    <h1 className="text-lg font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                      Zentio
                    </h1>
                    <p className="text-xs text-gray-500">AI Budgeting</p>
                  </div>
                </div>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="h-5 w-5 text-gray-700" />
                </button>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = item.exact
                    ? location.pathname === item.to
                    : location.pathname.startsWith(item.to)
                  const Icon = item.icon

                  return (
                    <Link
                      key={item.to}
                      href={item.to}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-gray-200">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Wallet className="h-4 w-4 text-emerald-600" />
                    <span className="text-sm font-semibold text-gray-900">
                      Pro Tip
                    </span>
                  </div>
                  <p className="text-xs text-gray-600">
                    Upload receipts weekly for better budget insights!
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </>
      )}

      {/* Main Content */}
      <main
        className={`pt-16 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-16' : 'lg:pl-64'
        }`}
      >
        {children}
      </main>
    </div>
  )
}
