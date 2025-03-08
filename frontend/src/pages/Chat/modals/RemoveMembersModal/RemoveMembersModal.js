// src/pages/Chat/modals/RemoveMembersModal/RemoveMembersModal.js
import React, { useState } from 'react';
import { X, UserMinus } from 'lucide-react';

const AvatarURL = `https://ui-avatars.com`;

const RemoveMembersModal = ({
  isOpen,
  onClose,
  channel,
  currentUser,
  onMembersRemoved,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Get members excluding the current user
  const members = Object.values(channel.state.members).filter(
    (member) => member.user.id !== currentUser.id
  );

  const toggleUserSelection = (user) => {
    setSelectedUsers((prev) => {
      const isAlreadySelected = prev.some((u) => u.id === user.id);
      return isAlreadySelected
        ? prev.filter((u) => u.id !== user.id)
        : [...prev, user];
    });
  };

  const removeMembers = async () => {
    try {
      const userIdsToRemove = selectedUsers.map((user) => user.id);
      await channel.removeMembers(userIdsToRemove);
      onMembersRemoved(selectedUsers);
      setSelectedUsers([]);
      onClose();
    } catch (error) {
      console.error('Error removing members:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Remove Members from Group</h3>
          <button onClick={onClose} className="modal-close">
            <X />
          </button>
        </div>

        <div className="modal-body">
          <div className="users-list">
            {members.map((member) => (
              <div
                key={member.user.id}
                className={`user-item ${
                  selectedUsers.some((u) => u.id === member.user.id)
                    ? 'selected'
                    : ''
                }`}
                onClick={() => toggleUserSelection(member.user)}
              >
                <div className="user-info">
                  <div className="user-avatar">
                    <img
                      src={`${AvatarURL}/api/?name=${encodeURIComponent(
                        member.user.name
                      )}&background=random`}
                      alt={member.user.name}
                    />
                  </div>
                  <div className="user-details">
                    <span className="user-name">{member.user.name}</span>
                  </div>
                </div>
                {selectedUsers.some((u) => u.id === member.user.id) && (
                  <div className="selection-indicator">✓</div>
                )}
              </div>
            ))}
          </div>

          {selectedUsers.length > 0 && (
            <div className="start-chat-container">
              <button onClick={removeMembers} className="remove-members-button">
                <UserMinus size={16} />
                <span>
                  Remove {selectedUsers.length} Member
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

export default RemoveMembersModal;
