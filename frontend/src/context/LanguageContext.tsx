import React, { createContext, useContext, useState, useEffect } from 'react'

export type Language = 'en' | 'hi'

interface LanguageContextType {
  language: Language
  isHindi: boolean
  setLanguage: (lang: Language) => void
  toggleLanguage: () => void
  t: (en: string, hi: string) => string
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  isHindi: false,
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (en: string) => en,
})

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('sfs_lang')
      return saved === 'hi' ? 'hi' : 'en'
    } catch {
      return 'en'
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem('sfs_lang', language)
      document.documentElement.lang = language
    } catch {
      // ignore
    }
  }, [language])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
  }

  const toggleLanguage = () => {
    setLanguageState(prev => (prev === 'en' ? 'hi' : 'en'))
  }

  const t = (en: string, hi: string) => (language === 'hi' ? hi : en)

  return (
    <LanguageContext.Provider
      value={{
        language,
        isHindi: language === 'hi',
        setLanguage,
        toggleLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
