"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Save, Calculator, Loader2 } from 'lucide-react'
import { BudgetItem } from '@/lib/ai-service'
import { toast } from 'sonner'

interface RealizationFormProps {
  budget: BudgetItem[]
  sessionId: string
  existingRealization?: Array<{
    category: string
    planned_amount: number
    realized_income: number
    realized_expense: number
    notes?: string | null
  }>
  onSave: (data: Array<{
    category: string
    planned_amount: number
    realized_income: number
    realized_expense: number
    notes?: string
  }>) => Promise<void>
  onCalculate: () => void
  isSaving?: boolean
}

export default function RealizationForm({
  budget,
  sessionId,
  existingRealization,
  onSave,
  onCalculate,
  isSaving = false,
}: RealizationFormProps) {
  const [formData, setFormData] = useState<Array<{
    category: string
    planned_amount: number
    realized_income: number
    realized_expense: number
    notes: string
  }>>([])

  // Initialize form data from budget or existing realization
  useEffect(() => {
    if (existingRealization && existingRealization.length > 0) {
      setFormData(
        existingRealization.map((r) => ({
          category: r.category,
          planned_amount: r.planned_amount,
          realized_income: r.realized_income,
          realized_expense: r.realized_expense,
          notes: r.notes || '',
        }))
      )
    } else {
      setFormData(
        budget.map((b) => ({
          category: b.category,
          planned_amount: b.amount,
          realized_income: 0,
          realized_expense: 0,
          notes: '',
        }))
      )
    }
  }, [budget, existingRealization])

  const handleInputChange = (index: number, field: 'realized_income' | 'realized_expense' | 'notes', value: string | number) => {
    const newData = [...formData]
    if (field === 'notes') {
      newData[index][field] = value as string
    } else {
      newData[index][field] = typeof value === 'string' ? parseFloat(value) || 0 : value
    }
    setFormData(newData)
  }

  const handleSave = async () => {
    // Validate that at least one field is filled
    const hasData = formData.some(d => d.realized_income > 0 || d.realized_expense > 0)
    
    if (!hasData) {
      toast.error('Please enter at least one income or expense value')
      return
    }

    await onSave(formData)
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculateVariance = (planned: number, expense: number) => {
    const variance = expense - planned
    const percentage = planned > 0 ? (variance / planned) * 100 : 0
    return { variance, percentage }
  }

  const totalPlanned = formData.reduce((sum, d) => sum + d.planned_amount, 0)
  const totalIncome = formData.reduce((sum, d) => sum + d.realized_income, 0)
  const totalExpense = formData.reduce((sum, d) => sum + d.realized_expense, 0)
  const netSavings = totalIncome - totalExpense

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Budget Realization Input</CardTitle>
            <CardDescription>
              Enter your actual income and expenses for each budget category
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={onCalculate}
              variant="outline"
              size="sm"
              disabled={isSaving || totalIncome === 0 && totalExpense === 0}
            >
              <Calculator className="w-4 h-4 mr-2" />
              Analyze
            </Button>
            <Button
              onClick={handleSave}
              size="sm"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Save
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-xs text-blue-600 font-medium mb-1">Total Budget</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(totalPlanned)}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-xs text-green-600 font-medium mb-1">Total Income</p>
              <p className="text-lg font-bold text-green-900">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <p className="text-xs text-orange-600 font-medium mb-1">Total Expense</p>
              <p className="text-lg font-bold text-orange-900">{formatCurrency(totalExpense)}</p>
            </div>
            <div className={`p-4 rounded-lg ${netSavings >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
              <p className={`text-xs font-medium mb-1 ${netSavings >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                Net Savings
              </p>
              <p className={`text-lg font-bold ${netSavings >= 0 ? 'text-emerald-900' : 'text-red-900'}`}>
                {formatCurrency(netSavings)}
              </p>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[200px]">Category</TableHead>
                  <TableHead className="text-right">Planned</TableHead>
                  <TableHead className="text-right">Income</TableHead>
                  <TableHead className="text-right">Expense</TableHead>
                  <TableHead className="text-right">Variance</TableHead>
                  <TableHead className="w-[200px]">Notes</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formData.map((item, index) => {
                  const { variance, percentage } = calculateVariance(item.planned_amount, item.realized_expense)
                  const isOver = variance > 0
                  const isSaved = variance < -item.planned_amount * 0.05

                  return (
                    <TableRow key={item.category}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right text-gray-600">
                        {formatCurrency(item.planned_amount)}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.realized_income || ''}
                          onChange={(e) => handleInputChange(index, 'realized_income', e.target.value)}
                          className="text-right"
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.realized_expense || ''}
                          onChange={(e) => handleInputChange(index, 'realized_expense', e.target.value)}
                          className="text-right"
                          placeholder="0"
                          min="0"
                          step="1000"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        {item.realized_expense > 0 && (
                          <div className="flex flex-col items-end gap-1">
                            <span className={`font-medium ${isOver ? 'text-red-600' : isSaved ? 'text-green-600' : 'text-gray-600'}`}>
                              {formatCurrency(Math.abs(variance))}
                            </span>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${
                                isOver ? 'bg-red-50 text-red-700 border-red-200' : 
                                isSaved ? 'bg-green-50 text-green-700 border-green-200' : 
                                'bg-gray-50 text-gray-700'
                              }`}
                            >
                              {isOver ? '🔴' : isSaved ? '🟢' : '🟡'} {percentage > 0 ? '+' : ''}{percentage.toFixed(1)}%
                            </Badge>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={item.notes}
                          onChange={(e) => handleInputChange(index, 'notes', e.target.value)}
                          placeholder="Optional notes..."
                          className="min-h-[60px] text-sm"
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          {/* Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>💡 Tip:</strong> Enter your actual income and expenses for each category. 
              Click "Analyze" to get AI insights on your budgeting performance!
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
