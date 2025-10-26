import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { openai } from '../lib/openai'
import { toast } from 'sonner'
import { Bot, User, Send, Loader2, Sparkles } from 'lucide-react'
import type { Budget } from '../types'

interface Message {
  role: 'assistant' | 'user'
  content: string
}

interface Transaction {
  item: string
  amount: number
  category: string
  date?: string
}

interface UserProfile {
  name?: string
  age?: number
  job?: string
  location?: string
  investment_level?: string
  financial_type?: string
}

interface ChatPanelProps {
  transactions: Transaction[]
  userProfile?: UserProfile
  onBudgetGenerated: (budget: Budget[]) => void
}

export function ChatPanel({
  transactions,
  userProfile,
  onBudgetGenerated,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content:
        'Halo! 👋 Saya AI Budget Assistant. Saya akan membantu Anda membuat budget berdasarkan transaksi yang sudah diupload. Ketik "buatkan budget" untuk memulai!',
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const generateBudget = async () => {
    if (transactions.length === 0) {
      toast.error('Belum ada transaksi. Upload transaksi terlebih dahulu!')
      return
    }

    setLoading(true)

    try {
      // Calculate spending by category
      const categorySpending = transactions.reduce((acc, t) => {
        acc[t.category] = (acc[t.category] || 0) + t.amount
        return acc
      }, {} as Record<string, number>)

      const totalSpending = Object.values(categorySpending).reduce(
        (sum, amount) => sum + amount,
        0
      )

      // Prepare context for AI
      const transactionSummary = Object.entries(categorySpending)
        .map(([cat, amount]) => `${cat}: Rp ${amount.toLocaleString('id-ID')}`)
        .join('\n')

      const profileContext = userProfile
        ? `
Profil User:
- Nama: ${userProfile.name}
- Umur: ${userProfile.age} tahun
- Pekerjaan: ${userProfile.job}
- Lokasi: ${userProfile.location}
- Level Investasi: ${userProfile.investment_level}
- Tipe Keuangan: ${userProfile.financial_type}
`
        : 'Profil user tidak tersedia.'

      // Call OpenAI to generate budget
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI Budget Assistant yang expert dalam financial planning.
Tugasmu adalah menganalisis spending pattern user dan membuat rekomendasi budget yang realistis.

RULES:
1. Analisis spending pattern dari data transaksi
2. Berikan rekomendasi budget per kategori dalam format JSON
3. Berikan penjelasan singkat kenapa budget tersebut direkomendasikan
4. Pertimbangkan profil user (umur, pekerjaan, tipe keuangan)
5. Total budget harus lebih rendah 5-10% dari total spending untuk mendorong saving

Format response:
{
  "explanation": "penjelasan singkat tentang budget recommendation",
  "budget": [
    {"category": "Kategori", "amount": jumlah_angka, "percentage": persentase}
  ],
  "savings_target": jumlah_target_saving
}`,
          },
          {
            role: 'user',
            content: `Buatkan budget recommendation berdasarkan data berikut:

${profileContext}

Total Pengeluaran: Rp ${totalSpending.toLocaleString('id-ID')}
Jumlah Transaksi: ${transactions.length}

Spending per Kategori:
${transactionSummary}

Tolong analisis dan buatkan budget rekomendasi!`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
      })

      const content = response.choices[0]?.message?.content || '{}'

      // Parse AI response
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])

        // Add AI message
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `📊 **Budget Recommendation**\n\n${result.explanation}\n\n💰 Target Saving: Rp ${result.savings_target?.toLocaleString('id-ID') || 0}`,
          },
        ])

        // Pass budget to parent
        if (result.budget && Array.isArray(result.budget)) {
          onBudgetGenerated(result.budget)
          toast.success('Budget berhasil di-generate!')
        }
      } else {
        throw new Error('Gagal parse response AI')
      }
    } catch (error: any) {
      console.error('Error generating budget:', error)
      toast.error('Gagal generate budget. Coba lagi!')
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            '❌ Maaf, terjadi kesalahan saat generate budget. Silakan coba lagi.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim() || loading) return

    const userMessage = input.trim()
    setInput('')

    // Add user message
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }])

    // Check if user wants to generate budget
    const budgetKeywords = [
      'buatkan budget',
      'generate budget',
      'buat budget',
      'budget',
      'rekomendasikan',
    ]
    const shouldGenerateBudget = budgetKeywords.some((keyword) =>
      userMessage.toLowerCase().includes(keyword)
    )

    if (shouldGenerateBudget) {
      await generateBudget()
    } else {
      // General chat with AI
      setLoading(true)
      try {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content:
                'Kamu adalah AI Budget Assistant yang membantu user dalam financial planning. Jawab pertanyaan dengan singkat, informatif, dan friendly.',
            },
            ...messages.map((m) => ({
              role: m.role,
              content: m.content,
            })),
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 500,
        })

        const aiResponse =
          response.choices[0]?.message?.content ||
          'Maaf, saya tidak mengerti.'

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: aiResponse },
        ])
      } catch (error) {
        console.error('Error getting AI response:', error)
        toast.error('Gagal mendapatkan response AI')
      } finally {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-600" />
          AI Budget Assistant
          <Badge variant="secondary" className="ml-auto">
            {transactions.length} transaksi
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
        <div className="h-[400px] overflow-y-auto space-y-3 p-4 bg-gray-50 rounded-lg">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {message.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-emerald-600" />
                </div>
              )}
              <div
                className={`rounded-lg px-4 py-2 max-w-[80%] ${
                  message.role === 'user'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-900 border'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="rounded-lg px-4 py-2 bg-white border">
                <Loader2 className="w-4 h-4 animate-spin text-gray-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ketik pesan atau 'buatkan budget'..."
            disabled={loading}
            className="flex-1"
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput('Buatkan budget untuk saya')
              setTimeout(() => handleSend(), 100)
            }}
            disabled={loading || transactions.length === 0}
          >
            🎯 Generate Budget
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setInput('Berikan tips hemat untuk kategori pengeluaran terbesar saya')
              setTimeout(() => handleSend(), 100)
            }}
            disabled={loading}
          >
            💡 Tips Hemat
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
