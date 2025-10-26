import { v4 } from "uuid";
import { useCallback, useEffect, useState, useRef, ChangeEvent } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Plus,
  Trash2,
  Save,
  Download,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { type BudgetItem } from "../../lib/ai-service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface BudgetTableSectionProps {
  budget: BudgetItem[];
  budgetChange: BudgetItem[] | null; // if this not null, its mean there is a pending change
  estimatedExpense?: number;
  status: string
  // onBudgetChange: (newBudget: BudgetItem[]) => void;
  // onRequestFeedback?: () => void;
  onSave: (currentBudget: BudgetItemRow[]) => Promise<void>;
  onEdit?: () => void;
  // onExport?: (format: "csv" | "pdf") => void;
  // hasEdited: boolean;
  canRequestFeedback?: boolean; // Deprecated: Feedback is now always available when edited
  isProcessing?: boolean;
  readOnly?: boolean;
  loadingOverlay?: boolean;
}

export interface BudgetItemRow {
  id: string;
  category: string;
  amount: number;
  percentage: number;
  notes?: string;
}

export function BudgetTableSection({
  budget,
  budgetChange,
  estimatedExpense,
  status,
  // onBudgetChange,
  // onRequestFeedback,
  onEdit,
  onSave,
  // onExport,
  // hasEdited,
  isProcessing = false,
  readOnly = false,
  loadingOverlay = false,
}: BudgetTableSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);

  const [currentBudget, setCurrentBudget] = useState<BudgetItemRow[]>(() => budget.map(b => ({id: v4(), ...b})));
  
  // Ref to track if onEdit has been called for current edit session
  const hasCalledOnEditRef = useRef(false);

  useEffect(() => {
    if (budgetChange) {
      setCurrentBudget(budgetChange.map((b) => ({id: v4(), ...b})))
    } else {
      setCurrentBudget(budget.map(b => ({id: v4(), ...b})) );
    }
  }, [budget, budgetChange]);

  // Reset hasCalledOnEdit flag when status changes or onSave is called
  useEffect(() => {
    if (status !== 'on-edit') {
      hasCalledOnEditRef.current = false;
    }
  }, [status]);

  // Helper function to call onEdit only once
  const triggerOnEditOnce = useCallback(() => {
    if (onEdit && !hasCalledOnEditRef.current) {
      hasCalledOnEditRef.current = true;
      onEdit();
    }
  }, [onEdit]);

  // Wrap onSave to reset the flag after save
  const handleSaveWrapper = useCallback(() => {
    onSave(currentBudget);
    // Reset flag after save so next edit can trigger onEdit again
    hasCalledOnEditRef.current = false;
  }, [onSave, currentBudget]);

  const totalBudget = currentBudget.reduce((sum, item) => sum + item.amount, 0);

  const isOverBudget = estimatedExpense ? totalBudget > estimatedExpense : false

  const handleUpdate = (e: ChangeEvent<HTMLInputElement>, id: string, field: keyof BudgetItem) => {
    e.preventDefault()

    const newBudget = currentBudget.map((item) => {
      if (item.id === id) {
        return { 
          ...item, 
          [field]: field === "amount" ? parseFloat(e.target.value) || 0 : e.target.value 
        };
      }

      return item;
    })

    setCurrentBudget(newBudget);
    
    // Trigger onEdit once
    triggerOnEditOnce();
  }


  const handleAddRow = () => {
    const newItem: BudgetItemRow = {
      id: v4(),
      category: "",
      amount: 0,
      percentage: 0,
      notes: "Add description",
    };
    setCurrentBudget([...currentBudget, newItem]);
    setEditingId(newItem.category);
    
    // Trigger onEdit once
    triggerOnEditOnce();
  };

  const handleDeleteRow = (id: string) => {
    if (currentBudget.length <= 1) {
      toast.error("Cannot delete the last budget item");
      return;
    }
    const newBudget = currentBudget.filter((item) => item.id !== id);
    // Recalculate percentages
    const total = newBudget.reduce((sum, item) => sum + item.amount, 0);
    const updatedBudget = newBudget.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
    setCurrentBudget(updatedBudget);
    toast.success("Budget item deleted");
    
    // Trigger onEdit once
    triggerOnEditOnce();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (percentage: number) => {
    return `${percentage.toFixed(1)}%`;
  };

  const handleCellEdit = (id: string) => {
    if (!readOnly) {
      setEditingId(id);
    }
  };

  const handleCellBlur = () => {
    setEditingId(null);
    // Recalculate percentages
    const total = currentBudget.reduce((sum, item) => sum + item.amount, 0);
    const updatedBudget = currentBudget.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
    setCurrentBudget(updatedBudget);
  };

    // export disable ketika status 'on-edit' dan ada hasPendingBudgetChange

  const handleExport = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      // Export logic
      if (format === 'csv') {
        exportToCSV(budget)
      } else {
        exportToPDF(budget, estimatedExpense)
      }

      toast.success(`Budget exported as ${format.toUpperCase()}`)
    } catch (error: any) {
      console.error('Error exporting budget:', error)
      toast.error('Failed to export budget')
    }
  }, [budget, estimatedExpense]);

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

  return (
    <Card className={cn("flex flex-col h-full relative")}>
      {/* Loading Overlay */}
      {loadingOverlay && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
              <div
                className="absolute inset-0 w-12 h-12 rounded-full border-4 border-emerald-100 border-t-transparent animate-spin"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-gray-900">
                Processing your budget...
              </p>
              <p className="text-xs text-gray-500 mt-1">
                AI is analyzing and updating the data
              </p>
            </div>
          </div>
        </div>
      )}

      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <CardTitle>Budget Plan</CardTitle>
          <div className="flex gap-2">
            {/* {hasEdited && onRequestFeedback && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRequestFeedback}
                disabled={isProcessing}
                className="text-emerald-600 border-emerald-600 hover:bg-emerald-50"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Get AI Feedback
                  </>
                )}
              </Button> */}
            {/* )} */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveWrapper}
              disabled={isProcessing || isOverBudget || status === 'draft' || status === 'saved'}
            >
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("csv")}
              disabled={editingId !== null || isProcessing || status === 'on-edit' || budgetChange !== null}
            >
              <Download className="w-4 h-4 mr-2" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport("pdf")}
              disabled={editingId !== null || isProcessing || status === 'on-edit' || budgetChange !== null}
            >
              <Download className="w-4 h-4 mr-2" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        {/* Budget Summary */}
        <div className="p-4 bg-gray-50 border-b space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">
              Total Budget:
            </span>
            <span className="text-lg font-bold text-gray-900">
              {formatCurrency(totalBudget)}
            </span>
          </div>
          {estimatedExpense && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">
                  Estimated Expense:
                </span>
                <span className="text-sm text-gray-900">
                  {formatCurrency(estimatedExpense)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Remaining:</span>
                <span
                  className={cn(
                    "text-sm font-medium",
                    isOverBudget ? "text-red-600" : "text-emerald-600"
                  )}
                >
                  {formatCurrency(estimatedExpense - totalBudget)}
                </span>
              </div>
            </>
          )}
          {isOverBudget && (
            <div className="flex items-center gap-2 text-red-600 bg-red-50 px-3 py-2 rounded-md">
              <AlertCircle className="w-4 h-4" />
              <span className="text-xs font-medium">
                Total budget exceeds estimated expense limit
              </span>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto p-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[25%]">Category</TableHead>
                <TableHead className="w-[20%]">Amount</TableHead>
                <TableHead className="w-[15%]">Percentage</TableHead>
                <TableHead className="w-[35%]">Notes</TableHead>
                {!readOnly && <TableHead className="w-[5%]"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentBudget.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="align-top">
                    {editingId === item.id ? (
                      <Input
                        value={item.category}
                        onChange={(e) => handleUpdate(e, item.id, "category")}
                        onBlur={handleCellBlur}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.id)}
                        className={cn(
                          "py-1 px-2 rounded whitespace-normal break-words",
                          !readOnly && "cursor-pointer hover:bg-gray-100"
                        )}
                      >
                        {item.category}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) => handleUpdate(e, item.id, "amount")}
                        onBlur={handleCellBlur}
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.id)}
                        className={cn(
                          "py-1 px-2 rounded",
                          !readOnly && "cursor-pointer hover:bg-gray-100"
                        )}
                      >
                        {formatCurrency(item.amount)}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="py-1 px-2 text-gray-600">
                      {formatPercentage(item.percentage)}
                    </div>
                  </TableCell>
                  <TableCell className="align-top">
                    {editingId === item.id ? (
                      <Input
                        value={item.notes || ""}
                        onChange={(e) => handleUpdate(e, item.id, "notes")}
                        onBlur={handleCellBlur}
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.category)}
                        className={cn(
                          "py-1 px-2 rounded text-sm text-gray-600 whitespace-normal break-words",
                          !readOnly && "cursor-pointer hover:bg-gray-100"
                        )}
                      >
                        {item.notes || "-"}
                      </div>
                    )}
                  </TableCell>
                  {!readOnly && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteRow(item.category)}
                        disabled={budget.length <= 1}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {!readOnly && (
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                disabled={isProcessing}
                className="w-full border-dashed hover:cursor-pointer"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Budget Item
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
