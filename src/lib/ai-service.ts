import type { UploadedFile } from './file-upload'
import { parseCSV } from './file-upload'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY

export interface Transaction {
  item: string
  amount: number
  category: string
  date: string
}

export interface BudgetItem {
  category: string
  amount: number
  percentage: number
  notes?: string
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
}

export interface BudgetGenerationParams {
  transactions: Transaction[]
  budgetType: '1-month' | '1-year' | 'custom'
  startDate: string
  endDate: string
  estimatedExpense?: number
  userProfile?: {
    name?: string
    job?: string
    financial_type?: string
  }
}

export interface BudgetGenerationResult {
  budget: BudgetItem[]
  explanation: string
  savingsTarget?: number
  insights: string[]
}

/**
 * Analyze uploaded files and extract transactions
 */
export async function analyzeFiles(
  files: UploadedFile[],
  onProgress?: (message: string) => void
): Promise<Transaction[]> {
  const allTransactions: Transaction[] = []

  for (const file of files) {
    if (onProgress) {
      onProgress(`Analyzing ${file.name}...`)
    }

    try {
      if (file.type === 'csv') {
        // Parse CSV directly
        const response = await fetch(file.url)
        const blob = await response.blob()
        const csvFile = new File([blob], file.name, { type: 'text/csv' })
        const data = await parseCSV(csvFile)
        
        // Convert CSV data to transactions
        const transactions = data.map((row: any) => ({
          item: row.item || row.description || row.name || 'Unknown',
          amount: parseFloat(row.amount || row.price || row.total || 0),
          category: row.category || 'Uncategorized',
          date: row.date || new Date().toISOString().split('T')[0],
        }))

        allTransactions.push(...transactions)
      } else if (file.type === 'image') {
        // Analyze image using OpenAI Vision
        const transactions = await analyzeImageWithAI(file.url)
        allTransactions.push(...transactions)
      } else if (file.type === 'video') {
        // Extract frames and analyze
        const transactions = await analyzeVideoWithAI(file.url)
        allTransactions.push(...transactions)
      }
    } catch (error) {
      console.error(`Error analyzing ${file.name}:`, error)
      if (onProgress) {
        onProgress(`⚠️ Failed to analyze ${file.name}`)
      }
    }
  }

  return allTransactions
}

/**
 * Analyze image using OpenAI Vision API
 */
async function analyzeImageWithAI(imageUrl: string): Promise<Transaction[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data extraction assistant. Extract transaction information from receipt or invoice images.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all transactions from this image. Return a JSON array with format: [{"item": "...", "amount": number, "category": "...", "date": "YYYY-MM-DD"}]. If date is not visible, use today\'s date. Categorize items appropriately (Food, Transport, Entertainment, etc.).'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)
    
    return parsed.transactions || []
  } catch (error) {
    console.error('Error analyzing image:', error)
    return []
  }
}

/**
 * Analyze video by extracting key frames
 */
async function analyzeVideoWithAI(videoUrl: string): Promise<Transaction[]> {
  // For now, we'll just analyze the first frame
  // In production, you might want to extract multiple frames
  try {
    // This is a simplified version
    // In reality, you'd extract frames from video first
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a financial data extraction assistant.'
          },
          {
            role: 'user',
            content: `Analyze this video URL for transaction data: ${videoUrl}. Return empty array if no transactions found.`
          }
        ],
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      }),
    })

    if (!response.ok) {
      return []
    }

    const data = await response.json()
    const content = data.choices[0].message.content
    const parsed = JSON.parse(content)
    
    return parsed.transactions || []
  } catch (error) {
    console.error('Error analyzing video:', error)
    return []
  }
}

/**
 * Generate budget using OpenAI with streaming
 */
export async function generateBudgetStream(
  params: BudgetGenerationParams,
  onChunk: (chunk: string) => void,
  onComplete: (result: BudgetGenerationResult) => void
): Promise<void> {
  try {
    // Calculate period
    const start = new Date(params.startDate)
    const end = new Date(params.endDate)
    const months = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))

    // Build prompt
    const prompt = buildBudgetPrompt(params, months)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are Zentio AI, an expert financial advisor specializing in budget planning for Indonesian users. Always respond in Indonesian.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        max_tokens: 2000,
        temperature: 0.7,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) {
      throw new Error('No response body')
    }

    const decoder = new TextDecoder()
    let buffer = ''
    let fullResponse = ''

    while (true) {
      const { done, value } = await reader.read()
      
      if (done) break

      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        if (line.trim() === '' || line.trim() === 'data: [DONE]') continue
        
        if (line.startsWith('data: ')) {
          try {
            const json = JSON.parse(line.slice(6))
            const content = json.choices[0]?.delta?.content
            
            if (content) {
              fullResponse += content
              onChunk(content)
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }

    // Parse the complete response
    const result = parseBudgetResponse(fullResponse, params.estimatedExpense)
    onComplete(result)

  } catch (error) {
    console.error('Error generating budget:', error)
    throw error
  }
}

function buildBudgetPrompt(params: BudgetGenerationParams, months: number): string {
  const { transactions, budgetType, estimatedExpense, userProfile } = params

  let prompt = `Saya memiliki data transaksi berikut:\n\n`
  
  // Add transaction summary
  const totalSpent = transactions.reduce((sum, t) => sum + t.amount, 0)
  const categories = [...new Set(transactions.map(t => t.category))]
  
  prompt += `Total transaksi: ${transactions.length}\n`
  prompt += `Total pengeluaran: Rp ${totalSpent.toLocaleString('id-ID')}\n`
  prompt += `Kategori yang ada: ${categories.join(', ')}\n\n`

  // Add user context if available
  if (userProfile) {
    prompt += `Profil user:\n`
    if (userProfile.name) prompt += `- Nama: ${userProfile.name}\n`
    if (userProfile.job) prompt += `- Pekerjaan: ${userProfile.job}\n`
    if (userProfile.financial_type) prompt += `- Tipe keuangan: ${userProfile.financial_type}\n`
    prompt += `\n`
  }

  // Add budget requirement
  prompt += `Tolong buatkan budget planning untuk periode ${months} bulan kedepan (${budgetType}).\n`
  
  if (estimatedExpense) {
    prompt += `Estimasi pengeluaran maksimal: Rp ${estimatedExpense.toLocaleString('id-ID')}\n`
  }

  prompt += `\n**PENTING: Response HARUS dalam format JSON yang valid, tidak ada teks tambahan sebelum atau sesudah JSON.**\n\n`
  prompt += `Format JSON yang diharapkan:\n`
  prompt += `\`\`\`json\n`
  prompt += `{\n`
  prompt += `  "explanation": "penjelasan singkat tentang budget ini (string)",\n`
  prompt += `  "budget": [\n`
  prompt += `    {\n`
  prompt += `      "category": "Nama Kategori",\n`
  prompt += `      "amount": 1000000,\n`
  prompt += `      "percentage": 20.5,\n`
  prompt += `      "notes": "catatan opsional"\n`
  prompt += `    }\n`
  prompt += `  ],\n`
  prompt += `  "savingsTarget": 500000,\n`
  prompt += `  "insights": ["insight 1", "insight 2", "insight 3"]\n`
  prompt += `}\n`
  prompt += `\`\`\`\n\n`
  prompt += `Pastikan:\n`
  prompt += `- Total budget tidak melebihi estimasi pengeluaran\n`
  prompt += `- Semua amount adalah angka bulat\n`
  prompt += `- Percentage adalah angka desimal (total harus 100)\n`
  prompt += `- Response hanya berisi JSON, tidak ada teks lain\n`

  return prompt
}

function parseBudgetResponse(response: string, estimatedExpense?: number): BudgetGenerationResult {
  try {
    // Log the full response for debugging
    console.log('AI Response:', response)
    
    // Try multiple strategies to extract JSON
    let parsed: any = null
    
    // Strategy 1: Look for JSON code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/)
    if (codeBlockMatch) {
      parsed = JSON.parse(codeBlockMatch[1])
    } else {
      // Strategy 2: Look for any JSON object
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        // Try to find the last complete JSON object
        let jsonStr = jsonMatch[0]
        // Clean up common issues
        jsonStr = jsonStr.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']')
        parsed = JSON.parse(jsonStr)
      }
    }
    
    if (!parsed || !parsed.budget) {
      throw new Error('No valid budget data found in response')
    }
    
    // Validate and adjust if needed
    let budget = parsed.budget || []
    
    // Ensure all budget items have required fields
    budget = budget.map((item: any, index: number) => ({
      category: item.category || `Category ${index + 1}`,
      amount: parseFloat(item.amount) || 0,
      percentage: parseFloat(item.percentage) || 0,
      notes: item.notes || item.description || ''
    }))
    
    const totalBudget = budget.reduce((sum: number, item: any) => sum + item.amount, 0)
    
    // Adjust if exceeds estimated expense
    if (estimatedExpense && totalBudget > estimatedExpense) {
      const ratio = estimatedExpense / totalBudget
      budget = budget.map((item: any) => ({
        ...item,
        amount: Math.round(item.amount * ratio),
        percentage: Math.round(item.percentage * ratio * 100) / 100
      }))
    }

    return {
      budget,
      explanation: parsed.explanation || parsed.penjelasan || 'Budget generated successfully',
      savingsTarget: parsed.savingsTarget || parsed.targetTabungan,
      insights: parsed.insights || parsed.wawasan || []
    }
  } catch (error) {
    console.error('Error parsing budget response:', error)
    console.error('Response was:', response)
    
    // Return fallback with error message
    return {
      budget: [],
      explanation: `Gagal memproses response AI. Error: ${error instanceof Error ? error.message : 'Unknown error'}. Silakan coba lagi.`,
      insights: ['Terjadi kesalahan dalam memproses response dari AI.']
    }
  }
}

/**
 * Get AI feedback on user edits
 */
export async function getEditFeedback(
  originalBudget: BudgetItem[],
  editedBudget: BudgetItem[],
  userMessage?: string
): Promise<string> {
  try {
    const changes = detectChanges(originalBudget, editedBudget)
    
    const prompt = `User telah melakukan perubahan pada budget:\n\n${changes}\n\n`
      + (userMessage ? `Pesan user: "${userMessage}"\n\n` : '')
      + `Berikan feedback singkat (maksimal 3 kalimat) tentang perubahan ini. Apakah reasonable? Ada saran?`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are Zentio AI, a helpful financial advisor. Respond in Indonesian, be concise and friendly.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get feedback')
    }

    const data = await response.json()
    return data.choices[0].message.content
  } catch (error) {
    console.error('Error getting feedback:', error)
    return 'Terima kasih atas penyesuaiannya! Budget Anda sudah diupdate.'
  }
}

function detectChanges(original: BudgetItem[], edited: BudgetItem[]): string {
  const changes: string[] = []

  edited.forEach((item, index) => {
    const orig = original[index]
    if (!orig) {
      changes.push(`+ Menambah kategori "${item.category}" dengan budget Rp ${item.amount.toLocaleString('id-ID')}`)
    } else if (item.amount !== orig.amount) {
      const diff = item.amount - orig.amount
      const sign = diff > 0 ? '+' : ''
      changes.push(`"${item.category}": Rp ${orig.amount.toLocaleString('id-ID')} → Rp ${item.amount.toLocaleString('id-ID')} (${sign}${diff.toLocaleString('id-ID')})`)
    }
  })

  if (edited.length < original.length) {
    changes.push(`- Menghapus ${original.length - edited.length} kategori`)
  }

  return changes.join('\n') || 'Tidak ada perubahan signifikan'
}
