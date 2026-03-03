import React, { useState, useEffect, useCallback } from 'react';
import { 
  Table, Button, Input, Select, Space, Tag, Image, Modal, Form, 
  InputNumber, Upload, Card, Typography, Popconfirm, message, Row, Col 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, SearchOutlined, 
  UploadOutlined, BarcodeOutlined, DollarOutlined 
} from '@ant-design/icons';
import api, { getImageUrl } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';

const { Title } = Typography;
const { Option } = Select;
const { TextArea } = Input;

const Products = () => {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        api.get('/products'),
        api.get('/categories')
      ]);
      setProducts(productsRes.data);
      setCategories(categoriesRes.data);
    } catch (error) {
      message.error(t('messages.operationFailed'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (values) => {
    const data = new FormData();
    Object.keys(values).forEach(key => {
      if (values[key] !== undefined && values[key] !== null) {
        data.append(key, values[key]);
      }
    });
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success(t('products.productUpdated'));
      } else {
        await api.post('/products', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success(t('products.productCreated'));
      }
      fetchData();
      closeModal();
    } catch (error) {
      message.error(error.response?.data?.message || t('messages.operationFailed'));
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    form.setFieldsValue({
      name: product.name,
      sku: product.sku,
      description: product.description,
      category: product.category?._id,
      price: product.price,
      costPrice: product.costPrice,
      quantity: product.quantity,
      minStock: product.minStock,
      barcode: product.barcode
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/products/${id}`);
      message.success(t('products.productDeleted'));
      fetchData();
    } catch (error) {
      message.error(t('messages.operationFailed'));
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProduct(null);
    form.resetFields();
    setImageFile(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !filterCategory || product.category?._id === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const columns = [
    {
      title: t('common.image'),
      dataIndex: 'image',
      key: 'image',
      width: 80,
      render: (image, record) => (
        <Image
          src={getImageUrl(image)}
          alt={record.name}
          width={40}
          height={40}
          style={{ objectFit: 'cover', borderRadius: 6 }}
          fallback="https://via.placeholder.com/40"
        />
      )
    },
    {
      title: t('common.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: t('products.sku'),
      dataIndex: 'sku',
      key: 'sku',
      render: (sku) => <Tag icon={<BarcodeOutlined />}>{sku || '-'}</Tag>
    },
    {
      title: t('common.category'),
      dataIndex: ['category', 'name'],
      key: 'category',
      render: (cat) => <Tag color="blue">{cat || '-'}</Tag>
    },
    {
      title: t('common.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price) => (
        <span style={{ color: '#52c41a', fontWeight: 600 }}>
          <DollarOutlined /> {price?.toFixed(2)}
        </span>
      ),
      sorter: (a, b) => a.price - b.price
    },
    {
      title: t('common.quantity'),
      dataIndex: 'quantity',
      key: 'quantity',
      render: (qty, record) => (
        <Tag color={qty <= record.minStock ? 'red' : 'green'}>
          {qty}
        </Tag>
      ),
      sorter: (a, b) => a.quantity - b.quantity
    },
    {
      title: t('common.status'),
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? t('common.active') : t('common.inactive')}
        </Tag>
      )
    },
    {
      title: t('common.actions'),
      key: 'actions',
      width: 120,
      render: (_, record) => (
        <Space>
          <Button 
            type="primary" 
            ghost 
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title={t('products.deleteProduct')}
            description={t('products.deleteConfirm')}
            onConfirm={() => handleDelete(record._id)}
            okText={t('common.yes')}
            cancelText={t('common.no')}
            okButtonProps={{ danger: true }}
          >
            <Button 
              danger 
              icon={<DeleteOutlined />}
              size="small"
            />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Title level={3} style={{ margin: 0 }}>{t('products.title')}</Title>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          size="large"
        >
          {t('products.addProduct')}
        </Button>
      </div>

      <Card>
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder={t('common.search')}
            prefix={<SearchOutlined />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: 250 }}
            allowClear
          />
          <Select
            placeholder={t('products.selectCategory')}
            style={{ width: 200 }}
            value={filterCategory || undefined}
            onChange={setFilterCategory}
            allowClear
          >
            {categories.map(cat => (
              <Option key={cat._id} value={cat._id}>{cat.name}</Option>
            ))}
          </Select>
        </Space>

        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showSizeChanger: true, showTotal: (total) => `${t('common.total')} ${total} ${t('products.title').toLowerCase()}` }}
        />
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        title={editingProduct ? t('products.editProduct') : t('products.addProduct')}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        width={700}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{ minStock: 10 }}
        >
          <Form.Item
            name="name"
            label={t('products.productName')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input placeholder={t('products.enterProductName')} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="sku" label={t('products.sku')}>
                <Input placeholder={t('products.enterSKU')} prefix={<BarcodeOutlined />} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="barcode" label={t('products.barcode')}>
                <Input placeholder={t('products.enterBarcode')} />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="category"
            label={t('common.category')}
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Select placeholder={t('products.selectCategory')}>
              {categories.map(cat => (
                <Option key={cat._id} value={cat._id}>{cat.name}</Option>
              ))}
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="price"
                label={t('products.sellingPrice')}
                rules={[{ required: true, message: t('validation.required') }]}
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
            <Col span={12}>
              <Form.Item name="costPrice" label={t('products.costPrice')}>
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
              <Form.Item
                name="quantity"
                label={t('products.stockQuantity')}
                rules={[{ required: true, message: t('validation.required') }]}
              >
                <InputNumber style={{ width: '100%' }} min={0} placeholder="0" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="minStock" label={t('products.minStock')}>
                <InputNumber style={{ width: '100%' }} min={0} placeholder="10" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="description" label={t('common.description')}>
            <TextArea rows={3} placeholder={t('common.description')} />
          </Form.Item>

          <Form.Item label={t('products.productImage')}>
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              maxCount={1}
              accept="image/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>{t('products.selectImage')}</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>{t('common.cancel')}</Button>
              <Button type="primary" htmlType="submit">
                {editingProduct ? t('products.updateProduct') : t('products.createProduct')}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Products;
