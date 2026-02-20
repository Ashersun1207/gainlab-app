import { createRoot } from 'react-dom/client';
import './index.css';
// (#12) Widget 渲染器注册 — 在 App 之前执行，确保任何路径都能查到注册表
import './catalog/widget-registration';
import App from './App.tsx';

// ⚠️ 不用 StrictMode —— KLineChart 内部管理 canvas 生命周期，
// StrictMode 的 mount→unmount→remount 会导致 chart 被 dispose 后不显示
const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');
createRoot(root).render(<App />);
