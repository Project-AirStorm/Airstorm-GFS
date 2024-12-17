import React from 'react';

const Footer = () => {
  return (
    <footer className="py-4 bg-gray-800 bg-opacity-90 mt-auto">
      <div className="container mx-auto text-center">
        <p className="text-sm text-gray-400">
          © {new Date().getFullYear()} Airstorm. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
