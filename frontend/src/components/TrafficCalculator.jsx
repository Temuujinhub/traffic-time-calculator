import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calculator, Clock, TrendingUp } from 'lucide-react';

const TrafficCalculator = ({ onCalculationComplete }) => {
  const [formData, setFormData] = useState({
    origin: '',
    waypoint: '',
    destination: ''
  });
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  
  const mapRef = useRef(null);
  const directionsService = useRef(null);
  const directionsRenderer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    // Initialize Google Maps
    if (window.google && window.google.maps) {
      initializeMap();
    }
  }, []);

  const initializeMap = () => {
    // Initialize map
    map.current = new window.google.maps.Map(mapRef.current, {
      center: { lat: 47.9184, lng: 106.9177 }, // Ulaanbaatar center
      zoom: 12
    });

    directionsService.current = new window.google.maps.DirectionsService();
    directionsRenderer.current = new window.google.maps.DirectionsRenderer();
    directionsRenderer.current.setMap(map.current);

    // Initialize autocomplete for input fields
    setupAutocomplete();
  };

  const setupAutocomplete = () => {
    const originInput = document.getElementById('origin');
    const waypointInput = document.getElementById('waypoint');
    const destinationInput = document.getElementById('destination');

    if (originInput) {
      const originAutocomplete = new window.google.maps.places.Autocomplete(originInput);
      originAutocomplete.addListener('place_changed', () => {
        const place = originAutocomplete.getPlace();
        setFormData(prev => ({ ...prev, origin: place.formatted_address || place.name }));
      });
    }

    if (waypointInput) {
      const waypointAutocomplete = new window.google.maps.places.Autocomplete(waypointInput);
      waypointAutocomplete.addListener('place_changed', () => {
        const place = waypointAutocomplete.getPlace();
        setFormData(prev => ({ ...prev, waypoint: place.formatted_address || place.name }));
      });
    }

    if (destinationInput) {
      const destinationAutocomplete = new window.google.maps.places.Autocomplete(destinationInput);
      destinationAutocomplete.addListener('place_changed', () => {
        const place = destinationAutocomplete.getPlace();
        setFormData(prev => ({ ...prev, destination: place.formatted_address || place.name }));
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.origin.trim()) newErrors.origin = 'Гэрийн хаяг оруулна уу';
    if (!formData.destination.trim()) newErrors.destination = 'Ажлын байрны хаяг оруулна уу';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateRoute = async () => {
    if (!validateForm()) return;

    setIsCalculating(true);
    setResults(null);

    try {
      // Create waypoints array
      const waypoints = formData.waypoint ? 
        [{ location: formData.waypoint, stopover: true }] : [];

      // Calculate route with traffic
      const trafficRequest = {
        origin: formData.origin,
        destination: formData.destination,
        waypoints: waypoints,
        travelMode: window.google.maps.TravelMode.DRIVING,
        drivingOptions: {
          departureTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          trafficModel: window.google.maps.TrafficModel.PESSIMISTIC
        },
        avoidHighways: false,
        avoidTolls: false
      };

      // Calculate route without traffic (optimistic)
      const normalRequest = {
        ...trafficRequest,
        drivingOptions: {
          departureTime: new Date(Date.now() + 30 * 60 * 1000),
          trafficModel: window.google.maps.TrafficModel.OPTIMISTIC
        }
      };

      const [trafficResult, normalResult] = await Promise.all([
        new Promise((resolve, reject) => {
          directionsService.current.route(trafficRequest, (result, status) => {
            if (status === 'OK') resolve(result);
            else reject(status);
          });
        }),
        new Promise((resolve, reject) => {
          directionsService.current.route(normalRequest, (result, status) => {
            if (status === 'OK') resolve(result);
            else reject(status);
          });
        })
      ]);

      // Display route on map
      directionsRenderer.current.setDirections(trafficResult);

      // Calculate time differences
      const trafficDuration = trafficResult.routes[0].legs.reduce((total, leg) => {
        // Use duration_in_traffic if available, otherwise fall back to duration
        const duration = leg.duration_in_traffic ? leg.duration_in_traffic.value : leg.duration.value;
        return total + duration;
      }, 0);
      const normalDuration = normalResult.routes[0].legs.reduce((total, leg) => total + leg.duration.value, 0);
      const distance = trafficResult.routes[0].legs.reduce((total, leg) => total + leg.distance.value, 0);

      const trafficMinutes = Math.round(trafficDuration / 60);
      const normalMinutes = Math.round(normalDuration / 60);
      const dailyLossMinutes = Math.max(0, trafficMinutes - normalMinutes) * 2; // Round trip
      const monthlyLossHours = (dailyLossMinutes * 20) / 60; // 20 working days
      const annualLossDays = (monthlyLossHours * 12) / 24; // 12 months

      const calculationResults = {
        origin: formData.origin,
        waypoint: formData.waypoint,
        destination: formData.destination,
        daily_loss_minutes: dailyLossMinutes,
        monthly_loss_hours: monthlyLossHours,
        annual_loss_days: annualLossDays,
        duration_in_traffic_minutes: trafficMinutes,
        normal_duration_minutes: normalMinutes,
        distance_km: Math.round(distance / 1000 * 100) / 100
      };

      setResults(calculationResults);

      // Save to backend
      try {
        const response = await fetch('/api/calculations', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calculationResults)
        });

        if (response.ok) {
          const savedCalculation = await response.json();
          if (onCalculationComplete) {
            onCalculationComplete(savedCalculation);
          }
        }
      } catch (error) {
        console.error('Error saving calculation:', error);
      }

    } catch (error) {
      console.error('Error calculating route:', error);
      setErrors({ general: 'Маршрут тооцоолоход алдаа гарлаа. Дахин оролдоно уу.' });
    } finally {
      setIsCalculating(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-3">
          Түгжрэлд Алдагдсан Цаг Тооцоолуур
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Өдөр бүр түгжрэлд хэр их цаг алдаж байгаагаа олж мэдээд, жилийн хэмжээнд хэр их боломж алдаж гэдэгээ харна уу
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Өдрийн маршрутаа оруулна уу
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="origin" className="block text-sm font-medium text-gray-700 mb-1">
                Гэрийн хаяг
              </label>
              <Input
                id="origin"
                placeholder="Гэрийн хаягаа оруулна уу"
                value={formData.origin}
                onChange={(e) => handleInputChange('origin', e.target.value)}
                className={errors.origin ? 'border-red-500' : ''}
              />
              {errors.origin && (
                <p className="text-red-500 text-sm mt-1">{errors.origin}</p>
              )}
            </div>

            <div>
              <label htmlFor="waypoint" className="block text-sm font-medium text-gray-700 mb-1">
                Сургууль/Их сургууль (заавал биш)
              </label>
              <Input
                id="waypoint"
                placeholder="Сургуулийн хаягаа оруулна уу"
                value={formData.waypoint}
                onChange={(e) => handleInputChange('waypoint', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="destination" className="block text-sm font-medium text-gray-700 mb-1">
                Ажлын байр
              </label>
              <Input
                id="destination"
                placeholder="Ажлын байрны хаягаа оруулна уу"
                value={formData.destination}
                onChange={(e) => handleInputChange('destination', e.target.value)}
                className={errors.destination ? 'border-red-500' : ''}
              />
              {errors.destination && (
                <p className="text-red-500 text-sm mt-1">{errors.destination}</p>
              )}
            </div>

            {errors.general && (
              <p className="text-red-500 text-sm">{errors.general}</p>
            )}

            <Button 
              onClick={calculateRoute} 
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Clock className="h-4 w-4 mr-2 animate-spin" />
                  Тооцоолж байна...
                </>
              ) : (
                <>
                  <Calculator className="h-4 w-4 mr-2" />
                  Цагийн алдагдлыг тооцоолох
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Map */}
        <Card>
          <CardHeader>
            <CardTitle>Таны маршрутын дүрслэл</CardTitle>
          </CardHeader>
          <CardContent>
            <div 
              ref={mapRef} 
              className="w-full h-[400px] bg-gray-100 rounded-lg"
            />
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Түгжрэлд алдагдсан цаг шинжилгээ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-2">Өдрийн алдагдсан цаг</h3>
                <p className="text-3xl font-bold text-blue-600">{results.daily_loss_minutes} мин</p>
                <p className="text-sm text-gray-600 mt-1">Түгжрэлийн улмаас нэмэлт зарцуулсан цаг</p>
              </div>
              
              <div className="bg-orange-50 p-6 rounded-lg border border-orange-100">
                <h3 className="text-lg font-medium text-orange-800 mb-2">Сарын алдагдсан цаг</h3>
                <p className="text-3xl font-bold text-orange-600">{Math.round(results.monthly_loss_hours * 10) / 10} цаг</p>
                <p className="text-sm text-gray-600 mt-1">Сард 20 ажлын өдөртэйгээр тооцсон</p>
              </div>
              
              <div className="bg-red-50 p-6 rounded-lg border border-red-100">
                <h3 className="text-lg font-medium text-red-800 mb-2">Жилийн алдагдсан цаг</h3>
                <p className="text-3xl font-bold text-red-600">{Math.round(results.annual_loss_days * 10) / 10} хоног</p>
                <p className="text-sm text-gray-600 mt-1">Амралтын хоногтой тэнцэх хэмжээ</p>
              </div>
            </div>

            <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <Clock className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-yellow-800">Та мэдэх үү?</h3>
                  <div className="mt-2 text-yellow-700">
                    <p>
                      Таны маршрут: {results.distance_km} км, 
                      Түгжрэлтэй: {results.duration_in_traffic_minutes} мин, 
                      Түгжрэлгүй: {results.normal_duration_minutes} мин
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default TrafficCalculator;

