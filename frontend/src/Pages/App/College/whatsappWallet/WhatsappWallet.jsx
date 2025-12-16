import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import moment from 'moment';

function WhatsappWallet() {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY || process.env.REACT_APP_RAZORPAY_KEY;

  const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
  const token = userData.token;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [whatsappBalance, setWhatsappBalance] = useState(0);
  const [rechargePlans, setRechargePlans] = useState([]);
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [paymentData, setPaymentData] = useState({
    planId: '',
    amount: '',
    planAmount: '',
    messages: 0
  });
  const [voucher, setVoucher] = useState('');
  const [voucherMessage, setVoucherMessage] = useState({ success: '', error: '' });
  
  // Quick recharge amounts
  const quickAmounts = [100, 250, 500, 1000, 2000, 5000];

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Load data on component mount
  useEffect(() => {
    loadWhatsappData();
  }, [currentPage]);

  // Load WhatsApp recharge data
  const loadWhatsappData = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await axios.get(`${backendUrl}/college/whatsapp/recharge-data?page=${currentPage}`, {
        headers: { 'x-auth': token }
      });

      if (response.data.status) {
        setWhatsappBalance(response.data.balance || 0);
        setRechargePlans(response.data.rechargePlans || []);
        setLatestTransactions(response.data.latestTransactions || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        setError(response.data.message || 'Failed to load WhatsApp recharge data');
      }
    } catch (error) {
      console.error('Error loading WhatsApp recharge data:', error);
      setError('Error loading data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Format date and time
  const formatDateTime = (dateString) => {
    if (!dateString) return 'NA';
    return moment(dateString).utcOffset("+05:30").format('MMM DD YYYY hh:mm A');
  };

  // Handle Pay Now button click
  const handlePayNow = (planId, amount, messages) => {
    setPaymentData({
      planId,
      amount,
      planAmount: amount,
      messages
    });
    setVoucher('');
    setVoucherMessage({ success: '', error: '' });
    setShowVoucherModal(true);
  };

  // Handle Quick Amount Selection
  const handleQuickAmount = (amount) => {
    setCustomAmount(amount.toString());
  };

  // Handle Custom Amount Payment
  const handleCustomAmountPayment = () => {
    const amount = parseFloat(customAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }
    if (amount < 10) {
      toast.error('Minimum recharge amount is ₹10');
      return;
    }

    // Calculate messages based on amount (assuming 1 message = 1 rupee, adjust as needed)
    const messages = Math.floor(amount);
    
    setPaymentData({
      planId: null, // Custom recharge doesn't have planId
      amount: amount,
      planAmount: amount,
      messages: messages
    });
    
    setVoucher('');
    setVoucherMessage({ success: '', error: '' });
    setShowVoucherModal(true);
  };

  // Handle voucher input change
  const handleVoucherChange = (value) => {
    setVoucher(value.toUpperCase());
  };

  // Apply voucher code
  const applyVoucher = async () => {
    if (!voucher.trim()) return;

    try {
      const data = {
        amount: paymentData.planAmount,
        code: voucher
      };

      // Only include planId if it exists
      if (paymentData.planId) {
        data.planId = paymentData.planId;
      }

      const response = await axios.put(`${backendUrl}/college/whatsapp/checkvoucher`, data, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (result.status && result.amount > 0) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
      } else if (result.status && result.amount === 0) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
        // If amount is 0, reload the page
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setVoucherMessage({ success: '', error: result.message });
        setVoucher('');
        setPaymentData(prev => ({ ...prev, amount: prev.planAmount }));
      }
    } catch (error) {
      console.error('Error applying voucher:', error);
      setVoucherMessage({ 
        success: '', 
        error: error.response?.data?.message || 'Error applying voucher' 
      });
    }
  };

  // Initiate payment with Razorpay
  const makePayment = async () => {
    try {
      const data = {
        amount: paymentData.amount
      };

      // Only include planId if it exists (for plan-based recharge)
      if (paymentData.planId) {
        data.planId = paymentData.planId;
      }

      const response = await axios.post(`${backendUrl}/college/whatsapp/recharge`, data, {
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        }
      });

      const result = response.data;

      if (!result.status) {
        toast.error(result.message || 'Payment initialization failed');
        return;
      }

      const options = {
        key: razorpayKey,
        amount: result.order.amount,
        currency: result.order.currency,
        name: "MiPie",
        description: paymentData.planId 
          ? `WhatsApp Recharge - ${paymentData.messages} messages`
          : `WhatsApp Custom Recharge - ₹${paymentData.amount}`,
        image: "/images/logo/logo.png",
        order_id: result.order.id,
        handler: async (response) => {
          const paymentStatusData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            _college: result.college._id,
            amount: paymentData.amount,
            code: voucher
          };

          // Only include _plan if planId exists
          if (paymentData.planId) {
            paymentStatusData._plan = paymentData.planId;
          }

          try {
            await axios.post(`${backendUrl}/college/whatsapp/recharge-status`, paymentStatusData, {
              headers: {
                'x-auth': token,
                'Content-Type': 'application/json'
              }
            });

            toast.success('Recharge successful!');
            setShowVoucherModal(false);
            window.location.reload();
          } catch (error) {
            console.error('Payment status update failed:', error);
            toast.error('Payment successful but status update failed');
          }
        },
        prefill: {
          name: result.college.name,
          email: result.college.email,
          contact: result.college.mobile || result.college.phone
        },
        theme: {
          color: "#FC2B5A"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error making payment:', error);
      toast.error(error.response?.data?.message || 'Payment initialization failed');
      setVoucherMessage({ success: '', error: 'Payment initialization failed' });
    }
  };

  // Handle payment button click
  const handlePayment = () => {
    if (!voucher.trim()) {
      makePayment();
    } else {
      applyVoucher().then(() => {
        if (voucherMessage.success && !voucherMessage.error) {
          setTimeout(() => {
            makePayment();
          }, 500);
        }
      });
    }
  };

  // Generate page link for pagination
  const generatePageLink = (pageNum) => {
    const { origin, pathname } = window.location;
    return `${origin}${pathname}?page=${pageNum}`;
  };

  // Render pagination
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    let first = 1;
    let last = totalPages > 4 ? 4 : totalPages;

    if (totalPages > 4 && currentPage >= 2) {
      first = currentPage - 1;
      last = currentPage + 1;
      if (last > totalPages) last = totalPages;
    }

    const pages = [];

    if (first > 1) {
      pages.push(
        <li key="first" className="page-item">
          <a className="page-link" href={generatePageLink(1)}>First</a>
        </li>
      );
    }

    for (let i = first; i <= last; i++) {
      if (i === currentPage) {
        pages.push(
          <li key={i} className="page-item active">
            <a href="javascript:void(0)" className="page-link">
              {i}
            </a>
          </li>
        );
      } else {
        pages.push(
          <li key={i} className="page-item">
            <a className="page-link" href={generatePageLink(i)}>
              {i}
            </a>
          </li>
        );
      }
    }

    if (totalPages > last) {
      pages.push(
        <li key="ellipsis" className="page-item">
          <a className="page-link" href={generatePageLink(last + 1)}>...</a>
        </li>
      );
      pages.push(
        <li key="last" className="page-item">
          <a className="page-link" href={generatePageLink(totalPages)}>Last</a>
        </li>
      );
    }

    return (
      <ul className="pagination justify-content-end ml-2 mb-2 text-right mr-1">
        {pages}
      </ul>
    );
  };

  // Voucher Modal Component
  const VoucherModal = () => {
    if (!showVoucherModal) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-header" >
              <h5 className="modal-title text-white text-uppercase">WhatsApp Recharge</h5>
              <button 
                type="button" 
                className="close text-white" 
                onClick={() => {
                  setShowVoucherModal(false);
                  setCustomAmount('');
                  setVoucher('');
                  setVoucherMessage({ success: '', error: '' });
                }}
              >
                <span>&times;</span>
              </button>
            </div>
            
            <div className="modal-body p-0" style={{ backgroundColor: '#f8f9fa' }}>
              <div className="my-3 px-3">
                <h3 className="coupon-text">
                  If you have <strong>Coupon Code</strong>, apply here
                </h3>
                <div className="d-flex">
                  <input 
                    type="text" 
                    className="form-control text-dark mt-1 voucher-input" 
                    placeholder="Enter Code" 
                    value={voucher}
                    onChange={(e) => handleVoucherChange(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handlePayment();
                      }
                    }}
                  />
                  <button 
                    type="button" 
                    className={`btn btn-sm ml-1 mt-1 voucher-apply-btn ${!voucher.trim() ? 'disabled' : ''}`}
                    style={{ backgroundColor: '#007bff', color: 'white' }}
                    disabled={!voucher.trim()}
                    onClick={applyVoucher}
                  >
                    Apply
                  </button>
                </div>
              </div>

              {voucherMessage.success && (
                <p className="text-success font-weight-bolder font-italic px-3">
                  {voucherMessage.success}
                </p>
              )}
              {voucherMessage.error && (
                <p className="text-danger font-weight-bolder font-italic px-3">
                  {voucherMessage.error}
                </p>
              )}
            </div>
            
            <div className="modal-footer text-center">
              <button 
                className="btn shadow voucher-pay-btn" 
                style={{ backgroundColor: '#fc2b5a', color: 'white' }}
                onClick={handlePayment}
              >
                Pay ₹{paymentData.amount}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="basic-timeline">
      <div>
        {/* Content Header */}
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
          <div className="content-header-left col-md-9 col-12 mb-2">
            <div className="row breadcrumbs-top">
              <div className="col-12">
                <h3 className="content-header-title float-left mb-0">WhatsApp Wallet</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/college/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">WhatsApp Wallet</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="content-body">
          <section>
            {/* Error Display */}
            {error && (
              <div className="alert alert-danger mx-3 mb-3">
                {error}
                <button 
                  className="btn btn-sm btn-outline-danger ml-2"
                  onClick={() => setError('')}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="text-center p-4">
                <div className="spinner-border" role="status">
                  <span className="sr-only">Loading...</span>
                </div>
                <p className="mt-2">Loading recharge data...</p>
              </div>
            )}

            {!loading && (
              <>
                {/* Balance Display */}
                <div className="row mb-3">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-sm-0 mb-0 candidate-card">
                    <div className="card">
                      <div className="col-xl-12 p-3">
                        <div className="row">
                          <div className="col-xl-12 my-auto">
                            <h4 className="card-title mb-0">
                              <strong>WhatsApp Wallet Balance: ₹{whatsappBalance}</strong>
                            </h4>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Custom Recharge Section */}
                <div className="row mb-3">
                  <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 candidate-card">
                    <div className="card custom-recharge-card" style={{ backgroundColor: '#fff', border: '1px solid #e0e0e0', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
                      <div className="card-body p-4">
                        <div className="row align-items-center">
                          <div className="col-xl-8 col-lg-8 col-md-8 col-sm-12 col-12 mb-3 mb-md-0">
                            <h4 className="mb-3" style={{ fontWeight: 'bold', color: '#333' }}>
                              Quick Recharge / त्वरित रिचार्ज
                            </h4>
                            <p className="mb-3" style={{ fontSize: '14px', color: '#666' }}>
                              Enter your desired amount or choose from quick recharge options
                            </p>
                            
                            {/* Quick Amount Buttons */}
                            <div className="d-flex flex-wrap gap-2 mb-3">
                              {quickAmounts.map((amount) => (
                                <button
                                  key={amount}
                                  type="button"
                                  className="btn btn-sm quick-amount-btn"
                                  style={{
                                    minWidth: '80px',
                                    borderRadius: '20px',
                                    fontWeight: '600',
                                    border: customAmount === amount.toString() ? '2px solid #fc2b5a' : '1px solid #ddd',
                                    backgroundColor: customAmount === amount.toString() ? '#fc2b5a' : '#fff',
                                    color: customAmount === amount.toString() ? '#fff' : '#333'
                                  }}
                                  onClick={() => handleQuickAmount(amount)}
                                >
                                  ₹{amount}
                                </button>
                              ))}
                            </div>

                            {/* Custom Amount Input */}
                            <div className="input-group recharge-input-group" style={{ maxWidth: '100%' }}>
                              <div className="input-group-prepend">
                                <span className="input-group-text bg-white" style={{ borderRight: 'none', borderRadius: '25px 0 0 25px', border: '1px solid #ddd', padding: '10px 15px' }}>
                                  <strong style={{ color: '#333', fontSize: '16px' }}>₹</strong>
                                </span>
                              </div>
                              <input
                                type="number"
                                className="form-control recharge-amount-input"
                                placeholder="Enter Amount (Min: ₹10)"
                                value={customAmount}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  if (value === '' || (parseFloat(value) >= 0 && parseFloat(value) <= 100000)) {
                                    setCustomAmount(value);
                                  }
                                }}
                                onKeyPress={(e) => {
                                  if (e.key === 'Enter' && customAmount && parseFloat(customAmount) >= 10) {
                                    handleCustomAmountPayment();
                                  }
                                }}
                                min="10"
                                max="100000"
                                style={{ 
                                  borderRadius: '0 25px 25px 0', 
                                  fontSize: '16px', 
                                  padding: '10px 15px', 
                                  border: '1px solid #ddd', 
                                  borderLeft: 'none',
                                  color: '#333',
                                  backgroundColor: '#fff'
                                }}
                              />
                            </div>
                            {customAmount && parseFloat(customAmount) < 10 && (
                              <small className="text-warning d-block mt-2">
                                Minimum recharge amount is ₹10
                              </small>
                            )}
                          </div>
                          <div className="col-xl-4 col-lg-4 col-md-4 col-sm-12 col-12 text-center text-md-right">
                            <button
                              type="button"
                              className="btn btn-lg px-5 py-3 recharge-now-btn"
                              style={{
                                borderRadius: '30px',
                                fontWeight: 'bold',
                                fontSize: '18px',
                                backgroundColor: '#fc2b5a',
                                color: '#fff',
                                border: 'none',
                                boxShadow: '0 4px 15px rgba(115, 103, 240, 0.3)',
                                minWidth: '200px'
                              }}
                              onClick={handleCustomAmountPayment}
                              disabled={!customAmount || parseFloat(customAmount) < 10}
                            >
                              Recharge Now
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="row">
                  {/* Recharge Plans */}
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                    <div className="card mt-1 mb-5">
                      <div className="col-xl-12 py-1 px-1">
                        <div className="row">
                          <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                            <h4 className="card-title">Wallet Recharge Plans / रिचार्ज प्लान</h4>
                          </div>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="table-responsive">
                          <table className="table table-hover-animation mb-0 table-hover">
                            <thead>
                              <tr>
                                <th>Plan Name</th>
                                <th>Messages</th>
                                <th>Amount</th>
                                <th>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rechargePlans && rechargePlans.length > 0 ? (
                                rechargePlans.map((plan, index) => (
                                  <tr key={plan._id || index}>
                                    <td>{plan.planName || plan.name || 'NA'}</td>
                                    <td>{plan.messages || plan.messageCount || 'NA'}</td>
                                    <td>₹{plan.amount || plan.price || 'NA'}</td>
                                    <td>
                                      <button 
                                        className="btn btn-primary btn-sm text-white"
                                        onClick={() => handlePayNow(
                                          plan._id, 
                                          plan.amount || plan.price,
                                          plan.messages || plan.messageCount
                                        )}
                                      >
                                        Pay Now
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center">
                                    No Recharge Plans Available
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Latest Transactions */}
                  <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                    <div className="card mt-1 mb-5">
                      <div className="col-xl-12 py-1 px-1">
                        <div className="row">
                          <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                            <h4 className="card-title">Latest Transactions / नवीनतम लेनदेन</h4>
                          </div>
                        </div>
                      </div>
                      <div className="card-content">
                        <div className="table-responsive">
                          <table className="table table-hover-animation mb-0 table-hover">
                            <thead>
                              <tr>
                                <th>Date & Time</th>
                                <th>Plan Name</th>
                                <th>Amount Paid</th>
                                <th>Messages</th>
                              </tr>
                            </thead>
                            <tbody>
                              {latestTransactions && latestTransactions.length > 0 ? (
                                latestTransactions.map((transaction, index) => (
                                  <tr key={transaction._id || index}>
                                    <td>{formatDateTime(transaction.createdAt)}</td>
                                    <td>{transaction._plan ? (transaction._plan.planName || transaction._plan.name) : 'NA'}</td>
                                    <td>₹{transaction.amount || 'NA'}</td>
                                    <td>{transaction.messages || transaction.messageCount || 'NA'}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center">
                                    No Transactions Found
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                        {renderPagination()}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>

      {/* Voucher Modal */}
      <VoucherModal />

<style>
    {
        `
        .card .card-title {
    font-size: 1rem !important;
}
    .pb-1, .py-1 {
    padding-bottom: 1rem !important;
}
    .pt-1, .py-1 {
    padding-top: 1rem !important;
}
    .px-1{
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

/* Custom Recharge Section Styles */
.custom-recharge-card {
    transition: box-shadow 0.3s ease;
}

.custom-recharge-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.15) !important;
}

.quick-amount-btn {
    transition: all 0.2s ease;
}

.quick-amount-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
}

.recharge-now-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(115, 103, 240, 0.4) !important;
}

.recharge-now-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

/* Remove all focus styles - Inputs */
.recharge-input-group .form-control:focus,
.recharge-input-group .form-control:active,
.recharge-amount-input:focus,
.recharge-amount-input:active,
.recharge-amount-input:focus-visible,
.voucher-input:focus,
.voucher-input:active,
.voucher-input:focus-visible {
    outline: none !important;
    box-shadow: none !important;
    border-color: inherit !important;
}

.recharge-amount-input,
.voucher-input {
    outline: none !important;
}

.recharge-input-group .input-group-text {
    border-color: #ddd !important;
}

.recharge-input-group .form-control {
    border-color: #ddd !important;
}

.recharge-input-group {
    border-radius: 25px;
    overflow: hidden;
}

.recharge-input-group .input-group-prepend .input-group-text {
    border-right: none !important;
}

.recharge-input-group .form-control {
    border-left: none !important;
}

/* Remove all focus styles - Buttons */
.quick-amount-btn:focus,
.quick-amount-btn:active,
.quick-amount-btn:focus-visible,
.recharge-now-btn:focus,
.recharge-now-btn:active,
.recharge-now-btn:focus-visible,
.voucher-apply-btn:focus,
.voucher-apply-btn:active,
.voucher-apply-btn:focus-visible,
.voucher-pay-btn:focus,
.voucher-pay-btn:active,
.voucher-pay-btn:focus-visible {
    outline: none !important;
    box-shadow: none !important;
}

/* Remove focus from all form controls in recharge section */
.basic-timeline input:focus,
.basic-timeline input:active,
.basic-timeline input:focus-visible,
.basic-timeline button:focus,
.basic-timeline button:active,
.basic-timeline button:focus-visible {
    outline: none !important;
}

/* Specific override for Bootstrap form-control in this component */
.basic-timeline .form-control:focus {
    outline: none !important;
    box-shadow: none !important;
    border-color: #ced4da !important;
}

@media (max-width: 768px) {
    .custom-recharge-card .btn-lg {
        width: 100%;
        margin-top: 15px;
    }
}

/* Modal Header Styles */
.modal-header {
    // background: linear-gradient(135deg, #7367f0 0%, #5e50e5 100%);
    background: #fc2b5a;
    border-bottom: none;
    padding: 1.25rem 1.5rem;
    border-radius: 0.5rem 0.5rem 0 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    box-shadow: 0 2px 8px rgba(115, 103, 240, 0.2);
}

.modal-header .modal-title {
    color: #ffffff !important;
    font-weight: 600;
    font-size: 1.1rem;
    letter-spacing: 0.5px;
    margin: 0;
    text-transform: uppercase;
}

.modal-header .close {
    color: #ffffff !important;
    opacity: 1;
    font-size: 1.75rem;
    font-weight: 300;
    line-height: 1;
    padding: 0;
    margin: 0;
    background: transparent;
    border: none;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
}

.modal-header .close:hover {
    background-color: rgba(255, 255, 255, 0.2);
    transform: rotate(90deg);
    opacity: 1;
}

.modal-header .close:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.3);
}

.modal-header .close span {
    display: block;
    line-height: 1;
}
.coupon-text{
font-size: 0.9rem;
}
        `
    }
</style>

    </div>
  );
}

export default WhatsappWallet;
