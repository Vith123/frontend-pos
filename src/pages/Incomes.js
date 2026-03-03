import React, { useState, useEffect, useCallback } from 'react';
import {
  Table, Button, Card, Typography, Space, Tag, Modal, Form,
  Input, InputNumber, Select, DatePicker, Row, Col, Statistic, Popconfirm, message
} from 'antd';
import {
  PlusOutlined, EditOutlined, DeleteOutlined, DollarOutlined,
  ClearOutlined, CalendarOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../services/api';

const { Title, Text } = Typography;
const { Option } = Select;
const { TextArea } = Input;
const { RangePicker } = DatePicker;

const Incomes = () => {
  const [incomes, setIncomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [summary, setSummary] = useState(null);
  const [dateRange, setDateRange] = useState([null, null]);
  const [filterCategory, setFilterCategory] = useState('');
  const [form] = Form.useForm();

  const incomeCategories = [
    { value: 'sales', label: 'Sales', color: 'green' },
    { value: 'refund_reversal', label: 'Refund Reversal', color: 'orange' },
    { value: 'investment', label: 'Investment', color: 'blue' },
    { value: 'loan', label: 'Loan', color: 'purple' },
    { value: 'other', label: 'Other', color: 'default' }
  ];

  const paymentMethods = [
    { value: 'cash', label: 'Cash' },
    { value: 'card', label: 'Card' },
    { value: 'bank_transfer', label: 'Bank Transfer' },
    { value: 'other', label: 'Other' }
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateRange[0]) params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
      if (dateRange[1]) params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      if (filterCategory) params.append('category', filterCategory);

      const [incomesRes, summaryRes] = await Promise.all([
        api.get(`/incomes?${params.toString()}`),
        api.get(`/incomes/summary?${params.toString()}`)
      ]);
      setIncomes(incomesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      message.error('Failed to fetch incomes');
    } finally {
      setLoading(false);
    }
  }, [dateRange, filterCategory]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (values) => {
    const data = {
      ...values,
      date: values.date.format('YYYY-MM-DD')
    };

    try {
      if (editingIncome) {
        await api.put(`/incomes/${editingIncome._id}`, data);
        message.success('Income updated successfully');
      } else {
        await api.post('/incomes', data);
        message.success('Income created successfully');
      }
      closeModal();
      fetchData();
    } catch (error) {
      message.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/incomes/${id}`);
      message.success('Income deleted successfully');
      fetchData();
    } catch (error) {
      message.error('Failed to delete income');
    }
  };

  const handleEdit = (income) => {
    setEditingIncome(income);
    form.setFieldsValue({
      title: income.title,
      category: income.category,
      amount: income.amount,
      paymentMethod: income.paymentMethod,
      date: dayjs(income.date),
      description: income.description || ''
    });
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingIncome(null);
    form.resetFields();
  };

  const clearFilters = () => {
    setDateRange([null, null]);
    setFilterCategory('');
  };

  const getCategoryTag = (category) => {
    const cat = incomeCategories.find(c => c.value === category);
    return <Tag color={cat?.color || 'default'}>{cat?.label || category}</Tag>;
  };

  const columns = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 120,
      render: (date) => (
        <Space>
          <CalendarOutlined />
          {dayjs(date).format('MMM DD, YYYY')}
        </Space>
      ),
      sorter: (a, b) => new Date(a.date) - new Date(b.date),
      defaultSortOrder: 'descend'
    },
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (title, record) => (
        <Space>
          <Text strong>{title}</Text>
          {record.order && <Tag size="small">#{record.order.orderNumber}</Tag>}
        </Space>
      )
    },
    {
      title: 'Category',
      dataIndex: 'category',
      key: 'category',
      width: 140,
      render: (category) => getCategoryTag(category)
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (amount) => (
        <Text strong style={{ color: '#52c41a' }}>+${amount.toFixed(2)}</Text>
      ),
      sorter: (a, b) => a.amount - b.amount
    },
    {
      title: 'Payment Method',
      dataIndex: 'paymentMethod',
      key: 'paymentMethod',
      width: 140,
      render: (method) => (
        <Tag>{paymentMethods.find(m => m.value === method)?.label || method}</Tag>
      )
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button
            type="text"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Income"
            description="Are you sure you want to delete this income?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
          >
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={2} style={{ margin: 0 }}>
          <DollarOutlined style={{ marginRight: 12, color: '#52c41a' }} />
          Income Management
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
          Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Total Income"
                value={summary.totalIncome || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} md={6}>
            <Card>
              <Statistic
                title="Sales Income"
                value={summary.salesIncome?.total || 0}
                precision={2}
                prefix="$"
                valueStyle={{ color: '#1890ff' }}
                suffix={<Text type="secondary" style={{ fontSize: 14 }}>({summary.salesIncome?.count || 0} orders)</Text>}
              />
            </Card>
          </Col>
          {summary.byCategory?.slice(0, 2).map((cat) => (
            <Col xs={24} sm={12} md={6} key={cat._id}>
              <Card>
                <Statistic
                  title={cat._id?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  value={cat.total || 0}
                  precision={2}
                  prefix="$"
                  suffix={<Text type="secondary" style={{ fontSize: 14 }}>({cat.count})</Text>}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* Filters */}
      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col xs={24} sm={24} md={10}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">Date Range</Text>
              <RangePicker
                value={dateRange}
                onChange={(dates) => setDateRange(dates || [null, null])}
                style={{ width: '100%' }}
                format="YYYY-MM-DD"
              />
            </Space>
          </Col>
          <Col xs={24} sm={12} md={8}>
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Text type="secondary">Category</Text>
              <Select
                value={filterCategory}
                onChange={setFilterCategory}
                style={{ width: '100%' }}
                placeholder="All Categories"
                allowClear
              >
                {incomeCategories.map(cat => (
                  <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                ))}
              </Select>
            </Space>
          </Col>
          <Col xs={24} sm={12} md={6} style={{ display: 'flex', alignItems: 'flex-end' }}>
            <Button icon={<ClearOutlined />} onClick={clearFilters} style={{ marginTop: 22 }}>
              Clear Filters
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Incomes Table */}
      <Card>
        <Table
          dataSource={incomes}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total ${total} incomes` }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingIncome ? 'Edit Income' : 'Add Income'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            category: 'other',
            paymentMethod: 'cash',
            date: dayjs()
          }}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter title' }]}
          >
            <Input placeholder="e.g., Product Sale, Investment Return" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="category"
                label="Category"
                rules={[{ required: true, message: 'Please select category' }]}
              >
                <Select>
                  {incomeCategories.map(cat => (
                    <Option key={cat.value} value={cat.value}>{cat.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="amount"
                label="Amount"
                rules={[{ required: true, message: 'Please enter amount' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  min={0}
                  precision={2}
                  prefix={<DollarOutlined />}
                  placeholder="0.00"
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="paymentMethod" label="Payment Method">
                <Select>
                  {paymentMethods.map(method => (
                    <Option key={method.value} value={method.value}>{method.label}</Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="date"
                label="Date"
                rules={[{ required: true, message: 'Please select date' }]}
              >
                <DatePicker style={{ width: '100%' }} format="YYYY-MM-DD" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Additional details..." />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingIncome ? 'Update' : 'Create'} Income
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Incomes;
