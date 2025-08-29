import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, RefreshCw, BarChart3, Clock, MapPin } from 'lucide-react';

const CalculationsTable = ({ refreshTrigger }) => {
  const [calculations, setCalculations] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [perPage] = useState(10);

  useEffect(() => {
    fetchCalculations();
    fetchStats();
  }, [currentPage, refreshTrigger]);

  const fetchCalculations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/calculations?page=${currentPage}&per_page=${perPage}`);
      if (response.ok) {
        const data = await response.json();
        setCalculations(data.calculations);
        setTotalPages(data.pages);
      }
    } catch (error) {
      console.error('Error fetching calculations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/calculations/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const deleteCalculation = async (id) => {
    if (!confirm('Энэ тооцооллыг устгахдаа итгэлтэй байна уу?')) return;

    try {
      const response = await fetch(`/api/calculations/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchCalculations();
        fetchStats();
      }
    } catch (error) {
      console.error('Error deleting calculation:', error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('mn-MN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}ц ${mins}м`;
    }
    return `${mins}м`;
  };

  if (loading && calculations.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin text-blue-500" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Нийт тооцоолол</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.total_calculations}</p>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Дундаж өдрийн алдагдал</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.average_daily_loss}м</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Дундаж сарын алдагдал</p>
                  <p className="text-2xl font-bold text-green-600">{stats.average_monthly_loss}ц</p>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Дундаж жилийн алдагдал</p>
                  <p className="text-2xl font-bold text-red-600">{stats.average_annual_loss}х</p>
                </div>
                <Clock className="h-8 w-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Calculations Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Хадгалагдсан тооцоололууд
          </CardTitle>
          <Button onClick={fetchCalculations} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Шинэчлэх
          </Button>
        </CardHeader>
        <CardContent>
          {calculations.length === 0 ? (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Тооцоолол олдсонгүй</p>
              <p className="text-sm text-gray-400">Эхний тооцооллоо хийж үзнэ үү</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Огноо</TableHead>
                      <TableHead>Эхлэх цэг</TableHead>
                      <TableHead>Дундын цэг</TableHead>
                      <TableHead>Төгсгөлийн цэг</TableHead>
                      <TableHead>Өдрийн алдагдал</TableHead>
                      <TableHead>Сарын алдагдал</TableHead>
                      <TableHead>Жилийн алдагдал</TableHead>
                      <TableHead>Зай</TableHead>
                      <TableHead>Үйлдэл</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calculations.map((calc) => (
                      <TableRow key={calc.id}>
                        <TableCell className="text-sm">
                          {formatDate(calc.created_at)}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={calc.origin}>
                          {calc.origin}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={calc.waypoint}>
                          {calc.waypoint || '-'}
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate" title={calc.destination}>
                          {calc.destination}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {calc.daily_loss_minutes}м
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Math.round(calc.monthly_loss_hours * 10) / 10}ц
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {Math.round(calc.annual_loss_days * 10) / 10}х
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {calc.distance_km ? `${calc.distance_km}км` : '-'}
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => deleteCalculation(calc.id)}
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Хуудас {currentPage} / {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                      variant="outline"
                      size="sm"
                    >
                      Өмнөх
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                      variant="outline"
                      size="sm"
                    >
                      Дараах
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CalculationsTable;

