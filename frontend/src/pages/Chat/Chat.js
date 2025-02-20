// src/pages/Chat/Chat.js
import React, { useState, useEffect, useCallback } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat as StreamChatComponent,
  Channel,
  Window,
  MessageList,
  MessageInput,
  ChannelList,
} from 'stream-chat-react';
import { UserSession } from '../../utils/UserSession';
import {
  MessageSquarePlus,
  Edit,
  UserPlus,
  Trash2,
  X,
  Search,
} from 'lucide-react';
import axios from 'axios';
import 'stream-chat-react/dist/css/v2/index.css';
import './Chat.css';
import NewChatModal from '../../components/specific/NewChatModal/NewChatModal';

const chatClient = StreamChat.getInstance(process.env.REACT_APP_STREAM_KEY);

// Add Members Modal Component
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
        `${process.env.REACT_APP_API_URL}/api/chat/users/search?query=${query}`
      );

      // Filter out existing channel members and current user
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
      // Ensure users exist in Stream Chat
      await Promise.all(
        selectedUsers.map((user) =>
          axios.post(`${process.env.REACT_APP_API_URL}/api/chat/users/create`, {
            user_id: user.id,
            name: user.name,
            username: user.username,
          })
        )
      );

      // Add members to the channel
      const userIds = selectedUsers.map((user) => user.id);
      await channel.addMembers(userIds);

      // Callback to parent component
      onMembersAdded(selectedUsers);

      // Reset and close modal
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

// Confirmation Modal Component
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{title}</h3>
          <button onClick={onClose} className="modal-close">
            <X />
          </button>
        </div>
        <div className="modal-body">
          <p>{message}</p>
          <div className="confirmation-actions">
            <button className="cancel-button" onClick={onClose}>
              Cancel
            </button>
            <button className="confirm-button" onClick={onConfirm}>
              Confirm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomChannelPreview = ({
  channel,
  activeChannel,
  setActiveChannel,
  currentUser,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [channelName, setChannelName] = useState(channel.data.name || '');
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const { messages } = channel.state;
  const lastMessage = messages[messages.length - 1];

  // Determine channel display name
  const otherMembers = Object.values(channel.state.members).filter(
    (member) => member.user?.id !== chatClient.userID
  );

  const getDefaultChannelName = useCallback(() => {
    // For group chats (team type)
    if (channel.data.type === 'team') {
      const memberNames = otherMembers
        .map((m) => m.user?.name || 'Unknown')
        .slice(0, 3);

      return memberNames.length > 1
        ? memberNames.slice(0, 2).join(', ') +
            (memberNames.length > 2
              ? `, and ${memberNames.length - 2} other${
                  memberNames.length > 3 ? 's' : ''
                }`
              : '')
        : memberNames[0];
    }

    // For one-on-one chats or any other type
    return otherMembers[0]?.user?.name || 'Unknown User';
  }, [channel, otherMembers]);

  const handleNameChange = async () => {
    try {
      // Only allow editing for team (group) chats
      if (channel.data.type === 'team') {
        await channel.update({
          name: channelName,
        });
      }
      setEditingName(false);
    } catch (error) {
      console.error('Error updating channel name:', error);
      // Revert to original name if update fails
      setChannelName(channel.data.name || getDefaultChannelName());
    }
  };

  const handleDeleteChannel = async () => {
    try {
      // Hide the channel for the current user
      await channel.hide();

      // If it's a group chat, partially delete it
      if (channel.data.type === 'team') {
        await channel.removeMembers([currentUser.id]);
      }

      // Close the active channel
      setActiveChannel(null);
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleMembersAdded = (newMembers) => {
    // Optional: You could add some notification or UI feedback here
    console.log('New members added:', newMembers);
  };

  const isActive = activeChannel?.id === channel.id;
  const isEditable = channel.data.type === 'team';
  const isGroupChat = channel.data.type === 'team';

  return (
    <>
      <div
        className={`channel-preview ${
          isActive ? 'channel-preview-active' : ''
        }`}
        onClick={() => setActiveChannel(channel)}
      >
        <div className="channel-preview-content">
          <div className="channel-preview-header">
            {editingName ? (
              <div className="channel-name-edit">
                <input
                  type="text"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                  onBlur={handleNameChange}
                  onKeyDown={(e) => e.key === 'Enter' && handleNameChange()}
                  autoFocus
                />
                <button onClick={handleNameChange}>Save</button>
              </div>
            ) : (
              <div className="channel-name-display">
                <span className="channel-preview-name">
                  {channelName || getDefaultChannelName()}
                </span>
                <div className="channel-actions">
                  {isEditable && (
                    <button
                      className="edit-name-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingName(true);
                      }}
                    >
                      <Edit size={16} />
                    </button>
                  )}
                  {isGroupChat && (
                    <button
                      className="add-members-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowAddMembersModal(true);
                      }}
                    >
                      <UserPlus size={16} />
                    </button>
                  )}
                  <button
                    className="delete-channel-button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteConfirmation(true);
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
            {lastMessage && (
              <span className="channel-preview-time">
                {new Date(lastMessage.created_at).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            )}
          </div>
          <div className="channel-preview-message">
            {lastMessage ? lastMessage.text : 'No messages yet'}
          </div>
        </div>
      </div>

      <AddMembersModal
        isOpen={showAddMembersModal}
        onClose={() => setShowAddMembersModal(false)}
        channel={channel}
        currentUser={currentUser}
        onMembersAdded={handleMembersAdded}
      />

      <ConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDeleteChannel}
        title="Delete Conversation"
        message={`Are you sure you want to delete this ${
          isGroupChat ? 'group chat' : 'conversation'
        }?`}
      />
    </>
  );
};

const Chat = () => {
  const { user } = UserSession();
  const [clientReady, setClientReady] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        const response = await axios.get(
          `${process.env.REACT_APP_API_URL}/api/chat/token?userId=${user.id}`
        );
        const { token } = response.data;

        await chatClient.connectUser(
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
            image: `https://ui-avatars.com/api/?name=${user.firstName}+${user.lastName}&background=random`,
          },
          token
        );

        setClientReady(true);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };

    if (user) {
      initChat();
    }

    return () => {
      chatClient.disconnectUser();
    };
  }, [user]);

  if (!clientReady) {
    return (
      <div className="dashboard-container">
        <div className="main-content">
          <div className="chat-loading">
            <div className="chat-loading-spinner"></div>
            <p>Loading chat...</p>
          </div>
        </div>
      </div>
    );
  }

  const filters = { members: { $in: [user.id] } };
  const sort = { last_message_at: -1 };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="chat-container">
          <StreamChatComponent client={chatClient} theme="messaging light">
            <div className="chat-wrapper">
              <div className="chat-channels">
                <div className="chat-channels-header">
                  <h2>Conversations</h2>
                  <button
                    className="new-chat-button"
                    onClick={() => setShowNewChatModal(true)}
                  >
                    <MessageSquarePlus className="w-5 h-5" />
                    New Chat
                  </button>
                </div>
                <ChannelList
                  filters={filters}
                  sort={sort}
                  Preview={(props) => (
                    <CustomChannelPreview
                      {...props}
                      activeChannel={activeChannel}
                      setActiveChannel={setActiveChannel}
                      currentUser={user}
                    />
                  )}
                />
              </div>
              <div className="chat-main">
                {activeChannel ? (
                  <Channel channel={activeChannel}>
                    <Window>
                      <MessageList />
                      <MessageInput />
                    </Window>
                  </Channel>
                ) : (
                  <div className="empty-channel">
                    <p>Select a conversation to start chatting</p>
                  </div>
                )}
              </div>
            </div>
          </StreamChatComponent>
        </div>

        <NewChatModal
          isOpen={showNewChatModal}
          onClose={() => setShowNewChatModal(false)}
          chatClient={chatClient}
          currentUser={user}
          onChannelCreated={(channel) => {
            setActiveChannel(channel);
            setShowNewChatModal(false);
          }}
        />
      </div>
    </div>
  );
};

export default Chat;
