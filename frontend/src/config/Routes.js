import Dashboard from '../pages/Dashboard/Dashboard';
import Forecasts from '../pages/Forecasts/Forecasts';
import Maps from '../pages/Maps/Maps';
import Login from '../pages/Login/Login';
import Alerts from '../pages/Alerts/Alerts';
import Analysis from '../pages/Analysis/Analysis';
import Settings from '../pages/Settings/Settings';
import Logs from '../pages/Logs/Logs';
import Feedback from '../pages/Feedback/Feedback';
import NotFound from '../pages/NotFound/NotFound';
import Signup from '../pages/Signup/Signup';
import ChatComponent from '../pages/Chat/Chat';
import Resources from '../pages/Resources/Resources';
import Charts from '../pages/Charts/Charts';
// Unused imports for now
// import Maps from '../pages/Maps/Maps';
// import MeteogramPbp from '../components/specific/MeteogramPbp/MeteogramPbp';
// import SkewTPbp from '../components/specific/SkewTPbp/SkewTPbp';

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
  SignUp: {
    path: '/sign-up',
    title: 'Signup',
    element: Signup,
  },

  dashboard: {
    path: '/dashboard',
    title: 'Dashboard',
    element: Dashboard,
  },
  maps: {
    path: '/maps',
    title: 'Maps',
    element: Maps,
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
  charts: {
    path: '/charts',
    title: 'Charts',
    element: Charts,
  },
  chat: {
    path: '/chat',
    title: 'Chat',
    element: ChatComponent,
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
  resources: {
    path: '/resources',
    title: 'Resources',
    element: Resources,
  },
  notfound: {
    path: '/notfound',
    title: 'NotFound',
    element: NotFound,
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