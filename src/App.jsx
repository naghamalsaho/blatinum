import AppRouter from './app/router.jsx'
import { usePageTranslation } from '@/shared/i18n/usePageTranslation'
import { Toaster } from 'react-hot-toast'
import { ToastProvider } from '@/shared/toast/ToastProvider'

function App() {
  usePageTranslation()

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
