import React, { useState } from 'react';
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
  FiMoon,
  FiMenu,
  FiX,
  FiLayers
} from 'react-icons/fi';

const Layout = () => {
  const { user, logout } = useAuth();
  const { t, language, toggleLanguage } = useLanguage();
  const { isDark, toggleTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const menuItems = [
    { path: '/', icon: <FiHome />, labelKey: 'menu.dashboard' },
    { path: '/pos', icon: <FiShoppingCart />, labelKey: 'menu.pos' },
    { path: '/products', icon: <FiPackage />, labelKey: 'menu.products' },
    { path: '/categories', icon: <FiGrid />, labelKey: 'menu.categories' },
    { path: '/stock', icon: <FiLayers />, labelKey: 'menu.stock' },
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

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-container">
      {/* Mobile Header */}
      <header className="mobile-header">
        <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>
        <h2>Dyna POS</h2>
        <div className="header-actions">
          <button onClick={toggleLanguage} className="header-btn">
            <FiGlobe />
          </button>
          <button onClick={toggleTheme} className="header-btn">
            {isDark ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </header>

      {/* Overlay for mobile */}
      {sidebarOpen && <div className="sidebar-overlay" onClick={closeSidebar} />}

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-title">
            <h2>Dyna POS</h2>
            <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>{user?.name}</p>
          </div>
          <div className="sidebar-actions">
            <button onClick={toggleLanguage} className="sidebar-btn" title={language === 'en' ? 'ខ្មែរ' : 'English'}>
              <FiGlobe />
              <span>{language === 'en' ? 'ខ្មែរ' : 'EN'}</span>
            </button>
            <button onClick={toggleTheme} className="sidebar-btn" title={isDark ? 'Light Mode' : 'Dark Mode'}>
              {isDark ? <FiSun /> : <FiMoon />}
            </button>
          </div>
        </div>
        <ul className="sidebar-menu">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink 
                to={item.path} 
                end={item.path === '/'}
                className={({ isActive }) => isActive ? 'active' : ''}
                onClick={closeSidebar}
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
