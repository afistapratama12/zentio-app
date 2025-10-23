import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs'
import { BudgetInputForm } from '~/components/budget/BudgetInputForm'
import { ChatSection } from '~/components/budget/ChatSection'
import { BudgetTableSection } from '~/components/budget/BudgetTableSection'
import { type ChatMessage, type BudgetItem } from '~/lib/ai-service'
import { type UploadedFile, uploadMultipleFiles } from '~/lib/file-upload'
import { toast } from 'sonner'
import { useBudgetSession, useUpdateBudgetSession } from '~/hooks/use-budget-session'
import { Loader2 } from 'lucide-react'

interface CreateBudgetWorkspaceProps {
  sessionId?: string
}

export function CreateBudgetWorkspace({ sessionId: existingSessionId }: CreateBudgetWorkspaceProps = {}) {
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [hasEdited, setHasEdited] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [estimatedExpense, setEstimatedExpense] = useState<number | undefined>()
  const [sessionId, setSessionId] = useState<string>(existingSessionId || '')
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'saved' | 'exported'>('draft')

  // Load existing session if sessionId is provided
  const { data: existingSession, isLoading: sessionLoading } = useBudgetSession(existingSessionId || '')
  const updateSessionMutation = useUpdateBudgetSession()

  // Load session data when it's fetched
  useEffect(() => {
    if (existingSession && existingSessionId) {
      const aiGeneratedBudget = existingSession.ai_generated_budget
      
      setBudget(aiGeneratedBudget.budget || [])
      setChatHistory(existingSession.chat_history || [])
      setUploadedFiles(existingSession.uploaded_files || [])
      setEstimatedExpense(existingSession.estimated_expense || undefined)
      setSessionId(existingSession.id)
      setCurrentStatus((existingSession.status as any) || 'draft')
      setShowWorkspace(true)
      
      toast.success('Budget session loaded successfully')
    }
  }, [existingSession, existingSessionId])

  const handleGenerate = (data: {
    sessionId: string
    files: UploadedFile[]
    chatHistory: ChatMessage[]
    budget: BudgetItem[]
    estimatedExpense?: number
  }) => {
    setSessionId(data.sessionId)
    setUploadedFiles(data.files)
    setChatHistory(data.chatHistory)
    setBudget(data.budget)
    setEstimatedExpense(data.estimatedExpense)
    setShowWorkspace(true)
  }

  const handleSendMessage = async (message: string) => {
    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
    }
    setChatHistory((prev) => [...prev, userMessage])

    // TODO: Send to AI service and get response
    // For now, just add a placeholder response
    toast.info('Chat functionality will be implemented soon')
    
    // Placeholder AI response
    setTimeout(() => {
      const aiMessage: ChatMessage = {
        role: 'assistant',
        content: 'I received your message. Full chat functionality will be implemented soon.',
        timestamp: new Date().toISOString(),
      }
      setChatHistory((prev) => [...prev, aiMessage])
    }, 500)
  }

  const handleUploadFiles = async (files: File[]) => {
    try {
      toast.info('Uploading files...')
      // We need userId for upload - will get it from auth context
      // For now, use a placeholder
      const uploaded = await uploadMultipleFiles(files, 'current-user', sessionId)
      setUploadedFiles((prev) => [...prev, ...uploaded])
      toast.success(`${uploaded.length} file(s) uploaded successfully`)
      
      // Add message about uploaded files
      const fileNames = uploaded.map((f) => f.name).join(', ')
      const message: ChatMessage = {
        role: 'user',
        content: `Uploaded additional files: ${fileNames}`,
        timestamp: new Date().toISOString(),
      }
      setChatHistory((prev) => [...prev, message])
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload files')
    }
  }

  const handleSave = async () => {
    if (!sessionId) {
      toast.error('No session found')
      return
    }

    try {
      await updateSessionMutation.mutateAsync({
        sessionId,
        budget,
        chatHistory,
        uploadedFiles,
        status: 'saved',
      })
      
      setCurrentStatus('saved')
      setHasEdited(false)
      toast.success('Budget saved successfully!')
    } catch (error: any) {
      console.error('Error saving budget:', error)
      toast.error('Failed to save budget')
    }
  }

  const handleExport = async (format: 'csv' | 'pdf') => {
    if (!sessionId) {
      toast.error('No session found')
      return
    }

    if (currentStatus !== 'saved') {
      toast.warning('Please save your budget before exporting', {
        description: 'Click the Save button first',
      })
      return
    }

    try {
      // Export logic
      if (format === 'csv') {
        exportToCSV(budget)
      } else {
        exportToPDF(budget, estimatedExpense)
      }

      // Update status to exported
      await updateSessionMutation.mutateAsync({
        sessionId,
        status: 'exported',
      })

      setCurrentStatus('exported')
      toast.success(`Budget exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      console.error('Error exporting budget:', error)
      toast.error('Failed to export budget')
    }
  }

  const exportToCSV = (budgetData: BudgetItem[]) => {
    const headers = ['Category', 'Amount', 'Percentage', 'Notes']
    const rows = budgetData.map((item) => [
      item.category,
      item.amount.toString(),
      `${item.percentage.toFixed(1)}%`,
      item.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `budget_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const exportToPDF = (budgetData: BudgetItem[], estimated?: number) => {
    // Simple PDF export using HTML to print
    const total = budgetData.reduce((sum, item) => sum + item.amount, 0)
    
    const formatCurrency = (amount: number) => {
      return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
      }).format(amount)
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Budget Report</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #059669; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #059669; color: white; }
          .total { font-weight: bold; background-color: #f0fdf4; }
        </style>
      </head>
      <body>
        <h1>Budget Report</h1>
        <p>Generated on: ${new Date().toLocaleDateString('id-ID')}</p>
        ${estimated ? `<p>Estimated Expense: ${formatCurrency(estimated)}</p>` : ''}
        <table>
          <thead>
            <tr>
              <th>Category</th>
              <th>Amount</th>
              <th>Percentage</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            ${budgetData.map((item) => `
              <tr>
                <td>${item.category}</td>
                <td>${formatCurrency(item.amount)}</td>
                <td>${item.percentage.toFixed(1)}%</td>
                <td>${item.notes || '-'}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>Total</td>
              <td>${formatCurrency(total)}</td>
              <td>100%</td>
              <td></td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(htmlContent)
      printWindow.document.close()
      printWindow.print()
    }
  }

  // Show loading state while fetching existing session
  if (existingSessionId && sessionLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-gray-600">Loading budget session...</p>
        </div>
      </div>
    )
  }

  // Show input form first (only if no existing session)
  if (!showWorkspace) {
    return (
      <div className="min-h-[calc(100vh-4rem)] p-6">
        <BudgetInputForm onGenerate={handleGenerate} />
      </div>
    )
  }

  // Show workspace (split screen or tabs)
  return (
    <div className="h-[calc(100vh-4rem)] p-6">
      <div className="h-full">
        {/* Desktop: Split View - Chat 1:3 Budget */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 h-full">
          <div className="lg:col-span-1">
            <ChatSection
              messages={chatHistory}
              files={uploadedFiles}
              isStreaming={false}
              onSendMessage={handleSendMessage}
              onUploadFiles={handleUploadFiles}
              disabled={false}
            />
          </div>
          <div className="lg:col-span-2">
            <BudgetTableSection
              budget={budget}
              estimatedExpense={estimatedExpense}
              hasEdited={hasEdited}
              canRequestFeedback={true}
              onBudgetChange={(newBudget) => {
                setBudget(newBudget)
                setHasEdited(true)
              }}
              onSave={handleSave}
              onExport={handleExport}
              isProcessing={updateSessionMutation.isPending}
            />
          </div>
        </div>

        {/* Mobile: Tabs */}
        <div className="lg:hidden h-full">
          <Tabs defaultValue="chat" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="chat">Chat</TabsTrigger>
              <TabsTrigger value="budget">Budget</TabsTrigger>
            </TabsList>
            <TabsContent value="chat" className="flex-1 mt-4">
              <ChatSection
                messages={chatHistory}
                files={uploadedFiles}
                isStreaming={false}
                onSendMessage={handleSendMessage}
                onUploadFiles={handleUploadFiles}
                disabled={false}
              />
            </TabsContent>
            <TabsContent value="budget" className="flex-1 mt-4">
              <BudgetTableSection
                budget={budget}
                estimatedExpense={estimatedExpense}
                hasEdited={hasEdited}
                canRequestFeedback={true}
                onBudgetChange={(newBudget) => {
                  setBudget(newBudget)
                  setHasEdited(true)
                }}
                onSave={handleSave}
                onExport={handleExport}
                isProcessing={updateSessionMutation.isPending}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
