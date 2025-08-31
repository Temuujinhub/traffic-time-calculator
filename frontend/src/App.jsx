import { useState } from 'react';
import SimpleGoogleMapsCalculator from './components/SimpleGoogleMapsCalculator';
import SimpleTrafficCalculator from './components/SimpleTrafficCalculator';
import CalculationsTable from './components/CalculationsTable';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('google-maps');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCalculationComplete = () => {
    // Trigger refresh of calculations table
    setRefreshTrigger(prev => prev + 1);
  };

  const tabStyles = {
    container: {
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '32px 16px'
    },
    wrapper: {
      maxWidth: '1200px',
      margin: '0 auto'
    },
    tabList: {
      display: 'flex',
      backgroundColor: 'white',
      borderRadius: '8px',
      padding: '4px',
      marginBottom: '24px',
      boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
    },
    tabButton: {
      flex: 1,
      padding: '12px 16px',
      border: 'none',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '8px',
      transition: 'all 0.2s'
    },
    activeTab: {
      backgroundColor: '#3b82f6',
      color: 'white'
    },
    inactiveTab: {
      backgroundColor: 'transparent',
      color: '#6b7280'
    }
  };

  return (
    <div style={tabStyles.container}>
      <div style={tabStyles.wrapper}>
        {/* Custom Tab Navigation */}
        <div style={tabStyles.tabList}>
          <button
            style={{
              ...tabStyles.tabButton,
              ...(activeTab === 'google-maps' ? tabStyles.activeTab : tabStyles.inactiveTab)
            }}
            onClick={() => setActiveTab('google-maps')}
          >
            🗺️ Google Maps
          </button>
          <button
            style={{
              ...tabStyles.tabButton,
              ...(activeTab === 'calculator' ? tabStyles.activeTab : tabStyles.inactiveTab)
            }}
            onClick={() => setActiveTab('calculator')}
          >
            🧮 Энгийн тооцоолуур
          </button>
          <button
            style={{
              ...tabStyles.tabButton,
              ...(activeTab === 'history' ? tabStyles.activeTab : tabStyles.inactiveTab)
            }}
            onClick={() => setActiveTab('history')}
          >
            📊 Түүх
          </button>
        </div>
        
        {/* Tab Content */}
        {activeTab === 'google-maps' && (
          <SimpleGoogleMapsCalculator onCalculationComplete={handleCalculationComplete} />
        )}
        
        {activeTab === 'calculator' && (
          <SimpleTrafficCalculator onCalculationComplete={handleCalculationComplete} />
        )}
        
        {activeTab === 'history' && (
          <CalculationsTable refreshTrigger={refreshTrigger} />
        )}
      </div>
    </div>
  );
}

export default App;
