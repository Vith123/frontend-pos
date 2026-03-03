import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  FiHome, 
  FiShoppingCart, 
  FiPackage, 
  FiGrid, 
  FiFileText, 
  FiUsers, 
  FiUserCheck,
  FiBarChart2,
  FiLogOut,
  FiTrendingDown,
  FiTrendingUp,
  FiGlobe,
  FiSun,
  FiMoon
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();

  const menuItems = [
    { path: '/', icon: <FiHome />, labelKey: 'menu.dashboard' },
    { path: '/pos', icon: <FiShoppingCart />, labelKey: 'menu.pos' },
    { path: '/products', icon: <FiPackage />, labelKey: 'menu.products' },
    { path: '/categories', icon: <FiGrid />, labelKey: 'menu.categories' },
    { path: '/orders', icon: <FiFileText />, labelKey: 'menu.orders' },
    { path: '/customers', icon: <FiUserCheck />, label: 'Customers' },
    { path: '/incomes', icon: <FiTrendingUp />, labelKey: 'menu.incomes' },
    { path: '/expenses', icon: <FiTrendingDown />, labelKey: 'menu.expenses' },
    { path: '/reports', icon: <FiBarChart2 />, labelKey: 'menu.reports' },
  ];

  // Add Users menu for admin only
  if (user?.role === 'admin') {
    menuItems.push({ path: '/users', icon: <FiUsers />, labelKey: 'menu.users' });
  }

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Dyna POS</h2>
          <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user?.name}</p>
          <button 
            onClick={toggleLanguage}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem'
            }}
          >
            <FiGlobe />
            {language === 'en' ? 'ខ្មែរ' : 'EN'}
          </button>
          <button 
            onClick={toggleTheme}
            style={{
              marginTop: '8px',
              padding: '4px 12px',
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '4px',
              color: '#fff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.75rem'
            }}
          >
            {isDark ? <FiSun /> : <FiMoon />}
            {isDark ? 'Light' : 'Dark'}
          </button>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                end={item.path === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
              >
                {item.icon}
                <span>{item.labelKey ? t(item.labelKey) : item.label}</span>
              </NavLink>
            </li>
          ))}
          <li>
            <a href="#logout" onClick={(e) => { e.preventDefault(); logout(); }}>
              <FiLogOut />
              <span>{t('auth.logout')}</span>
            </a>
          </li>
        </ul>
      </aside>
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
