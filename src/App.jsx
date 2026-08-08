import AppRouter from './app/router.jsx'
import { usePageTranslation } from '@/shared/i18n/usePageTranslation'

function App() {
  usePageTranslation()
  return <AppRouter />
}

export default App
