import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
// Side-effect import: registers the translation resources and the <html lang>
// handling before any component renders.
import './i18n';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import { HelmetProvider } from 'react-helmet-async';

// Triggered by tools like `eslint-disable-next-line` used to silence a false
// positive. Logged rather than thrown so a stray pragma during a hot reload
// doesn't blank the whole app.
window.addEventListener('error', (event) => {
  if (event.message.includes('ResizeObserver loop')) {
    event.stopImmediatePropagation();
    return;
  }
  console.error('Unhandled error:', event.error ?? event.message);
});

const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element #root not found in index.html');
}

// HelmetProvider is mandatory, not optional: without it every <Helmet> in the
// tree renders its tags into a detached context that never reaches the DOM. The
// 13 page components each set their own <title> and meta description, and all of
// them were being dropped silently — leaving one static title from index.html on
// every URL. It sits inside ErrorBoundary so a Helmet failure still surfaces
// through the boundary rather than blanking the page.
createRoot(container).render(
  <StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <App />
      </HelmetProvider>
    </ErrorBoundary>
  </StrictMode>
);