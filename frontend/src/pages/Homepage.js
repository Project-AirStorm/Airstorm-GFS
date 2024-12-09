import React, { useEffect, useState } from "react";
import axios from "axios";

const Homepage = () => {
  const [message, setMessage] = useState("");

  useEffect(() => {
    // Fetch the homepage message from Flask backend
    axios
      .get("http://localhost:5000/")
      .then((response) => {
        setMessage(response.data.message);
      })
      .catch((error) => {
        console.error("Error fetching JSON", error);
      });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 via-purple-800 to-gray-800 text-white">
      {/* Navigation Menu */}
      <nav className="bg-gray-800 bg-opacity-90 shadow-lg">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <h1 className="text-lg font-bold text-purple-400">Airstorm</h1>
          <div className="flex space-x-4">
            <a href="/" className="hover:text-purple-300 transition duration-300">
              Home
            </a>
            <a
              href="/weather"
              className="hover:text-purple-300 transition duration-300"
            >
              Weather
            </a>
            <a
              href="/Learn more"
              className="hover:text-purple-300 transition duration-300"
            >
              About
            </a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-20">
        <h1 className="text-5xl font-bold text-center text-purple-300">
          {message || "Loading..."}
        </h1>
        <p className="mt-6 text-center text-purple-200">
          Hello Airstorm TEAM!
        </p>
      </main>

      {/* Footer */}
      <footer className="py-4 bg-gray-800 bg-opacity-90 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Airstorm. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Homepage;
