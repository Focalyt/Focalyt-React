import { useState, useEffect } from "react"
import { MessageCircle, CheckCircle, AlertCircle, Copy } from "lucide-react"
import axios from "axios"
import { toast } from "react-toastify"

export default function FacebookWhatsAppConnector() {
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;
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

  // Facebook App ID - Replace with your actual App ID
  const FACEBOOK_APP_ID = process.env.REACT_APP_FACEBOOK_APP_ID || "YOUR_FACEBOOK_APP_ID"
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL  


  // Load Bootstrap CSS and JS
  useEffect(() => {
    // Add Bootstrap CSS
    const bootstrapCSS = document.createElement("link")
    bootstrapCSS.rel = "stylesheet"
    bootstrapCSS.href = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/css/bootstrap.min.css"
    document.head.appendChild(bootstrapCSS)

    // Add Bootstrap JS
    const bootstrapJS = document.createElement("script")
    bootstrapJS.src = "https://cdnjs.cloudflare.com/ajax/libs/bootstrap/5.3.0/js/bootstrap.bundle.min.js"
    document.head.appendChild(bootstrapJS)

    return () => {
      document.head.removeChild(bootstrapCSS)
      document.head.removeChild(bootstrapJS)
    }
  }, [])

  // Load Facebook SDK and saved data
  useEffect(() => {
    const loadFacebookSDK = () => {
      // Check if SDK is already loaded
      if (window.FB) {
        setSdkLoaded(true)
        return
      }

      // Create script element
      const script = document.createElement("script")
      script.src = "https://connect.facebook.net/en_US/sdk.js"
      script.async = true
      script.defer = true
      script.crossOrigin = "anonymous"

      // Initialize Facebook SDK when loaded
      window.fbAsyncInit = () => {
        window.FB.init({
          appId: FACEBOOK_APP_ID,
          cookie: true,
          xfbml: true,
          version: "v18.0",
        })

        setSdkLoaded(true)

        // Check if user is already logged in
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

    // Load saved Facebook data from backend
    const loadSavedFacebookData = async () => {
      if (!token) return

      try {
        const response = await axios.get(`${backendUrl}/college/whatsapp/facebook-data`, {
          headers: { 'x-auth': token }
        })

        if (response.data.status && response.data.data.connected) {
          const { accessToken, userInfo, businessAccounts } = response.data.data
          
          setFacebookConnected(true)
          setAccessToken(accessToken)
          setUserInfo(userInfo)
          setBusinessAccounts(businessAccounts)
          setConnectionStep(2)
          
          console.log('Loaded saved Facebook data:', response.data.data)
        }
      } catch (error) {
        console.error('Error loading saved Facebook data:', error)
      }
    }

    loadSavedFacebookData()
  }, [token])

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

      // Get user's businesses
      window.FB.api("/me/businesses", { access_token: token }, (businessResponse) => {
        console.log("Business Response:", businessResponse);
        if (businessResponse && businessResponse.data) {
          const businesses = businessResponse.data.map((business) => ({
            id: business.id,
            name: business.name,
            verification_status: business.verification_status,
          }))

          // For each business, get WhatsApp Business Accounts
          businesses.forEach((business) => {
            window.FB.api(
              `/${business.id}/client_whatsapp_business_accounts`,
              { access_token: token },
              (wabaResponse) => {
                console.log("WABA Response for business", business.id, ":", wabaResponse);
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
      // Facebook login with required permissions
      window.FB.login(
        function(response) {
          (async () => {
            if (response.authResponse) {
              const { accessToken: fbToken } = response.authResponse

              try {
                // Get user info first
                const userInfoPromise = new Promise((resolve, reject) => {
                  window.FB.api("/me", { 
                    fields: "name,email,picture,id",
                    access_token: fbToken 
                  }, (userResponse) => {
                    if (userResponse && !userResponse.error) {
                      resolve(userResponse)
                    } else {
                      reject(new Error(userResponse?.error?.message || "Failed to get user info"))
                    }
                  })
                })

                const userInfo = await userInfoPromise
                setUserInfo(userInfo)

                // Get business accounts
                const businessAccountsPromise = new Promise((resolve, reject) => {
                  window.FB.api("/me/businesses", { 
                    access_token: fbToken 
                  }, (businessResponse) => {
                    console.log("Business Response:", businessResponse);
                    if (businessResponse && businessResponse.data) {
                      const businesses = businessResponse.data.map((business) => ({
                        id: business.id,
                        name: business.name,
                        verification_status: business.verification_status,
                      }))

                      // Get WhatsApp Business Accounts for each business
                      const wabaPromises = businesses.map(business => 
                        new Promise((resolveWaba) => {
                          window.FB.api(
                            `/${business.id}/client_whatsapp_business_accounts`,
                            { access_token: fbToken },
                            (wabaResponse) => {
                              console.log("WABA Response for business", business.id, ":", wabaResponse);
                              if (wabaResponse && wabaResponse.data) {
                                const accounts = wabaResponse.data.map((account) => ({
                                  id: account.id,
                                  name: account.name,
                                  business_id: business.id,
                                  business_name: business.name,
                                  phone: account.phone_number || "Not configured",
                                }))
                                resolveWaba(accounts)
                              } else {
                                resolveWaba([])
                              }
                            }
                          )
                        })
                      )

                      Promise.all(wabaPromises).then(results => {
                        const allAccounts = results.flat()
                        resolve(allAccounts)
                      })
                    } else {
                      reject(new Error(businessResponse?.error?.message || "Failed to get business accounts"))
                    }
                  })
                })

                const businessAccounts = await businessAccountsPromise
                console.log(businessAccounts,'businessAccounts');
                setBusinessAccounts(businessAccounts)

                // Store token and user info in backend
                
                const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL 
                
                try {
                  console.log(fbToken,'fbToken',userInfo,'userInfo',businessAccounts,'businessAccounts');
                  const saveResponse = await axios.post(`${backendUrl}/college/whatsapp/save-facebook-token`, {
                    accessToken: fbToken,
                    userInfo: userInfo,
                    businessAccounts: businessAccounts
                  }, {
                    headers: { 'x-auth': token }
                  
                  })

                  if (saveResponse.data.status) {
                    setFacebookConnected(true)
                    setAccessToken(fbToken)
                    setConnectionStep(2)
                    
                    // Show success message
                    toast.success("Facebook connected successfully! ✅")
                  } else {
                    throw new Error(saveResponse.data.message || "Failed to save token")
                  }
                } catch (saveError) {
                  console.error("Error saving token:", saveError)
                  setError("Connected to Facebook but failed to save token. Please try again.")
                }

              } catch (apiError) {
                console.error("API error:", apiError)
                setError(apiError.message || "Failed to get user information")
              }

              setLoading(false)
            } else {
              setError("Facebook login was cancelled or failed")
              setLoading(false)
            }
          })();
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
      // Call backend to exchange short-lived token for long-lived token
      const response = await axios.post(
        `${backendUrl}/college/whatsapp/exchange-token`,
        { shortLivedToken: accessToken },
        { headers: { 'x-auth': token } }
      )

      if (response.data.status && response.data.access_token) {
        setAccessToken(response.data.access_token)
        setConnectionStep(3)
        toast.success("Long-lived token generated successfully!")
      } else {
        setError("Failed to generate long-lived token")
      }
    } catch (error) {
      console.error("Token exchange error:", error)
      setError("Failed to generate long-lived token")
    }
    setLoading(false)
  }

  // Logout function
  const handleLogout = async () => {
    try {
      // Clear Facebook data from backend
      if (token) {
        await axios.post(`${backendUrl}/college/whatsapp/clear-facebook-data`, {}, {
          headers: { 'x-auth': token }
        })
      }
    } catch (error) {
      console.error('Error clearing Facebook data:', error)
    }

    // Clear Facebook session
    window.FB.logout(() => {
      setFacebookConnected(false)
      setAccessToken("")
      setUserInfo(null)
      setBusinessAccounts([])
      setSelectedAccount("")
      setConnectionStep(1)
      setIsConnected(false)
      
      toast.success("Facebook disconnected successfully!")
    })
  }

  // Copy to clipboard function
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
  }

  // Test API connection
  const testConnection = async () => {
    if (!accessToken || !selectedAccount) return

    setLoading(true)
    try {
      // Test API call to get WhatsApp Business Account info
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
                <p className="small text-muted mb-0">Facebook Access Token Integration</p>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <span className={`badge d-flex align-items-center gap-1 ${isConnected ? "bg-success" : "bg-secondary"}`}>
                <div 
                  className="rounded-circle"
                  style={{ 
                    width: "8px", 
                    height: "8px", 
                    backgroundColor: isConnected ? "#ffffff" : "#dee2e6" 
                  }}
                />
                {isConnected ? "Connected" : "Setup Required"}
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
                        onClick={() => {
                          setIsConnected(true)
                          setConnectionStep(4)
                        }}
                        className="btn btn-success w-100"
                      >
                        Complete Setup
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