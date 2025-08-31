import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleMapsTrafficCalculator from './components/GoogleMapsTrafficCalculator';
import SimpleCalculatorOffline from './components/SimpleCalculatorOffline';
import { Calculator, MapPin } from 'lucide-react';
import './App.css';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleCalculationComplete = () => {
    // Trigger refresh of calculations table
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="simple" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="simple" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Энгийн тооцоолуур
            </TabsTrigger>
            <TabsTrigger value="google-maps" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Google Maps
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="simple">
            <SimpleCalculatorOffline onCalculationComplete={handleCalculationComplete} />
          </TabsContent>
          
          <TabsContent value="google-maps">
            <GoogleMapsTrafficCalculator onCalculationComplete={handleCalculationComplete} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
