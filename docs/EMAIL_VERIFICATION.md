# Email Verification Flow

## Overview
Zentio menggunakan email verification untuk memastikan user memiliki email yang valid sebelum dapat menggunakan aplikasi.

## Flow Diagram

```
User Sign Up (/login)
    ↓
Email Sent (Show "Check Email" page)
    ↓
User Clicks Verification Link in Email
    ↓
Redirect to /auth/confirm?token=xxx
    ↓
Token Validation & Auto Login
    ↓
Check if User Has Profile
    ↓
├─ Yes → Redirect to /app (Dashboard)
└─ No  → Redirect to /onboarding
```

## Files Involved

### 1. `/src/routes/login.tsx`
**Changes:**
- Added `showEmailSent` state
- Modified signup flow to show email verification message instead of direct redirect
- New UI component showing "Check Your Email" page with instructions

**Key Features:**
- Shows email sent confirmation after signup
- Displays step-by-step instructions
- Allows user to go back to login

### 2. `/src/routes/auth/confirm.tsx` (NEW)
**Purpose:** Handle email verification callback from Supabase

**States:**
- `loading` - Verifying token
- `success` - Email verified, redirecting
- `error` - Verification failed

**Process:**
1. Extract `access_token` and `refresh_token` from URL hash
2. Call `supabase.auth.setSession()` to authenticate user
3. Check if user has profile in database
4. Redirect accordingly:
   - With profile → `/app`
   - Without profile → `/onboarding`

**Error Handling:**
- Invalid/missing token
- Session creation failure
- Database query errors
- Shows retry button and login link

## Supabase Configuration

### Email Templates
Configure in Supabase Dashboard → Authentication → Email Templates

**Confirmation Email:**
```
Confirm your signup: {{ .ConfirmationURL }}
```

### URL Configuration
Set in Supabase Dashboard → Authentication → URL Configuration

**Site URL:** `http://localhost:3000` (dev) or production URL

**Redirect URLs:**
- `http://localhost:3000/auth/confirm`
- `https://yourdomain.com/auth/confirm` (production)

## Testing

### 1. Local Development
```bash
bun dev
```

### 2. Test Signup Flow
1. Navigate to `/login`
2. Switch to "Sign Up" tab
3. Enter email and password
4. Submit form
5. Should see "Check Your Email" page

### 3. Test Email Verification
**Option A - Check Supabase Dashboard:**
1. Go to Supabase Dashboard → Authentication → Users
2. Find your user
3. Check confirmation URL in logs

**Option B - Use Real Email:**
1. Use real email address in signup
2. Check inbox for verification email
3. Click verification link
4. Should redirect to `/auth/confirm` then to `/onboarding` or `/app`

### 4. Test Error Cases
**Invalid Token:**
```
http://localhost:3000/auth/confirm#access_token=invalid
```
Should show error message with retry options

## Security Considerations

1. **Token Validation**
   - Tokens are validated by Supabase auth system
   - Expired tokens automatically rejected
   - One-time use tokens

2. **Session Management**
   - Session created only after successful verification
   - Refresh token stored securely
   - Auto-logout on token expiry

3. **Rate Limiting**
   - Supabase handles rate limiting for verification endpoints
   - Prevents abuse

## User Experience

### Success Flow
```
1. User signs up
2. See friendly "Check Email" message
3. Click link in email
4. Auto-login with loading animation
5. Redirect to appropriate page
```

### Error Flow
```
1. Token invalid/expired
2. See clear error message
3. Options to:
   - Try again
   - Go to login
   - Contact support
```

## Common Issues & Solutions

### Issue 1: Email not received
**Solutions:**
- Check spam folder
- Verify email in Supabase settings
- Check email provider blocklist

### Issue 2: Confirmation link expired
**Solutions:**
- Implement resend email feature (future)
- Clear error message to user
- Provide login link

### Issue 3: Wrong redirect after verification
**Solutions:**
- Check profile existence in database
- Verify routing logic in confirm.tsx
- Check onboarding completion status

## Future Enhancements

1. **Resend Verification Email**
   - Add button in login page
   - Cooldown period (e.g., 1 minute)
   - Track resend attempts

2. **Email Change Verification**
   - Verify new email when user updates profile
   - Keep old email active until verified

3. **Magic Link Login**
   - Passwordless login option
   - One-time login links

4. **Email Preferences**
   - Allow users to manage notification settings
   - Opt-in/opt-out options

## Related Documentation
- [Authentication Flow](./AUTH_FLOW.md)
- [Onboarding Process](./ONBOARDING.md)
- [User Profile](./USER_PROFILE.md)
