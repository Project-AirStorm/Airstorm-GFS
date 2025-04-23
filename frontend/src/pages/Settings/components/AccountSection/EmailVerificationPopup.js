import React, { useState, useEffect, useRef } from 'react';
import { Check, X } from 'lucide-react';
import './EmailVerificationPopup.css';

/**
 * Email verification popup component for two-factor authentication
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the popup is open
 * @param {Function} props.onClose - Function to close the popup
 * @param {Function} props.onVerify - Function called with code on verification
 * @param {string} props.email - Email being verified
 * @returns {JSX.Element} EmailVerificationPopup component
 */
const EmailVerificationPopup = ({ isOpen, onClose, onVerify, email }) => {
  // State for the 6-digit code input
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const inputRefs = useRef([]);

  // Reset code when popup opens
  useEffect(() => {
    if (isOpen) {
      setCode(['', '', '', '', '', '']);
      setError('');
      setIsVerifying(false);
      // Focus the first input when opened
      setTimeout(() => {
        if (inputRefs.current[0]) {
          inputRefs.current[0].focus();
        }
      }, 100);
    }
  }, [isOpen]);

  // Handle input change in code fields
  const handleCodeChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Only allow digits
    
    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    
    // Auto-focus next input if a digit was entered
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  // Handle key press in code fields
  const handleKeyDown = (index, e) => {
    // If backspace is pressed and current field is empty, focus previous field
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1].focus();
    }
  };

  // Handle verification
  const handleVerify = async () => {
    // Check if code is complete
    if (code.some(digit => !digit)) {
      setError('Please enter the complete 6-digit code');
      return;
    }

    setIsVerifying(true);
    setError('');
    
    try {
      // Call verification function passed from parent
      const fullCode = code.join('');
      await onVerify(fullCode);
    } catch (error) {
      setError(error.message || 'Verification failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="verification-overlay">
      <div className="verification-popup">
        <button onClick={onClose} className="close-button">
          <X size={20} />
        </button>
        
        <h3 className="verification-title">Verify Your Email</h3>
        
        <p className="verification-description">
          Enter the 6-digit code sent to <strong>{email}</strong>
        </p>
        
        <div className="code-input-container">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={el => inputRefs.current[index] = el}
              type="text"
              maxLength={1}
              value={digit}
              onChange={e => handleCodeChange(index, e.target.value)}
              onKeyDown={e => handleKeyDown(index, e)}
              className="code-input"
            />
          ))}
        </div>
        
        {error && <p className="verification-error">{error}</p>}
        
        <div className="verification-actions">
          <button onClick={onClose} className="cancel-action">
            Cancel
          </button>
          <button 
            onClick={handleVerify} 
            className="verify-action"
            disabled={isVerifying || code.some(digit => !digit)}
          >
            {isVerifying ? 'Verifying...' : 'Verify'}
          </button>
        </div>
        
        <p className="verification-help">
          Didn't receive the code? <button className="resend-button">Resend</button>
        </p>
      </div>
    </div>
  );
};

export default EmailVerificationPopup;