// Shared types used across the application

export interface Budget {
  category: string
  amount: number
  percentage: number
  [key: string]: string | number
}

export interface Transaction {
  item: string
  amount: number
  category: string
  date?: string
}

export interface UserProfile {
  name?: string
  age?: number
  gender?: string
  marital_status?: string
  job?: string
  location?: string
  investment_level?: string
  financial_type?: string
}

export interface BudgetHistory {
  id: string
  user_id: string
  period: string
  ai_generated_budget: {
    explanation?: string
    budget: Budget[]
    savings_target?: number
  }
  created_at: string
}

export interface BudgetRealization {
  id: string
  user_id: string
  session_id: string
  category: string
  planned_amount: number
  realized_income: number
  realized_expense: number
  notes?: string | null
  realization_date: string
  source?: 'auto' | 'manual' | 'hybrid'
  created_at: string
  updated_at: string
}

export interface BudgetTransaction {
  id: string
  user_id: string
  session_id: string
  category: string
  item: string
  amount: number
  transaction_type: 'income' | 'expense'
  transaction_date: string
  source: 'upload' | 'manual'
  notes?: string | null
  created_at: string
  updated_at: string
}

export interface BudgetRealizationInsight {
  id: string
  user_id: string
  session_id: string
  ai_insight: string
  analysis_data?: any
  created_at: string
  updated_at: string
}

export interface RealizationAnalysis {
  totalPlanned: number
  totalIncome: number
  totalExpense: number
  netSavings: number
  savingsPercentage: number
  expenseToIncomeRatio: number
  categories: {
    category: string
    planned: number
    income: number
    expense: number
    variance: number
    variancePercentage: number
    status: 'saved' | 'overspent' | 'ontrack'
  }[]
  aiInsight?: string
}
