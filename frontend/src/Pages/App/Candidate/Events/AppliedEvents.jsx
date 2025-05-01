import React, { useEffect, useState } from 'react';
import axios from 'axios';
import moment from 'moment';

const AppliedEvents = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchAppliedEvents = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`${backendUrl}/candidate/applied-events`, {
          headers: {
            'x-auth': token,
          },
        });

        setEvents(res.data.events || []);
      } catch (err) {
        console.error("Error fetching applied events:", err);
      }
    };

    fetchAppliedEvents();
  }, []);

  const handleShare = (event) => {
    const shareText = `Check out this event: ${event.eventTitle} happening in ${event.location?.city}, ${event.location?.state}`;
    const shareUrl = window.location.href;

    if (navigator.share) {
      navigator.share({
        title: event.eventTitle,
        text: shareText,
        url: shareUrl,
      }).catch((err) => console.error("Share failed:", err));
    } else {
      navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      alert("Event link copied to clipboard!");
    }
  };

  return (
    <div className="content-body p-3">
      <div className="row">
        {events.length > 0 ? (
          events.map(event => (
            <div key={event._id} className="col-xl-6 col-lg-6 col-md-6 col-sm-10 mx-auto mb-4">
              <div className="cr_nw_in position-relative">
                <div className="right_obj shadow">
                  <span>Applied</span>
                </div>

                <img
                  src={event.thumbnail}
                  className="video_thum img-fluid"
                  alt={event.name}
                />

                <div className="course_inf pt-0">
                  <h5>{event.eventTitle}</h5>
                  <span className="job_cate">{event.eventType}</span>

                  <div className="event-timing mb-2">
                    <p className="mb-1 text-center">
                      <strong>Event Date:</strong>{' '}
                      {moment(event.timing.from).format("DD-MM-YYYY")} to {moment(event.timing.to).format("DD-MM-YYYY")}
                    </p>
                    <p className="mb-1 text-center">
                      <strong>Time:</strong>{' '}
                      {moment(event.timing.from).format("hh:mm A")} to {moment(event.timing.to).format("hh:mm A")}
                    </p>
                  </div>

                  <div className="row">
                    <div className="col-md-6">
                      <p className="mb-0">
                        <strong>Location:</strong> {event.location?.city}, {event.location?.state}
                      </p>
                    </div>
                    <div className="col-md-6">
                      <p className="mb-0">
                        <strong>Mode:</strong> {event.eventMode}
                      </p>
                    </div>
                  </div>

                  {/* Buttons */}
                  <div className="text-center mt-3 d-flex justify-content-center gap-2 flex-wrap">
                    {event.guidelines && (
                      <a
                        href={`${bucketUrl}/${event.guidelines}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-outline-primary btn-sm"
                        download
                      >
                        <i className="la la-download me-1"></i> Download Guidelines
                      </a>
                    )}

                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => handleShare(event)}
                    >
                      <i className="la la-share me-1"></i> Share
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-12 text-center py-5">
            <h4 className="text-muted">You haven't applied to any event yet.</h4>
          </div>
        )}
      </div>

      <style jsx>{`
        .cr_nw_in {
          background: #fff;
          padding: 20px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }

        .right_obj {
          position: absolute;
          top: 10px;
          right: 10px;
          background: #e3f2fd;
          padding: 5px 10px;
          font-size: 12px;
          border-radius: 4px;
          font-weight: bold;
        }

        .video_thum {
          width: 100%;
          height: 180px;
          object-fit: cover;
          border-radius: 10px;
        }

        .event-timing {
          margin-top: 10px;
        }

        .btn-sm {
          padding: 6px 14px;
          font-size: 14px;
          border-radius: 4px;
        }

        .job_cate {
          display: inline-block;
          font-size: 13px;
          color: #fc2e5a;
          font-weight: 500;
          margin-bottom: 5px;
        }
      `}</style>
    </div>
  );
};

export default AppliedEvents;
