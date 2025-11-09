import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import './lib/i18n'
import { initAnalytics } from './lib/lazyAnalytics'

// Initialize Google Analytics (Consent Mode is initialized inside)
initAnalytics();

createRoot(document.getElementById("root")!).render(<App />);
