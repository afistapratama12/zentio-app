import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { Upload, X, FileText, Image as ImageIcon, Video, Loader2, Sparkles } from 'lucide-react'
import { useAuth } from '../../hooks/use-auth'
import { useUserProfile } from '../../hooks/use-profile'
import { useCreateBudgetSession } from '../../hooks/use-budget-session'
import { uploadMultipleFiles, validateFile, formatFileSize, getFileTypeCategory, type UploadedFile } from '../../lib/file-upload'
import { analyzeFiles, generateBudgetStream, type Transaction, type BudgetItem, type ChatMessage } from '../../lib/ai-service'
import { toast } from 'sonner'

interface BudgetInputFormProps {
  onGenerate: (data: {
    sessionId: string
    files: UploadedFile[]
    chatHistory: ChatMessage[]
    budget: BudgetItem[]
    estimatedExpense?: number
  }) => void
}

export function BudgetInputForm({ onGenerate }: BudgetInputFormProps) {
  const { user } = useAuth()
  const { data: profile } = useUserProfile(user?.id || '')
  const createSessionMutation = useCreateBudgetSession()

  const [files, setFiles] = useState<File[]>([])
  const [manualTransactions, setManualTransactions] = useState('')
  const [budgetType, setBudgetType] = useState<'1-month' | '1-year' | 'custom'>('1-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [estimatedExpense, setEstimatedExpense] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStep, setProcessingStep] = useState('')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    
    const validFiles: File[] = []
    for (const file of selectedFiles) {
      const validation = validateFile(file)
      if (validation.valid) {
        validFiles.push(file)
      } else {
        toast.error(validation.error)
      }
    }

    setFiles(prev => [...prev, ...validFiles])
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleGenerate = async () => {
    if (!user) return

    // Validation: Must have at least one data source
    if (files.length === 0 && !manualTransactions.trim()) {
      toast.error('Please provide transaction data', {
        description: 'Upload files or enter manual transactions (or both)'
      })
      return
    }

    if (!startDate || !endDate) {
      toast.error('Please select budget period')
      return
    }

    setIsProcessing(true)

    try {
      const sessionId = crypto.randomUUID()

      // Step 1: Upload files
      if (files.length > 0) {
        setProcessingStep('Uploading files...')
        const uploadedFiles = await uploadMultipleFiles(
          files,
          user.id,
          sessionId,
          (progress, fileName) => {
            setProcessingStep(`Uploading ${fileName}... ${Math.round(progress)}%`)
          }
        )

        // Step 2: Analyze files
        setProcessingStep('Analyzing files with AI...')
        const extractedTransactions = await analyzeFiles(uploadedFiles, (message) => {
          setProcessingStep(message)
        })

        // [DEPRECATED] Step 3: Parse manual transactions
        // let manualTrans: Transaction[] = []
        // if (manualTransactions.trim()) {
        //   setProcessingStep('Processing manual transactions...')
        //   const lines = manualTransactions.trim().split('\n')
        //   manualTrans = lines.map(line => {
        //     const parts = line.split(',').map(p => p.trim())
        //     return {
        //       item: parts[0] || 'Unknown',
        //       amount: parseFloat(parts[1]) || 0,
        //       category: parts[2] || 'Uncategorized',
        //       date: parts[3] || new Date().toISOString().split('T')[0],
        //     }
        //   })
        // }

        // Combine all transactions
        // const allTransactions = [...extractedTransactions]

        // if (extractedTransactions.length === 0) {
        //   toast.error('No transactions found. Please check your data.')
        //   setIsProcessing(false)
        //   return
        // }

        // Step 3: Generate budget with AI streaming
        setProcessingStep('Generating budget with AI...')
        
        const chatHistory: ChatMessage[] = [
          {
            role: 'system',
            content: 'Budget generation started',
            timestamp: new Date().toISOString(),
          }
        ]

        let generatedBudget: BudgetItem[] = []
        let explanation = ''
        let insights: string[] = []
        let savingsTarget: number | undefined

        await generateBudgetStream(
          {
            historyTransactions: extractedTransactions,
            inputManual: manualTransactions.trim() || undefined,
            budgetType,
            startDate,
            endDate,
            estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
            userProfile: profile
          },
          (_chunk) => {
            // Streaming chunk received (not displayed in UI)
          },
          (result) => {
            generatedBudget = result.budget
            explanation = result.explanation
            insights = result.insights || []
            savingsTarget = result.savingsTarget

            chatHistory.push({
              role: 'assistant',
              content: explanation + '\n\n' + insights.join('\n'),
              timestamp: new Date().toISOString(),
            })
          }
        )

        // Step 5: Save to database
        setProcessingStep('Saving budget session...')
        const session = await createSessionMutation.mutateAsync({
          userId: user.id,
          budgetType,
          startDate,
          endDate,
          estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
          budget: generatedBudget,
          explanation,
          chatHistory,
          uploadedFiles,
          insights,
          savingsTarget,
        })

        toast.success('Budget generated successfully!')

        // Navigate to workspace
        onGenerate({
          sessionId: session.id,
          files: uploadedFiles,
          chatHistory,
          budget: generatedBudget,
          estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
        })

      } else {
        // Only manual transactions
        setProcessingStep('Processing manual transactions...')
        // const lines = manualTransactions.trim().split('\n')
        // const transactions: Transaction[] = lines.map(line => {
        //   const parts = line.split(',').map(p => p.trim())
        //   return {
        //     item: parts[0] || 'Unknown',
        //     amount: parseFloat(parts[1]) || 0,
        //     category: parts[2] || 'Uncategorized',
        //     date: parts[3] || new Date().toISOString().split('T')[0],
        //   }
        // })

        // Generate budget
        setProcessingStep('Generating budget with AI...')
        
        const chatHistory: ChatMessage[] = [
          {
            role: 'system',
            content: 'Budget generation started',
            timestamp: new Date().toISOString(),
          }
        ]

        let generatedBudget: BudgetItem[] = []
        let explanation = ''
        let insights: string[] = []
        let savingsTarget: number | undefined

        await generateBudgetStream(
          {
            historyTransactions: [],
            inputManual: manualTransactions.trim(),
            budgetType,
            startDate,
            endDate,
            estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
            userProfile: profile
          },
          (_chunk) => {
            // Streaming chunk received (not displayed in UI)
          },
          (result) => {
            generatedBudget = result.budget
            explanation = result.explanation
            insights = result.insights || []
            savingsTarget = result.savingsTarget

            chatHistory.push({
              role: 'assistant',
              content: explanation + '\n\n' + insights.join('\n'),
              timestamp: new Date().toISOString(),
            })
          }
        )

        // Save to database
        setProcessingStep('Saving budget session...')
        const session = await createSessionMutation.mutateAsync({
          userId: user.id,
          budgetType,
          startDate,
          endDate,
          estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
          budget: generatedBudget,
          explanation,
          chatHistory,
          uploadedFiles: [],
          insights,
          savingsTarget,
        })

        toast.success('Budget generated successfully!')

        // Navigate to workspace
        onGenerate({
          sessionId: session.id,
          files: [],
          chatHistory,
          budget: generatedBudget,
          estimatedExpense: estimatedExpense ? parseFloat(estimatedExpense) : undefined,
        })
      }

    } catch (error: any) {
      console.error('Error generating budget:', error)
      toast.error(error.message || 'Failed to generate budget')
    } finally {
      setIsProcessing(false)
      setProcessingStep('')
    }
  }

  const getFileIcon = (file: File) => {
    const category = getFileTypeCategory(file)
    switch (category) {
      case 'csv':
        return <FileText className="h-5 w-5" />
      case 'image':
        return <ImageIcon className="h-5 w-5" />
      case 'video':
        return <Video className="h-5 w-5" />
      default:
        return <FileText className="h-5 w-5" />
    }
  }

  // Set default dates
  if (!startDate) {
    const today = new Date()
    setStartDate(today.toISOString().split('T')[0])
    
    if (budgetType === '1-month') {
      const nextMonth = new Date(today)
      nextMonth.setMonth(nextMonth.getMonth() + 1)
      setEndDate(nextMonth.toISOString().split('T')[0])
    } else if (budgetType === '1-year') {
      const nextYear = new Date(today)
      nextYear.setFullYear(nextYear.getFullYear() + 1)
      setEndDate(nextYear.toISOString().split('T')[0])
    }
  }

  if (isProcessing) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin text-emerald-600" />
              <h3 className="text-lg font-semibold">{processingStep}</h3>
              <p className="text-sm text-gray-600">AI is analyzing your data and creating a personalized budget...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
          <Sparkles className="w-4 h-4" />
          AI Budget Generator
        </div>
        <h1 className="text-3xl font-bold mb-2">Create New Budget</h1>
        <p className="text-gray-600">Upload your transaction data and let AI create a personalized budget plan</p>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Flexible Input Options</h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>✓ Upload files only (CSV, images, videos)</li>
              <li>✓ Enter transactions manually only</li>
              <li>✓ Combine both methods for more comprehensive data</li>
            </ul>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Transaction Data</CardTitle>
          <CardDescription>
            Choose one or both methods: Upload files (CSV, images, videos) and/or enter transactions manually.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Upload */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Upload Files (Optional)</Label>
              {files.length > 0 && (
                <span className="text-xs text-emerald-600 font-medium">
                  {files.length} file{files.length > 1 ? 's' : ''} selected
                </span>
              )}
            </div>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-emerald-500 hover:bg-emerald-50 transition-colors">
                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                <span className="text-sm text-gray-600">Click to upload or drag and drop</span>
                <span className="text-xs text-gray-500 mt-1">CSV, Images, or Videos (Max 50MB each)</span>
                <input
                  type="file"
                  className="hidden"
                  multiple
                  accept=".csv,image/*,video/*"
                  onChange={handleFileSelect}
                />
              </label>
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="mt-4 space-y-2">
                {files.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFileIcon(file)}
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          {/* Manual Input */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label htmlFor="manual">Manual Transactions (Optional)</Label>
              {manualTransactions.trim() && (
                <span className="text-xs text-emerald-600 font-medium">
                  {manualTransactions.trim().split('\n').length} transaction{manualTransactions.trim().split('\n').length > 1 ? 's' : ''} entered
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              Format: Item, Amount, Category, Date (YYYY-MM-DD) - One per line
            </p>
            <Textarea
              id="manual"
              placeholder="Example:&#10;Coffee, 25000, Food, 2024-01-15&#10;Taxi, 50000, Transport, 2024-01-16&#10;Groceries, 150000, Food, 2024-01-17"
              value={manualTransactions}
              onChange={(e) => setManualTransactions(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-gray-600 mt-2">
              💡 Tip: You can use both file uploads and manual input together for more comprehensive data
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Budget Configuration</CardTitle>
          <CardDescription>Configure your budget planning period and constraints</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Budget Type */}
          <div>
            <Label htmlFor="type">Budget Type</Label>
            <Select value={budgetType} onValueChange={(value: any) => {
              setBudgetType(value)
              // Auto-adjust dates
              const today = new Date(startDate || new Date())
              if (value === '1-month') {
                const nextMonth = new Date(today)
                nextMonth.setMonth(nextMonth.getMonth() + 1)
                setEndDate(nextMonth.toISOString().split('T')[0])
              } else if (value === '1-year') {
                const nextYear = new Date(today)
                nextYear.setFullYear(nextYear.getFullYear() + 1)
                setEndDate(nextYear.toISOString().split('T')[0])
              }
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-month">1 Month Ahead</SelectItem>
                <SelectItem value="1-year">1 Year Ahead</SelectItem>
                <SelectItem value="custom">Custom Period</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          {/* Estimated Expense */}
          <div>
            <Label htmlFor="expense">Estimated Maximum Expense (Optional)</Label>
            <p className="text-xs text-gray-500 mt-1 mb-2">
              AI will ensure total budget doesn't exceed this amount
            </p>
            <Input
              id="expense"
              type="number"
              placeholder="e.g., 5000000"
              value={estimatedExpense}
              onChange={(e) => setEstimatedExpense(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Summary before generate */}
      {(files.length > 0 || manualTransactions.trim()) && (
        <Card className="border-emerald-200 bg-emerald-50">
          <CardContent className="">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 bg-emerald-600 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-emerald-900 mb-2">Ready to Generate</h3>
                <div className="space-y-1 text-sm text-emerald-800">
                  {files.length > 0 && (
                    <p>📁 {files.length} file{files.length > 1 ? 's' : ''} uploaded</p>
                  )}
                  {manualTransactions.trim() && (
                    <p>✍️ {manualTransactions.trim().split('\n').length} manual transaction{manualTransactions.trim().split('\n').length > 1 ? 's' : ''}</p>
                  )}
                  {files.length > 0 && manualTransactions.trim() && (
                    <p className="text-emerald-600 font-medium mt-2">💪 Using combined data for better accuracy!</p>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end">
        <Button
          size="lg"
          onClick={handleGenerate}
          disabled={isProcessing || (files.length === 0 && !manualTransactions.trim())}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 disabled:cursor-not-allowed text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-5 w-5" />
              Generate AI Budget
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
