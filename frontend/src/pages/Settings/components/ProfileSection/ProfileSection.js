import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../../../contexts/UserContext';
import { useUser } from '@clerk/clerk-react';
import { Save, X } from 'lucide-react';
import './ProfileSection.css';
import FormField from '../common/FormField/FormField';
import ActionButton from '../common/ActionButton/ActionButton';
import { useValidation } from '../hooks/useValidation';

/**
 * Profile settings section component
 * Handles user profile information including username but not email
 * @param {Object} props - Component props
 * @param {Object} props.user - Clerk user object
 * @param {Object} props.userProfile - User profile from context
 * @param {Function} props.showFeedback - Function to show feedback messages
 * @returns {JSX.Element} ProfileSection component
 */
const ProfileSection = ({ user, userProfile, showFeedback }) => {
  const { updateUserProfile } = useUserProfile();
  const { isLoaded } = useUser();
  
  // State variables for operation status
  const [isSaving, setIsSaving] = useState(false);
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    role: 'User' // Default role
  });
  
  // Validation setup
  const { validateField, errors, validateForm, resetErrors } = useValidation({
    firstName: {
      pattern: /^[A-Za-z\s-']{1,50}$/,
      message: 'Only letters, spaces, hyphens and apostrophes allowed'
    },
    lastName: {
      pattern: /^[A-Za-z\s-']{1,50}$/,
      message: 'Only letters, spaces, hyphens and apostrophes allowed'
    },
    username: {
      pattern: /^[A-Za-z0-9_-]{3,30}$/,
      message: 'Username must be 3-30 characters using only letters, numbers, underscores, or hyphens'
    }
  });

  // Initialize form data when user data is available
  useEffect(() => {
    if (user && userProfile) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        username: user.username || '',
        role: userProfile.role || 'User'
      });
    }
  }, [user, userProfile]);
  
  /**
   * Handle input changes with validation
   * @param {Object} e - Event object
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Validate as user types
    validateField(name, value);
  };

  /**
   * Save profile data with validation
   */
  const handleSave = async () => {
    try {
      // Validate all fields before saving
      if (!validateForm(formData)) {
        showFeedback('error', 'Please correct the highlighted fields before saving.');
        return;
      }
      
      setIsSaving(true);
      
      // Save user data to Clerk via API
      if (user && isLoaded) {
        // Check if username has changed
        if (formData.username !== user.username) {
          await user.update({
            username: formData.username
          });
        }
        
        // Update name in Clerk
        await user.update({
          firstName: formData.firstName,
          lastName: formData.lastName,
        });
        
        // Update the user profile in context (this will also save to backend)
        const result = await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          username: formData.username,
          role: formData.role
        });
        
        if (result.success) {
          showFeedback('success', 'Profile updated successfully.');
        } else {
          throw new Error('Failed to update profile');
        }
      }
    } catch (error) {
      showFeedback('error', error.message || 'Failed to update profile. Please try again.');
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
        username: user.username || '',
        role: userProfile.role || 'User'
      });
    }
    // Clear any feedback and validation errors
    resetErrors();
  };

  return (
    <div>
      {/* Form section */}
      <div className="settings-form">
        <div className="form-row">
          <FormField
            id="firstName"
            name="firstName"
            label="First name"
            value={formData.firstName}
            onChange={handleInputChange}
            error={errors.firstName}
          />

          <FormField
            id="lastName"
            name="lastName"
            label="Last name"
            value={formData.lastName}
            onChange={handleInputChange}
            error={errors.lastName}
          />
        </div>
        
        {/* Username field */}
        <FormField
          id="username"
          name="username"
          label="Username"
          value={formData.username}
          onChange={handleInputChange}
          error={errors.username}
          icon="@"
          className="full-width"
        />

        {/* Role dropdown */}
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
            <option value="Forecaster">Forecaster</option>
            <option value="Developer">Developer</option>
          </select>
        </div>

        {/* Action buttons */}
        <div className="form-actions">
          <ActionButton
            type="secondary"
            onClick={handleCancel}
            disabled={isSaving}
            icon={<X size={16} />}
          >
            Cancel
          </ActionButton>
          
          <ActionButton
            type="primary"
            onClick={handleSave}
            disabled={isSaving}
            icon={<Save size={16} />}
          >
            {isSaving ? "Saving..." : "Save"}
          </ActionButton>
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;