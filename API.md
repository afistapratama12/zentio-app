# 📡 Zentio API Documentation

## Overview

Zentio menggunakan TanStack Start API routes untuk backend functionality. Semua API calls menggunakan OpenAI dan Supabase.

---

## Authentication

Semua protected routes menggunakan Supabase Auth session.

```typescript
// Check authentication
const { data: { session } } = await supabase.auth.getSession()
if (!session) {
  // Redirect to login
}
```

---

## API Routes

### 1. Analyze Transactions (Vision AI)

**Route:** `/api/analyze-transactions`  
**Method:** `POST`  
**Auth:** Required

**Request:**
```typescript
{
  files: File[], // Array of image/video files
  // OR
  csvData: string // CSV text content
}
```

**Response:**
```typescript
{
  transactions: [
    {
      date: string // "2025-09-12"
      merchant: string // "Starbucks"
      category: string // "Food & Beverage"
      amount: number // 58000
      type: "necessity" | "luxury"
    }
  ],
  total_spent: number,
  period: string // "September 2025"
}
```

**Implementation (To Do):**
```typescript
// src/routes/api/analyze-transactions.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { openai } from '~/lib/openai'
import { supabase } from '~/lib/supabase'

export const Route = createAPIFileRoute('/api/analyze-transactions')({
  POST: async ({ request }) => {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // 1. Upload to Supabase Storage
    const { data: uploadData } = await supabase.storage
      .from('transaction-images')
      .upload(`${userId}/${file.name}`, file)
    
    // 2. Analyze with OpenAI Vision
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: "Extract transaction data from this image. Return JSON with: date, merchant, category, amount, type (necessity/luxury)"
            },
            {
              type: "image_url",
              image_url: { url: imageUrl }
            }
          ]
        }
      ]
    })
    
    // 3. Save to database
    await supabase.from('transactions').insert({
      user_id: userId,
      source_file: uploadData.path,
      extracted_data: parsedData
    })
    
    return parsedData
  }
})
```

---

### 2. Generate Budget

**Route:** `/api/generate-budget`  
**Method:** `POST`  
**Auth:** Required

**Request:**
```typescript
{
  period: string // "October 2025"
  transactionIds?: string[] // Optional specific transactions
}
```

**Response (Streaming):**
```typescript
// Server-Sent Events (SSE)
{
  type: "chunk"
  content: string // Incremental response
}

// Final response:
{
  type: "complete"
  budget: {
    categories: {
      [category: string]: {
        allocated: number
        percentage: number
        suggestions: string[]
      }
    },
    total_budget: number,
    savings_goal: number,
    insights: string[]
  }
}
```

**Implementation (To Do):**
```typescript
// src/routes/api/generate-budget.ts
import { createAPIFileRoute } from '@tanstack/react-start/api'
import { openai } from '~/lib/openai'

export const Route = createAPIFileRoute('/api/generate-budget')({
  POST: async ({ request }) => {
    const { period, transactionIds } = await request.json()
    
    // 1. Get user profile
    const { data: profile } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', userId)
      .single()
    
    // 2. Get transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
    
    // 3. Build context
    const context = buildBudgetContext(profile, transactions)
    
    // 4. Stream response from OpenAI
    const stream = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a financial advisor AI. Generate budget recommendations based on user profile and transaction history."
        },
        {
          role: "user",
          content: context
        }
      ],
      stream: true
    })
    
    // 5. Return streaming response
    return new Response(
      new ReadableStream({
        async start(controller) {
          for await (const chunk of stream) {
            controller.enqueue(chunk)
          }
          controller.close()
        }
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
        }
      }
    )
  }
})
```

---

### 3. Chat with Budget AI

**Route:** `/api/chat-budget`  
**Method:** `POST`  
**Auth:** Required

**Request:**
```typescript
{
  message: string // User question
  budgetId: string // Current budget context
  history?: Message[] // Conversation history
}
```

**Response (Streaming):**
```typescript
{
  type: "message"
  content: string
  updatedBudget?: Budget // If budget was modified
}
```

---

### 4. Export Budget

**Route:** `/api/export-budget`  
**Method:** `POST`  
**Auth:** Required

**Request:**
```typescript
{
  budgetId: string
  format: "pdf" | "csv"
}
```

**Response:**
```typescript
// For PDF:
{
  url: string // Download URL
  filename: string
}

// For CSV:
{
  csv: string // CSV content
  filename: string
}
```

---

## OpenAI Integration Patterns

### Pattern 1: Vision Analysis

```typescript
const analyzeImage = async (imageUrl: string) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: promptText },
          { type: "image_url", image_url: { url: imageUrl } }
        ]
      }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

### Pattern 2: Streaming Chat

```typescript
const streamBudgetChat = async (userMessage: string, context: string) => {
  const stream = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: `${context}\n\nUser: ${userMessage}` }
    ],
    stream: true,
    temperature: 0.7
  })
  
  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ""
    yield content
  }
}
```

### Pattern 3: Structured Output

```typescript
const generateBudget = async (transactions: Transaction[], profile: UserProfile) => {
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content: "Generate a budget in JSON format: {categories: {...}, total_budget: number, insights: string[]}"
      },
      {
        role: "user",
        content: buildPrompt(transactions, profile)
      }
    ],
    response_format: { type: "json_object" }
  })
  
  return JSON.parse(response.choices[0].message.content)
}
```

---

## Supabase Queries

### Get User Profile with Transactions

```typescript
const getUserData = async (userId: string) => {
  const { data: profile } = await supabase
    .from('user_profile')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)
  
  return { profile, transactions }
}
```

### Save Budget History

```typescript
const saveBudget = async (userId: string, budget: Budget) => {
  const { data, error } = await supabase
    .from('budget_history')
    .insert({
      user_id: userId,
      period: budget.period,
      ai_generated_budget: budget,
      manual_adjustments: null
    })
    .select()
    .single()
  
  return data
}
```

### Update Budget with Manual Edits

```typescript
const updateBudget = async (budgetId: string, adjustments: any) => {
  const { data } = await supabase
    .from('budget_history')
    .update({
      manual_adjustments: adjustments,
      updated_at: new Date().toISOString()
    })
    .eq('id', budgetId)
    .select()
    .single()
  
  return data
}
```

---

## Error Handling

### Standard Error Response

```typescript
{
  error: {
    code: string // "UNAUTHORIZED" | "INVALID_INPUT" | "AI_ERROR"
    message: string
    details?: any
  }
}
```

### Example Error Handler

```typescript
try {
  // API logic
} catch (error) {
  if (error.code === 'PGRST116') {
    return new Response(
      JSON.stringify({ 
        error: { 
          code: 'NOT_FOUND', 
          message: 'Resource not found' 
        } 
      }),
      { status: 404 }
    )
  }
  
  return new Response(
    JSON.stringify({ 
      error: { 
        code: 'INTERNAL_ERROR', 
        message: error.message 
      } 
    }),
    { status: 500 }
  )
}
```

---

## Rate Limiting (Future)

Untuk production, implementasi rate limiting:

```typescript
// Example dengan upstash/ratelimit
import { Ratelimit } from "@upstash/ratelimit"

const ratelimit = new Ratelimit({
  redis: ...,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
})

// In API route:
const { success } = await ratelimit.limit(userId)
if (!success) {
  return new Response("Too many requests", { status: 429 })
}
```

---

## Testing APIs

### Test dengan curl

```bash
# Test analyze transactions
curl -X POST http://localhost:3000/api/analyze-transactions \
  -H "Content-Type: multipart/form-data" \
  -F "file=@transaction.jpg" \
  -H "Cookie: sb-access-token=..."

# Test generate budget
curl -X POST http://localhost:3000/api/generate-budget \
  -H "Content-Type: application/json" \
  -d '{"period": "October 2025"}' \
  -H "Cookie: sb-access-token=..."
```

---

## Next Steps

1. Implement API routes di `src/routes/api/`
2. Add proper error handling
3. Add request validation
4. Add logging
5. Add tests

---

**Last Updated:** October 23, 2025
