// src/components/specific/ProfileImageUploader/ProfileImageUploader.js
import React, { useState } from 'react';
import { Camera } from 'lucide-react';
import ProfileImageCropper from './ProfileImageCropper';
import './ProfileImageUploader.css';

/**
 * Component for uploading and cropping profile images
 * @param {Object} props - Component props
 * @param {Object} props.user - User object from Clerk
 * @param {Function} props.showFeedback - Function to display feedback messages
 * @param {Function} props.onImageChange - Optional callback when image changes
 * @returns {JSX.Element} Profile image uploader component
 */
const ProfileImageUploader = ({ user, showFeedback, onImageChange }) => {
  const [showCropper, setShowCropper] = useState(false);
  const [tempImage, setTempImage] = useState(null);

  /**
   * Handle profile image file selection
   * @param {Event} e - Change event from file input
   */
  const handleProfileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        // Set the image and show the cropper
        setTempImage(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  /**
   * Handle successful image save
   * @param {File} file - Saved image file
   */
  const handleSave = (file) => {
    if (onImageChange) {
      onImageChange(file);
    }
  };

  return (
    <div className="profile-image-uploader-container">
      <div 
        className="profile-image-uploader-wrapper"
        onClick={() => document.getElementById('profile-upload').click()}
      >
        {user ? (
          <img 
            src={user.imageUrl || `/api/placeholder/105/105`} 
            alt="Profile" 
            className="profile-image-uploader-image" 
          />
        ) : (
          <div className="profile-image-uploader-placeholder">
            <Camera size={40} />
          </div>
        )}
        <div className="profile-image-uploader-overlay">
          <Camera size={24} />
          <span>Change</span>
        </div>
        <input
          type="file"
          id="profile-upload"
          className="profile-image-uploader-input"
          onChange={handleProfileUpload}
          accept="image/*"
        />
      </div>

      <ProfileImageCropper
        user={user}
        showFeedback={showFeedback}
        isOpen={showCropper}
        onClose={() => setShowCropper(false)}
        onSave={handleSave}
        imageSrc={tempImage}
      />
    </div>
  );
};

export default ProfileImageUploader;