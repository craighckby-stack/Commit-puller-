import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const rootContainer = document.getElementById('root');

if (!rootContainer) {
  throw new Error(
    'Failed to mount application: Root element with id "root" was not found in the document.',
  );
}

const root = createRoot(rootContainer);

root.render(
  <StrictMode>
    <App />
  </StrictMode>,
);