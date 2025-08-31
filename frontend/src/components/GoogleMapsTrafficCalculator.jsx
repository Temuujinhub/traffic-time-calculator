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
          trafficModel: window.google.maps.TrafficModel.BEST_GUESS
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
      // Calculate routes with current traffic and without traffic
      const currentTrafficTime = await getRouteTime(addresses.home, addresses.school, addresses.work, true);
      const normalTime = await getRouteTime(addresses.home, addresses.school, addresses.work, false);

      // Debug log
      console.log('Traffic time:', currentTrafficTime, 'Normal time:', normalTime);

      if (currentTrafficTime === 0 || normalTime === 0) {
        setError('Маршрут олдсонгүй. Хаягуудыг шалгаад дахин оролдоно уу.');
        return;
      }

      const dailyLoss = Math.max(0, (currentTrafficTime - normalTime) * 2); // Round trip
      const weeklyLoss = dailyLoss * 5; // 5 working days  
      const monthlyLoss = dailyLoss * 22; // 22 working days per month
      const yearlyLoss = dailyLoss * 250; // Approximately 250 working days per year
      
      const yearlyHours = Math.floor(yearlyLoss / 60);
      const yearlyMinutes = yearlyLoss % 60;
      
      // Calculate fuel consumption and cost estimates
      const estimatedDistanceKm = 15; // Average distance estimate for UB
      const dailyDistanceKm = estimatedDistanceKm * 2; // Round trip
      const yearlyDistanceKm = dailyDistanceKm * 250; // Working days
      const fuelConsumptionL = (yearlyDistanceKm * 8) / 100; // 8L/100km average consumption
      const fuelCostPerLiter = 2500; // MNT
      const annualFuelCost = fuelConsumptionL * fuelCostPerLiter;
      
      const routes = addresses.work && addresses.work.trim() !== '' ? 
        `${addresses.home} → ${addresses.school} → ${addresses.work}` : 
        `${addresses.home} ↔ ${addresses.school}`;

      setResults({
        currentTrafficTime,
        normalTime,
        dailyLoss,
        weeklyLoss,
        monthlyLoss,
        yearlyLoss,
        yearlyHours,
        yearlyMinutes,
        fuelConsumption: Math.round(fuelConsumptionL),
        annualFuelCost: Math.round(annualFuelCost),
        estimatedDistanceKm,
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
        <p className="text-gray-600 text-lg">Google Maps API ашиглан жинхэнэ түгжрэлийн мэдээлэл авч тооцоолно</p>
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
                  <h4 className="font-semibold text-indigo-800">⛽ Жилийн шатахуун зарцуулалт</h4>
                  <p className="text-2xl font-bold text-indigo-600">{results.fuelConsumption} литр</p>
                  <p className="text-sm text-indigo-700">8л/100км-ээр тооцсон</p>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-emerald-800">💰 Жилийн шатахуун зардал</h4>
                  <p className="text-2xl font-bold text-emerald-600">{results.annualFuelCost.toLocaleString()} ₮</p>
                  <p className="text-sm text-emerald-700">2500₮/литрээр тооцсон</p>
                </div>
                
                <div className="bg-cyan-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-cyan-800">🛣️ Жилийн зам</h4>
                  <p className="text-2xl font-bold text-cyan-600">{(results.estimatedDistanceKm * 2 * 250).toLocaleString()} км</p>
                  <p className="text-sm text-cyan-700">Ойролцоогоор {results.estimatedDistanceKm}км-ийн зам</p>
                </div>
              </div>
            </div>
            
            <div className="mt-6 bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">📍 Маршрут</h4>
              <p className="text-blue-700">{results.routes}</p>
              <p className="text-sm text-blue-600 mt-1">Google Maps-аас жинхэнэ мэдээлэл авсан</p>
              <p className="text-xs text-blue-500 mt-1">Тооцоолсон цаг: {results.calculatedAt}</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleMapsTrafficCalculator;

