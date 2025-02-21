// src/pages/Chat/modals/AddMembersModal/AddMembersModal.js
import React, { useState } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import axios from 'axios';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
const AvatarURL = `https://ui-avatars.com`;

const AddMembersModal = ({
  isOpen,
  onClose,
  channel,
  currentUser,
  onMembersAdded,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.get(
        `${REACT_APP_API_URL}/api/chat/users/search?query=${query}`
      );

      const existingMemberIds = Object.keys(channel.state.members);
      setSearchResults(
        response.data.users.filter(
          (user) =>
            user.id !== currentUser.id && !existingMemberIds.includes(user.id)
        )
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setIsLoading(false);
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isAlreadySelected = prev.some((u) => u.id === user.id);
      return isAlreadySelected
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user];
    });
  };

  const addMembers = async () => {
    try {
      const userIds = selectedUsers.map((user) => user.id);
      await channel.addMembers(userIds);
      onMembersAdded(selectedUsers);
      setSelectedUsers([]);
      setSearchQuery('');
      onClose();
    } catch (error) {
      console.error('Error adding members:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add Members to Group</h3>
          <button onClick={onClose} className="modal-close">
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder="Search for users to add"
              value={searchQuery}
              onChange={handleSearch}
              autoFocus
            />
          </div>

          <div className="users-list">
            {isLoading ? (
              <div className="loading-state">Searching...</div>
            ) : searchResults.length > 0 ? (
              searchResults.map((user) => (
                <div
                  key={user.id}
                  className={`user-item ${
                    selectedUsers.some((u) => u.id === user.id)
                      ? 'selected'
                      : ''
                  }`}
                  onClick={() => toggleUserSelection(user)}
                >
                  <div className="user-info">
                    <div className="user-avatar">
                      <img
                        src={`${AvatarURL}/api/?name=${encodeURIComponent(
                          user.name
                        )}&background=random`}
                        alt={user.name}
                      />
                    </div>
                    <div className="user-details">
                      <span className="user-name">{user.name}</span>
                      <span className="user-username">@{user.username}</span>
                    </div>
                  </div>
                  {selectedUsers.some((u) => u.id === user.id) && (
                    <div className="selection-indicator">✓</div>
                  )}
                </div>
              ))
            ) : searchQuery.length > 0 ? (
              <div className="no-results">No users found</div>
            ) : (
              <div className="empty-state">
                Start typing to search for users
              </div>
            )}
          </div>

          {selectedUsers.length > 0 && (
            <div className="start-chat-container">
              <button onClick={addMembers} className="start-chat-button">
                <UserPlus size={16} />
                <span>
                  Add {selectedUsers.length} Member
                  {selectedUsers.length > 1 ? 's' : ''}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddMembersModal;
