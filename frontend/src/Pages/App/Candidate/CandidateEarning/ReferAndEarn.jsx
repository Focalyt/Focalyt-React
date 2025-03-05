import React, { useState, useEffect } from 'react';
import moment from 'moment';
import "./ReferAndEarn.css"

const ReferAndEarn = ({ 
  candidate ={}, 
  cashback={}, 
  referral = [], 
  count = 0, 
  totalPages = 0, 
  page = 1,
  initialData = { fromDate: '', toDate: '', status: '' }
}) => {
  const [data, setData] = useState(initialData);
  const backendUrl = process.env.REACT_APP_BASE_URL || '';

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const referNow = (id) => {
    const text = `Hello 
I'm using Focalyt to explore Future Technology Courses and exciting job opportunities. You too can upgrade your skills in AI, Robotics, Cybersecurity, AR/VR, IoT, Cloud Computing, and more to become job-ready for the future!

Sign up today and land your dream job in future tech!
${backendUrl}/candidate/login?refCode=${id}

नमस्ते
मैं Focalyt का उपयोग कर रहा हूँ फ्यूचर टेक्नोलॉजी कोर्सेस और नई नौकरियों की खोज करने के लिए। आप भी आर्टिफिशियल इंटेलिजेंस, रोबोटिक्स, साइबर सिक्योरिटी, एआर/वीआर, आईओटी, क्लाउड कंप्यूटिंग जैसे कोर्स करके अपनी स्किल्स बढ़ाएं और जॉब के लिए तैयार बनें!
${backendUrl}/candidate/login?refCode=${id}`;

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url);
  };

  const generatePageLink = (pageNum) => {
    const { origin, pathname } = window.location;
    let url = `${origin}${pathname}?`;
    
    if (data.fromDate) url += `fromDate=${data.fromDate}&`;
    if (data.toDate) url += `toDate=${data.toDate}&`;
    if (data.status) url += `status=${data.status}&`;
    
    url += `page=${pageNum}`;
    return url;
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
            <a href="javascript:void(0)" className="page-link pagi_custom">{i}</a>
          </li>
        );
      } else {
        pages.push(
          <li key={i} className="page-item">
            <a className="page-link pageAnchor pagi_customtwo" href={generatePageLink(i)}>{i}</a>
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
      <ul className="pagination justify-content-end ml-2 mb-2 text-right">
        {pages}
      </ul>
    );
  };

  return (
   
      <div className="vertical-layout vertical-menu-modern 2-columns navbar-floating footer-static" 
        data-open="click" data-menu="vertical-menu-modern" data-col="2-columns">
     
        
        <div className="">
          <div className="content-overlay"></div>
          <div className="header-navbar-shadow"></div>
          <div className="content-wrapper">
            <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
              <div className="content-header-left col-md-9 col-12 mb-2">
                <div className="row breadcrumbs-top">
                  <div className="col-12">
                    <h3 className="content-header-title float-left mb-0">Refer & Earn</h3>
                    <div className="breadcrumb-wrapper col-12">
                      <ol className="breadcrumb">
                        <li className="breadcrumb-item">
                          <a href="/candidate/dashboard">Home</a>
                        </li>
                        <li className="breadcrumb-item active">Refer & Earn</li>
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
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 px-0">
                      <div className="table-content shadow-cashback shadow-cashback">
                        <div className="tab_head font-weight-bolder py-1 px-1"> Refer & Earn</div>

                        <div className="mipie-refer py-2 px-1" style={{ overflowWrap: 'break-word' }}>
                          {/* <h5>{backendUrl}/candidate/login?refCode={candidate._id}</h5> */}
                          <h5>{backendUrl}/candidate/login?refCode={candidate?._id || "N/A"}</h5>

                          <h5>This is your Referral Link / यह आपका रेफरल लिंक है</h5>
                          <h5>
  Refer your friends and earn रु {cashback?.Referral || 0} / अपने दोस्तों को रेफर करें और रु {cashback?.Referral || 0} कमाएं
</h5>

                          
                          <h5 className="mt-1">
                            <strong>Please note : </strong> 
                            You will receive cashback once the candidate has completed the Profile.
                          </h5>
                          <h5>
                            <strong>कृपया ध्यान दें : </strong>
                            उम्मीदवार द्वारा प्रोफाइल पूरा करने के बाद आपको कैशबैक प्राप्त होगा।
                          </h5>
                          <a 
                            className="btn btn-success waves-effect waves-light text-white mt-1"
                            href="javascript:" 
                            onClick={() => referNow(candidate?._id)}
                          >
                            Refer Now
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="col-xl-12 col-lg-12">
                    <form method="GET">
                      <div className="row">
                        <div className="col-xl-2 col-lg-4 col-md-4 col-sm-6 col-12 mt-1">
                          <label>From Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            name="fromDate" 
                            value={data.fromDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-xl-2 col-lg-4 col-md-4 col-sm-6 col-12 mt-1">
                          <label>To Date</label>
                          <input 
                            type="date" 
                            className="form-control" 
                            name="toDate" 
                            value={data.toDate}
                            onChange={handleInputChange}
                          />
                        </div>
                        <div className="col-xl-2 col-lg-4 col-md-4 col-sm-6 col-12 mt-1">
                          <label>Status</label>
                          <select 
                            className="form-control text-capitalize" 
                            name="status"
                            value={data.status}
                            onChange={handleInputChange}
                          >
                            <option value="">Select</option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                        </div>
                        <div className="col-xl-4 col-lg-12 col-md-12 col-sm-6 col-12 mt-1" style={{ marginTop: '2.5rem !important' }}>
                          <button 
                            className="btn btn-success waves-effect waves-light text-white d-inline px-xl-2 px-lg-2 px-md-2 px-sm-2 px-1 py-1 mx-2"
                            id="search-button" 
                            type="submit"
                          >
                            Go
                          </button>
                          <a 
                            className="extra-ss btn btn-danger d-inline waves-effect waves-light mb-2 text-white mx-md-0 mx-0 px-xl-2 px-lg-2 px-md-2 px-sm-2 px-1"
                            href="/candidate/referral"
                          >
                            RESET
                          </a>
                        </div>
                        <div className="totalCount col-xl-2 col-lg-4 col-md-4 col-sm-6 col-12">
                          <span>Total Candidates: {count}</span>
                        </div>
                      </div>
                    </form>
                  </div>

                  <div className="row mt-3">
                    <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 px-0 pb-1">
                      <div className="table-content shadow-cashback shadow-cashback">
                        <div className="tab_head font-weight-bolder py-1 px-1"> My Referrals</div>
                        <div style={{ overflowX: 'auto' }}>
                          <table className="table">
                            <thead>
                              <tr className="tab_row">
                                <th scope="col">Date/Time</th>
                                <th scope="col">Candidate Name</th>
                                <th scope="col">Number</th>
                                <th scope="col">Status</th>
                                <th scope="col">Earning</th>
                              </tr>
                            </thead>
                            <tbody>
                              {referral.length > 0 ? (
                                referral.map((refer, index) => (
                                  <tr key={index}>
                                    <td>
                                      {moment(refer.createdAt).utcOffset('+05:30').format('DD MMM YYYY, hh:mm A')}
                                    </td>
                                    <td>
                                      {refer?.referredTo?.name ? refer.referredTo.name : 'NA'}
                                    </td>
                                    <td>
                                      {refer?.referredTo?.mobile ? refer.referredTo.mobile : 'NA'}
                                    </td>
                                    <td>
                                      {refer?.status ? refer.status : 'NA'}
                                    </td>
                                    <td>
                                      {refer?.earning ? refer.earning : 'NA'}
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
                        </div>
                        {renderPagination()}
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
        
      </div>
   
  );
};

export default ReferAndEarn;