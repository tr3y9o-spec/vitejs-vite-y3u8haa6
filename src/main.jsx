import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App' // ← ここを変更
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App /> {/* ← ここを変更 */}
  </React.StrictMode>,
)
