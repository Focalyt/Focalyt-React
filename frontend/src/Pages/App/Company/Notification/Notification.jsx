import React, { useState, useEffect } from 'react';

const Notification = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  // State management
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [flashMessage, setFlashMessage] = useState({ type: '', message: '' });

  // Load notifications on component mount
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/notifications`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notificationsms || []);
        
        // Handle flash messages if any
        if (data.flashMessage) {
          setFlashMessage(data.flashMessage);
          setTimeout(() => setFlashMessage({ type: '', message: '' }), 5000);
        }
      } else {
        setError('Failed to load notifications');
      }
    } catch (error) {
      setError('Error loading notifications');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatMessage = (message) => {
    if (!message) return [];
    return message.split('__').filter(item => item.trim() !== '');
  };

  // Flash message component
  const FlashMessage = () => {
    if (!flashMessage.message) return null;

    const alertClass = flashMessage.type === 'success' ? 'alert-success' : 
                     flashMessage.type === 'error' ? 'alert-danger' : 
                     'alert-info';

    return (
      <div className={`alert ${alertClass} alert-dismissible fade show mx-3 mb-3`}>
        {flashMessage.message}
        <button 
          type="button" 
          className="close" 
          onClick={() => setFlashMessage({ type: '', message: '' })}
        >
          <span>&times;</span>
        </button>
      </div>
    );
  };

  return (

      <>
        
        {/* Content Header */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Recent Notifications</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">
                      Recent Notifications / सूचनाएं
                    </li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Flash Message */}
        <FlashMessage />

        {/* Notifications Header */}
        <div className="card">
          <div className="card-header fliter-block" id="headingOne">
            <div className="row">
              <div className="col-12">
                <h5 className="mb-2">
                  Notifications / सूचनाएं
                </h5>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center p-4">
            <div className="spinner-border" role="status">
              <span className="sr-only">Loading...</span>
            </div>
            <p className="mt-2">Loading notifications...</p>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="alert alert-danger mx-3">
            {error}
            <button 
              className="btn btn-sm btn-outline-danger ml-2"
              onClick={() => {
                setError('');
                loadNotifications();
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Notifications Content */}
        {!loading && !error && (
          <div className="row">
            <div className="col">
              {notifications && notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <div key={notification._id || index} className="mb-4">
                    <h4 className="title-noti font-weight-bold">
                      {notification.title || 'Notification'}
                    </h4>
                    <p className="">
                      {formatDateTime(notification.createdAt)}
                    </p>
                    <div className="notif-box mb-1">
                      <ul className="mb-xl-1 mb-lg-2 mb-md-2 mb-sm-0 mb-0">
                        {formatMessage(notification.message).map((item, itemIndex) => (
                          <li key={itemIndex}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center">No Notifications Found</p>
              )}
            </div>
          </div>
        )}

        {/* Refresh Button */}
        {!loading && (
          <div className="text-center mt-3 mb-3">
            <button 
              className="btn btn-primary waves-effect waves-light"
              onClick={loadNotifications}
            >
              <i className="feather icon-refresh-cw mr-1"></i>
              Refresh Notifications
            </button>
          </div>
        )}
      </>

  );
};

export default Notification;