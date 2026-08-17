import AppRouter from './app/router.jsx'
import { usePageTranslation } from '@/shared/i18n/usePageTranslation'
import { Toaster } from 'react-hot-toast' // 👈 1. استيراد Toaster

function App() {
  usePageTranslation()

  return (
    <>
      {/* 👈 2. إضافة حاوي الإشعارات أعلى تطبيقك */}
      <Toaster 
        position="top-left" 
        reverseOrder={false}
        toastOptions={{
          duration: 4000,
        }}
      />
      
      <AppRouter />
    </>
  )
}

export default App