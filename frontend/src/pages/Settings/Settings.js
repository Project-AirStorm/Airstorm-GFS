import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useUserProfile } from '../../contexts/UserContext';
import { useUser } from '@clerk/clerk-react';
// import { Upload, Camera } from 'lucide-react'; // We'll comment out Upload
import { Camera } from 'lucide-react';
import './Settings.css';
import settingsBanner from '../../assets/settings-banner.jpg';
import Loader from '../../components/common/loader';

// Import ReactCrop for image cropping
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
  
  // State for profile image cropper
  const [showProfileCropper, setShowProfileCropper] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const [profileCrop, setProfileCrop] = useState({ unit: '%', width: 100, aspect: 1 / 1 });
  const [completedProfileCrop, setCompletedProfileCrop] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const profileImgRef = useRef(null);
  const profileCanvasRef = useRef(null);

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
  
  // Handle profile image upload
  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Set the image and show the cropper
        setTempProfileImage(reader.result);
        setShowProfileCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Generate profile image crop preview
  const updateProfilePreview = () => {
    if (!completedProfileCrop || !profileImgRef.current || !profileCanvasRef.current) {
      return;
    }

    const image = profileImgRef.current;
    const canvas = profileCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedProfileCrop.width * pixelRatio;
    canvas.height = completedProfileCrop.height * pixelRatio;
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    const cropX = completedProfileCrop.x * scaleX;
    const cropY = completedProfileCrop.y * scaleY;
    const cropWidth = completedProfileCrop.width * scaleX;
    const cropHeight = completedProfileCrop.height * scaleY;
    
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedProfileCrop.width,
      completedProfileCrop.height
    );
  };
  
  // Save cropped profile image
  const saveProfileImage = async () => {
    if (!completedProfileCrop || !profileCanvasRef.current) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a canvas with the cropped image
      const canvas = profileCanvasRef.current;
      canvas.toBlob(async (blob) => {
        if (!blob) {
          console.error('Failed to create blob from canvas');
          return;
        }
        
        // Convert blob to File object
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        
        // Upload to Clerk
        if (user) {
          await user.setProfileImage({ file });
          setShowProfileCropper(false);
          showFeedback('success', 'Profile image updated successfully.');
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      showFeedback('error', error.message || 'Failed to update profile image.');
    } finally {
      setIsUploading(false);
    }
  };
  
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
            {/* Comment out the banner upload button as requested */}
            {/* <button 
              onClick={() => document.getElementById('banner-upload').click()}
              className="banner-upload-button"
            >
              <Upload size={16} />
              Change Banner
            </button>
            <input
              type="file"
              id="banner-upload"
              style={{ display: 'none' }}
              onChange={handleBannerUpload}
              accept="image/*"
            /> */}
          </div>
          
          {/* Profile image section - always visible */}
          <div className="profile-image-container">
            <div 
              className="profile-image-wrapper"
              onClick={() => document.getElementById('profile-upload').click()}
            >
              {user ? (
                <img 
                  src={user.imageUrl || `/api/placeholder/105/105`} 
                  alt="Profile" 
                  className="profile-image-settings" 
                />
              ) : (
                <div className="profile-image-placeholder">
                  <Camera size={40} />
                </div>
              )}
              <div className="profile-hover-overlay">
                <Camera size={24} />
                <span>Change</span>
              </div>
              <input
                type="file"
                id="profile-upload"
                style={{ display: 'none' }}
                onChange={handleProfileUpload}
                accept="image/*"
              />
            </div>
          </div>

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

      {/* Profile Image Cropper Modal */}
      {showProfileCropper && tempProfileImage && (
        <div className="modal-overlay" onClick={() => setShowProfileCropper(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crop Profile Image</h3>
              <button className="modal-close" onClick={() => setShowProfileCropper(false)}>
                <span aria-hidden="true">&times;</span>
              </button>
            </div>
            <div className="modal-body">
              <div style={{ maxHeight: '300px', overflow: 'hidden', marginBottom: '1rem' }}>
                <ReactCrop
                  crop={profileCrop}
                  onChange={c => setProfileCrop(c)}
                  onComplete={c => setCompletedProfileCrop(c)}
                  aspect={1 / 1}
                  circularCrop
                >
                  <img 
                    ref={profileImgRef}
                    src={tempProfileImage} 
                    alt="Profile preview" 
                    style={{ width: '100%' }}
                    onLoad={e => {
                      profileImgRef.current = e.currentTarget;
                    }}
                  />
                </ReactCrop>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Preview:</p>
                <div style={{ 
                  width: '100px',
                  height: '100px',
                  border: '1px solid #e5e7eb', 
                  borderRadius: '50%', 
                  overflow: 'hidden',
                  margin: '0 auto'
                }}>
                  <canvas
                    ref={profileCanvasRef}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  className="cancel-button" 
                  onClick={() => setShowProfileCropper(false)}
                >
                  Cancel
                </button>
                <div>
                  <button 
                    className="save-button" 
                    style={{ marginRight: '0.5rem' }}
                    onClick={updateProfilePreview}
                  >
                    Preview
                  </button>
                  <button 
                    className="save-button"
                    onClick={saveProfileImage}
                    disabled={isUploading || !completedProfileCrop}
                  >
                    {isUploading ? 'Saving...' : 'Save Profile Image'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;