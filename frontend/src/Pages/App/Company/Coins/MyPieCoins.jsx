import React, { useState, useEffect } from 'react';

const MyPieCoins = () => {
  // Environment variables
  const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const razorpayKey = process.env.REACT_APP_MIPIE_RAZORPAY_KEY;

  // State management
  const [latestTransactions, setLatestTransactions] = useState([]);
  const [coinOffers, setCoinOffers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Modal and payment state
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [paymentData, setPaymentData] = useState({
    offerId: '',
    amount: '',
    offerAmount: ''
  });
  const [voucher, setVoucher] = useState('');
  const [voucherMessage, setVoucherMessage] = useState({ success: '', error: '' });

  // Load data on component mount
  useEffect(() => {
    loadCoinsData();
  }, []);

  const loadCoinsData = async () => {
    try {
      setLoading(true);
      setError('');

      const token = localStorage.getItem('token');
      const response = await fetch(`${backendUrl}/company/coins-data`, {
        headers: { 'x-auth': token }
      });

      if (response.ok) {
        const data = await response.json();
        setLatestTransactions(data.latestTransactions || []);
        setCoinOffers(data.coinOffers || []);
      } else {
        setError('Failed to load coins data');
      }
    } catch (error) {
      setError('Error loading data');
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'NA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const handlePayNow = (offerId, amount) => {
    setPaymentData({
      offerId,
      amount,
      offerAmount: amount
    });
    setVoucher('');
    setVoucherMessage({ success: '', error: '' });
    setShowVoucherModal(true);
  };

  const handleVoucherChange = (value) => {
    setVoucher(value.toUpperCase());
  };

  const applyVoucher = async () => {
    if (!voucher.trim()) return;

    try {
      const token = localStorage.getItem('token');
      const data = {
        amount: paymentData.offerAmount,
        code: voucher,
        offerId: paymentData.offerId
      };

      const response = await fetch(`${backendUrl}/company/checkvoucher`, {
        method: 'PUT',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.status && result.amount > 0) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
      } else if (result.status && result.amount === 0) {
        setVoucherMessage({ success: result.message, error: '' });
        setPaymentData(prev => ({ ...prev, amount: result.amount }));
        // If amount is 0, reload the page
        window.location.reload();
      } else {
        setVoucherMessage({ success: '', error: result.message });
        setVoucher('');
        setPaymentData(prev => ({ ...prev, amount: prev.offerAmount }));
      }
    } catch (error) {
      setVoucherMessage({ success: '', error: 'Error applying voucher' });
      console.error('Error applying voucher:', error);
    }
  };

  const makePayment = async () => {
    try {
      const token = localStorage.getItem('token');
      const data = {
        offerId: paymentData.offerId,
        amount: paymentData.amount
      };

      const response = await fetch(`${backendUrl}/company/payment`, {
        method: 'POST',
        headers: {
          'x-auth': token,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      const options = {
        key: razorpayKey,
        amount: result.order.amount,
        currency: result.order.currency,
        name: "MiPie",
        description: "",
        image: "/images/logo/logo.png",
        order_id: result.order.id,
        handler: async (response) => {
          const paymentStatusData = {
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            _company: result.company._id,
            _offer: paymentData.offerId,
            amount: paymentData.amount,
            code: voucher
          };

          try {
            await fetch(`${backendUrl}/company/paymentStatus`, {
              method: 'POST',
              headers: {
                'x-auth': token,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(paymentStatusData)
            });

            window.location.reload();
          } catch (error) {
            console.error('Payment status update failed:', error);
          }
        },
        prefill: {
          name: result.company.name,
          email: result.company.email,
          contact: result.company._concernPerson.mobile
        },
        theme: {
          color: "#FC2B5A"
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Error making payment:', error);
      setVoucherMessage({ success: '', error: 'Payment initialization failed' });
    }
  };

  const handlePayment = () => {
    if (!voucher.trim()) {
      makePayment();
    } else {
      applyVoucher().then(() => {
        if (voucherMessage.success && !voucherMessage.error) {
          makePayment();
        }
      });
    }
  };

  // Modal component
  const VoucherModal = () => {
    if (!showVoucherModal) return null;

    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-header" style={{ backgroundColor: '#7367f0' }}>
              <h5 className="modal-title text-white text-uppercase">Buy Coins</h5>
              <button 
                type="button" 
                className="close text-white" 
                onClick={() => setShowVoucherModal(false)}
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
                    className="form-control text-dark mt-1" 
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
                    className={`btn btn-sm ml-1 mt-1 ${!voucher.trim() ? 'disabled' : ''}`}
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
                className="btn shadow" 
                style={{ backgroundColor: '#7367f0', color: 'white' }}
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
                <h3 className="content-header-title float-left mb-0">Coins</h3>
                <div className="breadcrumb-wrapper col-12">
                  <ol className="breadcrumb">
                    <li className="breadcrumb-item">
                      <a href="/company/dashboard">Home</a>
                    </li>
                    <li className="breadcrumb-item active">Coins</li>
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
                <p className="mt-2">Loading coins data...</p>
              </div>
            )}

            {!loading && (
              <div className="row">
                {/* Latest Transactions */}
                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                  <div className="card mt-1 mb-5">
                    <div className="col-xl-12 py-1">
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
                              <th>Offer Name</th>
                              <th>Amount Paid</th>
                            </tr>
                          </thead>
                          <tbody>
                            {latestTransactions && latestTransactions.length > 0 ? (
                              latestTransactions.map((transaction, index) => (
                                <tr key={transaction._id || index}>
                                  <td>{formatDateTime(transaction.createdAt)}</td>
                                  <td>{transaction._offer ? transaction._offer.displayOffer : 'NA'}</td>
                                  <td>₹{transaction.amount || 'NA'}</td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="text-center">
                                  No Result Found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Coin Offers */}
                <div className="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-3 mb-3 candidate-card">
                  <div className="card mt-1 mb-5">
                    <div className="col-xl-12 py-1">
                      <div className="row">
                        <div className="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                          <h4 className="card-title">Coin Offers / कॉइन ऑफर</h4>
                        </div>
                      </div>
                    </div>
                    <div className="card-content">
                      <div className="table-responsive">
                        <table className="table table-hover-animation mb-0 table-hover">
                          <thead>
                            <tr>
                              <th>Offer Name</th>
                              <th>Coins</th>
                              <th>Amount</th>
                              <th>Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {coinOffers && coinOffers.length > 0 ? (
                              coinOffers.map((offer, index) => (
                                <tr key={offer._id || index}>
                                  <td>{offer.displayOffer || 'NA'}</td>
                                  <td>{offer.getCoins || 'NA'}</td>
                                  <td>₹{offer.payAmount?.$numberDecimal || offer.payAmount || 'NA'}</td>
                                  <td>
                                    <button 
                                      className="btn btn-primary btn-sm text-white"
                                      onClick={() => handlePayNow(
                                        offer._id, 
                                        offer.payAmount?.$numberDecimal || offer.payAmount
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
                                  No Result Found
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Voucher Modal */}
      <VoucherModal />
    </div>
  );
};

export default MyPieCoins;