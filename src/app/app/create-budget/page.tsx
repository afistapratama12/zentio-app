'use client'
// import { createFileRoute } from '@tanstack/react-router'
import { CreateBudgetWorkspace } from '@/components/budget/CreateBudgetWorkspace'
import AppLayout from '@/components/AppLayout'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Component that reads search params - must be wrapped in Suspense
function CreateBudgetContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("sessionId")
  
  return <CreateBudgetWorkspace sessionId={sessionId || undefined} />
}

export default function CreateBudget() {
  return (
    <AppLayout>
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
        </div>
      }>
        <CreateBudgetContent />
      </Suspense>
    </AppLayout>
  )
}
