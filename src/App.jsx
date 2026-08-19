import AppRouter from './app/router.jsx'
import { usePageTranslation } from '@/shared/i18n/usePageTranslation'
<<<<<<< HEAD
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
=======
import { ToastProvider } from '@/shared/toast/ToastProvider'

function App() {
  usePageTranslation()
  return <ToastProvider><AppRouter /></ToastProvider>
>>>>>>> 7bad699 (save local work before pulling latest changes)
}

export default App