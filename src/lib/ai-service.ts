import { UserProfile } from '@/types'
import type { UploadedFile } from './file-upload'
import { parseCSV } from './file-upload'

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY

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
  content: string | Array<Record<string, any>>
  full_content?: string
  timestamp: string
}

export interface BudgetGenerationParams {
  historyTransactions: Transaction[]
  inputManual?: string
  budgetType: '1-month' | '1-year' | 'custom'
  startDate: string
  endDate: string
  estimatedExpense?: number
  userProfile?: UserProfile
}

export interface BudgetGenerationResult {
  budget: BudgetItem[]
  explanation: string
  savingsTarget?: number
  insights: string[]
  firstPrompt: ChatMessage
}

/**
 * Analyze uploaded files and extract transactions
 * Now supports multiple files in a single API call
 */
export async function analyzeFiles(
  files: UploadedFile[],
  onProgress?: (message: string) => void
): Promise<Transaction[]> {
  if (files.length === 0) return []

  try {
    if (onProgress) {
      onProgress(`Analyzing ${files.length} file(s)...`)
    }

    // Create FormData with all files
    const formData = new FormData()
    
    for (const file of files) {
      if (onProgress) {
        onProgress(`Preparing ${file.name}...`)
      }

      // Fetch the file from URL and convert to File object
      const response = await fetch(file.url)
      const blob = await response.blob()
      const fileObj = new File([blob], file.name, { 
        type: file.type === 'csv' ? 'text/csv' : 
              file.type === 'image' ? 'image/jpeg' : 
              'video/mp4' 
      })
      
      // Add to FormData with unique key
      formData.append(`file_${files.indexOf(file)}`, fileObj)
    }

    if (onProgress) {
      onProgress('Sending to AI for analysis...')
    }

    // Call API endpoint
    const apiResponse = await fetch('/api/analyze-transactions', {
      method: 'POST',
      body: formData,
    })

    if (!apiResponse.ok) {
      throw new Error(`API error: ${apiResponse.statusText}`)
    }

    const result = await apiResponse.json()

    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze files')
    }

    if (onProgress) {
      onProgress(`✅ Found ${result.count} transaction(s)`)
    }

    return result.transactions || []
  } catch (error) {
    console.error('Error analyzing files:', error)
    if (onProgress) {
      onProgress(`⚠️ Failed to analyze files: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
    throw error
  }
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
    // Build prompt
    const prompt = buildBudgetPrompt(params)
    const timestampPrompt = new Date().toISOString()

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
        temperature: 0.5,
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
    onComplete({
      ...result,
      firstPrompt: {
        role: 'user',
        content: prompt,
        timestamp: timestampPrompt
      }
    } as BudgetGenerationResult)

  } catch (error) {
    console.error('Error generating budget:', error)
    throw error
  }
}

export interface SpendingByCategory {
  items: string[]
  total: number
}

function buildBudgetPrompt(params: BudgetGenerationParams): string {
  const { historyTransactions, inputManual, budgetType, estimatedExpense, userProfile } = params

  let month = 1
  let interval = ""
  switch (budgetType) {
    case '1-month':
      month = 1
      interval = "bulanan"
    case '1-year':
      month = 12
      interval = "tahunan"
    default:
      const start = new Date(params.startDate)
      const end = new Date(params.endDate)
      month = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 30))
      interval = `${month}-bulan`
  }

  let prompthistoryTransaction = ''

  if(historyTransactions.length !== 0) {
    // Add transaction summary
    const totalSpent = historyTransactions.reduce((sum, t) => sum + t.amount, 0)
    const categories = [...new Set(historyTransactions.map(t => t.category))]
  
    const spendingByCategory: Record<string, SpendingByCategory> = {}
  
    for (const t of historyTransactions) {
      if (!spendingByCategory[t.category]) {
        spendingByCategory[t.category] = { items: [], total: 0 }
      }
  
      spendingByCategory[t.category].items.push(t.item)
      spendingByCategory[t.category].total += t.amount
    }

    prompthistoryTransaction = `
Data transaksi yang sudah dianalisis:
Total Transaksi: ${historyTransactions.length}
Total Pengeluaran: Rp ${totalSpent.toLocaleString('id-ID')}
Kategori yang ada: ${categories.join(', ')}

Dengan rincian sebagai berikut:
${spendingByCategory ? Object.entries(spendingByCategory).map(([category, data]) => {
  return `- ${category}:\n  - Items: ${data.items.join(', ')}\n  - Total: Rp ${data.total.toLocaleString('id-ID')}`
}).join('\n') : ''}
`
  }

  const prompt = `Saya memiliki data transaksi di periode sebelumnya, sebagai berikut:
${prompthistoryTransaction}
${inputManual ? "Dan ini ada catatan pengeluaran yang dicatat oleh user: \n" + inputManual : ''}

Berikut juga ada profile user yang bisa digunakan untuk referensi dalam pembuatan budget:
- Nama: ${userProfile?.name || 'N/A'}
- Umur: ${userProfile?.age || 'N/A'}
- Pekerjaan: ${userProfile?.job || 'N/A'}
- Status Pernikahan: ${userProfile?.marital_status || 'N/A'}
- Tipe keuangan: ${userProfile?.financial_type || 'N/A'}
- Investment Level: ${userProfile?.investment_level || 'N/A'}

Buatkan budget planning untuk periode ${month} bulan kedepan (${interval}) berdasarkan informasi yang sudah saya berikan.
${estimatedExpense ? `Estimasi pengeluaran maksimal: Rp ${estimatedExpense.toLocaleString('id-ID')}` : ''}

PENTING: Response HANYA dalam format JSON yang valid, tidak ada teks tambahan sebelum atau sesudah JSON.
format JSON yang diharapkan:

{
  "explanation": "penjelasan singkat tentang budget ini (string)",
  "budget": [
    {
      "category": "Nama Kategori",
      "amount": 1000000,
      "percentage": 20.5,
      "notes": "catatan opsional"
    }
  ],
  "savingsTarget": number_savings_target,
  "insights": ["insight 1", "insight 2", "insight 3"]
}

Pastikan:
- Total budget tidak melebihi estimasi pengeluaran
- Semua amount adalah angka bulat
- Kalkukasi amount harus memiliki pembulatan seribu keatas, misal 106000, tidak boleh 105511
- Percentage adalah angka desimal (total harus 100)
- Berikan 'notes' dengan tujuan untuk mengoptimalkan pengeluaran di setiap kategori
- Response hanya berisi JSON, tidak ada teks lain
`

  return prompt
}

function parseBudgetResponse(response: string, estimatedExpense?: number): Record<string, any> {
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
      + `Berikan feedback yang detail dan to the point tentang perubahan ini. Apakah reasonable? Ada saran?`

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4.1-2025-04-14',
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
        max_tokens: 2000,
        temperature: 0.5,
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

/**
 * Chat with AI about budget - supports streaming
 */
export async function chatWithAI(
  messagesToSend: ChatMessage[],
  currentBudget: BudgetItem[],
  firstPrompt: ChatMessage | null,
  estimatedExpense?: number,
  onChunk?: (chunk: string) => void
): Promise<string> {
  /**
   * Buat system prompt yang menjelaskan tugas AI sebagai financial advisor untuk budgeting
   * - ai ini bisa membantu user untuk mengoptimalkan budgetnya
   * - ai ini bisa menjawab pertanyaan seputar financial planning
   * - ai ini bisa mengubah stuktur budget yang ada sesuai permintaan user atau saran dari user
   * - ai tidak boleh mengubah struktur budget jika user tidak meminta perubahan (kecuali saran optimasi)
   * - ai juga bisa menjawab hal apapun seputar keuangan apapun termasuk investasi, tabungan, asuransi, dll
   * - hasil pertanyaan keuangan bisa dijadikan referensi untuk perubahan budget jika diperlukan dari seberapa paham user tentang keuangan
   * - pastikan ai menjawab dalam bahasa Indonesia yang raman dan mudah dimengerti
   * 
   * struktur history chatnya
    1. first prompt (dari chat system sebelumnya, dan sekarang AI melanjutkan chat dari sini)
    2. chat history dari param messages
    3. terahir. input user (bisa nanya, bisa revisi, bisa suggestion ke AI)

    buat state kalau ada perubahan dari stuktur budget, dengan tanda:
    awalan: --start-budget-change--
    end: --end-budget-change--

   * PENTING: Hanya kirim SATU budget change per response.
   * Jika mengubah budget, kirim SELURUH budget array (semua kategori), bukan hanya yang berubah.
   * 
   * format budget change harus sama seperti sebelumnya:
   * [{ 
   *    "category": "Nama Kategori",
   *    "amount": 1000000,
   *    "percentage": 20.5,
   *    "notes": "catatan opsional"
   * }]
   * 
   * contoh jawaban:
   * Baik, saya telah memperbarui budget Anda sesuai permintaan:
   * --start-budget-change--
   * [{
   *    "category": "Makanan",  
   *   "amount": 1500000,
   *   "percentage": 25.0,
   *  "notes": "Mengalokasikan lebih banyak untuk makanan sesuai permintaan."
   * }, {
   *    "category": "Transport",
   *    "amount": 800000,
   *    "percentage": 13.3,
   *    "notes": "Tetap seperti sebelumnya"
   * }]
   * --end-budget-change--
   * 
   * Dari, struktur budget yang baru sudah saya terapkan. Apakah sudah sesuai keinginan Anda?
   */

  try {
    // Build context from current budget
    const budgetContext = currentBudget.length > 0
      ? `\nCurrent Budget:\n${currentBudget.map(item => 
          `- ${item.category}: Rp ${item.amount.toLocaleString('id-ID')} (${item.percentage.toFixed(1)}%) (note: ${item.notes || 'N/A'})`
        ).join('\n')}\n\nTotal: Rp ${currentBudget.reduce((sum, item) => sum + item.amount, 0).toLocaleString('id-ID')}
        
        Estimated Expense Limit: ${estimatedExpense ? `Rp ${estimatedExpense.toLocaleString('id-ID')}` 
      : ''}`
      : 'No budget data available.'

    const systemMessage = {
      role: 'system' as const,
      content: `You are Zentio AI, an expert financial advisor for Indonesian users.

Your role and responsibilities:
- Help users refine, optimize, and manage their budget plan.  
- Answer questions about financial planning in general.  
- Provide actionable advice on budgeting, investments, savings, insurance, and other financial topics.  
- Modify the budget structure only if the user explicitly requests changes, or when suggesting clear optimizations.  
- Always respond in a friendly, supportive, and simple Indonesian language that is easy to understand.  

If there is a request to change the budget or you feel the need to change the budget based on user complain, then:
- Always mark the changes between:
  --start-budget-change--
  [...valid JSON...]
  --end-budget-change--
- The JSON format must strictly follow this structure:
  [{
    "category": "Category Name",
    "amount": 1000000,
    "percentage": 20.5,
    "notes": "optional notes"
  }]
- Never use any other format except valid JSON inside the markers.
- IMPORTANT: Only send ONE marker with full budget change per response.
- When sending a budget change, send the COMPLETE budget array (all categories), not just the changed items.
`

    }

    // clean up firstPrompt without rule
    if (firstPrompt && typeof firstPrompt.content === 'string') {
      const contentWIthRule = firstPrompt.content.split('PENTING: Response HANYA dalam format JSON yang valid')
      if (contentWIthRule.length > 1) {
        firstPrompt.content = contentWIthRule[0].trim()
      }
    }

    const apiMessages = [
      systemMessage,
      ...(firstPrompt ? [{
        role: 'user' as const,
        content: firstPrompt.content
      }] : []),
      ...messagesToSend
        .filter((msg: any) => msg.role !== 'system')
        .map((msg) => {
          if (msg.role !== 'assistant') {
            return {
              role: msg.role,
              content: msg.content
            }
          }

          if (msg.role === 'assistant' && typeof msg.content === 'string') {
            return {
              role: msg.role,
              content: msg.content
            }
          } 
            
          return {
            role: msg.role,
            content: msg.full_content || ''
          }
        }),
      {
        role: 'system' as const,
        content: `Current budget plan data (if any) for reference:
${budgetContext}`
      }
    ]

    if (onChunk) {
      // Streaming mode
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: apiMessages,
          stream: true,
          max_tokens: 2000,
          temperature: 0.5,
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

      return fullResponse
    } else {
      // Non-streaming mode
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-2025-04-14',
          messages: apiMessages,
          max_tokens: 2000,
          temperature: 0.5,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.statusText}`)
      }

      const data = await response.json()
      return data.choices[0].message.content
    }
  } catch (error) {
    console.error('Error chatting with AI:', error)
    throw new Error('Gagal berkomunikasi dengan AI. Silakan coba lagi.')
  }
}
