import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleMapsTrafficCalculator from './components/GoogleMapsTrafficCalculator';
import SimpleTrafficCalculator from './components/SimpleTrafficCalculator';
import CalculationsTable from './components/CalculationsTable';
import { Calculator, Table, MapPin } from 'lucide-react';
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
        <Tabs defaultValue="google-maps" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="google-maps" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Google Maps
            </TabsTrigger>
            <TabsTrigger value="calculator" className="flex items-center gap-2">
              <Calculator className="h-4 w-4" />
              Энгийн тооцоолуур
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Table className="h-4 w-4" />
              Түүх
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="google-maps">
            <GoogleMapsTrafficCalculator onCalculationComplete={handleCalculationComplete} />
          </TabsContent>
          
          <TabsContent value="calculator">
            <SimpleTrafficCalculator onCalculationComplete={handleCalculationComplete} />
          </TabsContent>
          
          <TabsContent value="history">
            <CalculationsTable refreshTrigger={refreshTrigger} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;
