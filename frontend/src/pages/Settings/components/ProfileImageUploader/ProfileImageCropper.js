// src/components/specific/ProfileImageUploader/ProfileImageCropper.js
import React, { useState, useRef, useEffect } from 'react';
import ReactCrop from 'react-image-crop';
import './ProfileImageCropper.css';
import 'react-image-crop/dist/ReactCrop.css';

/**
 * Component for cropping profile images with live preview
 * @param {Object} props - Component props
 * @param {Object} props.user - User object from Clerk
 * @param {Function} props.showFeedback - Function to display feedback messages
 * @param {boolean} props.isOpen - Whether the cropper modal is open
 * @param {Function} props.onClose - Function to close the modal
 * @param {Function} props.onSave - Optional callback when image is saved
 * @param {string} props.imageSrc - Source of the image to crop
 * @returns {JSX.Element} Profile image cropper component
 */
const ProfileImageCropper = ({ 
  user, 
  showFeedback, 
  isOpen, 
  onClose,
  onSave,
  imageSrc 
}) => {
  // State for crop management
  const [profileCrop, setProfileCrop] = useState({ unit: '%', width: 100, aspect: 1 / 1 });
  const [completedProfileCrop, setCompletedProfileCrop] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const profileImgRef = useRef(null);
  const profileCanvasRef = useRef(null);

  // Update preview whenever crop changes for live preview
  useEffect(() => {
    if (completedProfileCrop && profileImgRef.current && profileCanvasRef.current) {
      updateProfilePreview();
    }
  }, [completedProfileCrop]);

  /**
   * Generate the cropped image preview on canvas
   */
  const updateProfilePreview = () => {
    if (!completedProfileCrop || !profileImgRef.current || !profileCanvasRef.current) {
      return;
    }

    const image = profileImgRef.current;
    const canvas = profileCanvasRef.current;
    const ctx = canvas.getContext('2d');
    const pixelRatio = window.devicePixelRatio;
    
    // Calculate scale between display size and actual image size
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    // Set canvas dimensions based on crop size and pixel ratio
    canvas.width = completedProfileCrop.width * pixelRatio;
    canvas.height = completedProfileCrop.height * pixelRatio;
    
    // Apply scaling for high-DPI displays
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    // Calculate actual crop coordinates in the original image
    const cropX = completedProfileCrop.x * scaleX;
    const cropY = completedProfileCrop.y * scaleY;
    const cropWidth = completedProfileCrop.width * scaleX;
    const cropHeight = completedProfileCrop.height * scaleY;
    
    // Draw the cropped portion to the canvas
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

  /**
   * Save the cropped image to user profile
   */
  const saveProfileImage = async () => {
    if (!completedProfileCrop || !profileCanvasRef.current) {
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Create a blob from the canvas
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
          onClose();
          showFeedback('success', 'Profile image updated successfully.');
          
          if (onSave) {
            onSave(file);
          }
        }
      }, 'image/jpeg', 0.95);
    } catch (error) {
      showFeedback('error', error.message || 'Failed to update profile image.');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle image load and set initial crop
   */
  const handleImageLoad = (e) => {
    profileImgRef.current = e.currentTarget;
    
    // Set initial crop values centered
    const { width, height } = e.currentTarget;
    const size = Math.min(width, height);
    const initialCrop = {
      unit: 'px',
      x: (width - size) / 2,
      y: (height - size) / 2,
      width: size,
      height: size,
      aspect: 1
    };
    
    // Set both crop states to trigger initial preview
    setProfileCrop(initialCrop);
    setCompletedProfileCrop(initialCrop);
  };

  if (!isOpen || !imageSrc) return null;

  return (
    <div className="profile-image-cropper-overlay" onClick={onClose}>
      <div className="profile-image-cropper-content" onClick={(e) => e.stopPropagation()}>
        <div className="profile-image-cropper-header">
          <h3>Crop Profile Image</h3>
          <button className="profile-image-cropper-close" onClick={onClose}>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="profile-image-cropper-body">
          <div className="profile-image-crop-container">
            <ReactCrop
              crop={profileCrop}
              onChange={crop => {
                setProfileCrop(crop);
                // Update completedCrop on every change for live preview
                setCompletedProfileCrop(crop);
              }}
              onComplete={crop => setCompletedProfileCrop(crop)}
              aspect={1 / 1}
              circularCrop
            >
              <img 
                ref={profileImgRef}
                src={imageSrc} 
                alt="Profile preview" 
                className="profile-image-source"
                onLoad={handleImageLoad}
              />
            </ReactCrop>
          </div>
          
          <div className="profile-image-preview-container">
            <p className="profile-image-preview-label">Preview:</p>
            <div className="profile-image-preview-circle">
              <canvas
                ref={profileCanvasRef}
                className="profile-image-preview-canvas"
              />
            </div>
          </div>
          
          <div className="profile-image-cropper-actions">
            <button 
              className="profile-image-cropper-cancel-button" 
              onClick={onClose}
            >
              Cancel
            </button>
            <button 
              className="profile-image-cropper-save-button"
              onClick={saveProfileImage}
              disabled={isUploading || !completedProfileCrop}
            >
              {isUploading ? 'Saving...' : 'Save Profile Image'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileImageCropper;