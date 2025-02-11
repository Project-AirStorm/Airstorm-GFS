import React from 'react';
import { SignUp } from '@clerk/clerk-react';
import Footer from '../../components/common/footer/Footer';
import GlobeBackground from '../../components/specific/GlobeBackground/GlobeBackground';
import './Signup.css';

function Signup() {
  return (
    <>
      <GlobeBackground />
      <div className="signup-wrapper">
        <div className="signup-page-container">
          <main className="signup-main">
            <SignUp signInUrl="/login" />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Signup;
