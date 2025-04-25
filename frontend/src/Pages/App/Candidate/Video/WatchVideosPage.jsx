import React, { useState, useEffect } from 'react';
import moment from 'moment';
import axios from 'axios';
import {Link} from 'react-router-dom';

const WatchVideosPage = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${backendUrl}/watchVideos`, {
          headers: { 'x-auth': token }
        });
        
        if (response.data && response.data.videos) {
          setVideos(response.data.videos);
        } else if (Array.isArray(response.data)) {
          setVideos(response.data);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching videos:', error);
        setLoading(false);
      }
    };

    fetchVideos();
  }, [backendUrl]);

  const handleVideoClick = (videoUrl) => {
    window.open(videoUrl, '_blank');
  };

  return (
    <>

        {/* Breadcrumb section */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">Videos </h3>
                <div className="breadcrumb-wrapper col-12">
                 
                  <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Watch Videos</li>
                </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Main content */}
        <div className="content-body">
          <div className="row">
            <div className="col-12 rounded equal-height-2 coloumn-2">
              <div className="card">
                <div className="card-content">
                  <div className="col-xl-12">
                    <div className="row">
                      {loading ? (
                        <div className="col-12 text-center py-3">
                          <p>Loading videos...</p>
                        </div>
                      ) : videos && videos.length > 0 ? (
                        videos.map((video, index) => (
                          <div 
                            key={index} 
                            className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 py-2"
                          >
                            <span>
                              <em className="font-weight-bold">
                                Video Posted On: {moment(video.createdAt).utcOffset("+05:30").format("DD MMM YYYY")}
                              </em>
                            </span>
                            <div className="position-relative mt-2">
                              <img 
                                style={{ width: '100%' }} 
                                src="/public_assets/images/resource/about-2.jpg"
                                className="img-fluid rounded shadow videolinkclass" 
                                alt="Video thumbnail" 
                                data-videolink={video.embedURL}
                              />
                              <a 
                                target="_blank" 
                                href={video.embedURL} 
                                className="glightbox play-btn mt-1"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleVideoClick(video.embedURL);
                                }}
                              >
                                <div className="pluscenter next-center">
                                  <div className="pulse">
                                    <img 
                                      src="/public_assets/images/resource/ytplay.png" 
                                      className="play-button"
                                      alt="Play button"
                                    />
                                  </div>
                                </div>
                              </a>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="col-12 text-center py-3">
                          <p>No Records found!</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
     
    </>
  );
};

export default WatchVideosPage;