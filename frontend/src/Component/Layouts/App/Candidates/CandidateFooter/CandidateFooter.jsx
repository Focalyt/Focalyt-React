import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';
function CandidateFooter() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768)
    }
    window.addEventListener("resize", handleResize);
    return () => window.addEventListener("resize", handleResize)
  }, [])
 const currentYear = new Date().getFullYear();
  return (
    <>

      COPYRIGHT © {currentYear} Focalyt,All rights Reserved
      {isMobile && (
        <section>
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div id="stickymenu_bottom_mobile" className="d-flex align-items-center justify-content-center  text-center d-xl-none d-lg-none d-md-none d-sm-none d-block alert-bar ">
                  <div className="stickymenu-item stuck-text"><a href="/candidate/referral"><i class="fa-solid fa-share"></i>  <span class="below-bar active ">Refer</span></a></div>
                  <div className="stickymenu-item stuck-text"><a href="/candidate/document"><i class="fa-regular fa-file " aria-hidden="true"></i><span class="below-bar active ">My Documents</span></a></div>
                  <div className="stickymenu-item stuck-text"><a href="/candidate/searchjob"><i class="fa-solid  fa-magnifying-glass " aria-hidden="true"></i><span class="below-bar active ">Jobs</span></a>
                  </div>
                  <div className="stickymenu-item stuck-text"><a href="/candidate/searchcourses"><i class="fa-solid fa-book" aria-hidden="true"></i><span class="below-bar active ">Courses</span></a></div>
                  {/* <!-- <div className="stickymenu-item stuck-text"><a href="/candidate/watchVideos"><i class="fa-solid fa-video" aria-hidden="true"></i><span class="below-bar active ">Video</span></a></div> --> */}
                </div>
              </  div>
            </div>
          </div>
        </section>
      )}
      <style>
        {`
  #stickymenu_bottom_mobile {
    position: fixed;
    width: 100%;
    bottom: 0;
    z-index: 9;
    left: 0;
    padding: 8px 4px 6px;
    background: #FC2B5A;
    -ms-box-shadow: 0 -2px 5px -2px rgba(0, 0, 0, 0.1);
    -o-box-shadow: 0 -2px 5px -2px rgba(0, 0, 0, 0.1);
    box-shadow: 0 -2px 5px -2px rgba(0, 0, 0, 0.1);
    /* border-radius: 9px; */
}
    #stickymenu_bottom_mobile .stickymenu-item {
    width: 100% !important;
}
    #stickymenu_bottom_mobile .stickymenu-item a {
    display: inline-block;
    position: relative;
}
    #stickymenu_bottom_mobile .stickymenu-item i {
    font-size: 17px;
    color: #ffff;
    margin: 0;
    margin-bottom: 2px;
}
    #stickymenu_bottom_mobile .stickymenu-item span, #stickymenu_bottom_mobile .stickymenu-item .on_top {
    display: block;
    font-family: var(--font-family-default);
    font-weight: 700;
    font-size: 11px;
    line-height: 1;
    color: #ffff;
    text-transform: uppercase;
}

  `}
      </style>

    </>
  )
}

export default CandidateFooter
