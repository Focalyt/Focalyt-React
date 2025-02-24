import React, { useState, useEffect, useRef } from 'react';
import "./Community.css";

function Community() {
  const hiddenTextRef = useRef(null);
  const [isTextTruncated, setIsTextTruncated] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const checkTextTruncation = () => {
    const element = hiddenTextRef.current;
    if (element) {
      const computedStyle = window.getComputedStyle(element);
      const lineHeight = parseFloat(computedStyle.lineHeight);
      const maxLines = 4;
      const actualLines = Math.ceil(element.scrollHeight / lineHeight);
      setIsTextTruncated(actualLines > maxLines);
    }
  };

  useEffect(() => {
    checkTextTruncation();
    window.addEventListener('resize', checkTextTruncation);
    
    return () => {
      window.removeEventListener('resize', checkTextTruncation);
    };
  }, []);

  const toggleText = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <>
      <section className="section-padding-top-120 mt-1">
        <div className="container-fluid p-0">
          <div className="mainContentLayout">
            <div className="mainContainer">
              <div className="leftSidebar">
                <div className="sidebar">
                  {/* Notification Banner */}
                  <div className="notification">
                    <span className="close">×</span>
                    <h4>New Lab Program!</h4>
                    <p>Special offer available for Focalyt future technology labs</p>
                  </div>
              
                  {/* Lab Programs */}
                  <div className="section">
                    <div className="section-titles">
                      🧪 Lab Programs
                    </div>
                    <div className="lab-card">
                      <h4>Setup Future Technology Labs</h4>
                      <p>Starting at ₹0</p>
                    </div>
                  </div>
              
                  {/* Latest Updates */}
                  <div className="section">
                    <div className="section-titles">
                      📰 Latest Updates
                    </div>
                    <div className="news-item">
                      <h4>New Government Initiative</h4>
                      <p>Extra funding for rural schools</p>
                    </div>
                    <div className="news-item">
                      <h4>Success Story</h4>
                      <p>100 labs established in Bihar</p>
                    </div>
                  </div>
              
                  {/* Special Offers */}
                  <div className="section">
                    <div className="section-titles">
                      🎁 Special Offers
                    </div>
                    <div className="offer-card green">
                      <strong>100% OFF</strong>
                      <span>on 1st 30 students enrollments</span>
                    </div>
                    <div className="offer-card orange">
                      <strong>Free Training</strong>
                      <span>with every lab installation</span>
                    </div>
                  </div>
              
                  {/* Success Stories */}
                  <div className="section">
                    <div className="section-titles">
                      🏆 Success Stories
                    </div>
                    <div className="success-item">
                      <span>🏫</span>
                      <span>DPS School - 5 Labs</span>
                    </div>
                    <div className="success-item">
                      <span>🏫</span>
                      <span>St. Xavier's - 3 Labs</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mainBody">
                <div className="blog--card" id="post">
                  {/* Header Section */}
                  <div className="card-header">
                    <div className="inner__card">
                      <div className="user_image text-black">
                        <figure>
                          <img src="public_assets/images/newpage/favicon.png" alt="favicon" />
                        </figure>
                      </div>
                      <h3 className="user__name text-black">
                        <span className="start__name"><b>Focalyt</b></span>
                        <span className="tag__user">
                          is with <b></b>
                        </span>
                        <span className="more__user strong"> & <b></b></span>
                        <span className="other"><b> Others</b></span>
                      </h3>
                    </div>
                    
                    <h5 className="blog__title text-black">
                      <span 
                        ref={hiddenTextRef}
                        className={`${!isExpanded ? 'hidden-text' : ''}`}
                      >See more
                      </span>
                      {isTextTruncated && (
                        <span 
                          className={`toggle-more ${isExpanded ? 'see-more-hidden' : 'see-more-visible'}`}
                          onClick={toggleText}
                        >
                          {isExpanded ? 'See less...' : 'See more...'}
                        </span>
                      )}
                    </h5>
                  </div>

                  {/* Main Content */}
                  <div className="card-content">
                    <div className="card-image">
                      <div className="happy_candidates" id="blog--images">
                        <div className="happy_candidate_images">
                          <div>
                            <img src="/Assets/public_assets" className="d-block w-100" alt="post" />
                          </div>
                          <div>
                            <video 
                              className="d-block w-100 video_height lazy-video" 
                              muted 
                              controls 
                              autoPlay
                              playsInline
                            >
                              <source src="" type="video/mp4" />
                              Your browser does not support the video tag.
                            </video>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Interaction Buttons */}
                    <div className="interaction-buttons d-flex align-items-center justify-content-center">
                      <div className="share_link">
                        <i className="fas fa-share"></i> Share
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default Community;