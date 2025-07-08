import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FrontLayout from '../../../Component/Layouts/Front';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare , faDownload } from '@fortawesome/free-solid-svg-icons';  
import $ from 'jquery';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
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



  const handleDownloadAllImages = async (files) => {
    if (!files || files.length === 0) {
      alert("No files to download!");
      return;
    }
  
   
      if (files.length === 1) {
        // For single file download
        const fileURL = files[0];
        const fileName = fileURL.split('/').pop().split('?')[0]; // Handle query params in URL
        
        try {
          // Fetch the file first to handle CORS issues
          const response = await fetch(fileURL);
          if (!response.ok) throw new Error(`Failed to fetch: ${fileURL}`);
          
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = blobUrl;
          link.setAttribute("download", fileName);
          document.body.appendChild(link);
          link.click();
          
          // Clean up
          setTimeout(() => {
            window.URL.revokeObjectURL(blobUrl);
            document.body.removeChild(link);
          }, 100);
          
        } catch (error) {
          console.error("Error downloading file:", error);
          alert(`Failed to download file: ${fileName}. Please try again.`);
        }
        
        return;
      }
  
    // For multiple files, create a ZIP
    try {
      const zip = new JSZip();
      const folder = zip.folder("Downloaded_Images");
      let failedFiles = [];
      let successCount = 0;
      
      // Show loading message
      
      
      // Fetch files one by one and add to ZIP
      for (let i = 0; i < files.length; i++) {
        const fileURL = files[i];
        const fileName = fileURL.split('/').pop() || `image${i+1}.jpg`;
        
        try {
          // Explicitly fetch each file
          const response = await fetch(fileURL, { 
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
          }
          
          // Get the actual file content as blob
          const blob = await response.blob();
          
          // Add the blob to the ZIP file with proper filename
          folder.file(fileName, blob);
          successCount++;
          
          console.log(`Added file ${i+1}/${files.length} to ZIP: ${fileName}`);
        } catch (error) {
          console.error(`Failed to add file ${i+1}:`, error);
          failedFiles.push(fileURL);
        }
      }
      
      if (successCount === 0) {
        alert("Failed to download any files. Please check your network connection.");
        return;
      }
      
      // Generate and download the ZIP file
      console.log("Generating ZIP with", successCount, "files");
      const content = await zip.generateAsync({ 
        type: "blob",
        compression: "DEFLATE" 
      });
      
      console.log("ZIP generated, size:", content.size);
      saveAs(content, "Images.zip");
      
      if (failedFiles.length > 0) {
        console.warn("Failed files:", failedFiles);
        alert(`Downloaded ${successCount} of ${files.length} files. Some files couldn't be downloaded.`);
      }
    } catch (error) {
      console.error("Error creating ZIP:", error);
      alert("An error occurred while creating the ZIP file. Please try again.");
    }
  };

// Alternative approach without using JSZip for browsers that block it
const downloadFilesSequentially = (files) => {
  console.log("Sequential download method for files:", files);
  
  if (!files || files.length === 0) {
    alert("No files to download!");
    return;
  }
  
  // Create hidden iframe for downloads to avoid page navigation
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  document.body.appendChild(iframe);
  
  let downloadCount = 0;
  
  const downloadNext = (index) => {
    if (index >= files.length) {
      document.body.removeChild(iframe);
      alert(`Downloaded ${downloadCount} of ${files.length} files`);
      return;
    }
    
    const fileURL = files[index];
    console.log(`Downloading file ${index+1}/${files.length}:`, fileURL);
    
    try {
      iframe.src = fileURL;
      downloadCount++;
      
      // Schedule next download with delay
      setTimeout(() => downloadNext(index + 1), 1000);
    } catch (error) {
      console.error(`Error downloading file ${index+1}:`, error);
      // Continue to next file even if current fails
      setTimeout(() => downloadNext(index + 1), 500);
    }
  };
  
  // Start the download sequence
  downloadNext(0);
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
    const sliderRef = useRef(null);
    const slickInitialized = useRef(false);
    const currentIndex = currentSlides[postId] || 0;
    
    // Function to initialize Slick Slider
    const initSlickSlider = (selector, options) => {
      if (typeof $ !== 'undefined') {
        $(selector).slick(options);
      }
    };
    
    // Initialize the slider when component mounts
    useEffect(() => {
      if (!files || files.length === 0) return;
      
      // Only initialize slick if it hasn't been already
      if (sliderRef.current && !slickInitialized.current) {
        const slickOptions = {
          dots: true,
          infinite: true,
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: true,
          autoplay: true,
          autoplaySpeed: 1500, // Match your existing 5-second interval
          responsive: [
            { breakpoint: 1366, settings: { slidesToShow: 1 } },
            { breakpoint: 768, settings: { slidesToShow: 1 } },
          ],
          // Synchronize slick's state with your React state
          beforeChange: (current, next) => {
            setCurrentSlides((prev) => ({
              ...prev,
              [postId]: next,
            }));
          },
          initialSlide: currentIndex // Start at the current index
        };
        
        // Initialize slick slider
        initSlickSlider(`#slider-${postId}`, slickOptions);
        slickInitialized.current = true;
      }
      
      // Cleanup function to destroy slick when component unmounts
      return () => {
        if (slickInitialized.current && sliderRef.current) {
          try {
            $(`#slider-${postId}`).slick('unslick');
            slickInitialized.current = false;
          } catch (e) {
            console.error("Error unslicking slider:", e);
          }
        }
      };
    }, [files, postId]);
    
    // Update slick slider when currentIndex changes
    useEffect(() => {
      if (slickInitialized.current && sliderRef.current) {
        try {
          $(`#slider-${postId}`).slick('slickGoTo', currentIndex);
        } catch (e) {
          console.error("Error going to slide:", e);
        }
      }
    }, [currentIndex, postId]);
    
    if (!files || files.length === 0) return null;
    
    return (
      <div className="postsection" id={`post-${postId}`}>
        <div className="slider_images" id={`slider-${postId}`} ref={sliderRef}>
          {files.map((file, index) => (
            <div key={index}>
              {file.fileType === "image" ? (
                <img
                  src={file.fileURL}
                  className="d-block w-100"
                  alt={`Slide ${index + 1}`}
                  style={{
                    height: "400px",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                />
              ) : file.fileType === "video" ? (
                <video
                  className="d-block w-100"
                  controls
                  muted
                  playsInline
                  style={{
                    height: "400px",
                    maxHeight: "400px",
                    objectFit: "contain",
                  }}
                >
                  <source src={file.fileURL} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              ) : null}
            </div>
          ))}
        </div>
        
        {/* Custom Slide Counter */}
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
                          <div className="interaction-buttons d-flex align-items-center justify-content-around">
                            <div
                              className="share_link"
                              onClick={() => handleShare(postId)}
                            >
                              <FontAwesomeIcon icon={faShare} /> Share
                            </div>
                            <div
                              className="share_link"
                              onClick={() => handleDownloadAllImages(post.files.map(file => file.fileURL))}
                            >
                              <FontAwesomeIcon icon={faDownload} /> Download
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