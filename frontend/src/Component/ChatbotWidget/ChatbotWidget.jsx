import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPaperPlane, faTimes, faRobot, faSpinner, faCommentDots } from '@fortawesome/free-solid-svg-icons';
import './ChatbotWidget.css';

/**
 * Reusable AI Chatbot Widget Component
 * 
 * Usage:
 * 
 * 1. Floating Widget (default):
 *    <ChatbotWidget />
 * 
 * 2. Inline Component:
 *    <ChatbotWidget mode="inline" />
 * 
 * 3. Custom Position:
 *    <ChatbotWidget position="bottom-left" />
 * 
 * Props:
 * - mode: "floating" | "inline" (default: "floating")
 * - position: "bottom-right" | "bottom-left" | "top-right" | "top-left" (only for floating)
 * - title: Custom title (default: "AI Job Search Assistant")
 * - initialMessage: Custom welcome message
 * - onJobClick: Callback when job is clicked
 */
function ChatbotWidget({
  mode = 'floating',
  position = 'bottom-right',
  title = 'AI Job Search Assistant',
  initialMessage = '👋 Hello! I\'m your AI job search assistant. I can help you find the perfect job based on your preferences.',
  onJobClick = null,
  className = '',
  // Additional props for full functionality
  onJobsUpdate = null, // Callback to update jobs list in parent
  jobPreferences = {}, // Job preferences from parent
  onShareJob = null, // Share job handler
  onRefineSearch = null, // Refine search handler
  onAddToCompare = null, // Add to compare handler
  voiceSupported = false, // Voice input support
  onVoiceInput = null, // Voice input handler
  redirectToPortal = false, // If true, redirects to candidate portal instead of direct apply
}) {
  const [isOpen, setIsOpen] = useState(mode === 'inline'); // Inline mode is always "open"
  const [isAnimating, setIsAnimating] = useState(false); // Track animation state
  const [showUserInfoForm, setShowUserInfoForm] = useState(true); // Show form before chat starts
  const [userMobile, setUserMobile] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [userData, setUserData] = useState(null); // Store logged-in user data
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: initialMessage,
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showJobConfirm, setShowJobConfirm] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const lastAiMessageRef = useRef(null);
  const inputRef = useRef(null);
  const widgetRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const speechRecRef = useRef(null);
  
  // Drag and drop state
  const [buttonPosition, setButtonPosition] = useState({ x: null, y: null });
  const [widgetPosition, setWidgetPosition] = useState({ x: null, y: null });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isDraggingWidget, setIsDraggingWidget] = useState(false);
  const [widgetDragStart, setWidgetDragStart] = useState({ x: 0, y: 0 });
  const [hasDragged, setHasDragged] = useState(false);
  const [hasDraggedWidget, setHasDraggedWidget] = useState(false);

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // Generate session ID on mount
  useEffect(() => {
    if (!sessionId) {
      const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setSessionId(newSessionId);
    }
  }, [sessionId]);

  // Auto-initialize chat for logged-in users
  const handleAutoInitializeChat = async (user, currentSessionId) => {
    if (!user || !user.mobile) return;
    
    const mobile = user.mobile.toString().replace(/\D/g, '').slice(0, 10);
    if (mobile.length !== 10) return;

    try {
      // Use provided sessionId or generate new one
      const finalSessionId = currentSessionId || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      if (!currentSessionId) {
        setSessionId(finalSessionId);
      }

      // Initialize chat session in backend
      const response = await axios.post(
        `${backendUrl}/api/chat/init`,
        {
          mobile: mobile,
          email: (user.email || '').trim(),
          sessionId: finalSessionId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.status) {
        // If backend returns existing sessionId, use it
        if (response.data.sessionId && response.data.sessionId !== finalSessionId) {
          setSessionId(response.data.sessionId);
        }
        setShowUserInfoForm(false);
        
        // If existing session with messages, load them
        if (response.data.isExistingSession && response.data.messages && response.data.messages.length > 0) {
          // Load previous messages
          const previousMessages = response.data.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            isQA: msg.isQA || false,
            jobs: msg.jobs || [],
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(previousMessages);
        } else {
          // New session - add initial message
          setTimeout(async () => {
            await saveChatMessage({
              role: 'assistant',
              content: initialMessage,
              isQA: false,
              jobs: [],
            });
          }, 100);
        }
      }
    } catch (error) {
      console.error('Auto chat initialization error:', error);
      // If auto-init fails, show form
      setShowUserInfoForm(true);
    }
  };

  // Check for logged-in user on mount
  useEffect(() => {
    try {
      const storedUser = sessionStorage.getItem('user');
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUserData(parsedUser);
        
        // Auto-fill mobile and email if available
        if (parsedUser.mobile) {
          setUserMobile(parsedUser.mobile.toString().replace(/\D/g, '').slice(0, 10));
        }
        if (parsedUser.email) {
          setUserEmail(parsedUser.email);
        }
        
        // If user has mobile, auto-initialize chat (skip form)
        if (parsedUser.mobile && parsedUser.mobile.toString().replace(/\D/g, '').length === 10) {
          // Wait for sessionId to be generated, then auto-initialize
          const checkSessionAndInit = () => {
            if (sessionId) {
              handleAutoInitializeChat(parsedUser, sessionId);
            } else {
              // If sessionId not ready, generate one and use it
              const newSessionId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              setSessionId(newSessionId);
              handleAutoInitializeChat(parsedUser, newSessionId);
            }
          };
          
          // Small delay to ensure state is ready
          setTimeout(checkSessionAndInit, 100);
        }
      }
    } catch (error) {
      console.error('Error reading user data from sessionStorage:', error);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle user info form submit
  const handleUserInfoSubmit = async (e) => {
    e.preventDefault();
    if (!userMobile.trim() || userMobile.length !== 10) {
      alert('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      // Initialize chat session in backend
      const response = await axios.post(
        `${backendUrl}/api/chat/init`,
        {
          mobile: userMobile.trim(),
          email: userEmail.trim() || '',
          sessionId: sessionId,
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.data.status) {
        // If backend returns existing sessionId, use it
        if (response.data.sessionId && response.data.sessionId !== sessionId) {
          setSessionId(response.data.sessionId);
        }
        setShowUserInfoForm(false);
        
        // If existing session with messages, load them
        if (response.data.isExistingSession && response.data.messages && response.data.messages.length > 0) {
          // Load previous messages
          const previousMessages = response.data.messages.map(msg => ({
            role: msg.role,
            content: msg.content,
            isQA: msg.isQA || false,
            jobs: msg.jobs || [],
            timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
          }));
          setMessages(previousMessages);
        } else {
          // New session - add initial message
          await saveChatMessage({
            role: 'assistant',
            content: initialMessage,
            isQA: false,
            jobs: [],
          });
        }
      } else {
        throw new Error(response.data.message || 'Failed to initialize chat');
      }
    } catch (error) {
      console.error('Chat initialization error:', error);
      alert('Failed to start chat. Please try again.');
    }
  };

  // Save chat message to database
  const saveChatMessage = async (message) => {
    // Use userMobile from state or from userData
    const mobile = userMobile || (userData?.mobile?.toString().replace(/\D/g, '').slice(0, 10));
    if (!sessionId || !mobile) return;

    try {
      await axios.post(
        `${backendUrl}/api/chat/message`,
        {
          sessionId: sessionId,
          mobile: mobile.trim(),
          message: {
            role: message.role,
            content: message.content,
            isQA: message.isQA || false,
            jobs: message.jobs ? message.jobs.map(j => j._id || j.id).filter(Boolean) : [],
            timestamp: message.timestamp || new Date(),
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Error saving chat message:', error);
      // Don't show error to user, just log it
    }
  };

  // Auto-scroll to top of new AI message when it arrives
  useEffect(() => {
    // Wait for DOM to update
    setTimeout(() => {
      if (lastAiMessageRef.current && messagesContainerRef.current) {
        // Scroll the last AI message to the top of the visible area
        const container = messagesContainerRef.current;
        const messageElement = lastAiMessageRef.current;
        const containerRect = container.getBoundingClientRect();
        const messageRect = messageElement.getBoundingClientRect();
        
        // Calculate scroll position to show message at top
        const scrollTop = container.scrollTop + (messageRect.top - containerRect.top);
        container.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
      } else if (messagesEndRef.current) {
        // Fallback: scroll to end anchor
        messagesEndRef.current.scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, 100);
  }, [messages, isLoading, isTyping]);

  // Focus input when widget opens
  useEffect(() => {
    if (isOpen && mode === 'floating') {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 300);
    }
  }, [isOpen, mode]);

  // Initialize button position on mount
  useEffect(() => {
    if (mode === 'floating' && buttonPosition.x === null && buttonPosition.y === null) {
      const savedPosition = localStorage.getItem(`chatbot-button-pos-${position}`);
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          setButtonPosition({ x: pos.x, y: pos.y });
        } catch (e) {
          // Use default position
        }
      }
    }
  }, [mode, position, buttonPosition]);

  // Initialize widget position on mount
  useEffect(() => {
    if (mode === 'floating' && isOpen && widgetPosition.x === null && widgetPosition.y === null) {
      const savedPosition = localStorage.getItem(`chatbot-widget-pos-${position}`);
      if (savedPosition) {
        try {
          const pos = JSON.parse(savedPosition);
          setWidgetPosition({ x: pos.x, y: pos.y });
        } catch (e) {
          // Use default position
        }
      }
    }
  }, [mode, position, isOpen, widgetPosition]);

  // Handle window resize to keep elements in viewport
  useEffect(() => {
    const handleResize = () => {
      if (buttonPosition.x !== null && buttonPosition.y !== null) {
        const buttonSize = 60;
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;
        setButtonPosition(prev => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY)
        }));
      }
      if (widgetPosition.x !== null && widgetPosition.y !== null) {
        const widgetWidth = 400;
        const widgetHeight = 600;
        const maxX = window.innerWidth - widgetWidth;
        const maxY = window.innerHeight - widgetHeight;
        setWidgetPosition(prev => ({
          x: Math.min(prev.x, maxX),
          y: Math.min(prev.y, maxY)
        }));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [buttonPosition, widgetPosition]);

  // Drag handlers for toggle button
  useEffect(() => {
    if (!isDragging || mode !== 'floating' || isOpen) return;

    const handleMouseMove = (e) => {
      const buttonSize = 60;
      const minX = 0;
      const minY = 0;
      const maxX = window.innerWidth - buttonSize;
      const maxY = window.innerHeight - buttonSize;

      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setButtonPosition({ x: newX, y: newY });
      setHasDragged(true); // Mark that we've dragged
    };

    const handleMouseUp = (e) => {
      if (isDragging) {
        setIsDragging(false);
        if (buttonPosition.x !== null && buttonPosition.y !== null) {
          localStorage.setItem(`chatbot-button-pos-${position}`, JSON.stringify(buttonPosition));
        }
        // Prevent click event if we dragged
        if (hasDragged && e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setHasDragged(false);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const buttonSize = 60;
        const minX = 0;
        const minY = 0;
        const maxX = window.innerWidth - buttonSize;
        const maxY = window.innerHeight - buttonSize;

        let newX = e.touches[0].clientX - dragStart.x;
        let newY = e.touches[0].clientY - dragStart.y;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        setButtonPosition({ x: newX, y: newY });
        setHasDragged(true); // Mark that we've dragged
      }
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      if (isDragging) {
        setIsDragging(false);
        if (buttonPosition.x !== null && buttonPosition.y !== null) {
          localStorage.setItem(`chatbot-button-pos-${position}`, JSON.stringify(buttonPosition));
        }
        // Prevent click event if we dragged
        if (hasDragged && e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setHasDragged(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart, buttonPosition, position, mode, isOpen, hasDragged]);

  // Drag handlers for widget
  useEffect(() => {
    if (!isDraggingWidget || mode !== 'floating' || !isOpen) return;

    const handleMouseMove = (e) => {
      const widgetWidth = 400;
      const widgetHeight = 600;
      const minX = 0;
      const minY = 0;
      const maxX = window.innerWidth - widgetWidth;
      const maxY = window.innerHeight - widgetHeight;

      let newX = e.clientX - widgetDragStart.x;
      let newY = e.clientY - widgetDragStart.y;

      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));

      setWidgetPosition({ x: newX, y: newY });
      setHasDraggedWidget(true); // Mark that we've dragged
    };

    const handleMouseUp = (e) => {
      if (isDraggingWidget) {
        setIsDraggingWidget(false);
        if (widgetPosition.x !== null && widgetPosition.y !== null) {
          localStorage.setItem(`chatbot-widget-pos-${position}`, JSON.stringify(widgetPosition));
        }
        // Prevent click event if we dragged
        if (hasDraggedWidget && e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setHasDraggedWidget(false);
      }
    };

    const handleTouchMove = (e) => {
      if (e.touches.length > 0) {
        const widgetWidth = 400;
        const widgetHeight = 600;
        const minX = 0;
        const minY = 0;
        const maxX = window.innerWidth - widgetWidth;
        const maxY = window.innerHeight - widgetHeight;

        let newX = e.touches[0].clientX - widgetDragStart.x;
        let newY = e.touches[0].clientY - widgetDragStart.y;

        newX = Math.max(minX, Math.min(maxX, newX));
        newY = Math.max(minY, Math.min(maxY, newY));

        setWidgetPosition({ x: newX, y: newY });
        setHasDraggedWidget(true); // Mark that we've dragged
      }
      e.preventDefault();
    };

    const handleTouchEnd = (e) => {
      if (isDraggingWidget) {
        setIsDraggingWidget(false);
        if (widgetPosition.x !== null && widgetPosition.y !== null) {
          localStorage.setItem(`chatbot-widget-pos-${position}`, JSON.stringify(widgetPosition));
        }
        // Prevent click event if we dragged
        if (hasDraggedWidget && e) {
          e.preventDefault();
          e.stopPropagation();
        }
        setHasDraggedWidget(false);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDraggingWidget, widgetDragStart, widgetPosition, position, mode, isOpen, hasDraggedWidget]);

  // Close widget when clicking outside (only for floating mode)
  useEffect(() => {
    if (mode === 'floating' && isOpen && !isDraggingWidget) {
      const handleClickOutside = (event) => {
        if (widgetRef.current && !widgetRef.current.contains(event.target)) {
          // Don't close if clicking the toggle button
          const toggleButton = document.querySelector('.chatbot-toggle-button');
          if (toggleButton && toggleButton.contains(event.target)) {
            return;
          }
        }
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, mode, isDraggingWidget]);

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
    
    // Save user message to database
    await saveChatMessage(newUserMessage);
    
    setIsLoading(true);
    setIsTyping(true);

    try {
      // Extract preferences from user message
      const preferences = extractPreferences(userMessage);

      // Merge with job preferences from parent
      const mergedPreferences = {
        ...preferences,
        stateName: jobPreferences?.stateName || preferences.state,
        cityName: jobPreferences?.cityName || preferences.city,
        maxExperienceYears: jobPreferences?.maxExperienceYears || preferences.maxExperienceYears,
        minSalary: jobPreferences?.minSalary || preferences.minSalary,
      };

      // Call AI API
      const response = await axios.post(
        `${backendUrl}/api/ai/job-recommendations`,
        {
          userQuery: userMessage,
          preferences: mergedPreferences,
          userProfile: {
            skills: [],
            experience: 0,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      // Check if it's a Q&A response (FAQ answer)
      if (response.data.status && response.data.isQA && response.data.answer) {
        const newAiMessage = {
          role: 'assistant',
          content: response.data.answer,
          isQA: true,
          query: userMessage,
          jobs: [],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
        
        // Save AI message to database
        await saveChatMessage(newAiMessage);
      } else if (response.data.status && response.data.jobs) {
        const jobs = response.data.jobs;
        
        // Update jobs list in parent if callback provided
        if (onJobsUpdate) {
          onJobsUpdate(jobs);
        }
        
        // Format AI response with nearby jobs message if applicable
        let aiResponse = '';
        if (response.data.showNearbyMessage && response.data.requestedCity) {
          aiResponse = `📍 No jobs found in ${response.data.requestedCity}.\n\n`;
          aiResponse += `Showing nearby jobs in ${response.data.actualLocation || 'the same state'}:\n\n`;
          aiResponse += `🎯 Found ${jobs.length} job${jobs.length > 1 ? 's' : ''} nearby!\n\n`;
          aiResponse += `Check out these opportunities below 👇`;
        } else {
          aiResponse = `🎯 Found ${jobs.length} perfect job${jobs.length > 1 ? 's' : ''} for you!\n\nI've found some great opportunities that match your search. Check out the top recommendations below 👇`;
        }

        // Add AI response to chat
        const newAiMessage = {
          role: 'assistant',
          content: aiResponse,
          jobs: jobs,
          query: userMessage,
          visibleJobsCount: 3,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
        
        // Save AI message to database
        await saveChatMessage(newAiMessage);
      } else {
        throw new Error('No jobs found');
      }
    } catch (error) {
      console.error('AI Chatbot Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.response?.data?.message || error.message}. Please try again.`,
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
    const urlRegex = /(https?:\/\/[^\s\n]+)/g;
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
              className="chatbot-link"
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

      for (const city of cities) {
        if (lowerQuery.includes(city)) {
          preferences.city = city.split(' ').map(word =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ');
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
          content: initialMessage,
          timestamp: new Date(),
        },
      ]);
    }
  };

  /**
   * Handle job click - Show confirmation popup
   */
  const handleJobClick = (job) => {
    setSelectedJob(job);
    setShowJobConfirm(true);
  };

  /**
   * Handle job confirmation - Yes
   */
  const handleJobConfirmYes = async () => {
    if (selectedJob) {
      const jobId = selectedJob._id || selectedJob.id;
      if (!jobId) {
        console.error('Job ID not found:', selectedJob);
        alert('Error: Job ID not found. Please try again.');
        setShowJobConfirm(false);
        setSelectedJob(null);
        return;
      }

      // If redirectToPortal is true, redirect to candidate portal
      if (redirectToPortal) {
        window.open(`/candidate/login?returnUrl=/candidate/job/${jobId}`, '_blank');
        setShowJobConfirm(false);
        setSelectedJob(null);
        return;
      }

      // Otherwise, apply directly from chatbot
      const mobile = userMobile || (userData?.mobile?.toString().replace(/\D/g, '').slice(0, 10));
      
      if (!mobile || mobile.length !== 10) {
        alert('Please provide your mobile number first to apply for jobs.');
        setShowJobConfirm(false);
        setSelectedJob(null);
        return;
      }

      // Apply job directly from chatbot
      try {
        const response = await axios.post(
          `${backendUrl}/applyjob/${jobId}`,
          { mobile: mobile.trim() },
          {
            headers: { 'Content-Type': 'application/json' },
          }
        );

        if (response.data.status) {
          // Show success message in chat
          const successMessage = {
            role: 'assistant',
            content: `✅ Successfully applied to "${selectedJob.title || selectedJob.name}"! We'll notify you about the next steps.`,
            timestamp: new Date(),
          };
          setMessages((prev) => [...prev, successMessage]);
          await saveChatMessage(successMessage);
        } else {
          throw new Error(response.data.msg || 'Application failed');
        }
      } catch (error) {
        const errorMsg = error.response?.data?.msg || error.message || 'Failed to apply. Please try again.';
        const errorMessage = {
          role: 'assistant',
          content: `❌ ${errorMsg}`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
        await saveChatMessage(errorMessage);
      }
    }
    setShowJobConfirm(false);
    setSelectedJob(null);
  };

  /**
   * Handle job confirmation - No
   */
  const handleJobConfirmNo = () => {
    setShowJobConfirm(false);
    setSelectedJob(null);
  };

  /**
   * Update visible jobs count for a message
   */
  const updateMsgVisibleJobs = (msgIndex, nextCount) => {
    setMessages((prev) =>
      prev.map((m, i) => (i === msgIndex ? { ...m, visibleJobsCount: nextCount } : m))
    );
  };

  /**
   * Handle refine search
   */
  const handleRefine = (baseQuery, refineText) => {
    if (onRefineSearch) {
      onRefineSearch(baseQuery, refineText);
    } else {
      const q = `${(baseQuery || "").trim()} ${refineText}`.trim();
      setInputMessage(q);
      setTimeout(() => {
        handleSendMessage({ preventDefault: () => {} });
      }, 100);
    }
  };

  /**
   * Handle share job
   */
  const handleShare = (job) => {
    if (onShareJob) {
      onShareJob(job);
    } else {
      // Default share behavior
      const jobUrl = `${window.location.origin}/candidate/login?returnUrl=/candidate/job/${job._id}`;
      navigator.clipboard.writeText(jobUrl).then(() => {
        alert('Job link copied to clipboard!');
      });
    }
  };

  /**
   * Handle voice input
   */
  const handleVoiceInput = () => {
    // Stop any existing recognition
    if (speechRecRef.current) {
      try {
        speechRecRef.current.stop();
      } catch (e) {
        // Ignore errors when stopping
      }
      speechRecRef.current = null;
    }
    
    // Always use built-in voice recognition for chatbot widget
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert('Voice recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }
    
    try {
      const rec = new SR();
      speechRecRef.current = rec;
      rec.lang = "en-IN";
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.continuous = false;
      
      rec.onstart = () => {
        console.log('Voice recognition started');
        setIsLoading(true);
      };
      
      rec.onresult = (event) => {
        const text = event?.results?.[0]?.[0]?.transcript || "";
        console.log('Voice recognition result:', text);
        if (text && text.trim()) {
          setInputMessage(text);
          // Auto-trigger search after voice input
          setTimeout(() => {
            handleSendMessage({ preventDefault: () => {} });
          }, 200);
        }
        setIsLoading(false);
        speechRecRef.current = null;
      };
      
      rec.onerror = (event) => {
        console.error('Voice recognition error:', event.error);
        setIsLoading(false);
        speechRecRef.current = null;
        if (event.error === 'no-speech') {
          alert('No speech detected. Please try again.');
        } else if (event.error === 'not-allowed') {
          alert('Microphone permission denied. Please allow microphone access and try again.');
        } else if (event.error !== 'aborted') {
          alert('Voice recognition error: ' + event.error);
        }
      };
      
      rec.onend = () => {
        console.log('Voice recognition ended');
        setIsLoading(false);
        speechRecRef.current = null;
      };
      
      rec.start();
    } catch (e) {
      console.error('Voice recognition error:', e);
      alert('Failed to start voice recognition: ' + e.message);
      setIsLoading(false);
      speechRecRef.current = null;
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

  const handleQuickAction = async (query) => {
    if (isLoading) return; // Don't trigger if already loading
    
    // Set input message
    setInputMessage(query);
    
    // Add user message immediately
    const newUserMessage = {
      role: 'user',
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newUserMessage]);
    
    // Save user message to database
    await saveChatMessage(newUserMessage);
    
    setIsLoading(true);
    setIsTyping(true);
    
    // Trigger search immediately
    try {
      const preferences = extractPreferences(query);
      const mergedPreferences = {
        ...preferences,
        stateName: jobPreferences?.stateName || preferences.state,
        cityName: jobPreferences?.cityName || preferences.city,
        maxExperienceYears: jobPreferences?.maxExperienceYears || preferences.maxExperienceYears,
        minSalary: jobPreferences?.minSalary || preferences.minSalary,
      };

      const response = await axios.post(
        `${backendUrl}/api/ai/job-recommendations`,
        {
          userQuery: query,
          preferences: mergedPreferences,
          userProfile: {
            skills: [],
            experience: 0,
          },
        },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 30000,
        }
      );

      // Check if it's a Q&A response (FAQ answer)
      if (response.data.status && response.data.isQA && response.data.answer) {
        const newAiMessage = {
          role: 'assistant',
          content: response.data.answer,
          isQA: true,
          query: query,
          jobs: [],
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
        
        // Save AI message to database
        await saveChatMessage(newAiMessage);
      } else if (response.data.status && response.data.jobs) {
        const jobs = response.data.jobs;
        
        // Update jobs list in parent if callback provided
        if (onJobsUpdate) {
          onJobsUpdate(jobs);
        }
        
        // Format AI response
        let aiResponse = '';
        if (response.data.showNearbyMessage && response.data.requestedCity) {
          aiResponse = `📍 No jobs found in ${response.data.requestedCity}.\n\n`;
          aiResponse += `Showing nearby jobs in ${response.data.actualLocation || 'the same state'}:\n\n`;
          aiResponse += `🎯 Found ${jobs.length} job${jobs.length > 1 ? 's' : ''} nearby!\n\n`;
          aiResponse += `Check out these opportunities below 👇`;
        } else {
          aiResponse = `🎯 Found ${jobs.length} perfect job${jobs.length > 1 ? 's' : ''} for you!\n\nI've found some great opportunities that match your search. Check out the top recommendations below 👇`;
        }

        const newAiMessage = {
          role: 'assistant',
          content: aiResponse,
          jobs: jobs,
          query: query,
          visibleJobsCount: 3,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, newAiMessage]);
        
        // Save AI message to database
        await saveChatMessage(newAiMessage);
        
        // Save AI message to database
        await saveChatMessage(newAiMessage);
      } else {
        throw new Error('No jobs found');
      }
    } catch (error) {
      console.error('AI Chatbot Error:', error);
      const errorMessage = {
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${error.response?.data?.message || error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsTyping(false);
      setInputMessage(''); // Clear input after search
      inputRef.current?.focus();
    }
  };

  // Handle toggle button drag start
  const handleToggleDragStart = (e) => {
    if (e.button !== 0 && e.type !== 'touchstart') return; // Only left mouse button
    setHasDragged(false);
    const rect = toggleButtonRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      
      // Calculate initial drag offset
      const currentX = buttonPosition.x !== null ? buttonPosition.x : rect.left;
      const currentY = buttonPosition.y !== null ? buttonPosition.y : rect.top;
      
      setDragStart({
        x: clientX - currentX,
        y: clientY - currentY
      });
      setIsDragging(true);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  // Handle widget header drag start
  const handleWidgetDragStart = (e) => {
    if (e.button !== 0 && e.type !== 'touchstart') return; // Only left mouse button
    setHasDraggedWidget(false);
    const rect = widgetRef.current?.getBoundingClientRect();
    if (rect) {
      const clientX = e.clientX || e.touches?.[0]?.clientX || 0;
      const clientY = e.clientY || e.touches?.[0]?.clientY || 0;
      
      // Calculate initial drag offset
      const currentX = widgetPosition.x !== null ? widgetPosition.x : rect.left;
      const currentY = widgetPosition.y !== null ? widgetPosition.y : rect.top;
      
      setWidgetDragStart({
        x: clientX - currentX,
        y: clientY - currentY
      });
      setIsDraggingWidget(true);
    }
    e.preventDefault();
    e.stopPropagation();
  };

  // Render floating toggle button (when closed and not animating)
  const showToggleButton = mode === 'floating' && !isOpen && !isAnimating;
  
  if (showToggleButton) {
    const buttonStyle = buttonPosition.x !== null && buttonPosition.y !== null
      ? { left: `${buttonPosition.x}px`, top: `${buttonPosition.y}px`, right: 'auto', bottom: 'auto' }
      : {};
    
    return (
      <button
        ref={toggleButtonRef}
        className={`chatbot-toggle-button chatbot-toggle-${position} ${className} ${isDragging ? 'dragging' : ''}`}
        onClick={(e) => {
          // Only open if not dragging
          if (!isDragging && !hasDragged) {
            setIsAnimating(false);
            setIsOpen(true);
          }
        }}
        onMouseDown={handleToggleDragStart}
        onTouchStart={handleToggleDragStart}
        style={buttonStyle}
        title={title}
        aria-label="Open AI Chatbot"
      >
        <FontAwesomeIcon icon={faCommentDots} />
        <span className="chatbot-badge">AI</span>
      </button>
    );
  }

  // Render chatbot widget
  const widgetStyle = mode === 'floating' && widgetPosition.x !== null && widgetPosition.y !== null
    ? { left: `${widgetPosition.x}px`, top: `${widgetPosition.y}px`, right: 'auto', bottom: 'auto' }
    : {};

  return (
    <div
      ref={widgetRef}
      className={`chatbot-widget chatbot-widget-${mode} chatbot-widget-${position} ${className} ${isDraggingWidget ? 'dragging' : ''} ${isOpen && !isAnimating ? 'chatbot-open' : isAnimating ? 'chatbot-closing' : 'chatbot-closed'}`}
      style={widgetStyle}
    >
      {/* Header - Draggable */}
      <div 
        className="chatbot-header"
        onMouseDown={handleWidgetDragStart}
        onTouchStart={handleWidgetDragStart}
        style={{ cursor: isDraggingWidget ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        <div className="d-flex align-items-center gap-3">
          <div className="ai-avatar">
            <FontAwesomeIcon icon={faRobot} />
          </div>
          <div>
            <h5 className="mb-0">{title}</h5>
            <p className="mb-0 text-muted small">Powered by Anthropic Claude</p>
          </div>
        </div>
        {mode === 'floating' && (
          <button
            className="btn btn-sm btn-outline-light"
            onClick={(e) => {
              e.stopPropagation();
              // Start closing animation
              setIsAnimating(true);
              // Close after animation completes
              setTimeout(() => {
                setIsOpen(false);
                setIsAnimating(false);
              }, 300); // Match CSS transition duration
            }}
            title="Close Chat"
            aria-label="Close Chat"
          >
            <FontAwesomeIcon icon={faTimes} />
          </button>
        )}
      </div>

      {/* User Info Form - Show before chat starts (only if user not logged in) */}
      {showUserInfoForm && (
        <div className="user-info-form-container">
          <div className="card border-0 shadow-sm">
            <div className="card-body p-4">
              {userData ? (
                <div className="mb-3">
                  <div className="alert alert-info small mb-3">
                    <strong>👤 Logged in as:</strong> {userData.name || 'User'}
                    {userData.mobile && <div className="mt-1">📱 {userData.mobile}</div>}
                  </div>
                </div>
              ) : (
                <h6 className="mb-3">📝 Please provide your details to start chatting</h6>
              )}
              <form onSubmit={handleUserInfoSubmit}>
                <div className="mb-3">
                  <label htmlFor="userMobile" className="form-label small">
                    Mobile Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control form-control-sm"
                    id="userMobile"
                    placeholder="Enter 10-digit mobile number"
                    value={userMobile}
                    onChange={(e) => setUserMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    required
                    pattern="[0-9]{10}"
                    maxLength="10"
                    disabled={userData?.mobile ? true : false}
                  />
                  {userData?.mobile && (
                    <small className="text-muted">Using your logged-in mobile number</small>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="userEmail" className="form-label small">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    className="form-control form-control-sm"
                    id="userEmail"
                    placeholder="Enter your email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    disabled={userData?.email ? true : false}
                  />
                  {userData?.email && (
                    <small className="text-muted">Using your logged-in email</small>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm w-100"
                  disabled={!userMobile.trim() || userMobile.length !== 10}
                >
                  {userData ? 'Continue Chat' : 'Start Chat'}
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      {!showUserInfoForm && (
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
      )}

      {/* Messages Area */}
      {!showUserInfoForm && (
      <div className="messages-container" ref={messagesContainerRef}>
        {messages.map((message, index) => {
          // Check if this is the last AI message
          const isLastAiMessage = message.role === 'assistant' && 
            index === messages.length - 1 && 
            !isTyping;
          
          return (
            <div
              key={index}
              ref={isLastAiMessage ? lastAiMessageRef : null}
              className={`message ${message.role === 'user' ? 'user-message' : 'ai-message'}`}
            >
            <div className="message-content">
              {message.role === 'assistant' && (
                <div className="ai-avatar-small">
                  <FontAwesomeIcon icon={faRobot} />
                </div>
              )}
              <div className="message-bubble">
                <div className={`message-text ${message.isQA ? 'qa-answer-text' : ''}`}>
                  {message.isQA ? (
                    <div className="qa-answer-container">
                      <div className="qa-answer-content">
                        {convertUrlsToLinks(message.content)}
                      </div>
                    </div>
                  ) : (
                    convertUrlsToLinks(message.content)
                  )}
                </div>
                {message.jobs && message.jobs.length > 0 && (
                  <div className="job-cards-preview">
                    <div className="row g-2 mt-2">
                      {message.jobs.slice(0, message.visibleJobsCount || 3).map((job, idx) => {
                        const salary = job.isFixed 
                          ? `₹${job.amount?.toLocaleString('en-IN') || 'N/A'}` 
                          : `₹${job.min?.toLocaleString('en-IN') || 'N/A'} - ₹${job.max?.toLocaleString('en-IN') || 'N/A'}`;
                        const location = `${job.city?.name || 'N/A'}${job.state?.name ? `, ${job.state.name}` : ''}`;
                        
                        return (
                          <div key={job._id} className="col-12">
                            <div 
                              className="job-card-mini" 
                              onClick={() => handleJobClick(job)}
                              style={{ cursor: 'pointer' }}
                            >
                              <h6 className="job-title-mini">{job.title || job.name}</h6>
                              <p className="job-company-mini mb-1">
                                💼 {job._company?.name || job.displayCompanyName || 'N/A'}
                              </p>
                              <p className="job-location-mini mb-1">
                                📍 {location}
                              </p>
                              <p className="job-salary-mini mb-1">
                                💰 {salary}
                              </p>
                              {job.experience !== undefined && (
                                <p className="job-salary-mini mb-2">
                                  ⏳ {job.experience} {job.experience === 1 ? 'year' : 'years'} exp
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {(message.visibleJobsCount || 3) < message.jobs.length && (
                      <div className="d-flex gap-2 justify-content-center mt-2">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            const msgIndex = messages.findIndex(m => m === message);
                            updateMsgVisibleJobs(msgIndex, Math.min((message.visibleJobsCount || 3) + 3, message.jobs.length));
                          }}
                        >
                          Load more
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => {
                            const msgIndex = messages.findIndex(m => m === message);
                            updateMsgVisibleJobs(msgIndex, message.jobs.length);
                          }}
                        >
                          View all
                        </button>
                      </div>
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
          );
        })}

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

        {/* Scroll anchor - positioned at the start of new messages */}
        <div ref={messagesEndRef} style={{ height: '1px', marginTop: '10px' }} />
      </div>
      )}

      {/* Job Application Confirmation Modal - Inside Chatbot */}
      {showJobConfirm && selectedJob && (
        <div className="job-confirm-overlay-inner" onClick={handleJobConfirmNo}>
          <div className="job-confirm-modal-inner" onClick={(e) => e.stopPropagation()}>
            <div className="job-confirm-header">
              <h5>Apply for this job?</h5>
            </div>
            <div className="job-confirm-body">
              <p className="mb-2">
                <strong>{selectedJob.title || selectedJob.name}</strong>
              </p>
              <p className="text-muted small mb-3">
                {selectedJob._company?.name || selectedJob.displayCompanyName || 'N/A'}
              </p>
              <p>Do you want to apply for this job?</p>
            </div>
            <div className="job-confirm-actions">
              <button
                className="btn btn-primary"
                onClick={handleJobConfirmYes}
              >
                Yes
              </button>
              <button
                className="btn btn-secondary"
                onClick={handleJobConfirmNo}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      {!showUserInfoForm && (
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
            {(voiceSupported || onVoiceInput) && (
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={handleVoiceInput}
                disabled={isLoading}
                title="Voice input"
              >
                🎙️
              </button>
            )}
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
        </form>
      )}
    </div>
  );
}

export default ChatbotWidget;

