import React from 'react';
import { Toaster } from 'react-hot-toast';
import { AppRoutes } from './routes/AppRoutes';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#0f1a2e',
              color: '#e2e8f0',
              border: '1px solid rgba(100,200,255,0.15)',
              borderRadius: '12px',
              fontSize: '14px',
            },
            success: { iconTheme: { primary: '#00e676', secondary: '#0f1a2e' } },
            error:   { iconTheme: { primary: '#ff4081', secondary: '#0f1a2e' } },
          }}
        />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
