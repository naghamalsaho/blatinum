import { useEffect, useState } from 'react'
import AppRouter from './app/router.jsx'
import { usePageTranslation } from '@/shared/i18n/usePageTranslation'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from '@/shared/toast/ToastProvider'
import { getLanguage, setLanguage } from '@/shared/i18n'

function App() {
  usePageTranslation()
  const [, setLangState] = useState(getLanguage())

  useEffect(() => {
    // ضبط اللغة والاتجاه فور الإقلاع
    setLanguage(getLanguage())

    // الاستماع لحدث التغيير لإعادة التصيير عند التبديل
    const handleLangChange = () => {
      setLangState(getLanguage())
    }

    window.addEventListener('languageChange', handleLangChange)
    return () => window.removeEventListener('languageChange', handleLangChange)
  }, [])

  return (
    <ToastProvider>
      <Toaster 
        position="top-left" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
        }}
      />
      <AppRouter />
    </ToastProvider>
  )
}

export default App