// src/components/specific/NewChatModal/NewChatModal.js
import React, { useState } from 'react';
import { X, Search, MessageSquare } from 'lucide-react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import './NewChatModal.css';

const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
const AvatarURL = `https://ui-avatars.com`;

const NewChatModal = ({
  isOpen,
  onClose,
  chatClient,
  currentUser,
  onChannelCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGroupChat, setIsGroupChat] = useState(false);

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
      setSearchResults(
        response.data.users.filter((user) => user.id !== currentUser.id)
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setIsLoading(false);
  };

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isAlreadySelected = prev.some(
        (selectedUser) => selectedUser.id === user.id
      );
      if (isAlreadySelected) {
        return prev.filter((selectedUser) => selectedUser.id !== user.id);
      }
      return [...prev, user];
    });
  };

  const generateGroupName = (users) => {
    const allUsers = [
      { name: `${currentUser.firstName} ${currentUser.lastName}` },
      ...users,
    ];

    const memberNames = allUsers.map((u) => u.name);

    if (memberNames.length <= 3) {
      return memberNames.join(', ');
    }

    return `${memberNames.slice(0, 2).join(', ')}, and ${
      memberNames.length - 2
    } other${memberNames.length > 3 ? 's' : ''}`;
  };

  const startConversation = async () => {
    try {
      // Ensure all users exist in StreamChat
      const userIds = [currentUser.id, ...selectedUsers.map((user) => user.id)];

      await Promise.all(
        userIds.map((userId) => {
          const user =
            userId === currentUser.id
              ? currentUser
              : selectedUsers.find((u) => u.id === userId);

          return axios.post(`${REACT_APP_API_URL}/api/chat/users/create`, {
            user_id: user.id,
            name:
              user.id === currentUser.id
                ? `${user.firstName} ${user.lastName}`
                : user.name,
            username: user.username,
          });
        })
      );

      // Create a unique channel ID
      const channelId = isGroupChat
        ? CryptoJS.SHA256(userIds.sort().join('-'))
            .toString(CryptoJS.enc.Hex)
            .substring(0, 64)
        : CryptoJS.SHA256(userIds.sort().join('-'))
            .toString(CryptoJS.enc.Hex)
            .substring(0, 64);

      // Prepare channel name - for direct messages, it should be the current user's name for the other person
      const channelName = isGroupChat
        ? generateGroupName(selectedUsers)
        : `${currentUser.firstName} ${currentUser.lastName}`;

      // Create a new channel or get existing one
      const channel = chatClient.channel(
        isGroupChat ? 'team' : 'messaging',
        channelId,
        {
          members: userIds,
          name: channelName,
          image: isGroupChat
            ? `${AvatarURL}/api/?name=${encodeURIComponent(
                channelName
              )}&background=random`
            : undefined,
        }
      );

      // Create the channel and ensure all users are added
      await channel.create();
      await channel.addMembers(userIds);
      await channel.watch();

      // Reset modal state
      setSearchQuery('');
      setSearchResults([]);
      setSelectedUsers([]);
      setIsGroupChat(false);
      onClose();

      // Pass the created channel back to the parent component
      onChannelCreated(channel);
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isGroupChat ? 'New Group Chat' : 'New Conversation'}</h3>
          <button onClick={onClose} className="modal-close">
            <X />
          </button>
        </div>

        <div className="modal-body">
          {/* Group Chat Toggle */}
          <div className="create-group-option">
            <label className="create-group-checkbox">
              <input
                type="checkbox"
                checked={isGroupChat}
                onChange={() => setIsGroupChat(!isGroupChat)}
              />
              <span>Create Group Chat</span>
            </label>
          </div>

          {/* Selected Users */}
          {selectedUsers.length > 0 && (
            <div className="selected-users">
              {selectedUsers.map((user) => (
                <div key={user.id} className="selected-user-chip">
                  {user.name}
                  <button onClick={() => toggleUserSelection(user)}>×</button>
                </div>
              ))}
            </div>
          )}

          <div className="search-container">
            <Search className="search-icon" />
            <input
              type="text"
              className="search-input"
              placeholder={`Search for ${
                isGroupChat ? 'group members' : 'a user'
              }`}
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

          {/* Start Conversation/Group Chat Button */}
          {selectedUsers.length > (isGroupChat ? 1 : 0) && (
            <div className="start-chat-container">
              <button onClick={startConversation} className="start-chat-button">
                <MessageSquare size={16} />
                <span>
                  {isGroupChat
                    ? `Create Group Chat (${selectedUsers.length + 1} members)`
                    : 'Start Conversation'}
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
