import React, { useState, useEffect } from 'react';
import { useUserProfile } from '../../../../contexts/UserContext';
import { useUser } from '@clerk/clerk-react';
import { Save, X } from 'lucide-react';
import './ProfileSection.css';
import FormField from '../common/FormField/FormField';
import ActionButton from '../common/ActionButton/ActionButton';
import { useValidation } from '../hooks/useValidation';
import EmailVerificationPopup from './EmailVerificationPopup';

/**
 * Profile settings section component
 * Handles user profile information including username and email verification
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
  
  // Email verification state
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  
  // Form data
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
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
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: 'Please enter a valid email address'
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
        email: user.primaryEmailAddress?.emailAddress || '',
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
   * Initiate email verification process
   */
  const initiateEmailVerification = async () => {
    try {
      setIsSaving(true);
      
      if (user && isLoaded) {
        // Create a new email address in Clerk
        const emailResponse = await user.createEmailAddress({ 
          email: formData.email,
        });
        
        // Store the email ID for verification
        setPendingEmail(formData.email);
        
        // Show the verification popup
        setShowEmailVerification(true);
        
        showFeedback('success', 'Verification code sent to your email address. Please check your inbox.', 10000);
      }
    } catch (error) {
      showFeedback('error', error.message || 'Failed to send verification email. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };
  
  /**
   * Verify email code and complete email change
   * @param {string} code - 6-digit verification code
   */
  const verifyEmailCode = async (code) => {
    try {
      if (user && isLoaded) {
        // Get the pending email verification
        const pendingVerification = user.emailAddresses.find(
          email => email.emailAddress === pendingEmail && !email.verification.status
        );
        
        if (!pendingVerification) {
          throw new Error('No pending email verification found');
        }
        
        // Attempt to verify the email
        await user.verifyEmailAddress({
          code,
          strategy: pendingVerification.verification.strategy
        });
        
        // Make the email primary after verification
        await user.setPrimaryEmailAddress({ id: pendingVerification.id });
        
        // Close the verification popup
        setShowEmailVerification(false);
        
        // Update the user profile in context
        await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: pendingEmail,
          username: formData.username,
          role: formData.role
        });
        
        showFeedback('success', 'Email verified and updated successfully.');
      }
    } catch (error) {
      throw new Error(error.message || 'Email verification failed. Please try again.');
    }
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
        
        // Email change requires verification - only initiate if email has changed
        if (formData.email !== user.primaryEmailAddress?.emailAddress) {
          await initiateEmailVerification();
          setIsSaving(false);
          return; // Stop here and wait for verification
        }
        
        // Update the user profile in context (this will also save to backend)
        const result = await updateUserProfile({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: user.primaryEmailAddress?.emailAddress,
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
        email: user.primaryEmailAddress?.emailAddress || '',
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
        
        {/* Username field (moved from AccountSection) */}
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

        <FormField
          id="email"
          name="email"
          label="Email"
          type="email"
          value={formData.email}
          onChange={handleInputChange}
          error={errors.email}
          icon="✉️"
          className="full-width"
          helper={formData.email !== user?.primaryEmailAddress?.emailAddress ? 
            "A verification code will be sent to this address" : ""}
        />

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
      
      {/* Email Verification Popup */}
      <EmailVerificationPopup
        isOpen={showEmailVerification}
        onClose={() => setShowEmailVerification(false)}
        onVerify={verifyEmailCode}
        email={pendingEmail}
      />
    </div>
  );
};

export default ProfileSection;