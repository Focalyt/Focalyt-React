import React from 'react'
import { Link, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";


function MyPurchase() {



    return (
        <div className="container mt-3">
            <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12 my-auto">
                <h3 className="content-header-title float-left mb-0">My Courses</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <Link to="/candidate/dashboard">Home</Link>
                    </li>
                    <li className="breadcrumb-separator">
                      <i className="fas fa-angle-right mx-1 text-muted"></i>
                    </li>
                    <li className="breadcrumb-item active">My Courses</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

            <div className="row">
                <div className="col-md-4 mb-4">
                    <div className="card h-100 shadow-lg border-0" style={{
                        borderRadius: '16px',
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        cursor: 'pointer'
                    }}
                    >
                        {/* Card Header with Gradient */}
                        <div style={{
                            // background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                            background: '#FC2B5A',
                            backgroundSize: 'cover',
                            padding: '2rem',
                            textAlign: 'center',
                            position: 'relative',
                            overflow: 'hidden'
                        }}>
                            <div style={{
                                position: 'absolute',
                                top: '-50%',
                                right: '-50%',
                                width: '200%',
                                height: '200%',
                                background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
                                animation: 'pulse 4s ease-in-out infinite'
                            }}></div>
                            <img 
                                src="/Assets/images/logo/logo.png" 
                                className="card-img-top" 
                                alt="Course"
                                style={{
                                    height: 'auto',
                                    margin: '0 auto',
                                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))',
                                    position: 'relative',
                                    zIndex: 1
                                }}
                            />
                        </div>

                        {/* Card Body */}
                        <div className="card-body" style={{padding: '2rem'}}>
                            <h5 className="card-title mb-3" style={{
                                fontSize: '1.5rem',
                                fontWeight: '700',
                                color: '#2d3748',
                                letterSpacing: '-0.5px'
                            }}>Card title</h5>
                            <p className="card-text mb-4" style={{
                                color: '#718096',
                                lineHeight: '1.6',
                                fontSize: '0.95rem'
                            }}>
                                Some quick example text to build on the card title and make up the bulk of the card's content.
                            </p>
                            
                            <a 
                                href="/candidate/enrolled" 
                                className="btn btn-primary w-100" 
                                style={{
                                    background: '#FC2B5A',
                                    border: 'none',
                                    borderRadius: '12px',
                                    padding: '0.75rem 1.5rem',
                                    fontWeight: '600',
                                    fontSize: '1rem',
                                    letterSpacing: '0.5px',
                                    textTransform: 'uppercase',
                                    transition: 'all 0.3s ease',
                                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
                                }}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                                }}
                            >
                                View Course
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes pulse {
                    0%, 100% {
                        opacity: 0.3;
                    }
                    50% {
                        opacity: 0.6;
                    }
                }
            `}</style>
        </div>
    )
}

export default MyPurchase;
