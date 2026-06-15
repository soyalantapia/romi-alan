import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App'
import { AuthProvider } from './context/AuthContext'
import { ProfilesProvider } from './context/ProfilesContext'
import { ConfigProvider } from './context/ConfigContext'
import { bootstrapAppearance } from './lib/appearance'

bootstrapAppearance()

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ProfilesProvider>
          <ConfigProvider>
            <App />
          </ConfigProvider>
        </ProfilesProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
)
