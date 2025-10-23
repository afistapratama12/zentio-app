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
