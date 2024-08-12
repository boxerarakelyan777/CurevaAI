"use client";

import React, { useState, useEffect, useRef } from "react";
import Head from "next/head";
import { useAuth } from '../hooks/useAuth';
import Navbar from '../components/Navbar';
import { collection, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

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

const getPersonalizedGreeting = (name: string | null | undefined, language: keyof typeof initialMessages) => {
  const greetings = {
    en: `Hello ${name || 'there'}! How can I help you today?`,
    de: `Hallo ${name || 'dort'}! Wie kann ich Ihnen heute helfen?`,
    fr: `Bonjour ${name || 'là'}! Comment puis-je vous aider aujourd'hui ?`,
    it: `Ciao ${name || 'lì'}! Come posso aiutarti oggi?`,
    pt: `Olá ${name || 'aí'}! Como posso ajudar você hoje?`,
    hi: `नमस्ते ${name || 'वहाँ'}! आज मैं आपकी कैसे मदद कर सकता हूँ?`,
    es: `¡Hola ${name || 'allí'}! ¿Cómo puedo ayudarte hoy?`,
    th: `สวัสดี ${name || 'ที่นั่น'}! วันนี้ฉันจะช่วยคุณอย่างไรดี?`,
  };
  return greetings[language] || greetings.en;
};

export default function Home() {
  const [showChatbot, setShowChatbot] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [selectedLanguage, setSelectedLanguage] = useState<keyof typeof initialMessages>('en');
  const { user } = useAuth();
  const [feedbacks, setFeedbacks] = useState<{[key: number]: 'up' | 'down' | null}>({});
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const messageContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      loadUserChat();
    } else {
      setMessages([{ role: "bot", content: initialMessages[selectedLanguage] }]);
    }
  }, [user]);

  const loadUserChat = async () => {
    if (user) {
      const chatRef = doc(collection(db, 'userChats'), user.uid);
      const chatDoc = await getDoc(chatRef);
      if (chatDoc.exists()) {
        const chatData = chatDoc.data();
        setMessages(chatData.messages || [{ role: "bot", content: getPersonalizedGreeting(user.displayName, chatData.language || 'en') }]);
        setSelectedLanguage(chatData.language || 'en');
      } else {
        setMessages([{ role: "bot", content: getPersonalizedGreeting(user.displayName, selectedLanguage) }]);
      }
    }
  };

  const saveUserChat = async (messagesToSave: { role: string; content: string }[]) => {
    if (user) {
      const chatRef = doc(collection(db, 'userChats'), user.uid);
      await setDoc(chatRef, { messages: messagesToSave, language: selectedLanguage }, { merge: true });
    }
  };

  const clearChat = () => {
    const initialMessage = { 
      role: "bot", 
      content: user 
        ? getPersonalizedGreeting(user.displayName, selectedLanguage) 
        : initialMessages[selectedLanguage] 
    };
    setMessages([initialMessage]);
    if (user) {
      saveUserChat([initialMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const newUserMessage = { role: "user", content: input };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setInput("");

    if (user) {
      await saveUserChat(updatedMessages);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify([
          newUserMessage,
          { role: "system", content: `Respond in ${languages.find(lang => lang.code === selectedLanguage)?.name}${user && user.displayName ? `. The user's name is ${user.displayName}.` : ''}` }
        ]),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder("utf-8");
      let accumulatedResponse = "";

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;

        const chunk = decoder.decode(value);
        accumulatedResponse += chunk;
        console.log('Received chunk:', chunk);
      }

      console.log('Full response:', accumulatedResponse);

      const newBotMessage = { role: "bot", content: accumulatedResponse };
      const finalMessages = [...updatedMessages, newBotMessage];
      setMessages(finalMessages);

      if (user) {
        await saveUserChat(finalMessages);
      }
    } catch (error) {
      console.error('Error in handleSendMessage:', error);
      // You might want to set an error message in the state here
      // to display to the user that something went wrong
    }
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
    const newLang = e.target.value as keyof typeof initialMessages;
    setSelectedLanguage(newLang);
    
    const newInitialMessage = { 
      role: "bot", 
      content: user 
        ? getPersonalizedGreeting(user.displayName, newLang) 
        : initialMessages[newLang] 
    };

    setMessages(prevMessages => [newInitialMessage, ...prevMessages.slice(1)]);

    if (user) {
      saveUserChat([newInitialMessage, ...messages.slice(1)]);
    }
  };

  const scrollToBottom = () => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop = messageContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleFeedback = async (index: number, type: 'up' | 'down') => {
    setFeedbacks(prev => ({ ...prev, [index]: type }));
    
    if (type === 'down') {
      setRegeneratingIndex(index);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify([
            { role: "user", content: messages[index - 1].content },
            { role: "system", content: `Respond in ${languages.find(lang => lang.code === selectedLanguage)?.name}${user && user.displayName ? `. The user's name is ${user.displayName}.` : ''}. The previous response was not satisfactory. Please provide a better answer.` }
          ]),
        });
  
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
  
        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedResponse = "";
  
        while (true) {
          const { done, value } = await reader?.read()!;
          if (done) break;
  
          const chunk = decoder.decode(value);
          accumulatedResponse += chunk;
        }
  
        const updatedMessages = [...messages];
        updatedMessages[index] = { ...updatedMessages[index], content: accumulatedResponse };
        setMessages(updatedMessages);
  
        // Reset the feedback for this message
        setFeedbacks(prev => ({ ...prev, [index]: null }));
  
        if (user) {
          await saveUserChat(updatedMessages);
        }

        scrollToBottom(); // Add this line to scroll after regeneration
      } catch (error) {
        console.error('Error regenerating response:', error);
      } finally {
        setRegeneratingIndex(null);
      }
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
 

    <main className="flex-grow flex flex-col items-center justify-center w-full px-20 text-center">
      <h1 className="text-4xl font-bold text-blue-600">
        Welcome to Our AI-Powered Home Remedy App
      </h1>
      <p className="mt-4 text-lg text-gray-700">
        {user ? `Hello, ${user.displayName || 'there'}!` : 'Sign up to get on the waitlist and be the first to know when we launch!'}
      </p>
      {!user && (
        <button className="mt-8 bg-blue-600 text-white py-2 px-4 rounded-full hover:bg-blue-700">
          Join the Waitlist
        </button>
      )}
    </main>

      {/* Chat Icon Button */}
      <div className="fixed bottom-8 right-8 z-10">
        <button
          onClick={() => setShowChatbot(!showChatbot)}
          className="bg-blue-600 text-white p-3 rounded-full hover:bg-blue-700 shadow-xl hover:shadow-2xl transition-all duration-300 ease-in-out transform hover:-translate-y-1"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        </button>
      </div>

      <footer className="w-full h-24 flex items-center justify-center border-t">
        <p>&copy; 2024 CurevaAI. All rights reserved.</p>
      </footer>

      {/* Chatbot Popup */}
      {showChatbot && (
        <div className={`fixed bottom-24 right-8 bg-white rounded-lg shadow-2xl flex flex-col transition-all duration-300 ease-in-out z-20 overflow-hidden ${
          isExpanded ? 'w-[28rem] h-[36rem]' : 'w-96 h-[28rem]'
        }`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 text-white">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold">AI Assistant</h3>
            <div className="flex items-center space-x-2">
              <button onClick={clearChat} className="text-white hover:text-gray-200 transition-colors">
                🗑️
              </button>
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
              className="mt-2 w-full p-1 bg-white bg-opacity-20 border border-white border-opacity-30 rounded text-sm text-black"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.name}
                </option>
              ))}
            </select>
          </div>

          {/* Messages */}
          <div 
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto p-4 space-y-4"
          >
            {messages.map((message, index) => (
              <div key={index} className={`flex ${message.role === "bot" ? "justify-start" : "justify-end"}`}>
                <div className={`max-w-[75%] p-3 rounded-lg ${
                  message.role === "bot" 
                    ? "bg-gray-100 text-gray-800" 
                    : "bg-blue-500 text-white"
                }`}>
                  <div className="whitespace-pre-wrap break-words">{formatMessage(message.content)}</div>
                  {message.role === "bot" && (
                    <div className="mt-2 flex justify-end space-x-2">
                      <button 
                        onClick={() => handleFeedback(index, 'up')} 
                        className={`p-1 rounded ${feedbacks[index] === 'up' ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        disabled={feedbacks[index] === 'down'}
                      >
                        👍
                      </button>
                      <button 
                        onClick={() => handleFeedback(index, 'down')} 
                        className={`p-1 rounded ${feedbacks[index] === 'down' ? 'bg-red-500 text-white' : 'bg-gray-200'}`}
                        disabled={feedbacks[index] === 'up'}
                      >
                        👎
                      </button>
                      {regeneratingIndex === index && (
                        <span className="text-sm text-gray-500">Regenerating...</span>
                      )}
                    </div>
                  )}
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