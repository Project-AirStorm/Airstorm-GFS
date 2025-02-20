// src/pages/Chat/Chat.js
import React, { useEffect, useState } from 'react';
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
import { MessageSquarePlus, Edit } from 'lucide-react';
import axios from 'axios';
import 'stream-chat-react/dist/css/v2/index.css';
import './Chat.css';
import NewChatModal from '../../components/specific/NewChatModal/NewChatModal';

const chatClient = StreamChat.getInstance(process.env.REACT_APP_STREAM_KEY);

const CustomChannelPreview = ({ channel, activeChannel, setActiveChannel }) => {
  const [editingName, setEditingName] = useState(false);
  const [channelName, setChannelName] = useState(channel.data.name || '');
  const { messages } = channel.state;
  const lastMessage = messages[messages.length - 1];

  // Determine channel display name
  const otherMembers = Object.values(channel.state.members).filter(
    (member) => member.user?.id !== chatClient.userID
  );

  const getDefaultChannelName = () => {
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
  };

  const handleNameChange = async () => {
    try {
      await channel.update({
        name: channelName,
      });
      setEditingName(false);
    } catch (error) {
      console.error('Error updating channel name:', error);
      // Revert to original name if update fails
      setChannelName(channel.data.name || getDefaultChannelName());
    }
  };

  const isActive = activeChannel?.id === channel.id;

  return (
    <div
      className={`channel-preview ${isActive ? 'channel-preview-active' : ''}`}
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
              {channel.data.type === 'team' && (
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

  const filters = {
    members: { $in: [user.id] },
  };
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
