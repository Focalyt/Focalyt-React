import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Modal } from 'react-bootstrap';


const CoinsPage = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY;
  
  // Helper function to convert MongoDB Decimal128 to number/string
  const convertDecimal128 = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') return parseFloat(value) || 0;
    if (typeof value === 'object' && value.$numberDecimal) {
      return parseFloat(value.$numberDecimal) || 0;
    }
    return 0;
  };
  
  // State variables
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState({});
  const [coinOffers, setCoinOffers] = useState([]);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(1);
  const [showModal, setShowModal] = useState(false);
  
  // Modal and payment state
  const [voucherCode, setVoucherCode] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [paymentInfo, setPaymentInfo] = useState({
    offerId: '',
    amount: '',
    offerAmount: '',
    paymentVoucher: ''
  });

  // Fetch data on component mount
  useEffect(() => {
    loadCoinsData();
    
    // Load Razorpay script
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [page]);

  const loadCoinsData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.error('No token found in localStorage');
        setLoading(false);
        return;
      }

      if (!backendUrl) {
        console.error('Backend URL not configured');
        setLoading(false);
        return;
      }
      
      // Get current URL search params to extract page number if needed
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      setPage(currentPage);

      const apiUrl = `${backendUrl}/candidate/Coins?page=${currentPage}`;
      console.log('Making API call to:', apiUrl);
      console.log('Token:', token ? 'Token exists' : 'No token');

      // Make API call to get coins data
      const response = await axios.get(apiUrl, {
        headers: {
          'x-auth': token,
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response:', response.data);

      const data = response.data;
      
      // Process Decimal128 values in the data
      const processData = (rawData) => {
        if (!rawData) return rawData;
        
        // Process candidate
        const processedCandidate = rawData.candidate ? {
          ...rawData.candidate,
          creditLeft: convertDecimal128(rawData.candidate.creditLeft)
        } : {};
        
        // Process coin offers
        const processedCoinOffers = (rawData.coinOffers || []).map(offer => ({
          ...offer,
          getCoins: convertDecimal128(offer.getCoins),
          payAmount: convertDecimal128(offer.payAmount)
        }));
        
        // Process transactions
        const processedTransactions = (rawData.latestTransactions || []).map(transaction => ({
          ...transaction,
          amount: convertDecimal128(transaction.amount)
        }));
        
        return {
          ...rawData,
          candidate: processedCandidate,
          coinOffers: processedCoinOffers,
          latestTransactions: processedTransactions
        };
      };
      
      const processedData = processData(data);
      
      if (processedData && processedData.status === true) {
        console.log('Coin Offers received:', processedData.coinOffers?.length || 0);
        setCandidate(processedData.candidate || {});
        setCoinOffers(processedData.coinOffers || []);
        setLatestTransactions(processedData.latestTransactions || []);
        setTotalPages(processedData.totalPages || 0);
      } else if (processedData && processedData.status === false) {
        console.error('API Error:', processedData.error || processedData.message);
        // Set empty arrays on error
        setCandidate({});
        setCoinOffers([]);
        setLatestTransactions([]);
        setTotalPages(0);
      } else {
        // Fallback for old response format
        console.log('Using fallback response format');
        setCandidate(processedData?.candidate || {});
        setCoinOffers(processedData?.coinOffers || []);
        setLatestTransactions(processedData?.latestTransactions || []);
        setTotalPages(processedData?.totalPages || 0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coins data:', error);
      console.error('Error message:', error.message);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Error config:', error.config?.url);
      
      // Set empty state on error
      setCandidate({});
      setCoinOffers([]);
      setLatestTransactions([]);
      setTotalPages(0);
      setLoading(false);
    }
  };

  const setValues = (offerId, amount) => {
    const convertedAmount = convertDecimal128(amount);
    setPaymentInfo({
      ...paymentInfo,
      offerId,
      amount: convertedAmount,
      offerAmount: convertedAmount,
      paymentVoucher: ''
    });
    setVoucherCode('');
    setSuccessMsg('');
    setErrorMsg('');
    setShowModal(true);
  };

  const handleVoucherChange = (e) => {
    const val = e.target.value;
    setVoucherCode(val.toUpperCase());
  };

  const checkVouchers = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyVouchers(e);
    }
  };

  const applyVoucher = async () => {
    try {
      if (!voucherCode.trim()) return;
      
      const data = {
        amount: paymentInfo.offerAmount,
        code: voucherCode,
        offerId: paymentInfo.offerId
      };

      const token = localStorage.getItem('token');
      const res = await axios.put(`${backendUrl}/candidate/applyVoucher`, data, {
        headers: { 'x-auth': token }
      });

      const responseAmount = convertDecimal128(res.data.amount);
      if (res.data.status === true && responseAmount > 0) {
        setErrorMsg('');
        setSuccessMsg(res.data.message);
        setPaymentInfo({
          ...paymentInfo,
          amount: responseAmount,
          paymentVoucher: voucherCode
        });
        return { success: true, shouldPay: true, amount: responseAmount };
      } else if (res.data.status && responseAmount === 0) {
        setErrorMsg('');
        setSuccessMsg(res.data.message);
        setPaymentInfo({
          ...paymentInfo,
          amount: responseAmount
        });
        window.location.reload();
        return { success: true, shouldPay: false };
      } else {
        setSuccessMsg('');
        setErrorMsg(res.data.message);
        setVoucherCode('');
        const offerAmount = convertDecimal128(paymentInfo.offerAmount);
        setPaymentInfo({
          ...paymentInfo,
          amount: offerAmount
        });
        return { success: false };
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error applying voucher');
      return { success: false };
    }
  };

  const initiatePayment = async (e) => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        offerId: paymentInfo.offerId,
        amount: paymentInfo.amount
      };

      const res = await axios.post(`${backendUrl}/candidate/payment`, data, {
        headers: { 'x-auth': token }
      });

      const options = {
        key: razorpayKey,
        amount: res.data.order.amount,
        currency: res.data.order.currency,
        name: "MiPie",
        description: "",
        image: "/Assets/images/logo/logo.png",
        order_id: res.data.order.id,
        handler: function (response) {
          const paymentData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            _candidate: res.data.candidate._id,
            _offer: paymentInfo.offerId,
            amount: paymentInfo.amount,
            voucher: paymentInfo.paymentVoucher
          };

          axios.post(`${backendUrl}/candidate/paymentStatus`, paymentData, {
            headers: { 'x-auth': token }
          })
            .then(() => {
              window.location.reload();
            })
            .catch((error) => {
              console.error(error.message);
            });
        },
        prefill: {
          name: res.data.candidate.name,
          email: res.data.candidate.email,
          contact: res.data.candidate.mobile
        },
        theme: {
          color: "#FC2B5A"
        }
      };

      const rzp1 = new window.Razorpay(options);
      rzp1.open();
      setShowModal(false);
      e.preventDefault();
    } catch (err) {
      console.error('Payment initialization error:', err.message);
    }
  };

  const applyVouchers = async (e) => {
    if (voucherCode.trim() === '') {
      return initiatePayment(e);
    }
    const result = await applyVoucher();
    if (result && result.success && result.shouldPay) {
      // After successful voucher application, trigger payment
      return initiatePayment(e);
    }
  };

  const generatePageLink = (pageNum) => {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?page=${pageNum}`;
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

    // First page link if not already in range
    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <a className="pageAnchor page-link" href={generatePageLink(1)}>First</a>
        </li>
      );
    }

    // Page number links
    for (let i = first; i <= last; i++) {
      if (i === page) {
        pages.push(
          <li key={i} className="active page-item">
            <a href="javascript:void(0)" className="page-link pagi_custom">
              {i}
            </a>
          </li>
        );
      } else {
        pages.push(
          <li key={i} className="page-item">
            <a className="page-link pageAnchor pagi_customtwo" href={generatePageLink(i)}>
              {i}
            </a>
          </li>
        );
      }
    }

    // Last page link if not already in range
    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <a className="pageAnchor page-link" href={generatePageLink(last + 1)}>...</a>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <a className="pageAnchor page-link" href={generatePageLink(totalPages)}>Last</a>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2 text-right mr-1">
        {pages}
      </ul>
    );
  };

  if (loading) {
    return <div className="d-flex justify-content-center mt-5"><h3>Loading...</h3></div>;
  }

  return (
    <>
        <div className="content-header row">
          <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-sm-0 mb-0 candidate-card">
            <div className="card">
              <div className="col-xl-12 p-3">
                <div className="row">
                  <div className="col-xl-12 my-auto">
                    <h4 className="card-title mb-0">
                      <strong>COINS : {convertDecimal128(candidate.creditLeft)} </strong>
                    </h4>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-body">
          {/* Coins Section Starts */}
          <section id="company_dashboard">
            <div className="row">
              {coinOffers.length > 0 && coinOffers.map((offer, i) => (
                <div key={offer._id} className="col-xl-3 col-lg-3 col-md-6 col-sm-12 col-12 mb-xl-2 mb-lg-2 mb-md-2 mb-sm-2 mb-2">
                  <div className={`col-xl-12 Company_card py-1 ${i % 4 === 0 ? 'one' : i % 4 === 1 ? 'two' : i % 4 === 2 ? 'three' : 'four'}`}>
                    <div className="row">
                      <div className="col-xl-4 col-lg-4 col-md-4 col-sm-6 col-6 text-center px-0">
                        <img src="/Assets/images/icons/credits.png" className="img-fluid" alt="Coins" style={{width:'111px'}} />
                      </div>
                      <div className="col-xl-8 col-lg-8 col-md-8 col-sm-6 col-6">
                        <h2 className="text-white">{offer.getCoins ? convertDecimal128(offer.getCoins) : "NA"} Coins</h2>
                        <p className="text-white font-weight-bold" style={{marginBottom :'1rem', lineHeight: '1.5rem', fontSize:'0.8rem'}}>For ₹{offer.payAmount ? convertDecimal128(offer.payAmount) : "NA"}</p>
                        <a
                          className="btn btn-outline-cs waves-effect waves-light"
                          href="#"
                          id="pay-button"
                          onClick={() => setValues(offer._id, convertDecimal128(offer.payAmount))}
                        >
                          Pay Now
                          <i className="fa fa-chevron-right text-white fa-view" aria-hidden="true"></i>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
          <section>
            {/* END */}
            <div className="row">
              <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-sm-0 mb-0 candidate-card">
                <div className="card mb-3">
                  <div className="col-xl-12 p-3">
                    <div className="row">
                      <div className="col-xl-12 my-auto">
                        <h4 className="card-title mb-0 px-3">Latest Transactions / नवीनतम लेनदेन</h4>
                      </div>
                    </div>
                  </div>
                  <div className="card-content">
                    <div className="table-responsive">
                      <table className="table table-hover-animation mb-0 table-hover">
                        <thead>
                          <tr>
                            <th>Date & Time</th>
                            <th>Offer Name</th>
                            <th>Amount Paid</th>
                          </tr>
                        </thead>
                        <tbody id="table-body">
                          {latestTransactions.length > 0 ? (
                            latestTransactions.map((transaction, index) => (
                              <tr key={index}>
                                <td>
                                  {moment(transaction.createdAt).utcOffset("+05:30").format('MMM DD YYYY hh:mm A')}
                                </td>
                                <td>{transaction._offer ? transaction._offer.displayOffer : "NA"}</td>
                                <td>{transaction.amount ? convertDecimal128(transaction.amount) : "NA"}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="text-center">No Result Found</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                      {renderPagination()}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      

      {/* Payment Modal - Using React Bootstrap Modal */}
      <Modal 
        show={showModal} 
        onHide={() => {
          setShowModal(false);
          setVoucherCode('');
          setSuccessMsg('');
          setErrorMsg('');
        }} 
        centered
      >
        <Modal.Header className="vchr_header">
          <Modal.Title className="text-white text-uppercase">Buy Coins / सिक्के खरीदें</Modal.Title>
          <button type="button" className="close color-purple" onClick={() => setShowModal(false)}>
            <span aria-hidden="true">×</span>
          </button>
        </Modal.Header>
        <Modal.Body className="mode-dice p-0">
          <form className="my-3">
            <h3 className="coupon-text">
              If you have <strong>Coupon Code </strong>, apply here / यदि आपके पास <strong>कूपन कोड </strong>है, तो यहां आवेदन करें।
            </h3>
            <input
              type="text"
              name="voucherField"
              className="text-white mt-1"
              placeholder="Enter Code / कोड दर्ज करें"
              id="voucher"
              value={voucherCode}
              onChange={handleVoucherChange}
              onKeyPress={checkVouchers}
              style={{
                textAlign: 'center',
                color: '#233985 !important',
                borderBottom: '2px dashed #233985',
                fontStyle: 'italic',
                fontSize: '17px',
                fontWeight: '600',
                borderTop: 'none',
                borderRight: 'none',
                borderLeft: 'none',
                backgroundColor: 'transparent',
                padding: '10px'
              }}
            />
            <button
              type="button"
              className={`voucher-btn btn btn-sm ml-1 voucherapply ${!voucherCode.trim() ? 'disabled' : ''}`}
              aria-label="Apply"
              id="add"
              disabled={!voucherCode.trim()}
              onClick={applyVoucher} 
            >
              <span aria-hidden="true" className="yes-cross" id="applyVoucher">
                Apply
              </span>
            </button>
          </form>
          
          {successMsg && (
            <p className="text-success font-weight-bolder font-italic" id="successMsg" style={{ display: 'block' }}>
              {successMsg}
            </p>
          )}
          
          {errorMsg && (
            <p className="text-danger font-weight-bolder font-italic" id="errorMsg" style={{ display: 'block' }}>
              {errorMsg}
            </p>
          )}
        </Modal.Body>
        <Modal.Footer className="text-center">
          <button
            className="btn button-vchr shadow"
            role="button"
            onClick={applyVouchers}
            id="apply"
          >
            Pay / भुगतान करें ₹{convertDecimal128(paymentInfo.amount || paymentInfo.offerAmount || 0)}
          </button>
        </Modal.Footer>
      </Modal>
      
      <div className="sidenav-overlay"></div>
      <div className="drag-target"></div>

      <style>
        {`
          .card-content {
            padding: 0px 20px;
            gap: 20px;
          }
          .breadcrumb-item a {
            color: #FC2B5A;
          }
          .card {
            margin-bottom: 1.2rem !important;
          }
          .card .card-title {
            font-size: 1rem !important;
          }
          .pb-1, .py-1 {
            padding-bottom: 1rem !important;
          }
          .pt-1, .py-1 {
            padding-top: 1rem !important;
            padding-right: 1rem !important;
            padding-left: 1rem !important;
          }
          .px-1 {
            padding-right: 1rem !important;
            padding-left: 1rem !important;
          }
          .mb-auto, .my-auto {
            margin-bottom: auto !important;
          }
          .table-hover-animation thead th {
            border-top: 2px solid #f8f8f8;
            border-bottom: 0;
            background-color: #fff;
          }
          .table thead th {
            vertical-align: top;
          }
          .table th {
            font-size: 12px !important;
            text-transform: uppercase;
          }
          .table tr td {
            font-size: 12.5px !important;
          }
          .table-hover-animation th, .table-hover-animation td {
            border: 0;
          }
          .table tr {
            border-top: .05rem solid #bdb4b4;
          }
          .vchr_header {
            background: rgb(30, 57, 137);
            background: linear-gradient(117deg, rgba(30, 57, 137, 1) 0%, rgba(52, 85, 181, 1) 50%, rgba(143, 61, 73, 1) 100%);
            color: #fff;
          }
          .mode-dice {
            border-bottom: dashed 2px #233985;
            text-align:center;
            // background: rgb(30, 57, 137);
            // background: linear-gradient(117deg, rgba(30, 57, 137, 1) 0%, rgba(52, 85, 181, 1) 50%, rgba(143, 61, 73, 1) 100%);
          }
          .coupon-text {
            color: rgb(92, 92, 92);
            padding: 15px;
            font-size:17px;
            text-align: center;
          }
          .voucher-btn {
            background-color: #28a745;
            color: #fff;
            border: none;
          }
          .voucher-btn.disabled {
            background-color: #888;
            cursor: not-allowed;
            opacity: 0.6;
          }
          .btn.button-vchr {
            background: #233985 !important;
            color: #fff;
            letter-spacing: 1px;
            text-transform: uppercase;
            font-size: 15px;
            transition: .3s;
          }
          .btn.button-vchr:hover {
            box-shadow: 10px 10px 5px 0px rgba(35, 57, 133, 0.75) !important;
            transition: .3s;
          }
          input#voucher::placeholder {
            color: #233985;
            opacity: 1;
          }
            input#voucher {
    text-align: center;
    color: #233985 !important;
    border-bottom: 2px dashed #233985;
    font-style: italic;
    font-size: 17px;
    font-weight: 600;
}
          .modal-footer {
            border-top: none;
            justify-content: center;
          }
          button.close.color-purple span {
            color: #233985 !important;
          }
          .pagination .page-item.active .page-link {
            color: #fff !important;
            background-color: #FC2B5A !important;
          }
           .Company_card.one {
    background: url(../Assets/images/bg/card_one.jpg);
    background-repeat: no-repeat;
    background-position: center center;
    background-size: cover;
}
    .Company_card {
    border-radius: 8px;
    filter: drop-shadow(3px 5.196px 2.5px rgba(0, 0, 0, 0.24));
}
    a.btn.btn-outline-cs {
    border-radius: 14px;
    background-color: rgba(246, 246, 246, 0);
    border: 1px solid #f6f6f6;
    color: #fff;
    padding: 5px 26px;
    transition: .3s;
    font-size:0.8rem;
}
    h2, .h2 {
    font-size: 1rem;
}
    .voucherapply{
    width:55px!important;
    color:#fff!important;
    }
//     @media(max-width:992px){
//     .btn {
//     padding: 0.9rem 1rem;
// }   }
       
       `}
      </style>
    </>
  );
};

export default CoinsPage;