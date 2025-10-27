import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import { initLazyAnalytics } from './lib/lazyAnalytics'

createRoot(document.getElementById("root")!).render(<App />);

// Initialize lazy-loaded Google Analytics
initLazyAnalytics();
