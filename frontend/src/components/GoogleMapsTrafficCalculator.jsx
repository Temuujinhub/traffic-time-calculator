import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';

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
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyD_RxGFjYwvqoDIq17ZMhdLcChy0tTTrnU';
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
        panel: null
      });
      directionsRendererRef.current.setMap(mapInstanceRef.current);

      // Initialize autocomplete
      initializeAutocomplete();
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

        // Add listeners
        autocompletesRef.current.home.addListener('place_changed', () => updateRoute());
        autocompletesRef.current.school.addListener('place_changed', () => updateRoute());
        autocompletesRef.current.work.addListener('place_changed', () => updateRoute());
      }
    };

    loadGoogleMaps();
  }, []);

  const updateRoute = () => {
    if (addresses.home && addresses.school) {
      calculateAndDisplayRoute(addresses.home, addresses.school, addresses.work);
    }
  };

  const calculateAndDisplayRoute = (home, school, work) => {
    const waypoints = [];
    let destination = school;

    if (work && work.trim() !== '') {
      waypoints.push({
        location: school,
        stopover: true
      });
      destination = work;
    }

    directionsServiceRef.current.route({
      origin: home,
      destination: destination,
      waypoints: waypoints,
      travelMode: window.google.maps.TravelMode.DRIVING,
      drivingOptions: {
        departureTime: new Date(),
        trafficModel: window.google.maps.TrafficModel.BEST_GUESS
      },
      avoidHighways: false,
      avoidTolls: false
    }, (response, status) => {
      if (status === 'OK') {
        directionsRendererRef.current.setDirections(response);
      } else {
        console.error('Directions request failed due to ' + status);
      }
    });
  };

  const getRouteTime = (home, school, work, withTraffic) => {
    return new Promise((resolve, reject) => {
      const waypoints = [];
      let destination = school;

      if (work && work.trim() !== '') {
        waypoints.push({
          location: school,
          stopover: true
        });
        destination = work;
      }

      const request = {
        origin: home,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      };

      if (withTraffic) {
        request.drivingOptions = {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.PESSIMISTIC
        };
      } else {
        request.drivingOptions = {
          departureTime: new Date(),
          trafficModel: window.google.maps.TrafficModel.OPTIMISTIC
        };
      }

      directionsServiceRef.current.route(request, (response, status) => {
        if (status === 'OK') {
          let totalTime = 0;
          response.routes[0].legs.forEach(leg => {
            // Use duration_in_traffic if available (for traffic-aware requests), otherwise duration
            const durationValue = withTraffic && leg.duration_in_traffic 
              ? leg.duration_in_traffic.value 
              : leg.duration.value;
            totalTime += Math.ceil(durationValue / 60); // Convert to minutes
          });
          resolve(totalTime);
        } else {
          reject(new Error('Directions request failed: ' + status));
        }
      });
    });
  };

  const getRouteDistance = (home, school, work) => {
    return new Promise((resolve, reject) => {
      const waypoints = [];
      let destination = school;

      if (work && work.trim() !== '') {
        waypoints.push({
          location: school,
          stopover: true
        });
        destination = work;
      }

      const request = {
        origin: home,
        destination: destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        avoidHighways: false,
        avoidTolls: false
      };

      directionsServiceRef.current.route(request, (response, status) => {
        if (status === 'OK') {
          let totalDistance = 0;
          response.routes[0].legs.forEach(leg => {
            totalDistance += leg.distance.value; // in meters
          });
          const distanceKm = Math.round((totalDistance / 1000) * 100) / 100; // Convert to km with 2 decimal places
          console.log('Route distance:', distanceKm, 'km');
          resolve(distanceKm);
        } else {
          reject(new Error('Directions request failed: ' + status));
        }
      });
    });
  };

  const handleAddressChange = (field, value) => {
    setAddresses(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const calculateRealTimeLoss = async () => {
    if (!addresses.home || !addresses.school) {
      setError('Гэр болон сургууль/ажлын байрны хаягийг заавал оруулна уу!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Calculate routes with current traffic and without traffic, and get distance
      const [currentTrafficTime, normalTime, routeDistance] = await Promise.all([
        getRouteTime(addresses.home, addresses.school, addresses.work, true),
        getRouteTime(addresses.home, addresses.school, addresses.work, false),
        getRouteDistance(addresses.home, addresses.school, addresses.work)
      ]);

      // Debug log
      console.log('Traffic time:', currentTrafficTime, 'Normal time:', normalTime, 'Distance:', routeDistance, 'km');

      if (currentTrafficTime === 0 || normalTime === 0 || !routeDistance) {
        setError('Маршрут олдсонгүй. Хаягуудыг шалгаад дахин оролдоно уу.');
        return;
      }

      // Calculate time using ONLY traffic time (peak hours)
      // Morning: Home → School → Work (peak traffic)
      // Evening: Work → School → Home (peak traffic)
      const morningTrafficTime = currentTrafficTime; // Өглөөний түгжрэлтэй цаг
      const eveningTrafficTime = currentTrafficTime; // Орой хариу буцах түгжрэлтэй цаг
      
      // Daily total time spent in traffic (2 trips in peak hours)
      const dailyTrafficTime = morningTrafficTime + eveningTrafficTime;
      
      // Daily time if there was no traffic (for comparison only)
      const dailyNormalTime = normalTime * 2; // 2 trips without traffic
      
      // Daily time lost due to traffic (difference between traffic time and normal time)
      const dailyLoss = Math.max(0, dailyTrafficTime - dailyNormalTime);
      
      // Calculate weekly loss (5 working days)
      const weeklyLoss = dailyLoss * 5;
      
      // Calculate monthly loss (22 working days)
      const monthlyLoss = dailyLoss * 22;
      
      // Calculate yearly loss (250 working days approximately)
      const yearlyLoss = dailyLoss * 250;
      
      const yearlyHours = Math.floor(yearlyLoss / 60);
      const yearlyMinutes = yearlyLoss % 60;
      
      // Calculate fuel consumption using ACTUAL traffic time distance
      const dailyDistanceKm = routeDistance * 2; // Round trip distance
      const monthlyDistanceKm = dailyDistanceKm * 22; // 22 working days
      const yearlyDistanceKm = dailyDistanceKm * 250; // 250 working days
      
      // Total fuel consumption (8L/100km average for UB conditions with traffic)
      const fuelConsumptionLitersPerYear = (yearlyDistanceKm * 8) / 100;
      const fuelCostPerLiter = 2500; // MNT
      const totalAnnualFuelCost = fuelConsumptionLitersPerYear * fuelCostPerLiter;
      
      // Calculate monthly and daily fuel costs
      const monthlyFuelCost = totalAnnualFuelCost / 12;
      const dailyFuelCost = totalAnnualFuelCost / 250; // working days only
      
      const routes = addresses.work && addresses.work.trim() !== '' ? 
        `${addresses.home} → ${addresses.school} → ${addresses.work}` : 
        `${addresses.home} ↔ ${addresses.school}`;

      setResults({
        // Time data
        currentTrafficTime,
        normalTime,
        dailyTrafficTime,
        dailyNormalTime,
        dailyLoss,
        weeklyLoss,
        monthlyLoss,
        yearlyLoss,
        yearlyHours,
        yearlyMinutes,
        
        // Distance data
        routeDistance: Math.round(routeDistance * 100) / 100, // Round to 2 decimals
        dailyDistanceKm: Math.round(dailyDistanceKm * 100) / 100,
        monthlyDistanceKm: Math.round(monthlyDistanceKm),
        yearlyDistanceKm: Math.round(yearlyDistanceKm),
        
        // Fuel and cost data
        fuelConsumption: Math.round(fuelConsumptionLitersPerYear),
        totalAnnualFuelCost: Math.round(totalAnnualFuelCost),
        monthlyFuelCost: Math.round(monthlyFuelCost),
        dailyFuelCost: Math.round(dailyFuelCost),
        
        // Route info
        routes,
        calculatedAt: new Date().toLocaleString('mn-MN')
      });

    } catch (error) {
      console.error('Error calculating route:', error);
      setError('Маршрут тооцоолоход алдаа гарлаа. Хаягуудыг шалгаж дахин оролдоно уу.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-600 mb-4">Түгжрэлд Алдагдсан Цаг Тооцоолуур</h1>
        <p className="text-gray-600 text-lg mb-2">Google Maps API ашиглан жинхэнэ түгжрэлийн мэдээлэл авч тооцоолно</p>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 text-left max-w-4xl mx-auto">
          <h3 className="font-semibold text-yellow-800 mb-2">📋 Тооцоололын логик:</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• <strong>Өглөө:</strong> Гэр → Сургууль → Ажил (түгжрэлтэй цагт)</li>
            <li>• <strong>Орой:</strong> Ажил → Сургууль → Гэр (түгжрэлтэй цагт)</li>
            <li>• <strong>Тооцоолол:</strong> Зөвхөн түгжрэлтэй цагаар тооцно (Normal time хасахгүй)</li>
            <li>• <strong>Зардал:</strong> 3 байршлын хоорондын нийт замын шатахуун зардал</li>
          </ul>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">🚗 3 байршлын мэдээлэл оруулна уу</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4">
            <div>
              <Label htmlFor="homeAddressInput">Гэрийн хаяг</Label>
              <Input
                id="homeAddressInput"
                type="text"
                placeholder="Гэрийн хаягаа оруулна уу"
                value={addresses.home}
                onChange={(e) => handleAddressChange('home', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="schoolAddressInput">Сургууль/Ажлын байр 1</Label>
              <Input
                id="schoolAddressInput"
                type="text"
                placeholder="Сургууль эсвэл ажлын байрны хаягаа оруулна уу"
                value={addresses.school}
                onChange={(e) => handleAddressChange('school', e.target.value)}
              />
            </div>
            
            <div>
              <Label htmlFor="workAddressInput">Ажлын байр 2 (заавал биш)</Label>
              <Input
                id="workAddressInput"
                type="text"
                placeholder="Хоёр дахь ажлын байрны хаягаа оруулна уу"
                value={addresses.work}
                onChange={(e) => handleAddressChange('work', e.target.value)}
              />
            </div>
          </div>

          {/* Map */}
          <div>
            <h3 className="text-lg font-medium text-gray-700 mb-3">Газрын зураг дээрх маршрут</h3>
            <div 
              ref={mapRef}
              className="w-full h-96 rounded-lg border border-gray-300"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <Button 
            onClick={calculateRealTimeLoss}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Google Maps-аас мэдээлэл авч байна...
              </>
            ) : (
              '⚡ Google Maps-аар жинхэнэ цагийг тооцоолох'
            )}
          </Button>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">📊 Үр дүн</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-green-800">Түгжрэлгүй цаг (нэг талдаа)</h4>
                  <p className="text-2xl font-bold text-green-600">{results.normalTime} минут</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-red-800">Түгжрэлтэй цаг (нэг талдаа)</h4>
                  <p className="text-2xl font-bold text-red-600">{results.currentTrafficTime} минут</p>
                </div>
                
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-orange-800">Өдрийн алдагдал (2 удаа)</h4>
                  <p className="text-2xl font-bold text-orange-600">{results.dailyLoss} минут</p>
                  <p className="text-sm text-orange-700">Өглөө + орой</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-yellow-800">7 хоногийн алдагдал (5 ажлын өдөр)</h4>
                  <p className="text-2xl font-bold text-yellow-600">{results.weeklyLoss} минут</p>
                  <p className="text-sm text-yellow-700">{Math.floor(results.weeklyLoss/60)} цаг {results.weeklyLoss%60} минут</p>
                </div>
                
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-purple-800">Сарын алдагдал (22 ажлын өдөр)</h4>
                  <p className="text-2xl font-bold text-purple-600">{results.monthlyLoss} минут</p>
                  <p className="text-sm text-purple-700">{Math.floor(results.monthlyLoss/60)} цаг {results.monthlyLoss%60} минут</p>
                </div>
                
                <div className="bg-red-100 p-4 rounded-lg border-2 border-red-200">
                  <h4 className="font-semibold text-red-800">🚨 Жилийн алдагдал (250 ажлын өдөр)</h4>
                  <p className="text-3xl font-bold text-red-600">{results.yearlyHours} цаг {results.yearlyMinutes} минут</p>
                  <p className="text-sm text-red-700">Энэ нь {Math.floor(results.yearlyHours/24)} өдрийн цагтай тэнцэнэ!</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-indigo-800">⛽ Жилийн шатахуун</h4>
                  <p className="text-2xl font-bold text-indigo-600">{results.fuelConsumption} литр</p>
                  <p className="text-sm text-indigo-700">{results.yearlyDistanceKm.toLocaleString()} км замд (8л/100км)</p>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800">💰 Жилийн нийт шатахуун зардал</h4>
                  <p className="text-2xl font-bold text-emerald-600">{results.totalAnnualFuelCost.toLocaleString()} ₮</p>
                  <p className="text-sm text-emerald-700">2500₮/литрээр тооцсон</p>
                </div>
                
                <div className="bg-rose-50 p-4 rounded-lg border-2 border-rose-200">
                  <h4 className="font-semibold text-rose-800">� Сарын шатахуун зардал</h4>
                  <p className="text-3xl font-bold text-rose-600">{results.monthlyFuelCost.toLocaleString()} ₮</p>
                  <p className="text-sm text-rose-700">22 ажлын өдрийн нийт зардал</p>
                </div>
                
                <div className="bg-amber-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-amber-800">📊 Өдрийн шатахуун зардал</h4>
                  <p className="text-2xl font-bold text-amber-600">{results.dailyFuelCost.toLocaleString()} ₮</p>
                  <p className="text-sm text-amber-700">Өдөр бүрийн зардал</p>
                </div>
                
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-800">🛣️ Нийт зай</h4>
                  <p className="text-2xl font-bold text-cyan-600">{results.routeDistance} км</p>
                  <p className="text-sm text-cyan-700">Нэг талын зай (Google Maps-аас авсан)</p>
                </div>
                
                <div className="bg-teal-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-teal-800">🔄 Хоёр талын зай</h4>
                  <p className="text-2xl font-bold text-teal-600">{results.dailyDistanceKm} км</p>
                  <p className="text-sm text-teal-700">Өдрийн нийт зам (буцах замтай)</p>
                </div>
                
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-slate-800">📊 Жилийн нийт зам</h4>
                  <p className="text-2xl font-bold text-slate-600">{results.yearlyDistanceKm.toLocaleString()} км</p>
                  <p className="text-sm text-slate-700">250 ажлын өдрийн нийт зам</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📍 Маршрутын дэлгэрэнгүй мэдээлэл</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-700">
                <div>
                  <p><strong>Маршрут:</strong> {results.routes}</p>
                  <p><strong>Нэг талын зай:</strong> {results.routeDistance} км</p>
                  <p><strong>Хоёр талын зай:</strong> {results.dailyDistanceKm} км</p>
                </div>
                <div>
                  <p><strong>Түгжрэлгүй цаг:</strong> {results.normalTime} минут</p>
                  <p><strong>Түгжрэлтэй цаг:</strong> {results.currentTrafficTime} минут</p>
                  <p><strong>Цагийн ялгаа:</strong> {results.currentTrafficTime - results.normalTime} минут</p>
                </div>
              </div>
              <p className="text-sm text-blue-600 mt-3">Google Maps API-аас жинхэнэ мэдээлэл авсан</p>
              <p className="text-xs text-blue-500 mt-1">Тооцоолсон цаг: {results.calculatedAt}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleMapsTrafficCalculator;

