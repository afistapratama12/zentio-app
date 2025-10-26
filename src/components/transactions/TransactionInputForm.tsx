"use client"

import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Loader2, Upload, X, Image as ImageIcon, Video, CheckCircle2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

interface TransactionInputFormProps {
  categories: string[]
  onAdd: (transaction: any) => Promise<void>
  onBulkAdd: (transactions: any[]) => Promise<void>
  isSubmitting?: boolean
}

interface AnalyzedTransaction {
  item: string
  amount: number
  category: string
  date?: string
}

export default function TransactionInputForm({
  categories,
  onAdd,
  onBulkAdd,
  isSubmitting = false,
}: TransactionInputFormProps) {
  // Manual Form State
  const [manualForm, setManualForm] = useState({
    item: '',
    amount: '',
    category: '',
    type: 'expense' as 'expense' | 'income',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  })

  // Receipt Upload State
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzedTransactions, setAnalyzedTransactions] = useState<AnalyzedTransaction[]>([])
  const [analysisError, setAnalysisError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const resetManualForm = () => {
    setManualForm({
      item: '',
      amount: '',
      category: '',
      type: 'expense',
      notes: '',
      date: new Date().toISOString().split('T')[0],
    })
  }

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!manualForm.item.trim() || !manualForm.amount || !manualForm.category) {
      toast.error('Please fill in all required fields')
      return
    }

    const amount = parseFloat(manualForm.amount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    try {
      await onAdd({
        item: manualForm.item.trim(),
        amount: manualForm.type === 'expense' ? -Math.abs(amount) : Math.abs(amount),
        category: manualForm.category,
        date: manualForm.date,
        notes: manualForm.notes.trim() || undefined,
      })

      toast.success('✅ Transaction added successfully')
      resetManualForm()
    } catch (error) {
      toast.error('Failed to add transaction')
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const validFiles = files.filter(file => {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      return isImage || isVideo
    })

    if (validFiles.length !== files.length) {
      toast.error('Only image and video files are allowed')
    }

    setUploadedFiles(prev => [...prev, ...validFiles])
    setAnalysisError(null)
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    if (uploadedFiles.length === 1) {
      setAnalyzedTransactions([])
      setAnalysisError(null)
    }
  }

  const analyzeReceipts = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please upload at least one receipt')
      return
    }

    setIsAnalyzing(true)
    setAnalysisError(null)
    setAnalyzedTransactions([])

    try {
      const formData = new FormData()
      uploadedFiles.forEach(file => {
        formData.append('files', file)
      })

      const response = await fetch('/api/analyze-transactions', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to analyze receipts')
      }

      if (data.transactions && data.transactions.length > 0) {
        setAnalyzedTransactions(data.transactions)
        toast.success(`✨ Analyzed ${data.transactions.length} transaction(s) from your receipt(s)`)
      } else {
        setAnalysisError('No transactions found in the uploaded receipt(s)')
        toast.warning('No transactions detected in the images')
      }
    } catch (error: any) {
      console.error('Receipt analysis error:', error)
      setAnalysisError(error.message || 'Failed to analyze receipts')
      toast.error('Failed to analyze receipts. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleSaveAnalyzedTransactions = async () => {
    if (analyzedTransactions.length === 0) return

    try {
      const transactionsToSave = analyzedTransactions.map(tx => ({
        item: tx.item || 'Unknown item',
        amount: -Math.abs(tx.amount), // Default as expense
        category: tx.category,
        date: tx.date || new Date().toISOString(),
      }))

      await onBulkAdd(transactionsToSave)

      toast.success(`✅ ${transactionsToSave.length} transaction(s) added successfully`)
      
      // Reset receipt upload
      setUploadedFiles([])
      setAnalyzedTransactions([])
      setAnalysisError(null)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      toast.error('Failed to save transactions')
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-4 h-4" />
    }
    if (file.type.startsWith('video/')) {
      return <Video className="w-4 h-4" />
    }
    return <Upload className="w-4 h-4" />
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transactions</CardTitle>
        <CardDescription>
          Enter transactions manually or upload receipt images/videos
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">✍️ Manual Input</TabsTrigger>
            <TabsTrigger value="receipt">📸 Upload Receipt</TabsTrigger>
          </TabsList>

          {/* Manual Input Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <form onSubmit={handleManualSubmit} className="space-y-4">
              {/* Transaction Type */}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={manualForm.type === 'expense' ? 'default' : 'outline'}
                  className={`flex-1 ${
                    manualForm.type === 'expense'
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'hover:bg-red-50'
                  }`}
                  onClick={() => setManualForm({ ...manualForm, type: 'expense' })}
                >
                  💸 Expense
                </Button>
                <Button
                  type="button"
                  variant={manualForm.type === 'income' ? 'default' : 'outline'}
                  className={`flex-1 ${
                    manualForm.type === 'income'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'hover:bg-emerald-50'
                  }`}
                  onClick={() => setManualForm({ ...manualForm, type: 'income' })}
                >
                  💰 Income
                </Button>
              </div>

              {/* Item Name */}
              <div className="space-y-2">
                <Label htmlFor="item">Item / Description *</Label>
                <Input
                  id="item"
                  placeholder="e.g., Lunch, Groceries, Salary"
                  value={manualForm.item}
                  onChange={(e) => setManualForm({ ...manualForm, item: e.target.value })}
                  required
                />
              </div>

              {/* Amount & Category */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="amount">Amount (Rp) *</Label>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="50000"
                    value={manualForm.amount}
                    onChange={(e) => setManualForm({ ...manualForm, amount: e.target.value })}
                    required
                    min="0"
                    step="100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={manualForm.category}
                    onValueChange={(value) => setManualForm({ ...manualForm, category: value })}
                  >
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Date */}
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="notes">Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  placeholder="Add any additional details..."
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  '✅ Add Transaction'
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Receipt Upload Tab */}
          <TabsContent value="receipt" className="space-y-4 mt-4">
            {/* Upload Area */}
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-emerald-500 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                Images (JPG, PNG, WEBP) or Videos (MP4, MOV) of your receipts
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            {/* Uploaded Files List */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <Label>Uploaded Files ({uploadedFiles.length})</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {uploadedFiles.map((file, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getFileIcon(file)}
                        <div>
                          <p className="text-sm font-medium text-gray-900">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {(file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={isAnalyzing}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Analyze Button */}
                {analyzedTransactions.length === 0 && (
                  <Button
                    onClick={analyzeReceipts}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Analyzing with AI...
                      </>
                    ) : (
                      <>
                        ✨ Analyze Receipt{uploadedFiles.length > 1 ? 's' : ''}
                      </>
                    )}
                  </Button>
                )}
              </div>
            )}

            {/* Analysis Error */}
            {analysisError && (
              <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-900">Analysis Failed</p>
                  <p className="text-xs text-red-700 mt-1">{analysisError}</p>
                </div>
              </div>
            )}

            {/* Analyzed Transactions */}
            {analyzedTransactions.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-emerald-700">
                    <CheckCircle2 className="w-4 h-4 inline mr-2" />
                    Detected Transactions ({analyzedTransactions.length})
                  </Label>
                  <Badge variant="outline" className="bg-emerald-50 text-emerald-700">
                    Ready to save
                  </Badge>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
                  {analyzedTransactions.map((tx, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between p-3 bg-white border rounded-lg"
                    >
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {tx.item || 'Unknown item'}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {tx.category}
                          </Badge>
                          {tx.date && (
                            <span className="text-xs text-gray-500">
                              {new Date(tx.date).toLocaleDateString('id-ID')}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-sm font-semibold text-red-600">
                        {formatCurrency(tx.amount)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSaveAnalyzedTransactions}
                  className="w-full bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      ✅ Save {analyzedTransactions.length} Transaction(s)
                    </>
                  )}
                </Button>
              </div>
            )}

            {/* Empty State */}
            {uploadedFiles.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">Upload receipt images or videos to get started</p>
                <p className="text-xs mt-1">AI will automatically extract transaction details</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
