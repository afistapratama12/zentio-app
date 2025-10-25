'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs'
import { BudgetInputForm } from '../budget/BudgetInputForm'
import { ChatSection } from '../budget/ChatSection'
import { BudgetTableSection } from '../budget/BudgetTableSection'
import { type ChatMessage, type BudgetItem, chatWithAI } from '../../lib/ai-service'
import { type UploadedFile, uploadMultipleFiles } from '../../lib/file-upload'
import { toast } from 'sonner'
import { useBudgetSession, useUpdateBudgetSession } from '../../hooks/use-budget-session'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { useRouter } from 'next/navigation'
import { sanitizeAIJson } from '@/lib/cleaner'

interface CreateBudgetWorkspaceProps {
  sessionId?: string
}

export function CreateBudgetWorkspace({ sessionId: existingSessionId }: CreateBudgetWorkspaceProps = {}) {
  const router = useRouter()

  const { user, isLoading } = useAuth()
  const [showWorkspace, setShowWorkspace] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([])
  const [firstPrompt, setFirstPrompt] = useState<ChatMessage | null>(null)
  const [budget, setBudget] = useState<BudgetItem[]>([])
  const [budgetChange, setBudgetChange] = useState<BudgetItem[] | null>(null)
  const [hasEdited, setHasEdited] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
  const [pendingUploadedFiles, setPendingUploadedFiles] = useState<File[]>([])
  const [estimatedExpense, setEstimatedExpense] = useState<number | undefined>()
  const [sessionId, setSessionId] = useState<string>(existingSessionId || '')
  const [currentStatus, setCurrentStatus] = useState<'draft' | 'saved' | 'exported' | 'on-edit'>('draft')
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasPendingBudgetChange, setHasPendingBudgetChange] = useState(false)
  const [loadingOverlayBudget, setLoadingOverlayBudget] = useState(false)
  const [hasLoadedSession, setHasLoadedSession] = useState(false) // Flag to prevent re-loading

  // Load existing session if sessionId is provided
  const { data: existingSession, isLoading: sessionLoading } = useBudgetSession(existingSessionId || '')
  const updateSessionMutation = useUpdateBudgetSession()

  // Load session data when it's fetched
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login')
    }

    // Only load session data once when first mounted
    if (existingSession && existingSessionId && !hasLoadedSession) {
      const aiGeneratedBudget = existingSession.ai_generated_budget
      
      setBudget(aiGeneratedBudget.budget || [])
      setChatHistory(existingSession.chat_history || [])
      setFirstPrompt(existingSession.first_prompt || null)
      setUploadedFiles(existingSession.uploaded_files || [])
      setEstimatedExpense(existingSession.estimated_expense || undefined)
      setSessionId(existingSession.id)
      setCurrentStatus((existingSession.status as any) || 'draft')
      setShowWorkspace(true)
      setHasLoadedSession(true) // Mark as loaded
      
      toast.success('Budget session loaded successfully')
    }
  }, [existingSession, existingSessionId, user, isLoading, hasLoadedSession])

  const handleGenerate = (data: {
    sessionId: string
    files: UploadedFile[]
    chatHistory: ChatMessage[]
    firstPrompt: ChatMessage
    budget: BudgetItem[]
    estimatedExpense?: number
  }) => {
    setSessionId(data.sessionId)
    setUploadedFiles(data.files)
    setChatHistory(data.chatHistory)
    setBudget(data.budget)
    setEstimatedExpense(data.estimatedExpense)
    setFirstPrompt(data.firstPrompt)
    setShowWorkspace(true)
  }

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || isStreaming) return

    const messageMedia: Array<{
      type: 'image_url'; image_url: { url: string, filename?: string, type?: string }
    }> = []

    if (pendingUploadedFiles) {
      // process upload files
      const uploaded = await uploadMultipleFiles(pendingUploadedFiles, user?.id || '', sessionId)
      
      // add to uploaded files state and store to database later
      setUploadedFiles((prev) => [...prev, ...uploaded])
      
      // add to message media
      for (const file of pendingUploadedFiles) {
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        messageMedia.push({
          type: 'image_url',
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            filename: file.name,
            type: file.type,
          },
        })
      }
    }

    const mssageContent = [
      { type: 'text', text: message },
      ...messageMedia,
    ]

    // Add user message to chat
    const userMessage: ChatMessage = {
      role: 'user',
      content: mssageContent,
      timestamp: new Date().toISOString(),
    }
    setChatHistory((prev) => [...prev, userMessage])

    // Create placeholder for AI response
    const aiMessageId = Date.now().toString()
    const aiMessage: ChatMessage = {
      role: 'assistant',
      content: '',
      timestamp: new Date().toISOString(),
    }
    setChatHistory((prev) => [...prev, aiMessage])

    setIsStreaming(true)

    try {
      // Prepare messages for AI (excluding the empty AI message we just added)
      const messagesToSend = [...chatHistory, userMessage]

      let fullResponse = ''
      let currentTextResponse = ''

      let changeBudgetOn = false
      let afterChangeBudget = false
      let hasDoneCleanFirstPart = false

      let firstParts: {type: 'text', content: string} = {type: 'text', content: '' }
      let secondParts: {type: 'budget-change', content: string} = {type: 'budget-change', content: '' }
      let thirdParts: {type: 'text', content: string} = {type: 'text', content: '' }

      // Call AI with streaming
      await chatWithAI(
        messagesToSend,
        budget,
        firstPrompt,
        (chunk) => {
          fullResponse += chunk
          currentTextResponse += chunk

          if (currentTextResponse.includes('--end-budget-change--')) {
            changeBudgetOn = false
            afterChangeBudget = true
            currentTextResponse = ''
          }

          // active when --start-b is found
          if (changeBudgetOn) {
            if (!hasDoneCleanFirstPart) {
              firstParts.content = firstParts.content.replace('\n--start-budget', '')
              firstParts.content = firstParts.content.replace('--start-budget', '')
              hasDoneCleanFirstPart = true
            }
            secondParts.content += chunk
          }

          // active after budget change part
          if (!changeBudgetOn && afterChangeBudget) {
            thirdParts.content += chunk
          }

          // active before budget change part
          if (!changeBudgetOn && !afterChangeBudget) {
            firstParts.content += chunk
          }

          if (currentTextResponse.includes('--start-budget')) {
            setHasPendingBudgetChange(true)
            setLoadingOverlayBudget(true)
            // setPreviousBudget(() => [...budget]) // Backup current budget
            changeBudgetOn = true
            currentTextResponse = ''
          }

          // Update the AI message in real-time
          setChatHistory((prev) => {
            const newHistory = [...prev]
            const lastMessage = newHistory[newHistory.length - 1]
            if (lastMessage.role === 'assistant') {
              if (!afterChangeBudget && !changeBudgetOn) {
                lastMessage.content = fullResponse
              } else {
                if (thirdParts.content.length == 0) {
                  lastMessage.content = [firstParts, secondParts]
                } else {
                  lastMessage.content = [firstParts, secondParts, thirdParts]
                }

                lastMessage.full_content = fullResponse
              }
            }
            return newHistory
          })
        }
      )
      
      // Save updated chat history to session
      if (sessionId) {
        await updateSessionMutation.mutateAsync({
          sessionId,
          chatHistory: [
            ...chatHistory, 
            userMessage, 
            (!changeBudgetOn && !afterChangeBudget) ? { ...aiMessage, content: fullResponse } : {
              ...aiMessage,
              content: thirdParts.content.length == 0 ? [firstParts, secondParts] : [firstParts, secondParts, thirdParts],
              full_content: fullResponse
            }
          ],
        })
      }

      // set new budget if changed
      // parsing object in fullResponse string in the middle of --start-budget-change-- and --end-budget-change--
      const budgetChangeMatch = fullResponse.match(/--start-budget-change--([\s\S]*?)--end-budget-change--/)
      if (budgetChangeMatch) {
        const budgetJsonString = budgetChangeMatch[1].trim()
        // console.log("matched budget change json:", budgetChangeMatch[1])
        try {
          const newBudget: BudgetItem[] = JSON.parse(sanitizeAIJson(budgetJsonString))
          // setBudget(newBudget)
          setBudgetChange(newBudget)
        } catch (error) {
          console.error('Error parsing budget change JSON:', error)
          toast.error('Failed to parse budget changes from AI response')
        }
      }
      
      setLoadingOverlayBudget(false)

    } catch (error: any) {
      console.error('Error in chat:', error)
      
      // Update the last message with error
      setChatHistory((prev) => {
        const newHistory = [...prev]
        const lastMessage = newHistory[newHistory.length - 1]
        if (lastMessage.role === 'assistant') {
          lastMessage.content = `Maaf, terjadi kesalahan: ${error.message || 'Tidak dapat terhubung ke AI'}. Silakan coba lagi.`
        }
        return newHistory
      })
      
      toast.error('Gagal mengirim pesan')
    } finally {
      setIsStreaming(false)
    }
  }

  const handleUploadFiles = async (files: File[]) => {
    setPendingUploadedFiles((prev) => [...prev, ...files])
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

  const handleApplyBudgetChange = async () => {
    if (!sessionId) {
      toast.error('No session found')
      return
    }

    if (!budgetChange) {
      toast.info('No budget changes to apply')
      return
    }

    try {
      // Save the new budget to database
      await updateSessionMutation.mutateAsync({
        sessionId,
        budget: budgetChange,
        chatHistory,
        uploadedFiles,
        status: 'saved',
      })
      
      setCurrentStatus('saved')
      setHasPendingBudgetChange(false)
      setBudgetChange(null)
      setHasEdited(false)
      // setPreviousBudget([]) // Clear backup
      toast.success('Budget berhasil disimpan!')
    } catch (error: any) {
      console.error('Error applying budget change:', error)
      toast.error('Gagal menyimpan perubahan budget')
    }
  }

  const handleRejectBudgetChange = () => {
    // Restore previous budget
    // setBudget([...previousBudget])
    setBudgetChange(null)
    setHasPendingBudgetChange(false)
    // setPreviousBudget([])
    toast.info('Perubahan budget dibatalkan')
  }

  const handleOnEdit = async () => {
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
        status: 'on-edit'
      })
      
      setCurrentStatus('on-edit')
      setHasEdited(true)
    } catch (error: any) {
      console.error('Error updating budget status:', error)
      toast.error('Failed to update budget status')
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
              isStreaming={isStreaming}
              onSendMessage={handleSendMessage}
              onUploadFiles={handleUploadFiles}
              disabled={isStreaming}
              hasPendingBudgetChange={hasPendingBudgetChange}
              onApplyBudgetChange={handleApplyBudgetChange}
              onRejectBudgetChange={handleRejectBudgetChange}
            />
          </div>
          <div className="lg:col-span-2">
            <BudgetTableSection
              budget={budget}
              budgetChange={budgetChange}
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
              loadingOverlay={loadingOverlayBudget}
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
                isStreaming={isStreaming}
                onSendMessage={handleSendMessage}
                onUploadFiles={handleUploadFiles}
                disabled={isStreaming}
                hasPendingBudgetChange={hasPendingBudgetChange}
                onApplyBudgetChange={handleApplyBudgetChange}
                onRejectBudgetChange={handleRejectBudgetChange}
              />
            </TabsContent>
            <TabsContent value="budget" className="flex-1 mt-4">
              <BudgetTableSection
                budget={budget}
                budgetChange={budgetChange}
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
