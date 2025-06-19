import { createRoot } from 'react-dom/client'
import * as React from 'react';
import App from './App.tsx'
import './index.css'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'; // Import these

    const queryClient = new QueryClient(); // Initialize QueryClient

    createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <QueryClientProvider client={queryClient}> {/* Wrap App with QueryClientProvider */}
          <App />
        </QueryClientProvider>
      </React.StrictMode>,
    );