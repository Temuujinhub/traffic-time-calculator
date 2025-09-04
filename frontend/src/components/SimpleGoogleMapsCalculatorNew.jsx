import React, { useState, useEffect, useRef } from 'react';

const GoogleMapsTrafficCalculator = () => {
  const [addresses, setAddresses] = useState({
    home: '',
    school: '',
    work: ''
  });
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const directionsServiceRef = useRef(null);
  const directionsRendererRef = useRef(null);

  useEffect(() => {
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      const apiKey = 'AIzaSyD_RxGFjYwvqoDIq17ZMhdLcChy0tTTrnU';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: { lat: 47.9077, lng: 106.8832 }
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        draggable: true
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);
    };

    loadGoogleMaps();
  }, []);

  const handleAddressChange = (type, value) => {
    setAddresses(prev => ({
      ...prev,
      [type]: value
    }));
  };

  const getRouteTime = async (origin, destination, departureTime) => {
    return new Promise((resolve, reject) => {
      if (!directionsServiceRef.current) {
        reject(new Error('Directions service not initialized'));
        return;
      }

      directionsServiceRef.current.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: departureTime,
          trafficModel: window.google.maps.TrafficModel.PESSIMISTIC
        },
        avoidHighways: false,
        avoidTolls: false
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const leg = route.legs[0];
          
          let trafficTimeMinutes = 0;
          let normalTimeMinutes = 0;
          let distance = 0;

          if (leg.duration_in_traffic) {
            trafficTimeMinutes = Math.round(leg.duration_in_traffic.value / 60);
          } else if (leg.duration) {
            trafficTimeMinutes = Math.round(leg.duration.value / 60);
          } else {
            const estimatedSpeed = 25;
            distance = leg.distance ? leg.distance.value / 1000 : 15;
            trafficTimeMinutes = Math.round((distance / estimatedSpeed) * 60);
          }

          if (leg.duration) {
            normalTimeMinutes = Math.round(leg.duration.value / 60);
          } else {
            normalTimeMinutes = Math.round(trafficTimeMinutes * 0.8);
          }

          // Mongolia traffic simulation: 50% increase for peak hours
          if (normalTimeMinutes > 0) {
            const simulatedTrafficTime = Math.round(normalTimeMinutes * 1.5);
            trafficTimeMinutes = Math.max(trafficTimeMinutes, simulatedTrafficTime);
          }

          if (leg.distance) {
            distance = leg.distance.value / 1000;
          } else {
            distance = 15;
          }

          resolve({
            trafficTime: trafficTimeMinutes,
            normalTime: normalTimeMinutes,
            distance: distance,
            route: route
          });
        } else {
          reject(new Error(`Directions request failed: ${status}`));
        }
      });
    });
  };

  const calculateRealTimeLoss = async () => {
    if (!addresses.home || !addresses.school) {
      setError('Гэр болон сургуулийн хаягийг оруулна уу');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const morningRushHour = new Date();
      morningRushHour.setHours(7, 30, 0, 0);
      
      const eveningRushHour = new Date();
      eveningRushHour.setHours(17, 30, 0, 0);

      let totalMorningTrafficTime = 0;
      let totalMorningNormalTime = 0;
      let routes = '';
      let totalDistance = 0;

      // Home to School
      const homeToSchool = await getRouteTime(addresses.home, addresses.school, morningRushHour);
      totalMorningTrafficTime += homeToSchool.trafficTime;
      totalMorningNormalTime += homeToSchool.normalTime;
      routes += 'Гэр → Сургууль';
      totalDistance += homeToSchool.distance;

      // School to Work (if work address provided)
      if (addresses.work && addresses.work.trim()) {
        const schoolToWork = await getRouteTime(addresses.school, addresses.work, morningRushHour);
        totalMorningTrafficTime += schoolToWork.trafficTime;
        totalMorningNormalTime += schoolToWork.normalTime;
        routes += ' → Ажил';
        totalDistance += schoolToWork.distance;
      }

      // Evening routes
      let totalEveningTrafficTime = 0;
      let totalEveningNormalTime = 0;

      if (addresses.work && addresses.work.trim()) {
        const workToSchool = await getRouteTime(addresses.work, addresses.school, eveningRushHour);
        totalEveningTrafficTime += workToSchool.trafficTime;
        totalEveningNormalTime += workToSchool.normalTime;
        totalDistance += workToSchool.distance;
      }

      const schoolToHome = await getRouteTime(addresses.school, addresses.home, eveningRushHour);
      totalEveningTrafficTime += schoolToHome.trafficTime;
      totalEveningNormalTime += schoolToHome.normalTime;
      totalDistance += schoolToHome.distance;

      // Display route on map
      if (directionsRendererRef.current) {
        const finalRoute = addresses.work ? 
          await getRouteTime(addresses.home, addresses.work, morningRushHour) :
          await getRouteTime(addresses.home, addresses.school, morningRushHour);
        
        directionsRendererRef.current.setDirections({
          routes: [finalRoute.route],
          request: {
            origin: addresses.home,
            destination: addresses.work || addresses.school,
            travelMode: window.google.maps.TravelMode.DRIVING
          }
        });
      }

      const totalDailyTrafficTime = totalMorningTrafficTime + totalEveningTrafficTime;
      const totalDailyNormalTime = totalMorningNormalTime + totalEveningNormalTime;
      
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
        normalTime: totalDailyNormalTime,
        currentTrafficTime: totalDailyTrafficTime,
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
        routes: routes,
        routeDistance: parseFloat((totalDistance / 2).toFixed(1)),
        dailyDistanceKm: parseFloat(dailyDistanceKm.toFixed(1)),
        yearlyDistanceKm: Math.round(yearlyDistanceKm),
        fuelConsumption: fuelConsumption,
        totalAnnualFuelCost: totalAnnualFuelCost,
        monthlyFuelCost: monthlyFuelCost,
        calculatedAt: new Date().toLocaleString('mn-MN')
      };

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

        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
            Газрын зураг
          </h3>
          <div 
            ref={mapRef}
            style={{
              width: '100%',
              height: '384px',
              borderRadius: '8px',
              border: '1px solid #d1d5db'
            }}
          />
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
