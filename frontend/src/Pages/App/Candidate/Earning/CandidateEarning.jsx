import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import moment from 'moment';


const CandidateEarning = ({
  documents,
  upi,
  candidateEarning = [],
  activeRequest = [],
  totalCashback,
  canRedeem,
  threshold
}) => {
  const [formData, setFormData] = useState({
    aadharCard: documents?.aadharCard || '',
    panCard: documents?.panCard || '',
    aadharCardImage: documents?.aadharCardImage || '',
    panCardImage: documents?.panCardImage || '',
    upi: upi || ''
  });

  const [error, setError] = useState('');
  const [documentError, setDocumentError] = useState('');
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const [modalInstance, setModalInstance] = useState(null);
  const [rewardStatuses, setRewardStatuses] = useState([]);
  const [loadingStatuses, setLoadingStatuses] = useState(false);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null);
  const [upiType, setUpiType] = useState('number'); // 'number' or 'id'
  const [claimFormData, setClaimFormData] = useState({
    upiNumber: '',
    upiId: '',
    address: '',
    email: '',
    documents: {},
    feedback: ''
  });
  const [uploadingDocs, setUploadingDocs] = useState({});
  const [claimError, setClaimError] = useState('');
  const [claimLoading, setClaimLoading] = useState(false);
  const rewardSliderRef = useRef(null);

  const scrollRewardSlider = (direction = 'right') => {
    const el = rewardSliderRef.current;
    if (!el) return;
    const delta = Math.max(260, Math.floor(el.clientWidth * 0.8));
    el.scrollBy({
      left: direction === 'left' ? -delta : delta,
      behavior: 'smooth'
    });
  };

  const handleRewardWheel = (e) => {
    const el = rewardSliderRef.current;
    if (!el) return;
    // Convert vertical wheel to horizontal scroll (trackpad/mouse)
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollBy({ left: e.deltaY, behavior: 'auto' });
    }
  };

  const requestCashback = () => {
    axios.post(`${backendUrl}/requestCashback`,
      { amount: totalCashback },
      { headers: { 'x-auth': localStorage.getItem('token') } }
    )
      .then(res => {
        if (!res.data.status) {
          setError(res.data.msg);
        } else {
          window.location.reload();
        }
      });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value.replace(/\s/g, "")
    }));
  };

  const checkImageType = (file) => {
    let regex = /(\.jpg|\.jpeg|\.png)$/i;
    return regex.exec(file);
  };

  const checkImageSize = (size) => {
    let finalSize = ((size / 1024) / 1024);
    return finalSize <= 3;
  };

  const imageChangeHandler = (e, id) => {
    let file = e.target.files[0];
    let type = file.name;
    let size = file.size;

    if (!checkImageType(type) && !checkImageSize(size)) {
      alert("Upload the image in .jpg, .jpeg or .png format and size should be less than 3MB");
      e.target.value = '';
    } else if (checkImageType(type) && !checkImageSize(size)) {
      alert("Uploaded image size should be less than 3MB");
      e.target.value = '';
    } else if (!checkImageType(type) && checkImageSize(size)) {
      alert("Upload the image in .jpg, .jpeg or .png format");
      e.target.value = '';
    } else {
      const formDataObj = new FormData();
      formDataObj.append('file', file);

      axios.post(`${backendUrl}/api/uploadSingleFile`, formDataObj, {
        headers: {
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        }
      })
        .then(result => {
          if (result.data.status) {
            setFormData(prev => ({
              ...prev,
              [id]: result.data.data.Key
            }));
          } else {
            alert("There is some error while uploading the document. Please upload again.");
          }
        });
    }
  };

  const closeKycModal = () => {
    const kycModal = document.getElementById('kyc');
    if (kycModal) {
      kycModal.classList.remove('show');
      kycModal.style.display = 'none';
      document.body.classList.remove('modal-open');

      // remove backdrop
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
    }
  };


  const removeImage = (type) => {
    const key = type === 'aadhar' ? formData.aadharCardImage : formData.panCardImage;

    axios.post(`${backendUrl}/api/deleteSingleFile`,
      { key },
      { headers: { 'x-auth': localStorage.getItem('token'), "Content-Type": "multipart/form-data" } }
    )
      .then(() => {
        axios.post(`${backendUrl}/candidate/removeKYCImage`, { type })
          .then((res) => {
            if (res.data.status) {
              setFormData(prev => ({
                ...prev,
                [type === 'aadhar' ? 'aadharCardImage' : 'panCardImage']: ''
              }));
            }
          });
      });
  };

  const validations = (e) => {
    e.preventDefault();

    const { aadharCard, panCard, aadharCardImage, panCardImage, upi } = formData;

    if ((!aadharCard.trim() && !panCard.trim()) || (!aadharCardImage && !panCardImage)) {
      setDocumentError('Please upload at least one Document.');
      return;
    } else if (!upi.trim()) {
      setDocumentError('Please enter the value for UPI.');
      return;
    }

    // Submit form if validation passes
    const form = e.target;
    form.submit();
  };

  // Fetch reward statuses from candidate endpoint
  useEffect(() => {
    const fetchRewardStatuses = async () => {
      setLoadingStatuses(true);
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(`${backendUrl}/candidate/rewardStatuses`, {
          headers: { "x-auth": token },
        });
        console.log("✅ Reward Statuses Fetched:", response);
        if (response.data && response.data.success && response.data.data) {
          setRewardStatuses(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching reward statuses:", error);
      } finally {
        setLoadingStatuses(false);
      }
    };

    if (backendUrl) {
      fetchRewardStatuses();
    }
  }, [backendUrl]);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.document) {
      const kycModal = document.getElementById('kyc');

      if (kycModal) {
        // Initialize with Bootstrap if available
        if (window.bootstrap && window.bootstrap.Modal) {
          const modalObj = new window.bootstrap.Modal(kycModal, {
            backdrop: true,
            keyboard: true,
            focus: true
          });
          setModalInstance(modalObj);
        }
        // Initialize with jQuery if available
        else if (window.jQuery) {
          window.jQuery(kycModal).modal({
            backdrop: true,
            keyboard: true,
            focus: true,
            show: false
          });
          setModalInstance({
            show: () => window.jQuery(kycModal).modal('show')
          });
        }
      }
    }
  }, []);

  const openKycModal = () => {
    if (modalInstance) {
      modalInstance.show();
    } else {
      const kycModal = document.getElementById('kyc');
      if (kycModal) {
        kycModal.classList.add('fade');
        setTimeout(() => {
          kycModal.classList.add('show');
          kycModal.style.display = 'block';
          document.body.classList.add('modal-open');
          let backdrop = document.querySelector('.modal-backdrop');
          if (!backdrop) {
            backdrop = document.createElement('div');
            backdrop.className = 'modal-backdrop fade';
            document.body.appendChild(backdrop);
            backdrop.classList.add('show');
          }
        }, 10);
      } else {
        console.error("KYC Modal element not found in the DOM");
      }
    }
  };

  const openClaimModal = (rewardStatus, isResubmit = false) => {
    setSelectedReward(rewardStatus);
    setUpiType('number'); // Reset to default
    setClaimFormData({
      upiNumber: '',
      upiId: '',
      address: '',
      email: '',
      documents: {},
      feedback: ''
    });
    setClaimError('');
    setClaimModalOpen(true);
  };

  const closeClaimModal = () => {
    setClaimModalOpen(false);
    setSelectedReward(null);
    setUpiType('number'); // Reset to default
    setClaimFormData({
      upiNumber: '',
      upiId: '',
      address: '',
      email: '',
      documents: {},
      feedback: ''
    });
    setClaimError('');
  };

  const handleClaimInputChange = (e) => {
    const { name, value } = e.target;
    setClaimFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDocumentUpload = async (e, docName) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type (matching Registrations.jsx pattern)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'pdf', 'doc', 'docx'];
    
    if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
      alert("Please upload file in .jpg, .jpeg, .png, .gif, .pdf, .doc, or .docx format");
      e.target.value = '';
      return;
    }

    // Check file size (max 10MB - matching Registrations.jsx)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert("File size should be less than 10MB");
      e.target.value = '';
      return;
    }

    setUploadingDocs(prev => ({ ...prev, [docName]: true }));

    try {
      const formDataObj = new FormData();
      formDataObj.append('file', file);
      
      // Create filename for S3 organization (similar to Registrations.jsx pattern)
      // Format: reward-claim-{statusId}-{docName}
      const statusId = selectedReward?._id || 'general';
      const sanitizedDocName = docName.replace(/\s+/g, '-').toLowerCase();
      const filename = `reward-claim-${statusId}-${sanitizedDocName}`;
      
      // Send filename in URL parameter (URL-encoded for safety)
      const encodedFilename = encodeURIComponent(filename);

      const response = await axios.post(`${backendUrl}/api/uploadSingleFile/${encodedFilename}`, formDataObj, {
        headers: {
          'x-auth': localStorage.getItem('token'),
          "Content-Type": "multipart/form-data"
        }
      });

      if (response.data.status && response.data.data) {
        // Response structure: { status: true, data: { Key: "...", Location: "..." } }
        const documentKey = response.data.data.Key || response.data.data.key || response.data.data.Location;
        
        if (documentKey) {
          setClaimFormData(prev => ({
            ...prev,
            documents: {
              ...prev.documents,
              [docName]: {
                documentName: docName,
                documentKey: documentKey,
                uploadedAt: new Date().toISOString()
              }
            }
          }));
          // Success feedback (matching Registrations.jsx pattern)
          console.log('Document uploaded successfully:', docName);
        } else {
          alert("There is some error while uploading the document. Please upload again.");
          e.target.value = '';
        }
      } else {
        const errorMsg = response.data.message || response.data.err || "Failed to upload file";
        alert(errorMsg);
        e.target.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      const errorMsg = error.response?.data?.message || error.response?.data?.err || error.message || "Error uploading document. Please try again.";
      alert(errorMsg);
      e.target.value = '';
    } finally {
      setUploadingDocs(prev => ({ ...prev, [docName]: false }));
    }
  };

  const handleClaimSubmit = async (e) => {
    e.preventDefault();
    setClaimError('');
    
    // Validate UPI fields for money reward
    if (selectedReward.rewardType === 'money') {
      if (upiType === 'number' && !claimFormData.upiNumber.trim()) {
        setClaimError('Please enter UPI Number');
        return;
      }
      if (upiType === 'id' && !claimFormData.upiId.trim()) {
        setClaimError('Please enter UPI ID');
        return;
      }
    }

    // Validate email for voucher reward
    if (selectedReward.rewardType === 'voucher') {
      if (!claimFormData.email.trim()) {
        setClaimError('Please enter your Email ID');
        return;
      }
      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(claimFormData.email.trim())) {
        setClaimError('Please enter a valid email address');
        return;
      }
    }

    // Validate address for other reward
    if (selectedReward.rewardType === 'other') {
      if (!claimFormData.address.trim()) {
        setClaimError('Please enter your address');
        return;
      }
      if (claimFormData.address.trim().length < 10) {
        setClaimError('Address must be at least 10 characters long');
        return;
      }
    }
    
    setClaimLoading(true);

    try {
      const token = localStorage.getItem("token");
      // Convert documents object to array with proper structure
      const documentsArray = Object.values(claimFormData.documents).map(doc => ({
        documentName: doc.documentName,
        documentKey: doc.documentKey,
        uploadedAt: doc.uploadedAt || new Date().toISOString()
      }));

      console.log('Submitting documents:', documentsArray); // Debug log

      const payload = {
        rewardStatusId: selectedReward._id,
        documents: documentsArray,
        feedback: selectedReward.requiresFeedback ? claimFormData.feedback : null
      };

      if (selectedReward.rewardType === 'money') {
        // Only send the selected UPI type
        if (upiType === 'number') {
          payload.upiNumber = claimFormData.upiNumber.trim();
          payload.upiId = null;
        } else {
          payload.upiId = claimFormData.upiId.trim();
          payload.upiNumber = null;
        }
      }

      if (selectedReward.rewardType === 'gift' || selectedReward.rewardType === 'trophy') {
        payload.address = claimFormData.address;
      }

      if (selectedReward.rewardType === 'voucher') {
        // For voucher, only send email (required)
        payload.email = claimFormData.email.trim();
      }

      if (selectedReward.rewardType === 'other') {
        payload.address = claimFormData.address.trim();
      }

      const response = await axios.post(`${backendUrl}/candidate/claimReward`, payload, {
        headers: { "x-auth": token }
      });

      if (response.data.success) {
        alert("Reward claim submitted successfully!");
        closeClaimModal();
        // Refresh reward statuses
        const statusResponse = await axios.get(`${backendUrl}/candidate/rewardStatuses`, {
          headers: { "x-auth": token }
        });
        if (statusResponse.data.success && statusResponse.data.data) {
          setRewardStatuses(statusResponse.data.data);
        }
      } else {
        setClaimError(response.data.message || 'Failed to submit claim');
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
      setClaimError(error.response?.data?.message || error.message || 'Failed to submit claim');
    } finally {
      setClaimLoading(false);
    }
  };


  return (
    <>
      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">My Earnings</h3>
              <div className="breadcrumb-wrapper col-12">
                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <a href="/candidate/dashboard">Home</a>
                  </li>
                  <li className="breadcrumb-item active">My Earnings</li>
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
                  <div className="tab_head font-weight-bolder p-3"> Documents</div>
                  <div className="tab_body bg-white p-3">
                    <div className="row">
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-12 ">
                        Aadhar Number <br />
                        <span>
                          <form>
                            <input
                              type="checkbox"
                              checked={documents?.aadharCard ? true : false}
                              disabled={documents?.aadharCard ? true : false}
                            />
                            <label>
                              {documents?.aadharCard ? documents.aadharCard : 'xxxx-xxxx-xxxx'}
                            </label>
                          </form>
                        </span>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-12 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-0 mt-1 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0 mb-1">
                        Pan number <br />
                        <span>
                          <form>
                            <input
                              type="checkbox"
                              checked={documents?.panCard ? true : false}
                              disabled={documents?.panCard ? true : false}
                            />
                            <label>
                              {documents?.panCard ? documents.panCard : 'xxxx-xxxx-xxxx'}
                            </label>
                          </form>
                        </span>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-12 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-0 mt-0 mb-xl-0 mb-lg-0 mb-md-0 mb-sm-0 mb-1">
                        UPI Id <br />
                        <span>
                          <form>
                            <input
                              type="checkbox"
                              checked={upi ? true : false}
                              disabled={upi ? true : false}
                            />
                            <label>
                              {upi ? upi : 'NA'}
                            </label>
                          </form>
                        </span>
                      </div>
                    </div>
                    <p className='cashout-p'>For Cashout, please upload your Adhaar card and PAN card.</p>
                    <p className="my-3">कैशआउट के लिए कृपया अपना आधार कार्ड और पैन कार्ड अपलोड करें|</p>

                    {documents?.status?.toLowerCase() === 'rejected' && documents?.comment && (
                      <p className="text-capitalize" style={{ color: 'red' }}>
                        Rejected - {documents?.comment}
                      </p>
                    )}

                    <div className="row">
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-12">
                        <button
                          className="btn btn-block btn-prp kyc-txt px-0"
                          onClick={openKycModal}
                        >
                          Upload KYC Document <i className="fa-solid fa-arrow-up"></i>
                        </button>
                      </div>
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-12 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-0 mt-1">
                        <button
                          className={`btn btn-block btn-orrage kyc-txt px-0 disabled waves-effect waves-light ${!documents?.kycCompleted ? 'disabled' : ''}`}
                          disabled={!documents?.kycCompleted}
                          data-toggle="modal"
                          data-target="#redeemCashback"
                        >
                          Cashout <span>₹{totalCashback}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Reward Statuses Section - Only show if rewards exist */}
            {rewardStatuses.length > 0 && (
              <div className="row mt-xl-5 mt-lg-2 mt-md-2 mt-sm-2 mt-2">
                <div className="col-12">
                  <div className="table-content shadow-cashback">
                    <div className="tab_head font-weight-bolder py-1 px-1">Reward Achievement</div>
                    <div className="tab_body bg-white p-3">
                      <div className="d-flex justify-content-end mb-2" style={{ gap: '8px' }}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => scrollRewardSlider('left')}
                          aria-label="Scroll rewards left"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => scrollRewardSlider('right')}
                          aria-label="Scroll rewards right"
                        >
                          ›
                        </button>
                      </div>

                      {loadingStatuses ? (
                        <div className="text-center py-3">
                          <p>Loading reward statuses...</p>
                        </div>
                      ) : rewardStatuses.length > 0 ? (
                        <div
                          ref={rewardSliderRef}
                          onWheel={handleRewardWheel}
                          style={{
                            display: 'flex',
                            gap: '12px',
                            overflowX: 'auto',
                            paddingBottom: '8px',
                            scrollSnapType: 'x mandatory',
                            WebkitOverflowScrolling: 'touch'
                          }}
                        >
                          {rewardStatuses.map((status, index) => {
                            // Check if all previous rewards are claimed
                            const previousRewardsClaimed = index === 0 || rewardStatuses.slice(0, index).every(prevStatus => prevStatus.isClaimed);
                            const canClaim = !status.isClaimed && previousRewardsClaimed;

                            return (
                              <div
                                key={status._id || index}
                                style={{
                                  minWidth: 260,
                                  maxWidth: 260,
                                  flex: '0 0 auto',
                                  scrollSnapAlign: 'start'
                                }}
                              >
                                <div className="card h-100" style={{ border: '1px solid #e5e7eb', borderRadius: '8px' }}>
                                  <div className="card-body">
                                    <div className="d-flex justify-content-between align-items-start mb-2">
                                      <h6 className="card-title mb-0" style={{ fontWeight: 600 }}>
                                        {status.title}
                                      </h6>
                                      <span
                                        className="badge"
                                        style={{
                                          backgroundColor: '#3b82f6',
                                          color: 'white',
                                          fontSize: '11px',
                                          textTransform: 'capitalize'
                                        }}
                                      >
                                        {status.rewardType || 'other'}
                                      </span>
                                    </div>
                                    {status.description && (
                                      <p className="card-text" style={{ fontSize: '14px', color: '#666', marginBottom: '8px' }}>
                                        {status.description}
                                      </p>
                                    )}
                                    {status.milestone && (
                                      <p className="card-text" style={{ fontSize: '13px', color: '#059669', fontWeight: 500 }}>
                                        {status.milestone}
                                      </p>
                                    )}
                                    {status.rewardType === 'money' && (
                                      <div className="mt-2" style={{ fontSize: '12px', color: '#6b7280' }}>
                                        <strong>Note:</strong> Please provide your UPI details when claiming this reward
                                      </div>
                                    )}
                                    {(status.rewardType === 'gift' || status.rewardType === 'trophy' || status.rewardType === 'other') && (
                                      <div className="mt-2" style={{ fontSize: '12px', color: '#6b7280' }}>
                                        <strong>Note:</strong> Please provide your delivery address when claiming this reward
                                      </div>
                                    )}
                                    {status.rewardType === 'voucher' && (
                                      <div className="mt-2" style={{ fontSize: '12px', color: '#6b7280' }}>
                                        <strong>Note:</strong> Please provide your email ID when claiming this reward
                                      </div>
                                    )}
                                    {status.substatuses && status.substatuses.length > 0 && (
                                      <div className="mt-2">
                                        <small style={{ color: '#6b7280', fontSize: '11px' }}>
                                          {status.substatuses.length} Substatus{status.substatuses.length > 1 ? 'es' : ''}
                                        </small>
                                      </div>
                                    )}
                                    {!previousRewardsClaimed && !status.isClaimed && (
                                      <div className="mt-2 mb-2">
                                        <small style={{ color: '#dc3545', fontSize: '11px', fontStyle: 'italic' }}>
                                          <i className="fas fa-info-circle mr-1"></i>
                                          Complete previous rewards first
                                        </small>
                                      </div>
                                    )}
                                    <div className="mt-3">
                                      {status.isClaimed ? (
                                        <>
                                          {status.claimStatus === 'rejected' ? (
                                            <>
                                              <button 
                                                className="btn btn-sm btn-danger w-100 mb-2" 
                                                disabled
                                              >
                                                <i className="fas fa-times-circle mr-1"></i>
                                                Claim Rejected
                                              </button>
                                              {status.adminRemarks && (
                                                <div className="alert alert-danger p-2 mb-2" style={{ fontSize: '12px' }}>
                                                  <strong>Reason:</strong> {status.adminRemarks}
                                                </div>
                                              )}
                                              <button
                                                className="btn btn-sm btn-warning w-100"
                                                onClick={() => openClaimModal(status, true)}
                                                title="Resubmit with updated documents"
                                              >
                                                <i className="fas fa-redo mr-1"></i>
                                                Resubmit Claim
                                              </button>
                                            </>
                                          ) : (
                                            <button className="btn btn-sm btn-secondary w-100" disabled>
                                              {status.claimStatus === 'pending' ? 'Claim Pending' :
                                                status.claimStatus === 'approved' ? 'Claim Approved' :
                                                  status.claimStatus === 'disbursed' ? 'Disbursed' : 'Claimed'}
                                            </button>
                                          )}
                                        </>
                                      ) : (
                                        <button
                                          className={`btn btn-sm ${canClaim ? 'btn-primary' : 'btn-secondary'} w-100`}
                                          onClick={() => canClaim && openClaimModal(status)}
                                          disabled={!canClaim}
                                          title={!canClaim ? 'Please claim previous rewards first' : 'Claim Reward'}
                                        >
                                          {canClaim ? 'Claim Reward' : 'Locked'}
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="row mt-xl-5 mt-lg-2 mt-md-2 mt-sm-2 mt-2">
              <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 pl-xl-0 pr-xl-1 pl-lg-0 pr-lg-1 pl-md-0 pr-md-1 px-sm-0 px-0">
                <div className="table-content shadow-cashback shadow-cashback">
                  <div className="tab_head font-weight-bolder py-1 px-1"> My Earnings</div>

                  <table className="table">
                    <thead>
                      <tr className="tab_row">
                        <th scope="col">Date/Time</th>
                        <th scope="col">Type</th>
                        <th scope="col">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {candidateEarning.length > 0 ? (
                        candidateEarning.map((cashback, i) => (
                          <tr key={i} className={i % 2 === 0 ? "tab_row-two" : "tab_row-three"}>
                            <td scope="row">
                              {moment(cashback.createdAt).utcOffset('+05:30').format('DD MMM YYYY, hh:mm A')}
                            </td>
                            <td className="text-capitalize">
                              {cashback?.eventName}
                            </td>
                            <td>₹{cashback?.amount}</td>
                          </tr>
                        ))
                      ) : null}
                      <tr className="tab_row-five">
                        <th scope="row"> </th>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mt-xl-0 mt-lg-0 mt-md-0 mt-sm-3 mt-3 pr-xl-0 pl-xl-1 pr-lg-0 pl-lg-1 pr-md-0 pl-md-1 px-sm-0 px-0">
                <div className="table-content shadow-cashback">
                  <div className="tab_head font-weight-bolder py-1 px-1"> Active Requests</div>
                  <table className="table">
                    <thead>
                      <tr className="tab_row">
                        <th scope="col">Date/Time</th>
                        <th scope="col">Amount</th>
                        <th scope="col">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeRequest.length > 0 ? (
                        activeRequest.map((request, i) => (
                          <tr key={i} className={i % 2 === 0 ? "tab_row-two" : "tab_row-three"}>
                            <td>
                              {moment(request.createdAt).utcOffset('+05:30').format('DD MMM YYYY, hh:mm A')}
                            </td>
                            <td>₹{request?.amount}</td>
                            <td className="text-capitalize">
                              {request?.status}
                            </td>
                          </tr>
                        ))
                      ) : null}
                      <tr className="tab_row-five">
                        <th scope="row"> </th>
                        <td></td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>



      {/* Cashback modal */}
      <div className="modal fade" id="redeemCashback" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content p-0">
            <div className="modal-header">
              <h5 className="modal-title text-black text-uppercase" id="exampleModalLongTitle">
                Redeem Cashback
              </h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button>
            </div>
            <div className="modal-body pt-1" id="popup-body">
              <ul className="list-unstyled">
                <li className="mb-1">
                  <span className="credit font-weight-bold">
                    Your Balance : {totalCashback ? totalCashback : 0}
                  </span>
                </li>
              </ul>
              {!canRedeem && (
                <h5 className="pb-1 mb-0">
                  For Cashback, you need to have a minimum Rs {threshold}/- in your cashback wallet.
                </h5>
              )}
            </div>
            <p id="error" className="text-danger">{error}</p>
            <div className="modal-footer">
              <button
                type="submit"
                className={`btn btn-primary waves-effect waves-light ${!canRedeem ? 'disabled' : ''}`}
                onClick={requestCashback}
                disabled={!canRedeem}
              >
                Request Cashback
              </button>
              <button type="button" className="btn btn-outline-light waves-effect waves-danger" data-dismiss="modal">
                <i className="feather icon-x d-block d-lg-none"></i>
                <span className="d-none d-lg-block">Cancel</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* KYC modal */}
      <div className="modal fade" id="kyc" tabIndex="-1" role="dialog" aria-labelledby="exampleModalCenterTitle">
        <div className="modal-dialog modal-dialog-centered" role="document">
          <div className="modal-content p-0">
            <div className="modal-header">
              <h5 className="modal-title text-black text-uppercase" id="exampleModalLongTitle">
                Upload KYC Document
              </h5>
              {/* <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
              </button> */}
              <button type="button" className="btn btn-outline-light waves-effect waves-danger close" onClick={closeKycModal}>
                <i className="fas fa-times d-block d-lg-none"></i>
                <span className="d-none d-lg-block">Cancel</span>
              </button>

            </div>
            <div className="modal-body pt-1" id="popup-body">
              <form method="post" action="/candidate/kycDocument" onSubmit={validations}>
                <div className="col-xl-6 mb-1">
                  <label>
                    Aadhar Card Number <span className="mandatory">*</span>
                  </label>
                  <input
                    type="number"
                    name="aadharCard"
                    id="aadharCardNumber"
                    className="form-control"
                    readOnly={documents?.kycCompleted}
                    maxLength="12"
                    placeholder="xxxx-xxxx-xxxx"
                    value={formData.aadharCard}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-xl-6 mb-1">
                  {formData.aadharCardImage ? (
                    <>
                      <a
                        href={`${process.env.REACT_APP_MIPIE_BUCKET_URL}/${formData.aadharCardImage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="aadharLink"
                      >
                        Uploaded image
                      </a>
                      {!documents?.kycCompleted && (
                        <i
                          className="feather icon-x remove_uploaded_pic"
                          style={{ color: 'red' }}
                          id="removeAadhar"
                          onClick={() => removeImage('aadhar')}
                        />
                      )}
                      <input
                        type="file"
                        className="form-control"
                        id="uploadAadharCard"
                        onChange={(e) => imageChangeHandler(e, 'aadharCardImage')}
                        style={{ display: 'none' }}
                      />
                      <input
                        type="hidden"
                        className="form-control"
                        name="aadharCardImage"
                        id="aadharCardImage"
                        value={formData.aadharCardImage}
                        required
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        className="form-control"
                        id="uploadAadharCard"
                        onChange={(e) => imageChangeHandler(e, 'aadharCardImage')}
                        required
                      />
                      <input
                        type="hidden"
                        className="form-control"
                        name="aadharCardImage"
                        id="aadharCardImage"
                        value={formData.aadharCardImage}
                        required
                      />
                    </>
                  )}
                </div>
                <div className="col-xl-6 mb-1">
                  <label>PAN Card Number</label>
                  <input
                    type="text"
                    name="panCard"
                    id="panCardNumber"
                    className="form-control"
                    style={{ textTransform: 'uppercase' }}
                    readOnly={documents?.kycCompleted}
                    maxLength="10"
                    minLength="10"
                    value={formData.panCard}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-xl-6 mb-1">
                  {formData.panCardImage ? (
                    <>
                      <a
                        href={`${process.env.REACT_APP_MIPIE_BUCKET_URL}/${formData.panCardImage}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        id="panLink"
                      >
                        Uploaded image
                      </a>
                      {!documents?.kycCompleted && (
                        <i
                          className="feather icon-x remove_uploaded_pic"
                          style={{ color: 'red' }}
                          id="removePan"
                          onClick={() => removeImage('pan')}
                        />
                      )}
                      <input
                        type="file"
                        className="form-control here"
                        id="uploadPanCard"
                        onChange={(e) => imageChangeHandler(e, 'panCardImage')}
                        style={{ display: 'none' }}
                      />
                      <input
                        type="hidden"
                        className="form-control"
                        name="panCardImage"
                        id="panCardImage"
                        value={formData.panCardImage}
                      />
                    </>
                  ) : (
                    <>
                      <input
                        type="file"
                        className="form-control"
                        id="uploadPanCard"
                        onChange={(e) => imageChangeHandler(e, 'panCardImage')}
                      />
                      <input
                        type="hidden"
                        className="form-control"
                        name="panCardImage"
                        id="panCardImage"
                        value={formData.panCardImage}
                      />
                    </>
                  )}
                </div>
                <div className="col-xl-6 mb-1">
                  <label>
                    UPI Id <span className="mandatory">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="upi"
                    value={formData.upi}
                    name="upi"
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <p id="documentError" className="text-danger">{documentError}</p>
                <div className="modal-footer">
                  <button
                    type="submit"
                    className="btn btn-primary waves-effect waves-light"
                    id="uploadDocument"
                  >
                    Upload
                  </button>
                  {/* <button type="button" className="btn btn-outline-light waves-effect waves-danger" data-dismiss="modal">
                  <i class="fas fa-times d-block d-lg-none"></i>
                    <span className="d-none d-lg-block">Cancel</span>
                  </button> */}
                  <button type="button" className="btn btn-outline-light waves-effect waves-danger" onClick={closeKycModal}>
                  <i class="fas fa-times d-block d-lg-none text-black"></i>
                  <span className="d-none d-lg-block">Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Claim Modal */}
      {claimModalOpen && selectedReward && (
        <>
          <div className="modal-backdrop fade show claim-modal__backdrop" onClick={closeClaimModal} style={{ zIndex: 1040 }}></div>
          <div className="modal fade show" style={{ display: 'block', zIndex: 1050 }} tabIndex="-1" role="dialog" aria-modal="true">
            <div className="modal-dialog modal-dialog-centered modal-lg" role="document" style={{ zIndex: 1051 }}>
              <div className="modal-content p-0 claim-modal">
                <div className="modal-header claim-modal__header">
                  <div>
                    <div className="claim-modal__kicker">
                      {selectedReward.claimStatus === 'rejected' ? 'Resubmit Reward Claim' : 'Claim Reward'}
                    </div>
                    <h5 className="modal-title claim-modal__title">
                      {selectedReward.title}
                    </h5>
                    {selectedReward.claimStatus === 'rejected' && selectedReward.adminRemarks && (
                      <div className="alert alert-warning p-2 mt-2 mb-0" style={{ fontSize: '12px' }}>
                        <strong>Previous Rejection Reason:</strong> {selectedReward.adminRemarks}
                        <br />
                        <small>Please update your documents and resubmit.</small>
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    className="claim-modal__close"
                    onClick={closeClaimModal}
                    aria-label="Close"
                    title="Close"
                  >
                    ×
                  </button>
                </div>
              <div className="modal-body pt-3 claim-modal__body">
                <form onSubmit={handleClaimSubmit}>
                  {selectedReward.rewardType === 'money' && (
                    <>
                      <div className="form-group mb-3">
                        <label className="mb-2">Select UPI Type <span className="text-danger">*</span></label>
                        <div className="d-flex gap-3 mb-3">
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="upiType"
                              id="upiTypeNumber"
                              value="number"
                              checked={upiType === 'number'}
                              onChange={(e) => {
                                setUpiType('number');
                                setClaimFormData(prev => ({ ...prev, upiId: '' })); // Clear UPI ID when switching
                              }}
                            />
                            <label className="form-check-label" htmlFor="upiTypeNumber">
                              UPI Number
                            </label>
                          </div>
                          <div className="form-check">
                            <input
                              className="form-check-input"
                              type="radio"
                              name="upiType"
                              id="upiTypeId"
                              value="id"
                              checked={upiType === 'id'}
                              onChange={(e) => {
                                setUpiType('id');
                                setClaimFormData(prev => ({ ...prev, upiNumber: '' })); // Clear UPI Number when switching
                              }}
                            />
                            <label className="form-check-label" htmlFor="upiTypeId">
                              UPI ID
                            </label>
                          </div>
                        </div>
                        {upiType === 'number' ? (
                          <div className="form-group mb-3">
                            <label>UPI Number <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              name="upiNumber"
                              value={claimFormData.upiNumber}
                              onChange={handleClaimInputChange}
                              placeholder="Enter UPI Number (e.g., 9876543210)"
                              required
                            />
                          </div>
                        ) : (
                          <div className="form-group mb-3">
                            <label>UPI ID <span className="text-danger">*</span></label>
                            <input
                              type="text"
                              className="form-control"
                              name="upiId"
                              value={claimFormData.upiId}
                              onChange={handleClaimInputChange}
                              placeholder="Enter UPI ID (e.g., name@paytm)"
                              required
                            />
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {(selectedReward.rewardType === 'gift' || selectedReward.rewardType === 'trophy') && (
                    <div className="form-group mb-3">
                      <label>Delivery Address <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        name="address"
                        value={claimFormData.address}
                        onChange={handleClaimInputChange}
                        placeholder="Enter complete delivery address"
                        rows="3"
                        required
                      />
                    </div>
                  )}

                  {selectedReward.rewardType === 'other' && (
                    <div className="form-group mb-3">
                      <label>Address <span className="text-danger">*</span></label>
                      <textarea
                        className="form-control"
                        name="address"
                        value={claimFormData.address}
                        onChange={handleClaimInputChange}
                        placeholder="Enter your complete address"
                        rows="3"
                        required
                      />
                    </div>
                  )}

                  {selectedReward.rewardType === 'voucher' && (
                    <>
                      <div className="form-group mb-3">
                        <label>Email ID <span className="text-danger">*</span></label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={claimFormData.email}
                          onChange={handleClaimInputChange}
                          placeholder="Enter your email address (e.g., user@example.com)"
                          required
                        />
                        <small className="form-text text-muted">
                          For digital voucher, please provide your email ID
                        </small>
                      </div>
                    </>
                  )}

                  {/* Dynamic Documents */}
                  {selectedReward.requiredDocuments && selectedReward.requiredDocuments.length > 0 && (
                    <div className="mb-3">
                      <label className="font-weight-bold mb-2">Required Documents</label>
                      <small className="d-block mb-2 text-muted">
                        Supported: JPG, PNG, GIF, PDF, DOC, DOCX | Max size: 10MB
                      </small>
                      {selectedReward.requiredDocuments.map((doc, idx) => (
                        <div key={idx} className="form-group mb-3">
                          <label className="mb-1">
                            {doc.name}
                            {doc.mandatory && <span className="text-danger"> *</span>}
                          </label>
                          {claimFormData.documents[doc.name] ? (
                            <div className="d-flex align-items-center">
                              <a
                                href={`${bucketUrl}/${claimFormData.documents[doc.name].documentKey}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="mr-2 text-primary"
                                style={{ textDecoration: 'underline' }}
                              >
                                <i className="fas fa-file-alt mr-1"></i>
                                View Uploaded Document
                              </a>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger ml-2"
                                onClick={() => {
                                  const newDocs = { ...claimFormData.documents };
                                  delete newDocs[doc.name];
                                  setClaimFormData(prev => ({ ...prev, documents: newDocs }));
                                }}
                              >
                                <i className="fas fa-times mr-1"></i>
                                Remove
                              </button>
                            </div>
                          ) : (
                            <>
                              <input
                                type="file"
                                className="form-control"
                                accept=".jpg,.jpeg,.png,.gif,.pdf,.doc,.docx"
                                onChange={(e) => handleDocumentUpload(e, doc.name)}
                                required={doc.mandatory}
                                disabled={uploadingDocs[doc.name]}
                              />
                              {uploadingDocs[doc.name] && (
                                <small className="text-info mt-1 d-block">
                                  <i className="fas fa-spinner fa-spin mr-1"></i>
                                  Uploading...
                                </small>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Feedback Field */}
                  {selectedReward.requiresFeedback && (
                    <div className="form-group mb-3">
                      <label>
                        {selectedReward.feedbackLabel || 'Feedback'} <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="feedback"
                        value={claimFormData.feedback}
                        onChange={handleClaimInputChange}
                        placeholder="Enter your feedback"
                        rows="4"
                        required
                      />
                    </div>
                  )}

                  {claimError && (
                    <div className="alert alert-danger claim-modal__error" role="alert">
                      {claimError}
                    </div>
                  )}

                  <div className="modal-footer claim-modal__footer">
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={closeClaimModal}
                      disabled={claimLoading}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary waves-effect waves-light"
                      disabled={claimLoading}
                    >
                      {claimLoading ? 'Submitting...' : 'Submit Claim'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
        </>
      )}

      <style>
        {
          `

                      .btn-danger {
    border-color: #e42728 !important;
    background-color: #ea5455 !important;
    color: #fff !important;
}
.btn-danger:hover {
    border-color: #e73d3e !important;
    color: #fff !important;
    box-shadow: 0 8px 25px -8px #ea5455;
}
.btn-success:hover {
    border-color: #24b263 !important;
    color: #fff !important;
    box-shadow: 0 8px 25px -8px #28c76f;
}
.tab_head {
    background-color: #b8caf0;
    font-size: 17px;
    color: black;
}
.btn-prp {
    background-color: darkblue;
    color: #fff;
}
.kyc-txt {
    font-size: 12px;
}
    .btn-block {
  display: block;
  width: 100%;
}
.btn-prp{
transition: 1s ease}

  .btn-prp:hover{
  background-color:transparent;
   border:1px solid darkblue;
   color:;
  }

  /* Claim Reward modal (Candidate) */
  .claim-modal { border-radius: 16px; overflow: hidden; border: 1px solid rgba(15,23,42,.10); box-shadow: 0 28px 70px rgba(15,23,42,.28); }
  .claim-modal__backdrop { background: rgba(2, 6, 23, .55) !important; }
  .claim-modal__header { background: #FC2B5A; color: #fff; border-bottom: none; padding: 16px 18px; display:flex; align-items:flex-start; gap: 12px; }
  .claim-modal__header > div { min-width: 0; }
  .claim-modal__kicker { font-size: 12px; font-weight: 800; letter-spacing: .06em; text-transform: uppercase; opacity: .9; }
  .claim-modal__title { margin: 2px 0 0; font-weight: 800; color: #fff; }
  .claim-modal__close {
    appearance: none;
    border: 0;
    background: rgba(255,255,255,.22);
    color: #fff;
    width: 36px;
    height: 36px;
    border-radius: 12px;
    font-size: 20px;
    line-height: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    margin-left: auto;
  }
  .claim-modal__close:hover { background: rgba(255,255,255,.32); }
  .claim-modal__body { padding: 18px 18px 6px; }
  .claim-modal__footer { border-top: 1px solid rgba(148,163,184,.35); padding: 12px 18px; background: #f8fafc; display:flex; gap: 10px; justify-content:flex-end; }
  .claim-modal__error { border-radius: 12px; border: 1px solid rgba(239,68,68,.25); }
  .claim-modal .form-control { border-radius: 12px; }
  .claim-modal label { font-weight: 700; }
  .claim-modal .btn { border-radius: 12px; font-weight: 800; }

                      `
        }
      </style>

      <style>
        {
          `
          html body .content .content-wrapper {
    padding: calc(2.2rem - 0.4rem) 2.2rem 0;
    margin-top: 6rem;
}
.breadcrumb-item a {
    color: #FC2B5A;
}
.card-body a {
    color: #FC2B5A;
}
.btn-orrage {
    background-color: #df4805 !important;
    color: #fff!important;
}
.btn.disabled, .btn:disabled {
    opacity: 0.65;
}
.now-padding {
    padding-top: 8px;
}
.extra-wallet {
    font-weight: 550;
}
.candid-box {
    color: #FC2B5A;
    font-weight: 600;
}
.cashout-p{
    font-size: 14px!important;
    margin-bottom: 14px!important;
}
#requestLoan-section .col-xl-12{
    padding: 20px;
}
@media (max-width: 1920px) {
    .candid-box {
        font-size: 21px;
    }
}
@media (max-width: 1400px) {
    .candid-box {
        font-size: 13px;
    }
}
@media (max-width: 1200px) {
    .candid-box {
        font-size: 13px;
    }
}
@media (max-width: 992px) {
    .candid-box {
        font-size: 14px;
    }
}

@media only screen and (max-width: 972px) {
    .mipie-earn {
        width: 38% ;
    }
    .font-stick {
        font-weight: 550 !important;
        line-height: 1.9;
    }
}
@media only screen and (max-width: 847px) {
    .mipie-earn {
        width: 45%;
    }
}
@media(max-width:768px){
    html body .content .content-wrapper {
    padding-block:30px;
    padding-inline:20px;
    }
    .mipie-earn{
        width: 90%;
    }
    .candid-box {
        font-size: 19px;
    }
    /* .card{
        width: 100%!important;
    } */
}
@media only screen and (max-width: 576px) {
    .mipie-earn {
        width: 72% ;
    }
    .font-stick {
        font-weight: 500 !important;
        line-height: 1.9;
        font-size: 14px;
    }
}
@media only screen and (max-width: 451px) {
    .mipie-earn {
        width: 90% ;
    }
    .font-stick {
        font-weight: 500 !important;
        line-height: 1.9;
    }
}
.breadcrumb-item a {
    color: #FC2B5A;
        }

          `
        }        
      </style>

    </>
  );
};

export default CandidateEarning;