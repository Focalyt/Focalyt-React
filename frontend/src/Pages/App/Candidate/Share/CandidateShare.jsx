import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import "./Candidate.css"
const CandidateShare = () => {
  const [preloaderVisible, setPreloaderVisible] = useState(false);

  const shareCV = () => {
    setPreloaderVisible(true);

    axios.get('/candidate/createResume', {
      headers: { 'x-auth': localStorage.getItem('token') }
    })
      .then(res => {
        setPreloaderVisible(false);
        let text = getText(res.data.uploadData);
        let url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url);
      })
      .catch(err => {
        setPreloaderVisible(false);
        console.log(err.message);
      });
  };

  const getText = (url) => {
    let text = `Hello 
Please review my profile.
${url}

नमस्कार
कृपया मेरी प्रोफ़ाइल की समीक्षा करें।
${url}`;

    return text;
  };

  return (
    <>


      {/* Preloader */}
      {preloaderVisible && <div id="preloader"></div>}

      <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
        <div className="content-header-left col-md-9 col-12 mb-2">
          <div className="row breadcrumbs-top">
            <div className="col-12">
              <h3 className="content-header-title float-left mb-0">Share Profile</h3>
              <div className="breadcrumb-wrapper col-12">

                <ol className="breadcrumb">
                  <li className="breadcrumb-item">
                    <Link to="/candidate/dashboard">Home</Link>
                  </li>
                  <li className="breadcrumb-separator">
                    <i className="fas fa-angle-right mx-1 text-muted"></i>
                  </li>
                  <li className="breadcrumb-item active">Share Profile</li>
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
                <div className="table-content shadow-cashback shadow-cashback both-border">
                  <div className="tab_head font-weight-bolder both-border p-3">Share Profile</div>

                  <div className="mipie-refer p-3 both-border-top" style={{ overflowWrap: "break-word" }}>
                    <h5>This is your Profile Link / यह आपका प्रोफ़ाइल लिंक है</h5>
                    <h5>Click on button below to share your CV on whatsapp / व्हाट्सएप पर अपना सीवी साझा करने के लिए नीचे दिए गए बटन पर क्लिक करें</h5>
                    <button
                      className="btn btn-success waves-effect waves-light text-white mt-3"
                      onClick={shareCV}
                    >
                      Share Now / शेयर करे
                    </button>
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

export default CandidateShare;