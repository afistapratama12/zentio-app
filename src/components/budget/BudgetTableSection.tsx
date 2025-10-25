import { useMemo, useState } from "react";
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
  Sparkles,
} from "lucide-react";
import { type BudgetItem } from "../../lib/ai-service";
import { toast } from "sonner";
import { cn } from "../../lib/utils";

interface BudgetTableSectionProps {
  budget: BudgetItem[];
  budgetChange: BudgetItem[] | null;
  estimatedExpense?: number;
  onBudgetChange: (newBudget: BudgetItem[]) => void;
  onRequestFeedback?: () => void;
  onSave?: () => void;
  onExport?: (format: "csv" | "pdf") => void;
  hasEdited: boolean;
  canRequestFeedback?: boolean; // Deprecated: Feedback is now always available when edited
  isProcessing?: boolean;
  readOnly?: boolean;
  loadingOverlay?: boolean;
}

export function BudgetTableSection({
  budget,
  budgetChange,
  estimatedExpense,
  onBudgetChange,
  onRequestFeedback,
  onSave,
  onExport,
  hasEdited,
  isProcessing = false,
  readOnly = false,
  loadingOverlay = false,
}: BudgetTableSectionProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const currBudget = useMemo(() => {
    return budgetChange || budget;
  }, [budget, budgetChange]);

  const totalBudget = currBudget.reduce((sum, item) => sum + item.amount, 0);

  const isOverBudget =estimatedExpense ? totalBudget > estimatedExpense : false

  const handleUpdateItem = (
    id: string,
    field: keyof BudgetItem,
    value: string | number
  ) => {
    const newBudget = currBudget.map((item) => {
      if (item.category === id) {
        return { ...item, [field]: value };
      }
      return item;
    });
    onBudgetChange(newBudget);
  };

  const handleAddRow = () => {
    const newItem: BudgetItem = {
      category: "New Category",
      amount: 0,
      percentage: 0,
      notes: "Add description",
    };
    onBudgetChange([...currBudget, newItem]);
    setEditingId(newItem.category);
  };

  const handleDeleteRow = (category: string) => {
    if (currBudget.length <= 1) {
      toast.error("Cannot delete the last budget item");
      return;
    }
    const newBudget = currBudget.filter((item) => item.category !== category);
    // Recalculate percentages
    const total = newBudget.reduce((sum, item) => sum + item.amount, 0);
    const updatedBudget = newBudget.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
    onBudgetChange(updatedBudget);
    toast.success("Budget item deleted");
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

  const handleCellEdit = (category: string) => {
    if (!readOnly) {
      setEditingId(category);
    }
  };

  const handleCellBlur = () => {
    setEditingId(null);
    // Recalculate percentages
    const total = currBudget.reduce((sum, item) => sum + item.amount, 0);
    const updatedBudget = currBudget.map((item) => ({
      ...item,
      percentage: total > 0 ? (item.amount / total) * 100 : 0,
    }));
    onBudgetChange(updatedBudget);
  };

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
            {hasEdited && onRequestFeedback && (
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
              </Button>
            )}
            {onSave && (
              <Button
                variant="outline"
                size="sm"
                onClick={onSave}
                disabled={isProcessing || isOverBudget}
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            )}
            {onExport && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("csv")}
                  disabled={isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onExport("pdf")}
                  disabled={isProcessing}
                >
                  <Download className="w-4 h-4 mr-2" />
                  PDF
                </Button>
              </>
            )}
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
              {currBudget.map((item) => (
                <TableRow key={item.category}>
                  <TableCell className="align-top">
                    {editingId === item.category ? (
                      <Input
                        value={item.category}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.category,
                            "category",
                            e.target.value
                          )
                        }
                        onBlur={handleCellBlur}
                        autoFocus
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.category)}
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
                    {editingId === item.category ? (
                      <Input
                        type="number"
                        value={item.amount}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.category,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                        onBlur={handleCellBlur}
                        className="h-8"
                      />
                    ) : (
                      <div
                        onClick={() => handleCellEdit(item.category)}
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
                    {editingId === item.category ? (
                      <Input
                        value={item.notes || ""}
                        onChange={(e) =>
                          handleUpdateItem(
                            item.category,
                            "notes",
                            e.target.value
                          )
                        }
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
