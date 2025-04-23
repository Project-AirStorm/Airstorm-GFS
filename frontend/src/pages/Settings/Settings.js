// src/pages/Settings/Settings.js
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserContext';
import { useUser } from '@clerk/clerk-react';
import './Settings.css';
import settingsBanner from '../../assets/settings-banner.jpg';
import Loader from '../../components/common/loader';

// Import the new ProfileImageUploader component
import ProfileImageUploader from './components/ProfileImageUploader/ProfileImageUploader';

// Import section components
import ProfileSection from './components/ProfileSection/ProfileSection';
import AccountSection from './components/AccountSection/AccountSection';
import PasswordSection from './components/PasswordSection/PasswordSection';
import TeamSection from './components/TeamSection/TeamSection';
import LoginSecuritySection from './components/LoginSecuritySection/LoginSecuritySection';
import NotificationsSection from './components/NotificationsSection/NotificationsSection';
import PreferencesSection from './components/PreferencesSection/PreferencesSection';
import FeedbackMessage from './components/common/FeedbackMessage/FeedbackMessage';

/**
 * Settings page component that acts as a container for all settings sections
 * @returns {JSX.Element} Settings component
 */
const Settings = () => {
  const { userProfile, isLoading: contextLoading } = useUserProfile();
  const { user } = useUser();
  
  // Active tab state
  const [activeTab, setActiveTab] = useState('profile');
  
  // Banner image state
  const [bannerImage, setBannerImage] = useState(user?.publicMetadata?.bannerImage || settingsBanner);
  
  // Feedback message state
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  const feedbackTimerRef = useRef(null);
  
  // Update banner image when user's metadata changes
  useEffect(() => {
    if (user?.publicMetadata?.bannerImage) {
      setBannerImage(user.publicMetadata.bannerImage);
    }
  }, [user]);
  
  /**
   * Set a feedback message with auto-dismiss
   * @param {string} type - Message type ('success' or 'error')
   * @param {string} message - Message content
   * @param {number} timeout - Time in ms before message dismisses (default: 5000ms)
   */
  const showFeedback = useCallback((type, message, timeout = 5000) => {
    setFeedback({ type, message });
    
    // Clear any existing timer
    if (feedbackTimerRef.current) {
      clearTimeout(feedbackTimerRef.current);
    }
    
    // Set new timer to clear message
    feedbackTimerRef.current = setTimeout(() => {
      setFeedback({ type: '', message: '' });
    }, timeout);
  }, []);
  
  // Clear timer on unmount
  useEffect(() => {
    return () => {
      if (feedbackTimerRef.current) {
        clearTimeout(feedbackTimerRef.current);
      }
    };
  }, []);

  // Show loading state if context is still loading
  if (contextLoading) {
    return <Loader size="medium" />;
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="settings-container">
          {/* Banner image - displayed for all tabs */}
          <div className="settings-banner">
            <img 
              className="banner-image" 
              src={bannerImage} 
              alt="Profile banner" 
            />
            {/* Banner upload button is commented out */}
          </div>
          
          {/* Profile image section - using the new component */}
          <ProfileImageUploader 
            user={user} 
            showFeedback={showFeedback} 
          />

          {/* Settings tabs */}
          <div className="settings-tabs">
            <button 
              className={`settings-tab ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </button>
            <button 
              className={`settings-tab ${activeTab === 'account' ? 'active' : ''}`}
              onClick={() => setActiveTab('account')}
            >
              Account
            </button>
            <button 
              className={`settings-tab ${activeTab === 'password' ? 'active' : ''}`}
              onClick={() => setActiveTab('password')}
            >
              Password
            </button>
            <button 
              className={`settings-tab ${activeTab === 'team' ? 'active' : ''}`}
              onClick={() => setActiveTab('team')}
            >
              Team
            </button>
            <button 
              className={`settings-tab ${activeTab === 'loginSecurity' ? 'active' : ''}`}
              onClick={() => setActiveTab('loginSecurity')}
            >
              Login & Security
            </button>
            <button 
              className={`settings-tab ${activeTab === 'notifications' ? 'active' : ''}`}
              onClick={() => setActiveTab('notifications')}
            >
              Notifications
            </button>
            <button 
              className={`settings-tab ${activeTab === 'preferences' ? 'active' : ''}`}
              onClick={() => setActiveTab('preferences')}
            >
              Preferences
            </button>
          </div>

          {/* Feedback message */}
          {feedback.message && (
            <FeedbackMessage 
              type={feedback.type} 
              message={feedback.message} 
            />
          )}

          {/* Render active section based on tab */}
          {activeTab === 'profile' && (
            <ProfileSection 
              user={user} 
              userProfile={userProfile} 
              showFeedback={showFeedback} 
            />
          )}
          
          {activeTab === 'account' && (
            <AccountSection 
              user={user} 
              userProfile={userProfile}
              showFeedback={showFeedback} 
            />
          )}
          
          {activeTab === 'password' && (
            <PasswordSection 
              user={user} 
              showFeedback={showFeedback} 
            />
          )}
          
          {activeTab === 'team' && (
            <TeamSection />
          )}
          
          {activeTab === 'loginSecurity' && (
            <LoginSecuritySection 
              user={user} 
              showFeedback={showFeedback} 
            />
          )}
          
          {activeTab === 'notifications' && (
            <NotificationsSection 
              showFeedback={showFeedback} 
            />
          )}
          
          {activeTab === 'preferences' && (
            <PreferencesSection 
              showFeedback={showFeedback} 
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;