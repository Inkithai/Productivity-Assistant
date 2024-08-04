import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App.jsx';
import './styles/base.css';

const storedTheme = localStorage.getItem('pa_theme');
const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
document.documentElement.dataset.theme = storedTheme || (prefersDark ? 'dark' : 'light');
import './styles/components.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
