import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

/**
 * The target DOM element ID where the React application mounts.
 */
const ROOT_ELEMENT_ID = 'root';

/**
 * Bootstraps and renders the root React application into the DOM.
 */
function initializeApplication(): void {
  const rootContainer = document.getElementById(ROOT_ELEMENT_ID);

  if (!rootContainer) {
    throw new Error(
      `Failed to mount application: Root element with id "${ROOT_ELEMENT_ID}" was not found in the DOM document.`,
    );
  }

  const root = createRoot(rootContainer);

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

initializeApplication();