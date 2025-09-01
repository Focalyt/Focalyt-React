import React , {useState , useEffect} from 'react'
import { useParams } from 'react-router-dom';
import axios from 'axios';

const MisReport = () => {
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    const [studentList, setStudentList] = useState([]);
    const [studentListLoading, setStudentListLoading] = useState(true);
    const [studentListError, setStudentListError] = useState(null);
    const { batchId } = useParams();

    useEffect(() => {
        const fetchStudentList = async () => {
            try {
                setStudentListLoading(true);
                
                const response = await axios.get(`${backendUrl}/college/candidate/misreport/${batchId}`, {
                    headers: {
                        'x-auth': token
                    }
                });
                console.log("response misreport :", response.data);
                if (response.data.status) {
                    setStudentList(response.data.data || []);
                } else {
                    setStudentListError(response.data.message || 'Failed to fetch data');
                }
            } catch (error) {
                console.error('Error fetching student list:', error);
                setStudentListError(error.response?.data?.message || 'Error fetching student data');
            } finally {
                setStudentListLoading(false);
            }
        }
        
        if (batchId) {
            fetchStudentList();
        }
    }, [batchId, token, backendUrl]);

    const downloadMISReport = () => {
      if (!studentList || studentList.length === 0) {
        alert('No student data available to download');
        return;
      }
    
      // Create CSV headers based on your table columns
      const headers = [
        'Sr.No',
        'Sector',
        'Course Name',
        'Batch NO',
        'Name',
        'Gender',
        'DOB',
        'Age',
        'Category',
        'Religion',
        'District',
        'Block',
        'Residential Type',
        'Address',
        'Contact',
        'Email',
        'Aadhaar No',
        'Reg. No/ Date',
        'Course Start Date',
        'Expected Course Completion Date',
        'Actual Course Completion Date',
        'Assessment Date',
        'Whether Assessment Result Received',
        'Assessment Result',
        'Re-assessment Date',
        'No. of Attempts for Assessment',
        'RE-assessment Result',
        'Whether Certificate Received',
        'Date of Certification Received',
        'Placement Date',
        'Placement Sector/ Type of Industry where Student is placed',
        'Name of Organisation where Student is placed',
        'Job Location',
        'Joining Date',
        'Placement Job Monthly Salary (INR)',
        'Student Status',
        'Job_Offer_Date',
        'Job_Offer_Sector',
        'Job_Offer_Jobrole',
        'Job_Offer_Salary',
        'Placement_Jobrole',
        'Whether Pursuing Higher Studies',
        'Higher Studies Institute',
        'Whether Pursuing Competitive Examination',
        'Competitive Examination Name',
        'Whether Unemployed',
        'Remarks'
      ];
    
      const csvRows = [headers.join(',')];
    
      // Process each student record
      studentList.forEach((student, index) => {
        const row = [
          index + 1,
          student?.sector || '',
          student?.course || '',
          student?.batch || '',
          student?.candidateName?.toUpperCase() || '',
          student?.gender === 'M' ? 'Male' : student?.gender === 'F' ? 'Female' : student?.gender || '',
          student?.dob ? new Date(student.dob).toLocaleDateString('en-GB') : '',
          student?.dob ? Math.floor((new Date() - new Date(student.dob)) / (1000 * 60 * 60 * 24 * 365.25)) + ' years' : '',
          student?.category || '',
          student?.religion || '',
          student?.district || '',
          student?.block || '',
          student?.residentialType || '',
          student?.address?.fullAddress || '',
          student?.mobile || '',
          student?.email || '',
          student?.aadhaarNo || '',
          student?.regNo || '',
          student?.startDate ? new Date(student.startDate).toLocaleDateString('en-GB') : '',
          student?.endDate ? new Date(student.endDate).toLocaleDateString('en-GB') : '',
          student?.actualCourseCompletionDate || '',
          student?.assessmentDate || '',
          student?.whetherAssessmentResultReceived || '',
          student?.assessmentResult || '',
          student?.reAssessmentDate || '',
          student?.noOfAttemptsForAssessment || '',
          student?.reAssessmentResult || '',
          student?.whetherCertificateReceived || '',
          student?.dateOfCertificationReceived || '',
          student?.placementDate || '',
          student?.placementSector || '',
          student?.nameOfOrganisation || '',
          student?.jobLocation || '',
          student?.joiningDate || '',
          student?.placementJobMonthlySalary || '',
          student?.studentStatus || '',
          student?.jobOfferDate || '',
          student?.jobOfferSector || '',
          student?.jobOfferJobrole || '',
          student?.jobOfferSalary || '',
          student?.placementJobrole || '',
          student?.whetherPursuingHigherStudies || '',
          student?.higherStudiesInstitute || '',
          student?.whetherPursuingCompetitiveExamination || '',
          student?.competitiveExaminationName || '',
          student?.whetherUnemployed || '',
          student?.remarks || ''
        ];
    
        // Escape any commas in the data and wrap in quotes
        const csvRow = row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
        csvRows.push(csvRow);
      });
    
      // Create CSV content
      const csvContent = csvRows.join('\n');
      const filename = `mis-report-batch-${new Date().toISOString().split('T')[0]}.csv`;
    
      // Download the file
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    };

  return (
     <div>
         <div className="card shadow-sm mb-4 student-list-card">
            <div className="card-body">
              <h5 className="card-title">Student List</h5>

              <div className="row g-3 mb-4">
                {studentListLoading && (
                  <div className="col-12 loading-container">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2 text-muted">Loading student list...</p>
                  </div>
                )}

                {studentListError && (
                  <div className="col-12">
                    <div className="alert error-alert" role="alert">
                      <i className="fas fa-exclamation-triangle me-2"></i>
                      Error loading student list: {studentListError}
                    </div>
                  </div>
                )}
              </div>
              <div className="table-responsive student-table-container">
              <button className="btn btn-primary float-end"  onClick={() => {
                        console.log('Download button clicked');
                        downloadMISReport();
                        console.log('New state will be:');
                      }}>Download</button>
                <table className="table table-hover align-middle student-table">
                  <thead className="table-light">
                    <tr>
                      <th>Sr.No</th>
                      <th>Sector</th>
                      <th>Course Name</th>
                      <th>Batch NO</th>
                      <th>Name</th>
                      <th>Gender</th>
                      <th>DOB</th>
                      <th>Age</th>
                      <th>Category</th>
                      <th>Religion</th>
                      <th>District</th>
                      <th>Block</th>
                      <th>Residential Type</th>
                      <th>Address</th>
                      <th>Contact</th>
                      <th>Email</th>
                      <th>Aadhaar No</th>
                      <th>Reg. No/ Date</th>
                      <th>Course Start Date</th>
                      <th>Expected Course Completion Date</th>
                      <th>Actual Course Completion Date</th>
                      <th>Assessment Date</th>
                      <th>Whether Assessment Result Received</th>
                      <th>Assessment Result</th>
                      <th>Re-assessment Date</th>
                      <th>No. of Attempts for Assessment*</th>
                      <th>RE-assessment Result</th>
                      <th>Whether Certificate Received</th>
                      <th>Date of Certification Received</th>
                      <th>Placement Date</th>
                      <th>Placement Sector/ Type of Industry where Student is placed*</th>
                      <th>Name of Organisation where Student is placed</th>
                      <th>Job Location</th>
                      <th>Joining Date</th>
                      <th>Placement Job Monthly Salary (INR)</th>
                      <th>Student Status</th>
                      <th>Job_Offer_Date</th>
                      <th>Job_Offer_Sector</th>
                      <th>Job_Offer_Jobrole</th>
                      <th>Job_Offer_Salary</th>
                      <th>Placement_Jobrole</th>
                      <th>Whether Pursuing Higher Studies</th>
                      <th>Higher Studies Institute</th>
                      <th>Whether Pursuing Competitive Examination</th>
                      <th>Competitive Examination Name</th>
                      <th>Whether Unemployed</th>
                      <th>Remarks</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentList.length > 0 ? (
                      studentList.map((source, index) => {
                        return (
                          <tr key={index}>
                            <td className="data-value">{index + 1}</td>
                            <td className="data-value" title={source?.sector || '-'}>{source?.sector || '-'}</td>
                            <td className="data-value" title={source?.course || '-'}>{source?.course || '-'}</td>
                            <td className="data-value">{source?.batch || '-'}</td>
                            <td className="data-value">{source?.candidateName?.toUpperCase() || '-'}</td>
                            <td className="data-value">{source?.gender=='M' ? 'Male': source?.gender=='F'?'Female':source?.gender || '-'}</td>
                            <td className="data-value">{source?.dob ? new Date(source.dob).toLocaleDateString('en-GB') : '-'}</td>
                            <td className="data-value">{Math.floor((new Date() - new Date(source.dob)) / (1000 * 60 * 60 * 24 * 365.25))+' years'}</td>
                            <td className="data-value">{source?.category || '-'}</td>
                            <td className="data-value">{source?.religion || '-'}</td>
                            <td className="data-value">{source?.district || '-'}</td>
                            <td className="data-value">{source?.block || '-'}</td>
                            <td className="data-value">{source?.residentialType || '-'}</td>
                            <td className="data-value" title={source?.address?.fullAddress || '-'}>{source?.address?.fullAddress || '-'}</td>
                            <td className="data-value">{source?.mobile || '-'}</td>
                            <td className="data-value" title={source?.email || '-'} >{source?.email || '-'}</td>
                            <td className="data-value">{source?.aadhaarNo || '-'}</td>
                            <td className="data-value">{source?.regNo || '-'}</td>
                            <td className="data-value">{source?.startDate ? new Date(source.startDate).toLocaleDateString('en-GB') : '-'}</td>
                            <td className="data-value">{source?.endDate ? new Date(source.endDate).toLocaleDateString('en-GB') : '-'}
                            </td>
                            <td className="data-value">{source?.actualCourseCompletionDate || '-'}</td>
                            <td className="data-value">{source?.assessmentDate || '-'}</td>
                            <td className="data-value">{source?.whetherAssessmentResultReceived || '-'}</td>
                            <td className="data-value">{source?.assessmentResult || '-'}</td>
                            <td className="data-value">{source?.reAssessmentDate || '-'}</td>
                            <td className="data-value">{source?.noOfAttemptsForAssessment || '-'}</td>
                            <td className="data-value">{source?.reAssessmentResult || '-'}</td>
                            <td className="data-value">{source?.whetherCertificateReceived || '-'}</td>
                            <td className="data-value">{source?.dateOfCertificationReceived || '-'}</td>
                            <td className="data-value">{source?.placementDate || '-'}</td>
                            <td className="data-value">{source?.placementSector || '-'}</td>
                            <td className="data-value">{source?.nameOfOrganisation || '-'}</td>
                            <td className="data-value">{source?.jobLocation || '-'}</td>
                            <td className="data-value">{source?.joiningDate || '-'}</td>
                            <td className="data-value">{source?.placementJobMonthlySalary || '-'}</td>
                            <td className="data-value status-cell">{source?.studentStatus || '-'}</td>
                            <td className="data-value">{source?.jobOfferDate || '-'}</td>
                            <td className="data-value">{source?.jobOfferSector || '-'}</td>
                            <td className="data-value">{source?.jobOfferJobrole || '-'}</td>
                            <td className="data-value">{source?.jobOfferSalary || '-'}</td>
                            <td className="data-value">{source?.placementJobrole || '-'}</td>
                            <td className="data-value">{source?.whetherPursuingHigherStudies || '-'}</td>
                            <td className="data-value">{source?.higherStudiesInstitute || '-'}</td>
                            <td className="data-value">{source?.whetherPursuingCompetitiveExamination || '-'}</td>
                            <td className="data-value">{source?.competitiveExaminationName || '-'}</td>
                            <td className="data-value">{source?.whetherUnemployed || '-'}</td>
                            <td className="data-value">{source?.remarks || '-'}</td>
                          </tr>
                        )
                      })
                    ) : (
                      <tr className="empty-state">
                        <td colSpan="50" className="text-center text-muted">
                          <i className="fas fa-inbox me-2"></i>
                          No student data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

            </div>



          </div>



        <style>
  {
    `
    /* Dashboard Student List Table Styles */

/* Card Container */
.student-list-card {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  border: 1px solid #e9ecef;
  overflow: hidden;
  transition: all 0.3s ease;
}

.student-list-card:hover {
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.12);
  transform: translateY(-2px);
}

.student-list-card .card-body {
  padding: 1.5rem;
}

.student-list-card .card-title {
  color: #2c3e50;
  font-weight: 600;
  font-size: 1.25rem;
  margin-bottom: 1.5rem;
  padding-bottom: 0.75rem;
  border-bottom: 2px solid #3498db;
  position: relative;
}

.student-list-card .card-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg, #3498db, #2980b9);
}

/* Loading and Error States */
.loading-container {
  padding: 3rem 1rem;
  text-align: center;
}

.loading-container .spinner-border {
  width: 3rem;
  height: 3rem;
  color: #3498db;
}

.loading-container p {
  color: #6c757d;
  font-size: 0.95rem;
  margin-top: 1rem;
}

.error-alert {
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #ff6b6b, #ee5a52);
  color: white;
  padding: 1rem 1.25rem;
  margin: 1rem 0;
}

.error-alert i {
  color: #fff3cd;
}

/* Table Styles */
.student-table-container {
  border-radius: 8px;
  overflow: auto;
  border: 1px solid #e9ecef;
  background: #ffffff;
}

.student-table {
  margin-bottom: 0;
  font-size: 0.875rem;
  border-collapse: separate;
  border-spacing: 0;
}

/* Table Header */
.student-table thead {
  background: linear-gradient(135deg, #f8f9fa, #e9ecef);
  border-bottom: 2px solid #dee2e6;
}

.student-table thead th {
  background: transparent;
  color: #495057;
  font-weight: 600;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  padding: 1rem 0.75rem;
  border: none;
  white-space: nowrap;
  position: relative;
  vertical-align: middle;
}

.student-table thead th:first-child {
  border-top-left-radius: 8px;
}

.student-table thead th:last-child {
  border-top-right-radius: 8px;
}

.student-table thead th::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: #dee2e6;
}

/* Table Body */
.student-table tbody tr {
  transition: all 0.2s ease;
  border-bottom: 1px solid #f8f9fa;
}

.student-table tbody tr:hover {
  background: linear-gradient(135deg, #f8f9ff, #e3f2fd);
  transform: scale(1.001);
  box-shadow: 0 2px 8px rgba(52, 152, 219, 0.1);
}

.student-table tbody tr:last-child {
  border-bottom: none;
}

.student-table tbody td {
  padding: 0.875rem 0.75rem;
  vertical-align: middle;
  // border: none;
  color: #495057;
  font-size: 0.8rem;
  line-height: 1.4;
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Specific Column Styling */
.student-table tbody td:nth-child(1) {
  font-weight: 600;
  color: #3498db;
  text-align: center;
  min-width: 50px;
}

.student-table tbody td:nth-child(5) {
  font-weight: 600;
  color: #2c3e50;
  min-width: 120px;
}

.student-table tbody td:nth-child(6) {
  text-transform: capitalize;
}

.student-table tbody td:nth-child(14),
.student-table tbody td:nth-child(15) {
  font-family: 'Courier New', monospace;
  font-size: 0.75rem;
}

/* Status Indicators */
.status-cell {
  position: relative;
  padding-left: 1.5rem !important;
}

.status-cell::before {
  content: '';
  position: absolute;
  left: 0.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #28a745;
}

.status-cell.status-active::before {
  background: #28a745;
}

.status-cell.status-inactive::before {
  background: #dc3545;
}

.status-cell.status-pending::before {
  background: #ffc107;
}


// .empty-state {
//   padding: 3rem 1rem;
//   text-align: center;
//   color: #6c757d;
// }

// .empty-state i {
//   font-size: 3rem;
//   color: #dee2e6;
//   margin-bottom: 1rem;
//   display: block;
// }

// .empty-state td {
//   padding: 2rem !important;
//   font-size: 1rem !important;
//   color: #6c757d !important;
// }

/* Responsive Design */
@media (max-width: 1200px) {
  .student-table-container {
    overflow-x: auto;
  }
  
  .student-table {
    min-width: 1200px;
  }
}

@media (max-width: 768px) {
  .student-list-card .card-body {
    padding: 1rem;
  }
  
  .student-table thead th,
  .student-table tbody td {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }
  
  .student-table thead th {
    font-size: 0.7rem;
  }
}

/* Scrollbar Styling */
.student-table-container::-webkit-scrollbar {
  height: 8px;
}

.student-table-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.student-table-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.student-table-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}


// @keyframes fadeInUp {
//   from {
//     opacity: 0;
//     transform: translateY(20px);
//   }
//   to {
//     opacity: 1;
//     transform: translateY(0);
//   }
// }

// .student-table tbody tr {
//   animation: fadeInUp 0.3s ease forwards;
// }

// .student-table tbody tr:nth-child(1) { animation-delay: 0.1s; }
// .student-table tbody tr:nth-child(2) { animation-delay: 0.2s; }
// .student-table tbody tr:nth-child(3) { animation-delay: 0.3s; }
// .student-table tbody tr:nth-child(4) { animation-delay: 0.4s; }
// .student-table tbody tr:nth-child(5) { animation-delay: 0.5s; }

/* Data value styling */
.data-value {
  font-weight: 500;
  color: #2c3e50;
  border-right:1px solid #ccc;
  }

.data-value.na {
  color: #6c757d;
  font-style: italic;
  font-weight: 400;
}

    `
  }
</style>
    </div>
  )
}

export default MisReport    