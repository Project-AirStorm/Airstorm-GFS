import Dashboard from '../pages/Dashboard/Dashboard';
import Forecasts from '../pages/Forecasts/Forecasts';
import Maps from '../pages/Maps/Maps';
import Weather from '../pages/Unused/Weather/Weather';
import MeteogramPbp from '../components/specific/MeteogramPbp/MeteogramPbp';
import SkewTPbp from '../components/specific/SkewTPbp/SkewTPbp';
import Login from '../pages/Login/Login'
/**
 * Application route configuration
 * Contains all route definitions and their associated metadata
 */
export const ROUTES = {
  Login:{
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
  feedback: {
    path: '/feedback',
    title: 'Feedback',
    element: Feedback,
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
