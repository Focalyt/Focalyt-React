import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const UploadCandidates = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [imports, setImports] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Uploaded candidates state
  const [uploadedCandidates, setUploadedCandidates] = useState([]);
  const [candidatesPage, setCandidatesPage] = useState(1);
  const [candidatesTotalPages, setCandidatesTotalPages] = useState(1);
  const [candidatesLoading, setCandidatesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('imports');

  useEffect(() => {
    if (activeTab === 'imports') {
      fetchImports();
    } else {
      fetchUploadedCandidates();
    }
  }, [currentPage, candidatesPage, activeTab]);

  const fetchImports = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/imports?page=${currentPage}`, {
        headers: { 'x-auth': token }
      });
      setImports(response.data.imports || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching imports:', error);
    }
  };

  const fetchUploadedCandidates = async () => {
    try {
      setCandidatesLoading(true);
      console.log('Fetching uploaded candidates, page:', candidatesPage);
      const response = await axios.get(`${backendUrl}/college/uploaded-candidates?page=${candidatesPage}&limit=50`, {
        headers: { 'x-auth': token }
      });
      
      console.log('Uploaded candidates response:', response.data);
      
      if (response.data && response.data.status) {
        const candidates = response.data.candidates || [];
        console.log('Setting candidates:', candidates.length, 'candidates');
        setUploadedCandidates(candidates);
        setCandidatesTotalPages(response.data.totalPages || 1);
      } else {
        console.error('Invalid response format:', response.data);
        setUploadedCandidates([]);
      }
    } catch (error) {
      console.error('Error fetching uploaded candidates:', error);
      console.error('Error response:', error.response?.data);
      setMessage(error.response?.data?.message || 'Error fetching uploaded candidates');
      setUploadedCandidates([]);
    } finally {
      setCandidatesLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage(''); // Clear previous messages
    const formData = new FormData();
    formData.append('filename', file);

    try {
      const response = await axios.post(`${backendUrl}/college/uploadfiles`, formData, {
        headers: { 
          'x-auth': token,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Clear file input
      const fileInput = document.getElementById('myFile');
      if (fileInput) {
        fileInput.value = '';
      }
      setFile(null);
      
      // Show success message with details
      if (response.data.status) {
        const successMsg = response.data.message || 'File uploaded successfully!';
        const errorCount = response.data.errorCount || 0;
        const successCount = response.data.successCount || 0;
        
        if (errorCount > 0) {
          setMessage(`${successMsg} - ${successCount} records inserted, ${errorCount} error(s) occurred`);
        } else {
          setMessage(`${successMsg} - ${successCount} records inserted successfully`);
        }
        
        // Clear success message after 5 seconds
        setTimeout(() => {
          setMessage('');
        }, 5000);
      } else {
        setMessage(response.data.message || 'File uploaded with some errors');
      }
      
      fetchImports();
      // Also refresh candidates if on that tab
      if (activeTab === 'candidates') {
        fetchUploadedCandidates();
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      // Show actual error message from backend
      const errorMessage = error.response?.data?.message || error.message || 'Error uploading file. Please try again.';
      setMessage(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/single`, {
        responseType: 'blob',
        headers: { 'x-auth': token }
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'sample.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading sample:', error);
    }
  };

  const renderCandidatesPagination = () => {
    if (candidatesTotalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = candidatesTotalPages > 4 ? 4 : candidatesTotalPages;

    if (candidatesTotalPages > 4 && candidatesPage >= 2) {
      start = candidatesPage - 1;
      end = candidatesPage + 1;
      if (end > candidatesTotalPages) end = candidatesTotalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === candidatesPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCandidatesPage(i)}>{i}</button>
        </li>
      );
    }

    if (end < candidatesTotalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setCandidatesPage(candidatesTotalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    let start = 1;
    let end = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      start = currentPage - 1;
      end = currentPage + 1;
      if (end > totalPages) end = totalPages;
    }

    if (start > 1) {
      pages.push(
        <li key="first" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(1)}>First</button>
        </li>
      );
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? 'active' : ''}`}>
          <button className="page-link" onClick={() => setCurrentPage(i)}>{i}</button>
        </li>
      );
    }

    if (end < totalPages) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(end + 1)}>...</button>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <button className="page-link" onClick={() => setCurrentPage(totalPages)}>Last</button>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end mb-0 mt-3">
        {pages}
      </ul>
    );
  };

  return (
    <>

        <div className="content-header row">
          <div className="col-12 mb-2">
            <div className="row breadcrumbs-top justify-content-between align-items-center flex-wrap" style={{ flexWrap: 'nowrap' }}>
              <div className="col-12 col-sm-auto text-center text-sm-left">
                <h4 className="content-header-title mb-0 mx-3 text-upload">Upload Candidates</h4>
              </div>
              <div className="col-12 col-sm-auto text-center">
                <button onClick={downloadSample} className="btn btn-success lovepreet">Download Sample</button>
              </div>
            </div>
          </div>
        </div>

        {loading && <div id="preloader">Loading...</div>}
        
        <div className="content-body">
          {message && (
            <div className={`alert ${message.includes('successfully') || message.includes('inserted') ? 'alert-success' : 'alert-danger'}`} role="alert">
              {message}
            </div>
          )}
          
          <section>
            <div className="container">
              <div className="row">
                <div className="custom-bulk-align card mb-0">
                  <div className="content-header row d-xl-block d-lg-block d-md-block d-sm-block d-block">
                    <div className="col-12 rounded equal-height-2 coloumn-2">
                      <div className="content-header-left col-md-12 col-12">
                        <div className="row breadcrumbs-top p-1">
                          <div className="col-12">
                            <form onSubmit={handleSubmit} id="candidateUpload" encType="multipart/form-data">
                              <input 
                                style={{ display: 'block' }} 
                                type="file" 
                                id="myFile" 
                                name="filename"
                                onChange={handleFileChange}
                              />
                              <div className="custom-bulkupload-btn-block" style={{ display: 'block' }}>
                                <button 
                                  type="submit" 
                                  className="btn btn-success my-1 mt-2"
                                  id="submitBtn"
                                  disabled={loading}
                                >
                                  Submit
                                </button>
                              </div>
                            </form>
                          </div>
                          
                          {/* Tabs */}
                          <div className="col-12 mb-3">
                            <ul className="nav nav-tabs" role="tablist">
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'imports' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('imports')}
                                  type="button"
                                >
                                  Import History
                                </button>
                              </li>
                              <li className="nav-item">
                                <button
                                  className={`nav-link ${activeTab === 'candidates' ? 'active' : ''}`}
                                  onClick={() => setActiveTab('candidates')}
                                  type="button"
                                >
                                  Uploaded Candidates
                                </button>
                              </li>
                            </ul>
                          </div>
                          
                          {/* Tab Content */}
                          <div className="col-12">
                            {activeTab === 'imports' ? (
                              <div className="card-content">
                                <div className="table-responsive">
                                  {imports && imports.length > 0 ? (
                                    <table className="table table-hover-animation mb-0">
                                      <thead>
                                        <tr>
                                          <th>FILE NAME</th>
                                          <th>MESSAGE</th>
                                          <th>STATUS</th>
                                          <th>RECORDS INSERTED</th>
                                          <th>UPLOAD DATE</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {imports.map((item, index) => (
                                          <tr key={item._id}>
                                            <td className="text-capitalize">{item.name}</td>
                                            <td>
                                              <div style={{ maxHeight: '200px', overflow: 'auto' }}>
                                                <div dangerouslySetInnerHTML={{ __html: item.message }}></div>
                                              </div>
                                            </td>
                                            <td>{item.status}</td>
                                            <td>{item.record}</td>
                                            <td>{moment(item.createdAt).format('Do MMMM, YYYY HH:mm')}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  ) : (
                                    <p className="text-center mt-3">No import history found</p>
                                  )}
                                </div>
                                {renderPagination()}
                              </div>
                            ) : (
                              <div className="card-content">
                                {candidatesLoading ? (
                                  <div className="text-center mt-3">
                                    <div className="spinner-border" role="status">
                                      <span className="sr-only">Loading...</span>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="table-responsive">
                                    {uploadedCandidates && uploadedCandidates.length > 0 ? (
                                      <table className="table table-hover-animation mb-0">
                                        <thead>
                                          <tr>
                                            <th>Sr. No.</th>
                                            <th>Roll No</th>
                                            <th>Candidate Name</th>
                                            <th>Father Name</th>
                                            <th>Course</th>
                                            <th>Year (1st/2nd/3rd/4th)</th>
                                            <th>Session/Semester</th>
                                            <th>Upload Date</th>
                                          </tr>
                                        </thead>
                                        <tbody>
                                          {uploadedCandidates.map((candidate, index) => (
                                            <tr key={candidate._id}>
                                              <td>{(candidatesPage - 1) * 50 + index + 1}</td>
                                              <td>{candidate.rollNo || 'N/A'}</td>
                                              <td className="text-capitalize">{candidate.name || 'N/A'}</td>
                                              <td className="text-capitalize">{candidate.fatherName || 'N/A'}</td>
                                              
                                              <td>{candidate.course || 'N/A'}</td>
                                              <td>{candidate.session || 'N/A'}</td>
                                              <td>{candidate.createdAt ? moment(candidate.createdAt).format('Do MMMM, YYYY HH:mm') : 'N/A'}</td>
                                            </tr>
                                          ))}
                                        </tbody>
                                      </table>
                                    ) : (
                                      <p className="text-center mt-3">No uploaded candidates found</p>
                                    )}
                                  </div>
                                )}
                                {renderCandidatesPagination()}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      
    </>
  );
};

export default UploadCandidates;