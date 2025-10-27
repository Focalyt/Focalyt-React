import React, { useEffect , useState , Link } from 'react'
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Center() {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const token = JSON.parse(sessionStorage.getItem('token'));
    const navigate = useNavigate();
    const [centers, setCenters] = useState([]);
    
    useEffect(() => {
        fetchCenters();
    }, []);
    
    const fetchCenters = async () => {
        const response = await axios.get(`${backendUrl}/college/centers`, {
            headers: {
                'x-auth': token
            }
        });
        // console.log("centers", response.data);
        if (response.data.status) {
            // Extract unique centers from courses
            const coursesData = response.data.data;
            const uniqueCentersMap = new Map();
            
            coursesData.forEach(course => {
                // center is an array, get first element
                let centerData = null;
                
                if (Array.isArray(course.center) && course.center.length > 0) {
                    centerData = course.center[0];
                } else if (course.center && !Array.isArray(course.center)) {
                    centerData = course.center;
                } else if (Array.isArray(course.centerId) && course.centerId.length > 0) {
                    centerData = course.centerId[0];
                } else if (course.centerId && !Array.isArray(course.centerId)) {
                    centerData = course.centerId;
                }
                
                if (centerData && centerData._id) {
                    if (!uniqueCentersMap.has(centerData._id)) {
                        uniqueCentersMap.set(centerData._id, {
                            _id: centerData._id,
                            name: centerData.name,
                            address: centerData.address
                        });
                    }
                }
            });
            
            const uniqueCenters = Array.from(uniqueCentersMap.values());
            console.log("unique centers", uniqueCenters);
            setCenters(uniqueCenters);
        }
    }

    const handleCenterClick = (centerId, centerName) => {
        navigate(`/trainer/mycourses?centerId=${centerId}&centerName=${encodeURIComponent(centerName)}`);
    }

    return (
        <>
            <div className="container-fluid py-4 centers-page">
                {/* Enhanced Header with Gradient */}
                <div className="header-section mb-5">
                    <div className="content-header row">
                        <div className="content-header-left col-12">
                            <div className="d-flex justify-content-between align-items-center flex-wrap">
                                <div>
                                    <div className="breadcrumb-wrapper mb-2">
                                        <nav aria-label="breadcrumb">
                                            <ol className="breadcrumb bg-transparent p-0 m-0">
                                                <li className="breadcrumb-item">
                                                    <a href="/trainer/dashboard" className="breadcrumb-link">
                                                        <i className="feather icon-home me-1"></i>
                                                        Home
                                                    </a>
                                                </li>
                                                <li className="breadcrumb-item active">
                                                    Centers
                                                </li>
                                            </ol>
                                        </nav>
                                    </div>
                                    <h1 className="page-title mb-1">
                                        <div className="title-icon-wrapper">
                                            <i className="fas fa-building"></i>
                                        </div>
                                        Training Centers
                                    </h1>
                                    <p className="page-subtitle">
                                        Select a center to view and manage courses
                                    </p>
                                </div>
                                <div className="header-stats">
                                    <div className="stat-badge">
                                        <span className="stat-number">{centers.length}</span>
                                        <span className="stat-label">Centers</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Centers List */}
                {centers.length === 0 ? (
                    <div className="empty-state">
                        <div className="empty-state-content">
                            <div className="empty-icon-wrapper">
                                <i className="fas fa-building"></i>
                            </div>
                            <h3>No Centers Assigned</h3>
                            <p>You don't have any centers assigned to you yet. Contact your administrator for access.</p>
                        </div>
                    </div>
                ) : (
                    <div className="row g-4">
                        {centers.map((center, index) => (
                            <div key={center._id} className="col-12 col-md-6 col-xl-4">
                                <div 
                                    className="center-card" 
                                    onClick={() => handleCenterClick(center._id, center.name)}
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    <div className="center-card-inner">
                                        <div className="card-content">
                                            <div className="center-icon-wrapper">
                                                <div className="center-icon">
                                                    <i className="fas fa-building"></i>
                                                </div>
                                            </div>
                                            
                                            <div className="center-details">
                                                <h3 className="center-name">{center.name}</h3>
                                                
                                           </div>
                                        </div>
                                        
                                        <div className="card-footer-action">
                                            <span className="action-text">View Courses</span>
                                            <i className="fas fa-arrow-right action-arrow"></i>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Enhanced Custom CSS */}
            <style jsx>{`
                .centers-page {
                    background: #f8fafc;
                    min-height: 100vh;
                }

                /* Header Styles */
                .header-section {
                    background: #fff;
                    margin: -1rem -1rem 2rem -1rem;
                    padding: 2.5rem 2rem;
                    border-radius: 0 0 20px 20px;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08), 
                                0 2px 10px rgba(0, 0, 0, 0.04);
                    border-bottom: 1px solid #f1f5f9;
                }

                .breadcrumb {
                    font-size: 0.875rem;
                }

                .breadcrumb-link {
                    color: #667eea;
                    text-decoration: none;
                    transition: all 0.3s ease;
                    font-weight: 600;
                }

                .breadcrumb-link:hover {
                    color: #764ba2;
                    transform: translateX(-2px);
                }

                .breadcrumb-item.active {
                    color: #64748b;
                    font-weight: 500;
                }

                .breadcrumb-item + .breadcrumb-item::before {
                    color: #cbd5e1;
                }

                .page-title {
                    color: #1e293b;
                    font-size: 2.5rem;
                    font-weight: 800;
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                    margin-bottom: 0.5rem;
                }

                .title-icon-wrapper {
                    width: 60px;
                    height: 60px;
                    background: #fff;
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), 
                                0 2px 8px rgba(0, 0, 0, 0.06);
                    border: 2px solid #f1f5f9;
                }

                .title-icon-wrapper i {
                    font-size: 1.8rem;
                    color: #667eea;
                }

                .page-subtitle {
                    color: #64748b;
                    font-size: 1.1rem;
                    margin-bottom: 0;
                    font-weight: 500;
                }

                .header-stats {
                    display: flex;
                    gap: 1rem;
                }

                .stat-badge {
                    background: #fff;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08), 
                                0 2px 8px rgba(0, 0, 0, 0.04);
                    border: 2px solid #f1f5f9;
                    border-radius: 16px;
                    padding: 1rem 1.5rem;
                    text-align: center;
                    min-width: 100px;
                }

                .stat-number {
                    display: block;
                    color: #667eea;
                    font-size: 2rem;
                    font-weight: 700;
                    line-height: 1;
                }

                .stat-label {
                    display: block;
                    color: #64748b;
                    font-size: 0.875rem;
                    margin-top: 0.25rem;
                    font-weight: 600;
                }

                /* Center Card Styles */
                .center-card {
                    cursor: pointer;
                    animation: fadeInUp 0.6s ease-out forwards;
                    opacity: 0;
                }

                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .center-card-inner {
                    background: #fff;
                    border-radius: 20px;
                    overflow: visible;
                    height: 100%;
                    position: relative;
                    transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08), 
                                0 2px 8px rgba(0, 0, 0, 0.04);
                    border: 1px solid #f1f5f9;
                }

                .center-card:hover .center-card-inner {
                    transform: translateY(-8px);
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.12), 
                                0 6px 20px rgba(0, 0, 0, 0.08);
                    border-color: #e2e8f0;
                }

                .card-content {
                    position: relative;
                    padding: 2rem;
                    padding-bottom: 1.5rem;
                }

                .center-icon-wrapper {
                    position: relative;
                    width: 100px;
                    height: 100px;
                    margin: 2rem auto 1.5rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .center-icon {
                    width: 100px;
                    height: 100px;
                    background: #fff;
                    border-radius: 20px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1), 
                                0 4px 15px rgba(0, 0, 0, 0.06);
                    position: relative;
                    z-index: 2;
                    transition: all 0.4s ease;
                    border: 2px solid #f8fafc;
                }

                .center-card:hover .center-icon {
                    transform: translateY(-5px) scale(1.05);
                    box-shadow: 0 15px 50px rgba(0, 0, 0, 0.15), 
                                0 8px 25px rgba(0, 0, 0, 0.1);
                    border-color: #e2e8f0;
                }

                .center-icon i {
                    font-size: 3rem;
                    color: #667eea;
                    transition: all 0.3s ease;
                }

                .center-card:hover .center-icon i {
                    color: #764ba2;
                    transform: scale(1.1);
                }

                .center-details {
                    text-align: center;
                }

                .center-name {
                    color: #1e293b;
                    font-size: 1.6rem;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                    line-height: 1.3;
                    min-height: 3rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    text-align: center;
                    padding: 0 1rem;
                }

                .center-info {
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    margin-top: 1.5rem;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    color: #475569;
                    font-size: 1rem;
                    padding: 1rem 1.25rem;
                    background: #fff;
                    border-radius: 12px;
                    transition: all 0.3s ease;
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06), 
                                0 1px 4px rgba(0, 0, 0, 0.04);
                    border: 1px solid #f1f5f9;
                    font-weight: 500;
                }

                .center-card:hover .info-item {
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1), 
                                0 2px 8px rgba(0, 0, 0, 0.06);
                    transform: translateY(-2px);
                    border-color: #e2e8f0;
                }

                .info-item i {
                    color: #667eea;
                    font-size: 1.2rem;
                    transition: all 0.3s ease;
                }

                .center-card:hover .info-item i {
                    color: #764ba2;
                    transform: scale(1.1);
                }

                .card-footer-action {
                    padding: 1.5rem 2rem;
                    background: #fff;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    border-top: 1px solid #f1f5f9;
                    transition: all 0.3s ease;
                    box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.03);
                }

                .center-card:hover .card-footer-action {
                    box-shadow: 0 -4px 20px rgba(0, 0, 0, 0.08);
                    border-top-color: #e2e8f0;
                }

                .action-text {
                    color: #667eea;
                    font-weight: 700;
                    font-size: 1.05rem;
                    transition: all 0.3s ease;
                    letter-spacing: 0.3px;
                }

                .center-card:hover .action-text {
                    color: #764ba2;
                }

                .action-arrow {
                    color: #667eea;
                    transition: all 0.3s ease;
                    font-size: 1.1rem;
                }

                .center-card:hover .action-arrow {
                    color: #764ba2;
                    transform: translateX(5px);
                }

                /* Empty State */
                .empty-state {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 400px;
                    background: #fff;
                    border-radius: 20px;
                    box-shadow: 0 4px 15px rgba(0, 0, 0, 0.08), 
                                0 2px 8px rgba(0, 0, 0, 0.04);
                    border: 1px solid #f1f5f9;
                }

                .empty-state-content {
                    text-align: center;
                    padding: 3rem;
                    max-width: 400px;
                }

                .empty-icon-wrapper {
                    width: 120px;
                    height: 120px;
                    background: #fff;
                    border-radius: 50%;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0 auto 2rem;
                    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1), 
                                0 5px 20px rgba(0, 0, 0, 0.06);
                    border: 3px solid #f1f5f9;
                }

                .empty-icon-wrapper i {
                    font-size: 3.5rem;
                    color: #667eea;
                }

                .empty-state-content h3 {
                    color: #1e293b;
                    font-size: 1.75rem;
                    font-weight: 700;
                    margin-bottom: 1rem;
                }

                .empty-state-content p {
                    color: #64748b;
                    font-size: 1.1rem;
                    line-height: 1.6;
                }

                /* Responsive */
                @media (max-width: 768px) {
                    .page-title {
                        font-size: 1.75rem;
                    }

                    .title-icon-wrapper {
                        width: 50px;
                        height: 50px;
                    }

                    .title-icon-wrapper i {
                        font-size: 1.4rem;
                    }

                    .header-stats {
                        width: 100%;
                        margin-top: 1rem;
                    }

                    .stat-badge {
                        flex: 1;
                    }
                }
            `}</style>
        </>
    )
}

export default Center;