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
                    <a href="https://app.focalyt.com/candidate/login">
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