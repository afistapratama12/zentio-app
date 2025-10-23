# 💰 Zentio - AI Agent Web Budgeting App

> Bangun Financial Plan Cerdas Berbasis AI — Dari Transaksi Harian Hingga Budget Masa Depan

## 🚀 Quick Start

### Prerequisites

- **Node.js** 20.x or later
- **Bun** (recommended) or npm
- **Supabase Account** - [Create one here](https://supabase.com)
- **OpenAI API Key** - [Get yours here](https://platform.openai.com/api-keys)

### Installation

1. **Clone & Install Dependencies**

```bash
git clone <your-repo-url>
cd zentio-ai-next
bun install
```

2. **Setup Environment Variables**

Create a `.env.local` file in the root directory:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

3. **Setup Supabase Database**

- Go to your Supabase Dashboard > SQL Editor
- Run the SQL script from `supabase/schema.sql`
- Run migrations from `supabase/migrations/`

4. **Run Development Server**

```bash
bun run dev
```

The app will be available at `http://localhost:3000/`

### Building for Production

```bash
bun run build
bun run start
```

---

## 🎯 Features

- ✅ **AI-Powered Analysis** - OpenAI GPT-4o + Vision for transaction analysis
- ✅ **Conversational Budgeting** - Chat-based budget creation and refinement
- ✅ **Interactive Visualizations** - Real-time budget charts and comparisons
- ✅ **Multi-Format Export** - Export to PDF & CSV
- ✅ **Budget History** - Track and compare budgets over time
- ✅ **Smart Recommendations** - AI-driven financial insights
- ✅ **Gamification** - Reward system to encourage financial discipline
- ✅ **Multi-language** - Support for multiple languages (i18n ready)

---

## 🛠️ Tech Stack

### Core Framework
- **[Next.js 15.5](https://nextjs.org/)** - React framework with App Router
- **[React 19](https://react.dev/)** - UI library
- **[TypeScript](https://www.typescriptlang.org/)** - Type-safe JavaScript
- **[Turbopack](https://turbo.build/pack)** - Next-gen bundler (dev & build)

### Styling & UI
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[shadcn/ui](https://ui.shadcn.com/)** - Re-usable component library
- **[Radix UI](https://www.radix-ui.com/)** - Unstyled accessible components
- **[Lucide Icons](https://lucide.dev/)** - Beautiful icon set
- **[Recharts](https://recharts.org/)** - Chart library for data visualization

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database & authentication
- **[@supabase/supabase-js](https://supabase.com/docs/reference/javascript)** - Supabase client

### AI & Data Processing
- **[OpenAI API](https://platform.openai.com/)** - GPT-4o for AI analysis
- **[pdf-lib](https://pdf-lib.js.org/)** - PDF generation
- **[jsPDF](https://github.com/parallax/jsPDF)** - PDF creation
- **[PapaParse](https://www.papaparse.com/)** - CSV parsing and generation

### State Management & Data Fetching
- **[TanStack Query](https://tanstack.com/query)** - Powerful async state management
- **[React Context API](https://react.dev/reference/react/useContext)** - Auth & language state

### Developer Experience
- **[ESLint](https://eslint.org/)** - Code linting
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[clsx](https://github.com/lukeed/clsx)** & **[tailwind-merge](https://github.com/dcastil/tailwind-merge)** - Conditional styling

---

## 📝 Development Status

### ✅ Completed
- [x] Project setup with Next.js 15 + Turbopack
- [x] Database schema & migrations
- [x] shadcn/ui integration
- [x] Authentication system (Supabase Auth)
- [x] Homepage & landing page
- [x] Dashboard layout
- [x] Budget creation workspace
- [x] Transaction uploader
- [x] AI-powered budget generation
- [x] Chat-based budget refinement
- [x] Budget visualization (charts & tables)
- [x] Budget history tracking
- [x] Profile management
- [x] Rewards system
- [x] Multi-language support

### 🚧 In Progress
- [ ] Advanced budget recommendations
- [ ] Export optimization (PDF/CSV)
- [ ] Mobile responsive improvements
- [ ] Onboarding flow enhancement
- [ ] Performance optimizations

### 📋 Planned Features
- [ ] Budget templates
- [ ] Collaborative budgets (family/team)
- [ ] Financial goal tracking
- [ ] Investment recommendations
- [ ] Mobile app (React Native)
- [ ] Budget alerts & notifications

---

## 📂 Project Structure

```
zentio-ai-next/
├── public/              # Static assets (logos, icons)
├── src/
│   ├── app/            # Next.js App Router pages
│   │   ├── api/        # API routes
│   │   ├── app/        # Main app pages (dashboard, budgets, etc)
│   │   ├── auth/       # Auth pages
│   │   └── login/      # Login page
│   ├── components/     # React components
│   │   ├── budget/     # Budget-specific components
│   │   └── ui/         # shadcn/ui components
│   ├── contexts/       # React contexts (Auth, Language)
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utility functions & services
│   └── types/          # TypeScript type definitions
├── supabase/
│   ├── migrations/     # Database migrations
│   └── schema.sql      # Database schema
└── ...config files
```

---

## 🔧 Key Configuration Files

- **`next.config.ts`** - Next.js configuration
- **`tailwind.config.ts`** - Tailwind CSS configuration
- **`tsconfig.json`** - TypeScript configuration
- **`components.json`** - shadcn/ui configuration
- **`.env.local`** - Environment variables (create this)

---

## 🎨 Component Architecture

### Pages
- **`/`** - Landing page with features showcase
- **`/login`** - Authentication page
- **`/onboarding`** - User profile setup
- **`/app`** - Main dashboard
- **`/app/create-budget`** - Budget creation workspace
- **`/app/history`** - Budget history & comparison
- **`/app/profile`** - User profile management
- **`/app/rewards`** - Rewards & achievements

### Key Components
- **`CreateBudgetWorkspace`** - Main budget creation interface
- **`BudgetInputForm`** - Transaction upload & initial input
- **`ChatSection`** - AI chat for budget refinement
- **`BudgetTableSection`** - Budget display & editing
- **`TransactionUploader`** - File upload (CSV/images)
- **`BudgetChart`** - Data visualization

---

## 🔐 Authentication

This app uses Supabase Auth with email/password authentication:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123'
})

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})

// Sign out
await supabase.auth.signOut()
```

---

## 📊 Database Schema

### Tables
- **`user_profile`** - User demographic & financial info
- **`transactions`** - Uploaded transaction data
- **`budget_history`** - AI-generated budgets
- **`budget_sessions`** - Active budget creation sessions
- **`rewards`** - User achievements & badges

See `supabase/schema.sql` for full schema definition.

---

## 🤖 AI Integration

### OpenAI GPT-4o
Used for:
- Transaction analysis from images (Vision)
- Budget generation based on spending patterns
- Conversational budget refinement
- Financial recommendations

Example API call:
```typescript
const response = await openai.chat.completions.create({
  model: "gpt-4o",
  messages: [
    { role: "system", content: "You are a financial advisor..." },
    { role: "user", content: userMessage }
  ]
})
```

---

## 🌍 Internationalization

The app supports multiple languages using React Context:

```typescript
// In any component
const { language, setLanguage, t } = useLanguage()

// Use translations
<h1>{t('welcome')}</h1>

// Change language
setLanguage('id') // Indonesian
setLanguage('en') // English
```

---

## 📱 Responsive Design

Built mobile-first with Tailwind CSS breakpoints:
- **sm** (640px) - Small tablets
- **md** (768px) - Tablets
- **lg** (1024px) - Desktops
- **xl** (1280px) - Large desktops

---

## 🧪 Scripts

```bash
# Development
bun run dev          # Start dev server with Turbopack

# Production
bun run build        # Build for production
bun run start        # Start production server

# Code Quality
bun run lint         # Run ESLint
```

---

## 🚀 Deployment

### Vercel (Recommended)
1. Push your code to GitHub
2. Import project to Vercel
3. Add environment variables
4. Deploy!

### Environment Variables
Make sure to set these in your deployment platform:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `OPENAI_API_KEY`

---

## 🤝 Contributing

This is a private/proprietary project. For contribution guidelines, please contact the project maintainer.

---

## 📄 License

Private/Proprietary

---

## 🙏 Acknowledgments

Built with ❤️ using:
- [Next.js](https://nextjs.org/)
- [Supabase](https://supabase.com/)
- [OpenAI](https://openai.com/)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Query](https://tanstack.com/query)

---

## 📞 Support

For issues or questions, please contact the development team or create an issue in the repository.

---

**Last Updated:** October 2025
