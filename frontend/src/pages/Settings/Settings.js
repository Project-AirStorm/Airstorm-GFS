import React, { useState, useEffect, useRef } from 'react';
import { useUserProfile } from '../../contexts/UserContext';
import { useUser, useClerk } from '@clerk/clerk-react';
import { Upload, User, Save, X, Shield, Lock, Bell, AlertTriangle, Camera, ExternalLink } from 'lucide-react';
import './Settings.css';
import settingsBanner from '../../assets/settings-banner.jpg';
import axios from 'axios';
import ReactCrop from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

/**
 * Settings page component for user profile and app configuration
 * @component
 * @returns {JSX.Element} Settings component
 */
const Settings = () => {
  const { userProfile, updateUserProfile, isLoading: contextLoading } = useUserProfile();
  const { user, isLoaded } = useUser();
  const { signOut, openUserProfile } = useClerk();
  
  // Updated tab name from 'myDetails' to 'profile' as requested
  const [activeTab, setActiveTab] = useState('profile');
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    role: '' 
  });
  
  // State for file uploads
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: '', message: '' });
  
  // State for banner image
  const [bannerImage, setBannerImage] = useState(settingsBanner);
  const [showBannerUpload, setShowBannerUpload] = useState(false);
  const [tempBannerImage, setTempBannerImage] = useState(null);
  
  // State for image cropping
  const [crop, setCrop] = useState({ unit: '%', width: 100, aspect: 3 / 1 });
  const [completedCrop, setCompletedCrop] = useState(null);
  const imgRef = useRef(null);
  const previewCanvasRef = useRef(null);
  
  // State for profile image cropper
  const [showProfileCropper, setShowProfileCropper] = useState(false);
  const [tempProfileImage, setTempProfileImage] = useState(null);
  const [profileCrop, setProfileCrop] = useState({ unit: '%', width: 100, aspect: 1 / 1 });
  const [completedProfileCrop, setCompletedProfileCrop] = useState(null);
  const profileImgRef = useRef(null);
  const profileCanvasRef = useRef(null);

  // Update form data when user data is available
  useEffect(() => {
    if (isLoaded && user && userProfile) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        username: user.username || '',
        role: userProfile.role || '' 
      });
      
      // If user has a bannerImage in metadata, use it
      if (user.publicMetadata?.bannerImage) {
        setBannerImage(user.publicMetadata.bannerImage);
      }
    }
  }, [isLoaded, user, userProfile]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save profile data
  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedback({ type: '', message: '' });
      
      // Save user data to Clerk via API
      if (user && isLoaded) {
        // Update name in Clerk
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        
        // Update email if it has changed
        if (formData.email !== user.primaryEmailAddress?.emailAddress) {
          await user.createEmailAddress({
            email: formData.email,
          });
          // Note: This will send a verification email to the user
        }
        
        // Update the user profile in context (this will also save to backend)
        const result = await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: user.primaryEmailAddress?.emailAddress,
          username: user.username,
          role: formData.role
        });
        
        if (result.success) {
          // Success feedback
          setFeedback({
            type: 'success',
            message: 'Profile updated successfully.'
          });
        } else {
          throw new Error('Failed to update profile');
        }
      }
    } catch (error) {
      // Error feedback
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to update profile. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Reset form to original values
  const handleCancel = () => {
    // Reset form data to original user data
    if (user && userProfile) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.primaryEmailAddress?.emailAddress || '',
        username: user.username || '',
        role: userProfile.role || 'User'
      });
    }
    // Clear any feedback
    setFeedback({ type: '', message: '' });
  };

  // Handle profile image upload
  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempProfileImage(reader.result);
        setShowProfileCropper(true);
      };
      reader.readAsDataURL(file);
    }
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
          setFeedback({
            type: 'success',
            message: 'Profile image updated successfully.'
          });
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to update profile image.'
      });
    } finally {
      setIsUploading(false);
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

  // Handle banner image upload
  const handleBannerUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempBannerImage(reader.result);
        setShowBannerUpload(true);
      };
      reader.readAsDataURL(file);
    }
  };

  // Save cropped banner image
  const saveBannerImage = async () => {
    if (!completedCrop || !previewCanvasRef.current) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a canvas with the cropped image
      const canvas = previewCanvasRef.current;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      
      // Save banner image to user metadata
      if (user) {
        await user.update({
          publicMetadata: {
            ...user.publicMetadata,
            bannerImage: dataUrl
          }
        });
        
        // Update the banner image in the UI
        setBannerImage(dataUrl);
        setShowBannerUpload(false);
        setFeedback({
          type: 'success',
          message: 'Banner image updated successfully.'
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to update banner image.'
      });
    } finally {
      setIsUploading(false);
    }
  };

  // Generate banner crop preview
  const updateBannerPreview = () => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) {
      return;
    }

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;
    
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    canvas.width = completedCrop.width * pixelRatio;
    canvas.height = completedCrop.height * pixelRatio;
    
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    const cropX = completedCrop.x * scaleX;
    const cropY = completedCrop.y * scaleY;
    const cropWidth = completedCrop.width * scaleX;
    const cropHeight = completedCrop.height * scaleY;
    
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      completedCrop.width,
      completedCrop.height
    );
  };

  // Handle password reset
  const handlePasswordReset = async () => {
    try {
      setFeedback({ type: '', message: '' });
      
      if (user && isLoaded) {
        await user.createPasswordReset({
          strategy: 'email_code',
        });
        
        setFeedback({
          type: 'success',
          message: 'Password reset email sent. Please check your inbox.'
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to request password reset. Please try again.'
      });
    }
  };

  // Handle account deletion
  const handleAccountDeletion = async () => {
    if (window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      try {
        setFeedback({ type: '', message: '' });
        
        if (user && isLoaded) {
          await user.delete();
          signOut({ redirectUrl: '/login' });
        }
      } catch (error) {
        setFeedback({
          type: 'error',
          message: error.message || 'Failed to delete account. Please try again.'
        });
      }
    }
  };

  // Open Clerk's user profile for managing connected accounts
  const openClerkUserProfile = (tab = 'account') => {
    openUserProfile({
      appearance: {
        elements: {
          navbar: { display: 'none' },
          footer: { display: 'none' },
          rootBox: { maxWidth: '100%' }
        }
      },
      initialTab: tab
    });
  };

  // Update username with Clerk
  const handleUsernameUpdate = async () => {
    if (!formData.username || formData.username === user?.username) {
      return;
    }

    try {
      setIsSaving(true);
      setFeedback({ type: '', message: '' });
      
      if (user) {
        await user.update({
          username: formData.username
        });
        
        // Also update in context
        await updateUserProfile({
          username: formData.username
        });
        
        setFeedback({
          type: 'success',
          message: 'Username updated successfully.'
        });
      }
    } catch (error) {
      setFeedback({
        type: 'error',
        message: error.message || 'Failed to update username. Please try again.'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state if context is still loading
  if (contextLoading) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="text-center py-8">Loading user profile...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="settings-container">
         
          {/* Banner image */}
          <div className="settings-banner">
            <img 
              className="banner-image" 
              src={bannerImage} 
              alt="Profile banner" 
            />
            <button 
              onClick={() => document.getElementById('banner-upload').click()}
              className="banner-upload-button"
              style={{
                position: 'absolute',
                bottom: '1rem',
                right: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                color: 'white',
                border: 'none',
                borderRadius: '0.375rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
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
            />
          </div>

          {/* Profile image section */}
          <div className="profile-image-container">
            <div 
              className="profile-image-wrapper"
              onClick={() => document.getElementById('profile-upload').click()}
              style={{ cursor: 'pointer', position: 'relative' }}
            >
              {user ? (
                <img 
                  src={user.imageUrl || `/api/placeholder/105/105`} 
                  alt="Profile" 
                  className="profile-image-settings" 
                />
              ) : (
                <div className="profile-image-placeholder">
                  <User size={40} />
                </div>
              )}
              <div style={{
                position: 'absolute',
                inset: '0',
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                borderRadius: '50%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: '0',
                transition: 'opacity 0.2s',
                color: 'white'
              }}
              className="profile-hover-overlay">
                <Camera size={24} />
                <span style={{ fontSize: '10px', marginTop: '4px' }}>Change</span>
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
            <div className={`feedback-message ${feedback.type}`}>
              {feedback.message}
            </div>
          )}

          {/* Form section - Profile */}
          {activeTab === 'profile' && (
            <div className="settings-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="lastName">Last name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-group full-width">
                <label htmlFor="role">Role</label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                  className="form-control"
                >
                  <option value="User">User</option>
                  <option value="Flight Chief">Flight Chief</option>
                  <option value="Weather Officer">Weather Officer</option>
                  <option value="Operations Manager">Operations Manager</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="Developer">Developer</option>
                </select>
              </div>

              <div className="form-group full-width">
                <label htmlFor="email">Email</label>
                <div className="input-with-icon">
                  <span className="input-icon">✉️</span>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-control with-icon"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="form-actions">
                <button className="cancel-button" onClick={handleCancel} disabled={isSaving}>
                  <X size={16} className="button-icon" />
                  Cancel
                </button>
                <button className="save-button" onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : (
                    <>
                      <Save size={16} className="button-icon" />
                      Save
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Account tab */}
          {activeTab === 'account' && (
            <div className="settings-form">
              <div className="form-group full-width">
                <label htmlFor="username">Username</label>
                <div className="input-with-icon" style={{ display: 'flex', alignItems: 'center' }}>
                  <span className="input-icon">@</span>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    className="form-control with-icon"
                    style={{ flex: 1 }}
                  />
                  <button 
                    onClick={handleUsernameUpdate}
                    disabled={isSaving || !formData.username || formData.username === user?.username}
                    className="action-button save-button"
                    style={{ 
                      marginLeft: '0.5rem',
                      height: '34.49px',
                      padding: '0 0.75rem',
                      fontSize: '10.73px',
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
              
              <div className="security-section" style={{ marginTop: '2rem' }}>
                <h3 className="section-title">Connected Accounts</h3>
                
                <div className="security-option">
                  <div className="security-option-info">
                    <h4 className="security-option-title">Google</h4>
                    <p className="security-option-description">
                      Connect your Google account for easier sign-in and access.
                    </p>
                  </div>
                  <button 
                    className="security-action-button"
                    onClick={() => openClerkUserProfile('security')}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {user?.externalAccounts?.some(acc => acc.provider === 'google') 
                      ? 'Manage' 
                      : 'Connect'}
                    <ExternalLink size={14} />
                  </button>
                </div>
                
                <button 
                  className="security-action-button"
                  onClick={() => openClerkUserProfile('account')}
                  style={{ 
                    marginTop: '1rem', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '0.5rem',
                    backgroundColor: '#3361E0',
                    color: 'white',
                    padding: '0.625rem 1rem',
                    borderRadius: '0.25rem',
                    border: 'none'
                  }}
                >
                  Manage Account Settings
                  <ExternalLink size={14} />
                </button>
              </div>
            </div>
          )}

          {/* Password tab */}
          {activeTab === 'password' && (
            <div className="settings-form">
              <div className="password-section">
                <h3 className="section-title">Change Password</h3>
                <p className="section-description">
                  Click the button below to receive an email with instructions to reset your password.
                </p>
                <button 
                  className="reset-password-button" 
                  onClick={handlePasswordReset}
                >
                  <Lock size={16} className="button-icon" />
                  Reset Password
                </button>
              </div>
            </div>
          )}

          {/* Login & Security tab */}
          {activeTab === 'loginSecurity' && (
            <div className="settings-form">
              <div className="security-section">
                <h3 className="section-title">Account Security</h3>
                
                <div className="security-option">
                  <div className="security-option-info">
                    <h4 className="security-option-title">Two-Factor Authentication</h4>
                    <p className="security-option-description">
                      Add an extra layer of security to your account by enabling two-factor authentication.
                    </p>
                  </div>
                  <button 
                    className="security-action-button"
                    onClick={() => openClerkUserProfile('security')}
                  >
                    <Shield size={16} className="button-icon" />
                    Manage 2FA
                  </button>
                </div>
                
                <div className="danger-zone">
                  <h4 className="danger-zone-title">Danger Zone</h4>
                  <div className="danger-option">
                    <div className="danger-option-info">
                      <h4 className="danger-option-title">Delete Account</h4>
                      <p className="danger-option-description">
                        Permanently delete your account and all associated data.
                      </p>
                    </div>
                    <button 
                      className="danger-button"
                      onClick={handleAccountDeletion}
                    >
                      <AlertTriangle size={16} className="button-icon" />
                      Delete Account
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications tab */}
          {activeTab === 'notifications' && (
            <div className="settings-form">
              <div className="notifications-section">
                <h3 className="section-title">Notification Preferences</h3>
                
                <div className="notification-option">
                  <div className="notification-option-info">
                    <h4 className="notification-option-title">Email Notifications</h4>
                    <p className="notification-option-description">
                      Receive notifications about account activity and updates via email.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div className="notification-option">
                  <div className="notification-option-info">
                    <h4 className="notification-option-title">Weather Alerts</h4>
                    <p className="notification-option-description">
                      Receive notifications about severe weather conditions in your saved locations.
                    </p>
                  </div>
                  <label className="toggle-switch">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Preferences tab */}
          {activeTab === 'preferences' && (
            <div className="settings-form">
              <div className="preferences-section">
                <h3 className="section-title">Application Preferences</h3>
                
                <div className="preference-option">
                  <div className="preference-option-info">
                    <h4 className="preference-option-title">Temperature Unit</h4>
                    <p className="preference-option-description">
                      Choose your preferred temperature unit for weather displays.
                    </p>
                  </div>
                  <div className="preference-controls">
                    <select className="preference-select">
                      <option value="fahrenheit">Fahrenheit (°F)</option>
                      <option value="celsius">Celsius (°C)</option>
                    </select>
                  </div>
                </div>
                
                <div className="preference-option">
                  <div className="preference-option-info">
                    <h4 className="preference-option-title">Wind Speed Unit</h4>
                    <p className="preference-option-description">
                      Choose your preferred unit for wind speed measurements.
                    </p>
                  </div>
                  <div className="preference-controls">
                    <select className="preference-select">
                      <option value="mph">Miles per hour (mph)</option>
                      <option value="kmh">Kilometers per hour (km/h)</option>
                      <option value="knots">Knots (kn)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Placeholder for other tabs */}
          {activeTab === 'team' && (
            <div className="settings-form">
              <div className="placeholder-content">
                <h3 className="section-title">Coming Soon</h3>
                <p className="section-description">
                  This feature is not available yet. Please check back later.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Banner Image Cropper Modal */}
      {showBannerUpload && tempBannerImage && (
        <div className="modal-overlay" onClick={() => setShowBannerUpload(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crop Banner Image</h3>
              <button className="modal-close" onClick={() => setShowBannerUpload(false)}>
                <X size={18} />
              </button>
            </div>
            <div className="modal-body">
              <div style={{ maxHeight: '300px', overflow: 'hidden', marginBottom: '1rem' }}>
                <ReactCrop
                  crop={crop}
                  onChange={c => setCrop(c)}
                  onComplete={c => setCompletedCrop(c)}
                  aspect={3 / 1}
                >
                  <img 
                    ref={imgRef}
                    src={tempBannerImage} 
                    alt="Banner preview" 
                    style={{ width: '100%' }}
                    onLoad={e => {
                      imgRef.current = e.currentTarget;
                    }}
                  />
                </ReactCrop>
              </div>
              
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.875rem', marginBottom: '0.5rem' }}>Preview:</p>
                <div style={{ 
                  border: '1px solid #e5e7eb', 
                  borderRadius: '0.375rem', 
                  height: '100px', 
                  overflow: 'hidden' 
                }}>
                  <canvas
                    ref={previewCanvasRef}
                    style={{ width: '100%', height: '100px', objectFit: 'cover' }}
                  />
                </div>
              </div>
              
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button 
                  className="cancel-button" 
                  onClick={() => setShowBannerUpload(false)}
                >
                  Cancel
                </button>
                <div>
                  <button 
                    className="save-button" 
                    style={{ marginRight: '0.5rem' }}
                    onClick={updateBannerPreview}
                  >
                    Preview
                  </button>
                  <button 
                    className="save-button"
                    onClick={saveBannerImage}
                    disabled={isUploading || !completedCrop}
                  >
                    {isUploading ? 'Saving...' : 'Save Banner'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile Image Cropper Modal */}
      {showProfileCropper && tempProfileImage && (
        <div className="modal-overlay" onClick={() => setShowProfileCropper(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Crop Profile Image</h3>
              <button className="modal-close" onClick={() => setShowProfileCropper(false)}>
                <X size={18} />
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