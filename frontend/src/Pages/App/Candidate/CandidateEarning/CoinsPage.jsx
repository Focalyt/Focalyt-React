import React, { useState, useEffect } from 'react';
import axios from 'axios';
import moment from 'moment';
import { Modal } from 'react-bootstrap';
// Import your components if needed
// import Navbar from './partials/Navbar';
// import Leftpane from './partials/Leftpane';
// import Flash from '../../partials/Flash';

const CoinsPage = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_RAZORPAY_KEY;
  
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
      
      // Get current URL search params to extract page number if needed
      const urlParams = new URLSearchParams(window.location.search);
      const pageParam = urlParams.get('page');
      const currentPage = pageParam ? parseInt(pageParam) : 1;
      
      setPage(currentPage);

      // Make API call to get coins data
      const response = await axios.get(`${backendUrl}/candidate/coins?page=${currentPage}`, {
        headers: {
          'x-auth': token
        }
      });

      const data = response.data;
      
      if (data) {
        setCandidate(data.candidate || {});
        setCoinOffers(data.coinOffers || []);
        setLatestTransactions(data.latestTransactions || []);
        setTotalPages(data.totalPages || 0);
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching coins data:', error);
      setLoading(false);
    }
  };

  const setValues = (offerId, amount) => {
    setPaymentInfo({
      ...paymentInfo,
      offerId,
      amount,
      offerAmount: amount
    });
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

      if (res.data.status === true && res.data.amount > 0) {
        setErrorMsg('');
        setSuccessMsg(res.data.message);
        setPaymentInfo({
          ...paymentInfo,
          amount: res.data.amount,
          paymentVoucher: voucherCode
        });
      } else if (res.data.status && res.data.amount === 0) {
        setErrorMsg('');
        setSuccessMsg(res.data.message);
        setPaymentInfo({
          ...paymentInfo,
          amount: res.data.amount
        });
        window.location.reload();
      } else {
        setSuccessMsg('');
        setErrorMsg(res.data.message);
        setVoucherCode('');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error applying voucher');
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
        image: "/images/logo/logo.png",
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
      e.preventDefault();
    } catch (err) {
      console.error('Payment initialization error:', err.message);
    }
  };

  const applyVouchers = (e) => {
    if (voucherCode.trim() === '') {
      return initiatePayment(e);
    }
    applyVoucher();
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
                      <strong>COINS : {candidate.creditLeft || 0} </strong>
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
                        <img src="/images/icons/credits.png" className="img-fluid" alt="Coins" />
                      </div>
                      <div className="col-xl-8 col-lg-8 col-md-8 col-sm-6 col-6">
                        <h2 className="text-white">{offer.getCoins ? offer.getCoins : "NA"} Coins</h2>
                        <p className="text-white font-weight-bold">For ₹{offer.payAmount ? offer.payAmount : "NA"}</p>
                        <a
                          className="btn btn-outline-cs waves-effect waves-light"
                          href="#"
                          id="pay-button"
                          onClick={() => setValues(offer._id, offer.payAmount)}
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
                                <td>{transaction.amount ? transaction.amount : "NA"}</td>
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
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
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
            />
            <button
              type="button"
              className={`voucher-btn btn btn-sm ml-1 ${!voucherCode.trim() ? 'disabled' : ''}`}
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
            <p className="text-success font-weight-bolder font-italic" id="successMsg">
              {successMsg}
            </p>
          )}
          
          {errorMsg && (
            <p className="text-danger font-weight-bolder font-italic" id="errorMsg">
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
            Pay / भुगतान करें ₹{paymentInfo.amount || ''}
          </button>
        </Modal.Footer>
      </Modal>
      
      <div className="sidenav-overlay"></div>
      <div className="drag-target"></div>
    </>
  );
};

export default CoinsPage;