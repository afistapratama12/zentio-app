// import { json } from '@tanstack/react-router'
import { createFileRoute } from '@tanstack/react-router'
import { json } from '@tanstack/react-start'
import { openai } from '~/lib/openai'

interface Transaction {
  item: string
  amount: number
  category: string
  date?: string
}

export const Route = createFileRoute('/api/analyze-transactions')({
  server: {
    handlers: {
      POST: analyzeTransactionsHandler,
    }
  }
})

// Server-side handler function
export async function analyzeTransactionsHandler({ request }: {request: Request} ) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      // return new Response(
      //   JSON.stringify({ success: false, error: 'No file provided' }),
      //   {
      //     status: 400,
      //     headers: { 'Content-Type': 'application/json' },
      //   }
      // )

      return json(
        { success: false, error: 'No file provided' },
        { status: 400 }
      )
    }

    // Check file type
    const isImage = file.type.startsWith('image/')
    const isVideo = file.type.startsWith('video/')
    const isCSV = file.type === 'text/csv'

    let transactions: Transaction[] = []

    if (isCSV) {
      // Parse CSV
      const text = await file.text()
      const lines = text.split('\n').slice(1) // Skip header

      for (const line of lines) {
        const parts = line.split(',').map((s: string) => s.trim())
        if (parts.length >= 2) {
          transactions.push({
            item: parts[0],
            amount: parseFloat(parts[1].replace(/[^0-9.-]/g, '')),
            category: parts[2] || 'Lain-lain',
            date: parts[3] || new Date().toISOString(),
          })
        }
      }
    } else if (isImage || isVideo) {
      // Convert file to base64
      const arrayBuffer = await file.arrayBuffer()
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const mimeType = file.type
      const dataUrl = `data:${mimeType};base64,${base64}`

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah AI assistant yang expert dalam membaca struk belanja. 
Tugasmu adalah menganalisis gambar/video struk dan mengekstrak semua transaksi.
Return hasil dalam format JSON array dengan struktur:
[{"item": "nama_item", "amount": jumlah_angka, "category": "kategori", "date": "tanggal_jika_ada"}]

Kategori yang tersedia:
- Makanan
- Minuman
- Transportasi
- Belanja
- Hiburan
- Kesehatan
- Pendidikan
- Tagihan
- Lain-lain

Pastikan amount dalam format number tanpa mata uang. Jika ada tanggal, gunakan format ISO.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analisis struk ini dan ekstrak semua transaksi dalam format JSON',
              },
              {
                type: 'image_url',
                image_url: {
                  url: dataUrl,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
        temperature: 0.1,
      })

      const content = response.choices[0]?.message?.content || '[]'

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        transactions = JSON.parse(jsonMatch[0])
      }
    }

    // Return transactions
    // return new Response(
    //   JSON.stringify({
    //     success: true,
    //     transactions,
    //     count: transactions.length,
    //   }),
    //   {
    //     status: 200,
    //     headers: { 'Content-Type': 'application/json' },
    //   }
    // )

    return json(
      {
        success: true,
        transactions,
        count: transactions.length,
      },
      { status: 200 }
    )

  } catch (error: any) {
    console.error('Error analyzing transactions:', error)
    // return new Response(
    //   JSON.stringify({
    //     success: false,
    //     error: error.message || 'Failed to analyze transactions',
    //     transactions: [],
    //   }),
    //   {
    //     status: 500,
    //     headers: { 'Content-Type': 'application/json' },
    //   }
    // )
    return json(
      {
        success: false,
        error: error.message || 'Failed to analyze transactions',
        transactions: [],
      },
      { status: 500 }
    )
  }
}

