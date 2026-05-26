import React, { useEffect, useRef, useState } from 'react';
import { BookOpen, BriefcaseBusiness, CalendarDays, Cog, Compass, FlaskConical, Handshake, Images, MapPin, Sparkles, Zap } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import "./FrontHeader.css";

const HOME_SECTION_SCROLL_OFFSET = 130;

const SUB_TABS = [
  { label: "Impact", sectionId: "about", icon: Zap },
  { label: "Labs", sectionId: "labs", icon: FlaskConical },
  { label: "Industry 4.0", sectionId: "industry-automation", icon: Cog },
  { label: "Zenith X", sectionId: "zenith-x", icon: Sparkles },
  { label: "Events", sectionId: "events", icon: CalendarDays },
  { label: "Courses", sectionId: "future-courses", icon: BookOpen },
  { label: "Jobs", sectionId: "future-jobs", icon: BriefcaseBusiness },
  { label: "Approach", sectionId: "our-approach", icon: Compass },
  { label: "Partners", sectionId: "partners", icon: Handshake },
  { label: "Media", sectionId: "media", icon: Images },
  { label: "Our Reach", sectionId: "geographic-reach", icon: MapPin },
];

function scrollToHomeSection(sectionId) {
  const el = document.getElementById(sectionId);
  if (!el) return;
  const top = el.getBoundingClientRect().top + window.scrollY - HOME_SECTION_SCROLL_OFFSET;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
  window.history.replaceState(null, "", `/#${sectionId}`);
}

const FrontHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
  const logo = "/Assets/images/logo/focalyt_new_logo.png";
  const menuRef = useRef(null);
  const menuMainRef = useRef(null);
  const menuOverlayRef = useRef(null);
  const dropdownRef = useRef(null);

  const [isMenuActive, setIsMenuActive] = useState(false);
  const [isDropdownActive, setIsDropdownActive] = useState(false);
  const [hoveredSubTab, setHoveredSubTab] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const FOC_THEME = "sky-magenta";

  useEffect(() => {
    document.documentElement.setAttribute("data-foc-theme", FOC_THEME);
    try {
      localStorage.setItem("foc-theme", FOC_THEME);
    } catch {
      // ignore
    }
  }, []);

  const toggleMenu = () => {
    const next = !isMenuActive;
    setIsMenuActive(next);
    document.body.classList.toggle("foc-mobile-nav-open", next);
    if (menuRef.current) {
      menuRef.current.classList.toggle("active", next);
      menuRef.current.classList.add("transition");
    }
    if (menuOverlayRef.current) {
      menuOverlayRef.current.classList.toggle("active", next);
      menuOverlayRef.current.classList.add("transition");
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

  // Chatbot functionality
  // useEffect(() => {
  //   const cssLink = document.createElement("link");
  //   cssLink.rel = "stylesheet";
  //   cssLink.href = "https://app.helloyubo.com/assets/focalyt_bot.bot.css";
  //   document.head.appendChild(cssLink);

  //   const script = document.createElement("script");
  //   script.src = "https://app.helloyubo.com/assets/focalyt_bot.bot.js";
  //   script.async = true;
  //   document.body.appendChild(script);

  //   // Wait for the script to load and then apply drag functionality
  //   script.onload = () => {
  //     // Wait a bit for the chatbot element to be created
  //     setTimeout(() => {
  //       const botContainer = document.getElementsByClassName("chat-start")[0];
  //       if (botContainer && window.dragElement) {
  //         window.dragElement(botContainer); // Apply drag to the container div
  //       }
  //     }, 1000); // Give time for the chatbot to initialize
  //   };

  //   return () => {
  //     // Cleanup CSS and script when component unmounts
  //     if (cssLink.parentNode) {
  //       document.head.removeChild(cssLink);
  //     }
  //     if (script.parentNode) {
  //       document.body.removeChild(script);
  //     }
  //   };
  // }, []);


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
      document.body.classList.remove('foc-mobile-nav-open');
    };
  }, [isMenuActive, isScrolled, isRevealed]);

  // Dynamic header classes — cyber electric shell; scroll classes kept for mobile menu compat
  const headerClasses = [
    'site-header',
    'site-header--sticky',
    'front-header--cyber',
    isScrolled ? 'scrolling' : '',
    isRevealed ? 'reveal-header' : ''
  ].filter(Boolean).join(' ');

  const isHomePage = () => {
    const path = location.pathname.replace(/\/$/, "") || "/";
    return path === "/" || path === "/home";
  };

  const handlePartnerWithUs = (e) => {
    if (isMenuActive) {
      toggleMenu();
    }
    if (isHomePage()) return;
    e.preventDefault();
    navigate("/", { state: { openPartnerModal: true } });
  };

  const handleSubTabClick = (e, tab) => {
    if (!tab.sectionId) return;
    e.preventDefault();
    setHoveredSubTab(tab.label);
    if (isHomePage()) {
      scrollToHomeSection(tab.sectionId);
    } else {
      navigate(`/#${tab.sectionId}`);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <header className={headerClasses}>
          <div className="container">
            <nav className="navbar site-navbar">
              <div className="brand-logo">
                <Link to="/" aria-label="Focalyt Home">
                  <img className="logo-light" src={logo} alt="brand logo" />
                  <img className="logo-dark" src={logo} alt="brand logo" />
                </Link>
              </div>
              
              <div className="menu-block-wrapper">
                <div className="menu-overlay" ref={menuOverlayRef} onClick={toggleMenu} role="presentation" />
                <nav className="menu-block" ref={menuRef} id="append-menu-header" onClick={(e) => e.stopPropagation()}>
                  <div className="mobile-menu-head">
                    <a href='index.html'>
                      <img src="/Assets/public_assets/images/newpage/logo-ha.svg" alt="brand logo" />
                    </a>
                    <div className="current-menu-title"></div>
                    <div
                      className="mobile-menu-close"
                      onClick={(e) => { e.stopPropagation(); toggleMenu(); }}
                      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggleMenu(); } }}
                      role="button"
                      tabIndex={0}
                      aria-label="Close menu"
                    >
                      &times;
                    </div>
                  </div>
                  
                  <ul className="site-menu-main" ref={menuMainRef} onClick={handleMenuClick}>
                    <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to="/">Home</Link>
                    </li>
                    <li className="nav-item nav-item-has-children">
                      <Link to="/about" className="nav-link-item drop-trigger">About Us</Link>
                    </li>
                    {/* <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to="/socialimpact">Social Impact</Link>
                    </li> */}
                    {/* <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to="/joblisting">Jobs</Link>
                    </li> */}
                    {/* <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to='/courses'>Courses</Link>
                    </li> */}
                    {/* <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to='/labs'>Labs</Link>
                    </li>
                    <li className="nav-item">
                      <Link className='nav-link-item drop-trigger' to='/events'>Events</Link>
                    </li> */}
                    <li className="nav-item d-xl-none d-lg-none d-md-none d-sm-block d-block">
                      <button
                        type="button"
                        className="nav-link-item drop-trigger"
                        data-bs-toggle={isHomePage() ? "modal" : undefined}
                        data-bs-target={isHomePage() ? "#partnerModal" : undefined}
                        onClick={handlePartnerWithUs}
                      >
                        Partner with Us
                      </button>
                    </li>
                    <li className="nav-item d-xl-flex d-lg-flex d-md-flex d-sm-none d-none">
                      <button
                        type="button"
                        className="nav-link-item drop-trigger"
                        data-bs-toggle={isHomePage() ? "modal" : undefined}
                        data-bs-target={isHomePage() ? "#partnerModal" : undefined}
                        onClick={handlePartnerWithUs}
                      >
                        Partner with Us
                      </button>
                    </li>
                    
                    {/* Theme Toggle */}
                    {/* <li className="nav-item">
                      <button type="button" className="theme-toggle" onClick={toggleTheme}>
                        <span className="theme-toggle__dot" />
                        {theme === "light" ? "Light" : "Dark"}
                      </button>
                    </li> */}

                    {/* Fixed Login Dropdown */}
                    <li className="nav-item small smallMobile">
                      <div 
                        className={`dropdown-container ${isDropdownActive ? 'active' : ''}`}
                        ref={dropdownRef}
                      >
                        <span 
                          className="drop-trigger active_menu loginbtnn homeMenu" 
                          id="loginLink"
                          onClick={toggleDropdown}
                        >
                          Login
                        </span>

                        <ul className="dropdown-menu" id="loginDropdown">
                          <li>
                            <Link to={`${backendUrl}/company/login`} className="dropdown-item">
                              Login as Company
                            </Link>
                          </li>
                          <li>
                            <Link to="/candidate/login" className="dropdown-item">
                              Login as Student
                            </Link>
                          </li>
                          <li>
                            <Link to="/institute/login" className="dropdown-item">
                              Login as Institute
                            </Link>
                          </li>
                        </ul>
                      </div>
                    </li>
                  </ul>
                </nav>
              </div>
              
              <div className="mobile-menu-trigger" onClick={toggleMenu}>
                <span></span>
              </div>
            </nav>

          </div>

          <div className="container">
            <nav className="front-subtabs" aria-label="Homepage sections">
              <div className="front-subtabs__scroller">
                {SUB_TABS.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <a
                      key={tab.label}
                      href={`/#${tab.sectionId}`}
                      className="front-subtabs__tab"
                      onClick={(e) => handleSubTabClick(e, tab)}
                      aria-label={tab.label}
                    >
                      <Icon className="front-subtabs__icon" aria-hidden="true" size={14} strokeWidth={2.1} />
                      <span>{tab.label}</span>
                    </a>
                  );
                })}
              </div>
            </nav>
          </div>
        </header>
        {/* Floating side tabs — hidden for now
        <nav className="floating-side-tabs" aria-label="Quick links">
          {SUB_TABS.map((tab) => {
            const Icon = tab.icon;
            const tabClassName = `fst-tab${hoveredSubTab === tab.label ? " is-hovered" : ""}`;

            return tab.sectionId ? (
              <a
                key={tab.label}
                href={`/#${tab.sectionId}`}
                className={tabClassName}
                onClick={(e) => handleSubTabClick(e, tab)}
                onMouseEnter={() => setHoveredSubTab(tab.label)}
                onMouseLeave={() => setHoveredSubTab(null)}
                onFocus={() => setHoveredSubTab(tab.label)}
                onBlur={() => setHoveredSubTab(null)}
                onTouchStart={() => setHoveredSubTab(tab.label)}
                aria-label={tab.label}
              >
                <Icon className="fst-icon" aria-hidden="true" size={18} strokeWidth={2.1} />
                <span className="fst-label">{tab.label}</span>
              </a>
            ) : (
              <Link
                key={tab.label}
                className={tabClassName}
                to={tab.to}
                onMouseEnter={() => setHoveredSubTab(tab.label)}
                onMouseLeave={() => setHoveredSubTab(null)}
                onFocus={() => setHoveredSubTab(tab.label)}
                onBlur={() => setHoveredSubTab(null)}
                onTouchStart={() => setHoveredSubTab(tab.label)}
                aria-label={tab.label}
              >
                <Icon className="fst-icon" aria-hidden="true" size={18} strokeWidth={2.1} />
                <span className="fst-label">{tab.label}</span>
              </Link>
            );
          })}
        </nav>
        */}
      </div>
    </>
  );
};

export default FrontHeader;

// import React, { useEffect, useRef, useState } from 'react';
// import { Link } from 'react-router-dom';
// import { gsap } from 'gsap';
// import { ScrollTrigger } from 'gsap/ScrollTrigger';
// import "./FrontHeader.css";

// // Register ScrollTrigger plugin
// gsap.registerPlugin(ScrollTrigger);

// const FrontHeader = () => {
//   const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
//   const logo = "/Assets/images/logo/focalyt_new_logo.png";
//   const menuRef = useRef(null);
//   const menuMainRef = useRef(null);
//   const menuOverlayRef = useRef(null);
//   const dropdownRef = useRef(null);
//   const botContainerRef = useRef(null);
  
//   // GSAP refs
//   const headerRef = useRef(null);
//   const logoRef = useRef(null);
//   const navLinksRef = useRef(null);
//   const loginBtnRef = useRef(null);

//   const [isMenuActive, setIsMenuActive] = useState(false);
//   const [isDropdownActive, setIsDropdownActive] = useState(false);
//   const [isScrolled, setIsScrolled] = useState(false);
//   const [isRevealed, setIsRevealed] = useState(false);

//   // GSAP Animations
//   useEffect(() => {
//     // Initial page load animation
//     const tl = gsap.timeline();
    
//     // Header entrance animation
//     tl.fromTo(headerRef.current, 
//       { 
//         y: -100, 
//         opacity: 0,
//         duration: 0.8,
//         ease: "power3.out"
//       },
//       { 
//         y: 0, 
//         opacity: 1,
//         duration: 0.8,
//         ease: "power3.out"
//       }
//     );

//     // Logo animation
//     tl.fromTo(logoRef.current,
//       {
//         scale: 0.8,
//         opacity: 0,
//         rotation: -5
//       },
//       {
//         scale: 1,
//         opacity: 1,
//         rotation: 0,
//         duration: 0.6,
//         ease: "back.out(1.7)"
//       },
//       "-=0.4"
//     );

//     // Navigation links stagger animation
//     const navLinks = navLinksRef.current?.querySelectorAll('.nav-link-item');
//     if (navLinks) {
//       tl.fromTo(navLinks,
//         {
//           y: -30,
//           opacity: 0
//         },
//         {
//           y: 0,
//           opacity: 1,
//           duration: 0.5,
//           stagger: 0.1,
//           ease: "power2.out"
//         },
//         "-=0.3"
//       );
//     }

//     // Login button animation
//     tl.fromTo(loginBtnRef.current,
//       {
//         scale: 0.9,
//         opacity: 0,
//         y: -20
//       },
//       {
//         scale: 1,
//         opacity: 1,
//         y: 0,
//         duration: 0.6,
//         ease: "back.out(1.4)"
//       },
//       "-=0.2"
//     );

//     // Scroll-triggered animations
//     ScrollTrigger.create({
//       trigger: "body",
//       start: "top top",
//       end: "bottom bottom",
//       onUpdate: (self) => {
//         const progress = self.progress;
//         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        
//         // Update scroll states
//         const newIsScrolled = scrollTop > 50;
//         const newIsRevealed = scrollTop > 700;
        
//         if (newIsScrolled !== isScrolled) {
//           setIsScrolled(newIsScrolled);
          
//           // Animate header on scroll
//           if (newIsScrolled) {
//             gsap.to(headerRef.current, {
//               backgroundColor: 'rgba(255, 255, 255, 0.95)',
//               backdropFilter: 'blur(10px)',
//               boxShadow: '0 2px 20px rgba(0, 0, 0, 0.1)',
//               duration: 0.3,
//               ease: "power2.out"
//             });
//           } else {
//             gsap.to(headerRef.current, {
//               backgroundColor: 'transparent',
//               backdropFilter: 'blur(0px)',
//               boxShadow: 'none',
//               duration: 0.3,
//               ease: "power2.out"
//             });
//           }
//         }
        
//         if (newIsRevealed !== isRevealed) {
//           setIsRevealed(newIsRevealed);
//         }
//       }
//     });

//     // Hover animations for nav links
//     const navItems = navLinksRef.current?.querySelectorAll('.nav-link-item');
//     if (navItems) {
//       navItems.forEach(item => {
//         item.addEventListener('mouseenter', () => {
//           gsap.to(item, {
//             scale: 1.05,
//             duration: 0.2,
//             ease: "power2.out"
//           });
//         });
        
//         item.addEventListener('mouseleave', () => {
//           gsap.to(item, {
//             scale: 1,
//             duration: 0.2,
//             ease: "power2.out"
//           });
//         });
//       });
//     }

//     // Login button hover animation
//     if (loginBtnRef.current) {
//       loginBtnRef.current.addEventListener('mouseenter', () => {
//         gsap.to(loginBtnRef.current, {
//           scale: 1.05,
//           duration: 0.2,
//           ease: "power2.out"
//         });
//       });
      
//       loginBtnRef.current.addEventListener('mouseleave', () => {
//         gsap.to(loginBtnRef.current, {
//           scale: 1,
//           duration: 0.2,
//           ease: "power2.out"
//         });
//       });
//     }

//     return () => {
//       // Cleanup ScrollTrigger
//       ScrollTrigger.getAll().forEach(trigger => trigger.kill());
//     };
//   }, []);

//   const toggleMenu = () => {
//     setIsMenuActive(!isMenuActive);
//     if (menuRef.current) {
//       menuRef.current.classList.toggle("active");
//       menuRef.current.classList.add("transition");
//     }
//     if (menuOverlayRef.current) {
//       menuOverlayRef.current.classList.toggle("active");
//       menuOverlayRef.current.classList.add("transition");
//     }
//     // Add hamburger animation
//     const trigger = document.querySelector('.mobile-menu-trigger');
//     if (trigger) {
//       trigger.classList.toggle("active");
//     }
//   };

//   // Handle login dropdown toggle
//   const toggleDropdown = (e) => {
//     e.preventDefault();
//     e.stopPropagation();
//     setIsDropdownActive(!isDropdownActive);
//   };

//   // Close dropdown when clicking outside
//   const handleClickOutside = (e) => {
//     if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
//       setIsDropdownActive(false);
//     }
//   };

//   const handleMenuClick = (e) => {
//     if (!menuRef.current?.classList.contains("active")) {
//       return;
//     }
//     if (e.target.closest(".nav-item-has-children")) {
//       const hasChildren = e.target.closest(".nav-item-has-children");
//       showSubMenu(hasChildren);
//     }
//   };

//   const showSubMenu = (hasChildren) => {
//     const subMenu = hasChildren.querySelector(".sub-menu");
//     subMenu?.classList.toggle("active");
//   };

//   // const dragElement = (element) => {
//   //   let pos1 = 0, pos2 = 0, pos3 = 0, pos4 = 0;

//   //   element.onmousedown = dragMouseDown;

//   //   function dragMouseDown(e) {
//   //     e = e || window.event;
//   //     e.preventDefault();

//   //     pos3 = e.clientX;
//   //     pos4 = e.clientY;

//   //     document.onmouseup = closeDragElement;
//   //     document.onmousemove = elementDrag;
//   //   }

//   //   function elementDrag(e) {
//   //     e = e || window.event;
//   //     e.preventDefault();

//   //     pos1 = pos3 - e.clientX;
//   //     pos2 = pos4 - e.clientY;
//   //     pos3 = e.clientX;
//   //     pos4 = e.clientY;

//   //     const parentWidth = window.innerWidth;
//   //     const parentHeight = window.innerHeight;
//   //     const elemWidth = element.offsetWidth;
//   //     const elemHeight = element.offsetHeight;

//   //     let newTop = element.offsetTop - pos2;
//   //     let newLeft = element.offsetLeft - pos1;

//   //     // Keep 50px padding from edges
//   //     newTop = Math.max(50, Math.min(parentHeight - elemHeight - 50, newTop));
//   //     newLeft = Math.max(50, Math.min(parentWidth - elemWidth - 50, newLeft));

//   //     element.style.top = newTop + "px";
//   //     element.style.left = newLeft + "px";
//   //   }

//   //   function closeDragElement() {
//   //     document.onmouseup = null;
//   //     document.onmousemove = null;
//   //   }
//   // };

//   useEffect(() => {
//     // Add external CSS and script dynamically
//     const cssLink = document.createElement("link");
//     cssLink.rel = "stylesheet";
//     cssLink.href = "https://app.helloyubo.com/assets/focalyt_bot.bot.css";
//     document.head.appendChild(cssLink);

//     const script = document.createElement("script");
//     script.src = "https://app.helloyubo.com/assets/focalyt_bot.bot.js";
//     script.async = true;
//     document.body.appendChild(script);

//     // Drag functionality
//     // const botContainer = botContainerRef.current;
//     // if (botContainer) {
//     //   dragElement(botContainer); // Apply drag to the container div
//     // }

//     return () => {
//       // Cleanup CSS and script when component unmounts
//       document.head.removeChild(cssLink);
//       document.body.removeChild(script);
//     };
//   }, []);


//   useEffect(() => {

    
//     // Throttled scroll handler
//     let ticking = false;
//     const handleScroll = () => {
//       if (!ticking) {
//         requestAnimationFrame(() => {
//           const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          
//           // Update scroll states
//           const newIsScrolled = scrollTop > 50;
//           const newIsRevealed = scrollTop > 700;
          
//           if (newIsScrolled !== isScrolled) {
//             setIsScrolled(newIsScrolled);
//           }
          
//           if (newIsRevealed !== isRevealed) {
//             setIsRevealed(newIsRevealed);
//           }
          
//           ticking = false;
//         });
//         ticking = true;
//       }
//     };

//     // Resize handler
//     const handleResize = () => {
//       if (menuRef.current?.classList.contains("transition")) {
//         menuRef.current.classList.remove("transition");
//       }
//       if (menuOverlayRef.current?.classList.contains("transition")) {
//         menuOverlayRef.current.classList.remove("transition");
//       }

//       if (window.innerWidth > 991 && isMenuActive) {
//         toggleMenu();
//       }
//     };

//     // Add event listeners
//     window.addEventListener('scroll', handleScroll, { passive: true });
//     window.addEventListener('resize', handleResize);
//     document.addEventListener('click', handleClickOutside);

//     // Cleanup
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//       window.removeEventListener('resize', handleResize);
//       document.removeEventListener('click', handleClickOutside);
//     };
//   }, [isMenuActive, isScrolled, isRevealed]);

//   // Dynamic header classes
//   const headerClasses = [
    
//     'site-header--transparent',
//     'site-header--sticky',
//     'header-blur',
//     isScrolled ? 'scrolling' : '',
//     isRevealed ? 'reveal-header' : ''
//   ].filter(Boolean).join(' ');

//   // Dynamic header styles
//   // const headerStyles = {
//   //   backgroundColor: isScrolled ? '#ffffff' : '#121212',
//   // };

//   // Dynamic nav link styles
//   const navLinkStyles = {
//     color: isScrolled ? '#000' : '#000'
//   };

//   // Dynamic login button styles
//   const loginButtonStyles = {
//     backgroundColor: isScrolled ? '#FC2B5A' : '#fff',
//     color: isScrolled ? '#fff' : '#FC2B5A'
//   };

//   return (
//     <>
//       <div className="page-wrapper overflow-hidden">
//         <header className={headerClasses} ref={headerRef}>
//           <div className="container">
//             <nav className="navbar site-navbar">
//               {/* Logo - Left Side */}
//               <div className="brand-logo" ref={logoRef}>
//                 <a href="#">
//                   <img className="logo-light" src={logo} alt="brand logo" />
//                   <img className="logo-dark" src={logo} alt="brand logo" />
//                 </a>
//               </div>
              
//               {/* Navigation Links - Center */}
//               <div className="nav-center" ref={navLinksRef}>
//                 <ul className="site-menu-main" ref={menuMainRef} onClick={handleMenuClick}>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to="/" style={navLinkStyles}>Home</Link>
//                   </li>
//                   <li className="nav-item nav-item-has-children">
//                     <Link to="/about" className="nav-link-item drop-trigger" style={navLinkStyles}>About Us</Link>
//                   </li>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to="/socialimpact" style={navLinkStyles}>Social Impact</Link>
//                   </li>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to="/joblisting" style={navLinkStyles}>Jobs</Link>
//                   </li>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to='/courses' style={navLinkStyles}>Courses</Link>
//                   </li>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to='/labs' style={navLinkStyles}>Labs</Link>
//                   </li>
//                   <li className="nav-item">
//                     <Link className='nav-link-item drop-trigger' to='/events' style={navLinkStyles}>Events</Link>
//                   </li>
//                   <li className="nav-item d-xl-none d-lg-none d-md-none d-sm-block d-block">
//                     <Link className='nav-link-item drop-trigger' to='/contact' style={navLinkStyles}>Contact Us</Link>
//                   </li>
//                   <li className="nav-item d-xl-flex d-lg-flex d-md-flex d-sm-none d-none">
//                     <Link className='nav-link-item drop-trigger' to='/contact' style={navLinkStyles}>Contact Us</Link>
//                   </li>
//                 </ul>
//               </div>
              
//               {/* Login Button - Right Side */}
//               <div className="nav-right">
//                 <div 
//                   className={`dropdown-container ${isDropdownActive ? 'active' : ''}`}
//                   ref={dropdownRef}
//                 >
//                   <span 
//                     className="drop-trigger active_menu loginbtnn homeMenu" 
//                     id="loginLink"
//                     onClick={toggleDropdown}
//                     style={loginButtonStyles}
//                     ref={loginBtnRef}
//                   >
//                     Login
//                   </span>

//                   <ul className="dropdown-menu" id="loginDropdown">
//                     <li>
//                       <Link to={`${backendUrl}/company/login`} className="dropdown-item">
//                         Login as Corporate
//                       </Link>
//                     </li>
//                     <li>
//                       <Link to="/candidate/login" className="dropdown-item">
//                         Login as Student
//                       </Link>
//                     </li>
//                   </ul>
//                 </div>
//               </div>
              
//               {/* Mobile Menu Trigger */}
//               <div className="mobile-menu-trigger" onClick={toggleMenu}>
//                 <span></span>
//                 <span></span>
//                 <span></span>
//               </div>
              
//               {/*  Mobile Navigation Menu  */}
//             <div className={`mobile-nav ${isMenuActive ? 'active' : ''}`} id="mobile-nav" ref={menuRef}>
//                 {/* Close Button */}
//                 <div className="mobile-close-btn" onClick={toggleMenu}>
//                   <span></span>
//                   <span></span>
//                 </div>
                
//                 <nav className="nav-menu mobile-nav-menu">
//                     <Link to="/" className="nav-link" onClick={toggleMenu}>Home</Link>
//                     <Link to="/about" className="nav-link" onClick={toggleMenu}>About Us</Link>
//                     <Link to="/socialimpact" className="nav-link" onClick={toggleMenu}>Social Impact</Link>
//                     <Link to="/joblisting" className="nav-link" onClick={toggleMenu}>Jobs</Link>
//                     <Link to="/courses" className="nav-link" onClick={toggleMenu}>Courses</Link>
//                     <Link to="/labs" className="nav-link" onClick={toggleMenu}>Labs</Link>
//                     <Link to="/events" className="nav-link" onClick={toggleMenu}>Events</Link>
//                     <Link to="/contact" className="nav-link" onClick={toggleMenu}>Contact Us</Link>
//                 </nav>
//                 <div className="mobile-login">
//                     <div className="dropdown-container">
//                       <button className="login-btn" onClick={toggleDropdown}>Login</button>
//                       <ul className={`dropdown-menu ${isDropdownActive ? 'active' : ''}`}>
//                         <li>
//                           <Link to={`${backendUrl}/company/login`} className="dropdown-item" onClick={toggleMenu}>
//                             Login as Corporate
//                           </Link>
//                         </li>
//                         <li>
//                           <Link to="/candidate/login" className="dropdown-item" onClick={toggleMenu}>
//                             Login as Student
//                           </Link>
//                         </li>
//                       </ul>
//                     </div>
//                 </div>
//             </div>

//             {/* Mobile Menu Overlay */}
//             <div className={`mobile-nav-overlay ${isMenuActive ? 'active' : ''}`} ref={menuOverlayRef} onClick={toggleMenu}></div>

             
           
//             </nav>
//           </div>
//         </header>

        
//       </div>
//     </>
//   );
// };

// export default FrontHeader;
