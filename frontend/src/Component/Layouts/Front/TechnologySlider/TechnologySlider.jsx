import React from 'react';
import Slider from 'react-slick';
import "./TechnologySlider.css"
// import { ChevronLeft, ChevronRight } from 'lucide-react';

const TechnologySlider = () => {
  const technologyItems = [
    {
      image: '/Assets/public_assets/images/iot.png',
      title: 'Internet of Things'
    },
    {
      image: '/Assets/public_assets/images/robotic.png',
      title: 'Robotics'
    },
    {
      image: '/Assets/public_assets/images/drone.png',
      title: 'Drone'
    },
    {
      image: '/Assets/public_assets/images/ai.png',
      title: 'Artificial Intelligence'
    }
  ];

  const PrevArrow = ({ onClick }) => (
    <button 
      onClick={onClick}
      className="custom-arrow prev d-none"
      aria-label="Previous slide"
    >
      {/* <ChevronLeft className="text-white" size={24} /> */}
    </button>
  );

  const NextArrow = ({ onClick }) => (
    <button
      onClick={onClick}
      className="custom-arrow next d-none"
      aria-label="Next slide"
    >
      {/* <ChevronRight className="text-white" size={24} /> */}
    </button>
  );

  const settings = {
    dots: false,
    infinite: true,
    speed: 500,
    autoplay:true,
    slidesToShow: 4,
    slidesToScroll: 1,
    prevArrow: <PrevArrow />,
    nextArrow: <NextArrow />,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3
        }
      },
      {
        breakpoint: 991,
        settings: {
          slidesToShow: 2
        }
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1
        }
      }
    ]
  };

  return (
    <div className="technology-slider-section">
      <div className="container">
        <h2 className="slider-title">
          <span className="gradient-text">Future</span> Technology Areas
        </h2>
        
        <div className="slider-container">
          <Slider {...settings}>
            {technologyItems.map((item, index) => (
              <div key={index} className="slide-wrapper">
                <div className="technology-slide">
                  <div className="image-container">
                    <a href="/candidate/login">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="tech-icon"
                    />
                    <h5 className="tech-title">{item.title}</h5>
                    </a>
                   
                  </div>
                  
                </div>
              </div>
            ))}
          </Slider>
        </div>
      </div>
      <style>
      {
        `
        .image-container a{
        display: flex;
        justify-content: center;
        align-items:center;
        flex-direction:column;
        gap:10px;
        outline:none;
        text-decoration:none;
        }
        .image-container a:focus{
        outline:none;
        }
        .image-container a:active{
        outline:none;
        }
        `
      }
    </style>
    </div>
    
  );
};

export default TechnologySlider;


// import React from 'react';
// import Slider from 'react-slick';
// import "./TechnologySlider.css"

// const TechnologySlider = () => {
//   const technologyItems = [
//     {
//       image: '/Assets/public_assets/images/banner_img/drone.png',
//       title: 'Drone'
//     },
//     {
//       image: '/Assets/public_assets/images/banner_img/ai.png',
//       title: 'AI'
//     },
//     {
//       image: '/Assets/public_assets/images/banner_img/robotics.png',
//       title: 'Robotics'
//     },
//     {
//       image: '/Assets/public_assets/images/banner_img/iot.png',
//       title: 'Internet of Things'
//     },
//     {
//       image: '/Assets/public_assets/images/banner_img/ar_vr.png',
//       title: 'AR/VR'
//     }
//   ];

//   const PrevArrow = ({ onClick }) => (
//     <button
//       onClick={onClick}
//       className="custom-arrow prev"
//       aria-label="Previous slide"
//     >
//       <span>&lt;</span>
//     </button>
//   );

//   const NextArrow = ({ onClick }) => (
//     <button
//       onClick={onClick}
//       className="custom-arrow next"
//       aria-label="Next slide"
//     >
//       <span>&gt;</span>
//     </button>
//   );

//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     // autoplay: true,
//     // autoplaySpeed: 3000,
//     slidesToShow: 2,
//     slidesToScroll: 1,
//     prevArrow: <PrevArrow />,
//     nextArrow: <NextArrow />,
//     responsive: [
//       {
//         breakpoint: 768,
//         settings: {
//           slidesToShow: 1,
//           slidesToScroll: 1
//         }
//       }
//     ]
//   };

//   return (
//     <div className="technology-slider-section">
//       <div className="container">
//         <div className="futureTechnologyArea">
//           {/* Left side - Title */}
//           <div className="futureTech">
//             <h2 className="slider-title">
//               <span className="gradient-text">Future Technology Areas</span>
//             </h2>
//             <p className="tech-description">
//               Explore cutting-edge technologies that are shaping the future of innovation
//             </p>
//           </div>
          
//           {/* Right side - Carousel */}
//           <div className="slider-container">
//             <Slider {...settings}>
//               {technologyItems.map((item, index) => (
//                 <div key={index} className="slide-wrapper">
//                   <div className="technology-slide">
//                     <div className="image-container">
//                       <a href="/candidate/login">
//                         <img
//                           src={item.image}
//                           alt={item.title}
//                           className="tech-icon"
//                         />
//                         <h5 className="tech-title">{item.title}</h5>
//                       </a>
//                     </div>
//                   </div>
//                 </div>
//               ))}
//             </Slider>
//           </div>
//         </div>
//       </div>

//       <style jsx>{`
//         .image-container a {
//           display: flex;
//           justify-content: center;
//           align-items: center;
//           flex-direction: column;
//           gap: 10px;
//           outline: none;
//           text-decoration: none;
//           color: inherit;
//         }
        
//         .image-container a:focus,
//         .image-container a:active {
//           outline: none;
//         }
        
//         .image-container a:hover .tech-title {
//           color: #ff3366;
//           transition: color 0.3s ease;
//         }
//       `}</style>

//       <style>
//         {
//           `
//           /* Main section styling */
// .technology-slider-section {
//   background: rgba(255, 255, 255, 0.5);
//   padding: 60px 0;
//   min-height: 400px;
// }

// .container {
//   max-width: 1200px;
//   margin: 0 auto;
//   padding: 0 20px;
// }

// /* Main flex container */
// .futureTechnologyArea {
//   display: flex;
//   align-items: center;
//   gap: 40px;
//   min-height: 300px;
// }

// /* Left side - Text content */
// .futureTech {
//   flex: 0 0 35%;
//   padding-right: 20px;
// }

// .slider-title {
//   margin: 0 0 20px 0;
//   font-size: 2.5rem;
//   font-weight: bold;
//   text-align: left;
// }

// .gradient-text {
//   background: linear-gradient(99deg, 
//     rgba(199, 51, 72, 1) 0%, 
//     rgba(81, 63, 139, 1) 25%, 
//     rgba(199, 51, 72, 1) 40%, 
//     rgba(81, 63, 139, 1) 75%, 
//     rgba(199, 51, 72, 1) 100%);
//   -webkit-background-clip: text;
//   -webkit-text-fill-color: transparent;
//   background-clip: text;
//   font-family: 'Space Grotesk', sans-serif;
//   line-height: 1.2;
// }

// .tech-description {
//   color: #666;
//   font-size: 1.1rem;
//   line-height: 1.6;
//   margin: 0;
// }

// /* Right side - Carousel container */
// .slider-container {
//   flex: 1;
//   position: relative;
//   width: 100%;
//   overflow: hidden;
// }

// /* Slide styling */
// .slide-wrapper {
//   padding: 10px;
//   height: 100%;
// }

// .technology-slide {
//   background: white;
//   border-radius: 12px;
//   padding: 30px 20px;
//   text-align: center;
//   height: 200px;
//   display: flex;
//   flex-direction: column;
//   align-items: center;
//   justify-content: center;
//   box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
//   transition: transform 0.3s ease, box-shadow 0.3s ease;
//   border: 2px solid transparent;
// }

// .technology-slide:hover {
//   transform: translateY(-5px);
//   box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
//   border-color: #ff3366;
// }

// .image-container {
//   height: 80px;
//   display: flex;
//   align-items: center;
//   justify-content: center;
//   margin-bottom: 15px;
// }

// .tech-icon {
//   max-height: 60px;
//   width: auto;
//   transition: transform 0.3s ease;
// }

// .technology-slide:hover .tech-icon {
//   transform: scale(1.1);
// }

// .tech-title {
//   margin: 0;
//   color: #333;
//   font-size: 1rem;
//   font-weight: 600;
//   transition: color 0.3s ease;
// }

// /* Custom arrow styles */
// .custom-arrow {
//   position: absolute;
//   top: 50%;
//   transform: translateY(-50%);
//   width: 45px;
//   height: 45px;
//   background: #ff3366;
//   border: none;
//   border-radius: 50%;
//   z-index: 10;
//   cursor: pointer;
//   display: flex !important;
//   align-items: center;
//   justify-content: center;
//   transition: all 0.3s ease;
//   box-shadow: 0 4px 15px rgba(255, 51, 102, 0.3);
// }

// .custom-arrow:hover {
//   background: #e62e5a;
//   transform: translateY(-50%) scale(1.1);
//   box-shadow: 0 6px 20px rgba(255, 51, 102, 0.4);
// }

// .custom-arrow span {
//   color: white;
//   font-size: 18px;
//   font-weight: bold;
// }

// .custom-arrow.prev {
//   left: -10px;
// }

// .custom-arrow.next {
//   right: -10px;
// }

// /* Dots styling */
// .slick-dots {
//   bottom: -50px;
//   text-align: center;
// }

// .slick-dots li {
//   margin: 0 5px;
// }

// .slick-dots li button:before {
//   font-size: 12px;
//   color: rgba(102, 102, 102, 0.5);
//   transition: color 0.3s ease;
// }

// .slick-dots li.slick-active button:before {
//   color: #ff3366;
// }

// .slick-dots li:hover button:before {
//   color: #ff3366;
// }

// /* Responsive design */
// @media (max-width: 991px) {
//   .futureTechnologyArea {
//     flex-direction: column;
//     gap: 30px;
//     text-align: center;
//   }
  
//   .futureTech {
//     flex: none;
//     padding-right: 0;
//     width: 100%;
//   }
  
//   .slider-title {
//     font-size: 2rem;
//     text-align: center;
//   }
  
//   .tech-description {
//     font-size: 1rem;
//     max-width: 600px;
//     margin: 0 auto;
//   }
  
//   .slider-container {
//     width: 100%;
//   }
  
//   .custom-arrow.prev {
//     left: -15px;
//   }
  
//   .custom-arrow.next {
//     right: -15px;
//   }
// }

// @media (max-width: 768px) {
//   .technology-slider-section {
//     padding: 40px 0;
//   }
  
//   .slider-title {
//     font-size: 1.75rem;
//     margin-bottom: 15px;
//   }
  
//   .tech-description {
//     font-size: 0.95rem;
//   }
  
//   .technology-slide {
//     padding: 25px 15px;
//     height: 180px;
//   }
  
//   .custom-arrow {
//     width: 40px;
//     height: 40px;
//   }
  
//   .custom-arrow span {
//     font-size: 16px;
//   }
// }

// @media (max-width: 576px) {
//   .container {
//     padding: 0 15px;
//   }
  
//   .slider-title {
//     font-size: 1.5rem;
//   }
  
//   .slide-wrapper {
//     padding: 5px;
//   }
  
//   .technology-slide {
//     height: 160px;
//     padding: 20px 10px;
//   }
  
//   .custom-arrow {
//     display: none !important;
//   }
// }

// /* Slick slider overrides */
// .slick-track {
//   display: flex;
//   align-items: stretch;
// }

// .slick-slide > div {
//   height: 100%;
// }

// .slick-slide > div > div {
//   height: 100%;
// }
//           `
//         }
//       </style>
//     </div>
//   );
// };

// export default TechnologySlider;

