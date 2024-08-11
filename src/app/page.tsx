"use client";

import React, { useState } from "react";
import Head from "next/head";

const languages = [
  { code: 'en', name: 'English' },
  { code: 'de', name: 'Deutsch' },
  { code: 'fr', name: 'Français' },
  { code: 'it', name: 'Italiano' },
  { code: 'pt', name: 'Português' },
  { code: 'hi', name: 'हिन्दी' },
  { code: 'es', name: 'Español' },
  { code: 'th', name: 'ไทย' },
];

const initialMessages = {
  en: "How can I help you today?",
  de: "Wie kann ich Ihnen heute helfen?",
  fr: "Comment puis-je vous aider aujourd'hui ?",
  it: "Come posso aiutarti oggi?",
  pt: "Como posso ajudar você hoje?",
  hi: "आज मैं आपकी कैसे मदद कर सकता हूँ?",
  es: "¿Cómo puedo ayudarte hoy?",
  th: "วันนี้ฉันจะช่วยคุณอย่างไรดี?",
};

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([
    { role: "bot", content: initialMessages['en'] },
  ]);
  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState('en');

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
      body: JSON.stringify([
        { role: "user", content: input },
        { role: "system", content: `Respond in ${languages.find(lang => lang.code === selectedLanguage)?.name}` }
      ]),
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

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setSelectedLanguage(newLang);
    setMessages(prevMessages => [
      { role: "bot", content: initialMessages[newLang as keyof typeof initialMessages] },
      ...prevMessages.slice(1)
    ]);
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
        <div className={`fixed bottom-44 right-8 bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-20 overflow-hidden ${
          isExpanded ? 'w-96 h-[32rem]' : 'w-80 h-96'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold">AI Assistant</h3>
              <div className="flex items-center space-x-2">
                <button onClick={toggleChatbotSize} className="text-white hover:text-gray-200 transition-colors">
                  {isExpanded ? '🗗' : '🗖'}
                </button>
                <button onClick={() => setShowChatbot(false)} className="text-white hover:text-gray-200 transition-colors">
                  &times;
                </button>
              </div>
            </div>
            <select
              value={selectedLanguage}
              onChange={handleLanguageChange}
              className="mt-2 w-full p-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-sm text-white"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] p-3 rounded-lg ${
                  message.role === "bot" 
                    ? "bg-gray-100 text-gray-800" 
                    : "bg-blue-500 text-white"
                }`}>
                  <div className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Input area */}
          <div className="p-4 bg-gray-50 border-t border-gray-200">
            <div className="relative">
              <input
                type="text"
                className="w-full p-2 pr-10 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type your message..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSendMessage();
                }}
              />
              <button 
                onClick={handleSendMessage}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-500 hover:text-blue-600"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}