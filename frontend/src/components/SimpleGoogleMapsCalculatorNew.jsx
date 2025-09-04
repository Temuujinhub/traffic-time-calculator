import React, { useState } from 'react';

const GoogleMapsTrafficCalculator = () => {
  const [addresses, setAddresses] = useState({
    home: '',
    school: '',
    work: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAddressChange = (type, value) => {
    setAddresses(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const calculateRealTimeLoss = async () => {
    if (!addresses.home || !addresses.school) {
      setError('Гэр болон сургуулийн хаягийг оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🚀 Starting fallback calculation with Mongolia traffic simulation...');
      
      // Mongolia-specific fallback calculation
      // Улаанбаатарын дундаж зай болон цагийн тооцоо
      const averageDistanceKm = 15; // Дундаж нэг талын зай
      const normalSpeedKmh = 40; // Түгжрэлгүй дундаж хурд
      const trafficSpeedKmh = 25; // Түгжрэлтэй дундаж хурд
      
      // Үндсэн тооцоо
      const oneWayNormalTime = Math.round((averageDistanceKm / normalSpeedKmh) * 60); // минут
      const oneWayTrafficTime = Math.round((averageDistanceKm / trafficSpeedKmh) * 60); // минут
      
      console.log('📊 Mongolia fallback calculation:', {
        distance: averageDistanceKm + 'km',
        normalSpeed: normalSpeedKmh + 'km/h',
        trafficSpeed: trafficSpeedKmh + 'km/h',
        oneWayNormal: oneWayNormalTime + 'min',
        oneWayTraffic: oneWayTrafficTime + 'min'
      });

      let totalMorningTrafficTime = 0;
      let totalMorningNormalTime = 0;
      let routes = 'Гэр → Сургууль';
      let totalDistance = averageDistanceKm * 2; // Хоёр тал

      // Home to School (өглөө)
      totalMorningTrafficTime += oneWayTrafficTime;
      totalMorningNormalTime += oneWayNormalTime;

      // School to Work (хэрэв ажлын хаяг байвал)
      if (addresses.work && addresses.work.trim()) {
        totalMorningTrafficTime += oneWayTrafficTime;
        totalMorningNormalTime += oneWayNormalTime;
        routes += ' → Ажил';
        totalDistance += averageDistanceKm;
      }

      // Evening routes (орой)
      let totalEveningTrafficTime = 0;
      let totalEveningNormalTime = 0;

      if (addresses.work && addresses.work.trim()) {
        // Work to School
        totalEveningTrafficTime += oneWayTrafficTime;
        totalEveningNormalTime += oneWayNormalTime;
        totalDistance += averageDistanceKm;
      }

      // School to Home
      totalEveningTrafficTime += oneWayTrafficTime;
      totalEveningNormalTime += oneWayNormalTime;

      // School to Home
      totalEveningTrafficTime += oneWayTrafficTime;
      totalEveningNormalTime += oneWayNormalTime;

      const totalDailyTrafficTime = totalMorningTrafficTime + totalEveningTrafficTime;
      const totalDailyNormalTime = totalMorningNormalTime + totalEveningNormalTime;
      
      console.log('📊 Mongolia fallback calculation summary:', {
        morning: {
          trafficTime: totalMorningTrafficTime + 'min',
          normalTime: totalMorningNormalTime + 'min',
          loss: (totalMorningTrafficTime - totalMorningNormalTime) + 'min'
        },
        evening: {
          trafficTime: totalEveningTrafficTime + 'min', 
          normalTime: totalEveningNormalTime + 'min',
          loss: (totalEveningTrafficTime - totalEveningNormalTime) + 'min'
        },
        daily: {
          totalTrafficTime: totalDailyTrafficTime + 'min',
          totalNormalTime: totalDailyNormalTime + 'min',
          totalDistance: totalDistance.toFixed(1) + 'km'
        }
      });
      
      // Түгжрэлийн алдагдал = түгжрэлтэй цаг - түгжрэлгүй цаг
      const dailyTrafficLoss = totalDailyTrafficTime - totalDailyNormalTime;

      // Үндсэн тооцоог түгжрэлтэй цаг дээр үндэслэе
      const weeklyTrafficTime = totalDailyTrafficTime * 5; // 5 ажлын өдөр
      const monthlyTrafficTime = totalDailyTrafficTime * 22; // 22 ажлын өдөр  
      const yearlyTrafficTime = totalDailyTrafficTime * 250; // 250 ажлын өдөр

      // Цагаар шилжүүлэх
      const weeklyHours = Math.floor(weeklyTrafficTime / 60);
      const weeklyMinutes = weeklyTrafficTime % 60;
      
      const monthlyHours = Math.floor(monthlyTrafficTime / 60);
      const monthlyMinutesRemainder = monthlyTrafficTime % 60;

      const yearlyHours = Math.floor(yearlyTrafficTime / 60);
      const yearlyMinutes = yearlyTrafficTime % 60;

      const dailyDistanceKm = totalDistance;
      const yearlyDistanceKm = dailyDistanceKm * 250;
      
      const fuelConsumptionPer100km = 8;
      const fuelConsumption = Math.round((yearlyDistanceKm / 100) * fuelConsumptionPer100km);
      
      const fuelPricePerLiter = 2500;
      const totalAnnualFuelCost = fuelConsumption * fuelPricePerLiter;
      const monthlyFuelCost = Math.round(totalAnnualFuelCost / 12);

      const calculationResults = {
        normalTime: totalDailyNormalTime || 1, // 0 болохоос сэргийлэх
        currentTrafficTime: totalDailyTrafficTime || 1, // 0 болохоос сэргийлэх
        dailyLoss: dailyTrafficLoss,
        // Түгжрэлтэй цагийн үндсэн дээрх тооцоо
        weeklyTrafficTime: weeklyTrafficTime,
        monthlyTrafficTime: monthlyTrafficTime, 
        yearlyTrafficTime: yearlyTrafficTime,
        // Цаг/минутаар
        weeklyHours: weeklyHours,
        weeklyMinutes: weeklyMinutes,
        monthlyHours: monthlyHours,
        monthlyMinutes: monthlyMinutesRemainder,
        yearlyHours: yearlyHours,
        yearlyMinutes: yearlyMinutes,
        routes: routes || 'Маршрут тооцоолоогүй',
        routeDistance: parseFloat((totalDistance / 2).toFixed(1)) || 10,
        dailyDistanceKm: parseFloat(dailyDistanceKm.toFixed(1)) || 20,
        yearlyDistanceKm: Math.round(yearlyDistanceKm) || 5000,
        fuelConsumption: fuelConsumption || 400,
        totalAnnualFuelCost: totalAnnualFuelCost || 1000000,
        monthlyFuelCost: monthlyFuelCost || 83333,
        calculatedAt: new Date().toLocaleString('mn-MN')
      };

      console.log('🎯 Final calculation results:', calculationResults);
      
      // Хэрэв утга хэт бага байвал анхааруулах
      if (totalDailyTrafficTime < 5) {
        console.warn('⚠️ Traffic time seems too low, might be an API issue');
        setError('Google Maps API-аас хүлээгдэх мэдээлэл авах боломжгүй байна. Хаягийг шалгаад дахин оролдно уу.');
        return;
      }

      setResults(calculationResults);

    } catch (error) {
      setError(`Алдаа гарлаа: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        border: '1px solid #e5e7eb',
        marginBottom: '24px'
      }}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
          🚗 Хаяг оруулна уу
        </h2>
        
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Гэрийн хаяг
            </label>
            <input
              type="text"
              placeholder="Гэрийн хаягаа оруулна уу"
              value={addresses.home}
              onChange={(e) => handleAddressChange('home', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Сургууль/Ажлын байр 1
            </label>
            <input
              type="text"
              placeholder="Сургууль эсвэл ажлын байрны хаягаа оруулна уу"
              value={addresses.school}
              onChange={(e) => handleAddressChange('school', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
              Ажлын байр 2 (заавал биш)
            </label>
            <input
              type="text"
              placeholder="Хоёр дахь ажлын байрны хаягаа оруулна уу"
              value={addresses.work}
              onChange={(e) => handleAddressChange('work', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '14px',
                outline: 'none'
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f3f4f6', borderRadius: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '500', color: '#374151', marginBottom: '8px' }}>
            📍 Монгол орны түгжрэлийн тооцоолуур
          </h3>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            Улаанбаатар хотын дундаж түгжрэлийн мэдээлэл ашиглан тооцоолно. 
            Хаягууд оруулсны дараа "Тооцоолох" товчийг дарна уу.
          </p>
        </div>

        {error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#dc2626',
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <button 
          onClick={calculateRealTimeLoss}
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 24px',
            backgroundColor: loading ? '#9ca3af' : '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            fontSize: '16px',
            fontWeight: '600',
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px'
          }}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%'
              }}></div>
              Тооцоолж байна...
            </>
          ) : (
            '⚡ Тооцоолох'
          )}
        </button>
      </div>

      {results && (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          padding: '24px',
          boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
            📊 Үр дүн
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{
              backgroundColor: '#f0fdf4',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                Түгжрэлгүй цаг (өдөрт)
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                {results.normalTime} минут
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                Түгжрэлтэй цаг (өдөрт)
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                {results.currentTrafficTime} минут
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fff7ed',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#ea580c', marginBottom: '8px' }}>
                Өдрийн түгжрэлийн алдагдал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
                {results.dailyLoss} минут
              </p>
              <p style={{ fontSize: '12px', color: '#ea580c' }}>
                Түгжрэлээс болсон нэмэлт цаг
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#f3f4f6',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #d1d5db'
            }}>
              <h4 style={{ fontWeight: '600', color: '#374151', marginBottom: '8px' }}>
                📈 Түгжрэлийн алдагдал (жилээр)
              </h4>
              <p style={{ fontSize: '20px', fontWeight: 'bold', color: '#374151' }}>
                {Math.round(results.dailyLoss * 250)} минут
              </p>
              <p style={{ fontSize: '14px', color: '#6b7280' }}>
                {Math.floor(results.dailyLoss * 250 / 60)} цаг {(results.dailyLoss * 250) % 60} минут
              </p>
              <p style={{ fontSize: '12px', color: '#9ca3af' }}>
                Түгжрэлээс болж алдагдах цаг (250 ажлын өдөр)
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fefce8',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#a16207', marginBottom: '8px' }}>
                7 хоногийн нийт цаг (5 ажлын өдөр)
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ca8a04' }}>
                {results.weeklyHours} цаг {results.weeklyMinutes} минут
              </p>
              <p style={{ fontSize: '12px', color: '#ca8a04' }}>
                Түгжрэлтэй замд зарцуулах цаг
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#faf5ff',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#7c2d12', marginBottom: '8px' }}>
                Сарын нийт цаг (22 ажлын өдөр)
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#a855f7' }}>
                {results.monthlyHours} цаг {results.monthlyMinutes} минут
              </p>
              <p style={{ fontSize: '12px', color: '#a855f7' }}>
                Түгжрэлтэй замд зарцуулах цаг
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fef2f2',
              padding: '16px',
              borderRadius: '8px',
              border: '2px solid #fecaca'
            }}>
              <h4 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                🚨 Жилийн нийт цаг (250 ажлын өдөр)
              </h4>
              <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>
                {results.yearlyHours} цаг {results.yearlyMinutes} минут
              </p>
              <p style={{ fontSize: '12px', color: '#dc2626' }}>
                Энэ нь {Math.floor(results.yearlyHours/24)} өдрийн цагтай тэнцэнэ!
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#eff6ff',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                ⛽ Жилийн шатахуун
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                {results.fuelConsumption} литр
              </p>
            </div>
            
            <div style={{
              backgroundColor: '#fdf2f8',
              padding: '16px',
              borderRadius: '8px'
            }}>
              <h4 style={{ fontWeight: '600', color: '#be185d', marginBottom: '8px' }}>
                💰 Сарын шатахуун зардал
              </h4>
              <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>
                {results.monthlyFuelCost.toLocaleString()} ₮
              </p>
            </div>
          </div>
          
          <div style={{
            marginTop: '24px',
            backgroundColor: '#eff6ff',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
              📍 Маршрутын мэдээлэл
            </h4>
            <p><strong>Маршрут:</strong> {results.routes}</p>
            <p><strong>Нэг талын зай:</strong> {results.routeDistance} км</p>
            <p><strong>Өдрийн нийт зай:</strong> {results.dailyDistanceKm} км</p>
            <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '12px' }}>
              Тооцоолсон цаг: {results.calculatedAt}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GoogleMapsTrafficCalculator;
