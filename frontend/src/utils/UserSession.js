import { useUser } from '@clerk/clerk-react';
import { useEffect, useState } from 'react';

/**
 * Custom hook for syncing the current user's session data to your backend.
 *
 * This hook retrieves the user's profile data from Clerk, then sends it to your
 * API endpoint (e.g., /api/user-session) to be saved in your database.
 *
 * It returns the current loading state, the user object, and a flag indicating
 * whether the user data has been successfully synced.
 */
export function UserSession() {
  const { isLoaded, user } = useUser();
  const [isSynced, setIsSynced] = useState(false);

  useEffect(() => {
    // Only attempt syncing if user data is loaded and available,
    // and we haven't synced already.
    if (isLoaded && user && !isSynced) {
      // Prepare the data you want to save.
      const userData = {
        userId: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.primaryEmailAddress?.emailAddress,
      };

      // // Send the data to your backend API to save/update the user's record.
      // fetch('/api/user-session', {
      //   method: 'POST',
      //   headers: {
      //     'Content-Type': 'application/json',
      //   },
      //   body: JSON.stringify(userData),
      // })
      //   .then((response) => {
      //     if (!response.ok) {
      //       throw new Error('Failed to sync user session');
      //     }
      //     return response.json();
      //   })
      //   .then((data) => {
      //     console.log('User session synced successfully:', data);
      //     setIsSynced(true);
      //   })
      //   .catch((error) => {
      //     console.error('Error syncing user session:', error);
      //   });
    }
  }, [isLoaded, user, isSynced]);

  return { isLoaded, user, isSynced };
}
