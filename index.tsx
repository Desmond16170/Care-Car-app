(window as any).global = window;

import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import App from './App';
import './index.css';

// Aplicar estilos desde localStorage
const bg = localStorage.getItem('car-care-background-color');
const txt = localStorage.getItem('car-care-body-text-color');
const btnBg = localStorage.getItem('car-care-primary-color');
const btnText = localStorage.getItem('car-care-text-color');
const font = localStorage.getItem('car-care-font-family');

document.body.classList.add('custom-theme');
if (bg) document.documentElement.style.setProperty('--custom-bg-color', bg);
if (txt) document.documentElement.style.setProperty('--custom-text-color', txt);
if (btnBg) document.documentElement.style.setProperty('--custom-button-bg', btnBg);
if (btnText) document.documentElement.style.setProperty('--custom-button-text', btnText);
if (font) document.documentElement.style.setProperty('--custom-font', font);

// Mostrar solo el área de impresión cuando se imprime
window.onbeforeprint = () => {
  const printArea = document.getElementById('print-area');
  if (printArea) {
    printArea.style.display = 'block';
  }
};

window.onafterprint = () => {
  const printArea = document.getElementById('print-area');
  if (printArea) {
    printArea.style.display = 'none';
  }
};

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <HashRouter>
    <App />
  </HashRouter>
);
