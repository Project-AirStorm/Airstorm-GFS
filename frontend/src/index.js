import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './utils/reportWebVitals';

import { ClerkProvider } from '@clerk/clerk-react';

const root = ReactDOM.createRoot(document.getElementById('root'));

// Pull in the publishable key from your .env
const PUBLISHABLE_KEY = process.env.REACT_APP_VITE_CLERK_PUBLISHABLE_KEY;
if (!PUBLISHABLE_KEY) {
  throw new Error("Missing Clerk Publishable Key");
}
/* After the user signs out, they are redirected 
   back to the /login route */
root.render(
  <React.StrictMode>
    <ClerkProvider
     // Sets global Clerk color theme settings
      appearance={{
        variables: {
          colorPrimary: '#2f60d4',
          colorText: 'black',
        },
      }}
      publishableKey={PUBLISHABLE_KEY}
      afterSignOutUrl="/login">

      <App />
    </ClerkProvider>
  </React.StrictMode>
);

reportWebVitals();
