"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, FileSpreadsheet, X } from 'lucide-react'
import { toast } from 'sonner'
import Papa from 'papaparse'

interface TransactionUploadFormProps {
  categories: string[]
  onUpload: (transactions: Array<{
    category: string
    item: string
    amount: number
    transaction_type: 'income' | 'expense'
    transaction_date: string
    notes?: string
  }>) => Promise<void>
  isUploading?: boolean
}

export default function TransactionUploadForm({
  categories,
  onUpload,
  isUploading = false,
}: TransactionUploadFormProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<any[]>([])
  const [isParsing, setIsParsing] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please upload a CSV file')
      return
    }

    setFile(selectedFile)
    parseFile(selectedFile)
  }

  const parseFile = (file: File) => {
    setIsParsing(true)

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          // Validate and transform data
          const transactions = results.data.map((row: any, index: number) => {
            // Required fields
            if (!row.date || !row.category || !row.item || !row.amount) {
              throw new Error(`Row ${index + 1}: Missing required fields (date, category, item, amount)`)
            }

            // Validate category
            if (!categories.includes(row.category)) {
              throw new Error(`Row ${index + 1}: Invalid category "${row.category}". Must be one of: ${categories.join(', ')}`)
            }

            // Validate amount
            const amount = parseFloat(row.amount)
            if (isNaN(amount) || amount <= 0) {
              throw new Error(`Row ${index + 1}: Invalid amount "${row.amount}"`)
            }

            // Validate type
            const type = (row.type || 'expense').toLowerCase()
            if (type !== 'income' && type !== 'expense') {
              throw new Error(`Row ${index + 1}: Type must be "income" or "expense"`)
            }

            // Validate date
            const date = new Date(row.date)
            if (isNaN(date.getTime())) {
              throw new Error(`Row ${index + 1}: Invalid date format "${row.date}". Use YYYY-MM-DD`)
            }

            return {
              category: row.category,
              item: row.item,
              amount: amount,
              transaction_type: type as 'income' | 'expense',
              transaction_date: row.date,
              notes: row.notes || undefined,
            }
          })

          setPreview(transactions.slice(0, 5)) // Show first 5 rows
          toast.success(`Parsed ${transactions.length} transactions successfully!`)
        } catch (error: any) {
          toast.error(error.message || 'Failed to parse CSV file')
          setFile(null)
          setPreview([])
        } finally {
          setIsParsing(false)
        }
      },
      error: (error) => {
        toast.error(`Parse error: ${error.message}`)
        setFile(null)
        setPreview([])
        setIsParsing(false)
      },
    })
  }

  const handleUpload = async () => {
    if (!file) return

    setIsParsing(true)
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const transactions = results.data.map((row: any) => ({
            category: row.category,
            item: row.item,
            amount: parseFloat(row.amount),
            transaction_type: (row.type || 'expense').toLowerCase() as 'income' | 'expense',
            transaction_date: row.date,
            notes: row.notes || undefined,
          }))

          await onUpload(transactions)
          setFile(null)
          setPreview([])
          toast.success('Transactions uploaded successfully!')
        } catch (error) {
          toast.error('Failed to upload transactions')
        } finally {
          setIsParsing(false)
        }
      },
    })
  }

  const handleClear = () => {
    setFile(null)
    setPreview([])
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Upload Transactions
        </CardTitle>
        <CardDescription>
          Upload CSV file with your transactions
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* File Upload */}
        {!file ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              id="csv-upload"
              accept=".csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label
              htmlFor="csv-upload"
              className="cursor-pointer flex flex-col items-center gap-2"
            >
              <Upload className="w-12 h-12 text-gray-400" />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  Click to upload CSV file
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  or drag and drop
                </p>
              </div>
            </label>
          </div>
        ) : (
          <div className="space-y-4">
            {/* File Info */}
            <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-8 h-8 text-green-600" />
                <div>
                  <p className="font-medium text-sm">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClear}
                disabled={isUploading || isParsing}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Preview */}
            {preview.length > 0 && (
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-4 py-2 border-b">
                  <p className="text-sm font-medium">
                    Preview (first 5 rows)
                  </p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left">Date</th>
                        <th className="px-4 py-2 text-left">Category</th>
                        <th className="px-4 py-2 text-left">Item</th>
                        <th className="px-4 py-2 text-left">Type</th>
                        <th className="px-4 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((t, i) => (
                        <tr key={i} className="border-b last:border-0">
                          <td className="px-4 py-2">{t.transaction_date}</td>
                          <td className="px-4 py-2">{t.category}</td>
                          <td className="px-4 py-2">{t.item}</td>
                          <td className="px-4 py-2">
                            <span className={`text-xs px-2 py-1 rounded ${
                              t.transaction_type === 'income' 
                                ? 'bg-green-100 text-green-700' 
                                : 'bg-orange-100 text-orange-700'
                            }`}>
                              {t.transaction_type}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-right">
                            {formatCurrency(t.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              className="w-full"
              disabled={isUploading || isParsing || preview.length === 0}
            >
              {isUploading || isParsing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isParsing ? 'Parsing...' : 'Upload Transactions'}
            </Button>
          </div>
        )}

        {/* CSV Format Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900 mb-2">
            📋 CSV Format Requirements:
          </p>
          <ul className="text-xs text-blue-800 space-y-1 ml-4 list-disc">
            <li>Required columns: <code>date</code>, <code>category</code>, <code>item</code>, <code>amount</code></li>
            <li>Optional columns: <code>type</code> (income/expense, default: expense), <code>notes</code></li>
            <li>Date format: YYYY-MM-DD (e.g., 2025-01-15)</li>
            <li>Category must match your budget categories: {categories.join(', ')}</li>
            <li>Example: <code>date,category,item,amount,type,notes</code></li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
