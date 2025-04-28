import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';

const MyStudents = () => {
  const [students, setStudents] = useState([]);
  const [qualifications, setQualifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isProfileCompleted, setIsProfileCompleted] = useState(true);
  const [message, setMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;

  useEffect(() => {
    fetchStudents();
    fetchQualifications();
    checkProfileCompletion();
  }, [page, location.search]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const header = { headers: { 'x-auth': localStorage.getItem('token') } };
      const response = await axios.get(`${backendUrl}/college/students?page=${page}`, header);
      
      if (response.data.status) {
        setStudents(response.data.students || []);
        setTotalPages(response.data.totalPages || 1);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching students:', error);
      setLoading(false);
    }
  };

  const fetchQualifications = async () => {
    try {
      const header = { headers: { 'x-auth': localStorage.getItem('token') } };
      const response = await axios.get(`${backendUrl}/qualifications`, header);
      
      if (response.data.status) {
        setQualifications(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching qualifications:', error);
    }
  };

  const checkProfileCompletion = async () => {
    try {
      const header = { headers: { 'x-auth': localStorage.getItem('token') } };
      const response = await axios.get(`${backendUrl}/college/checkProfileCompletion`, header);
      
      if (response.data.status) {
        setIsProfileCompleted(response.data.isCompleted);
        if (!response.data.isCompleted) {
          setMessage('Please complete your profile');
        }
      }
    } catch (error) {
      console.error('Error checking profile completion:', error);
    }
  };

  const getQualificationName = (qualificationId) => {
    const qualification = qualifications.find(q => q._id === qualificationId);
    return qualification ? qualification.name : 'NA';
  };

  const handlePageChange = (pageNumber) => {
    setPage(pageNumber);
    const params = new URLSearchParams(location.search);
    params.set('page', pageNumber);
    navigate(`?${params.toString()}`);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && page >= 2) {
      first = page - 1;
      last = page + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];

    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(1); }}>
            First
          </a>
        </li>
      );
    }

    for (let i = first; i <= last; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === page ? 'active' : ''}`}>
          <a 
            className="page-link" 
            href="#" 
            onClick={(e) => { e.preventDefault(); handlePageChange(i); }}
          >
            {i}
          </a>
        </li>
      );
    }

    if (totalPages > last) {
      pages.push(
        <li key="dots" className="page-item">
          <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(last + 1); }}>
            ...
          </a>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <a className="page-link" href="#" onClick={(e) => { e.preventDefault(); handlePageChange(totalPages); }}>
            Last
          </a>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2">
        {pages}
      </ul>
    );
  };

  return (
    <>
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">My Students</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="#">My Students</a>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      <section id="personal-info">
        <div className="row">
          <div className="col-xl-12 col-lg-12">
            <div className="card">
              <div className="card-header border border-top-0 border-left-0 border-right-0">
                <h4 className="card-title pb-1">My Students</h4>
              </div>
              
              {!isProfileCompleted && (
                <div id="msg" style={{ color: 'red' }} className="text-center ml-2 mt-1">
                  {message}
                </div>
              )}

              <form>
                <div className="card-content">
                  <div className="card-body">
                    <div className="table-responsive">
                      <table id="tblexportData" className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>CANDIDATES</th>
                            <th>GENDER</th>
                            <th>Qualification</th>
                            <th>Year Of Passing</th>
                            <th>Experience</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loading ? (
                            <tr>
                              <td colSpan="5" className="text-center">Loading...</td>
                            </tr>
                          ) : students && students.length > 0 && students[0].data ? (
                            students[0].data.map((student, index) => (
                              <tr key={student._id || index}>
                                <td className="text-capitalize">
                                  <Link to={`/college/candidate/${student._id}`}>
                                    {student.name || 'NA'}
                                  </Link>
                                </td>
                                <td className="text-capitalize">
                                  {student.sex || 'NA'}
                                </td>
                                <td>
                                  {student.qualifications?.Qualification 
                                    ? getQualificationName(student.qualifications.Qualification)
                                    : 'NA'}
                                </td>
                                <td>
                                  {student.qualifications?.PassingYear || 'NA'}
                                </td>
                                <td className="text-capitalize">
                                  {student.totalExperience 
                                    ? `${student.totalExperience} Years`
                                    : 'Fresher'}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="text-center">No Result Found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      
                      {renderPagination()}
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default MyStudents;