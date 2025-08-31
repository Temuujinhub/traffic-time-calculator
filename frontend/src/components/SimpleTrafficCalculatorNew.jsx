import { useState } from 'react';

const SimpleTrafficCalculator = ({ onCalculationComplete }) => {
  const [formData, setFormData] = useState({
    origin: '',
    waypoint: '',
    destination: '',
    normalDuration: '',
    trafficDuration: '',
    distance: ''
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.origin.trim()) {
      newErrors.origin = 'Эхлэх цэгийг оруулна уу';
    }
    if (!formData.destination.trim()) {
      newErrors.destination = 'Төгсөх цэгийг оруулна уу';
    }
    if (!formData.normalDuration || formData.normalDuration <= 0) {
      newErrors.normalDuration = 'Ердийн цагийг оруулна уу';
    }
    if (!formData.trafficDuration || formData.trafficDuration <= 0) {
      newErrors.trafficDuration = 'Түгжрэлтэй цагийг оруулна уу';
    }
    if (!formData.distance || formData.distance <= 0) {
      newErrors.distance = 'Зайг оруулна уу';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const calculateTrafficLoss = async () => {
    if (!validateForm()) {
      return;
    }

    setIsCalculating(true);
    
    // Simulate calculation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      const normalTime = parseFloat(formData.normalDuration);
      const trafficTime = parseFloat(formData.trafficDuration);
      const distance = parseFloat(formData.distance);
      
      // Calculate daily loss (round trip)
      const oneWayLoss = Math.max(0, trafficTime - normalTime);
      const dailyLoss = oneWayLoss * 2; // morning + evening
      
      // Calculate various timeframes
      const weeklyLoss = dailyLoss * 5; // 5 working days
      const monthlyLoss = dailyLoss * 22; // 22 working days
      const yearlyLoss = dailyLoss * 250; // 250 working days
      
      // Convert yearly loss to hours and minutes
      const yearlyHours = Math.floor(yearlyLoss / 60);
      const yearlyMinutes = yearlyLoss % 60;
      
      // Calculate fuel consumption and costs
      const dailyDistanceKm = distance * 2; // round trip
      const yearlyDistanceKm = dailyDistanceKm * 250;
      const fuelConsumptionPer100km = 8; // 8 liters per 100km
      const fuelConsumption = Math.round((yearlyDistanceKm / 100) * fuelConsumptionPer100km);
      
      const fuelPricePerLiter = 2500; // 2500 tugrik per liter
      const totalAnnualFuelCost = fuelConsumption * fuelPricePerLiter;
      const monthlyFuelCost = Math.round(totalAnnualFuelCost / 12);
      const dailyFuelCost = Math.round(totalAnnualFuelCost / 250);

      const calculationResults = {
        normalTime: normalTime,
        trafficTime: trafficTime,
        oneWayLoss: oneWayLoss,
        dailyLoss: dailyLoss,
        weeklyLoss: weeklyLoss,
        monthlyLoss: monthlyLoss,
        yearlyLoss: yearlyLoss,
        yearlyHours: yearlyHours,
        yearlyMinutes: yearlyMinutes,
        distance: distance,
        dailyDistanceKm: dailyDistanceKm,
        yearlyDistanceKm: Math.round(yearlyDistanceKm),
        fuelConsumption: fuelConsumption,
        totalAnnualFuelCost: totalAnnualFuelCost,
        monthlyFuelCost: monthlyFuelCost,
        dailyFuelCost: dailyFuelCost,
        calculatedAt: new Date().toLocaleString('mn-MN')
      };

      setResults(calculationResults);
      
      // Call the callback if provided
      if (onCalculationComplete) {
        onCalculationComplete(calculationResults);
      }
    } catch (error) {
      console.error('Calculation error:', error);
      setErrors({ general: 'Тооцоололд алдаа гарлаа' });
    } finally {
      setIsCalculating(false);
    }
  };

  const resetForm = () => {
    setFormData({
      origin: '',
      waypoint: '',
      destination: '',
      normalDuration: '',
      trafficDuration: '',
      distance: ''
    });
    setResults(null);
    setErrors({});
  };

  const cardStyles = {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '24px',
    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    border: '1px solid #e5e7eb',
    marginBottom: '24px'
  };

  const inputStyles = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    fontSize: '14px',
    outline: 'none'
  };

  const buttonStyles = {
    padding: '12px 24px',
    borderRadius: '6px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    border: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px'
  };

  const primaryButtonStyles = {
    ...buttonStyles,
    backgroundColor: isCalculating ? '#9ca3af' : '#3b82f6',
    color: 'white',
    cursor: isCalculating ? 'not-allowed' : 'pointer'
  };

  const secondaryButtonStyles = {
    ...buttonStyles,
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db'
  };

  const labelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  };

  const errorStyles = {
    color: '#dc2626',
    fontSize: '12px',
    marginTop: '4px'
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <div style={cardStyles}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '8px', color: '#1f2937' }}>
          🧮 Энгийн замын цагийн тооцоолуур
        </h2>
        <p style={{ color: '#6b7280', marginBottom: '24px' }}>
          Гараар мэдээлэл оруулж, замын түгжрэлээс алдагдах цагийг тооцоолно уу
        </p>

        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyles}>🏠 Эхлэх цэг</label>
              <input
                type="text"
                placeholder="Гэр, байр гэх мэт..."
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                style={{
                  ...inputStyles,
                  borderColor: errors.origin ? '#dc2626' : '#d1d5db'
                }}
              />
              {errors.origin && <div style={errorStyles}>{errors.origin}</div>}
            </div>

            <div>
              <label style={labelStyles}>🎯 Дундах цэг (заавал биш)</label>
              <input
                type="text"
                placeholder="Сургууль, дэлгүүр гэх мэт..."
                value={formData.waypoint}
                onChange={(e) => handleInputChange('waypoint', e.target.value)}
                style={inputStyles}
              />
            </div>

            <div>
              <label style={labelStyles}>🏢 Төгсөх цэг</label>
              <input
                type="text"
                placeholder="Ажлын байр гэх мэт..."
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                style={{
                  ...inputStyles,
                  borderColor: errors.destination ? '#dc2626' : '#d1d5db'
                }}
              />
              {errors.destination && <div style={errorStyles}>{errors.destination}</div>}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
            <div>
              <label style={labelStyles}>⏱️ Ердийн цаг (минут)</label>
              <input
                type="number"
                placeholder="25"
                min="1"
                value={formData.normalDuration}
                onChange={(e) => handleInputChange('normalDuration', e.target.value)}
                style={{
                  ...inputStyles,
                  borderColor: errors.normalDuration ? '#dc2626' : '#d1d5db'
                }}
              />
              {errors.normalDuration && <div style={errorStyles}>{errors.normalDuration}</div>}
            </div>

            <div>
              <label style={labelStyles}>🚦 Түгжрэлтэй цаг (минут)</label>
              <input
                type="number"
                placeholder="45"
                min="1"
                value={formData.trafficDuration}
                onChange={(e) => handleInputChange('trafficDuration', e.target.value)}
                style={{
                  ...inputStyles,
                  borderColor: errors.trafficDuration ? '#dc2626' : '#d1d5db'
                }}
              />
              {errors.trafficDuration && <div style={errorStyles}>{errors.trafficDuration}</div>}
            </div>

            <div>
              <label style={labelStyles}>📏 Зай (км)</label>
              <input
                type="number"
                placeholder="15.5"
                min="0.1"
                step="0.1"
                value={formData.distance}
                onChange={(e) => handleInputChange('distance', e.target.value)}
                style={{
                  ...inputStyles,
                  borderColor: errors.distance ? '#dc2626' : '#d1d5db'
                }}
              />
              {errors.distance && <div style={errorStyles}>{errors.distance}</div>}
            </div>
          </div>
        </div>

        {errors.general && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {errors.general}
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={calculateTrafficLoss}
            disabled={isCalculating}
            style={primaryButtonStyles}
          >
            {isCalculating ? (
              <>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid transparent',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                Тооцоолж байна...
              </>
            ) : (
              <>
                🧮 Цагийн алдагдал тооцоолох
              </>
            )}
          </button>

          <button
            onClick={resetForm}
            style={secondaryButtonStyles}
          >
            🔄 Дахин эхлэх
          </button>
        </div>
      </div>

      {results && (
        <div style={cardStyles}>
          <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '16px', color: '#1f2937' }}>
            📊 Тооцооллын үр дүн
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                ⏱️ Нэг удаагийн алдагдал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                {results.oneWayLoss} минут
              </p>
              <p style={{ fontSize: '12px', color: '#16a34a' }}>
                ({results.trafficTime} - {results.normalTime})
              </p>
            </div>

            <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', color: '#ea580c', marginBottom: '8px' }}>
                📅 Өдрийн алдагдал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
                {results.dailyLoss} минут
              </p>
              <p style={{ fontSize: '12px', color: '#ea580c' }}>Явах + буцах</p>
            </div>

            <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', color: '#a16207', marginBottom: '8px' }}>
                📅 7 хоногийн алдагдал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>
                {results.weeklyLoss} минут
              </p>
              <p style={{ fontSize: '12px', color: '#ca8a04' }}>
                {Math.floor(results.weeklyLoss/60)} цаг {results.weeklyLoss%60} минут
              </p>
            </div>

            <div style={{ backgroundColor: '#faf5ff', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', color: '#7c2d12', marginBottom: '8px' }}>
                📅 Сарын алдагдал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
                {results.monthlyLoss} минут
              </p>
              <p style={{ fontSize: '12px', color: '#a855f7' }}>
                {Math.floor(results.monthlyLoss/60)} цаг {results.monthlyLoss%60} минут
              </p>
            </div>

            <div style={{ 
              backgroundColor: '#fef2f2', 
              padding: '16px', 
              borderRadius: '8px',
              border: '2px solid #fecaca'
            }}>
              <h4 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                🚨 Жилийн алдагдал
              </h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>
                {results.yearlyHours} цаг {results.yearlyMinutes} минут
              </p>
              <p style={{ fontSize: '12px', color: '#dc2626' }}>
                Энэ нь {Math.floor(results.yearlyHours/24)} өдрийн цагтай тэнцэнэ!
              </p>
            </div>

            <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
              <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                ⛽ Жилийн шатахуун
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {results.fuelConsumption} литр
              </p>
              <p style={{ fontSize: '12px', color: '#3b82f6' }}>
                {results.yearlyDistanceKm.toLocaleString()} км замд
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '16px',
            backgroundColor: '#f8fafc',
            padding: '16px',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#64748b'
          }}>
            <p><strong>Тооцоолсон огноо:</strong> {results.calculatedAt}</p>
            <p><strong>Маршрут:</strong> {formData.origin} → {formData.waypoint ? formData.waypoint + ' → ' : ''}{formData.destination}</p>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SimpleTrafficCalculator;
