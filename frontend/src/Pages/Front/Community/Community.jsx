import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FrontLayout from '../../../Component/Layouts/Front';
import "./Community.css";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare } from '@fortawesome/free-solid-svg-icons';  
function Community() {
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [currentSlides, setCurrentSlides] = useState({});

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/community`);
        setPosts(response.data.posts);

        // Initialize current slide for each post
        const initialSlides = {};
        response.data.posts.forEach((post, index) => {
          const postId = post._id ? `post-${post._id}` : `post-${index}`;
          initialSlides[postId] = 0;
        });
        setCurrentSlides(initialSlides);
      } catch (error) {
        console.error("Error fetching posts data:", error);
      }
    };
    fetchData();
  }, [backendUrl]);

  // Text expansion toggle handler
  const toggleExpand = (postId) => {
    setExpandedPosts(prev => {
      const newState = {
        ...prev,
        [postId]: !prev[postId]
      };
      
      // Force recalculation of element heights after state change
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 50);
      
      return newState;
    });
  };

  // Share handler
  const handleShare = (postId) => {
    const postUrl = `${window.location.origin}${window.location.pathname}#${postId}`;

    const shareData = {
      title: "Check this out!",
      text: "This is an awesome post. Check it out!",
      url: postUrl,
    };

    if (navigator.share) {
      navigator
        .share(shareData)
        .then(() => console.log("Shared successfully!"))
        .catch((error) => console.error("Error sharing:", error));
    } else {
      // Fallback: Copy link to clipboard
      const tempInput = document.createElement("input");
      document.body.appendChild(tempInput);
      tempInput.value = postUrl;
      tempInput.select();
      document.execCommand("copy");
      document.body.removeChild(tempInput);
      alert("Link copied to clipboard! Share it manually.");
    }
  };

  // PostText component with fixed line count
  const PostText = ({ content, postId }) => {
    const textRef = useRef(null);
    const [truncated, setTruncated] = useState(false);
    const isExpanded = expandedPosts[postId];

    // Check if content exceeds the defined line count
    useEffect(() => {
      const checkTruncation = () => {
        if (textRef.current) {
          const element = textRef.current;
          
          // Calculate how many lines of text we have
          const style = window.getComputedStyle(element);
          const lineHeight = parseFloat(style.lineHeight) || 1.5 * parseFloat(style.fontSize);
          
          // Force the element to temporarily show all content to measure it
          const originalStyles = {
            maxHeight: element.style.maxHeight,
            overflow: element.style.overflow,
            webkitLineClamp: element.style.webkitLineClamp
          };
          
          element.style.maxHeight = 'none';
          element.style.overflow = 'visible';
          element.style.webkitLineClamp = 'unset';
          
          // Get the full height
          const fullHeight = element.scrollHeight;
          
          // Calculate the number of lines
          const lineCount = Math.ceil(fullHeight / lineHeight);
          
          // Set truncated flag if lines exceed our limit
          setTruncated(lineCount > 3); // 3 lines limit
          
          // Restore original styles
          element.style.maxHeight = originalStyles.maxHeight;
          element.style.overflow = originalStyles.overflow;
          element.style.webkitLineClamp = originalStyles.webkitLineClamp;
        }
      };

      // Run after a small delay to ensure content is rendered
      const timer = setTimeout(checkTruncation, 10);
      
      // Also check on window resize
      window.addEventListener('resize', checkTruncation);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('resize', checkTruncation);
      };
    }, [content]);

    return (
      <div className="post-text-container">
        <div 
          ref={textRef}
          className={isExpanded ? "show-text" : "hidden-text"}
        >
          {content || "No content available"}
        </div>
        
        {truncated && (
          <div 
            className={`toggle-more ${truncated ? 'toggle-more-visible' : 'toggle-more-hidden'}`}
            onClick={() => toggleExpand(postId)}
          >
            {isExpanded ? "See less..." : "See more..."}
          </div>
        )}
      </div>
    );
  };

  // Carousel component
  const PostCarousel = ({ files, postId }) => {
    const carouselRef = useRef(null);
    const [touchPosition, setTouchPosition] = useState(null);
    const currentIndex = currentSlides[postId] || 0;

    // Go to next slide
    const goToNextSlide = () => {
      setCurrentSlides((prev) => ({
        ...prev,
        [postId]: (prev[postId] + 1) % files.length,
      }));
    };

    // Go to previous slide
    const goToPrevSlide = () => {
      setCurrentSlides((prev) => ({
        ...prev,
        [postId]: (prev[postId] - 1 + files.length) % files.length,
      }));
    };

    // Handle swipe gestures
    const handleTouchStart = (e) => {
      setTouchPosition(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
      if (touchPosition === null) return;
      const currentPosition = e.touches[0].clientX;
      const direction = touchPosition - currentPosition;

      if (direction > 10) goToNextSlide();
      if (direction < -10) goToPrevSlide();
      setTouchPosition(null);
    };

    // Auto-slide every 5 seconds
    useEffect(() => {
      if (files.length <= 1) return;
      const interval = setInterval(goToNextSlide, 5000);
      return () => clearInterval(interval);
    }, [currentIndex, files.length]);

    if (!files || files.length === 0) return null;

    // Only show the current file/slide
    const currentFile = files[currentIndex];

    return (
      <div
        className="carousel-container"
        ref={carouselRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
      >
        {/* Only render the current slide */}
        <div className="carousel-content">
          {currentFile.fileType === "image" ? (
            <img
              src={currentFile.fileURL}
              alt={`Slide ${currentIndex + 1}`}
              style={{
                width: "100%",
                height: "400px",
                maxHeight: "400px",
                objectFit: "contain",
                display: "block",
                margin: "0 auto",
              }}
            />
          ) : currentFile.fileType === "video" ? (
            <video
              style={{
                width: "100%",
                height: "400px",
                maxHeight: "400px",
                objectFit: "contain",
                margin: "0 auto",
              }}
              controls
              muted
              playsInline
              className="lazy-video"
            >
              <source src={currentFile.fileURL} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : null}
        </div>

        {/* Navigation Arrows */}
        {files.length > 1 && (
          <>
            <button
              className="carousel-nav-button prev"
              onClick={goToPrevSlide}
            >
              ❮
            </button>
            <button
              className="carousel-nav-button next"
              onClick={goToNextSlide}
            >
              ❯
            </button>
          </>
        )}

        {/* Pagination Dots */}
        {files.length > 1 && (
          <div className="carousel-indicators">
            {files.map((_, index) => (
              <button
                key={index}
                className={`carousel-indicator ${index === currentIndex ? 'active' : ''}`}
                onClick={() => setCurrentSlides((prev) => ({ ...prev, [postId]: index }))}
              />
            ))}
          </div>
        )}

        {/* Slide Counter */}
        {files.length > 1 && (
          <div className="carousel-counter">
            {currentIndex + 1}/{files.length}
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    // Handle post scrolling from URL hash on load
    const postId = window.location.hash.substring(1);
    if (postId) {
      const postElement = document.getElementById(postId);
      if (postElement) {
        postElement.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [posts]);

  return (
    <FrontLayout>
      <section className="section-padding-top-40 mt-5">
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
                {posts && posts.length > 0 ? (
                  posts.map((post, index) => {
                    const postId = post._id ? `post-${post._id}` : `post-${index}`;

                    return (
                      <div className="blog--card" id={postId} key={post._id || index}>
                        {/* Header Section */}
                        <div className="card-header">
                          <div className="inner__card">
                            <div className="user_image text-black">
                              <figure>
                                <img src="/favicon.ico" alt="" />
                              </figure>
                            </div>
                            <h3 className="user__name text-black">
                              <span className="start__name"><b>Focalyt</b></span>

                              {post.tags && post.tags.length > 0 && (
                                <>
                                  <span className="tag__user">
                                    is with <b>{post.tags[0].name}</b>
                                  </span>

                                  {post.tags.length > 1 && (
                                    <>
                                      <span className="more__user strong"> & <b>{post.tags.length - 1}</b></span>
                                      <span className="other"><b> Others</b></span>
                                    </>
                                  )}
                                </>
                              )}
                            </h3>
                          </div>

                          <h5 className="blog__title text-black">
                            <PostText
                              content={post.content}
                              postId={postId}
                            />
                          </h5>
                        </div>

                        {/* Main Content */}
                        <div className="card-content">
                          {post.files && post.files.length > 0 && (
                            <div className="card-image">
                              <div className="happy_candidates" id="blog--images">
                                <PostCarousel
                                  files={post.files}
                                  postId={postId}
                                />
                              </div>
                            </div>
                          )}

                          {/* Interaction Buttons */}
                          <div className="interaction-buttons d-flex align-items-center justify-content-center">
                            <div
                              className="share_link"
                              onClick={() => handleShare(postId)}
                            >
                               <FontAwesomeIcon icon={faShare} /> Share
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-12 text-center py-5">
                    <h3 className="text-muted">No posts available.</h3>
                    <p>Check back later for new content</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>
    </FrontLayout>  
  );
}

export default Community;