// src/pages/Chat/components/CustomChannelPreview/CustomChannelPreview.js
import React, { useState, useCallback } from 'react';
import { Edit, UserPlus, UserMinus, Trash2 } from 'lucide-react';
import AddMembersModal from '../../modals/AddMembersModal';
import RemoveMembersModal from '../../modals/RemoveMembersModal';
import ConfirmationModal from '../../modals/ConfirmationModal';

const CustomChannelPreview = ({
  channel,
  activeChannel,
  setActiveChannel,
  currentUser,
}) => {
  const [editingName, setEditingName] = useState(false);
  const [channelName, setChannelName] = useState(channel.data.name || '');
  const [showAddMembersModal, setShowAddMembersModal] = useState(false);
  const [showRemoveMembersModal, setShowRemoveMembersModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);

  const { messages } = channel.state;
  const lastMessage = messages[messages.length - 1];

  // Important flags
  const isActive = activeChannel?.id === channel.id;
  const isEditable = channel.data.type === 'team';
  const isGroupChat = channel.data.type === 'team';

  // Get other members for display name
  const otherMembers = Object.values(channel.state.members).filter(
    (member) => member.user?.id !== currentUser.id
  );

  const getDefaultChannelName = useCallback(() => {
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
    return otherMembers[0]?.user?.name || 'Unknown User';
  }, [channel, otherMembers]);

  const handleNameChange = async () => {
    try {
      if (channel.data.type === 'team') {
        await channel.update({
          name: channelName,
        });
      }
      setEditingName(false);
    } catch (error) {
      console.error('Error updating channel name:', error);
      setChannelName(channel.data.name || getDefaultChannelName());
    }
  };

  const handleDeleteChannel = async () => {
    try {
      await channel.hide();
      if (channel.data.type === 'team') {
        await channel.removeMembers([currentUser.id]);
      }
      setActiveChannel(null);
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const handleMembersAdded = (newMembers) => {
    console.log('New members added:', newMembers);
  };

  const handleMembersRemoved = (removedMembers) => {
    console.log('Members removed:', removedMembers);
  };

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
                    <>
                      <button
                        className="add-members-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAddMembersModal(true);
                        }}
                      >
                        <UserPlus size={16} />
                      </button>
                      <button
                        className="remove-members-button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowRemoveMembersModal(true);
                        }}
                      >
                        <UserMinus size={16} />
                      </button>
                    </>
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
      <RemoveMembersModal
        isOpen={showRemoveMembersModal}
        onClose={() => setShowRemoveMembersModal(false)}
        channel={channel}
        currentUser={currentUser}
        onMembersRemoved={handleMembersRemoved}
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

export default CustomChannelPreview;
