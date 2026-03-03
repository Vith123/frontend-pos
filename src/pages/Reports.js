import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement } from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement, PointElement, LineElement);

const Reports = () => {
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [salesData, setSalesData] = useState([]);
  const [paymentData, setPaymentData] = useState([]);
  const [groupBy, setGroupBy] = useState('day');

  const fetchReportData = useCallback(async () => {
    setLoading(true);
    try {
      const [salesRes, paymentRes] = await Promise.all([
        api.get(`/dashboard/sales-report?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}&groupBy=${groupBy}`),
        api.get(`/dashboard/payment-summary?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`)
      ]);
      setSalesData(salesRes.data);
      setPaymentData(paymentRes.data);
    } catch (error) {
      toast.error('Error loading report data');
    } finally {
      setLoading(false);
    }
  }, [dateRange, groupBy]);

  useEffect(() => {
    fetchReportData();
  }, [fetchReportData]);

  const totalSales = salesData.reduce((acc, item) => acc + item.totalSales, 0);
  const totalOrders = salesData.reduce((acc, item) => acc + item.orderCount, 0);
  const avgOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

  const salesChartData = {
    labels: salesData.map(item => item._id),
    datasets: [
      {
        label: 'Sales ($)',
        data: salesData.map(item => item.totalSales),
        backgroundColor: '#4361ee',
        borderColor: '#4361ee',
        tension: 0.4
      }
    ]
  };

  const ordersChartData = {
    labels: salesData.map(item => item._id),
    datasets: [
      {
        label: 'Orders',
        data: salesData.map(item => item.orderCount),
        backgroundColor: '#10b981',
        borderRadius: 5
      }
    ]
  };

  const paymentChartData = {
    labels: paymentData.map(item => item._id.charAt(0).toUpperCase() + item._id.slice(1)),
    datasets: [
      {
        data: paymentData.map(item => item.total),
        backgroundColor: ['#10b981', '#4361ee', '#f59e0b']
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  if (loading) {
    return <div className="spinner"></div>;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
      </div>

      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Start Date</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>End Date</label>
            <input
              type="date"
              className="form-control"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
            />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Group By</label>
            <select
              className="form-control"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label>Report Type</label>
            <select
              className="form-control"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="sales">Sales Report</option>
              <option value="orders">Orders Report</option>
              <option value="payments">Payment Methods</option>
            </select>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon primary">$</div>
          <div className="stat-info">
            <h4>Total Sales</h4>
            <p>${totalSales.toFixed(2)}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon success">#</div>
          <div className="stat-info">
            <h4>Total Orders</h4>
            <p>{totalOrders}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon warning">~</div>
          <div className="stat-info">
            <h4>Avg. Order Value</h4>
            <p>${avgOrderValue.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <h3>{reportType === 'sales' ? 'Sales Trend' : reportType === 'orders' ? 'Orders Count' : 'Payment Methods'}</h3>
          </div>
          {reportType === 'sales' && (
            <Line data={salesChartData} options={chartOptions} />
          )}
          {reportType === 'orders' && (
            <Bar data={ordersChartData} options={chartOptions} />
          )}
          {reportType === 'payments' && (
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <Doughnut data={paymentChartData} />
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-header">
            <h3>Detailed Data</h3>
          </div>
          <div className="table-container" style={{ maxHeight: '400px', overflow: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Sales</th>
                  <th>Orders</th>
                  <th>Avg. Value</th>
                </tr>
              </thead>
              <tbody>
                {salesData.map((item, index) => (
                  <tr key={index}>
                    <td>{item._id}</td>
                    <td>${item.totalSales.toFixed(2)}</td>
                    <td>{item.orderCount}</td>
                    <td>${item.avgOrderValue?.toFixed(2) || '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Payment Methods Summary</h3>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Payment Method</th>
                <th>Transactions</th>
                <th>Total Amount</th>
                <th>Percentage</th>
              </tr>
            </thead>
            <tbody>
              {paymentData.map((item, index) => (
                <tr key={index}>
                  <td style={{ textTransform: 'capitalize' }}>{item._id}</td>
                  <td>{item.count}</td>
                  <td>${item.total.toFixed(2)}</td>
                  <td>{((item.total / totalSales) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Reports;
