import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import "./CandidateEarning.css"


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
  const backendUrl = process.env.REACT_APP_BASE_URL;
  const [modalInstance, setModalInstance] = useState(null);

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

      axios.post('/api/uploadSingleFile', formDataObj, {
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
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">
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
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title text-white text-uppercase" id="exampleModalLongTitle">
                Upload KYC Document
              </h5>
              <button type="button" className="close" data-dismiss="modal" aria-label="Close">
                <span aria-hidden="true">×</span>
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
                  <button type="button" className="btn btn-outline-light waves-effect waves-danger" data-dismiss="modal">
                    <i className="feather icon-x d-block d-lg-none"></i>
                    <span className="d-none d-lg-block">Cancel</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

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
                      `
        }
      </style>

    </>
  );
};

export default CandidateEarning;