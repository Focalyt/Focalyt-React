import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import FrontLayout from '../../../Component/Layouts/Front';
import JSZip from "jszip";
import { saveAs } from "file-saver";
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faShare, faDownload, faFilter } from '@fortawesome/free-solid-svg-icons';
import $ from 'jquery';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const PostText = React.memo(function PostText({ content, postId, isExpanded, onToggleExpand }) {
  const textRef = useRef(null);
  const [truncated, setTruncated] = useState(false);

  useEffect(() => {
    const checkTruncation = () => {
      if (!textRef.current) return;
      const element = textRef.current;

      const style = window.getComputedStyle(element);
      const lineHeight = parseFloat(style.lineHeight) || 1.5 * parseFloat(style.fontSize);

      const originalStyles = {
        maxHeight: element.style.maxHeight,
        overflow: element.style.overflow,
        webkitLineClamp: element.style.webkitLineClamp,
      };

      element.style.maxHeight = 'none';
      element.style.overflow = 'visible';
      element.style.webkitLineClamp = 'unset';

      const fullHeight = element.scrollHeight;
      const lineCount = Math.ceil(fullHeight / lineHeight);
      setTruncated(lineCount > 3);

      element.style.maxHeight = originalStyles.maxHeight;
      element.style.overflow = originalStyles.overflow;
      element.style.webkitLineClamp = originalStyles.webkitLineClamp;
    };

    const timer = setTimeout(checkTruncation, 10);
    window.addEventListener('resize', checkTruncation);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkTruncation);
    };
  }, [content]);

  return (
    <div className="post-text-container">
      <div ref={textRef} className={isExpanded ? "show-text" : "hidden-text"}>
        {content || "No content available"}
      </div>

      {truncated && (
        <div
          className={`toggle-more ${truncated ? 'toggle-more-visible' : 'toggle-more-hidden'}`}
          onClick={() => onToggleExpand(postId)}
        >
          {isExpanded ? "See less..." : "See more..."}
        </div>
      )}
    </div>
  );
});

const PostCarousel = React.memo(function PostCarousel({ files, postId }) {
  const sliderRef = useRef(null);
  const slickInitialized = useRef(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const initSlickSlider = (selector, options) => {
    if (typeof $ !== 'undefined') {
      $(selector).slick(options);
    }
  };

  useEffect(() => {
    if (!files || files.length === 0) return;

    if (sliderRef.current && !slickInitialized.current) {
      const slickOptions = {
        dots: true,
        infinite: true,
        slidesToShow: 1,
        slidesToScroll: 1,
        arrows: true,
        autoplay: true,
        autoplaySpeed: 1500,
        responsive: [
          { breakpoint: 1366, settings: { slidesToShow: 1 } },
          { breakpoint: 768, settings: { slidesToShow: 1 } },
        ],
        beforeChange: (current, next) => {
          setCurrentIndex(next);
        },
        initialSlide: 0,
      };

      initSlickSlider(`#slider-${postId}`, slickOptions);
      slickInitialized.current = true;
    }

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

      {files.length > 1 && (
        <div className="carousel-counter">
          {currentIndex + 1}/{files.length}
        </div>
      )}
    </div>
  );
});

function Community() {
  const [posts, setPosts] = useState([]);
  const [expandedPosts, setExpandedPosts] = useState({});

  const [startDate, setStartDate] = useState();
  const [endDate, setEndDate] = useState();
  const [filterData, setFilterData] = useState();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const handleFilter = () => {
    if (!startDate || !endDate) {
      alert("Please select both start and end date!");
      return;
    }

    const filtered = posts.filter((post) => {
      const postDate = new Date(post.createdAt);
      const from = new Date(startDate);
      const to = new Date(endDate);
      return postDate >= from && postDate <= to;
    });

    setFilterData(filtered);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${backendUrl}/community`);
        setPosts(response.data.posts);
      } catch (error) {
        console.error("Error fetching posts data:", error);
      }
    };
    fetchData();
  }, [backendUrl]);

  // Text expansion toggle handler
  const toggleExpand = useCallback((postId) => {
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
  }, []);



  const handleDownloadAllImages = useCallback(async (files) => {
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
        const fileName = fileURL.split('/').pop() || `image${i + 1}.jpg`;

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

          console.log(`Added file ${i + 1}/${files.length} to ZIP: ${fileName}`);
        } catch (error) {
          console.error(`Failed to add file ${i + 1}:`, error);
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
  }, []);

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
      console.log(`Downloading file ${index + 1}/${files.length}:`, fileURL);

      try {
        iframe.src = fileURL;
        downloadCount++;

        // Schedule next download with delay
        setTimeout(() => downloadNext(index + 1), 1000);
      } catch (error) {
        console.error(`Error downloading file ${index + 1}:`, error);
        // Continue to next file even if current fails
        setTimeout(() => downloadNext(index + 1), 500);
      }
    };

    // Start the download sequence
    downloadNext(0);
  };




  // Share handler
  const handleShare = useCallback((postId) => {
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
  }, []);

  const renderedPosts = useMemo(() => {
    if (!posts || posts.length === 0) return null;

    return posts.map((post, index) => {
      const postId = post._id ? `post-${post._id}` : `post-${index}`;
      const isExpanded = !!expandedPosts[postId];

      return (
        <div className="blog--card" id={postId} key={post._id || index}>
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
                isExpanded={isExpanded}
                onToggleExpand={toggleExpand}
              />
            </h5>
          </div>

          <div className="card-content">
            {post.files && post.files.length > 0 && (
              <div className="card-image">
                <div className="happy_candidates" id="blog--images">
                  <PostCarousel files={post.files} postId={postId} />
                </div>
              </div>
            )}

            <div className="interaction-buttons d-flex align-items-center justify-content-around">
              <div className="share_link" onClick={() => handleShare(postId)}>
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
    });
  }, [expandedPosts, handleDownloadAllImages, handleShare, posts, toggleExpand]);
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
            <div className="d-flex">
              {!isSidebarOpen && (
                <button
                  type="button"
                  className="sidebar-toggle-btn"
                  onClick={() => setIsSidebarOpen((prev) => !prev)}
                >
                  <span className="sidebar-toggle-icon" />
                </button>
              )}
              <div
                className="filter-section container"
                style={{ marginTop: "7px", marginBottom: "1.5rem", position: "relative" }}
              >
                {!isSidebarOpen && (
                  <button
                    type="button"
                    className="filter-toggle-btn"
                    aria-expanded={isFilterOpen}
                    aria-label="Open filters"
                    onClick={() => setIsFilterOpen((prev) => !prev)}
                  >
                    <FontAwesomeIcon icon={faFilter} />
                    <span className="filter-toggle-text">Filter</span>
                  </button>
                )}

                  <div
                    className={`filter-overlay ${isFilterOpen ? 'open' : ''}`}
                    onClick={() => setIsFilterOpen(false)}
                    role="presentation"
                  />

                  <div className={`filter-drawer ${isFilterOpen ? 'open' : ''}`}>
                    <div className="filter-drawer-header">
                      <div className="filter-drawer-title">Filters</div>
                      <button
                        type="button"
                        className="filter-close-btn"
                        onClick={() => setIsFilterOpen(false)}
                      >
                        ×
                      </button>
                    </div>
                  <div className="row align-items-center">
                    <div className="col-md-3 CaledarSpace">
                      <label>Start Date:</label>
                      <DatePicker
                        selected={startDate}
                        onChange={(date) => setStartDate(date)}
                        dateFormat="dd-MM-yyyy"
                        className="form-control"
                        placeholderText="Select Start Date"
                      />
                    </div>
                    <div className="col-md-3">
                      <label>End Date:</label>
                      <DatePicker
                        selected={endDate}
                        onChange={(date) => setEndDate(date)}
                        dateFormat="dd-MM-yyyy"
                        className="form-control"
                        placeholderText="Select End Date"
                      />
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-primary mt-2 w-100 filterBtn"
                        onClick={() => {
                          handleFilter();
                          setIsFilterOpen(false);
                        }}
                      >
                        Filter Posts
                      </button>
                    </div>
                    <div className="col-md-3">
                      <button
                        className="btn btn-secondary mt-2 w-100"
                        onClick={() => {
                          setStartDate("");
                          setEndDate("");
                          setFilterData([]);
                          setIsFilterOpen(false);
                        }}
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>
                  </div>
                </div>
           </div>
            <div className="mainContainer">
              <div className={`leftSidebar LeftSide  ${isSidebarOpen ? 'open' : ''}`}>
                <div className="sidebar">
                  <button
                    type="button"
                    className="sidebar-close-btn"
                    onClick={() => setIsSidebarOpen(false)}
                  >
                    ×
                  </button>
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
                      <h4>Summer Industry For Colleges</h4>
                      <p>Courses Started at ₹3500</p>
                    </div>
                    
                  </div>

                  {/* Special Offers */}
                  <div className="section">
                    <div className="section-titles">
                      🎁 Special Offers For Schools
                    </div>
                    <div className="offer-card green">
                      <strong>Courses Started</strong>
                      <span>@199 <sup>*conditions apply</sup></span>
                    </div>
                    
                  </div>
                  <div className="section">
                    <div className="section-titles">
                      🎁 Special Offers For Colleges
                    </div>
                    <div className="offer-card green">
                      <strong>Courses Started</strong>
                      <span>@1999 <sup>*conditions apply</sup></span>
                    </div>
                    
                  </div>

                  {/* Success Stories */}
                  <div className="section">
                    <div className="section-titles">
                      🏆 Success Stories
                    </div>
                    <div className="success-item">
                      <span>🏫</span>
                      <span>Holy Angels School </span>
                    </div>
                    {/* <div className="success-item">
                      <span>🏫</span>
                      <span>St. Xavier's - 3 Labs</span>
                    </div> */}
                  </div>
                </div>
              </div>
              <div className="mainBody">
              

                {renderedPosts ? (
                  renderedPosts
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
      <style>
        {
          `
          .filterBtn{
          border: 1px solid #fc2b5a!important;
          }
          .mainContentLayout {
  width: 100%;
}

.mainContainer { /* changes done*/
  display: flex;
  width: 100%;
  /* height: 100vh;  Previous fixed height commented for better scroll */
}

.mainContent {  /* cahnges done*/
  display: flex;
  width: 100%;
  /* height: 100vh;  Previous fixed height commented for better scroll */
  /* border: 1px solid red;  Old debug border commented */
  /* margin-top: 80px;  Old layout tweak commented */
}
.section-padding-top-40{
  padding-top: 45px ;
}

/* Main Header Layout */
.blog_header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #ffffff;
  padding: 10px 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 0;
  z-index: 1000;
}

/* Logo and Search */
.blog_logo {
  display: flex;
  align-items: center;
  gap: 20px;
}

.blogFocalLogo img {
  width: 40px;
  height: 40px;
}

.blogSearch {
  position: relative;
}

.bg-search {
  width: 40px;
  height: 40px;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: start;
  overflow: hidden;
  border-radius: 50%;
}

.blog_input {
  font-size: 16px;
  outline: none;
  box-shadow: none;
  width: auto;
}

/* Navigation Links */
.blog_navigation {
  display: flex;
  align-items: center;
  gap: 20px;
}

.nav_item {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  cursor: pointer;
}

.nav_item img {
  width: 24px;
  height: 24px;
  margin-bottom: 5px;
}

.nav_item span {
  font-size: 14px;
  color: #333;
}

.sidebar {
  width: 250px;
  height: 100vh;
  background: white;
  border-right: 1px solid #e5e7eb;
  overflow-y: auto;
}

.notification {
  padding: 16px;
  background: #eff6ff;
  border-bottom: 1px solid #dbeafe;
  position: relative;
}

.notification h4 {
  color: #1e40af;
  margin-bottom: 4px;
  font-size: 14px;
}

.notification p {
  color: #2563eb;
  font-size: 13px;
}

.notification .close {
  position: absolute;
  right: 12px;
  top: 12px;
  cursor: pointer;
  color: #3b82f6;
}

.section {
  padding: 16px;
  border-bottom: 1px solid #e5e7eb;
}

.section-titles {
  font-size: 14px;
  font-weight: 600;
  color: #f3345a;
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.lab-card {
  background: #f9fafb;
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 8px;
}

.lab-card h4 {
  font-size: 14px;
  color: #1f2937;
  margin-bottom: 4px;
}

.lab-card p {
  font-size: 13px;
  color: #6b7280;
}

.news-item {
  margin-bottom: 12px;
}

.news-item h4 {
  font-size: 13px;
  color: #1f2937;
  margin-bottom: 2px;
}

.news-item p {
  font-size: 12px;
  color: #6b7280;
}

.offer-card {
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 8px;
  font-size: 13px;
}

.offer-card.green {
  background: #f0fdf4;
  border: 1px solid #dcfce7;
}

.offer-card.orange {
  background: #fff7ed;
  border: 1px solid #ffedd5;
}

.offer-card strong {
  display: block;
  margin-bottom: 2px;
}

.offer-card.green strong {
  color: #16a34a;
}

.offer-card.orange strong {
  color: #ea580c;
}

.success-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: #4b5563;
  margin-bottom: 8px;
}

/* Main Section */
.sidebar-main-section {
  text-align: center;
  margin-bottom: 20px;
}

.profile {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.profile-img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
}

.profile-name {
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
}

.profile-followers {
  color: #555;
  font-size: 14px;
  margin-bottom: 15px;
}

.btn-create {
  background-color: #4070f4;
  color: #ffffff;
  border: none;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  margin-bottom: 10px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn-create:hover {
  background-color: #3058c7;
}

.btn-view-member {
  background-color: transparent;
  border: 1px solid #ccc;
  border-radius: 20px;
  padding: 8px 15px;
  font-size: 14px;
  cursor: pointer;
}

.btn-view-member:hover {
  border-color: #4070f4;
}

/* Sidebar Links Section */
.sidebar-links-section {
  border-top: 1px solid #eee;
  padding-top: 15px;
  overflow-y: auto;
  max-height: calc(100vh - 180px);
}
.mainBody::-webkit-scrollbar{
  display: none;
}
/* Hide horizontal scrollbar */
.sidebar-links-section::-webkit-scrollbar {
  width: 5px;
}

.sidebar-links-section::-webkit-scrollbar-thumb {
  background-color: #ccc;
  border-radius: 10px;
}

.sidebar-links-section::-webkit-scrollbar-thumb:hover {
  background-color: #999;
}

.sidebar-links {
  list-style: none;
  padding: 0;
  margin: 0;
}

.sidebar-link {
  padding: 10px 0;
  font-size: 14px;
  color: #555;
  cursor: pointer;
  transition: color 0.3s ease;
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-link.active {
  color: #4070f4;
  font-weight: bold;
  border-left: 4px solid #4070f4;
  padding-left: 16px;
}

.sidebar-link:hover {
  color: #4070f4;
}

/* Main Body */
.mainBody {
  flex: 1;
  background-color: #f8f9fa;
  padding: 20px;
  width: 60%;
  overflow: scroll;
}

/* Blog Card */
.blog--card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin-bottom: 40px;
  /* padding: 5px 15px; */
}

/* Header Section */
.card-header {
  padding: 10px 15px!important;
  color: #fff;
}

.user_image figure img {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

.card-header .blog__title {
  font-size: 22px;
}

.inner__card {
  display: flex;
  gap: 5px;
  align-items: center;
  justify-content: start;
  width: 100%;
}

.inner__card .user-info {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-grow: 1;
}

.inner__card .dropdown-wrapper {
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

/* Dropdown container styling */
.dropdown-container-post {
  position: relative;
  display: inline-block;
}

/* Dropdown trigger styling */
.dropdown-trigger-post {
  cursor: pointer;
  padding: 5px;
}

/* Dropdown menu styling */
.dropdown-post {
  position: absolute;
  right: 0;
  top: 100%;
  background-color: white;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
  border-radius: 4px;
  min-width: 120px;
  display: none;  /* Hidden by default */
  z-index: 1000;  /* Ensure it appears above other content */
}

/* Show dropdown when active */
.dropdown-post.active {
  display: block;  /* Show when active class is present */
  color: #000;
}

/* Dropdown items styling */
.dropdown-items {
  padding: 8px 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dropdown-items:hover {
  background-color: #f5f5f5;
}

/* Style for icons in dropdown */
.dropdown-items i {
  width: 16px;
}

/* Add some spacing between dropdown items */
.dropdown-items:not(:last-child) {
  border-bottom: 1px solid #eee;
}
.user__name {
  font-size: 16px;
  color: #000;
  font-weight: 400;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
  margin: 0;
}

.start__name {
  font-size: 18px;
  font-weight: bold;
  display: inline;
}

.tag__user,
.strong,
.more__user,
.other {
  font-size: 16px;
  display: inline;
  white-space: nowrap;
}

.strong {
  color: #FC2B5A;
}

.more__user {
  color: #FC2B5A;
}

.other {
  color: #555;
}

.video_height {
  max-height: 335px;
}

/* Main Content */
.card-content {
  padding: 0px 20px;
  gap: 20px;
}

#blog--images .happy_candidate_images img, 
.blog--images .happy_candidate_images img 
{
  width: 100%;
  max-height: 335px;
  object-fit: contain;
}

/* Right Sidebar */
.rightSidebar {
  width: 250px;
  border-left: 1px solid #eee;
  background-color: #ffffff;
}

/* Text truncation related styles */
.post-text-container {
  position: relative;
  width: 100%;
  margin-bottom: 5px;
  margin-top: 10px;
}

/* Hidden text with fixed line count */
.hidden-text {
  display: -webkit-box;
  -webkit-line-clamp: 3; /* Show exactly 3 lines */
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: all 0.3s ease;
  line-height: 1.5;
  font-size: 14px;
  max-height: calc(1.5em * 3); /* Calculate based on line-height */
  color: #333;
}

/* Expanded text */
.show-text {
  display: block;
  overflow: visible;
  transition: all 0.3s ease;
  line-height: 1.5;
  font-size: 14px;
  max-height: none; /* Remove height restriction */
  color: #333;
}

/* See more/less button */
.toggle-more {
  color: #ff6984;
  font-size: 14px;
  cursor: pointer;
  font-weight: 500;
  display: block;
  margin-top: 5px;
  transition: all 0.3s ease;
}

.toggle-more:hover {
  text-decoration: underline;
}

/* Hide toggle button by default */
.toggle-more-hidden {
  display: none;
}

/* Show toggle button when needed */
.toggle-more-visible {
  display: block;
}

/* Carousel related styles */
.carousel-container {
  position: relative;
  overflow: hidden;
  border-radius: 8px;
  width: 100%;
  height: auto;
  max-height: 400px;
  margin: 15px 0;
}

.carousel-content {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Carousel navigation */
.carousel-nav-button {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  /* background-color: rgba(0, 0, 0, 0.5); */
  background-color: rgb(243 65 106) !important;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 18px;
  opacity: 0.7;
  z-index: 10;
}

.carousel-nav-button:hover {
  opacity: 1;
}

.carousel-nav-button.prev {
  left: 10px;
}

.carousel-nav-button.next {
  right: 10px;
}

/* Carousel indicators */
.carousel-indicators {
  position: absolute;
  bottom: 20px;
  left: 80%;
  transform: translateX(-50%);
  display: flex;
  gap: 8px;
  z-index: 10;
}

.carousel-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0);
  border: none;
  cursor: pointer;
  padding: 0;
  position: relative;
  left: 50%!important;
  transform: translate(-50%)!important;
}

.carousel-indicator.active {
  width: 12px;
  height: 12px;
  background: rgb(243 65 106) ;
}

/* Carousel counter */
.carousel-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  /* background: rgba(0, 0, 0, 0.5); */
  background-color: rgb(243 65 106) !important;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 10;
}

.interaction-buttons {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 10px;
  background-color: #f9f9f9;
  border-top: 1px solid #ddd;
  padding-inline: 45px;
}

/* Container for the slider */
/* Custom styles for Slick Slider */

/* Container for the slider */
.postsection {
  position: relative;
  margin: 15px 0;
  overflow: hidden;
  border-radius: 8px;
}

/* Image and Video container styles */
.postsection .slider_images {
  width: 100%;
  max-height: 400px;
}

.postsection .slider_images img,
.postsection .slider_images video {
  width: 100%;
  height: 400px;
  object-fit: contain;
  margin: 0 auto;
}

/* Style the Slick arrows */
.postsection .slick-prev, 
.postsection .slick-next {
  width: 40px;
  height: 40px;
  background-color: rgb(243 65 106) !important;
  border-radius: 50%;
  z-index: 10;
}

.postsection .slick-prev {
  left: 10px;
}

.postsection .slick-next {
  right: 10px;
}

.postsection .slick-prev:hover,
.postsection .slick-next:hover,
.postsection .slick-prev:focus,
.postsection .slick-next:focus {
  background-color: rgb(243 65 106) !important;
  opacity: 1;
}

.postsection .slick-prev:before,
.postsection .slick-next:before {
  font-size: 20px;
  color: white;
  opacity: 1;
}

.postsection .slick-dots {
  bottom: -28px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
}

.postsection .slick-dots li {
  width: 12px;
  height: 12px;
}

.postsection .slick-dots li button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #000; 
  border: none;
  padding: 0;
}

.postsection .slick-dots li button:before {
  content: "";
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #000;
  opacity: 1;
  position: absolute;
  top: 0;
  left: 0;
}

.postsection .slick-dots li.slick-active button {
  background-color: rgb(243 65 106) ;
}

.postsection .slick-dots li.slick-active button:before {
  background-color: rgb(243 65 106) ;
  opacity: 1;
}

/* Custom slide counter */
.postsection .carousel-counter {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgb(243 65 106) ;
  color: white;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 12px;
  z-index: 10;
}

/* Ensure slides transition smoothly */
.postsection .slick-slide {
  transition: opacity 0.3s ease;
}

.share_link {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 16px;
  color: #555;
  cursor: pointer;
  transition: color 0.3s ease;
}

.share_link i {
  font-size: 20px;
}

.share_link:hover {
  color: #FC2B5A;
}

/* Community Feed Styles */
.community-section {
  background-color: #f8f9fa;
}

.community-feed {
  flex: 1;
  background-color: transparent;
  padding: 0;
  width: 60%;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
  scrollbar-color: #ddd transparent;
}

.community-feed::-webkit-scrollbar {
  width: 6px;
}

.community-feed::-webkit-scrollbar-thumb {
  background-color: #ddd;
  border-radius: 3px;
}

.community-feed::-webkit-scrollbar-thumb:hover {
  background-color: #bbb;
}

/* Community Header */
.community-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, #f3345a, #f55b78);
  border-radius: 12px;
  color: white;
  margin-bottom: 24px;
  box-shadow: 0 4px 12px rgba(243, 52, 90, 0.2);
  text-align: center;
}

.community-header h2 {
  font-size: 1.8rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.community-header p {
  opacity: 0.9;
  font-size: 1rem;
  margin-bottom: 0;
}

/* Posts Container */
.posts-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
  padding: 0 8px;
}

/* Post Cards */
.post-card {
  background-color: #fff;
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border: none;
}

.post-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 25px rgba(0, 0, 0, 0.12);
}

/* Post Header */
.post-header {
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.post-author {
  display: flex;
  align-items: center;
  gap: 12px;
}

.author-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  overflow: hidden;
  background-color: #f0f0f0;
  border: 2px solid #f3f3f3;
}

.author-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.author-info {
  flex: 1;
}

.author-name {
  font-size: 15px;
  font-weight: 400;
  margin: 0 0 2px 0;
  line-height: 1.3;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.primary-name {
  font-weight: 700;
  color: #222;
}

.tag-info {
  color: #555;
  font-weight: 400;
  display: inline;
}

.tag-name {
  font-weight: 600;
  color: #f3345a;
}

.additional-tags {
  color: #555;
}

.tag-count {
  font-weight: 600;
  color: #f3345a;
}

.post-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: #888;
  margin-top: 4px;
}

.post-date {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* Post Content */
.post-content {
  padding: 20px;
}

.post-text {
  margin-bottom: 16px;
}

/* Post Text Container */
.post-text-container {
  position: relative;
  width: 100%;
  margin-bottom: 0;
}

/* Hidden text with fixed line count */
.hidden-text {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  transition: all 0.3s ease;
  line-height: 1.6;
  font-size: 16px;
  max-height: calc(1.6em * 3);
  color: #333;
}

/* Expanded text */
.show-text {
  display: block;
  overflow: visible;
  transition: all 0.3s ease;
  line-height: 1.6;
  font-size: 16px;
  max-height: none;
  color: #333;
}

/* See more/less button */
.toggle-more {
  color: #f3345a;
  font-size: 14px;
  cursor: pointer;
  font-weight: 600;
  display: inline-block;
  margin-top: 5px;
  transition: all 0.2s ease;
  padding: 2px 5px;
  border-radius: 4px;
}

.toggle-more:hover {
  background-color: rgba(243, 52, 90, 0.1);
}

.toggle-more-hidden {
  display: none;
}

.toggle-more-visible {
  display: inline-block;
}

/* Media Container */
.post-media-container {
  position: relative;
  overflow: hidden;
  border-radius: 12px;
  margin: 0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.slider_images {
  width: 100%;
  max-height: 450px;
}

.post-media-item {
  width: 100%;
  height: 450px;
  object-fit: cover;
  display: block;
  margin: 0 auto;
}

/* Slick Slider Custom Styles */
.post-media-container .slick-prev,
.post-media-container .slick-next {
  width: 40px;
  height: 40px;
  background-color: rgba(243, 52, 90, 0.8) !important;
  border-radius: 50%;
  z-index: 10;
  transition: all 0.2s ease;
}

.post-media-container .slick-prev {
  left: 15px;
}

.post-media-container .slick-next {
  right: 15px;
}

.post-media-container .slick-prev:hover,
.post-media-container .slick-next:hover {
  background-color: rgba(243, 52, 90, 1) !important;
  transform: scale(1.05);
}

.post-media-container .slick-dots {
  bottom: -30px;
}

.post-media-container .slick-dots li button:before {
  font-size: 10px;
  color: #f3345a;
  opacity: 0.5;
}

.post-media-container .slick-dots li.slick-active button:before {
  opacity: 1;
  color: #f3345a;
}

/* Carousel counter */
.carousel-counter {
  position: absolute;
  top: 15px;
  right: 15px;
  background-color: rgba(243, 52, 90, 0.8);
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 500;
  z-index: 10;
  backdrop-filter: blur(4px);
}

/* Post Actions */
.post-actions {
  padding: 0 20px 20px;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;
  border-top: 1px solid #eee;
  padding-top: 15px;
}

.action-button {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 8px 14px;
  background-color: #f5f5f5;
  border: none;
  border-radius: 20px;
  color: #555;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  flex: 1;
  min-width: fit-content;
}

.action-button:hover {
  background-color: #eee;
  color: #333;
}

.action-button.active {
  background-color: rgba(243, 52, 90, 0.1);
  color: #f3345a;
}

.action-button svg {
  font-size: 16px;
}

/* Empty state styles */
.no-posts {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.05);
}

.no-posts-content {
  text-align: center;
  max-width: 400px;
}

.no-posts-content h3 {
  font-size: 20px;
  color: #333;
  margin-bottom: 10px;
}

.no-posts-content p {
  font-size: 16px;
  color: #777;
}

/* Video styles */
video.post-media-item {
  background-color: #000;
}

/* Media queries */
@media (max-width: 992px) {
  .community-feed {
    width: 100%;
  }
  
  .posts-container {
    padding: 0;
  }
  
  .action-buttons {
    flex-wrap: wrap;
  }
  
  .action-button {
    flex: 0 0 calc(50% - 4px);
  }
}

@media (max-width: 576px) {
  .post-card {
    border-radius: 12px;
  }
  
  .community-header {
    padding: 15px;
  }
  
  .community-header h2 {
    font-size: 1.5rem;
  }
  
  .post-header,
  .post-content,
  .post-actions {
    padding: 12px 15px;
  }
  
  .post-media-item {
    height: 350px;
  }
  
  .author-avatar {
    width: 40px;
    height: 40px;
  }
  
  .action-button {
    font-size: 13px;
    padding: 6px 10px;
  }
}
       `
        }
      </style>

      <style>
        {
          `
          .sidebar-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background-color: #f3345a;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
}

.filter-toggle-btn {
  display: none;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: auto;
  padding: 0 12px;
  height: 40px;
  border-radius: 8px;
  border: none;
  background-color: #f3345a;
  color: #ffffff;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  margin-bottom: 12px;
}

.filter-toggle-text {
  font-size: 14px;
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.2px;
}

.filter-toggle-btn svg {
  font-size: 16px;
}

.filter-overlay {
  display: none;
}

.filter-drawer {
  display: block;
}

.filter-drawer-header {
  display: none;
}

.filter-close-btn {
  display: none;
}

.sidebar-toggle-icon {
  width: 18px;
  height: 2px;
  background-color: #ffffff;
  position: relative;
  display: inline-block;
}

.sidebar-toggle-icon::before,
.sidebar-toggle-icon::after {
  content: "";
  position: absolute;
  left: 0;
  width: 18px;
  height: 2px;
  background-color: #ffffff;
}

.sidebar-toggle-icon::before {
  top: -6px;
}

.sidebar-toggle-icon::after {
  top: 6px;
}

.sidebar-close-btn {
  display: none;
  border: none;
  background: transparent;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
  position: absolute;
  top: 10px;
  right: 12px;
  color: #4b5563;
  z-index: 2;
}

@media (max-width: 767px) {
  .CaledarSpace{
    margin-bottom:10px;
  }
  .filter-toggle-btn {
    display: flex;
    position: sticky;
    top: 100px;
    right: 16px;
    margin-left: auto;
    // z-index: 1040;
  }

  .filter-overlay {
    display: block;
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.35);
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.18s ease;
    will-change: opacity;
    z-index: 1045;
  }

  .filter-overlay.open {
    opacity: 1;
    pointer-events: auto;
  }

  .filter-drawer {
    position: fixed;
    top: 50%;
    left: 50%;
    width: 92vw;
    max-width: 460px;
    height: 90vh;
    overflow: hidden;
    background: #ffffff;
    border: 1px solid #e5e7eb;
    border-radius: 14px;
    box-shadow: 0 18px 60px rgba(0, 0, 0, 0.25);
    padding: 16px;
    opacity: 0;
    transform: translate(-50%, -48%) scale(0.98);
    pointer-events: none;
    transition: transform 0.2s ease, opacity 0.2s ease;
    will-change: transform, opacity;
    z-index: 1050;
  }

  .filter-drawer.open {
    opacity: 1;
    transform: translate(-50%, -50%) scale(1);
    pointer-events: auto;
  }

  .filter-drawer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 10px;
    margin-bottom: 10px;
    border-bottom: 1px solid #f1f5f9;
  }

  .filter-drawer-title {
    font-weight: 700;
    color: #111827;
    font-size: 16px;
  }

  .filter-close-btn {
    display: inline-flex;
    border: none;
    background: transparent;
    font-size: 26px;
    line-height: 1;
    cursor: pointer;
    color: #4b5563;
  }

  .mainContainer {
    flex-direction: column;
    position: relative;
  }
  
  .leftSidebar {
    position: fixed;
    top: 0;
    left: -260px;
    width: 260px;
    height: 100vh;
    min-height: 100vh;
    z-index: 1050;
    transition: left 0.3s ease;
  }
  
  .leftSidebar.open {
    left: 0;
  }

  .mainBody {
    width: 100%;
  }
  
  .sidebar {
    width: 100%;
    height: 100%;
    position: relative;
  }

  .sidebar-toggle-btn {
    display: flex;
    position: sticky;
    top: 100px;
    left: 16px;
    // z-index: 1040;
  }

  .sidebar-close-btn {
    display: block;
  }
}


          `
        }
      </style>
    </FrontLayout>
  );
}

export default Community;