import React, { useState, useEffect } from 'react';
import { 
  Table, Button, Space, Tag, Image, Modal, Form, Input, 
  Upload, Card, Typography, Popconfirm, message 
} from 'antd';
import { 
  PlusOutlined, EditOutlined, DeleteOutlined, UploadOutlined, AppstoreOutlined 
} from '@ant-design/icons';
import api, { getImageUrl } from '../services/api';

const { Title } = Typography;
const { TextArea } = Input;

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [form] = Form.useForm();
  const [imageFile, setImageFile] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data);
    } catch (error) {
      message.error('Error loading categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (values) => {
    const data = new FormData();
    data.append('name', values.name);
    if (values.description) data.append('description', values.description);
    if (imageFile) data.append('image', imageFile);

    try {
      if (editingCategory) {
        await api.put(`/categories/${editingCategory._id}`, data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Category updated successfully');
      } else {
        await api.post('/categories', data, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        message.success('Category created successfully');
      }
      fetchCategories();
      closeModal();
    } catch (error) {
      message.error(error.response?.data?.message || 'Error saving category');
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    form.setFieldsValue({
      name: category.name,
      description: category.description || ''
    });
    setModalVisible(true);
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/categories/${id}`);
      message.success('Category deleted successfully');
      fetchCategories();
    } catch (error) {
      message.error('Error deleting category');
    }
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingCategory(null);
    form.resetFields();
    setImageFile(null);
  };

  const columns = [
    {
      title: 'Image',
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
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name) => (
        <Space>
          <AppstoreOutlined style={{ color: '#1890ff' }} />
          <strong>{name}</strong>
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name)
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      render: (text) => text || '-',
      ellipsis: true
    },
    {
      title: 'Status',
      dataIndex: 'isActive',
      key: 'status',
      render: (isActive) => (
        <Tag color={isActive ? 'success' : 'error'}>
          {isActive ? 'Active' : 'Inactive'}
        </Tag>
      )
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
            icon={<EditOutlined />}
            size="small"
            onClick={() => handleEdit(record)}
          />
          <Popconfirm
            title="Delete Category"
            description="Are you sure you want to delete this category?"
            onConfirm={() => handleDelete(record._id)}
            okText="Yes"
            cancelText="No"
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
        <Title level={3} style={{ margin: 0 }}>Categories</Title>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => setModalVisible(true)}
          size="large"
        >
          Add Category
        </Button>
      </div>

      <Card>
        <Table
          dataSource={categories}
          columns={columns}
          rowKey="_id"
          loading={loading}
          pagination={{ pageSize: 10, showTotal: (total) => `Total ${total} categories` }}
        />
      </Card>

      <Modal
        title={editingCategory ? 'Edit Category' : 'Add Category'}
        open={modalVisible}
        onCancel={closeModal}
        footer={null}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Form.Item
            name="name"
            label="Category Name"
            rules={[{ required: true, message: 'Please enter category name' }]}
          >
            <Input placeholder="Enter category name" />
          </Form.Item>

          <Form.Item name="description" label="Description">
            <TextArea rows={3} placeholder="Enter description" />
          </Form.Item>

          <Form.Item label="Category Image">
            <Upload
              beforeUpload={(file) => {
                setImageFile(file);
                return false;
              }}
              maxCount={1}
              accept="image/*"
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>Select Image</Button>
            </Upload>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button onClick={closeModal}>Cancel</Button>
              <Button type="primary" htmlType="submit">
                {editingCategory ? 'Update' : 'Create'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Categories;
