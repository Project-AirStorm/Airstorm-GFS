// PrivateRoute.js
import { Navigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';

export default function PrivateRoute({ children }) {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    // Show a spinner, or placeholder, while Clerk loads
    //return <div>Loading...</div>;
  }
  // If the user is not signed in, default to the /login page
  if (!isSignedIn) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
