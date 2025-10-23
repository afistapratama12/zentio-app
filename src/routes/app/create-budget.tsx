import { createFileRoute } from '@tanstack/react-router'
import { CreateBudgetWorkspace } from '~/components/budget/CreateBudgetWorkspace'
import AppLayout from '~/components/AppLayout'

// Define search params type
type CreateBudgetSearch = {
  sessionId?: string
}

export const Route = createFileRoute('/app/create-budget')({
  component: CreateBudgetPage,
  validateSearch: (search: Record<string, unknown>): CreateBudgetSearch => {
    return {
      sessionId: typeof search?.sessionId === 'string' ? search.sessionId : undefined,
    }
  },
})

function CreateBudgetPage() {
  const { sessionId } = Route.useSearch()
  
  return (
    <AppLayout>
      <CreateBudgetWorkspace sessionId={sessionId} />
    </AppLayout>
  )
}
