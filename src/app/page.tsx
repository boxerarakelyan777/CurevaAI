"use client";

import React, { useState } from 'react';
import Head from 'next/head';

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(false);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Head>
        <title>My AI App</title>
        <meta name="description" content="AI-powered home remedy suggestions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-4xl font-bold text-blue-600">
          Welcome to Our AI-Powered Home Remedy App
        </h1>
        <p className="mt-4 text-lg text-gray-700">
          Sign up to get on the waitlist and be the first to know when we launch!
        </p>
        <button className="mt-8 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700">
          Join the Waitlist
        </button>
      </main>

      <footer className="w-full h-24 flex items-center justify-center border-t">
        <p>&copy; 2024 CurevaAI. All rights reserved.</p>
      </footer>

      {/* Chatbot Button */}
      <button
        onClick={() => setShowChatbot(!showChatbot)}
        className="fixed bottom-5 right-5 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700"
      >
        Chat with Us
      </button>

      {/* Chatbot Popup */}
      {showChatbot && (
        <div className="fixed bottom-16 right-5 w-80 h-96 bg-white border border-gray-300 rounded-lg shadow-lg p-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">Chatbot</h3>
            <button onClick={() => setShowChatbot(false)}>&times;</button>
          </div>
          <div className="flex-1 overflow-y-auto mt-4">
            {/* Chatbot messages will go here */}
            <p className="text-sm text-gray-700">How can I help you today?</p>
          </div>
          <input
            type="text"
            className="w-full mt-4 p-2 border border-gray-300 rounded-lg"
            placeholder="Type your message..."
          />
        </div>
      )}
    </div>
  );
}
