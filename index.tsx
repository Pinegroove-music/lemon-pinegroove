import React from 'react';
import ReactDOM from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import './index.css';
import { useStore } from './store/useStore';

// --- Legge la preferenza dark/light prima del render ---
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
  document.documentElement.classList.add('dark');
  // sincronizza lo store senza dover aspettare il render
  useStore.setState({ isDarkMode: true });
} else {
  document.documentElement.classList.remove('dark');
  useStore.setState({ isDarkMode: false });
}

// --- Montaggio dell'app React ---
const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>
);
