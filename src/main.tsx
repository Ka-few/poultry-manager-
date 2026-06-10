import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles.css';

function showStartupError(error: unknown) {
  const root = document.getElementById('root');
  const message = error instanceof Error ? error.message : String(error);

  if (root) {
    root.innerHTML = `
      <main class="fatal-error">
        <h1>App startup failed</h1>
        <p>${message}</p>
      </main>
    `;
  }
}

window.addEventListener('error', (event) => {
  showStartupError(event.error ?? event.message);
});

window.addEventListener('unhandledrejection', (event) => {
  showStartupError(event.reason);
});

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
} catch (error) {
  showStartupError(error);
}
