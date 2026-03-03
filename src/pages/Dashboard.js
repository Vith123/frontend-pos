import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Row, Col, Card, Statistic, Table, Tag, Button, Spin, Typography } from 'antd';
import { 
  DollarOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  WarningOutlined,
  RiseOutlined,
  ShopOutlined
} from '@ant-design/icons';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';
import api from '../services/api';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

const { Title: AntTitle } = Typography;

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsRes, salesRes] = await Promise.all([
        api.get('/dashboard/stats'),
        api.get('/dashboard/sales-report?groupBy=day')
      ]);
      setStats(statsRes.data);
      setSalesData(salesRes.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const barChartData = {
    labels: salesData.map(item => item._id),
    datasets: [
      {
        label: 'Sales',
        data: salesData.map(item => item.totalSales),
        backgroundColor: '#4361ee',
        borderRadius: 5
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: false }
    },
    scales: {
      y: { beginAtZero: true }
    }
  };

  const doughnutData = {
    labels: stats?.topProducts?.map(p => p.name) || [],
    datasets: [
      {
        data: stats?.topProducts?.map(p => p.totalSold) || [],
        backgroundColor: ['#4361ee', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']
      }
    ]
  };

  const orderColumns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (text) => text || 'Walk-in'
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (val) => `$${val?.toFixed(2)}`
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'green' : 'orange'}>
          {status?.toUpperCase()}
        </Tag>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div style={{ padding: '0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <AntTitle level={3} style={{ margin: 0 }}>Dashboard</AntTitle>
        <Link to="/pos">
          <Button type="primary" icon={<ShopOutlined />} size="large">
            New Sale
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Today's Sales"
              value={stats?.todaySales || 0}
              precision={2}
              prefix={<DollarOutlined style={{ color: '#4361ee' }} />}
              valueStyle={{ color: '#4361ee' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Today's Orders"
              value={stats?.todayOrdersCount || 0}
              prefix={<ShoppingCartOutlined style={{ color: '#10b981' }} />}
              valueStyle={{ color: '#10b981' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Total Customers"
              value={stats?.totalCustomers || 0}
              prefix={<UserOutlined style={{ color: '#f59e0b' }} />}
              valueStyle={{ color: '#f59e0b' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card hoverable>
            <Statistic
              title="Low Stock Items"
              value={stats?.lowStockProducts || 0}
              prefix={<WarningOutlined style={{ color: '#ef4444' }} />}
              valueStyle={{ color: '#ef4444' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={14}>
          <Card title={<><RiseOutlined /> Sales Overview</>}>
            <Bar data={barChartData} options={barChartOptions} height={100} />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Top Selling Products">
            <div style={{ maxWidth: '280px', margin: '0 auto' }}>
              <Doughnut data={doughnutData} />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Recent Orders & Monthly Summary */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={14}>
          <Card 
            title="Recent Orders"
            extra={<Link to="/orders"><Button type="link">View All</Button></Link>}
          >
            <Table
              dataSource={stats?.recentOrders || []}
              columns={orderColumns}
              rowKey="_id"
              pagination={false}
              size="small"
            />
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card title="Monthly Summary">
            <div style={{ padding: '10px 0' }}>
              <Row justify="space-between" style={{ marginBottom: 20 }}>
                <span>Total Revenue</span>
                <strong style={{ fontSize: 18, color: '#4361ee' }}>
                  ${stats?.monthSales?.toFixed(2) || '0.00'}
                </strong>
              </Row>
              <Row justify="space-between" style={{ marginBottom: 20 }}>
                <span>Total Products</span>
                <strong style={{ fontSize: 18 }}>{stats?.totalProducts || 0}</strong>
              </Row>
              <Row justify="space-between">
                <span>Total Users</span>
                <strong style={{ fontSize: 18 }}>{stats?.totalUsers || 0}</strong>
              </Row>
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;
