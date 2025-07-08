import { useState, useEffect, useRef } from "react"
import { MessageCircle, CheckCircle, AlertCircle, Copy, Send, Users, Activity, Wifi, WifiOff } from "lucide-react"
import axios from "axios"
import websocketClient from "../../../../utils/websocket"
import { toast } from "react-toastify"

export default function WhatsAppWithWebSocket() {
  const [connectionStep, setConnectionStep] = useState(1)
  const [isConnected, setIsConnected] = useState(false)
  const [accessToken, setAccessToken] = useState("")
  const [facebookConnected, setFacebookConnected] = useState(false)
  const [businessAccounts, setBusinessAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [userInfo, setUserInfo] = useState(null)
  const [sdkLoaded, setSdkLoaded] = useState(false)
  const [activeTab, setActiveTab] = useState("setup")
  
  // WebSocket related states
  const [wsConnected, setWsConnected] = useState(false)
  const [wsStatus, setWsStatus] = useState("disconnected")
  const [notifications, setNotifications] = useState([])
  const [messageHistory, setMessageHistory] = useState([])
  const [recipientPhone, setRecipientPhone] = useState("")
  const [messageText, setMessageText] = useState("")
  const [sendingMessage, setSendingMessage] = useState(false)
  
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL
  const token = localStorage.getItem('token')

  // Facebook App ID - Replace with your actual App ID
  const FACEBOOK_APP_ID = "YOUR_FACEBOOK_APP_ID"

  // Initialize WebSocket connection
  useEffect(() => {
    if (token) {
      websocketClient.setToken(token)
      websocketClient.connect()
      
      // Set up WebSocket event handlers
      websocketClient.onConnection('connected', () => {
        setWsConnected(true)
        setWsStatus('connected')
        toast.success('WebSocket connected successfully')
      })
      
      websocketClient.onConnection('disconnected', () => {
        setWsConnected(false)
        setWsStatus('disconnected')
        toast.warning('WebSocket disconnected')
      })
      
      websocketClient.onConnection('error', (error) => {
        setWsStatus('error')
        toast.error('WebSocket connection error')
      })
      
      // Set up message handlers
      websocketClient.onMessage('whatsapp_notification', (message) => {
        const { notification } = message
        setNotifications(prev => [notification, ...prev.slice(0, 9)]) // Keep last 10 notifications
        
        // Show toast based on notification type
        switch (notification.type) {
          case 'message_sent':
            toast.success(`Message sent to ${notification.recipientPhone}`)
            break
          case 'message_error':
            toast.error(`Failed to send message: ${notification.error}`)
            break
          case 'bulk_message_completed':
            toast.info(`Bulk message completed: ${notification.successCount} successful, ${notification.failedCount} failed`)
            break
          case 'config_updated':
            toast.success('WhatsApp configuration updated')
            break
          default:
            console.log('WhatsApp notification:', notification)
        }
      })
      
      websocketClient.onMessage('message_sent', (message) => {
        setMessageHistory(prev => [{
          id: message.messageId,
          type: 'sent',
          timestamp: message.timestamp,
          status: 'sent'
        }, ...prev])
      })
      
      // Start heartbeat
      websocketClient.startHeartbeat()
      
      return () => {
        websocketClient.disconnect()
        websocketClient.stopHeartbeat()
      }
    }
  }, [token])

  // Load Bootstrap CSS and JS
  useEffect(() => {
    const bootstrapCSS = document.createElement("link")
    bootstrapCSS.rel = "stylesheet"
    bootstrapCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
    document.head.appendChild(bootstrapCSS)

    const bootstrapJS = document.createElement("script")
    bootstrapJS.src = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"
    document.head.appendChild(bootstrapJS)

    return () => {
      document.head.removeChild(bootstrapCSS)
      document.head.removeChild(bootstrapJS)
    }
  }, [])

  // Load Facebook SDK
  useEffect(() => {
    const loadFacebookSDK = () => {
      if (window.FB) {
        setSdkLoaded(true)
        return
      }

      const script = document.createElement("script")
      script.src = "https://connect.facebook.net/en_US/sdk.js"
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"

      window.fbAsyncInit = () => {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        })

        setSdkLoaded(true)

        window.FB.getLoginStatus((response) => {
          if (response.status === "connected") {
            setFacebookConnected(true)
            setAccessToken(response.authResponse.accessToken)
            getUserInfo(response.authResponse.accessToken)
          }
        })
      }

      document.body.appendChild(script)
    }

    loadFacebookSDK()
  }, [])

  // Get user information
  const getUserInfo = (token) => {
    window.FB.api("/me", { fields: "name,email,picture" }, (response) => {
      if (response && !response.error) {
        setUserInfo(response)
      }
    })
  }

  // Get business accounts
  const getBusinessAccounts = async (token) => {
    try {
      setLoading(true)

      window.FB.api("/me/businesses", { access_token: token }, (response) => {
        if (response && response.data) {
          const businesses = response.data.map((business) => ({
            id: business.id,
            name: business.name,
            verification_status: business.verification_status,
          }))

          businesses.forEach((business) => {
            window.FB.api(
              `/${business.id}/client_whatsapp_business_accounts`,
              { access_token: token },
              (wabaResponse) => {
                if (wabaResponse && wabaResponse.data) {
                  const accounts = wabaResponse.data.map((account) => ({
                    id: account.id,
                    name: account.name,
                    business_id: business.id,
                    business_name: business.name,
                    phone: account.phone_number || "Not configured",
                  }))

                  setBusinessAccounts((prev) => [...prev, ...accounts])
                }
              },
            )
          })
        }
        setLoading(false)
      })
    } catch (error) {
      console.error("Error fetching business accounts:", error)
      setError("Failed to fetch business accounts")
      setLoading(false)
    }
  }

  // Main Facebook login function
  const handleFacebookLogin = async () => {
    if (!sdkLoaded) {
      setError("Facebook SDK not loaded yet. Please try again.")
      return
    }

    setLoading(true)
    setError("")

    try {
      window.FB.login(
        (response) => {
          if (response.authResponse) {
            const { accessToken: fbToken } = response.authResponse

            setFacebookConnected(true)
            setAccessToken(fbToken)
            setConnectionStep(2)

            getUserInfo(fbToken)
            getBusinessAccounts(fbToken)

            setLoading(false)
          } else {
            setError("Facebook login was cancelled or failed")
            setLoading(false)
          }
        },
        {
          scope: "whatsapp_business_management,business_management,pages_read_engagement",
          return_scopes: true,
        },
      )
    } catch (error) {
      console.error("Facebook login error:", error)
      setError("Failed to connect to Facebook")
      setLoading(false)
    }
  }

  // Generate long-lived access token
  const generateLongLivedToken = async () => {
    if (!accessToken) return

    setLoading(true)
    try {
      const response = await fetch(
        `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${FACEBOOK_APP_ID}&client_secret=YOUR_APP_SECRET&fb_exchange_token=${accessToken}`,
      )

      const data = await response.json()

      if (data.access_token) {
        setAccessToken(data.access_token)
        setConnectionStep(3)
      } else {
        setError("Failed to generate long-lived token")
      }
    } catch (error) {
      console.error("Token exchange error:", error)
      setError("Failed to generate long-lived token")
    }
    setLoading(false)
  }

  // Save WhatsApp configuration
  const saveWhatsAppConfig = async () => {
    if (!accessToken || !selectedAccount) {
      toast.error("Please complete the setup first")
      return
    }

    try {
      setLoading(true)
      
      const selectedAccountData = businessAccounts.find(acc => acc.id === selectedAccount)
      
      const response = await axios.post(`${backendUrl}/college/whatsapp/save-config`, {
        accessToken,
        businessAccountId: selectedAccount,
        phoneNumber: selectedAccountData?.phone
      }, {
        headers: { 'x-auth': token }
      })

      if (response.data.status) {
        setIsConnected(true)
        setConnectionStep(4)
        toast.success("WhatsApp configuration saved successfully")
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Save config error:", error)
      toast.error("Failed to save configuration")
    } finally {
      setLoading(false)
    }
  }

  // Send WhatsApp message
  const sendWhatsAppMessage = async () => {
    if (!recipientPhone || !messageText.trim()) {
      toast.error("Please enter recipient phone and message")
      return
    }

    try {
      setSendingMessage(true)
      
      const response = await axios.post(`${backendUrl}/college/whatsapp/send-message`, {
        recipientPhone,
        message: messageText,
        messageType: 'text'
      }, {
        headers: { 'x-auth': token }
      })

      if (response.data.status) {
        setMessageText("")
        toast.success("Message sent successfully")
        
        // Add to message history
        setMessageHistory(prev => [{
          id: response.data.data.messageId,
          type: 'sent',
          recipientPhone,
          message: messageText,
          timestamp: new Date().toISOString(),
          status: 'sent'
        }, ...prev])
      } else {
        toast.error(response.data.message)
      }
    } catch (error) {
      console.error("Send message error:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  // Get WhatsApp status
  const getWhatsAppStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/whatsapp/status`, {
        headers: { 'x-auth': token }
      })

      if (response.data.status) {
        const status = response.data.data
        setIsConnected(status.connected)
        if (status.connected) {
          setConnectionStep(4)
        }
      }
    } catch (error) {
      console.error("Get status error:", error)
    }
  }

  // Load status on component mount
  useEffect(() => {
    if (token) {
      getWhatsAppStatus()
    }
  }, [token])

  // Logout function
  const handleLogout = () => {
    window.FB.logout(() => {
      setFacebookConnected(false)
      setAccessToken("")
      setUserInfo(null)
      setBusinessAccounts([])
      setSelectedAccount("")
      setConnectionStep(1)
      setIsConnected(false)
    })
  }

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
    toast.success("Copied to clipboard")
  }

  // Test API connection
  const testConnection = async () => {
    if (!accessToken || !selectedAccount) return

    setLoading(true)
    try {
      window.FB.api(`/${selectedAccount}`, { access_token: accessToken }, (response) => {
        if (response && !response.error) {
          toast.success("Connection successful! ✅")
        } else {
          toast.error("Connection failed: " + (response.error?.message || "Unknown error"))
        }
        setLoading(false)
      })
    } catch (error) {
      console.error("Test connection error:", error)
      toast.error("Connection test failed")
      setLoading(false)
    }
  }

  return (
    <div className="min-vh-100" style={{ background: "linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 50%, #fce4ec 100%)" }}>
      {/* Header */}
      <header className="border-bottom bg-white bg-opacity-90">
        <div className="container py-3">
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <div 
                className="d-flex align-items-center justify-content-center rounded-3"
                style={{ 
                  width: "40px", 
                  height: "40px", 
                  background: "linear-gradient(135deg, #1976d2, #7b1fa2)" 
                }}
              >
                <MessageCircle className="text-white" size={24} />
              </div>
              <div>
                <h1 className="h5 fw-bold text-dark mb-0">WhatsApp Business Connector</h1>
                <p className="small text-muted mb-0">Real-time messaging with WebSocket integration</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              {/* WebSocket Status */}
              <span className={`badge d-flex align-items-center gap-1 ${wsConnected ? "bg-success" : "bg-secondary"}`}>
                {wsConnected ? <Wifi size={12} /> : <WifiOff size={12} />}
                {wsConnected ? "WebSocket Connected" : "WebSocket Disconnected"}
              </span>
              
              <span className={`badge d-flex align-items-center gap-1 ${isConnected ? "bg-success" : "bg-secondary"}`}>
                <div 
                  className="rounded-circle"
                  style={{ 
                    width: "8px", 
                    height: "8px", 
                    backgroundColor: isConnected ? "#ffffff" : "#dee2e6" 
                  }}
                />
                {isConnected ? "WhatsApp Connected" : "Setup Required"}
              </span>
              
              {facebookConnected && (
                <button 
                  onClick={handleLogout}
                  className="btn btn-outline-secondary btn-sm"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="container py-4">
        {/* Error Alert */}
        {error && (
          <div className="alert alert-danger d-flex align-items-start mb-4" role="alert">
            <AlertCircle className="text-danger me-2 mt-1" size={20} />
            <div>{error}</div>
          </div>
        )}

        <div className="mb-4">
          {/* Tab Navigation */}
          <ul className="nav nav-tabs">
            <li className="nav-item">
              <button 
                onClick={() => setActiveTab("setup")}
                className={`nav-link d-flex align-items-center gap-2 ${activeTab === "setup" ? "active" : ""}`}
              >
                📱 Setup
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => setActiveTab("messaging")}
                className={`nav-link d-flex align-items-center gap-2 ${activeTab === "messaging" ? "active" : ""}`}
              >
                💬 Messaging
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => setActiveTab("notifications")}
                className={`nav-link d-flex align-items-center gap-2 ${activeTab === "notifications" ? "active" : ""}`}
              >
                🔔 Notifications
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => setActiveTab("tokens")}
                className={`nav-link d-flex align-items-center gap-2 ${activeTab === "tokens" ? "active" : ""}`}
              >
                🔑 Tokens
              </button>
            </li>
            <li className="nav-item">
              <button 
                onClick={() => setActiveTab("test")}
                className={`nav-link d-flex align-items-center gap-2 ${activeTab === "test" ? "active" : ""}`}
              >
                🛡️ Test
              </button>
            </li>
          </ul>

          {/* Setup Tab Content */}
          {activeTab === "setup" && (
            <div className="card shadow-sm mt-3">
              <div className="card-header bg-white border-bottom">
                <h2 className="h5 mb-1 d-flex align-items-center gap-2">
                  📘 Facebook Business Integration Setup
                </h2>
                <p className="text-muted mb-0 small">
                  Connect your Facebook Business account to get WhatsApp Business API access
                </p>
              </div>
              <div className="card-body">
                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="d-flex justify-content-between small mb-2">
                    <span>Setup Progress</span>
                    <span>{Math.round((connectionStep / 4) * 100)}%</span>
                  </div>
                  <div className="progress">
                    <div 
                      className="progress-bar bg-primary"
                      role="progressbar" 
                      style={{ width: `${(connectionStep / 4) * 100}%` }}
                      aria-valuenow={connectionStep * 25} 
                      aria-valuemin="0" 
                      aria-valuemax="100"
                    />
                  </div>
                </div>

                {/* Step 1: Facebook Login */}
                <div className={`p-3 border rounded mb-3 ${connectionStep >= 1 ? "bg-primary bg-opacity-10 border-primary border-opacity-25" : "bg-light"}`}>
                  <div className="d-flex align-items-center justify-content-between">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className={`rounded-circle d-flex align-items-center justify-content-center ${facebookConnected ? "bg-success" : "bg-primary"}`}
                        style={{ width: "32px", height: "32px" }}
                      >
                        {facebookConnected ? (
                          <CheckCircle className="text-white" size={20} />
                        ) : (
                          <span className="text-white fw-bold small">1</span>
                        )}
                      </div>
                      <div>
                        <h6 className="mb-1">Connect Facebook Account</h6>
                        <p className="small text-muted mb-0">
                          {facebookConnected && userInfo
                            ? `Connected as ${userInfo.name}`
                            : "Login with your Facebook Business account"}
                        </p>
                      </div>
                    </div>
                    {!facebookConnected ? (
                      <button
                        onClick={handleFacebookLogin}
                        disabled={loading || !sdkLoaded}
                        className="btn btn-primary d-flex align-items-center gap-2"
                      >
                        {loading ? "⏳" : "📘"} {loading ? "Connecting..." : "Connect Facebook"}
                      </button>
                    ) : (
                      <div className="d-flex align-items-center gap-2">
                        {userInfo?.picture && (
                          <img
                            src={userInfo.picture.data.url}
                            alt="Profile"
                            className="rounded-circle"
                            style={{ width: "32px", height: "32px" }}
                          />
                        )}
                        <span className="badge bg-success">Connected</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Step 2: Select Business Account */}
                <div className={`p-3 border rounded mb-3 ${connectionStep >= 2 ? "bg-primary bg-opacity-10 border-primary border-opacity-25" : "bg-light"}`}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center ${connectionStep >= 3 ? "bg-success" : connectionStep >= 2 ? "bg-primary" : "bg-secondary"}`}
                      style={{ width: "32px", height: "32px" }}
                    >
                      {connectionStep >= 3 ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : (
                        <span className="text-white fw-bold small">2</span>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-1">Select WhatsApp Business Account</h6>
                      <p className="small text-muted mb-0">Choose your business account for integration</p>
                    </div>
                  </div>

                  {facebookConnected && (
                    <div style={{ marginLeft: "44px" }}>
                      {loading && businessAccounts.length === 0 ? (
                        <div className="d-flex align-items-center gap-2 p-3 border rounded">
                          <span className="small">⏳ Loading business accounts...</span>
                        </div>
                      ) : businessAccounts.length === 0 ? (
                        <div className="alert alert-warning d-flex align-items-start">
                          <AlertCircle className="text-warning me-2 mt-1" size={20} />
                          <div className="small">
                            No WhatsApp Business accounts found. Make sure you have a WhatsApp Business account
                            connected to your Facebook Business Manager.
                          </div>
                        </div>
                      ) : (
                        <div className="mb-3">
                          {businessAccounts.map((account) => (
                            <div
                              key={account.id}
                              className={`p-3 border rounded mb-2 ${
                                selectedAccount === account.id
                                  ? "border-primary bg-primary bg-opacity-10"
                                  : "border-secondary"
                              }`}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedAccount(account.id)}
                            >
                              <div className="d-flex align-items-center justify-content-between">
                                <div className="d-flex align-items-center gap-3">
                                  <span className="text-muted">🏢</span>
                                  <div>
                                    <p className="fw-medium mb-1">{account.name}</p>
                                    <p className="small text-muted mb-1">
                                      📞 {account.phone}
                                    </p>
                                    <p className="small text-muted mb-0">Business: {account.business_name}</p>
                                  </div>
                                </div>
                                {selectedAccount === account.id && <CheckCircle className="text-primary" size={20} />}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {selectedAccount && (
                        <button 
                          onClick={generateLongLivedToken} 
                          disabled={loading}
                          className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                        >
                          {loading && "⏳"} Generate Long-Lived Access Token
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Step 3: Access Token Generated */}
                <div className={`p-3 border rounded mb-3 ${connectionStep >= 3 ? "bg-success bg-opacity-10 border-success border-opacity-25" : "bg-light"}`}>
                  <div className="d-flex align-items-center gap-3 mb-3">
                    <div 
                      className={`rounded-circle d-flex align-items-center justify-content-center ${connectionStep >= 3 ? "bg-success" : "bg-secondary"}`}
                      style={{ width: "32px", height: "32px" }}
                    >
                      {connectionStep >= 3 ? (
                        <CheckCircle className="text-white" size={20} />
                      ) : (
                        <span className="text-white fw-bold small">3</span>
                      )}
                    </div>
                    <div>
                      <h6 className="mb-1">Access Token Generated</h6>
                      <p className="small text-muted mb-0">Your WhatsApp Business API access token</p>
                    </div>
                  </div>

                  {accessToken && connectionStep >= 3 && (
                    <div style={{ marginLeft: "44px" }}>
                      <div className="alert alert-info d-flex align-items-start mb-3">
                        <span className="text-info me-2 mt-1">🔑</span>
                        <div className="small">
                          Keep this access token secure. It provides access to your WhatsApp Business account.
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label small fw-medium">Access Token</label>
                        <div className="input-group">
                          <input 
                            value={accessToken} 
                            readOnly 
                            className="form-control font-monospace small bg-light" 
                            type="password" 
                          />
                          <button 
                            onClick={() => copyToClipboard(accessToken)}
                            className="btn btn-outline-secondary"
                            type="button"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={saveWhatsAppConfig}
                        disabled={loading}
                        className="btn btn-success w-100"
                      >
                        {loading ? "⏳ Saving..." : "Complete Setup"}
                      </button>
                    </div>
                  )}
                </div>

                {/* Step 4: Setup Complete */}
                {connectionStep >= 4 && (
                  <div className="p-3 border border-success rounded bg-success bg-opacity-10">
                    <div className="d-flex align-items-center gap-3">
                      <div 
                        className="rounded-circle bg-success d-flex align-items-center justify-content-center"
                        style={{ width: "32px", height: "32px" }}
                      >
                        <CheckCircle className="text-white" size={20} />
                      </div>
                      <div>
                        <h6 className="text-success mb-1">Setup Complete!</h6>
                        <p className="small text-success mb-0">Your WhatsApp Business API is ready to use</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Messaging Tab Content */}
          {activeTab === "messaging" && (
            <div className="row g-4 mt-3">
              <div className="col-md-8">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      💬 Send WhatsApp Message
                    </h5>
                    <p className="text-muted mb-0 small">Send real-time messages to your contacts</p>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label">Recipient Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="+91XXXXXXXXXX"
                        value={recipientPhone}
                        onChange={(e) => setRecipientPhone(e.target.value)}
                      />
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        placeholder="Type your message here..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                      />
                    </div>
                    
                    <button
                      onClick={sendWhatsAppMessage}
                      disabled={!isConnected || !recipientPhone || !messageText.trim() || sendingMessage}
                      className="btn btn-primary d-flex align-items-center gap-2"
                    >
                      {sendingMessage ? "⏳" : <Send size={16} />}
                      {sendingMessage ? "Sending..." : "Send Message"}
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      📋 Message History
                    </h5>
                    <p className="text-muted mb-0 small">Recent messages sent</p>
                  </div>
                  <div className="card-body">
                    {messageHistory.length === 0 ? (
                      <p className="text-muted small">No messages sent yet</p>
                    ) : (
                      <div className="d-flex flex-column gap-2">
                        {messageHistory.slice(0, 5).map((msg) => (
                          <div key={msg.id} className="p-2 border rounded">
                            <div className="d-flex justify-content-between align-items-start">
                              <div className="small">
                                <strong>{msg.recipientPhone || 'Unknown'}</strong>
                                <p className="mb-1">{msg.message}</p>
                              </div>
                              <span className={`badge ${msg.status === 'sent' ? 'bg-success' : 'bg-warning'}`}>
                                {msg.status}
                              </span>
                            </div>
                            <small className="text-muted">
                              {new Date(msg.timestamp).toLocaleString()}
                            </small>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab Content */}
          {activeTab === "notifications" && (
            <div className="card shadow-sm mt-3">
              <div className="card-header bg-white">
                <h5 className="mb-1 d-flex align-items-center gap-2">
                  🔔 Real-time Notifications
                </h5>
                <p className="text-muted mb-0 small">Live updates from WebSocket connection</p>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <span className="small fw-medium">WebSocket Status</span>
                    <span className={`badge ${wsConnected ? "bg-success" : "bg-secondary"}`}>
                      {wsConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h6>Recent Notifications</h6>
                  {notifications.length === 0 ? (
                    <p className="text-muted small">No notifications yet</p>
                  ) : (
                    <div className="d-flex flex-column gap-2">
                      {notifications.map((notification, index) => (
                        <div key={index} className="p-3 border rounded">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong>{notification.type}</strong>
                              <p className="mb-1 small">{JSON.stringify(notification, null, 2)}</p>
                            </div>
                            <small className="text-muted">
                              {new Date(notification.timestamp).toLocaleString()}
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tokens Tab Content */}
          {activeTab === "tokens" && (
            <div className="row g-4 mt-3">
              <div className="col-md-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-1 d-flex align-items-center gap-2">
                      🔑 Access Token Management
                    </h5>
                    <p className="text-muted mb-0 small">Manage your Facebook and WhatsApp API tokens</p>
                  </div>
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label small fw-medium">Facebook Access Token</label>
                      <div className="input-group">
                        <input
                          value={accessToken || "No token generated"}
                          readOnly
                          className="form-control font-monospace small bg-light"
                          type="password"
                        />
                        <button
                          disabled={!accessToken}
                          onClick={() => copyToClipboard(accessToken)}
                          className="btn btn-outline-secondary"
                          type="button"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-medium">WhatsApp Business Account ID</label>
                      <div className="input-group">
                        <input 
                          value={selectedAccount || "No account selected"} 
                          readOnly 
                          className="form-control font-monospace small bg-light" 
                        />
                        <button
                          disabled={!selectedAccount}
                          onClick={() => copyToClipboard(selectedAccount)}
                          className="btn btn-outline-secondary"
                          type="button"
                        >
                          <Copy size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="d-grid gap-2 d-md-flex">
                      <button
                        onClick={generateLongLivedToken}
                        disabled={!accessToken || loading}
                        className="btn btn-outline-primary flex-fill d-flex align-items-center justify-content-center gap-2"
                      >
                        🔄 Refresh Token
                      </button>
                      <button
                        onClick={() => window.open("https://developers.facebook.com/apps", "_blank")}
                        className="btn btn-outline-secondary flex-fill d-flex align-items-center justify-content-center gap-2"
                      >
                        🔗 Facebook Console
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-md-6">
                <div className="card shadow-sm">
                  <div className="card-header bg-white">
                    <h5 className="mb-1">Token Information</h5>
                    <p className="text-muted mb-0 small">Details about your current tokens</p>
                  </div>
                  <div className="card-body">
                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                      <span className="small fw-medium">Token Status</span>
                      <span className={`badge ${accessToken ? "bg-success" : "bg-secondary"}`}>
                        {accessToken ? "Active" : "Not Generated"}
                      </span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                      <span className="small fw-medium">Token Type</span>
                      <span className="small text-muted">User Access Token</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                      <span className="small fw-medium">Permissions</span>
                      <span className="small text-muted">whatsapp_business_management</span>
                    </div>

                    <div className="d-flex justify-content-between align-items-center p-3 bg-light rounded mb-3">
                      <span className="small fw-medium">Connected User</span>
                      <span className="small text-muted">{userInfo?.name || "Not connected"}</span>
                    </div>

                    <div className="alert alert-warning d-flex align-items-start">
                      <AlertCircle className="text-warning me-2 mt-1" size={16} />
                      <div className="small">
                        Long-lived tokens expire after 60 days. Set up automatic refresh or manually renew before
                        expiration.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Test Tab Content */}
          {activeTab === "test" && (
            <div className="card shadow-sm mt-3">
              <div className="card-header bg-white">
                <h5 className="mb-1 d-flex align-items-center gap-2">
                  🛡️ API Connection Test
                </h5>
                <p className="text-muted mb-0 small">Test your WhatsApp Business API connection</p>
              </div>
              <div className="card-body">
                <div className="mb-4">
                  <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <span className="small fw-medium">Facebook Connection</span>
                    <span className={`badge ${facebookConnected ? "bg-success" : "bg-secondary"}`}>
                      {facebookConnected ? "Connected" : "Not Connected"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <span className="small fw-medium">Access Token</span>
                    <span className={`badge ${accessToken ? "bg-success" : "bg-secondary"}`}>
                      {accessToken ? "Valid" : "Missing"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <span className="small fw-medium">WhatsApp Business Account</span>
                    <span className={`badge ${selectedAccount ? "bg-success" : "bg-secondary"}`}>
                      {selectedAccount ? "Selected" : "Not Selected"}
                    </span>
                  </div>

                  <div className="d-flex justify-content-between align-items-center p-3 border rounded mb-3">
                    <span className="small fw-medium">WebSocket Connection</span>
                    <span className={`badge ${wsConnected ? "bg-success" : "bg-secondary"}`}>
                      {wsConnected ? "Connected" : "Disconnected"}
                    </span>
                  </div>
                </div>

                <button
                  className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2"
                  disabled={!accessToken || !selectedAccount || loading}
                  onClick={testConnection}
                >
                  {loading && "⏳"} Test API Connection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 