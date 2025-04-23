// src/pages/Chat/Chat.js
import React, { useState, useEffect } from 'react';
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
import { MessageSquarePlus } from 'lucide-react';
import axios from 'axios';
import NewChatModal from '../../components/specific/NewChatModal/NewChatModal';
import CustomChannelPreview from './components/CustomChannelPreview';
import ChannelMembers from './components/ChannelMembers';
import 'stream-chat-react/dist/css/v2/index.css';
import './Chat.css';
import Loader from '../../components/common/loader';

const REACT_APP_STREAM_KEY = process.env.REACT_APP_STREAM_KEY;
const REACT_APP_API_URL = process.env.REACT_APP_API_URL;
const AvatarURL = `https://ui-avatars.com`;

// Create singleton instance of StreamChat
export const chatClient = StreamChat.getInstance(REACT_APP_STREAM_KEY);

const Chat = () => {
  const { user } = UserSession();
  const [clientReady, setClientReady] = useState(false);
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [activeChannel, setActiveChannel] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        // Get user token from API
        const response = await axios.get(
          `${REACT_APP_API_URL}/api/chat/token?userId=${user.id}`
        );
        const { token } = response.data;

        // Connect user to Stream Chat
        await chatClient.connectUser(
          {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`,
            username: user.username,
            image: `${AvatarURL}/api/?name=${user.firstName}+${user.lastName}&background=random`,
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

    // Cleanup on unmount
    return () => {
      chatClient.disconnectUser();
    };
  }, [user]);

  // Show loading state while initializing
  if (!clientReady) {
    return <Loader size="medium" />;
  }

  // Filter to show only channels the user is a member of
  const filters = { members: { $in: [user.id] } };
  const sort = { last_message_at: -1 };

  return (
    <div className="dashboard-container">
      <div className="main-content">
        <div className="chat-container">
          <StreamChatComponent client={chatClient} theme="messaging light">
            <div className="chat-wrapper">
              {/* Channels Sidebar */}
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

              {/* Main Chat Area */}
              <div className="chat-main">
                {activeChannel ? (
                  <Channel channel={activeChannel}>
                    <Window>
                      {/* Show members list for group chats */}
                      {activeChannel.data.type === 'team' && (
                        <ChannelMembers channel={activeChannel} />
                      )}
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

        {/* New Chat Modal */}
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
