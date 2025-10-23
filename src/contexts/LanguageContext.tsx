import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Language, translations } from '@/lib/i18n'
import { useUser } from '@/hooks/use-auth'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: typeof translations.en
  canChangeLanguage: boolean // Only true when user is logged in
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

const LANGUAGE_STORAGE_KEY = 'zentio_language'

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const user = useUser()

  // Can only change language when logged in
  const canChangeLanguage = !!user.data?.id

  // Load language preference from localStorage (only if logged in)
  useEffect(() => {
    const loadLanguage = () => {
      if (user.data?.id) {
        // Load user's preference only when logged in
        const storageKey = `${LANGUAGE_STORAGE_KEY}_${user.data.id}`
        const saved = localStorage.getItem(storageKey) as Language
        
        if (saved && (saved === 'en' || saved === 'id')) {
          setLanguageState(saved)
        } else {
          // Default to English for logged-in users too
          setLanguageState('en')
        }
      } else {
        // Force English for non-authenticated users
        setLanguageState('en')
      }
    }

    loadLanguage()
  }, [user.data?.id])

  const setLanguage = (lang: Language) => {
    // Only allow language change if user is logged in
    if (!user.data?.id) {
      console.warn('Language change is only available for logged-in users')
      return
    }

    setLanguageState(lang)
    
    // Save to localStorage with user-specific key
    const storageKey = `${LANGUAGE_STORAGE_KEY}_${user.data.id}`
    localStorage.setItem(storageKey, lang)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t: translations[language],
        canChangeLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider')
  }
  return context
}
