"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Trash2, Edit2, Check, X, Filter } from 'lucide-react'
import { BudgetTransaction } from '@/types'
import { toast } from 'sonner'

interface TransactionListProps {
  transactions: BudgetTransaction[]
  onUpdate: (id: string, updates: Partial<BudgetTransaction>) => Promise<void>
  onDelete: (id: string) => Promise<void>
  isLoading?: boolean
}

export default function TransactionList({
  transactions,
  onUpdate,
  onDelete,
  isLoading = false,
}: TransactionListProps) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<BudgetTransaction>>({})
  const [filterCategory, setFilterCategory] = useState<string>('')
  const [filterType, setFilterType] = useState<string>('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const handleEdit = (transaction: BudgetTransaction) => {
    setEditingId(transaction.id)
    setEditData({
      item: transaction.item,
      amount: transaction.amount,
      notes: transaction.notes || '',
    })
  }

  const handleSaveEdit = async (id: string) => {
    try {
      await onUpdate(id, editData)
      setEditingId(null)
      setEditData({})
      toast.success('Transaction updated')
    } catch (error) {
      toast.error('Failed to update transaction')
    }
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditData({})
  }

  const handleDelete = async (id: string, item: string) => {
    if (window.confirm(`Delete transaction "${item}"?`)) {
      try {
        await onDelete(id)
        toast.success('Transaction deleted')
      } catch (error) {
        toast.error('Failed to delete transaction')
      }
    }
  }

  // Get unique categories
  const categories = Array.from(new Set(transactions.map(t => t.category))).sort()

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    if (filterCategory && t.category !== filterCategory) return false
    if (filterType && t.transaction_type !== filterType) return false
    return true
  })

  // Group by date
  const groupedByDate = filteredTransactions.reduce((acc, t) => {
    const date = t.transaction_date
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(t)
    return acc
  }, {} as Record<string, BudgetTransaction[]>)

  const dates = Object.keys(groupedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center text-gray-500">
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Add transactions manually or upload CSV file</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Transaction List ({filteredTransactions.length})</CardTitle>
          
          {/* Filters */}
          <div className="flex gap-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="text-sm border rounded px-3 py-1"
            >
              <option value="">All Types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>

            {(filterCategory || filterType) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterCategory('')
                  setFilterType('')
                }}
              >
                <X className="w-4 h-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {dates.map(date => (
            <div key={date}>
              {/* Date Header */}
              <div className="bg-gray-50 px-4 py-2 rounded-t-lg border-b">
                <p className="font-medium text-sm text-gray-700">
                  {formatDate(date)}
                </p>
              </div>

              {/* Transactions Table */}
              <div className="border rounded-b-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Item</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Notes</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupedByDate[date].map((transaction) => {
                      const isEditing = editingId === transaction.id

                      return (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">
                            {transaction.category}
                          </TableCell>
                          <TableCell>
                            {isEditing ? (
                              <Input
                                value={editData.item || ''}
                                onChange={(e) => setEditData({ ...editData, item: e.target.value })}
                                className="h-8"
                              />
                            ) : (
                              transaction.item
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={
                                transaction.transaction_type === 'income'
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : 'bg-orange-100 text-orange-700 border-orange-300'
                              }
                            >
                              {transaction.transaction_type}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {isEditing ? (
                              <Input
                                type="number"
                                value={editData.amount || ''}
                                onChange={(e) => setEditData({ ...editData, amount: parseFloat(e.target.value) })}
                                className="h-8 text-right"
                              />
                            ) : (
                              <span className={transaction.transaction_type === 'income' ? 'text-green-600' : ''}>
                                {formatCurrency(transaction.amount)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {isEditing ? (
                              <Input
                                value={editData.notes || ''}
                                onChange={(e) => setEditData({ ...editData, notes: e.target.value })}
                                className="h-8"
                                placeholder="Notes..."
                              />
                            ) : (
                              transaction.notes || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleSaveEdit(transaction.id)}
                                    disabled={isLoading}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleCancelEdit}
                                    disabled={isLoading}
                                  >
                                    <X className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(transaction)}
                                    disabled={isLoading}
                                  >
                                    <Edit2 className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(transaction.id, transaction.item)}
                                    disabled={isLoading}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
