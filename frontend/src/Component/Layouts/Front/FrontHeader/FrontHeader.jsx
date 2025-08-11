import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import "./FrontHeader.css";

// Register ScrollTrigger plugin
gsap.registerPlugin(ScrollTrigger);

const FrontHeader = () => {
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const logo = "/Assets/images/logo/focalyt_new_logo.png";
  const menuRef = useRef(null);
  const menuMainRef = useRef(null);
  const menuOverlayRef = useRef(null);
  const dropdownRef = useRef(null);
  const botContainerRef = useRef(null);
  
  // GSAP refs
  const headerRef = useRef(null);
  const logoRef = useRef(null);
  const navLinksRef = useRef(null);
  const loginBtnRef = useRef(null);

  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);

  // GSAP Animations
  useEffect(() => {
    // Initial page load animation
    const tl = gsap.timeline();
    
    // Header entrance animation
    tl.fromTo(headerRef.current, 
      { 
        y: -100, 
        opacity: 0,
        duration: 0.8,
        ease: "power3.out"
      },
      { 
        y: 0, 
        opacity: 1,
        duration: 0.8,
        ease: "power3.out"
      }
    );

    // Logo animation
    tl.fromTo(logoRef.current,
      {
        scale: 0.8,
        opacity: 0,
        rotation: -5
      },
      {
        scale: 1,
        opacity: 1,
        rotation: 0,
        duration: 0.6,
        ease: "back.out(1.7)"
      },
      "-=0.4"
    );

    // Navigation links stagger animation
    const navLinks = navLinksRef.current?.querySelectorAll('.nav-link-item');
    if (navLinks) {
      tl.fromTo(navLinks,
        {
          y: -30,
          opacity: 0
        },
        {
          y: 0,
          opacity: 1,
          duration: 0.5,
          stagger: 0.1,
          ease: "power2.out"
        },
        "-=0.3"
      );
    }

    // Login button animation
    tl.fromTo(loginBtnRef.current,
      {
        scale: 0.9,
        opacity: 0,
        y: -20
      },
      {
        scale: 1,
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "back.out(1.4)"
      },
      "-=0.2"
    );

    // Scroll-triggered animations
    ScrollTrigger.create({
      trigger: "body",
      start: "top top",
      end: "bottom bottom",
      onUpdate: (self) => {
        const progress = self.progress;
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
        // Update scroll states
        const newIsScrolled = scrollTop > 50;
        const newIsRevealed = scrollTop > 700;
        
        if (newIsScrolled !== isScrolled) {
          setIsScrolled(newIsScrolled);
          
          // Animate header on scroll
          if (newIsScrolled) {
            gsap.to(headerRef.current, {
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
              duration: 0.3,
              ease: "power2.out"
            });
          } else {
            gsap.to(headerRef.current, {
              backgroundColor: 'transparent',
              backdropFilter: 'blur(0px)',
              boxShadow: 'none',
              duration: 0.3,
              ease: "power2.out"
            });
          }
        }
        
        if (newIsRevealed !== isRevealed) {
          setIsRevealed(newIsRevealed);
        }
      }
    });

    // Hover animations for nav links
    const navItems = navLinksRef.current?.querySelectorAll('.nav-link-item');
    if (navItems) {
      navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
          gsap.to(item, {
            scale: 1.05,
            duration: 0.2,
            ease: "power2.out"
          });
        });
        
        item.addEventListener('mouseleave', () => {
          gsap.to(item, {
            scale: 1,
            duration: 0.2,
            ease: "power2.out"
          });
        });
      });
    }

    // Login button hover animation
    if (loginBtnRef.current) {
      loginBtnRef.current.addEventListener('mouseenter', () => {
        gsap.to(loginBtnRef.current, {
          scale: 1.05,
          duration: 0.2,
          ease: "power2.out"
        });
      });
      
      loginBtnRef.current.addEventListener('mouseleave', () => {
        gsap.to(loginBtnRef.current, {
          scale: 1,
          duration: 0.2,
          ease: "power2.out"
        });
      });
    }

    return () => {
      // Cleanup ScrollTrigger
      ScrollTrigger.getAll().forEach(trigger => trigger.kill());
    };
  }, []);

  const toggleMenu = () => {
    setIsMenuActive(!isMenuActive);
    if (menuRef.current) {
      menuRef.current.classList.toggle("active");
      menuRef.current.classList.add("transition");
    }
    if (menuOverlayRef.current) {
      menuOverlayRef.current.classList.toggle("active");
      menuOverlayRef.current.classList.add("transition");
    }
    // Add hamburger animation
    const trigger = document.querySelector('.mobile-menu-trigger');
    if (trigger) {
      trigger.classList.toggle("active");
    }
  };

  // Handle login dropdown toggle
  const toggleDropdown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDropdownActive(!isDropdownActive);
  };

  // Close dropdown when clicking outside
  const handleClickOutside = (e) => {
    if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
      setIsDropdownActive(false);
    }
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

  // const dragElement = (element) => {
  //   let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

  //   element.onmousedown = dragMouseDown;

  //   function dragMouseDown(e) {
  //     e = e || window.event;
  //     e.preventDefault();

  //     pos3 = e.clientX;
  //     pos4 = e.clientY;

  //     document.onmouseup = closeDragElement;
  //     document.onmousemove = elementDrag;
  //   }

  //   function elementDrag(e) {
  //     e = e || window.event;
  //     e.preventDefault();

  //     pos1 = pos3 - e.clientX;
  //     pos2 = pos4 - e.clientY;
  //     pos3 = e.clientX;
  //     pos4 = e.clientY;

  //     const parentWidth = window.innerWidth;
  //     const parentHeight = window.innerHeight;
  //     const elemWidth = element.offsetWidth;
  //     const elemHeight = element.offsetHeight;

  //     let newTop = element.offsetTop - pos2;
  //     let newLeft = element.offsetLeft - pos1;

  //     // Keep 50px padding from edges
  //     newTop = Math.max(50, Math.min(parentHeight - elemHeight - 50, newTop));
  //     newLeft = Math.max(50, Math.min(parentWidth - elemWidth - 50, newLeft));

  //     element.style.top = newTop + "px";
  //     element.style.left = newLeft + "px";
  //   }

  //   function closeDragElement() {
  //     document.onmouseup = null;
  //     document.onmousemove = null;
  //   }
  // };

  useEffect(() => {
    // Add external CSS and script dynamically
    const cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.href = "https://app.helloyubo.com/assets/focalyt_bot.bot.css";
    document.head.appendChild(cssLink);

    const script = document.createElement("script");
    script.src = "https://app.helloyubo.com/assets/focalyt_bot.bot.js";
    script.async = true;
    document.body.appendChild(script);

    // Drag functionality
    // const botContainer = botContainerRef.current;
    // if (botContainer) {
    //   dragElement(botContainer); // Apply drag to the container div
    // }

    return () => {
      // Cleanup CSS and script when component unmounts
      document.head.removeChild(cssLink);
      document.body.removeChild(script);
    };
  }, []);


  useEffect(() => {

    
    // Throttled scroll handler
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
          // Update scroll states
          const newIsScrolled = scrollTop > 50;
          const newIsRevealed = scrollTop > 700;
          
          if (newIsScrolled !== isScrolled) {
            setIsScrolled(newIsScrolled);
          }
          
          if (newIsRevealed !== isRevealed) {
            setIsRevealed(newIsRevealed);
          }
          
          ticking = false;
        });
        ticking = true;
      }
    };

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

    // Add event listeners
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', handleResize);
    document.addEventListener('click', handleClickOutside);

    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuActive, isScrolled, isRevealed]);

  // Dynamic header classes
  const headerClasses = [
    
    'site-header--transparent',
    'site-header--sticky',
    'header-blur',
    isScrolled ? 'scrolling' : '',
    isRevealed ? 'reveal-header' : ''
  ].filter(Boolean).join(' ');

  // Dynamic header styles
  // const headerStyles = {
  //   backgroundColor: isScrolled ? '#ffffff' : '#121212',
  // };

  // Dynamic nav link styles
  const navLinkStyles = {
    color: isScrolled ? '#000' : '#000'
  };

  // Dynamic login button styles
  const loginButtonStyles = {
    backgroundColor: isScrolled ? '#FC2B5A' : '#fff',
    color: isScrolled ? '#fff' : '#FC2B5A'
  };

  return (
    <>
      <div className="page-wrapper overflow-hidden">
        <header className={headerClasses} ref={headerRef}>
          <div className="container">
            <nav className="navbar site-navbar">
              {/* Logo - Left Side */}
              <div className="brand-logo" ref={logoRef}>
                <a href="#">
                  <img className="logo-light" src={logo} alt="brand logo" />
                  <img className="logo-dark" src={logo} alt="brand logo" />
                </a>
              </div>
              
              {/* Navigation Links - Center */}
              <div className="nav-center" ref={navLinksRef}>
                <ul className="site-menu-main" ref={menuMainRef} onClick={handleMenuClick}>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to="/" style={navLinkStyles}>Home</Link>
                  </li>
                  <li className="nav-item nav-item-has-children">
                    <Link to="/about" className="nav-link-item drop-trigger" style={navLinkStyles}>About Us</Link>
                  </li>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to="/socialimpact" style={navLinkStyles}>Social Impact</Link>
                  </li>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to="/joblisting" style={navLinkStyles}>Jobs</Link>
                  </li>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to='/courses' style={navLinkStyles}>Courses</Link>
                  </li>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to='/labs' style={navLinkStyles}>Labs</Link>
                  </li>
                  <li className="nav-item">
                    <Link className='nav-link-item drop-trigger' to='/events' style={navLinkStyles}>Events</Link>
                  </li>
                  <li className="nav-item d-xl-none d-lg-none d-md-none d-sm-block d-block">
                    <Link className='nav-link-item drop-trigger' to='/contact' style={navLinkStyles}>Contact Us</Link>
                  </li>
                  <li className="nav-item d-xl-flex d-lg-flex d-md-flex d-sm-none d-none">
                    <Link className='nav-link-item drop-trigger' to='/contact' style={navLinkStyles}>Contact Us</Link>
                  </li>
                </ul>
              </div>
              
              {/* Login Button - Right Side */}
              <div className="nav-right">
                <div 
                  className={`dropdown-container ${isDropdownActive ? 'active' : ''}`}
                  ref={dropdownRef}
                >
                  <span 
                    className="drop-trigger active_menu loginbtnn homeMenu" 
                    id="loginLink"
                    onClick={toggleDropdown}
                    style={loginButtonStyles}
                    ref={loginBtnRef}
                  >
                    Login
                  </span>

                  <ul className="dropdown-menu" id="loginDropdown">
                    <li>
                      <Link to={`${backendUrl}/company/login`} className="dropdown-item">
                        Login as Corporate
                      </Link>
                    </li>
                    <li>
                      <Link to="/candidate/login" className="dropdown-item">
                        Login as Student
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
              
              {/* Mobile Menu Trigger */}
              <div className="mobile-menu-trigger" onClick={toggleMenu}>
                <span></span>
                <span></span>
                <span></span>
              </div>
              
              {/*  Mobile Navigation Menu  */}
            <div className={`mobile-nav ${isMenuActive ? 'active' : ''}`} id="mobile-nav" ref={menuRef}>
                {/* Close Button */}
                <div className="mobile-close-btn" onClick={toggleMenu}>
                  <span></span>
                  <span></span>
                </div>
                
                <nav className="nav-menu mobile-nav-menu">
                    <Link to="/" className="nav-link" onClick={toggleMenu}>Home</Link>
                    <Link to="/about" className="nav-link" onClick={toggleMenu}>About Us</Link>
                    <Link to="/socialimpact" className="nav-link" onClick={toggleMenu}>Social Impact</Link>
                    <Link to="/joblisting" className="nav-link" onClick={toggleMenu}>Jobs</Link>
                    <Link to="/courses" className="nav-link" onClick={toggleMenu}>Courses</Link>
                    <Link to="/labs" className="nav-link" onClick={toggleMenu}>Labs</Link>
                    <Link to="/events" className="nav-link" onClick={toggleMenu}>Events</Link>
                    <Link to="/contact" className="nav-link" onClick={toggleMenu}>Contact Us</Link>
                </nav>
                <div className="mobile-login">
                    <div className="dropdown-container">
                      <button className="login-btn" onClick={toggleDropdown}>Login</button>
                      <ul className={`dropdown-menu ${isDropdownActive ? 'active' : ''}`}>
                        <li>
                          <Link to={`${backendUrl}/company/login`} className="dropdown-item" onClick={toggleMenu}>
                            Login as Corporate
                          </Link>
                        </li>
                        <li>
                          <Link to="/candidate/login" className="dropdown-item" onClick={toggleMenu}>
                            Login as Student
                          </Link>
                        </li>
                      </ul>
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            <div className={`mobile-nav-overlay ${isMenuActive ? 'active' : ''}`} ref={menuOverlayRef} onClick={toggleMenu}></div>

             
           
            </nav>
          </div>
        </header>

        
      </div>
    </>
  );
};

export default FrontHeader;