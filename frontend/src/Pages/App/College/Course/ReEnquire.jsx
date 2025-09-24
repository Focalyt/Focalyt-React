import React, { useState, useEffect, useRef } from 'react';
import DatePicker from 'react-date-picker';

import 'react-date-picker/dist/DatePicker.css';
import 'react-calendar/dist/Calendar.css';
import moment from 'moment';
import axios from 'axios'


const ReEnquire = () => {
    const [loading, setLoading] = useState(false);

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;


    const [reEnquireData, setReEnquireData] = useState([]);

  
    useEffect(()=>{
        fetchReEnquireData()
        
    },[]) 
    

    const fetchReEnquireData = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${backendUrl}/college/candidate/reEnquireData`, {
                headers: { 'x-auth': token }
            });
            console.log('response' , response.data.data)
            setReEnquireData(response.data.data)
        }catch(err){
            console.error('Error fetching ReEnquire data:', err);
             // Show user-friendly error message
            if (err.response?.data?.msg) {
                console.error('Server error:', err.response.data.msg);
            }
        } finally {
            setLoading(false);
        }
    }


    return (
        <div className='content-body'>

            <div className="container-fluid">
                <div className="row align-items-center">
                    <div className="col-md-6 d-md-block d-sm-none">
                        <div className="d-flex align-items-center">
                            <h4 className="fw-bold text-dark mb-0 me-3">Re-Enquire</h4>
                            <nav aria-label="breadcrumb">
                                <ol className="breadcrumb mb-0 small">
                                    <li className="breadcrumb-item">
                                        <a href="/institute/dashboard" className="text-decoration-none">Home</a>
                                    </li>
                                    <li className="breadcrumb-item active">Re-Enquire</li>
                                </ol>
                            </nav>
                        </div>
                    </div>

                    <div className="col-md-6">
                        <div className="d-flex justify-content-end align-items-center gap-2">
                            <div className="input-group" style={{ maxWidth: '300px' }}>

                                <input
                                    type="text"
                                    name="name"
                                    className="form-control border-start-0 m-0"
                                    placeholder="Quick search..."
                                //   value={filterData.name}

                                />
                                <button
                                    //   onClick={() => fetchProfileData()}
                                    className={`btn btn-outline-primary`}
                                    style={{ whiteSpace: 'nowrap' }}
                                >
                                    <i className={`fas fa-search me-1`}></i>
                                    Search

                                </button>
                            </div>


                            {/* <button
                        onClick={() => setIsFilterCollapsed(!isFilterCollapsed)}
                        className={`btn ${!isFilterCollapsed ? 'btn-primary' : 'btn-outline-primary'}`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        <i className={`fas fa-filter me-1 ${!isFilterCollapsed ? 'fa-spin' : ''}`}></i>
                        Filters
                        {Object.values(filterData).filter(val => val && val !== 'true').length > 0 && (
                          <span className="bg-light text-dark ms-1">
                            {Object.values(filterData).filter(val => val && val !== 'true').length}
                          </span>
                        )}
                      </button> */}


                        </div>
                    </div>



                </div>
            </div>

          
            <div className="container-fluid mt-4">
                <div className="row">
                    <div className="col-12">
                        <div className="card">
                            <div className="card-header">
                                <h5 className="card-title mb-0">Re-Enquire Records</h5>
                            </div>
                            <div className="card-body p-0">
                                <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                                    <table className="table table-hover mb-0">
                                        <thead className="table-light" style={{ 
                                            position: 'sticky', 
                                            top: 0, 
                                            zIndex: 9,
                                            backgroundColor: '#f8f9fa'
                                        }}>
                                            <tr>
                                                <th className="border-0 py-3 px-3" style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-semibold text-dark">Name</span>
                                                    </div>
                                                </th>
                                                <th className="border-0 py-3 px-3" style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-semibold text-dark">Course</span>
                                                    </div>
                                                </th>
                                                <th className="border-0 py-3 px-3" style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-semibold text-dark">Mobile No</span>
                                                    </div>
                                                </th>
                                                <th className="border-0 py-3 px-3" style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-semibold text-dark">Counselor Name</span>
                                                    </div>
                                                </th>
                                                <th className="border-0 py-3 px-3" style={{ 
                                                    backgroundColor: '#f8f9fa',
                                                    position: 'sticky',
                                                    top: 0,
                                                    zIndex: 10,
                                                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                }}>
                                                    <div className="d-flex align-items-center">
                                                        <span className="fw-semibold text-dark">Re-Enquire Date</span>
                                                    </div>
                                                </th>
                                               
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <div className="d-flex justify-content-center align-items-center">
                                                            <div className="spinner-border text-primary me-2" role="status">
                                                                <span className="visually-hidden">Loading...</span>
                                                            </div>
                                                            <span>Loading...</span>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : reEnquireData.length === 0 ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center py-4">
                                                        <div className="text-muted">
                                                            <i className="fas fa-inbox fa-2x mb-2"></i>
                                                            <p className="mb-0">No re-enquire records found</p>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ) : (
                                                reEnquireData.map((item, index) => (
                                                    <tr key={item.id} className="border-bottom">
                                                        <td className="py-3 px-3">
                                                            <div className="d-flex align-items-center">
                                                               
                                                                <div>
                                                                    <h6 className="mb-0 fw-semibold text-dark">{item.name}</h6>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <span className="badge bg-light text-dark border">
                                                                {item.course}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-phone text-muted me-2"></i>
                                                                <span className="text-dark">{item.mobile}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-user-tie text-muted me-2"></i>
                                                                <span className="text-dark">{item.counselorName}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-3">
                                                            <div className="d-flex align-items-center">
                                                                <i className="fas fa-calendar text-muted me-2"></i>
                                                                <span className="text-dark">
                                                                    {moment(item.reEnquireDate).format('DD MMM YYYY')}
                                                                </span>
                                                            </div>
                                                        </td>
                                                      
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </div>
    );
};

export default ReEnquire;

