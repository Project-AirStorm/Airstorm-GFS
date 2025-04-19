import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';
import axios from 'axios';

/**
 * Custom hook for syncing the current user's session data to your backend.
 *
 * This hook retrieves the user's profile data from Clerk, then sends it to your
 * API endpoint (e.g., /api/user-session) to be saved in your database.
 *
 * It also ensures the user exists in StreamChat by calling the /api/chat/users/create endpoint.
 *
 * It returns the current loading state, the user object, and a flag indicating
 * whether the user data has been successfully synced.
 */
export function UserSession() {
  const { isLoaded, user } = useUser();
  const [isSynced, setIsSynced] = useState(false);
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

  useEffect(() => {
    // Only attempt syncing if user data is loaded and available,
    // and we haven't synced already.
    if (isLoaded && user && !isSynced) {
      // First, fetch the existing user profile to get the role
      axios.get(`${REACT_APP_API_URL}/api/user-profile`, {
        params: { userId: user.id }
      })
      .then(roleResponse => {
        // Get the current role from the database
        const currentRole = roleResponse.data && roleResponse.data.role 
          ? roleResponse.data.role 
          : 'Flight Chief'; // Default if not found

        // User application data with role
        const userData = {
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.primaryEmailAddress?.emailAddress,
          role: currentRole // Include the current role
        };

        // Sync user data to your backend
        return axios.post(`${REACT_APP_API_URL}/api/save-user`, userData);
      })
      .then((response) => {
        console.log('User session synced successfully:', response.data);

        // Ensure the user exists in StreamChat
        return axios.post(`${REACT_APP_API_URL}/api/chat/users/create`, {
          user_id: user.id,
          name: `${user.firstName} ${user.lastName}`,
          username: user.username,
        });
      })
      .then((chatResponse) => {
        //console.log('User created in StreamChat:', chatResponse.data);
        setIsSynced(true); // Mark sync as complete
      })
      .catch((error) => {
        console.error(
          'Error syncing user session or creating StreamChat user:',
          error
        );
      });
    }
  }, [isLoaded, user, isSynced, REACT_APP_API_URL]);

  return { isLoaded, user, isSynced };
}