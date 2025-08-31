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
  const autocompletesRef = useRef({});

  useEffect(() => {
    // Load Google Maps API
    const loadGoogleMaps = () => {
      if (window.google) {
        initializeMap();
        return;
      }

      const script = document.createElement('script');
      // Using a public demo API key - replace with your own for production
      const apiKey = 'AIzaSyD_RxGFjYwvqoDIq17ZMhdLcChy0tTTrnU';
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initMap`;
      script.async = true;
      script.defer = true;
      
      window.initMap = initializeMap;
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      if (!mapRef.current) return;

      // Initialize map centered on Ulaanbaatar
      mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
        zoom: 11,
        center: { lat: 47.9077, lng: 106.8832 }
      });

      directionsServiceRef.current = new window.google.maps.DirectionsService();
      directionsRendererRef.current = new window.google.maps.DirectionsRenderer({
        draggable: true,
        map: mapInstanceRef.current
      });

      // Initialize autocomplete for all address inputs
      setTimeout(() => {
        initializeAutocomplete();
      }, 100);
    };

    const initializeAutocomplete = () => {
      const homeInput = document.getElementById('homeAddressInput');
      const schoolInput = document.getElementById('schoolAddressInput');
      const workInput = document.getElementById('workAddressInput');

      if (homeInput && schoolInput && workInput) {
        autocompletesRef.current.home = new window.google.maps.places.Autocomplete(homeInput, {
          componentRestrictions: { country: 'mn' }
        });
        autocompletesRef.current.school = new window.google.maps.places.Autocomplete(schoolInput, {
          componentRestrictions: { country: 'mn' }
        });
        autocompletesRef.current.work = new window.google.maps.places.Autocomplete(workInput, {
          componentRestrictions: { country: 'mn' }
        });

        // Add listeners for place changes
        autocompletesRef.current.home.addListener('place_changed', () => {
          const place = autocompletesRef.current.home.getPlace();
          if (place.formatted_address) {
            handleAddressChange('home', place.formatted_address);
          }
        });

        autocompletesRef.current.school.addListener('place_changed', () => {
          const place = autocompletesRef.current.school.getPlace();
          if (place.formatted_address) {
            handleAddressChange('school', place.formatted_address);
          }
        });

        autocompletesRef.current.work.addListener('place_changed', () => {
          const place = autocompletesRef.current.work.getPlace();
          if (place.formatted_address) {
            handleAddressChange('work', place.formatted_address);
          }
        });
      }
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
          
          // Get traffic time from duration_in_traffic
          let trafficTimeMinutes = 0;
          let normalTimeMinutes = 0;
          let distance = 0;

          console.log('Google Maps API Response Debug:', {
            leg: leg,
            duration_in_traffic: leg.duration_in_traffic,
            duration: leg.duration,
            distance: leg.distance
          });

          if (leg.duration_in_traffic) {
            trafficTimeMinutes = Math.round(leg.duration_in_traffic.value / 60);
          } else if (leg.duration) {
            trafficTimeMinutes = Math.round(leg.duration.value / 60);
            console.warn('No duration_in_traffic available, using regular duration');
          } else {
            // Fallback if no duration data available
            trafficTimeMinutes = 30; // Default 30 minutes
            console.warn('No duration data available, using default 30 minutes');
          }

          if (leg.duration) {
            normalTimeMinutes = Math.round(leg.duration.value / 60);
          } else {
            normalTimeMinutes = trafficTimeMinutes; // Use traffic time as fallback
          }

          if (leg.distance) {
            distance = leg.distance.value / 1000; // Convert to km
          } else {
            distance = 15; // Default 15km if no distance data
            console.warn('No distance data available, using default 15km');
          }

          console.log('Route calculation result:', {
            origin,
            destination,
            trafficTime: trafficTimeMinutes,
            normalTime: normalTimeMinutes,
            distance: distance,
            departureTime: departureTime
          });

          resolve({
            trafficTime: trafficTimeMinutes,
            normalTime: normalTimeMinutes,
            distance: distance,
            route: route
          });
        } else {
          console.error('Google Maps Directions API failed:', {
            status: status,
            origin: origin,
            destination: destination
          });
          reject(new Error(`Directions request failed: ${status}. Please check your addresses and try again.`));
        }
      });
    });
  };

  const getRouteDistance = async (origin, destination) => {
    return new Promise((resolve, reject) => {
      if (!directionsServiceRef.current) {
        reject(new Error('Directions service not initialized'));
        return;
      }

      directionsServiceRef.current.route({
        origin: origin,
        destination: destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          const route = result.routes[0];
          const leg = route.legs[0];
          const distance = leg.distance.value / 1000; // Convert to km
          
          resolve(distance);
        } else {
          reject(new Error(`Distance request failed: ${status}`));
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
      // Create departure times for morning rush hour (8 AM) and evening rush hour (6 PM)
      const morningRushHour = new Date();
      morningRushHour.setHours(8, 0, 0, 0);
      
      const eveningRushHour = new Date();
      eveningRushHour.setHours(18, 0, 0, 0);

      console.log('Starting calculations with addresses:', addresses);

      // Calculate morning route: Home -> School -> Work (or just Home -> School if no work address)
      let morningResults = [];
      let totalMorningTrafficTime = 0;
      let totalMorningNormalTime = 0;
      let routes = '';
      let totalDistance = 0;

      // Home to School
      console.log('Calculating Home to School...');
      const homeToSchool = await getRouteTime(addresses.home, addresses.school, morningRushHour);
      morningResults.push({
        route: 'Гэр → Сургууль',
        ...homeToSchool
      });
      totalMorningTrafficTime += homeToSchool.trafficTime;
      totalMorningNormalTime += homeToSchool.normalTime;
      routes += 'Гэр → Сургууль';
      totalDistance += homeToSchool.distance;

      // School to Work (if work address provided)
      if (addresses.work && addresses.work.trim()) {
        console.log('Calculating School to Work...');
        const schoolToWork = await getRouteTime(addresses.school, addresses.work, morningRushHour);
        morningResults.push({
          route: 'Сургууль → Ажил',
          ...schoolToWork
        });
        totalMorningTrafficTime += schoolToWork.trafficTime;
        totalMorningNormalTime += schoolToWork.normalTime;
        routes += ' → Ажил';
        totalDistance += schoolToWork.distance;
      }

      // Calculate evening route: Work -> School -> Home (or just School -> Home if no work address)
      let eveningResults = [];
      let totalEveningTrafficTime = 0;
      let totalEveningNormalTime = 0;

      if (addresses.work && addresses.work.trim()) {
        // Work to School
        console.log('Calculating Work to School...');
        const workToSchool = await getRouteTime(addresses.work, addresses.school, eveningRushHour);
        eveningResults.push({
          route: 'Ажил → Сургууль',
          ...workToSchool
        });
        totalEveningTrafficTime += workToSchool.trafficTime;
        totalEveningNormalTime += workToSchool.normalTime;
        totalDistance += workToSchool.distance;
      }

      // School to Home
      console.log('Calculating School to Home...');
      const schoolToHome = await getRouteTime(addresses.school, addresses.home, eveningRushHour);
      eveningResults.push({
        route: 'Сургууль → Гэр',
        ...schoolToHome
      });
      totalEveningTrafficTime += schoolToHome.trafficTime;
      totalEveningNormalTime += schoolToHome.normalTime;
      totalDistance += schoolToHome.distance;

      // Display route on map (just show the full route)
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

      // Calculate total daily time in traffic (morning + evening)
      const totalDailyTrafficTime = totalMorningTrafficTime + totalEveningTrafficTime;
      const totalDailyNormalTime = totalMorningNormalTime + totalEveningNormalTime;

      // Calculate daily loss: only the traffic time, not subtracting normal time
      const dailyLoss = totalDailyTrafficTime;

      // Calculate various timeframes
      const weeklyLoss = dailyLoss * 5; // 5 working days
      const monthlyLoss = dailyLoss * 22; // 22 working days
      const yearlyLoss = dailyLoss * 250; // 250 working days

      // Convert yearly loss to hours and minutes
      const yearlyHours = Math.floor(yearlyLoss / 60);
      const yearlyMinutes = yearlyLoss % 60;

      // Calculate fuel consumption and costs
      const dailyDistanceKm = totalDistance;
      const yearlyDistanceKm = dailyDistanceKm * 250;
      const fuelConsumptionPer100km = 8; // 8 liters per 100km
      const fuelConsumption = Math.round((yearlyDistanceKm / 100) * fuelConsumptionPer100km);
      
      const fuelPricePerLiter = 2500; // 2500 tugrik per liter
      const totalAnnualFuelCost = fuelConsumption * fuelPricePerLiter;
      const monthlyFuelCost = Math.round(totalAnnualFuelCost / 12);
      const dailyFuelCost = Math.round(totalAnnualFuelCost / 250);

      const calculationResults = {
        normalTime: totalDailyNormalTime,
        currentTrafficTime: totalDailyTrafficTime,
        dailyLoss: dailyLoss,
        weeklyLoss: weeklyLoss,
        monthlyLoss: monthlyLoss,
        yearlyLoss: yearlyLoss,
        yearlyHours: yearlyHours,
        yearlyMinutes: yearlyMinutes,
        routes: routes,
        routeDistance: parseFloat(totalDistance.toFixed(1)),
        dailyDistanceKm: parseFloat(dailyDistanceKm.toFixed(1)),
        yearlyDistanceKm: Math.round(yearlyDistanceKm),
        fuelConsumption: fuelConsumption,
        totalAnnualFuelCost: totalAnnualFuelCost,
        monthlyFuelCost: monthlyFuelCost,
        dailyFuelCost: dailyFuelCost,
        calculatedAt: new Date().toLocaleString('mn-MN'),
        morningResults: morningResults,
        eveningResults: eveningResults
      };

      console.log('Final calculation results:', calculationResults);
      setResults(calculationResults);

    } catch (error) {
      console.error('Error calculating route times:', error);
      setError(`Алдаа гарлаа: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
  };

  const labelStyles = {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#374151',
    marginBottom: '4px'
  };

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <div style={cardStyles}>
        <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
          🚗 3 байршлын мэдээлэл оруулна уу
        </h2>
        
        <div style={{ display: 'grid', gap: '16px', marginBottom: '24px' }}>
          <div>
            <label style={labelStyles} htmlFor="homeAddressInput">Гэрийн хаяг</label>
            <input
              id="homeAddressInput"
              type="text"
              placeholder="Гэрийн хаягаа оруулна уу"
              value={addresses.home}
              onChange={(e) => handleAddressChange('home', e.target.value)}
              style={inputStyles}
            />
          </div>
          
          <div>
            <label style={labelStyles} htmlFor="schoolAddressInput">Сургууль/Ажлын байр 1</label>
            <input
              id="schoolAddressInput"
              type="text"
              placeholder="Сургууль эсвэл ажлын байрны хаягаа оруулна уу"
              value={addresses.school}
              onChange={(e) => handleAddressChange('school', e.target.value)}
              style={inputStyles}
            />
          </div>
          
          <div>
            <label style={labelStyles} htmlFor="workAddressInput">Ажлын байр 2 (заавал биш)</label>
            <input
              id="workAddressInput"
              type="text"
              placeholder="Хоёр дахь ажлын байрны хаягаа оруулна уу"
              value={addresses.work}
              onChange={(e) => handleAddressChange('work', e.target.value)}
              style={inputStyles}
            />
          </div>
        </div>

        {/* Map */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: '500', color: '#374151', marginBottom: '12px' }}>
            Газрын зураг дээрх маршрут
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
          style={buttonStyles}
        >
          {loading ? (
            <>
              <div style={{
                width: '16px',
                height: '16px',
                border: '2px solid transparent',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Google Maps-аас мэдээлэл авч байна...
            </>
          ) : (
            '⚡ Google Maps-аар жинхэнэ цагийг тооцоолох'
          )}
        </button>
      </div>

      {results && (
        <div style={cardStyles}>
          <h2 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '24px', color: '#1f2937' }}>
            📊 Үр дүн
          </h2>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#f0fdf4', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#166534', marginBottom: '8px' }}>
                  Түгжрэлгүй цаг (нэг талдаа)
                </h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#16a34a' }}>
                  {results.normalTime} минут
                </p>
              </div>
              
              <div style={{ backgroundColor: '#fef2f2', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#dc2626', marginBottom: '8px' }}>
                  Түгжрэлтэй цаг (нэг талдаа)
                </h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#dc2626' }}>
                  {results.currentTrafficTime} минут
                </p>
              </div>
              
              <div style={{ backgroundColor: '#fff7ed', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#ea580c', marginBottom: '8px' }}>
                  Өдрийн алдагдал (2 удаа)
                </h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#ea580c' }}>
                  {results.dailyLoss} минут
                </p>
                <p style={{ fontSize: '12px', color: '#ea580c' }}>Өглөө + орой</p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#fefce8', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#a16207', marginBottom: '8px' }}>
                  7 хоногийн алдагдал (5 ажлын өдөр)
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
                  Сарын алдагдал (22 ажлын өдөр)
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
                  🚨 Жилийн алдагдал (250 ажлын өдөр)
                </h4>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#dc2626' }}>
                  {results.yearlyHours} цаг {results.yearlyMinutes} минут
                </p>
                <p style={{ fontSize: '12px', color: '#dc2626' }}>
                  Энэ нь {Math.floor(results.yearlyHours/24)} өдрийн цагтай тэнцэнэ!
                </p>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ backgroundColor: '#eff6ff', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
                  ⛽ Жилийн шатахуун
                </h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#3b82f6' }}>
                  {results.fuelConsumption} литр
                </p>
                <p style={{ fontSize: '12px', color: '#3b82f6' }}>
                  {results.yearlyDistanceKm.toLocaleString()} км замд (8л/100км)
                </p>
              </div>
              
              <div style={{ backgroundColor: '#ecfdf5', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#047857', marginBottom: '8px' }}>
                  💰 Жилийн нийт шатахуун зардал
                </h4>
                <p style={{ fontSize: '24px', fontWeight: 'bold', color: '#10b981' }}>
                  {results.totalAnnualFuelCost.toLocaleString()} ₮
                </p>
                <p style={{ fontSize: '12px', color: '#10b981' }}>2500₮/литрээр тооцсон</p>
              </div>
              
              <div style={{ backgroundColor: '#fdf2f8', padding: '16px', borderRadius: '8px' }}>
                <h4 style={{ fontWeight: '600', color: '#be185d', marginBottom: '8px' }}>
                  📅 Сарын шатахуун зардал
                </h4>
                <p style={{ fontSize: '28px', fontWeight: 'bold', color: '#ec4899' }}>
                  {results.monthlyFuelCost.toLocaleString()} ₮
                </p>
                <p style={{ fontSize: '12px', color: '#ec4899' }}>22 ажлын өдрийн нийт зардал</p>
              </div>
            </div>
          </div>
          
          <div style={{
            marginTop: '24px',
            backgroundColor: '#eff6ff',
            padding: '16px',
            borderRadius: '8px'
          }}>
            <h4 style={{ fontWeight: '600', color: '#1e40af', marginBottom: '8px' }}>
              📍 Маршрутын дэлгэрэнгүй мэдээлэл
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              <div style={{ color: '#1e40af' }}>
                <p><strong>Маршрут:</strong> {results.routes}</p>
                <p><strong>Нэг талын зай:</strong> {results.routeDistance} км</p>
                <p><strong>Хоёр талын зай:</strong> {results.dailyDistanceKm} км</p>
              </div>
              <div style={{ color: '#1e40af' }}>
                <p><strong>Түгжрэлгүй цаг:</strong> {results.normalTime} минут</p>
                <p><strong>Түгжрэлтэй цаг:</strong> {results.currentTrafficTime} минут</p>
                <p><strong>Цагийн ялгаа:</strong> {results.currentTrafficTime - results.normalTime} минут</p>
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#3b82f6', marginTop: '12px' }}>
              Google Maps API-аас жинхэнэ мэдээлэл авсан
            </p>
            <p style={{ fontSize: '10px', color: '#60a5fa', marginTop: '4px' }}>
              Тооцоолсон цаг: {results.calculatedAt}
            </p>
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

export default GoogleMapsTrafficCalculator;
