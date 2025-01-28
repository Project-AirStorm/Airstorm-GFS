import Dashboard from '../pages/Dashboard/Dashboard';
import Forecasts from '../pages/Forecasts/Forecasts';
import Maps from '../pages/Maps/Maps';
import Alerts from '../pages/Alerts/Alerts';
import Analysis from '../pages/Analysis/Analysis';
import Logs from '../pages/Logs/Logs';
import Settings from '../pages/Settings/Settings';
import Login from '../pages/Login/Login';
import Weather from '../pages/Unused/Weather/Weather.js';

/**
 * Application route configuration
 * Contains all route definitions and their associated metadata
 */
export const ROUTES = {
  Login: {
    path: '/login',
    title: 'Login',
    element: Login,
  },
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    element: Dashboard,
  },
  maps: {
    path: '/maps',
    title: 'Maps',
    element: Weather,
  },
  forecasts: {
    path: '/forecasts',
    title: 'Forecasts',
    element: Forecasts,
  },
  alerts: {
    path: '/alerts',
    title: 'Alerts',
    element: Alerts,
  },
  analysis: {
    path: '/analysis',
    title: 'Analysis',
    element: Analysis,
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    element: Settings,
  },
  logs: {
    path: '/logs',
    title: 'Logs',
    element: Logs,
  },
};

/**
 * Get page title from current path
 * @param {string} pathname - Current location pathname
 * @returns {string} Page title
 */
export const getPageTitle = (pathname) => {
  const route = Object.values(ROUTES).find((route) => route.path === pathname);
  return route?.title || 'Dashboard';
};
