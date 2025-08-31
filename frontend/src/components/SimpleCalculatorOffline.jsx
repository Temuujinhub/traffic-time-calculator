import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MapPin, Calculator, Clock, TrendingUp } from 'lucide-react';

const SimpleCalculatorOffline = ({ onCalculationComplete }) => {
  const [formData, setFormData] = useState({
    origin: '',
    destination: '',
    normalTime: '',
    trafficTime: ''
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.origin.trim()) newErrors.origin = 'Гэрийн хаяг оруулна уу';
    if (!formData.destination.trim()) newErrors.destination = 'Ажлын байрны хаяг оруулна уу';
    if (!formData.normalTime || formData.normalTime <= 0) newErrors.normalTime = 'Түгжрэлгүй цагийг оруулна уу';
    if (!formData.trafficTime || formData.trafficTime <= 0) newErrors.trafficTime = 'Түгжрэлтэй цагийг оруулна уу';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const calculateLoss = () => {
    if (!validateForm()) return;

    const normalMinutes = parseInt(formData.normalTime);
    const trafficMinutes = parseInt(formData.trafficTime);
    
    const dailyLossMinutes = Math.max(0, trafficMinutes - normalMinutes) * 2; // Round trip
    const monthlyLossHours = (dailyLossMinutes * 20) / 60; // 20 working days
    const annualLossDays = (monthlyLossHours * 12) / 24; // 12 months

    const calculationResults = {
      origin: formData.origin,
      destination: formData.destination,
      daily_loss_minutes: dailyLossMinutes,
      monthly_loss_hours: monthlyLossHours,
      annual_loss_days: annualLossDays,
      duration_in_traffic_minutes: trafficMinutes,
      normal_duration_minutes: normalMinutes,
      distance_km: 15 // Estimate
    };

    setResults(calculationResults);
    
    if (onCalculationComplete) {
      onCalculationComplete(calculationResults);
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
      <div className="text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-3">
          Түгжрэлд Алдагдсан Цаг Тооцоолуур
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Өдөр бүр түгжрэлд хэр их цаг алдаж байгаагаа олж мэдээд, жилийн хэмжээнд хэр их боломж алдаж гэдэгээ харна уу
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Цагийн мэдээлэл оруулна уу
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Гэрийн хаяг
                </label>
                <Input
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ажлын байр
                </label>
                <Input
                  placeholder="Ажлын байрны хаягаа оруулна уу"
                  value={formData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  className={errors.destination ? 'border-red-500' : ''}
                />
                {errors.destination && (
                  <p className="text-red-500 text-sm mt-1">{errors.destination}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Түгжрэлгүй цаг (минут)
                </label>
                <Input
                  type="number"
                  placeholder="жнь: 25"
                  value={formData.normalTime}
                  onChange={(e) => handleInputChange('normalTime', e.target.value)}
                  className={errors.normalTime ? 'border-red-500' : ''}
                />
                {errors.normalTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.normalTime}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Түгжрэлтэй цаг (минут)
                </label>
                <Input
                  type="number"
                  placeholder="жнь: 45"
                  value={formData.trafficTime}
                  onChange={(e) => handleInputChange('trafficTime', e.target.value)}
                  className={errors.trafficTime ? 'border-red-500' : ''}
                />
                {errors.trafficTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.trafficTime}</p>
                )}
              </div>
            </div>

            <Button onClick={calculateLoss} className="w-full">
              <Calculator className="h-4 w-4 mr-2" />
              Цагийн алдагдлыг тооцоолох
            </Button>
          </CardContent>
        </Card>
      </div>

      {results && (
        <Card className="max-w-4xl mx-auto">
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
                      Таны маршрут: {results.origin} → {results.destination}
                    </p>
                    <p>
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

export default SimpleCalculatorOffline;
