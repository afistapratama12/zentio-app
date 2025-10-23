# 🚀 Zentio Quick Setup Guide

## Step 1: Setup Supabase

### 1.1 Create Supabase Project
1. Go to [https://supabase.com](https://supabase.com)
2. Sign in / Sign up
3. Click "New Project"
4. Fill in:
   - **Project name:** zentio (atau nama lain)
   - **Database password:** (simpan ini!)
   - **Region:** Pilih terdekat
5. Wait ~2 minutes untuk project ready

### 1.2 Get Supabase Credentials
1. Di Supabase Dashboard, go to **Project Settings** (⚙️ icon)
2. Klik **API** tab
3. Copy:
   - **URL** (Project URL)
   - **anon/public** key

### 1.3 Run Database Schema
1. Di Supabase Dashboard, go to **SQL Editor**
2. Click **New query**
3. Copy paste semua isi dari file `supabase/schema.sql`
4. Click **RUN** (atau Ctrl+Enter)
5. Jika berhasil, akan muncul "Success"

### 1.4 Verify Tables Created
1. Go to **Database** → **Tables**
2. Pastikan ada 4 tables:
   - `user_profile`
   - `transactions`
   - `budget_history`
   - `rewards`

---

## Step 2: Setup OpenAI

### 2.1 Get OpenAI API Key
1. Go to [https://platform.openai.com](https://platform.openai.com)
2. Sign in
3. Go to **API keys** page
4. Click **Create new secret key**
5. Name it "Zentio" (optional)
6. Copy the key (you can only see it once!)
7. Save it somewhere safe

### 2.2 Add Credits (if needed)
1. Go to **Settings** → **Billing**
2. Add payment method
3. Add credits (minimum $5 recommended for testing)

---

## Step 3: Configure Application

### 3.1 Setup Environment Variables
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Open `.env` dan isi:
   ```env
   # Paste Supabase URL (dari step 1.2)
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   
   # Paste Supabase anon key (dari step 1.2)
   VITE_SUPABASE_ANON_KEY=eyJhbGc...
   
   # Paste OpenAI API key (dari step 2.1)
   VITE_OPENAI_API_KEY=sk-...
   
   # Keep this as is
   VITE_APP_URL=http://localhost:3000
   ```

3. Save file

---

## Step 4: Run Application

### 4.1 Install Dependencies (if not done)
```bash
npm install
```

### 4.2 Start Development Server
```bash
npm run dev
```

### 4.3 Open Browser
Go to: **http://localhost:3000**

You should see the Zentio homepage!

---

## Step 5: Verify Setup

### ✅ Checklist

- [ ] Supabase project created
- [ ] Database schema executed successfully
- [ ] 4 tables visible in Supabase dashboard
- [ ] OpenAI API key generated
- [ ] `.env` file filled with all credentials
- [ ] `npm run dev` works without errors
- [ ] App opens in browser at localhost:3000

---

## 🐛 Common Issues

### Issue: "Missing Supabase environment variables"
**Solution:** Check bahwa `.env` file ada dan berisi `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY`

### Issue: "Cannot find module '~/lib/utils'"
**Solution:** Pastikan sudah run `npm install` dan TypeScript paths sudah di-configure

### Issue: "OpenAI API key is invalid"
**Solution:** 
1. Pastikan key dimulai dengan `sk-`
2. Check tidak ada spasi atau enter di key
3. Generate key baru jika perlu

### Issue: Node.js version warning
**Solution:** 
- Warning bisa diabaikan untuk development
- Atau upgrade Node.js ke 22.12+ dengan nvm:
  ```bash
  nvm install 22.12
  nvm use 22.12
  ```

---

## 📝 What's Next?

After setup complete, you can:

1. **Test the basic setup:**
   - Homepage should load
   - No errors in console
   
2. **Start development:**
   - Follow `PROGRESS.md` untuk development roadmap
   - Start dengan Authentication atau Homepage

3. **Customize:**
   - Edit homepage di `src/routes/index.tsx`
   - Modify colors di `src/styles.css`

---

## 💡 Tips

- Keep `.env` file **PRIVATE** - jangan commit ke git
- Save your Supabase password safely
- OpenAI API key juga **RAHASIA**
- Test dengan small data dulu sebelum production

---

## 🆘 Need Help?

If stuck, check:
1. Console logs for errors
2. Supabase Dashboard > Logs
3. `.env` file spelling/format
4. Network connection

---

**Setup Time:** ~15-20 minutes  
**Next:** Check `PROGRESS.md` for development steps
