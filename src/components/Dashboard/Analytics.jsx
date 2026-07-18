import { useState, useEffect } from 'react';
import { 
  TrendingUp, DollarSign, ShoppingBag, Calendar,
  Download, ChevronLeft, ChevronRight, FileText
} from 'lucide-react';
import api from '../../api/api';

export default function Analytics() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyData, setMonthlyData] = useState({});
  const [dayOrders, setDayOrders] = useState([]);
  const [dayStats, setDayStats] = useState({ total: 0, revenue: 0 });
  const [monthStats, setMonthStats] = useState({ total: 0, revenue: 0 });
  const [loading, setLoading] = useState(true);
  const [dayLoading, setDayLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    fetchMonthData(currentMonth);
  }, [currentMonth]);

  useEffect(() => {
    fetchDayOrders(selectedDate);
  }, [selectedDate]);

  const fetchMonthData = async (date) => {
    setLoading(true);
    try {
      const year = date.getFullYear();
      const month = date.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await api.get(`/admin/orders/analytics?period=month&startDate=${startDate}&endDate=${endDate}`);
      
      if (res.data.success) {
        setMonthlyData(res.data.analytics.ordersByDate || {});
        setMonthStats({
          total: res.data.analytics.totalOrders || 0,
          revenue: res.data.analytics.totalRevenue || 0
        });
      }
    } catch (err) {
      console.error('Error fetching month data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDayOrders = async (date) => {
    setDayLoading(true);
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const res = await api.get(`/admin/orders?startDate=${startDate.toISOString()}&endDate=${endDate.toISOString()}&limit=100`);
      
      if (res.data.success) {
        const orders = res.data.orders || [];
        setDayOrders(orders);
        const revenue = orders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0);
        setDayStats({ total: orders.length, revenue });
      }
    } catch (err) {
      console.error('Error fetching day orders:', err);
    } finally {
      setDayLoading(false);
    }
  };

  const handleDownloadExcel = async (type) => {
    setDownloading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      let startDate, endDate, filename;

      if (type === 'month') {
        startDate = new Date(year, month, 1).toISOString();
        endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
        filename = `sales-${year}-${String(month + 1).padStart(2, '0')}`;
      } else {
        const d = new Date(selectedDate);
        d.setHours(0, 0, 0, 0);
        startDate = d.toISOString();
        const e = new Date(selectedDate);
        e.setHours(23, 59, 59, 999);
        endDate = e.toISOString();
        filename = `sales-${formatDate(selectedDate)}`;
      }

      const res = await api.get(
        `/admin/orders/export?startDate=${startDate}&endDate=${endDate}&format=excel`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${filename}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading file. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth();
      const startDate = new Date(year, month, 1).toISOString();
      const endDate = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

      const res = await api.get(
        `/admin/orders/export?startDate=${startDate}&endDate=${endDate}&format=pdf`,
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `sales-${year}-${String(month + 1).padStart(2, '0')}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error downloading PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  const formatDate = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  const isSameDay = (d1, d2) => formatDate(d1) === formatDate(d2);
  const isToday = (date) => isSameDay(date, new Date());
  const hasOrders = (day) => {
    const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return monthlyData[key] && monthlyData[key].count > 0;
  };

  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));

  const monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  return (
    <div className="space-y-6">
      {/* Month Stats Header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-lg"><ShoppingBag className="h-6 w-6 text-blue-600" /></div>
            <div>
              <p className="text-sm text-gray-500">This Month Orders</p>
              <p className="text-2xl font-bold text-gray-900">{monthStats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-green-600" /></div>
            <div>
              <p className="text-sm text-gray-500">This Month Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{monthStats.revenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-purple-100 p-3 rounded-lg"><TrendingUp className="h-6 w-6 text-purple-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Selected Day Orders</p>
              <p className="text-2xl font-bold text-gray-900">{dayStats.total}</p>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-3 rounded-lg"><DollarSign className="h-6 w-6 text-orange-600" /></div>
            <div>
              <p className="text-sm text-gray-500">Selected Day Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{dayStats.revenue.toFixed(0)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Day Orders Table */}
        <div className="lg:col-span-2 card">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Orders — {selectedDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </h3>
              <p className="text-sm text-gray-500">{dayOrders.length} orders · ₹{dayStats.revenue.toFixed(0)} collected</p>
            </div>
            <button
              onClick={() => handleDownloadExcel('day')}
              disabled={downloading || dayOrders.length === 0}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Export Day
            </button>
          </div>

          {dayLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="spinner"></div>
            </div>
          ) : dayOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No orders on this day</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b">
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Time</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Customer</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Table</th>
                    <th className="text-left px-3 py-2 text-gray-600 font-medium">Items</th>
                    <th className="text-right px-3 py-2 text-gray-600 font-medium">Amount</th>
                    <th className="text-center px-3 py-2 text-gray-600 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {dayOrders.map((order, i) => (
                    <tr key={order._id || i} className="hover:bg-gray-50">
                      <td className="px-3 py-3 text-gray-600 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-3 py-3">
                        <p className="font-medium text-gray-900">{order.customerName || 'Guest'}</p>
                        <p className="text-gray-400 text-xs">{order.customerPhone || ''}</p>
                      </td>
                      <td className="px-3 py-3 text-gray-700">Table {order.tableNumber}</td>
                      <td className="px-3 py-3 text-gray-600 max-w-xs">
                        {order.items?.map(item => `${item.name} x${item.quantity}`).join(', ')}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold text-gray-900">
                        ₹{order.totalAmount?.toFixed(0)}
                      </td>
                      <td className="px-3 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          order.paymentStatus === 'paid' ? 'bg-green-100 text-green-700' : 
                          order.paymentStatus === 'failed' ? 'bg-red-100 text-red-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {order.paymentStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-50 border-t-2 border-gray-200">
                    <td colSpan="4" className="px-3 py-3 font-bold text-gray-900">Total</td>
                    <td className="px-3 py-3 text-right font-bold text-blue-600 text-lg">
                      ₹{dayOrders.filter(o => o.paymentStatus === 'paid').reduce((s, o) => s + o.totalAmount, 0).toFixed(0)}
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>

        {/* Calendar */}
        <div className="card">
          {/* Calendar Header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <h3 className="font-bold text-gray-900">
              {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
            </h3>
            <button onClick={nextMonth} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 mb-2">
            {dayNames.map(d => (
              <div key={d} className="text-center text-xs font-medium text-gray-400 py-1">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {/* Empty cells for first day */}
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
              const isSelected = isSameDay(date, selectedDate);
              const todayDay = isToday(date);
              const hasOrd = hasOrders(day);
              const key = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayRevenue = monthlyData[key]?.revenue || 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(date)}
                  className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-sm transition-all ${
                    isSelected ? 'bg-blue-600 text-white shadow-md' :
                    todayDay ? 'bg-blue-50 text-blue-600 font-bold border border-blue-200' :
                    'hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-medium leading-none">{day}</span>
                  {hasOrd && (
                    <span className={`mt-0.5 w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`}></span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Calendar Legend */}
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-500 inline-block"></span>
              Has orders
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-4 h-4 rounded bg-blue-600 inline-block"></span>
              Selected
            </div>
          </div>

          {/* Monthly Summary */}
          {!loading && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Month Summary</p>
              <div className="space-y-2">
                {Object.entries(monthlyData)
                  .sort((a, b) => b[0].localeCompare(a[0]))
                  .slice(0, 5)
                  .map(([date, data]) => (
                    <div key={date} className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">
                        {new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                      <div className="text-right">
                        <span className="text-gray-900 font-medium">₹{data.revenue?.toFixed(0)}</span>
                        <span className="text-gray-400 text-xs ml-1">({data.count} orders)</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Download Buttons */}
          <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase">
              Download {monthNames[currentMonth.getMonth()]} Report
            </p>
            <button
              onClick={() => handleDownloadExcel('month')}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Excel (.xlsx)
            </button>
            <button
              onClick={handleDownloadPDF}
              disabled={downloading}
              className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 transition-colors"
            >
              <FileText className="h-4 w-4" />
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
