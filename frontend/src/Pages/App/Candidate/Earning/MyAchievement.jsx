import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MyAchievement = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const token = localStorage.getItem("token");
  
  const [approvedClaims, setApprovedClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [cardWidth, setCardWidth] = useState(320);
  const [gap, setGap] = useState(20);
  const [uploadedImages, setUploadedImages] = useState({});
  const [uploading, setUploading] = useState({});
  const [hoveredCard, setHoveredCard] = useState(null);

  useEffect(() => {
    fetchApprovedClaims();
    
    // Calculate responsive card width
    const calculateCardWidth = () => {
      if (window.innerWidth <= 576) {
        setCardWidth(235);
        setGap(15);
      } else if (window.innerWidth <= 768) {
        setCardWidth(270);
        setGap(15);
      } else {
        setCardWidth(320);
        setGap(20);
      }
    };
    
    calculateCardWidth();
    window.addEventListener('resize', calculateCardWidth);
    
    return () => window.removeEventListener('resize', calculateCardWidth);
  }, []);

  const fetchApprovedClaims = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await axios.get(`${backendUrl}/candidate/approvedRewardClaims`, {
        headers: { "x-auth": token }
      });

      if (response.data.success && response.data.data) {
        setApprovedClaims(response.data.data);
        // Load achievement images from API response
        const imagesFromAPI = {};
        response.data.data.forEach(claim => {
          if (claim.achievementImage) {
            imagesFromAPI[claim._id] = claim.achievementImage;
          }
        });
        if (Object.keys(imagesFromAPI).length > 0) {
          setUploadedImages(prev => ({ ...prev, ...imagesFromAPI }));
        }
      }
    } catch (err) {
      console.error('Error fetching approved claims:', err);
      setError('Failed to load achievements. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Navigation functions
  const goToPrevious = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex > 0 ? prevIndex - 1 : approvedClaims.length - 1
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex < approvedClaims.length - 1 ? prevIndex + 1 : 0
    );
  };

  // Handle image upload
  const handleImageUpload = async (event, claimId) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Check file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImages(prev => ({
        ...prev,
        [claimId]: reader.result
      }));
    };
    reader.readAsDataURL(file);

    // Upload to backend
    setUploading(prev => ({ ...prev, [claimId]: true }));
    
    try {
      // Step 1: Get upload URL
      const ext = file.name.split('.').pop().toLowerCase();
      const getUrlResponse = await axios.post(
        `${backendUrl}/api/getUploadUrl`,
        {
          type: file.type,
          ext: ext
        },
        {
          headers: { "x-auth": token }
        }
      );

      if (!getUrlResponse.data.status || !getUrlResponse.data.data) {
        throw new Error('Failed to get upload URL');
      }

      const { url, key } = getUrlResponse.data.data;

      // Step 2: Upload file to S3 using signed URL
      const uploadResponse = await axios.put(url, file, {
        headers: {
          'Content-Type': file.type
        }
      });

      if (uploadResponse.status === 200) {
        // Step 3: Get the full image URL
        const imageUrl = `${bucketUrl}/${key}`;
        
        // Save to state
        setUploadedImages(prev => ({
          ...prev,
          [claimId]: imageUrl
        }));

        // Step 4: Update reward claim with image URL (if endpoint exists)
        // You may need to create this endpoint in backend
        try {
          await axios.put(
            `${backendUrl}/candidate/rewardClaim/${claimId}/updateImage`,
            { achievementImage: imageUrl },
            {
              headers: { "x-auth": token }
            }
          );
        } catch (updateError) {
          console.log('Note: Update image endpoint may not exist yet. Image uploaded but not saved to claim.');
          // Store in localStorage as fallback
          const savedImages = JSON.parse(localStorage.getItem('achievementImages') || '{}');
          savedImages[claimId] = imageUrl;
          localStorage.setItem('achievementImages', JSON.stringify(savedImages));
        }

        alert('Image uploaded successfully!');
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error.response?.data?.message || error.message || 'Failed to upload image. Please try again.');
      // Remove preview on error
      setUploadedImages(prev => {
        const newState = { ...prev };
        delete newState[claimId];
        return newState;
      });
    } finally {
      setUploading(prev => {
        const newState = { ...prev };
        delete newState[claimId];
        return newState;
      });
    }
  };

  // Get image source (uploaded or default)
  const getImageSrc = (claimId, defaultSrc) => {
    // Priority: uploadedImages state > localStorage fallback > default
    const savedImages = JSON.parse(localStorage.getItem('achievementImages') || '{}');
    return uploadedImages[claimId] || savedImages[claimId] || defaultSrc;
  };

  // Get badge configuration for each achievement card
  const getBadgeConfig = (index, rewardType, status) => {
    const badgeConfigs = [
      {
        shape: 'circle',
        bgColor: '#cd853f', // Bronze
        icon: 'fa-trophy',
        iconColor: '#8b6914',
        useImage: true,
        imageSrc: '/Assets/public_assets/images/trophy.webp'
      },
      {
        shape: 'pentagon',
        bgColor: '#ffd700', // Gold
        icon: 'fa-coins',
        iconColor: '#b8860b',
        useImage: false
      },
      {
        shape: 'hexagon',
        bgColor: '#9370db', // Purple
        icon: 'fa-star',
        iconColor: '#663399',
        useImage: false
      },
      {
        shape: 'shield',
        bgColor: '#708090', // Grey
        icon: 'fa-paint-brush',
        iconColor: '#ffffff',
        useImage: false
      }
    ];

    // Cycle through badge configs if there are more than 4 achievements
    const configIndex = index % 4;
    return badgeConfigs[configIndex];
  };

  // Check if achievement is completed
  const isCompleted = (status) => {
    return status === 'approved';
  };

  // Get progress for achievement (assuming 1/1 if approved, 0/1 if not)
  const getProgress = (status) => {
    if (status === 'approved') {
      return { current: 1, total: 1 };
    }
    return { current: 0, total: 1 };
  };

  return (
    <>
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">My Achievements</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/candidate/dashboard">Home</a>
                  </li>
                  <li className="breadcrumb-item active">My Achievements</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="content-body">
        <section>
          <div className="container-fluid">
            <div className="row">
              <div className="col-12 px-0">
                <div className="table-content shadow-cashback w-100">
                  <div className="tab_head font-weight-bolder p-3">My Achievements</div>
                  <div className="tab_body bg-white p-3">
                    {loading ? (
                      <div className="text-center py-4">
                        <p>Loading achievements...</p>
                      </div>
                    ) : error ? (
                      <div className="alert alert-danger" role="alert">
                        {error}
                      </div>
                    ) : approvedClaims.length > 0 ? (
                      <div className="achievement-cards-container">
                        {/* Navigation Buttons */}
                        <div className="d-flex justify-content-center align-items-center mb-4" style={{ gap: '20px' }}>
                          <button
                            onClick={goToPrevious}
                            className="btn btn-outline-primary"
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #3b82f6',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '20px',
                              color: '#3b82f6'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#3b82f6';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <i className="fas fa-chevron-left"></i>
                          </button>

                          <div 
                            style={{
                              fontSize: '14px',
                              color: '#6b7280',
                              textAlign: 'center',
                              padding: '8px 20px',
                              backgroundColor: '#f3f4f6',
                              borderRadius: '20px',
                              fontWeight: '600'
                            }}
                          >
                            Reward will be created on 7 business days
                          </div>

                          <button
                            onClick={goToNext}
                            className="btn btn-outline-primary"
                              style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              border: '2px solid #3b82f6',
                              backgroundColor: 'white',
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                              fontSize: '20px',
                              color: '#3b82f6'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#3b82f6';
                              e.currentTarget.style.color = 'white';
                              e.currentTarget.style.transform = 'scale(1.1)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'white';
                              e.currentTarget.style.color = '#3b82f6';
                              e.currentTarget.style.transform = 'scale(1)';
                            }}
                          >
                            <i className="fas fa-chevron-right"></i>
                          </button>
                        </div>

                        {/* Slider Container */}
                        <div 
                          className="achievement-slider-wrapper"
                              style={{
                            overflow: 'hidden',
                            position: 'relative',
                            width: '100%',
                            padding: '40px 0'
                              }}
                            >
                              <div 
                                style={{
                              display: 'flex',
                              justifyContent: 'center',
                              width: '100%'
                            }}
                          >
                            <div 
                              className="achievement-slider"
                              style={{
                                display: 'flex',
                                transition: 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                gap: `${gap}px`,
                                alignItems: 'center',
                                transform: `translateX(calc(50% - ${cardWidth / 2}px - ${currentIndex * (cardWidth + gap)}px))`
                              }}
                            >
                            {approvedClaims.map((claim, index) => {
                            const badgeConfig = getBadgeConfig(index, claim.rewardType, claim.status);
                            const completed = isCompleted(claim.status);
                            const progress = getProgress(claim.status);
                            const progressPercentage = (progress.current / progress.total) * 100;

                            // Define badge shape styles
                            const getBadgeShapeStyle = () => {
                              const baseStyle = {
                                width: '140px',
                                height: '140px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                // background: `linear-gradient(135deg, ${badgeConfig.bgColor} 0%, ${badgeConfig.bgColor}dd 100%)`,
                                boxShadow: completed 
                                  ? '0 8px 24px rgba(0,0,0,0.3), 0 0 0 4px rgba(34, 197, 94, 0.2)' 
                                  : '0 8px 24px rgba(0,0,0,0.25)',
                                margin: '0 auto 20px',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                position: 'relative',
                                overflow: 'hidden'
                              };

                              switch (badgeConfig.shape) {
                                case 'circle':
                                  return { 
                                    ...baseStyle, 
                                    borderRadius: '50%',
                                    // background: completed
                                    //   ? `linear-gradient(135deg, #cd853f 0%, #d4a574 50%, #cd853f 100%)`
                                    //   : `linear-gradient(135deg, ${badgeConfig.bgColor} 0%, ${badgeConfig.bgColor}dd 100%)`,
                                    border: completed 
                                      ? '4px solid rgba(34, 197, 94, 0.5)' 
                                      : '3px solid rgba(141, 199, 63, 0.6)',
                                    padding: '10px',
                                    boxSizing: 'border-box'
                                  };
                                case 'pentagon':
                                  return {
                                    ...baseStyle,
                                    clipPath: 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)',
                                    borderRadius: '0',
                                    background: completed
                                      ? `linear-gradient(135deg, #ffd700 0%, #ffed4e 50%, #ffd700 100%)`
                                      : `linear-gradient(135deg, ${badgeConfig.bgColor} 0%, ${badgeConfig.bgColor}dd 100%)`
                                  };
                                case 'hexagon':
                                  return {
                                    ...baseStyle,
                                    clipPath: 'polygon(30% 0%, 70% 0%, 100% 50%, 70% 100%, 30% 100%, 0% 50%)',
                                    borderRadius: '0',
                                    background: completed
                                      ? `linear-gradient(135deg, #9370db 0%, #ab8ce8 50%, #9370db 100%)`
                                      : `linear-gradient(135deg, ${badgeConfig.bgColor} 0%, ${badgeConfig.bgColor}dd 100%)`
                                  };
                                case 'shield':
                                  return {
                                    ...baseStyle,
                                    clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)',
                                    borderRadius: '0',
                                    background: completed
                                      ? `linear-gradient(135deg, #708090 0%, #8899aa 50%, #708090 100%)`
                                      : `linear-gradient(135deg, ${badgeConfig.bgColor} 0%, ${badgeConfig.bgColor}dd 100%)`
                                  };
                                default:
                                  return { ...baseStyle, borderRadius: '50%' };
                              }
                            };

                            const isActive = index === currentIndex;
                            
                            return (
                                <div
                                  key={claim._id || index}
                                className="achievement-card-wrapper"
                                style={{
                                  width: `${cardWidth}px`,
                                  flex: '0 0 auto',
                                  opacity: isActive ? 1 : 0.6,
                                  transform: isActive 
                                    ? 'perspective(1000px) rotateY(0deg) scale(1)' 
                                    : 'perspective(1000px) rotateY(15deg) scale(0.9)',
                                  transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                  cursor: 'pointer'
                                }}
                                onClick={() => setCurrentIndex(index)}
                              >
                                <div 
                                  className="achievement-card"
                                  style={{
                                    background: isActive
                                      ? 'linear-gradient(to bottom, #ffffff 0%, #fefefe 100%)'
                                      : 'linear-gradient(to bottom, #ffffff 0%, #f8f9fa 100%)',
                                    borderRadius: '20px',
                                    padding: '32px 24px',
                                    boxShadow: isActive 
                                      ? '0 12px 40px rgba(0,0,0,0.18), 0 0 0 1px rgba(59, 130, 246, 0.1)' 
                                      : '0 6px 25px rgba(0,0,0,0.1)',
                                    border: isActive 
                                      ? '2px solid rgba(59, 130, 246, 0.3)' 
                                      : '2px solid #e5e7eb',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative',
                                    overflow: 'hidden'
                                  }}
                                  onMouseEnter={(e) => {
                                    if (isActive) {
                                      e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.2)';
                                      e.currentTarget.style.transform = 'translateY(-5px)';
                                    }
                                    setHoveredCard(claim._id);
                                  }}
                                  onMouseLeave={(e) => {
                                    if (isActive) {
                                      e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
                                      e.currentTarget.style.transform = 'translateY(0)';
                                    }
                                    setHoveredCard(null);
                                  }}
                                >
                                  {/* Badge Icon with Shine Effect */}
                                  <div 
                                    style={{ 
                                      ...getBadgeShapeStyle(),
                                      position: 'relative'
                                    }}
                                    onMouseEnter={(e) => {
                                      if (isActive) {
                                        e.currentTarget.style.transform = 'scale(1.05) rotate(5deg)';
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (isActive) {
                                        e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                                      }
                                    }}
                                  >
                                    {badgeConfig.useImage ? (
                                      <div
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          borderRadius: '50%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          backgroundColor: 'white',
                                          position: 'relative',
                                          zIndex: 2,
                                          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                          boxSizing: 'border-box',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        <img 
                                          src={getImageSrc(claim._id, badgeConfig.imageSrc)}
                                          alt="Achievement Badge"
                                          style={{
                                            width: '100%',
                                            height: '100%',
                                            objectFit: 'cover',
                                            objectPosition: 'center center',
                                            borderRadius: '50%',
                                            filter: completed
                                              ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4)) brightness(1.05) contrast(1.05)'
                                              : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3)) brightness(1.02) contrast(1.02)',
                                            transition: 'all 0.3s ease',
                                            display: 'block'
                                          }}
                                        />
                                        {/* Upload Button - Show only on hover */}
                                        <label
                                          htmlFor={`image-upload-${claim._id}`}
                                          style={{ 
                                            position: 'absolute',
                                            bottom: '8px',
                                            right: '8px',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: uploading[claim._id] ? '#94a3b8' : '#3b82f6',
                                            color: 'white',
                                            display: hoveredCard === claim._id || uploading[claim._id] ? 'flex' : 'none',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: uploading[claim._id] ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                            transition: 'all 0.3s ease',
                                            zIndex: 10,
                                            border: '2px solid white',
                                            pointerEvents: uploading[claim._id] ? 'none' : 'auto',
                                            opacity: hoveredCard === claim._id || uploading[claim._id] ? 1 : 0,
                                            transform: hoveredCard === claim._id || uploading[claim._id] ? 'scale(1)' : 'scale(0.8)'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!uploading[claim._id]) {
                                              e.currentTarget.style.backgroundColor = '#2563eb';
                                              e.currentTarget.style.transform = 'scale(1.1)';
                                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!uploading[claim._id]) {
                                              e.currentTarget.style.backgroundColor = '#3b82f6';
                                              e.currentTarget.style.transform = 'scale(1)';
                                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                            }
                                          }}
                                          title={uploading[claim._id] ? 'Uploading...' : 'Upload Image'}
                                        >
                                          {uploading[claim._id] ? (
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '14px' }}></i>
                                          ) : (
                                            <i className="fas fa-camera" style={{ fontSize: '14px' }}></i>
                                          )}
                                          <input
                                            type="file"
                                            id={`image-upload-${claim._id}`}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleImageUpload(e, claim._id)}
                                            disabled={uploading[claim._id]}
                                          />
                                        </label>
                                      </div>
                                    ) : (
                                      <div
                                        style={{
                                          width: '100%',
                                          height: '100%',
                                          display: 'flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          position: 'relative',
                                          backgroundColor: 'white',
                                          borderRadius: badgeConfig.shape === 'circle' ? '50%' : '0',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {uploadedImages[claim._id] ? (
                                          <img 
                                            src={uploadedImages[claim._id]}
                                            alt="Achievement Badge"
                                            style={{
                                              width: '100%',
                                              height: '100%',
                                              objectFit: 'cover',
                                              objectPosition: 'center center',
                                              borderRadius: badgeConfig.shape === 'circle' ? '50%' : '0',
                                              filter: completed
                                                ? 'drop-shadow(0 4px 8px rgba(0,0,0,0.4)) brightness(1.05) contrast(1.05)'
                                                : 'drop-shadow(0 4px 8px rgba(0,0,0,0.3)) brightness(1.02) contrast(1.02)',
                                              transition: 'all 0.3s ease',
                                              display: 'block',
                                              padding: '12px'
                                            }}
                                          />
                                        ) : (
                                          <i 
                                            className={`fas ${badgeConfig.icon}`}
                                            style={{ 
                                              fontSize: '56px',
                                              color: badgeConfig.iconColor,
                                              filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                                              transition: 'all 0.3s ease',
                                              zIndex: 2,
                                              position: 'relative'
                                            }}
                                          />
                                        )}
                                        {/* Upload Button - Show only on hover */}
                                        <label
                                          htmlFor={`image-upload-${claim._id}`}
                                          style={{ 
                                            position: 'absolute',
                                            bottom: '8px',
                                            right: '8px',
                                            width: '36px',
                                            height: '36px',
                                            borderRadius: '50%',
                                            backgroundColor: uploading[claim._id] ? '#94a3b8' : '#3b82f6',
                                            color: 'white',
                                            display: hoveredCard === claim._id || uploading[claim._id] ? 'flex' : 'none',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: uploading[claim._id] ? 'not-allowed' : 'pointer',
                                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.4)',
                                            transition: 'all 0.3s ease',
                                            zIndex: 10,
                                            border: '2px solid white',
                                            pointerEvents: uploading[claim._id] ? 'none' : 'auto',
                                            opacity: hoveredCard === claim._id || uploading[claim._id] ? 1 : 0,
                                            transform: hoveredCard === claim._id || uploading[claim._id] ? 'scale(1)' : 'scale(0.8)'
                                          }}
                                          onMouseEnter={(e) => {
                                            if (!uploading[claim._id]) {
                                              e.currentTarget.style.backgroundColor = '#2563eb';
                                              e.currentTarget.style.transform = 'scale(1.1)';
                                              e.currentTarget.style.boxShadow = '0 6px 16px rgba(59, 130, 246, 0.6)';
                                            }
                                          }}
                                          onMouseLeave={(e) => {
                                            if (!uploading[claim._id]) {
                                              e.currentTarget.style.backgroundColor = '#3b82f6';
                                              e.currentTarget.style.transform = 'scale(1)';
                                              e.currentTarget.style.boxShadow = '0 4px 12px rgba(59, 130, 246, 0.4)';
                                            }
                                          }}
                                          title={uploading[claim._id] ? 'Uploading...' : 'Upload Image'}
                                        >
                                          {uploading[claim._id] ? (
                                            <i className="fas fa-spinner fa-spin" style={{ fontSize: '14px' }}></i>
                                          ) : (
                                            <i className="fas fa-camera" style={{ fontSize: '14px' }}></i>
                                          )}
                                          <input
                                            type="file"
                                            id={`image-upload-${claim._id}`}
                                            accept="image/*"
                                            style={{ display: 'none' }}
                                            onChange={(e) => handleImageUpload(e, claim._id)}
                                            disabled={uploading[claim._id]}
                                          />
                                        </label>
                                      </div>
                                    )}
                                    {/* Shine overlay effect */}
                                    {completed && (
                                      <div
                                        style={{ 
                                          position: 'absolute',
                                          top: '-50%',
                                          left: '-50%',
                                          width: '200%',
                                          height: '200%',
                                          background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.3) 50%, transparent 70%)',
                                          animation: 'shine 3s infinite',
                                          zIndex: 1
                                        }}
                                      />
                                    )}
                                  </div>

                                  {/* Title with Checkmark */}
                                  <div style={{ marginBottom: '16px', textAlign: 'center' }}>
                                    <h5 
                                      style={{
                                        fontWeight: '700',
                                        fontSize: '20px',
                                        color: '#111827',
                                        margin: 0,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        lineHeight: '1.3'
                                      }}
                                    >
                                      {claim.rewardTitle}
                                      {completed && (
                                        <div
                                        style={{ 
                                            width: '24px',
                                            height: '24px',
                                            borderRadius: '50%',
                                            backgroundColor: '#22c55e',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            boxShadow: '0 2px 8px rgba(34, 197, 94, 0.4)',
                                            animation: 'pulse 2s infinite'
                                          }}
                                        >
                                          <i 
                                            className="fas fa-check"
                                            style={{ 
                                              color: 'white',
                                              fontSize: '12px',
                                              fontWeight: 'bold'
                                            }}
                                          />
                                      </div>
                                    )}
                                    </h5>
                                  </div>

                                  {/* Description */}
                                  <p 
                                    style={{
                                      fontSize: '15px',
                                      color: completed ? '#4b5563' : '#6b7280',
                                      marginBottom: '24px',
                                      textAlign: 'center',
                                      minHeight: '45px',
                                      lineHeight: '1.6',
                                      fontWeight: completed ? '500' : '400'
                                    }}
                                  >
                                    {claim.rewardDescription || claim.milestone || 'Complete this achievement'}
                                  </p>

                                  {/* Progress Bar */}
                                  <div style={{ marginTop: 'auto' }}>
                                    <div 
                                      style={{
                                        width: '100%',
                                        height: '10px',
                                        backgroundColor: completed ? '#d1fae5' : '#e5e7eb',
                                        borderRadius: '10px',
                                        overflow: 'hidden',
                                        marginBottom: '10px',
                                        boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)',
                                        position: 'relative'
                                      }}
                                    >
                                      <div
                                        style={{ 
                                          width: `${progressPercentage}%`,
                                          height: '100%',
                                          background: completed
                                            ? 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)'
                                            : 'linear-gradient(90deg, #3b82f6 0%, #2563eb 100%)',
                                          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                          borderRadius: '10px',
                                          boxShadow: completed
                                            ? '0 2px 8px rgba(34, 197, 94, 0.4)'
                                            : '0 2px 8px rgba(59, 130, 246, 0.3)',
                                          position: 'relative',
                                          overflow: 'hidden'
                                        }}
                                      >
                                        {completed && (
                                          <div
                                            style={{
                                              position: 'absolute',
                                              top: 0,
                                              left: '-100%',
                                              width: '100%',
                                              height: '100%',
                                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                                              animation: 'progressShine 2s infinite'
                                            }}
                                          />
                                        )}
                                      </div>
                                        </div>
                                    <div 
                                      style={{
                                        fontSize: '13px',
                                        color: completed ? '#059669' : '#6b7280',
                                        textAlign: 'center',
                                        fontWeight: '700',
                                        letterSpacing: '0.5px'
                                      }}
                                    >
                                      {progress.current}/{progress.total}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-5">
                        <img 
                          src="/Assets/public_assets/images/trophy.webp" 
                          alt="Trophy" 
                          style={{ 
                            width: '150px', 
                            height: '150px', 
                            opacity: 0.3,
                            marginBottom: '20px'
                          }}
                        />
                        <p style={{ color: '#6b7280', fontSize: '16px' }}>
                          No achievements yet. Keep earning rewards!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <style>
        {`
          .tab_head {
            background-color: #b8caf0;
            font-size: 17px;
            color: black;
          }
          .achievement-cards-container {
            padding: 20px 0;
          }
          .achievement-slider-wrapper {
            padding: 40px 0;
          }
          .achievement-card {
            cursor: pointer;
          }
          .achievement-card-wrapper {
            z-index: 1;
          }
          .achievement-card-wrapper:first-child {
            z-index: 2;
          }
          
          @keyframes shine {
            0% {
              transform: translateX(-100%) translateY(-100%) rotate(45deg);
            }
            100% {
              transform: translateX(100%) translateY(100%) rotate(45deg);
            }
          }
          
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.9;
            }
          }
          
          @keyframes progressShine {
            0% {
              left: -100%;
            }
            100% {
              left: 100%;
            }
          }
          
          @media (max-width: 768px) {
            .achievement-card-wrapper {
              min-width: 250px !important;
              max-width: 280px !important;
            }
          }
          @media (max-width: 576px) {
            .achievement-card-wrapper {
              min-width: 220px !important;
              max-width: 250px !important;
            }
          }
        `}
      </style>
    </>
  );
};

export default MyAchievement;
