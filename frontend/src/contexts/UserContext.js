// File: Airstorm-GFS/frontend/src/contexts/UserContext.js
// Modified for parallel initialization and improved loading state management

import React, {
  createContext,
  useState,
  useContext,
  useEffect,
  useCallback,
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
  const [isLoading, setIsLoading] = useState(true); // General loading for context init (profile/sync)
  const [isLocationLoading, setIsLocationLoading] = useState(false); // Specific loading for locations (starts false)
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false); // Tracks if *all* initialization steps are done
  const [alertCount, setAlertCount] = useState(0);
  const [favoriteLocations, setFavoriteLocations] = useState([]);
  const [savedLocations, setSavedLocations] = useState([]);
  const REACT_APP_API_URL = process.env.REACT_APP_API_URL;

  // Fetch alert count (depends on favorites) - No change needed
  const fetchAlertCount = useCallback(async (currentFavorites) => {
    if (!user || !user.id || !currentFavorites || currentFavorites.length === 0) {
      setAlertCount(0);
      return;
    }
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/external/alerts?userId=${user.id}`
      );
      const favoriteAlerts = response.data.alerts.filter((alert) =>
        currentFavorites.some(
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
  }, [user, REACT_APP_API_URL]);

  // Fetch ALL user locations and update alerts - No change needed in function itself
  // It now sets isLocationLoading internally.
  const fetchUserLocationsData = useCallback(async () => {
    if (!user || !user.id) return;
    setIsLocationLoading(true); // Start location loading *here*
    setError(null); // Clear previous location-specific errors
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/locations?userId=${user.id}`
      );
      const allLocations = response.data || [];
      const currentFavorites = allLocations.filter(location => location.isFavorite);

      setSavedLocations(allLocations);
      setFavoriteLocations(currentFavorites);

      // Fetch alert count based on the *just fetched* favorites
      await fetchAlertCount(currentFavorites);

    } catch (error) {
      console.error('Error fetching user locations:', error);
      setSavedLocations([]);
      setFavoriteLocations([]);
      setAlertCount(0);
      setError(error); // Set context error for location fetch failure
    } finally {
      setIsLocationLoading(false); // Finish location loading
    }
  }, [user, REACT_APP_API_URL, fetchAlertCount]);

  // Initialize user profile/sync first, then fetch locations
  useEffect(() => {
    // Only run once when clerk is loaded and user exists
    if (!clerkLoaded || !user || initialized) return;

    const initializeUserData = async () => {
      setIsLoading(true); // Start general loading for profile/sync
      setError(null);
      let profileData = null;
      let currentRole = 'User'; // Default role

      try {
        // --- Step 1: Fetch existing user profile (if any) ---
        try {
          const profileResponse = await axios.get(`${REACT_APP_API_URL}/api/user-profile`, {
            params: { userId: user.id }
          });
          if (profileResponse.data) {
            profileData = profileResponse.data;
            currentRole = profileResponse.data.role || currentRole; // Use fetched role if available
            console.log("Existing profile fetched:", profileData);
          }
        } catch (profileError) {
            // Non-blocking: Log warning if profile fetch fails (e.g., 404 for new user)
            console.warn('Could not fetch existing user profile (might be a new user):', profileError.message);
        }

        // Prepare user data for sync/create operations
        const userDataForSync = {
            userId: user.id,
            username: user.username,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.primaryEmailAddress?.emailAddress,
            role: currentRole // Use determined role
        };

        const userDataForChat = {
            user_id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
        };

        // --- Step 2: Perform non-dependent sync operations in parallel ---
        console.log("Starting parallel sync operations...");
        await Promise.all([
            axios.post(`${REACT_APP_API_URL}/api/save-user`, userDataForSync),
            axios.post(`${REACT_APP_API_URL}/api/chat/users/create`, userDataForChat)
        ]);
        console.log("Parallel sync operations completed.");

        // --- Step 3: Update local userProfile state & Finish initial loading ---
        setUserProfile({
          ...(profileData || {}), // Use fetched profile data if available
          ...userDataForSync // Ensure latest Clerk data overrides/updates
        });

        setIsLoading(false); // <<< === SET GENERAL LOADING FALSE HERE ===
                             // UI depending on profile/isLoading can now render

        // --- Step 4: Fetch location data in the background ---
        // This now runs *after* initial profile sync is done and isLoading is false.
        // fetchUserLocationsData handles its own isLocationLoading state.
        console.log("Fetching locations data in background...");
        await fetchUserLocationsData();
        console.log("Locations data fetch complete.");

        setInitialized(true); // Mark full initialization complete

      } catch (err) {
        // Catch errors from profile fetch (if critical) or parallel sync
        console.error('Error during initial user data sync:', err);
        setError(err);
        setIsLoading(false); // Ensure loading stops even on error
        // Consider if initialization should be marked true or false on error
        // setInitialized(true); // Or keep false if error prevents further operation
      }
      // `finally` block removed as loading/initialized state is handled within try/catch
    };

    initializeUserData();

    // Cleanup function (optional)
    // return () => { /* any cleanup needed on component unmount */ };

  }, [
      clerkLoaded,
      user,
      initialized, // Prevent re-running if already initialized
      REACT_APP_API_URL,
      fetchUserLocationsData // Dependency needed for Step 4
      // Note: `fetchAlertCount` is implicitly included via `fetchUserLocationsData`
  ]);

  // --- updateUserProfile and refreshAlerts remain the same ---

  const updateUserProfile = async (updatedData) => {
    // ... (keep existing implementation)
    try {
        setIsLoading(true); // Consider if this global loading is needed or just specific feedback
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

  const refreshAlerts = async () => {
    // fetchUserLocationsData now handles fetching locations AND updating alerts
    // It will set isLocationLoading appropriately.
    await fetchUserLocationsData();
  };


  // The context value that will be provided
  const contextValue = {
    userProfile,
    isLoading, // Reflects initial profile/sync loading
    isLocationLoading, // Reflects location/alert loading
    error,
    updateUserProfile,
    alertCount,
    savedLocations,
    favoriteLocations,
    refreshAlerts // This now refreshes locations & alerts, using isLocationLoading
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
}

// --- useUserProfile hook remains the same ---
export function useUserProfile() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserProfile must be used within a UserProvider');
  }
  return context;
}