import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import FrontLayout from '../../../Component/Layouts/Front';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faRobot, faSpinner } from '@fortawesome/free-solid-svg-icons';

/**
 * AI-Powered Job Search Chatbot
 * Modern, reusable component with Anthropic API integration
 */
function AIChatbot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Hello! I\'m your AI job search assistant. I can help you find the perfect job based on your preferences. Try asking me: "Find me a data analyst job in Mumbai" or "Show me fresher jobs for B.Tech graduates"',
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // Auto-scroll to bottom when new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  /**
   * Send message to AI and get job recommendations
   */
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = inputMessage.trim();
    setInputMessage('');
    
    // Add user message to chat
    const newUserMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Extract preferences from user message (simple parsing)
      const preferences = extractPreferences(userMessage);

      // Call AI API
      const response = await axios.post(
        `${backendUrl}/api/ai/job-recommendations`,
        {
          userQuery: userMessage,
          preferences: preferences,
          userProfile: {
            // Can be extended with logged-in user data
            skills: [],
            experience: 0,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000, // 30 seconds
        }
      );

      // Check if it's a Q&A response (FAQ answer)
      if (response.data.status && response.data.isQA && response.data.answer) {
        const newAiMessage = {
          role: 'assistant',
          content: response.data.answer,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
      } else if (response.data.status && response.data.jobs) {
        const jobs = response.data.jobs;
        const aiAnalysis = response.data.aiAnalysis;

        // Format AI response
        let aiResponse = formatAIResponse(jobs, aiAnalysis, userMessage);
        
        // Add AI response to chat
        const newAiMessage = {
          role: 'assistant',
          content: aiResponse,
          jobs: jobs, // Store jobs for display
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
      } else {
        throw new Error('No jobs found');
      }
    } catch (error) {
      console.error('AI Chatbot Error:', error);
      
      // Error message
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.response?.data?.message || error.message}. Please try again or use the regular job search filters.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      inputRef.current?.focus();
    }
  };

  // Convert URLs in text to clickable links
  const convertUrlsToLinks = (text) => {
    if (!text) return text;
    
    // URL regex pattern - matches http/https URLs
    const urlRegex = /(https?:\/\/[^\s\n]+)/g;
    
    // Split by newlines first to preserve line structure
    const lines = text.split('\n');
    
    return lines.map((line, lineIndex) => {
      const parts = line.split(urlRegex);
      const lineElements = parts.map((part, partIndex) => {
        if (urlRegex.test(part)) {
          return (
            <a
              key={`${lineIndex}-${partIndex}`}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: '#3B82F6',
                textDecoration: 'underline',
                wordBreak: 'break-all',
              }}
            >
              {part}
            </a>
          );
        }
        return <span key={`${lineIndex}-${partIndex}`}>{part}</span>;
      });
      
      return (
        <React.Fragment key={lineIndex}>
          {lineElements}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  };

  /**
   * Extract preferences from natural language query
   */
  const extractPreferences = (query) => {
    const lowerQuery = query.toLowerCase();
    const preferences = {};

    // All Indian States with their major cities/districts
    const stateCityMap = {
      'andhra pradesh': ['hyderabad', 'visakhapatnam', 'vijayawada', 'guntur', 'nellore', 'kurnool', 'tirupati', 'kakinada', 'anantapur', 'rajahmundry'],
      'arunachal pradesh': ['itanagar', 'namsai', 'pasighat', 'tawang', 'bomdila', 'ziro', 'daporijo'],
      'assam': ['guwahati', 'silchar', 'dibrugarh', 'jorhat', 'nagaon', 'tinsukia', 'tezpur', 'sivasagar', 'bongaigaon', 'diphu'],
      'bihar': ['patna', 'gaya', 'bhagalpur', 'muzaffarpur', 'purnia', 'darbhanga', 'arrah', 'begusarai', 'katihar', 'chapra'],
      'chhattisgarh': ['raipur', 'bilaspur', 'durg', 'bhilai', 'korba', 'raigarh', 'rajnandgaon', 'ambikapur', 'jagdalpur', 'dhamtari'],
      'goa': ['panaji', 'margao', 'vasco da gama', 'mapusa', 'ponda', 'mormugao'],
      'gujarat': ['ahmedabad', 'surat', 'vadodara', 'rajkot', 'bhavnagar', 'jamnagar', 'gandhinagar', 'anand', 'bharuch', 'mehsana', 'junagadh', 'gandhidham'],
      'haryana': ['gurgaon', 'faridabad', 'panipat', 'ambala', 'yamunanagar', 'rohtak', 'hisar', 'karnal', 'sonipat', 'panchkula', 'bhiwani', 'rewari'],
      'himachal pradesh': ['shimla', 'solan', 'dharamshala', 'mandi', 'kullu', 'manali', 'palampur', 'kangra', 'una', 'hamirpur'],
      'jharkhand': ['ranchi', 'jamshedpur', 'dhanbad', 'bokaro', 'hazaribagh', 'deoghar', 'giridih', 'dumka', 'phusro', 'adityapur'],
      'karnataka': ['bangalore', 'mysore', 'hubli', 'mangalore', 'belgaum', 'gulbarga', 'davangere', 'bellary', 'bijapur', 'raichur', 'tumkur', 'udupi'],
      'kerala': ['kochi', 'trivandrum', 'calicut', 'thrissur', 'kollam', 'alappuzha', 'kannur', 'palakkad', 'kottayam', 'malappuram'],
      'madhya pradesh': ['bhopal', 'indore', 'gwalior', 'jabalpur', 'ujjain', 'raipur', 'sagar', 'ratlam', 'burhanpur', 'satna', 'rewa', 'dewas'],
      'maharashtra': ['mumbai', 'pune', 'nagpur', 'aurangabad', 'nashik', 'solapur', 'thane', 'kalyan', 'vasai', 'nanded', 'sangli', 'kolhapur', 'amravati', 'latur'],
      'manipur': ['imphal', 'thoubal', 'bishnupur', 'churachandpur', 'ukhrul', 'kakching'],
      'meghalaya': ['shillong', 'tura', 'jowai', 'nongpoh', 'baghmara', 'williamnagar'],
      'mizoram': ['aizawl', 'lunglei', 'saiha', 'champhai', 'serchhip', 'kolasib'],
      'nagaland': ['dimapur', 'kohima', 'mokokchung', 'tuensang', 'wokha', 'zunheboto'],
      'odisha': ['bhubaneswar', 'cuttack', 'rourkela', 'berhampur', 'sambalpur', 'puri', 'balasore', 'bhadrak', 'baripada', 'jagatsinghpur'],
      'punjab': ['amritsar', 'ludhiana', 'jalandhar', 'patiala', 'bathinda', 'pathankot', 'hoshiarpur', 'moga', 'firozpur', 'sangrur', 'batala', 'mohali'],
      'rajasthan': ['jaipur', 'jodhpur', 'udaipur', 'kota', 'ajmer', 'bikaner', 'bharatpur', 'alwar', 'sikar', 'pali', 'tonk', 'bhilwara'],
      'sikkim': ['gangtok', 'namchi', 'mangan', 'gyalshing', 'singtam'],
      'tamil nadu': ['chennai', 'coimbatore', 'madurai', 'trichy', 'salem', 'tirunelveli', 'erode', 'vellore', 'dindigul', 'thanjavur', 'tuticorin', 'hosur'],
      'telangana': ['hyderabad', 'warangal', 'nizamabad', 'karimnagar', 'khammam', 'ramagundam', 'mahbubnagar', 'adilabad', 'suryapet', 'miryalaguda'],
      'tripura': ['agartala', 'udaypur', 'dhalai', 'khowai', 'belonia', 'ambassa'],
      'uttar pradesh': ['lucknow', 'kanpur', 'agra', 'varanasi', 'allahabad', 'meerut', 'ghaziabad', 'noida', 'aligarh', 'bareilly', 'moradabad', 'saharanpur', 'gorakhpur', 'faizabad'],
      'uttarakhand': ['dehradun', 'haridwar', 'roorkee', 'haldwani', 'rudrapur', 'kashipur', 'nainital', 'mussoorie', 'almora', 'pithoragarh'],
      'west bengal': ['kolkata', 'howrah', 'durgapur', 'asansol', 'siliguri', 'bardhaman', 'malda', 'baharampur', 'haldia', 'kharagpur', 'cooch behar', 'jalpaiguri'],
      'delhi': ['delhi', 'new delhi', 'noida', 'gurgaon', 'faridabad', 'ghaziabad'],
      'andaman and nicobar': ['port blair', 'havelock', 'diglipur', 'rangat'],
      'chandigarh': ['chandigarh'],
      'dadra and nagar haveli': ['silvassa', 'dadra'],
      'daman and diu': ['daman', 'diu'],
      'lakshadweep': ['kavaratti', 'agatti', 'minicoy'],
      'puducherry': ['pondicherry', 'karaikal', 'mahe', 'yanam']
    };

    // Check for states and cities
    for (const [state, cities] of Object.entries(stateCityMap)) {
      if (lowerQuery.includes(state)) {
        preferences.state = state.split(' ').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join(' ');
        break;
      }
      
      // Check for cities in this state
      for (const city of cities) {
        if (lowerQuery.includes(city)) {
          preferences.city = city.split(' ').map(word => 
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
          // Also set state if city found
          if (!preferences.state) {
            preferences.state = state.split(' ').map(word => 
              word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
          }
          break;
        }
      }
    }

    // Extract experience
    const expMatch = lowerQuery.match(/(\d+)\s*(year|years|yr|yrs)/i);
    if (expMatch) {
      preferences.maxExperienceYears = parseInt(expMatch[1]);
    } else if (lowerQuery.includes('fresher') || lowerQuery.includes('fresher')) {
      preferences.maxExperienceYears = 0;
    }

    // Extract salary
    const salaryMatch = lowerQuery.match(/(\d+)\s*(lakh|lakhs|lpa|thousand|k)/i);
    if (salaryMatch) {
      const amount = parseInt(salaryMatch[1]);
      if (salaryMatch[2].toLowerCase().includes('lakh')) {
        preferences.minSalary = amount * 100000;
      } else {
        preferences.minSalary = amount * 1000;
      }
    }

    return preferences;
  };

  /**
   * Format AI response with job cards
   */
  const formatAIResponse = (jobs, aiAnalysis, userQuery) => {
    if (jobs.length === 0) {
      return `I couldn't find any jobs matching "${userQuery}". Try adjusting your search criteria or use different keywords.`;
    }

    let response = `🎯 I found ${jobs.length} perfect job${jobs.length > 1 ? 's' : ''} for you!\n\n`;
    
    if (aiAnalysis?.matchedCriteria) {
      response += `✅ Matched criteria: ${aiAnalysis.matchedCriteria.join(', ')}\n\n`;
    }

    response += `Here are the top recommendations:\n\n`;
    
    // Add top 5 jobs summary
    jobs.slice(0, 5).forEach((job, index) => {
      const salary = job.isFixed 
        ? `₹${job.amount?.toLocaleString() || 'N/A'}` 
        : `₹${job.min?.toLocaleString() || 'N/A'} - ₹${job.max?.toLocaleString() || 'N/A'}`;
      
      response += `${index + 1}. **${job.title || job.name}**\n`;
      response += `   💼 ${job._company?.name || job.displayCompanyName || 'N/A'}\n`;
      response += `   📍 ${job.city?.name || 'N/A'}, ${job.state?.name || 'N/A'}\n`;
      response += `   💰 ${salary}\n`;
      response += `   📅 Experience: ${job.experience || 0} year${(job.experience || 0) > 1 ? 's' : ''}\n\n`;
    });

    if (jobs.length > 5) {
      response += `\n... and ${jobs.length - 5} more jobs! Click on any job card below to view details.`;
    }

    return response;
  };

  /**
   * Clear chat history
   */
  const handleClearChat = () => {
    if (window.confirm('Are you sure you want to clear the chat?')) {
      setMessages([
        {
          role: 'assistant',
          content: '👋 Chat cleared! How can I help you find your dream job today?',
          timestamp: new Date(),
        },
      ]);
    }
  };

  /**
   * Quick action buttons
   */
  const quickActions = [
    { text: 'Fresher Jobs', query: 'Show me fresher jobs' },
    { text: 'Remote Jobs', query: 'Find remote work opportunities' },
    { text: 'High Salary', query: 'Show me high salary jobs' },
    { text: 'IT Jobs', query: 'Find IT sector jobs' },
  ];

  const handleQuickAction = (query) => {
    setInputMessage(query);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };

  return (
    <FrontLayout>
      <div className="ai-chatbot-container">
        <div className="chatbot-header">
          <div className="d-flex align-items-center gap-3">
            <div className="ai-avatar">
              <FontAwesomeIcon icon={faRobot} />
            </div>
            <div>
              <h2 className="mb-0">AI Job Search Assistant</h2>
              <p className="mb-0 text-muted small">Powered by Anthropic Claude</p>
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleClearChat}
            title="Clear Chat"
          >
            <FontAwesomeIcon icon={faTimes} /> Clear
          </button>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <span className="small text-muted me-2">Quick searches:</span>
          {quickActions.map((action, idx) => (
            <button
              key={idx}
              className="btn btn-sm btn-outline-primary"
              onClick={() => handleQuickAction(action.query)}
              disabled={isLoading}
            >
              {action.text}
            </button>
          ))}
        </div>

        {/* Messages Area */}
        <div className="messages-container">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
              <div className="message-content">
                {message.role === 'assistant' && (
                  <div className="ai-avatar-small">
                    <FontAwesomeIcon icon={faRobot} />
                  </div>
                )}
                <div className="message-bubble">
                  <div className="message-text">{convertUrlsToLinks(message.content)}</div>
                  {message.jobs && message.jobs.length > 0 && (
                    <div className="job-cards-preview">
                      <div className="row g-3 mt-2">
                        {message.jobs.slice(0, 3).map((job) => (
                          <div key={job._id} className="col-md-4">
                            <div className="job-card-mini">
                              <h6 className="job-title-mini">
                                {job.title || job.name}
                              </h6>
                              <p className="job-company-mini mb-1">
                                {job._company?.name || job.displayCompanyName}
                              </p>
                              <p className="job-location-mini mb-1">
                                📍 {job.city?.name || 'N/A'}, {job.state?.name || 'N/A'}
                              </p>
                              <p className="job-salary-mini mb-2">
                                💰 {job.isFixed 
                                  ? `₹${job.amount?.toLocaleString() || 'N/A'}` 
                                  : `₹${job.min?.toLocaleString() || 'N/A'} - ₹${job.max?.toLocaleString() || 'N/A'}`}
                              </p>
                              <a
                                href={`/candidate/login?returnUrl=/candidate/job/${job._id}`}
                                className="btn btn-sm btn-primary w-100"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                View Details
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                      {message.jobs.length > 3 && (
                        <p className="text-center mt-2 small text-muted">
                          + {message.jobs.length - 3} more jobs available
                        </p>
                      )}
                    </div>
                  )}
                  <div className="message-time">
                    {new Date(message.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="message ai-message">
              <div className="message-content">
                <div className="ai-avatar-small">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
                <div className="message-bubble">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <form onSubmit={handleSendMessage} className="chat-input-container">
          <div className="input-group">
            <input
              ref={inputRef}
              type="text"
              className="form-control"
              placeholder="Ask me anything about jobs... (e.g., 'Find data analyst jobs in Mumbai')"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading || !inputMessage.trim()}
            >
              {isLoading ? (
                <FontAwesomeIcon icon={faSpinner} spin />
              ) : (
                <FontAwesomeIcon icon={faPaperPlane} />
              )}
            </button>
          </div>
          <small className="text-muted d-block mt-2 text-center">
            💡 Tip: Ask in natural language like "Show me fresher jobs in IT sector" or "Find remote Python developer jobs"
          </small>
        </form>
      </div>

      <style>{`
        .ai-chatbot-container {
          max-width: 1200px;
          margin: 40px auto;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          height: calc(100vh - 200px);
          min-height: 600px;
        }

        .chatbot-header {
          background: linear-gradient(135deg, #FC2B5A 0%, #ec4899 100%);
          color: white;
          padding: 20px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .chatbot-header h2 {
          color: white;
          font-size: 24px;
          font-weight: 600;
        }

        .ai-avatar {
          width: 50px;
          height: 50px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .quick-actions {
          padding: 12px 24px;
          background: #f8f9fa;
          border-bottom: 1px solid #e9ecef;
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }

        .quick-actions .btn {
          border-radius: 20px;
          font-size: 12px;
          padding: 4px 12px;
        }

        .messages-container {
          flex: 1;
          overflow-y: auto;
          padding: 24px;
          background: #f8f9fa;
        }

        .message {
          margin-bottom: 20px;
          display: flex;
        }

        .user-message {
          justify-content: flex-end;
        }

        .ai-message {
          justify-content: flex-start;
        }

        .message-content {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          max-width: 70%;
          min-width: 0;
        }

        .user-message .message-content {
          flex-direction: row-reverse;
        }

        .ai-avatar-small {
          width: 36px;
          height: 36px;
          background: linear-gradient(135deg, #FC2B5A 0%, #ec4899 100%);
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 16px;
          flex-shrink: 0;
        }

        .message-bubble {
          background: white;
          padding: 12px 16px;
          border-radius: 18px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          position: relative;
          word-wrap: break-word;
          overflow-wrap: break-word;
          max-width: 100%;
        }

        .user-message .message-bubble {
          background: linear-gradient(135deg, #FC2B5A 0%, #ec4899 100%);
          color: white;
        }

        .message-text {
          white-space: pre-wrap;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          line-height: 1.5;
          max-width: 100%;
        }

        .message-time {
          font-size: 10px;
          opacity: 0.7;
          margin-top: 4px;
        }

        .typing-indicator {
          display: flex;
          gap: 4px;
          padding: 8px 0;
        }

        .typing-indicator span {
          width: 8px;
          height: 8px;
          background: #999;
          border-radius: 50%;
          animation: typing 1.4s infinite;
        }

        .typing-indicator span:nth-child(2) {
          animation-delay: 0.2s;
        }

        .typing-indicator span:nth-child(3) {
          animation-delay: 0.4s;
        }

        @keyframes typing {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.7;
          }
          30% {
            transform: translateY(-10px);
            opacity: 1;
          }
        }

        .job-cards-preview {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid rgba(0, 0, 0, 0.1);
        }

        .job-card-mini {
          background: #f8f9fa;
          border: 1px solid #e9ecef;
          border-radius: 8px;
          padding: 12px;
          transition: all 0.3s ease;
        }

        .job-card-mini:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateY(-2px);
        }

        .job-title-mini {
          font-size: 14px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
        }

        .job-company-mini {
          font-size: 12px;
          color: #666;
          margin: 0;
        }

        .job-location-mini,
        .job-salary-mini {
          font-size: 11px;
          color: #888;
          margin: 0;
        }

        .chat-input-container {
          padding: 20px 24px;
          background: white;
          border-top: 1px solid #e9ecef;
        }

        .chat-input-container .input-group {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          border-radius: 24px;
          overflow: hidden;
        }

        .chat-input-container .form-control {
          border: none;
          padding: 12px 20px;
          font-size: 14px;
        }

        .chat-input-container .form-control:focus {
          box-shadow: none;
          border: none;
        }

        .chat-input-container .btn {
          border: none;
          padding: 12px 24px;
          background: linear-gradient(135deg, #FC2B5A 0%, #ec4899 100%);
        }

        .chat-input-container .btn:disabled {
          opacity: 0.6;
        }

        @media (max-width: 768px) {
          .ai-chatbot-container {
            height: calc(100vh - 100px);
            margin: 20px;
            border-radius: 12px;
          }

          .message-content {
            max-width: 85%;
          }

          .chatbot-header {
            padding: 16px;
          }

          .chatbot-header h2 {
            font-size: 18px;
          }

          .quick-actions {
            padding: 8px 16px;
          }

          .quick-actions .btn {
            font-size: 11px;
            padding: 3px 8px;
          }
        }
      `}</style>
    </FrontLayout>
  );
}

export default AIChatbot;



