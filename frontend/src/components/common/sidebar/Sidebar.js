import React, { useState, useEffect } from 'react';
import { UserSession } from '../../../utils/UserSession';
import { useNavigate, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import {
  Settings,
  Menu,
  Map,
  BarChart2,
  Bell,
  FileText,
  Grid,
  Sticker,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import profilePic from '../../../assets/sample-profile-pic.jpeg';
import afgscLogo from '../../../assets/afgsc-logo.png';
import './Sidebar.css';
import axios from 'axios';

// Environment variable for Flask API
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

/**
 * Navigation item component.
 */
const NavItem = ({ icon, label, badge, isActive, onClick }) => (
  <div className={`nav-item${isActive ? ' active' : ''}`} onClick={onClick}>
    <div className="nav-item-left">
      {icon}
    </div>
    {!label ? null : <span className="nav-label">{label}</span>}
    {badge && badge !== '0' && <span className="nav-badge">{badge}</span>}
  </div>
);

NavItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  badge: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func.isRequired,
};

/**
 * Sidebar component.
 */
const Sidebar = ({ isOpen, onClose, isCollapsed, onToggleCollapse }) => {
  const { user } = UserSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [alertCount, setAlertCount] = useState('0');

  useEffect(() => {
    const fetchInitialAlertCount = async () => {
      try {
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/external/alerts?userId=${user.id}`
        );
        const locResponse = await axios.get(
          `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
        );
        const favorites = locResponse.data.filter((loc) => loc.isFavorite);
        const favoriteAlerts = response.data.alerts.filter((alert) =>
          favorites.some(
            (loc) =>
              loc.latitude === alert.latitude &&
              loc.longitude === alert.longitude
          )
        );
        setAlertCount(favoriteAlerts.length.toString());
      } catch (error) {
        console.error('Error fetching alerts:', error);
        setAlertCount('0');
      }
    };

    fetchInitialAlertCount();

    const handleAlertCountUpdate = (event) => {
      setAlertCount(event.detail.toString());
    };

    window.addEventListener('alertCountUpdated', handleAlertCountUpdate);
    return () => {
      window.removeEventListener('alertCountUpdated', handleAlertCountUpdate);
    };
  }, [user.id]);

  const navItems = [
    { icon: <Grid className="nav-icon" />, label: 'Dashboard', page: '/dashboard' },
    { icon: <Map className="nav-icon" />, label: 'Maps', page: '/maps' },
    { icon: <BarChart2 className="nav-icon" />, label: 'Forecasts', page: '/forecasts' },
    { icon: <Bell className="nav-icon" />, label: 'Alerts', page: '/alerts', badge: alertCount },
    { icon: <FileText className="nav-icon" />, label: 'Analysis', page: '/analysis' },
    { icon: <Settings className="nav-icon" />, label: 'Settings', page: '/settings' },
    { icon: <FileText className="nav-icon" />, label: 'Logs', page: '/logs' },
    { icon: <Sticker className="nav-icon" />, label: 'Feedback', page: '/feedback' },
  ];

  return (
    <div className={`sidebar${isCollapsed ? ' collapsed' : ''}${isOpen ? ' open' : ''}`}>
      {/* Fixed top container for header and profile */}
      <div className="sidebar-top">
        {/* Header */}
        <div className="sidebar-header">
          <div className="header-left">
            <img src={afgscLogo} alt="AFGSC Logo" className="logo-image" />
            {!isCollapsed && (
              <div className="app-info">
                <h1 className="app-title">Airstorm GFS</h1>
                <p className="app-subtitle">AFGSC</p>
              </div>
            )}
          </div>
          <button className="collapse-btn" onClick={onToggleCollapse}>
            {isCollapsed ? (
              <ChevronRight className="nav-icon" />
            ) : (
              <ChevronLeft className="nav-icon" />
            )}
          </button>
        </div>
        {/* Profile */}
        <div className="profile-container">
          <img src={profilePic} alt="Profile" className="profile-image" />
          {!isCollapsed && (
            <div className="profile-details">
              <p className="profile-name">Sgt. Tubbs</p>
              <p className="profile-rank">Flight Chief</p>
            </div>
          )}
        </div>
      </div>
      {/* Navigation */}
      <nav className="nav-section">
        {/* {isCollapsed ? (
          <div className="nav-title-placeholder"></div>
        ) : (
          <p className="nav-title">Main Menu</p>
        )} */}
        <div className="nav-items-container">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={isCollapsed ? '' : item.label}
              badge={item.badge}
              isActive={location.pathname === item.page}
              onClick={() => navigate(item.page)}
            />
          ))}
        </div>
      </nav>
    </div>
  );
};

Sidebar.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  isCollapsed: PropTypes.bool,
  onToggleCollapse: PropTypes.func,
};

export default Sidebar;
