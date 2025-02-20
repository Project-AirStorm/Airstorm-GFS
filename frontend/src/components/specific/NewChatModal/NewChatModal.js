// src/components/specific/NewChatModal/NewChatModal.js
import React, { useState } from 'react';
import { X, Search, MessageSquare } from 'lucide-react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import './NewChatModal.css';

const NewChatModal = ({
  isOpen,
  onClose,
  chatClient,
  currentUser,
  onChannelCreated,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
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
        `${process.env.REACT_APP_API_URL}/api/chat/users/search?query=${query}`
      );
      setSearchResults(
        response.data.users.filter((user) => user.id !== currentUser.id)
      );
    } catch (error) {
      console.error('Error searching users:', error);
    }
    setIsLoading(false);
  };

  const startConversation = async (otherUser) => {
    try {
      // Ensure both users exist in StreamChat
      await Promise.all([
        axios.post(`${process.env.REACT_APP_API_URL}/api/chat/users/create`, {
          user_id: otherUser.id,
          name: otherUser.name,
          username: otherUser.username,
        }),
        axios.post(`${process.env.REACT_APP_API_URL}/api/chat/users/create`, {
          user_id: currentUser.id,
          name: `${currentUser.firstName} ${currentUser.lastName}`,
          username: currentUser.username,
        }),
      ]);

      // Create a unique channel ID for the two users
      const userIds = [currentUser.id, otherUser.id].sort();
      const channelId = CryptoJS.SHA256(userIds.join('-'))
        .toString(CryptoJS.enc.Hex)
        .substring(0, 64);

      // Create a new channel or get existing one
      const channel = chatClient.channel('messaging', channelId, {
        members: [currentUser.id, otherUser.id], // Both users are added as members
        name: `${currentUser.firstName} ${currentUser.lastName}, ${otherUser.name}`,
      });

      // Create the channel and ensure both users are added
      await channel.create();

      // Add members explicitly
      await channel.addMembers([currentUser.id, otherUser.id]);

      // Watch the channel for both users
      await channel.watch();

      setSearchQuery('');
      setSearchResults([]);
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
          <h3>New Conversation</h3>
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
              placeholder="Type a name to search for users"
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
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <div className="user-avatar">
                      <img
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
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
                  <button
                    onClick={() => startConversation(user)}
                    className="chat-button"
                  >
                    <MessageSquare size={16} />
                    <span>Chat</span>
                  </button>
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
        </div>
      </div>
    </div>
  );
};

export default NewChatModal;
