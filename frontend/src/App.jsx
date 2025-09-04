import React from 'react';
import SimpleGoogleMapsCalculatorNew from './components/SimpleGoogleMapsCalculatorNew';
import './App.css';

function App() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '32px 16px'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <header style={{
          textAlign: 'center',
          marginBottom: '32px'
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#1f2937',
            marginBottom: '8px'
          }}>
            🚗 Түгжрэлийн цагийн тооцоолуур
          </h1>
          <p style={{
            fontSize: '16px',
            color: '#6b7280'
          }}>
            Монгол орны түгжрэлтэй замд зарцуулах цагийн тооцоо
          </p>
        </header>
        
        <SimpleGoogleMapsCalculatorNew />
      </div>
    </div>
  );
}

export default App;
