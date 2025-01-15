import Dashboard from '../pages/Dashboard/Dashboard';
import Maps from '../pages/Maps/Maps';
import Weather from '../pages/Unused/Weather/Weather';
import MeteogramPbp from '../components/specific/MeteogramPbp/MeteogramPbp';
import SkewTPbp from '../components/specific/SkewTPbp/SkewTPbp';

/**
 * Application route configuration
 * Contains all route definitions and their associated metadata
 */
export const ROUTES = {
  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    element: Dashboard,
  },
  meteogramPbp: {
    path: '/meteogram-pbp',
    title: 'Meteogram PBP',
    element: MeteogramPbp,
  },
  skewTPbp: {
    path: '/skewt-pbp',
    title: 'SkewT PBP',
    element: SkewTPbp,
  },
  weather: {
    path: '/weather',
    title: 'Weather',
    element: Weather,
  },
  maps: {
    path: '/maps',
    title: 'Maps',
    element: Maps,
  },
  forecasts: {
    path: '/forecasts',
    title: 'Forecasts',
    element: Weather,
  },
  alerts: {
    path: '/alerts',
    title: 'Alerts',
    element: Weather,
  },
  analysis: {
    path: '/analysis',
    title: 'Analysis',
    element: Weather,
  },
  settings: {
    path: '/settings',
    title: 'Settings',
    element: Weather,
  },
  logs: {
    path: '/logs',
    title: 'Logs',
    element: Weather,
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
