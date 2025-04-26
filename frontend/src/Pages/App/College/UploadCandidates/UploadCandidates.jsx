import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';

const UploadCandidates = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  
  const [imports, setImports] = useState([]);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isProfileCompleted, setIsProfileCompleted] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchImports();
    checkProfileStatus();
  }, [currentPage]);

  const checkProfileStatus = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/profile-status`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      setIsProfileCompleted(response.data.isCompleted);
    } catch (error) {
      console.error('Error checking profile status:', error);
    }
  };

  const fetchImports = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/imports?page=${currentPage}`, {
        headers: { 'x-auth': localStorage.getItem('token') }
      });
      setImports(response.data.imports || []);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('Error fetching imports:', error);
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
    const formData = new FormData();
    formData.append('filename', file);

    try {
      await axios.post(`${backendUrl}/college/uploadfiles`, formData, {
        headers: { 
          'x-auth': localStorage.getItem('token'),
          'Content-Type': 'multipart/form-data'
        }
      });
      setFile(null);
      fetchImports();
    } catch (error) {
      console.error('Error uploading file:', error);
      setMessage('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const downloadSample = async () => {
    try {
      const response = await axios.get(`${backendUrl}/college/single`, {
        responseType: 'blob',
        headers: { 'x-auth': localStorage.getItem('token') }
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
            <div className="alert alert-danger" role="alert">
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
                                  className={`btn btn-success my-1 mt-2 ${!isProfileCompleted ? 'disabled' : ''}`}
                                  id="submitBtn"
                                  disabled={!isProfileCompleted || loading}
                                >
                                  Submit
                                </button>
                              </div>
                              
                              {!isProfileCompleted && (
                                <div className="mt-2" style={{ color: 'red' }}>
                                  Please Complete Your profile
                                </div>
                              )}
                            </form>
                          </div>
                          
                          <div className="col-12">
                            <div className="card-content">
                              <div className="table-responsive">
                                {imports && imports.length > 0 ? (
                                  <table className="table table-hover-animation mb-0">
                                    <thead>
                                      <tr>
                                        <th>NAME</th>
                                        <th>MESSAGE</th>
                                        <th>STATUS</th>
                                        <th>RECORD INSERTED</th>
                                        <th>DATE TIME</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {imports.map((item, index) => (
                                        <tr key={item._id}>
                                          <td className="text-capitalize">{item.name}</td>
                                          <td className="text-capitalize">
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
                                  <p className="text-center mt-3">No result found</p>
                                )}
                              </div>
                            </div>
                            {renderPagination()}
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