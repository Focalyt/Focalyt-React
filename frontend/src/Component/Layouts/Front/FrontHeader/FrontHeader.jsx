import React, { useEffect, useRef, useState } from 'react';
import "./FrontHeader.css";
import $ from 'jquery'; 
import MetaPixel from '../../../../Component/MetaPixel';


const FrontHeader = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const logo = "/Assets/images/logo/focalyt_new_logo.png";
  const menuRef = useRef(null);
  const menuMainRef = useRef(null);
  const menuOverlayRef = useRef(null);
  const [isMenuActive, setIsMenuActive] = useState(false);

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
    menuRef.current?.classList.toggle("active");
    menuOverlayRef.current?.classList.toggle("active");
    menuRef.current?.classList.add("transition");
    menuOverlayRef.current?.classList.add("transition");
  };

  const handleMenuClick = (e) => {
    if (!menuRef.current?.classList.contains("active")) {
      return;
    }
    if (e.target.closest(".nav-item-has-children")) {
      const hasChildren = e.target.closest(".nav-item-has-children");
      showSubMenu(hasChildren);
    }
  };

  const showSubMenu = (hasChildren) => {
    const subMenu = hasChildren.querySelector(".sub-menu");
    subMenu?.classList.toggle("active");
  };

  useEffect(() => {
    // Resize handler
    const handleResize = () => {
      if (menuRef.current?.classList.contains("transition")) {
        menuRef.current.classList.remove("transition");
      }
      if (menuOverlayRef.current?.classList.contains("transition")) {
        menuOverlayRef.current.classList.remove("transition");
      }

      if (window.innerWidth > 991 && isMenuActive) {
        toggleMenu();
      }
    };

    // Scroll handler
    const handleScroll = () => {
      if (
        document.body.scrollTop > 50 ||
        document.documentElement.scrollTop > 50
      ) {
        $(".site-header--sticky").addClass("scrolling");
        $(".site-header--sticky").css("background-color", "#ffffff");
        $(".nav-link-item").css("color", "#000");
        $(".loginbtnn").css("background-color", "#FC2B5A");
        $(".nav-item .dropdown-container > span.active_menu").css("color", "#fff");
      } else {
        $(".site-header--sticky").removeClass("scrolling");
        $(".site-header--sticky").css("background-color", "#121212");
        $(".nav-link-item").css("color", "#fff");
        $(".loginbtnn").css("background-color", "#fff");
        $(".nav-item .dropdown-container > span.active_menu").css({
          color: "#FC2B5A",
          backgroundColor: "#fff"
        });
      }

      if (
        document.body.scrollTop > 700 ||
        document.documentElement.scrollTop > 700
      ) {
        $(".site-header--sticky.scrolling").addClass("reveal-header");
      } else {
        $(".site-header--sticky.scrolling").removeClass("reveal-header");
      }
    };

    // FAQ tab handler
    const handleFaqTab = () => {
      $('.faq-tab__nav').find('li').hover(function() {
        $('.faq-tab__nav').find('.active').removeClass('active');
        $(this).addClass('active');
        $('.tab-content').find('.show').removeClass('show').removeClass('active');
        $('.tab-content').hide();
        const activeTab = $(this).find('button').attr('data-bs-target');
        $(activeTab).addClass('show active');
        $('.tab-content').show();
        return false;
      });
    };

    // Add event listeners
    window.addEventListener('resize', handleResize);
    window.addEventListener('scroll', handleScroll);
    handleFaqTab();

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll);
    };
  }, [isMenuActive]);

  return (
    <>
   
      <div class="page-wrapper overflow-hidden">
        {/* <!--~~~~~~~~~~~~~~~~~~~~~~~~
     Header Area
           ~~~~~~~~~~~~~~~~~~~~~~~--> */}
        <header class="site-header site-header--transparent site-header--sticky">
          <div class="container">
            <nav class="navbar site-navbar">
              {/* <!--~~~~~~~~~~~~~~~~~~~~~~~~
            Brand Logo
        ~~~~~~~~~~~~~~~~~~~~~~~~~~~--> */}
              <div class="brand-logo">
                <a href="#">
                  {/* <!-- light version logo (logo must be black)--> */}
                  <img class="logo-light" src={logo} alt="brand logo" />
                  {/* <!-- Dark version logo (logo must be White)--> */}
                  <img class="logo-dark" src={logo} alt="brand logo" />
                </a>
              </div>
              <div class="menu-block-wrapper " onClick={toggleMenu}>
                <div class="menu-overlay" ref={menuOverlayRef}></div>
                <nav class="menu-block" ref={menuRef} id="append-menu-header">
                  <div class="mobile-menu-head">
                    <a href='index.html'>
                      <img src="/Assets/public_assets/images/newpage/logo-ha.svg" alt="brand logo" />
                    </a>
                    <div class="current-menu-title"></div>
                    <div class="mobile-menu-close">&times;</div>
                  </div>
                  <ul class="site-menu-main" ref={menuMainRef} onClick={handleMenuClick}>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href="/">Home</a>
                    </li>
                    <li class="nav-item nav-item-has-children">
                      {/* <!-- <a href="https://about.focalyt.com/" target="_blank" class="nav-link-item drop-trigger">About Us
                  </a> --> */}
                      <a href="/about" class="nav-link-item drop-trigger">About Us
                      </a>
                      {/* <a href="https://app.focalyt.com/about" class="nav-link-item drop-trigger">About Us
                      </a> */}
                    </li>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href="/socialimpact">Social Impact</a>
                    </li>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href="/joblisting">Jobs</a>
                    </li>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href='/courses'>Courses</a>
                    </li>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href='/labs'>Labs</a>
                    </li>
                    <li class="nav-item">
                      <a class='nav-link-item drop-trigger' href='/events'>Events</a>
                    </li>
                    <li class="nav-item d-xl-none d-lg-none d-md-none d-sm-block d-block">
                      <a class='nav-link-item drop-trigger' href='/contact'>Contact Us</a>
                    </li>
                    {/* <!-- active --> */}
                    <li class="nav-item  d-xl-flex d-lg-flex d-md-flex d-sm-none d-none">
                      {/* <!-- active_menu --> */}
                      <a class='nav-link-item drop-trigger ' href='/contact'>Contact Us</a>
                    </li>
                    <li class="nav-item small smallMobile">
                      {/* <!-- Container for hoverable area --> */}
                      <div class="dropdown-container">
                        {/* <!-- Login Text as a Span --> */}
                        <span class=" drop-trigger active_menu loginbtnn homeMenu" id="loginLink">Login</span>

                        {/* <!-- Dropdown Menu --> */}
                        <ul class="dropdown-menu" id="loginDropdown">
                          <li><a href={`${backendUrl}/company/login`} class="dropdown-item">Login as Corporate</a></li>
                         <li><a href="/candidate/login" class="dropdown-item">Login as Student</a></li> 
                          {/* <li><a href="/candidate/dashboard" class="dropdown-item">Login as Student</a></li> */}
                        </ul>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
              {/* <!--~~~~~~~~~~~~~~~~~~~~~~~~
          mobile menu trigger
         ~~~~~~~~~~~~~~~~~~~~~~~~~~~--> */}
              <div class="mobile-menu-trigger" onClick={toggleMenu}>
                <span></span>
              </div>
              {/* <!--~~~~~~~~~~~~~~~~~~~~~~~~
            Mobile Menu Hamburger Ends
          ~~~~~~~~~~~~~~~~~~~~~~~~~~~--> */}
              {/* <!-- <div class="header-cta-btn-wrapper">
            <a href="#" class="btn-masco btn-masco--header btn-masco--header-secondary">
              <span>Login</span>
            </a>
            <a href="#" class="btn-masco btn-masco--header   btn-secondary-l02 btn-fill--up">
              <span>Sign up free</span></a>
          </div> --> */}
            </nav>
          </div>
        </header>



      </div>
    </>
  )
}

export default FrontHeader
