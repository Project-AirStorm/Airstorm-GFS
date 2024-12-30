// src/components/ContextMenu.js
import React from 'react';
import {
  IoAdd,
  IoLocationOutline,
  IoStar,
  IoStarOutline,
} from 'react-icons/io5';

const MenuItem = ({ icon: Icon, text, onClick, className = '' }) => (
  <div
    className={`flex items-center px-4 py-2 cursor-pointer hover:bg-purple-50 ${className}`}
    onClick={onClick}
  >
    {Icon && <Icon className="mr-2 text-purple-600" />}
    <span className="text-gray-700">{text}</span>
  </div>
);

const ContextMenu = ({
  x,
  y,
  onClose,
  onAddLocation,
  onAddFavorite,
  isFavorite,
}) => {
  return (
    <>
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className="fixed bg-white rounded-lg shadow-lg py-1 w-48 z-50"
        style={{
          left: x,
          top: y,
        }}
      >
        <MenuItem icon={IoAdd} text="Add Location" onClick={onAddLocation} />
        <MenuItem
          icon={isFavorite ? IoStar : IoStarOutline}
          text={isFavorite ? 'Remove from Favorites' : 'Add to Favorites'}
          onClick={onAddFavorite}
        />
      </div>
    </>
  );
};

export default ContextMenu;
