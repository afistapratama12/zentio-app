import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '~/components/ui/table'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Trash2, Receipt } from 'lucide-react'

interface Transaction {
  item: string
  amount: number
  category: string
  date?: string
}

interface TransactionsListProps {
  transactions: Transaction[]
  onDelete?: (index: number) => void
}

export function TransactionsList({
  transactions,
  onDelete,
}: TransactionsListProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Makanan: 'bg-orange-100 text-orange-700',
      Minuman: 'bg-blue-100 text-blue-700',
      Transportasi: 'bg-purple-100 text-purple-700',
      Belanja: 'bg-pink-100 text-pink-700',
      Hiburan: 'bg-yellow-100 text-yellow-700',
      Kesehatan: 'bg-green-100 text-green-700',
      Pendidikan: 'bg-indigo-100 text-indigo-700',
      Tagihan: 'bg-red-100 text-red-700',
      'Lain-lain': 'bg-gray-100 text-gray-700',
    }
    return colors[category] || colors['Lain-lain']
  }

  const totalAmount = transactions.reduce((sum, t) => sum + t.amount, 0)

  if (transactions.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Receipt className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">Belum ada transaksi</p>
          <p className="text-sm text-gray-400 mt-2">
            Upload struk atau input manual untuk mulai tracking pengeluaran
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
            <Receipt className="w-5 h-5" />
            Daftar Transaksi ({transactions.length})
          </CardTitle>
          <div className="text-right">
            <div className="text-sm text-gray-500">Total</div>
            <div className="text-lg font-bold text-emerald-600">
              {formatCurrency(totalAmount)}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead className="text-right">Jumlah</TableHead>
                <TableHead>Tanggal</TableHead>
                {onDelete && <TableHead className="w-[50px]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((transaction, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">
                    {transaction.item}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="secondary"
                      className={getCategoryColor(transaction.category)}
                    >
                      {transaction.category}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatCurrency(transaction.amount)}
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {formatDate(transaction.date)}
                  </TableCell>
                  {onDelete && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(index)}
                        className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
