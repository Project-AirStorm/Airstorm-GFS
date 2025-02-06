import Sidebar from "../sidebar/Sidebar";
import Footer from '../footer/Footer';
import Header from '../header/Header';
import { getPageTitle } from '../../../config/Routes';
import { useLocation } from "react-router-dom";
import React, { useState } from "react";
import { Outlet } from "react-router-dom";

/**
 * Layout component that wraps the main content and handles mobile menu state
 */
const Layout = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const location = useLocation();
    const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);  // Handle mobile menu toggle

    return (
        <div className="app-wrapper">
            <Sidebar
                isOpen={isMobileMenuOpen}
                onClose={() => setIsMobileMenuOpen(false)}
            />

            <div className="main-content-wrapper">
                <Header
                    title={getPageTitle(location.pathname)}
                    onMenuToggle={toggleMobileMenu}
                    isMobileMenuOpen={isMobileMenuOpen}
                />

                <main className="content-area">{children}</main>

                <Footer />
            </div>
        </div>
    );
};

export default Layout;