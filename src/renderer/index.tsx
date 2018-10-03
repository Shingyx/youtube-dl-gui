import React from 'react';
import ReactDOM from 'react-dom';
import { App } from './components/App';
import './index.css';

const app = document.getElementById('app')!;
app.style.height = '100%';
ReactDOM.render(<App />, app);
