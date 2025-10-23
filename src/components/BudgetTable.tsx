import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Button } from '~/components/ui/button'
import { Badge } from '~/components/ui/badge'
import { Save, Edit2, X, Check, DollarSign } from 'lucide-react'
import { toast } from 'sonner'
import type { Budget } from '~/routes/app/'

interface BudgetTableProps {
  budget: Budget[]
  onBudgetUpdate?: (updatedBudget: Budget[]) => void
  onSave?: () => void
}

export function BudgetTable({
  budget,
  onBudgetUpdate,
  onSave,
}: BudgetTableProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editValue, setEditValue] = useState('')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const handleEdit = (index: number, currentAmount: number) => {
    setEditingIndex(index)
    setEditValue(currentAmount.toString())
  }

  const handleSaveEdit = (index: number) => {
    const newAmount = parseFloat(editValue)
    if (isNaN(newAmount) || newAmount < 0) {
      toast.error('Jumlah tidak valid')
      return
    }

    const updatedBudget = [...budget]
    const totalAmount = budget.reduce((sum, b) => sum + b.amount, 0)
    const oldAmount = updatedBudget[index].amount

    updatedBudget[index].amount = newAmount

    // Recalculate percentages
    const newTotalAmount = totalAmount - oldAmount + newAmount
    updatedBudget.forEach((item) => {
      item.percentage = Math.round((item.amount / newTotalAmount) * 100)
    })

    onBudgetUpdate?.(updatedBudget)
    setEditingIndex(null)
    toast.success('Budget berhasil diupdate')
  }

  const handleCancelEdit = () => {
    setEditingIndex(null)
    setEditValue('')
  }

  const totalBudget = budget.reduce((sum, b) => sum + b.amount, 0)

  if (budget.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <DollarSign className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Belum ada budget</p>
          <p className="text-sm text-gray-400 mt-2">
            Generate budget dengan AI terlebih dahulu
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Detail Budget ({budget.length} kategori)
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total Budget</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalBudget)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Budget</TableHead>
                <TableHead className="text-center">Persentase</TableHead>
                <TableHead className="w-[100px] text-center">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {budget.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{item.category}</TableCell>
                  <TableCell className="text-right">
                    {editingIndex === index ? (
                      <Input
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        className="w-32 ml-auto"
                        autoFocus
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveEdit(index)
                          }
                        }}
                      />
                    ) : (
                      <span className="font-semibold">
                        {formatCurrency(item.amount)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.percentage}%</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    {editingIndex === index ? (
                      <div className="flex gap-1 justify-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-green-600 hover:bg-green-50"
                          onClick={() => handleSaveEdit(index)}
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-600 hover:bg-red-50"
                          onClick={handleCancelEdit}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEdit(index, item.amount)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {onSave && (
          <div className="mt-4 flex justify-end">
            <Button onClick={onSave} className="gap-2">
              <Save className="w-4 h-4" />
              Simpan Budget ke Database
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
