// src/pages/Chat/components/ChannelMembers/ChannelMembers.js
import React from 'react';

const AvatarURL = `https://ui-avatars.com`;

const ChannelMembers = ({ channel }) => {
  const members = Object.values(channel.state.members);

  return (
    <div className="channel-members">
      {members.map((member) => (
        <div key={member.user.id} className="channel-member">
          <img
            src={`${AvatarURL}/api/?name=${encodeURIComponent(
              member.user.name
            )}&background=random`}
            alt={member.user.name}
            className="member-avatar"
          />
          <span className="member-name">{member.user.name}</span>
        </div>
      ))}
    </div>
  );
};

export default ChannelMembers;
