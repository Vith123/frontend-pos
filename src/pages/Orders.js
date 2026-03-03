import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Select, Space, Tag, Card, Typography, 
  DatePicker, Modal, Descriptions, Divider, message, Popconfirm, Row, Col 
} from 'antd';
import { 
  EyeOutlined, UndoOutlined, FilterOutlined, ShoppingCartOutlined,
  UserOutlined, DollarOutlined, CalendarOutlined
} from '@ant-design/icons';
import api from '../services/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: [],
    status: ''
  });

  const fetchOrders = useCallback(async () => {
    try {
      let url = '/orders';
      const params = new URLSearchParams();
      if (filters.dateRange?.length === 2) {
        params.append('startDate', filters.dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', filters.dateRange[1].format('YYYY-MM-DD'));
      }
      if (filters.status) params.append('status', filters.status);
      if (params.toString()) url += `?${params.toString()}`;

      const res = await api.get(url);
      setOrders(res.data);
    } catch (error) {
      message.error('Error loading orders');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const viewOrder = async (orderId) => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setSelectedOrder(res.data);
      setModalVisible(true);
    } catch (error) {
      message.error('Error loading order details');
    }
  };

  const handleRefund = async (orderId) => {
    try {
      await api.put(`/orders/${orderId}/refund`);
      message.success('Order refunded successfully');
      fetchOrders();
      setModalVisible(false);
    } catch (error) {
      message.error(error.response?.data?.message || 'Error refunding order');
    }
  };

  const applyFilters = () => {
    setLoading(true);
    fetchOrders();
  };

  const clearFilters = () => {
    setFilters({ dateRange: [], status: '' });
    setLoading(true);
    fetchOrders();
  };

  const formatDate = (date) => {
    return dayjs(date).format('MMM DD, YYYY HH:mm');
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'refunded': return 'error';
      default: return 'default';
    }
  };

  const columns = [
    {
      title: 'Order #',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      render: (text) => <Text strong>#{text}</Text>
    },
    {
      title: 'Date',
      dataIndex: 'createdAt',
      key: 'date',
      render: (date) => (
        <Space>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          {formatDate(date)}
        </Space>
      ),
      sorter: (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    },
    {
      title: 'Customer',
      dataIndex: ['customer', 'name'],
      key: 'customer',
      render: (text) => (
        <Space>
          <UserOutlined style={{ color: '#8c8c8c' }} />
          {text || 'Walk-in'}
        </Space>
      )
    },
    {
      title: 'Items',
      dataIndex: 'items',
      key: 'items',
      render: (items) => <Tag icon={<ShoppingCartOutlined />}>{items?.length || 0}</Tag>
    },
    {
      title: 'Total',
      dataIndex: 'total',
      key: 'total',
      render: (total) => (
        <Text strong style={{ color: '#52c41a' }}>
          <DollarOutlined /> {total?.toFixed(2)}
        </Text>
      ),
      sorter: (a, b) => a.total - b.total
    },
    {
      title: 'Payment',
      dataIndex: 'paymentMethod',
      key: 'payment',
      render: (method) => (
        <Tag color={method === 'cash' ? 'green' : 'blue'}>
          {method?.toUpperCase()}
        </Tag>
      )
    },
    {
      title: 'Status',
      dataIndex: 'paymentStatus',
      key: 'status',
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {status?.toUpperCase()}
        </Tag>
      ),
      filters: [
        { text: 'Completed', value: 'completed' },
        { text: 'Pending', value: 'pending' },
        { text: 'Refunded', value: 'refunded' },
      ],
      onFilter: (value, record) => record.paymentStatus === value
    },
    {
      title: 'Cashier',
      dataIndex: ['cashier', 'name'],
      key: 'cashier',
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button
            type="primary"
            ghost
            icon={<EyeOutlined />}
            size="small"
            onClick={() => viewOrder(record._id)}
          />
          {record.paymentStatus === 'completed' && (
            <Popconfirm
              title="Refund Order"
              description="Are you sure you want to refund this order?"
              onConfirm={() => handleRefund(record._id)}
              okText="Yes"
              cancelText="No"
              okButtonProps={{ danger: true }}
            >
              <Button
                danger
                icon={<UndoOutlined />}
                size="small"
              />
            </Popconfirm>
          )}
        </Space>
      )
    }
  ];

  const itemColumns = [
    { title: 'Product', dataIndex: 'name', key: 'name' },
    { title: 'Price', dataIndex: 'price', key: 'price', render: (v) => `$${v?.toFixed(2)}` },
    { title: 'Qty', dataIndex: 'quantity', key: 'qty', render: (v) => <Tag>{v}</Tag> },
    { title: 'Subtotal', dataIndex: 'subtotal', key: 'subtotal', render: (v) => <Text strong>${v?.toFixed(2)}</Text> }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>Orders</Title>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: 20 }}>
        <Space wrap>
          <RangePicker
            value={filters.dateRange}
            onChange={(dates) => setFilters({ ...filters, dateRange: dates })}
            allowClear
          />
          <Select
            placeholder="Filter by status"
            style={{ width: 150 }}
            value={filters.status || undefined}
            onChange={(value) => setFilters({ ...filters, status: value })}
            allowClear
          >
            <Option value="completed">Completed</Option>
            <Option value="pending">Pending</Option>
            <Option value="refunded">Refunded</Option>
          </Select>
          <Button type="primary" icon={<FilterOutlined />} onClick={applyFilters}>
            Apply
          </Button>
          <Button onClick={clearFilters}>Clear</Button>
        </Space>
      </Card>

      {/* Orders Table */}
      <Card>
        <Table
          dataSource={orders}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ 
            pageSize: 10, 
            showSizeChanger: true, 
            showTotal: (total) => `Total ${total} orders` 
          }}
        />
      </Card>

      {/* Order Details Modal */}
      <Modal
        title={<><ShoppingCartOutlined /> Order Details - #{selectedOrder?.orderNumber}</>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        width={700}
        footer={[
          <Button key="close" onClick={() => setModalVisible(false)}>
            Close
          </Button>,
          selectedOrder?.paymentStatus === 'completed' && (
            <Popconfirm
              key="refund"
              title="Are you sure you want to refund?"
              onConfirm={() => handleRefund(selectedOrder._id)}
            >
              <Button danger icon={<UndoOutlined />}>
                Refund Order
              </Button>
            </Popconfirm>
          )
        ]}
      >
        {selectedOrder && (
          <>
            <Row gutter={[16, 16]}>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Date">{formatDate(selectedOrder.createdAt)}</Descriptions.Item>
                  <Descriptions.Item label="Customer">{selectedOrder.customer?.name || 'Walk-in'}</Descriptions.Item>
                  <Descriptions.Item label="Cashier">{selectedOrder.cashier?.name}</Descriptions.Item>
                </Descriptions>
              </Col>
              <Col span={12}>
                <Descriptions column={1} size="small">
                  <Descriptions.Item label="Payment">
                    <Tag color="blue">{selectedOrder.paymentMethod?.toUpperCase()}</Tag>
                  </Descriptions.Item>
                  <Descriptions.Item label="Status">
                    <Tag color={getStatusColor(selectedOrder.paymentStatus)}>
                      {selectedOrder.paymentStatus?.toUpperCase()}
                    </Tag>
                  </Descriptions.Item>
                </Descriptions>
              </Col>
            </Row>

            <Divider>Order Items</Divider>

            <Table
              dataSource={selectedOrder.items}
              columns={itemColumns}
              rowKey={(_, index) => index}
              pagination={false}
              size="small"
            />

            <Divider />

            <div style={{ textAlign: 'right' }}>
              <Space direction="vertical" size={4}>
                <Text>Subtotal: ${selectedOrder.subtotal?.toFixed(2)}</Text>
                {selectedOrder.discount > 0 && (
                  <Text type="success">Discount: -${selectedOrder.discount?.toFixed(2)}</Text>
                )}
                <Title level={4} style={{ margin: 0 }}>
                  Total: ${selectedOrder.total?.toFixed(2)}
                </Title>
                {selectedOrder.paymentMethod === 'cash' && (
                  <>
                    <Text type="secondary">Received: ${selectedOrder.amountReceived?.toFixed(2)}</Text>
                    <Text type="secondary">Change: ${selectedOrder.change?.toFixed(2)}</Text>
                  </>
                )}
              </Space>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default Orders;
