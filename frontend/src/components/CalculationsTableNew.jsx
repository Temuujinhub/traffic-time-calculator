import { useState, useEffect } from 'react';

const CalculationsTable = ({ refreshTrigger }) => {
  const [calculations, setCalculations] = useState([]);

  useEffect(() => {
    loadCalculations();
  }, [refreshTrigger]);

  const loadCalculations = () => {
    try {
      const saved = localStorage.getItem('trafficCalculations');
      if (saved) {
        const parsed = JSON.parse(saved);
        setCalculations(Array.isArray(parsed) ? parsed : []);
      }
    } catch (error) {
      console.error('Error loading calculations:', error);
      setCalculations([]);
    }
  };

  const clearHistory = () => {
    if (window.confirm('Бүх түүхийг устгах уу?')) {
      localStorage.removeItem('trafficCalculations');
      setCalculations([]);
    }
  };

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}ц ${mins}м` : `${mins}м`;
  };

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
  };

  const tableStyles = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px'
  };

  const thStyles = {
    backgroundColor: '#f9fafb',
    padding: '12px 8px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#374151',
    borderBottom: '1px solid #e5e7eb'
  };

  const tdStyles = {
    padding: '12px 8px',
    borderBottom: '1px solid #f3f4f6',
    color: '#6b7280'
  };

  const buttonStyles = {
    padding: '8px 16px',
    backgroundColor: '#dc2626',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer'
  };

  if (calculations.length === 0) {
    return (
      <div style={cardStyles}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
          📊 Тооцооллын түүх
        </h2>
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: '#6b7280'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
          <p>Одоогоор тооцоолол хийгдээгүй байна</p>
          <p style={{ fontSize: '12px', marginTop: '8px' }}>
            Тооцоолол хийсний дараа энд харагдах болно
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={cardStyles}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937' }}>
          📊 Тооцооллын түүх
        </h2>
        <button
          onClick={clearHistory}
          style={buttonStyles}
        >
          🗑️ Түүх устгах
        </button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={tableStyles}>
          <thead>
            <tr>
              <th style={thStyles}>Огноо</th>
              <th style={thStyles}>Маршрут</th>
              <th style={thStyles}>Ердийн цаг</th>
              <th style={thStyles}>Түгжрэлтэй цаг</th>
              <th style={thStyles}>Өдрийн алдагдал</th>
              <th style={thStyles}>Жилийн алдагдал</th>
              <th style={thStyles}>Зай</th>
              <th style={thStyles}>Төрөл</th>
            </tr>
          </thead>
          <tbody>
            {calculations.map((calc, index) => (
              <tr key={index}>
                <td style={tdStyles}>
                  {calc.calculatedAt || 'Тодорхойгүй'}
                </td>
                <td style={tdStyles}>
                  {calc.routes || `${calc.origin || ''} → ${calc.destination || ''}`}
                </td>
                <td style={tdStyles}>
                  {formatTime(calc.normalTime || 0)}
                </td>
                <td style={tdStyles}>
                  {formatTime(calc.currentTrafficTime || calc.trafficTime || 0)}
                </td>
                <td style={tdStyles}>
                  <span style={{ color: '#dc2626', fontWeight: '600' }}>
                    {formatTime(calc.dailyLoss || 0)}
                  </span>
                </td>
                <td style={tdStyles}>
                  <span style={{ color: '#dc2626', fontWeight: '600' }}>
                    {calc.yearlyHours || 0}ц {calc.yearlyMinutes || 0}м
                  </span>
                </td>
                <td style={tdStyles}>
                  {calc.routeDistance || calc.distance || 0} км
                </td>
                <td style={tdStyles}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '500',
                    backgroundColor: calc.routes ? '#dbeafe' : '#fef3c7',
                    color: calc.routes ? '#1e40af' : '#92400e'
                  }}>
                    {calc.routes ? 'Google Maps' : 'Гар тооцоо'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        backgroundColor: '#f0f9ff',
        borderRadius: '6px',
        fontSize: '12px',
        color: '#0369a1'
      }}>
        💡 <strong>Зөвлөгөө:</strong> Тооцооллын түүх нь таны хөтчийн local storage-д хадгалагддаг тул 
        хөтчийн мэдээллийг устгавал түүх алга болно.
      </div>
    </div>
  );
};

export default CalculationsTable;
