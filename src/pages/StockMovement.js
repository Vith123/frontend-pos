import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Table, Button, Modal, Form, Input, Select, InputNumber, 
  Card, Tag, Space, DatePicker, Row, Col, Typography, message 
} from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;
const { TextArea } = Input;

const StockMovement = () => {
  const { t } = useLanguage();
  const [movements, setMovements] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [movementType, setMovementType] = useState('in');
  const [filters, setFilters] = useState({});
  const [pagination, setPagination] = useState({ current: 1, pageSize: 50, total: 0 });
  const [form] = Form.useForm();
  
  const paginationRef = useRef(pagination);
  paginationRef.current = pagination;

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page: paginationRef.current.current,
        limit: paginationRef.current.pageSize,
        ...filters
      };
      const response = await api.get('/stock', { params });
      setMovements(response.data.movements);
      setPagination(prev => ({ ...prev, total: response.data.total }));
    } catch (error) {
      message.error('Error fetching stock movements');
    }
    setLoading(false);
  }, [filters]);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data.products || response.data);
    } catch (error) {
      message.error('Error fetching products');
    }
  };

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleCreate = async (values) => {
    try {
      await api.post('/stock', {
        productId: values.product,
        type: movementType,
        quantity: values.quantity,
        reason: values.reason,
        note: values.note
      });
      message.success(`Stock ${movementType === 'in' ? 'In' : 'Out'} recorded successfully`);
      setModalVisible(false);
      form.resetFields();
      fetchMovements();
      fetchProducts(); // Refresh product quantities
    } catch (error) {
      message.error(error.response?.data?.message || 'Error recording stock movement');
    }
  };

  const openModal = (type) => {
    setMovementType(type);
    setModalVisible(true);
    form.resetFields();
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const handleDateChange = (dates) => {
    if (dates) {
      setFilters(prev => ({
        ...prev,
        startDate: dates[0].startOf('day').toISOString(),
        endDate: dates[1].endOf('day').toISOString()
      }));
    } else {
      setFilters(prev => {
        const { startDate, endDate, ...rest } = prev;
        return rest;
      });
    }
    setPagination(prev => ({ ...prev, current: 1 }));
  };

  const columns = [
    {
      title: t('stock.date'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date) => dayjs(date).format('DD/MM/YYYY HH:mm'),
      width: 150
    },
    {
      title: t('stock.product'),
      dataIndex: ['product', 'name'],
      key: 'product',
    },
    {
      title: t('stock.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'in' ? 'green' : 'red'} icon={type === 'in' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}>
          {type === 'in' ? t('stock.stockIn') : t('stock.stockOut')}
        </Tag>
      ),
      width: 120
    },
    {
      title: t('stock.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => (
        <Text strong style={{ color: record.type === 'in' ? '#52c41a' : '#f5222d' }}>
          {record.type === 'in' ? '+' : '-'}{qty}
        </Text>
      ),
      width: 100
    },
    {
      title: t('stock.reason'),
      dataIndex: 'reason',
      key: 'reason',
      render: (reason) => {
        const colors = {
          purchase: 'blue',
          return: 'cyan',
          adjustment: 'orange',
          damage: 'red',
          sale: 'purple',
          other: 'default'
        };
        return <Tag color={colors[reason]}>{t(`stock.reasons.${reason}`)}</Tag>;
      },
      width: 120
    },
    {
      title: t('stock.previousQty'),
      dataIndex: 'previousQuantity',
      key: 'previousQuantity',
      width: 100
    },
    {
      title: t('stock.newQty'),
      dataIndex: 'newQuantity',
      key: 'newQuantity',
      width: 100
    },
    {
      title: t('stock.note'),
      dataIndex: 'note',
      key: 'note',
      ellipsis: true
    },
    {
      title: t('stock.createdBy'),
      dataIndex: ['createdBy', 'name'],
      key: 'createdBy',
      width: 120
    }
  ];

  const reasonOptions = movementType === 'in' 
    ? [
        { value: 'purchase', label: t('stock.reasons.purchase') },
        { value: 'return', label: t('stock.reasons.return') },
        { value: 'adjustment', label: t('stock.reasons.adjustment') },
        { value: 'other', label: t('stock.reasons.other') }
      ]
    : [
        { value: 'damage', label: t('stock.reasons.damage') },
        { value: 'adjustment', label: t('stock.reasons.adjustment') },
        { value: 'other', label: t('stock.reasons.other') }
      ];

  return (
    <div className="stock-movement-page">
      <Card>
        <Row justify="space-between" align="middle" style={{ marginBottom: 20 }}>
          <Col>
            <Title level={3} style={{ margin: 0 }}>{t('stock.title')}</Title>
          </Col>
          <Col>
            <Space>
              <Button 
                type="primary" 
                icon={<ArrowUpOutlined />}
                onClick={() => openModal('in')}
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
              >
                {t('stock.stockIn')}
              </Button>
              <Button 
                type="primary" 
                danger
                icon={<ArrowDownOutlined />}
                onClick={() => openModal('out')}
              >
                {t('stock.stockOut')}
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 20 }}>
          <Col xs={24} sm={8} md={6}>
            <Select
              placeholder={t('stock.filterByProduct')}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('product', value)}
              showSearch
              optionFilterProp="children"
            >
              {products.map(p => (
                <Select.Option key={p._id} value={p._id}>{p.name}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={8} md={4}>
            <Select
              placeholder={t('stock.filterByType')}
              allowClear
              style={{ width: '100%' }}
              onChange={(value) => handleFilterChange('type', value)}
            >
              <Select.Option value="in">{t('stock.stockIn')}</Select.Option>
              <Select.Option value="out">{t('stock.stockOut')}</Select.Option>
            </Select>
          </Col>
          <Col xs={24} sm={8} md={6}>
            <RangePicker 
              style={{ width: '100%' }}
              onChange={handleDateChange}
            />
          </Col>
          <Col>
            <Button icon={<ReloadOutlined />} onClick={fetchMovements}>
              {t('common.refresh')}
            </Button>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={movements}
          rowKey="_id"
          loading={loading}
          pagination={{
            ...pagination,
            showSizeChanger: true,
            showTotal: (total) => `${t('common.total')}: ${total}`
          }}
          onChange={(pag) => setPagination(prev => ({ ...prev, current: pag.current, pageSize: pag.pageSize }))}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            {movementType === 'in' ? <ArrowUpOutlined style={{ color: '#52c41a' }} /> : <ArrowDownOutlined style={{ color: '#f5222d' }} />}
            {movementType === 'in' ? t('stock.stockIn') : t('stock.stockOut')}
          </Space>
        }
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreate}
        >
          <Form.Item
            name="product"
            label={t('stock.product')}
            rules={[{ required: true, message: t('stock.selectProduct') }]}
          >
            <Select
              showSearch
              placeholder={t('stock.selectProduct')}
              optionFilterProp="children"
            >
              {products.map(p => (
                <Select.Option key={p._id} value={p._id}>
                  {p.name} ({t('stock.currentStock')}: {p.quantity})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="quantity"
            label={t('stock.quantity')}
            rules={[{ required: true, message: t('stock.enterQuantity') }]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              placeholder={t('stock.enterQuantity')}
            />
          </Form.Item>

          <Form.Item
            name="reason"
            label={t('stock.reason')}
            rules={[{ required: true, message: t('stock.selectReason') }]}
          >
            <Select placeholder={t('stock.selectReason')}>
              {reasonOptions.map(opt => (
                <Select.Option key={opt.value} value={opt.value}>{opt.label}</Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="note"
            label={t('stock.note')}
          >
            <TextArea rows={3} placeholder={t('stock.enterNote')} />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setModalVisible(false)}>{t('common.cancel')}</Button>
              <Button 
                type="primary" 
                htmlType="submit"
                style={movementType === 'in' ? { backgroundColor: '#52c41a', borderColor: '#52c41a' } : {}}
                danger={movementType === 'out'}
              >
                {movementType === 'in' ? t('stock.addStock') : t('stock.removeStock')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StockMovement;
