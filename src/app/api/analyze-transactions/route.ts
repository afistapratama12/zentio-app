// import { json } from '@tanstack/react-router'
// import { createFileRoute } from '@tanstack/react-router'
// import { json } from '@tanstack/react-start'
import { openai } from '@/lib/openai'
import { NextRequest, NextResponse } from 'next/server'
import { ChatCompletionMessageParam } from 'openai/resources/index.mjs'

export interface TransactionAnalyzed {
  item: string
  amount: number
  category: string
  date?: string
}

// Server-side handler function
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    // Get all files from formData (support multiple files)
    const files: File[] = []
    formData.forEach((value, key) => {
      if (value instanceof File) {
        files.push(value)
      }
    })

    if (files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      )
    }

    let transactions: TransactionAnalyzed[] = []
    const mediaFiles: Array<{ base64: string; mimeType: string; fileName: string }> = []
    
    // Process each file
    for (const file of files) {
      const isImage = file.type.startsWith('image/')
      const isVideo = file.type.startsWith('video/')
      const isCSV = file.type === 'text/csv' || file.name.endsWith('.csv')

      if (isCSV) {
        // Parse CSV immediately
        const text = await file.text()
        const lines = text.split('\n').slice(1) // Skip header

        for (const line of lines) {
          const parts = line.split(',').map((s: string) => s.trim())
          if (parts.length >= 2 && parts[0] && parts[1]) {
            transactions.push({
              item: parts[0],
              amount: parseFloat(parts[1].replace(/[^0-9.-]/g, '')),
              category: parts[2] || 'Lain-lain',
              date: parts[3] || new Date().toISOString(),
            })
          }
        }
      } else if (isImage || isVideo) {
        // Collect media files for batch processing
        const arrayBuffer = await file.arrayBuffer()
        const base64 = Buffer.from(arrayBuffer).toString('base64')
        mediaFiles.push({
          base64: `data:${file.type};base64,${base64}`,
          mimeType: file.type,
          fileName: file.name
        })
      }
    }

    // If there are media files, process them with OpenAI Vision
    if (mediaFiles.length > 0) {
      // Build user message content with all media files
      const userMessageContent: Array<
        | { type: 'text'; text: string }
        | { type: 'image_url'; image_url: { url: string } }
      > = [
        {
          type: 'text',
          text: `Analyze the transaction details in the attached ${mediaFiles.length} file(s) and extract the spending data as per the specified format. Process all files together and combine the results.`
        }
      ]

      // Add all media files to the message
      for (const media of mediaFiles) {
        userMessageContent.push({
          type: 'image_url',
          image_url: {
            url: media.base64,
          },
        })
      }

      const messages: Array<ChatCompletionMessageParam> = [
        {
          role: 'system' as const,
          content: `You are an intelligent financial analyzer specialized in extracting structured spending data from images of transactions.

You can analyze any image containing purchase or spending information, such as:
- Physical or digital purchase receipts
- Screenshots of online orders (Shopee, Tokopedia, Amazon, eBay, TikTok Shop, etc.)
- Food delivery orders (GrabFood, GoFood, ShopeeFood, etc.)
- Transportation bookings (Grab, Gojek, Uber, taxis, etc.)
- Hotel or flight bookings (Traveloka, Agoda, Airbnb, etc.)
- Handwritten expense notes
- Online payment receipts (Mandiri, PayPal, Stripe, etc.)

Your task:
1. Detect all transaction-related text in the image.
2. Extract all item names (if any), spending category, and amounts.
3. Classify each expense into one of the following categories:
  - Food and Drink
  - Monthly Groceries
  - Transportation
  - Shopping
  - Entertainment
  - Investment
  - Health
  - Education
  - Bills
  - Utilities
  - Others

Output your analysis strictly ONLY JSON array format:

[
  {
    "category": "category_name",
    "item": "item_name (if any)",
    "amount": number_value,
    "date": "ISO_date_string (if available)"
  }
]

Rules:
- amount must be a pure number without any currency symbols (e.g., 100000, not Rp100,000 or $10).
- Make sure not to include total amount / total pesanan in online order receipts, you must focus only on individual item amounts.
- If multiple items exist, output multiple JSON objects in the array.
- If the total amount only exists (no item details), use "item": null.
- Always guess the most relevant category based on context.
- Keep your answer strictly in valid JSON format — no explanations or extra text.`
        },
        {
          role: 'user' as const,
          content: userMessageContent,
        },
      ]

      // Call OpenAI Vision API
      const response = await openai.chat.completions.create({
        model: 'gpt-4.1-2025-04-14',
        temperature: 0.1,
        max_tokens: 2000,
        response_format: { type: 'json_object' },
        messages: messages,
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        return NextResponse.json({ error: 'Empty response from model' }, { status: 500 });
      }

      // Extract JSON from response
      const jsonMatch = content.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const aiTransactions = JSON.parse(jsonMatch[0])
        transactions = [...transactions, ...aiTransactions]
      }
    }

    return NextResponse.json(
      {
        success: true,
        transactions,
        count: transactions.length,
      },
      { status: 200 }
    )

  // @ts-ignore
  } catch (error: any) {
    console.error('Error analyzing transactions:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to analyze transactions',
        transactions: [],
      },
      { status: 500 }
    )
  }
}

