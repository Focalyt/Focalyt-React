import React, { useEffect } from "react";
import FrontHeader from './FrontHeader/FrontHeader';
import FrontFooter from './FrontFooter/FrontFooter';
import PartnerWithUsModal from './PartnerWithUsModal/PartnerWithUsModal';
import { useLocation } from 'react-router-dom';
// import FrontLoader from "./FrontLoader/FrontLoader";

// const INITIAL_LOADER_MIN_MS = 1800;

const FrontLayout = ({ children }) => {
  const location = useLocation();
  const hideFooter = location.pathname === "/community";
  // const [showLoader, setShowLoader] = useState(true);
  // const [contentReady, setContentReady] = useState(false);

  useEffect(() => {
    if (location.hash) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.pathname]);

  // useEffect(() => {
  //   let cancelled = false;
  //   let timeoutId;

  //   const finishLoading = () => {
  //     if (cancelled) return;
  //     setShowLoader(false);
  //     setContentReady(true);
  //   };

  //   const startedAt = Date.now();

  //   const onPageReady = () => {
  //     const elapsed = Date.now() - startedAt;
  //     const remaining = Math.max(0, INITIAL_LOADER_MIN_MS - elapsed);
  //     timeoutId = window.setTimeout(finishLoading, remaining);
  //   };

  //   if (document.readyState === "complete") {
  //     onPageReady();
  //   } else {
  //     window.addEventListener("load", onPageReady);
  //   }

  //   return () => {
  //     cancelled = true;
  //     window.clearTimeout(timeoutId);
  //     window.removeEventListener("load", onPageReady);
  //   };
  // }, []);

  // useEffect(() => {
  //   document.body.style.overflow = showLoader ? "hidden" : "";
  //   return () => {
  //     document.body.style.overflow = "";
  //   };
  // }, [showLoader]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* {showLoader ? <FrontLoader /> : null} */}
      <>
      <FrontHeader/>
      
      <main className="">
        {children}
      </main>
      {/* <FrontFooter /> */}
      {!hideFooter && <FrontFooter />}
      <PartnerWithUsModal />
      </>

      <style>
        {
          `
          @media (max-width: 991px) {
            main {
              overflow-x: hidden;
            }
          }
          @media (max-width: 768px) {
            .images {
              gap: 10px;
            }
          }
          `
        }
      </style>
    </div>
    
  );
};

export default FrontLayout
