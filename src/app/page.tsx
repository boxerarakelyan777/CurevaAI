"use client";


import React, { useState } from "react";
import Head from "next/head";

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "bot", content: "How can I help you today?" },
  ]);
  const [input, setInput] = useState("");

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newMessages = [...messages, { role: "user", content: input }];
    setMessages(newMessages);
    setInput("");

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify([{ role: "user", content: input }]),
    });

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedResponse = "";

    while (true) {
      const { done, value } = await reader?.read()!;
      if (done) break;

      const chunk = decoder.decode(value);
      accumulatedResponse += chunk;
    }

    setMessages((prevMessages) => [...prevMessages, { role: "bot", content: accumulatedResponse }]);
  };

  const toggleChatbotSize = () => {
    setIsExpanded(!isExpanded);
  };

  const formatMessage = (content: string) => {
    // Remove Markdown-style bold formatting
    content = content.replace(/\*\*(.*?)\*\*/g, '$1');

    // Split content into lines
    const lines = content.split('\n');

    // Process each line
    return lines.map((line, index) => {
      // Check for numbered list
      const numberedMatch = line.match(/^\d+\.\s(.+)/);
      if (numberedMatch) {
        return <div key={index} className="ml-4">• {numberedMatch[1]}</div>;
      }

      // Check for bullet points
      if (line.startsWith('- ') || line.startsWith('• ')) {
        return <div key={index} className="ml-4">{line}</div>;
      }

      // Regular text
      return <div key={index}>{line}</div>;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Head>
        <title>My AI App</title>
        <meta name="description" content="AI-powered home remedy suggestions" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="flex-grow flex flex-col items-center justify-center w-full px-20 text-center">
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

      {/* Chatbot Button */}
      <div className="fixed bottom-32 right-8 z-10">
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="bg-blue-600 text-white py-3 px-6 rounded-full hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          Chat with Us
        </button>
      </div>

      <footer className="w-full h-24 flex items-center justify-center border-t">
        <p>&copy; 2024 My AI App. All rights reserved.</p>
      </footer>

      {/* Chatbot Popup */}
      {showChatbot && (
        <div className={`fixed bottom-44 right-8 bg-white border border-gray-300 rounded-lg shadow-2xl p-4 flex flex-col transition-all duration-300 ease-in-out z-20 ${
          isExpanded ? 'w-96 h-[32rem]' : 'w-80 h-96'
        }`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-bold">Chatbot</h3>
            <div>
              <button onClick={toggleChatbotSize} className="mr-2 text-gray-500 hover:text-gray-700">
                {isExpanded ? '🗗' : '🗖'}
              </button>
              <button onClick={() => setShowChatbot(false)} className="text-gray-500 hover:text-gray-700">&times;</button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto mb-4">
            {messages.map((message, index) => (
              <div key={index} className={`mb-2 ${message.role === "bot" ? "text-left" : "text-right"}`}>
                <span className={`inline-block text-sm p-2 rounded-lg ${
                  message.role === "bot" ? "bg-gray-100 text-gray-700" : "bg-blue-100 text-blue-600"
                }`}>
                  {formatMessage(message.content)}
                </span>
              </div>
            ))}
          </div>
          <input
            type="text"
            className="w-full p-2 border border-gray-300 rounded-lg"
            placeholder="Type your message..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSendMessage();
            }}
          />
        </div>
      )}
    </div>
  );
}