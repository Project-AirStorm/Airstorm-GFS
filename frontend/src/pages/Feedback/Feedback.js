// src/pages/Feedback/Feedback.js
import React, { useState } from 'react';
// import PropTypes from 'prop-types';
import axios from 'axios';
import './Feedback.css';

/**
 * Feedback component for collecting and submitting user feedback to GitHub Issues
 * @component
 * @param {Object} props - Component properties
 * @param {Function} props.setCurrentPage - Function to update current page in parent component
 * @returns {JSX.Element} Feedback form component
 */
const Feedback = ({ setCurrentPage }) => {
  // Form state
  const [formData, setFormData] = useState({
    ticketName: '',
    name: '',
    email: '',
    description: '',
    tag: 'question', // Default tag
  });

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Available tags for feedback
  const availableTags = [
    { value: 'question', label: 'Question' },
    { value: 'feature', label: 'Feature Request' },
    { value: 'bug', label: 'Bug' },
  ];

  /**
   * Handle input changes in the form
   * @param {Event} e - Input change event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Submit feedback to GitHub Issues via backend
   * @param {Event} e - Form submission event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Update the URL to include the full path including REACT_APP_API_URL
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/feedback`,
        {
          ...formData,
          ticketName: `[User Feedback] ${formData.ticketName}`,
        }
      );

      if (response.data.message) {
        setSuccess(true);
        setFormData({
          ticketName: '',
          name: '',
          email: '',
          description: '',
          tag: 'Question',
        });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit feedback');
      console.error('Feedback submission error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="feedback-container">
          <div className="feedback-header">
            <h2 className="feedback-title">Submit Feedback</h2>
            <p className="feedback-description">
              Help us improve by sharing your thoughts and suggestions.
            </p>
          </div>

          {success ? (
            <div className="feedback-success">
              <h3>Thank you for your feedback!</h3>
              <p>
                Your feedback has been successfully submitted. Our team will
                reach out with a response as soon as possible.{' '}
              </p>
              <button
                className="feedback-new-button"
                onClick={() => setSuccess(false)}
              >
                Submit Another Feedback
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="feedback-form">
              <div className="form-group">
                <label htmlFor="ticketName">Title</label>
                <input
                  type="text"
                  id="ticketName"
                  name="ticketName"
                  value={formData.ticketName}
                  onChange={handleInputChange}
                  required
                  placeholder="Brief description of your feedback"
                />
              </div>

              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="tag">Feedback Type</label>
                <select
                  id="tag"
                  name="tag"
                  value={formData.tag}
                  onChange={handleInputChange}
                >
                  {availableTags.map((tag) => (
                    <option key={tag.value} value={tag.value}>
                      {tag.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows="5"
                  placeholder="Please provide detailed feedback so we may assist with your request!"
                />
              </div>

              {error && <div className="feedback-error">{error}</div>}

              <button
                type="submit"
                className="submit-button"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

// Feedback.propTypes = {
//   setCurrentPage: PropTypes.func.isRequired,
// };

export default Feedback;
