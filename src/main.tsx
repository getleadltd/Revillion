import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import { initAnalytics } from './lib/lazyAnalytics'

createRoot(document.getElementById("root")!).render(<App />);

// Initialize Google Analytics immediately
initAnalytics();
