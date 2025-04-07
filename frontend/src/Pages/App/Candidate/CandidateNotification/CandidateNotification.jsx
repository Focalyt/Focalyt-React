import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';

const CandidateNotification = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch notifications when component mounts
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/candidate/notifications', {
        headers: { 'x-auth': token }
      });
      
      if (response.data && response.data.notificationsms) {
        setNotifications(response.data.notificationsms);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  // Format date using moment.js
  const formatDate = (date) => {
    return moment(date).utcOffset("+05:30").format('MMM DD YYYY hh:mm A');
  };

  return (
    <>
      
          <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
              <div className="row breadcrumbs-top">
                <div className="col-12">
                  <h3 className="content-header-title float-left mb-0">Recent Notifications</h3>
                  <div className="breadcrumb-wrapper col-12">
                    <ol className="breadcrumb">
                      <li className="breadcrumb-item">
                        <Link to="/candidate/dashboard">Home</Link>
                      </li>
                      <li className="breadcrumb-item active">Recent Notifications / सूचनाएं</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header fliter-block" id="headingOne">
              <div className="row">
                <div className="col-xl-12">
                  <h5 className="mb-2">
                    Notifications / सूचनाएं
                  </h5>
                </div>
                <div className="col-6"></div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body px-0">
              <div className="col-12 px-2">
                {loading ? (
                  <p className="text-center">Loading notifications...</p>
                ) : notifications.length > 0 ? (
                  notifications.map((notification, index) => (
                    <div key={notification._id || index}>
                      <h4 className="title-noti font-weight-bold">
                        {notification.title}
                      </h4>
                      <p>
                        {formatDate(notification.createdAt)}
                      </p>
                      <div className="notif-box mb-1">
                        <ul className="mb-xl-1 mb-lg-2 mb-md-2 mb-sm-0 mb-0 pl-2">
                          {notification.message.split("__").map((item, i) => (
                            <li key={i} className="pt-1">{item}</li>
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
          </div>
      

      <div className="sidenav-overlay"></div>
      <div className="drag-target"></div>
      
    </>
  );
};

export default CandidateNotification;