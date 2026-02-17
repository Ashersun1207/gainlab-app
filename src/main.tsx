import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// ⚠️ 不用 StrictMode —— KLineChart 内部管理 canvas 生命周期，
// StrictMode 的 mount→unmount→remount 会导致 chart 被 dispose 后不显示
createRoot(document.getElementById('root')!).render(<App />)
