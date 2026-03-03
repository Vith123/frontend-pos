import React from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { UserOutlined, LockOutlined, LoginOutlined, GlobalOutlined } from '@ant-design/icons';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const { Title, Text } = Typography;

const Login = () => {
  const [form] = Form.useForm();
  const { user, login } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = React.useState(false);

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      await login(values.email, values.password);
      message.success(t('messages.success'));
      navigate('/');
    } catch (error) {
      message.error(error.response?.data?.message || t('auth.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      position: 'relative'
    }}>
      {/* Language Toggle Button */}
      <Button
        icon={<GlobalOutlined />}
        onClick={toggleLanguage}
        style={{
          position: 'absolute',
          top: 20,
          right: 20,
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          color: '#fff'
        }}
      >
        {language === 'en' ? 'ខ្មែរ' : 'EN'}
      </Button>

      <Card 
        style={{ 
          width: 400, 
          boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
          borderRadius: 12
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 15px'
          }}>
            <LoginOutlined style={{ fontSize: 30, color: '#fff' }} />
          </div>
          <Title level={3} style={{ marginBottom: 5 }}>Dyna POS</Title>
          <Text type="secondary">{t('auth.signInToAccount')}</Text>
        </div>

        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: t('validation.required') },
              { type: 'email', message: t('validation.invalidEmail') }
            ]}
          >
            <Input
              prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('auth.email')}
              size="large"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: t('validation.required') }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: '#bfbfbf' }} />}
              placeholder={t('auth.password')}
              size="large"
            />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
              size="large"
              icon={<LoginOutlined />}
              style={{ 
                height: 45,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                border: 'none'
              }}
            >
              {loading ? `${t('common.loading')}` : t('auth.signIn')}
            </Button>
          </Form.Item>
        </Form>

        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            Demo: admin@pos.com / admin123
          </Text>
        </div>
      </Card>
    </div>
  );
};

export default Login;
