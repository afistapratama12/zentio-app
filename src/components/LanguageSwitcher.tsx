import { useLanguage } from '@/contexts/LanguageContext'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Languages } from 'lucide-react'

export function LanguageSwitcher() {
  const { language, setLanguage, t, canChangeLanguage } = useLanguage()

  // Don't render if user is not logged in
  if (!canChangeLanguage) {
    return null
  }

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="w-[180px]">
        <div className="flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <SelectValue />
        </div>
      </SelectTrigger>
      <SelectContent className="bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <SelectItem value="en">
          <span className="font-medium">🇬🇧 {t.dashboard.english}</span>
        </SelectItem>
        <SelectItem value="id">
          <span className="font-medium">🇮🇩 {t.dashboard.indonesian}</span>
        </SelectItem>
      </SelectContent>
    </Select>
  )
}
