"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface TransactionManualFormProps {
  categories: string[]
  onAdd: (transaction: {
    category: string
    item: string
    amount: number
    transaction_type: 'income' | 'expense'
    transaction_date: string
    notes?: string
  }) => Promise<void>
  isSubmitting?: boolean
}

export default function TransactionManualForm({
  categories,
  onAdd,
  isSubmitting = false,
}: TransactionManualFormProps) {
  const [formData, setFormData] = useState({
    category: '',
    item: '',
    amount: '',
    transaction_type: 'expense' as 'income' | 'expense',
    transaction_date: new Date().toISOString().split('T')[0],
    notes: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.category || !formData.item || !formData.amount) {
      toast.error('Please fill all required fields')
      return
    }

    try {
      await onAdd({
        category: formData.category,
        item: formData.item,
        amount: parseFloat(formData.amount),
        transaction_type: formData.transaction_type,
        transaction_date: formData.transaction_date,
        notes: formData.notes || undefined,
      })

      // Reset form
      setFormData({
        category: '',
        item: '',
        amount: '',
        transaction_type: 'expense',
        transaction_date: new Date().toISOString().split('T')[0],
        notes: '',
      })

      toast.success('Transaction added successfully!')
    } catch (error) {
      console.error('Error adding transaction:', error)
      toast.error('Failed to add transaction')
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add Transaction Manually</CardTitle>
        <CardDescription>
          Enter transaction details one by one
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date">Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.transaction_date}
                onChange={(e) => setFormData({ ...formData, transaction_date: e.target.value })}
                required
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category *</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-emerald-50 via-white to-teal-50">
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Transaction Type */}
            <div className="space-y-2">
              <Label>Type *</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="transaction_type"
                    value="expense"
                    checked={formData.transaction_type === 'expense'}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'expense' })}
                    className="w-4 h-4"
                  />
                  <span>Expense</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="transaction_type"
                    value="income"
                    checked={formData.transaction_type === 'income'}
                    onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value as 'income' })}
                    className="w-4 h-4"
                  />
                  <span>Income</span>
                </label>
              </div>
            </div>

            {/* Amount */}
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (Rp) *</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                min="0"
                step="1000"
                required
              />
            </div>
          </div>

          {/* Item Description */}
          <div className="space-y-2">
            <Label htmlFor="item">Item / Description *</Label>
            <Input
              id="item"
              type="text"
              placeholder="e.g., Groceries, Salary, Rent payment"
              value={formData.item}
              onChange={(e) => setFormData({ ...formData, item: e.target.value })}
              required
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={2}
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Plus className="w-4 h-4 mr-2" />
            )}
            Add Transaction
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
