import React from 'react';
import { SignIn } from '@clerk/clerk-react';
import Footer from '../../components/common/footer/Footer';
import GlobeBackground from '../../components/specific/GlobeBackground/GlobeBackground'; // adjust path as needed
import './Login.css';

function Login() {
  return (
    <>
      <GlobeBackground />
      <div className="login-wrapper">
        <div className="login-page-container">
          <main className="login-main">
            <SignIn signUpUrl="/sign-up" />
          </main>
        </div>
        <Footer />
      </div>
    </>
  );
}

export default Login;
