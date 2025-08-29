import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calculator, Clock, TrendingUp, AlertCircle } from 'lucide-react';

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
    if (!formData.origin.trim()) newErrors.origin = 'Гэрийн хаяг оруулна уу';
    if (!formData.destination.trim()) newErrors.destination = 'Ажлын байрны хаяг оруулна уу';
    if (!formData.normalDuration || formData.normalDuration <= 0) {
      newErrors.normalDuration = 'Түгжрэлгүй цагийг оруулна уу';
    }
    if (!formData.trafficDuration || formData.trafficDuration <= 0) {
      newErrors.trafficDuration = 'Түгжрэлтэй цагийг оруулна уу';
    }
    if (parseFloat(formData.trafficDuration) < parseFloat(formData.normalDuration)) {
      newErrors.trafficDuration = 'Түгжрэлтэй цаг нь түгжрэлгүй цагаас их байх ёстой';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateRoute = async () => {
    if (!validateForm()) return;

    setIsCalculating(true);
    setResults(null);

    try {
      const normalMinutes = parseFloat(formData.normalDuration);
      const trafficMinutes = parseFloat(formData.trafficDuration);
      const distance = parseFloat(formData.distance) || 0;

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
        distance_km: distance
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
        } else {
          console.error('Failed to save calculation');
        }
      } catch (error) {
        console.error('Error saving calculation:', error);
      }

    } catch (error) {
      console.error('Error calculating:', error);
      setErrors({ general: 'Тооцоолоход алдаа гарлаа. Дахин оролдоно уу.' });
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
              Маршрутын мэдээлэл оруулна уу
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

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="normalDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  Түгжрэлгүй цаг (минут)
                </label>
                <Input
                  id="normalDuration"
                  type="number"
                  placeholder="30"
                  value={formData.normalDuration}
                  onChange={(e) => handleInputChange('normalDuration', e.target.value)}
                  className={errors.normalDuration ? 'border-red-500' : ''}
                />
                {errors.normalDuration && (
                  <p className="text-red-500 text-sm mt-1">{errors.normalDuration}</p>
                )}
              </div>

              <div>
                <label htmlFor="trafficDuration" className="block text-sm font-medium text-gray-700 mb-1">
                  Түгжрэлтэй цаг (минут)
                </label>
                <Input
                  id="trafficDuration"
                  type="number"
                  placeholder="45"
                  value={formData.trafficDuration}
                  onChange={(e) => handleInputChange('trafficDuration', e.target.value)}
                  className={errors.trafficDuration ? 'border-red-500' : ''}
                />
                {errors.trafficDuration && (
                  <p className="text-red-500 text-sm mt-1">{errors.trafficDuration}</p>
                )}
              </div>
            </div>

            <div>
              <label htmlFor="distance" className="block text-sm font-medium text-gray-700 mb-1">
                Зай (км) - заавал биш
              </label>
              <Input
                id="distance"
                type="number"
                step="0.1"
                placeholder="15.5"
                value={formData.distance}
                onChange={(e) => handleInputChange('distance', e.target.value)}
              />
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

        {/* Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Хэрхэн ашиглах вэ?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">1</div>
                <p>Гэр болон ажлын байрны хаягийг оруулна уу</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">2</div>
                <p>Түгжрэлгүй болон түгжрэлтэй цагийг минутаар оруулна уу</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">3</div>
                <p>Хэрэв мэдэж байгаа бол зайг км-ээр оруулна уу</p>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">4</div>
                <p>Тооцоолох товчийг дарж үр дүнг харна уу</p>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">Зөвлөмж</h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Хамгийн сайн үр дүнг авахын тулд өглөөний цагийн түгжрэлийн үеийн цагийг ашиглана уу.
                  </p>
                </div>
              </div>
            </div>
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
                <p className="text-sm text-gray-600 mt-1">Түгжрэлийн улмаас нэмэлт зарцуулсан цаг (нэг талын замд)</p>
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
                  <h3 className="text-lg font-medium text-yellow-800">Таны маршрутын мэдээлэл</h3>
                  <div className="mt-2 text-yellow-700">
                    <p>
                      {results.distance_km > 0 && `Зай: ${results.distance_km} км, `}
                      Түгжрэлтэй: {results.duration_in_traffic_minutes} мин, 
                      Түгжрэлгүй: {results.normal_duration_minutes} мин
                    </p>
                    <p className="mt-1">
                      Өдөр бүр {results.daily_loss_minutes} минут илүү цаг зарцуулж байна!
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

export default SimpleTrafficCalculator;

