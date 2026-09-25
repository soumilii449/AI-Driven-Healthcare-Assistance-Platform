import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import ReloadPrompt from './components/ReloadPrompt.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <ReloadPrompt />
  </React.StrictMode>,
)