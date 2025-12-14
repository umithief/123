
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { CONFIG } from './services/config';
import { LanguageProvider } from './contexts/LanguageProvider';

async function enableMocking() {
  // Only enable MSW if we are NOT using the internal Mock API mode (localStorage)
  // AND we are in development mode.
  // This allows MSW to simulate the backend when USE_MOCK_API is false (Live Mode)
  // but the real backend isn't running.
  if (!CONFIG.USE_MOCK_API && process.env.NODE_ENV === 'development') {
    const { worker } = await import('./mocks/browser');
    
    // Start the worker
    return worker.start({
        onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    }).catch(err => {
        console.warn('MSW worker failed to start. Standard backend connection will be used.', err);
    });
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = createRoot(rootElement);

enableMocking().then(() => {
    root.render(
      <React.StrictMode>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </React.StrictMode>
    );
});
