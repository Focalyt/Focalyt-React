import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

function JobOffer() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const [userData, setUserData] = useState(JSON.parse(sessionStorage.getItem("user") || "{}"));
    const token = userData.token;
    
    const [jobOffers, setJobOffers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState(null);
    const [showJobDetails, setShowJobDetails] = useState(false);
    const [useDummyData, setUseDummyData] = useState(false);

    const dummyJobOffers = [
        {
            _id: '1',
            title: 'Software Developer',
            companyName: 'Tech Solutions Pvt Ltd',
            displayCompanyName: 'Tech Solutions',
            _qualification: { name: 'B.Tech Computer Science' },
            _industry: { name: 'Information Technology' },
            state: { name: 'Delhi' },
            city: { name: 'New Delhi' },
            noOfPosition: 5,
            validity: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
            jobDescription: 'We are looking for a skilled Software Developer to join our dynamic team. The ideal candidate should have strong programming skills and experience in web development.',
            requirement: '• B.Tech in Computer Science or related field\n• 2+ years of experience in web development\n• Knowledge of React, Node.js, and MongoDB\n• Strong problem-solving skills\n• Good communication skills',
            status: 'active',
            createdAt: new Date()
        },
        {
            _id: '2',
            title: 'Data Analyst',
            companyName: 'Analytics Pro',
            displayCompanyName: 'Analytics Pro',
            _qualification: { name: 'B.Tech / MCA' },
            _industry: { name: 'Data Analytics' },
            state: { name: 'Maharashtra' },
            city: { name: 'Mumbai' },
            noOfPosition: 3,
            validity: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000),
            jobDescription: 'Join our data analytics team and help transform raw data into actionable insights. Work with cutting-edge tools and technologies.',
            requirement: '• B.Tech/MCA in relevant field\n• Experience with Python, SQL, and data visualization tools\n• Strong analytical thinking\n• Attention to detail',
            status: 'active',
            createdAt: new Date()
        },
        {
            _id: '3',
            title: 'Frontend Developer',
            companyName: 'Digital Innovations',
            displayCompanyName: 'Digital Innovations',
            _qualification: { name: 'B.Tech / BCA' },
            _industry: { name: 'Web Development' },
            state: { name: 'Karnataka' },
            city: { name: 'Bangalore' },
            noOfPosition: 4,
            validity: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
            jobDescription: 'We need a creative Frontend Developer to build beautiful and responsive user interfaces. Work on exciting projects with modern frameworks.',
            requirement: '• B.Tech/BCA in Computer Science\n• Proficiency in HTML, CSS, JavaScript\n• Experience with React or Vue.js\n• Understanding of UI/UX principles',
            status: 'active',
            createdAt: new Date()
        },
        {
            _id: '4',
            title: 'Backend Developer',
            companyName: 'Cloud Services Inc',
            displayCompanyName: 'Cloud Services',
            _qualification: { name: 'B.Tech Computer Science' },
            _industry: { name: 'Cloud Computing' },
            state: { name: 'Telangana' },
            city: { name: 'Hyderabad' },
            noOfPosition: 6,
            validity: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), 
            jobDescription: 'Looking for an experienced Backend Developer to design and implement scalable server-side applications. Work with microservices architecture.',
            requirement: '• B.Tech in Computer Science\n• Strong knowledge of Node.js, Express, or similar\n• Experience with databases (MongoDB, PostgreSQL)\n• Understanding of RESTful APIs\n• Knowledge of cloud platforms (AWS, Azure)',
            status: 'active',
            createdAt: new Date()
        },
        {
            _id: '5',
            title: 'Full Stack Developer',
            companyName: 'Startup Hub',
            displayCompanyName: 'Startup Hub',
            _qualification: { name: 'B.Tech / M.Tech' },
            _industry: { name: 'Software Development' },
            state: { name: 'Gujarat' },
            city: { name: 'Ahmedabad' },
            noOfPosition: 2,
            validity: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000), 
            jobDescription: 'Join our fast-growing startup as a Full Stack Developer. Work on end-to-end features and make a real impact on our product.',
            requirement: '• B.Tech/M.Tech in Computer Science\n• Full stack development experience\n• Knowledge of React, Node.js, and databases\n• Ability to work in a fast-paced environment\n• Strong problem-solving skills',
            status: 'active',
            createdAt: new Date()
        }
    ];

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const useDummy = urlParams.get('dummy') === 'true';
        setUseDummyData(useDummy);
        
        if (useDummy) {
            setTimeout(() => {
                setJobOffers(dummyJobOffers);
                setLoading(false);
            }, 1000);
        } else {
            fetchJobOffers();
        }
    }, []);

    const fetchJobOffers = async () => {
        try {
            setLoading(true);
            
            if (!token) {
                console.warn('No token found');
                setJobOffers([]);
                setLoading(false);
                return;
            }

            const response = await axios.get(`${backendUrl}/candidate/job-offers`, {
                headers: { 'x-auth': token }
            });

            if (response.data && response.data.success) {
                const jobs = response.data.data || [];
                console.log('Fetched job offers:', jobs.length);
                // If no jobs found, show dummy data for preview
                if (jobs.length === 0) {
                    console.log('No jobs found, showing dummy data for preview');
                    setJobOffers(dummyJobOffers);
                    setUseDummyData(true);
                } else {
                    setJobOffers(jobs);
                    setUseDummyData(false);
                }
            } else {
                console.warn('No job offers found or API returned error, showing dummy data');
                setJobOffers(dummyJobOffers);
                setUseDummyData(true);
            }
        } catch (error) {
            console.error('Error fetching job offers:', error);
            if (error.response) {
                console.error('Response error:', error.response.data);
            }
            // Show dummy data on error for preview
            console.log('Showing dummy data due to error');
            setJobOffers(dummyJobOffers);
            setUseDummyData(true);
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetails = (job) => {
        setSelectedJob(job);
        setShowJobDetails(true);
    };

    const handleCloseDetails = () => {
        setShowJobDetails(false);
        setSelectedJob(null);
    };

    const formatDate = (date) => {
        if (!date) return 'N/A';
        return moment(date).format('DD MMM YYYY');
    };

    return (
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#f8f9fa',
            padding: '20px'
        }}>
            <div style={{
                maxWidth: '1200px',
                margin: '0 auto'
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    padding: '24px',
                    marginBottom: '24px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '16px'
                    }}>
                        <div>
                            <h2 style={{
                                margin: 0,
                                fontSize: '28px',
                                fontWeight: '700',
                                color: '#212529',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px'
                            }}>
                                <i className="fas fa-briefcase" style={{ color: '#007bff' }}></i>
                                Job Offers
                            </h2>
                            <p style={{
                                margin: '8px 0 0 0',
                                color: '#6c757d',
                                fontSize: '14px'
                            }}>
                                Explore job opportunities offered by your college
                            </p>
                            {useDummyData && (
                                <div style={{
                                    marginTop: '12px',
                                    padding: '8px 12px',
                                    backgroundColor: '#fff3cd',
                                    border: '1px solid #ffc107',
                                    borderRadius: '6px',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '8px'
                                }}>
                                    <i className="fas fa-info-circle" style={{ color: '#856404' }}></i>
                                    <span style={{ color: '#856404', fontSize: '12px', fontWeight: '600' }}>
                                        Showing Sample Data for Preview
                                    </span>
                                </div>
                            )}
                        </div>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '8px 16px',
                                backgroundColor: '#e7f3ff',
                                borderRadius: '8px',
                                border: '1px solid #b3d9ff'
                            }}>
                                <i className="fas fa-info-circle" style={{ color: '#007bff' }}></i>
                                <span style={{ color: '#007bff', fontWeight: '600', fontSize: '14px' }}>
                                    {jobOffers.length} {jobOffers.length === 1 ? 'Offer' : 'Offers'} Available
                                </span>
                            </div>
                            {jobOffers.length === 0 && !loading && (
                                <button
                                    onClick={() => {
                                        setJobOffers(dummyJobOffers);
                                        setUseDummyData(true);
                                    }}
                                    style={{
                                        padding: '8px 16px',
                                        backgroundColor: '#28a745',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '14px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#218838';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#28a745';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                >
                                    <i className="fas fa-eye"></i>
                                    View Sample Jobs
                                </button>
                            )}
                        </div>
                    </div>
                </div>

                {/* Loading State */}
                {loading ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
                            <span className="visually-hidden">Loading...</span>
                        </div>
                        <p style={{ marginTop: '20px', color: '#6c757d', fontSize: '16px' }}>
                            Loading job offers...
                        </p>
                    </div>
                ) : jobOffers.length === 0 ? (
                    /* Empty State */
                    <div style={{
                        textAlign: 'center',
                        padding: '60px 20px',
                        backgroundColor: '#ffffff',
                        borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                    }}>
                        <i className="fas fa-briefcase" style={{
                            fontSize: '64px',
                            color: '#dee2e6',
                            marginBottom: '20px'
                        }}></i>
                        <h3 style={{
                            color: '#495057',
                            marginBottom: '12px',
                            fontSize: '24px',
                            fontWeight: '600'
                        }}>
                            No Job Offers Available
                        </h3>
                        <p style={{
                            color: '#6c757d',
                            fontSize: '16px',
                            marginBottom: '24px'
                        }}>
                            There are no job offers available at the moment. Please check back later.
                        </p>
                        <button
                            onClick={() => {
                                setJobOffers(dummyJobOffers);
                                setUseDummyData(true);
                            }}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#007bff',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '15px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '8px',
                                transition: 'all 0.3s ease'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#0056b3';
                                e.currentTarget.style.transform = 'translateY(-2px)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = '#007bff';
                                e.currentTarget.style.transform = 'translateY(0)';
                            }}
                        >
                            <i className="fas fa-eye"></i>
                            View Sample Jobs (Preview)
                        </button>
                    </div>
                ) : (
                    /* Job Offers Grid */
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
                        gap: '24px'
                    }}>
                        {jobOffers.map((job, index) => (
                            <div
                                key={job._id || index}
                                style={{
                                    backgroundColor: '#ffffff',
                                    borderRadius: '12px',
                                    padding: '24px',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    transition: 'all 0.3s ease',
                                    cursor: 'pointer',
                                    border: '1px solid #e9ecef',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                                onClick={() => handleViewDetails(job)}
                            >
                                {/* Status Badge */}
                                <div style={{
                                    position: 'absolute',
                                    top: '16px',
                                    right: '16px',
                                    padding: '4px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: '600',
                                    textTransform: 'uppercase',
                                    backgroundColor: job.status === 'active' ? '#d4edda' : '#fff3cd',
                                    color: job.status === 'active' ? '#155724' : '#856404',
                                    border: `1px solid ${job.status === 'active' ? '#c3e6cb' : '#ffeaa7'}`
                                }}>
                                    {job.status || 'Active'}
                                </div>

                                {/* Company Info */}
                                <div style={{ marginBottom: '20px' }}>
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '12px',
                                        marginBottom: '12px'
                                    }}>
                                        <div style={{
                                            width: '56px',
                                            height: '56px',
                                            borderRadius: '12px',
                                            backgroundColor: '#007bff',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: '#ffffff',
                                            fontSize: '24px',
                                            fontWeight: '700',
                                            flexShrink: 0
                                        }}>
                                            {(job.displayCompanyName || job.companyName || 'C')[0].toUpperCase()}
                                        </div>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <h3 style={{
                                                margin: 0,
                                                fontSize: '18px',
                                                fontWeight: '700',
                                                color: '#212529',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {job.displayCompanyName || job.companyName || 'Company Name'}
                                            </h3>
                                            <p style={{
                                                margin: '4px 0 0 0',
                                                fontSize: '14px',
                                                color: '#6c757d',
                                                whiteSpace: 'nowrap',
                                                overflow: 'hidden',
                                                textOverflow: 'ellipsis'
                                            }}>
                                                {job.title || 'Job Title'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Details */}
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '12px',
                                    marginBottom: '20px'
                                }}>
                                    {job._qualification && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#495057'
                                        }}>
                                            <i className="fas fa-graduation-cap" style={{ color: '#007bff', width: '16px' }}></i>
                                            <span>{job._qualification.name || 'N/A'}</span>
                                        </div>
                                    )}
                                    
                                    {job._industry && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#495057'
                                        }}>
                                            <i className="fas fa-industry" style={{ color: '#28a745', width: '16px' }}></i>
                                            <span>{job._industry.name || 'N/A'}</span>
                                        </div>
                                    )}

                                    {(job.city || job.state) && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#495057'
                                        }}>
                                            <i className="fas fa-map-marker-alt" style={{ color: '#dc3545', width: '16px' }}></i>
                                            <span>
                                                {[job.city?.name, job.state?.name].filter(Boolean).join(', ') || 'Location N/A'}
                                            </span>
                                        </div>
                                    )}

                                    {job.noOfPosition && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#495057'
                                        }}>
                                            <i className="fas fa-users" style={{ color: '#ffc107', width: '16px' }}></i>
                                            <span>{job.noOfPosition} Position{job.noOfPosition > 1 ? 's' : ''} Available</span>
                                        </div>
                                    )}

                                    {job.validity && (
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '14px',
                                            color: '#495057'
                                        }}>
                                            <i className="fas fa-calendar-alt" style={{ color: '#6f42c1', width: '16px' }}></i>
                                            <span>Valid until: {formatDate(job.validity)}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Job Description Preview */}
                                {job.jobDescription && (
                                    <div style={{
                                        marginBottom: '20px',
                                        padding: '12px',
                                        backgroundColor: '#f8f9fa',
                                        borderRadius: '8px',
                                        maxHeight: '80px',
                                        overflow: 'hidden'
                                    }}>
                                        <p style={{
                                            margin: 0,
                                            fontSize: '13px',
                                            color: '#6c757d',
                                            lineHeight: '1.5',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden'
                                        }}>
                                            {job.jobDescription}
                                        </p>
                                    </div>
                                )}

                                {/* Action Button */}
                                <button
                                    style={{
                                        width: '100%',
                                        padding: '12px 24px',
                                        backgroundColor: '#007bff',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '8px'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#0056b3';
                                        e.currentTarget.style.transform = 'translateY(-2px)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#007bff';
                                        e.currentTarget.style.transform = 'translateY(0)';
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewDetails(job);
                                    }}
                                >
                                    <i className="fas fa-eye"></i>
                                    View Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Job Details Modal */}
                {showJobDetails && selectedJob && (
                    <div
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            backgroundColor: 'rgba(0,0,0,0.5)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            zIndex: 1050,
                            padding: '20px'
                        }}
                        onClick={handleCloseDetails}
                    >
                        <div
                            style={{
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                                maxWidth: '800px',
                                width: '100%',
                                maxHeight: '90vh',
                                overflow: 'auto',
                                boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                                position: 'relative'
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Modal Header */}
                            <div style={{
                                padding: '24px',
                                borderBottom: '1px solid #e9ecef',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                position: 'sticky',
                                top: 0,
                                backgroundColor: '#ffffff',
                                zIndex: 10,
                                borderRadius: '12px 12px 0 0'
                            }}>
                                <div>
                                    <h3 style={{
                                        margin: 0,
                                        fontSize: '24px',
                                        fontWeight: '700',
                                        color: '#212529'
                                    }}>
                                        {selectedJob.title || 'Job Details'}
                                    </h3>
                                    <p style={{
                                        margin: '8px 0 0 0',
                                        fontSize: '16px',
                                        color: '#6c757d'
                                    }}>
                                        {selectedJob.displayCompanyName || selectedJob.companyName || 'Company Name'}
                                    </p>
                                </div>
                                <button
                                    onClick={handleCloseDetails}
                                    style={{
                                        width: '40px',
                                        height: '40px',
                                        borderRadius: '50%',
                                        border: 'none',
                                        backgroundColor: '#f8f9fa',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        fontSize: '20px',
                                        color: '#6c757d',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#e9ecef';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#f8f9fa';
                                    }}
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            </div>

                            {/* Modal Body */}
                            <div style={{ padding: '24px' }}>
                                {/* Job Information Grid */}
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                                    gap: '16px',
                                    marginBottom: '24px'
                                }}>
                                    {selectedJob._qualification && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d',
                                                marginBottom: '4px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                Qualification
                                            </div>
                                            <div style={{
                                                fontSize: '16px',
                                                color: '#212529',
                                                fontWeight: '600'
                                            }}>
                                                {selectedJob._qualification.name || 'N/A'}
                                            </div>
                                        </div>
                                    )}

                                    {selectedJob._industry && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d',
                                                marginBottom: '4px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                Industry
                                            </div>
                                            <div style={{
                                                fontSize: '16px',
                                                color: '#212529',
                                                fontWeight: '600'
                                            }}>
                                                {selectedJob._industry.name || 'N/A'}
                                            </div>
                                        </div>
                                    )}

                                    {(selectedJob.city || selectedJob.state) && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d',
                                                marginBottom: '4px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                Location
                                            </div>
                                            <div style={{
                                                fontSize: '16px',
                                                color: '#212529',
                                                fontWeight: '600'
                                            }}>
                                                {[selectedJob.city?.name, selectedJob.state?.name].filter(Boolean).join(', ') || 'N/A'}
                                            </div>
                                        </div>
                                    )}

                                    {selectedJob.noOfPosition && (
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px'
                                        }}>
                                            <div style={{
                                                fontSize: '12px',
                                                color: '#6c757d',
                                                marginBottom: '4px',
                                                fontWeight: '600',
                                                textTransform: 'uppercase'
                                            }}>
                                                Positions
                                            </div>
                                            <div style={{
                                                fontSize: '16px',
                                                color: '#212529',
                                                fontWeight: '600'
                                            }}>
                                                {selectedJob.noOfPosition}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Job Description */}
                                {selectedJob.jobDescription && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#212529',
                                            marginBottom: '12px'
                                        }}>
                                            Job Description
                                        </h4>
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            lineHeight: '1.6',
                                            color: '#495057',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedJob.jobDescription}
                                        </div>
                                    </div>
                                )}

                                {/* Requirements */}
                                {selectedJob.requirement && (
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{
                                            fontSize: '18px',
                                            fontWeight: '600',
                                            color: '#212529',
                                            marginBottom: '12px'
                                        }}>
                                            Requirements
                                        </h4>
                                        <div style={{
                                            padding: '16px',
                                            backgroundColor: '#f8f9fa',
                                            borderRadius: '8px',
                                            lineHeight: '1.6',
                                            color: '#495057',
                                            whiteSpace: 'pre-wrap'
                                        }}>
                                            {selectedJob.requirement}
                                        </div>
                                    </div>
                                )}

                                {/* Validity */}
                                {selectedJob.validity && (
                                    <div style={{
                                        padding: '16px',
                                        backgroundColor: '#fff3cd',
                                        borderRadius: '8px',
                                        border: '1px solid #ffeaa7',
                                        marginBottom: '24px'
                                    }}>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            color: '#856404'
                                        }}>
                                            <i className="fas fa-calendar-alt"></i>
                                            <span style={{ fontWeight: '600' }}>
                                                Valid until: {formatDate(selectedJob.validity)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Footer */}
                            <div style={{
                                padding: '20px 24px',
                                borderTop: '1px solid #e9ecef',
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '12px',
                                position: 'sticky',
                                bottom: 0,
                                backgroundColor: '#ffffff',
                                borderRadius: '0 0 12px 12px'
                            }}>
                                <button
                                    onClick={handleCloseDetails}
                                    style={{
                                        padding: '10px 24px',
                                        backgroundColor: '#6c757d',
                                        color: '#ffffff',
                                        border: 'none',
                                        borderRadius: '8px',
                                        fontSize: '15px',
                                        fontWeight: '600',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s ease'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.backgroundColor = '#5a6268';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.backgroundColor = '#6c757d';
                                    }}
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default JobOffer;
