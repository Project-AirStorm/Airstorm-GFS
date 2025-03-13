import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserButton } from '@clerk/clerk-react';
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
  LogOut,
  MessageCircle,
  FileSearch2,
  AreaChart,
  Aperture,
} from 'lucide-react';
import profilePic from '../../../assets/sample-profile-pic.jpeg';
import afgscLogo from '../../../assets/afgsc-logo.png';
import './Sidebar.css';
import { useClerk } from '@clerk/clerk-react';
import { UserSession } from '../../../utils/UserSession';

/**
 * NavItem component for sidebar navigation
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.icon - Icon component to display
 * @param {string} props.label - Navigation item label
 * @param {string} props.badge - Optional badge text
 * @param {boolean} props.isActive - Whether the item is currently active
 * @param {Function} props.onClick - Click handler
 */
const NavItem = ({ icon, label, badge, isActive, onClick }) => (
  <div className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
    <div className="flex items-center gap-3">
      {icon}
      <span className="text-sm font-semibold">{label}</span>
    </div>
    {badge && (
      <span className="px-2 py-1 bg-red-500 text-white text-xs rounded">
        {badge}
      </span>
    )}
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
 * Sidebar component for application navigation
 */
const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signOut } = useClerk();  // Add this line to get signOut function
  const { user } = UserSession();

  // Update the logout handler
  const handleLogout = async () => {
    try {
      await signOut(); // Clerk will handle clearing authentication state
      navigate('/login', { replace: true }); // Use replace to prevent going back
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // Remove logout from navItems array (keep only main navigation items)
  const navItems = [
    {
      icon: <Grid className="w-4 h-4" />,
      label: 'Dashboard',
      page: '/dashboard',
    },
    { icon: <Map className="w-4 h-4" />, label: 'Maps', page: '/maps' },
    {
      icon: <BarChart2 className="w-4 h-4" />,
      label: 'Forecasts',
      page: '/forecasts',
    },
    {
      icon: <Bell className="w-4 h-4" />,
      label: 'Alerts',
      page: '/alerts',
      badge: '4',
    },
    {
      icon: <AreaChart className="w-4 h-4" />,
      label: 'Analysis',
      page: '/analysis',
    },
    {
      icon: <Aperture className="w-4 h-4" />,
      label: 'Charts',
      page: '/charts',
    },
    
    {
      icon: <MessageCircle className="w-4 h-4" />,
      label: 'Chat',
      page: '/chat',
    },
    {
      icon: <FileSearch2 className="w-4 h-4" />,
      label: 'Resources',
      page: '/resources',
    },
    {
      icon: <Settings className="w-4 h-4" />,
      label: 'Settings',
      page: '/settings',
    },
    { icon: <FileText className="w-4 h-4" />, label: 'Logs', page: '/logs' },
    {
      icon: <Sticker className="w-4 h-4" />,
      label: 'Feedback',
      page: '/feedback',
    },
  ];

  // Modify the return statement to add the logout button at the bottom
  return (
    <div className="sidebar flex flex-col h-full">
      {/* Header */}
      <div className="header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src={afgscLogo}
              alt="AFGSC Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="text-lg font-bold text-gray-800">Airstorm</h1>
              <p className="text-xs text-gray-500">Admin Panel</p>
            </div>
          </div>
          <Menu className="w-5 h-5 text-gray-500" />
        </div>
      </div>

      {/* User Profile */}
      <div className="profile-section">
        <div className="profile-card">
          {/* Clerk-specific user icon */}
          <UserButton />
          <div>
            <p className="text-sm font-semibold text-gray-800">
              {
               // Uppercases the first letter of the each name
               user.firstName.charAt(0).toUpperCase() + user.firstName.slice(1) + " " +
               user.lastName.charAt(0).toUpperCase() + user.lastName.slice(1)
              }
            </p>
            <p className="text-xs text-gray-500">Flight Chief</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="nav-section flex-grow">
        <p className="text-sm text-gray-500 mb-4">Main Menu</p>
        <div className="space-y-2">
          {navItems.map((item) => (
            <NavItem
              key={item.label}
              icon={item.icon}
              label={item.label}
              badge={item.badge}
              isActive={location.pathname === item.page}
              onClick={() => navigate(item.page)}
            />
          ))}
        </div>
      </nav>

      {/* Logout Section */}
      <div className="mt-auto border-t border-gray-200 py-4 px-4">
        <div className="space-y-2">
          <NavItem
            icon={<LogOut className="w-4 h-4" />}
            label="Logout"
            isActive={false}
            onClick={handleLogout}
          />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;