// File: Airstorm-GFS/frontend/src/contexts/UserContext.js
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback, // Import useCallback
} from 'react';
import { useUser } from '@clerk/clerk-react';
import axios from 'axios';

// Create context
const UserContext = createContext();

/**
 * UserProvider component that centralizes user data management
 * Fetches user profile data once and provides it to all components
 */
export function UserProvider({ children }) {
  const { isLoaded: clerkLoaded, user } = useUser();
  const [userProfile, setUserProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true); // General loading for context init
  const [isLocationLoading, setIsLocationLoading] = useState(true); // Specific loading for locations
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [alertCount, setAlertCount] = useState(0);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]); // <-- New state for all locations
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

  // Fetch alert count (depends on favorites)
  const fetchAlertCount = useCallback(async (currentFavorites) => { // Pass favorites directly
    if (!user || !user.id || !currentFavorites || currentFavorites.length === 0) {
      setAlertCount(0);
      return;
    }
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/external/alerts?userId=${user.id}`
      );
      const favoriteAlerts = response.data.alerts.filter((alert) =>
        currentFavorites.some( // Use passed favorites
          (loc) =>
            loc.latitude === alert.latitude &&
            loc.longitude === alert.longitude
        )
      );
      setAlertCount(favoriteAlerts.length);
      window.dispatchEvent(new CustomEvent('alertCountUpdated', {
        detail: favoriteAlerts.length
      }));
    } catch (error) {
      console.error('Error fetching alerts:', error);
      setAlertCount(0); // Reset count on error
    }
  }, [user, REACT_APP_API_URL]); // Removed favoriteLocations dependency

  // Fetch ALL user locations and update alerts
  const fetchUserLocationsData = useCallback(async () => { // Renamed and expanded
    if (!user || !user.id) return;
    setIsLocationLoading(true); // Start location loading
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      const allLocations = response.data || [];
      const currentFavorites = allLocations.filter(location => location.isFavorite);

      setSavedLocations(allLocations); // <-- Set all locations
      setFavoriteLocations(currentFavorites); // <-- Set favorites

      // Fetch alert count based on the *just fetched* favorites
      await fetchAlertCount(currentFavorites);

    } catch (error) {
      console.error('Error fetching user locations:', error);
      setSavedLocations([]); // Reset on error
      setFavoriteLocations([]);
      setAlertCount(0);
      setError(error); // Optionally set context error
    } finally {
      setIsLocationLoading(false); // Finish location loading
    }
  }, [user, REACT_APP_API_URL, fetchAlertCount]); // Depends on user, url, fetchAlertCount

  // Initialize basic user profile and fetch locations
  useEffect(() => {
    if (!clerkLoaded || !user || initialized) return;

    const initializeUserData = async () => {
      setIsLoading(true); // Start general loading
      setError(null);
      try {
        // --- Fetch/Sync basic user profile (same as before) ---
        let currentRole = 'User';
        try {
          const profileResponse = await axios.get(`${REACT_APP_API_URL}/api/user-profile`, {
            params: { userId: user.id }
          });
          if (profileResponse.data && profileResponse.data.role) {
            currentRole = profileResponse.data.role;
            setUserProfile({ ...profileResponse.data, userId: user.id });
          }
        } catch (profileError) {
          console.warn('Could not fetch existing user profile:', profileError);
        }
        const userData = {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.primaryEmailAddress?.emailAddress,
            role: currentRole
        };
        await axios.post(`${REACT_APP_API_URL}/api/save-user`, userData);
        await axios.post(`${REACT_APP_API_URL}/api/chat/users/create`, {
            user_id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
        });
        setUserProfile(prev => ({
          ...(prev || {}), // Keep existing profile data if fetched
          userId: user.id,
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.primaryEmailAddress?.emailAddress,
          role: currentRole // Ensure role is set
        }));
        // --- End of profile fetch/sync ---

        // Fetch locations (which also fetches alert count)
        await fetchUserLocationsData(); // <-- Call the combined function

        setInitialized(true);
      } catch (err) {
        console.error('Error initializing user data:', err);
        setError(err);
      } finally {
        setIsLoading(false); // Finish general loading
      }
    };

    initializeUserData();
  }, [
      clerkLoaded,
      user,
      initialized,
      REACT_APP_API_URL,
      fetchUserLocationsData // <-- Use the location fetcher dependency
  ]);

  /**
   * Update user profile data
   * (No changes needed here)
   */
  const updateUserProfile = async (updatedData) => {
    try {
        setIsLoading(true);
        const dataToSave = {
          ...userProfile,
          ...updatedData,
          userId: user.id
        };
        await axios.post(`${REACT_APP_API_URL}/api/save-user`, dataToSave);
        setUserProfile(dataToSave);
        return { success: true };
      } catch (err) {
        console.error('Error updating user profile:', err);
        setError(err);
        return { success: false, error: err };
      } finally {
        setIsLoading(false);
      }
  };

  /**
   * Refresh alert count AND locations
   * Used when a location is added, removed, or favorite status changes
   */
  const refreshAlerts = async () => {
    // fetchUserLocationsData now handles fetching locations AND updating alerts
    await fetchUserLocationsData();
  };

  // The context value that will be provided
  const contextValue = {
    userProfile,
    isLoading, // General context loading
    isLocationLoading, // Specific location loading
    error,
    updateUserProfile,
    alertCount,
    savedLocations, // <-- Expose all saved locations
    favoriteLocations, // Keep exposing favorites if needed elsewhere
    refreshAlerts // This now refreshes locations too
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

/**
 * Custom hook to use the user context
 * (No changes needed here)
 */
export function useUserProfile() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
}