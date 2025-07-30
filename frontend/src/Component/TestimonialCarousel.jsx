import React, { useState, useEffect } from 'react';
import './TestimonialCarousel.css';

const TestimonialCarousel = ({ testimonials = [], autoPlay = true, interval = 5000 }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Sample testimonials if none provided
  const defaultTestimonials = [
    {
      id: 1,
      name: "Sarah Johnson",
      role: "Web Developer",
      company: "TechCorp",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The course completely transformed my career. The hands-on projects and expert guidance helped me land my dream job as a web developer. Highly recommended!",
      course: "Full Stack Web Development"
    },
    {
      id: 2,
      name: "Michael Chen",
      role: "Data Scientist",
      company: "DataFlow Inc",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "Outstanding learning experience! The instructors are industry experts and the curriculum is perfectly structured. I'm now working on exciting AI projects.",
      course: "Data Science & AI"
    },
    {
      id: 3,
      name: "Emily Rodriguez",
      role: "Digital Marketing Manager",
      company: "GrowthFirst",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The digital marketing course exceeded my expectations. I learned practical strategies that I immediately applied to grow my business by 300%.",
      course: "Digital Marketing"
    },
    {
      id: 4,
      name: "David Thompson",
      role: "UI/UX Designer",
      company: "DesignStudio",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The design course helped me build a strong portfolio and understand user-centered design principles. I'm now working with top-tier clients.",
      course: "UI/UX Design"
    },
    {
      id: 5,
      name: "Lisa Wang",
      role: "Software Engineer",
      company: "InnovateTech",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The programming fundamentals course was exactly what I needed to switch careers. The support team and community are incredibly helpful.",
      course: "Programming Fundamentals"
    }
  ];

  const testimonialData = testimonials.length > 0 ? testimonials : defaultTestimonials;

  useEffect(() => {
    if (!autoPlay) return;

    const timer = setInterval(() => {
      nextSlide();
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, autoPlay, interval]);

  const nextSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev + 1) % testimonialData.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const prevSlide = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentIndex((prev) => (prev - 1 + testimonialData.length) % testimonialData.length);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setCurrentIndex(index);
    setTimeout(() => setIsTransitioning(false), 500);
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <i
        key={i}
        className={`fas fa-star ${i < rating ? 'text-warning' : 'text-muted'}`}
        style={{ fontSize: '14px' }}
      ></i>
    ));
  };

  return (
    <div className="testimonial-carousel-container">
      <div className="testimonial-header text-center mb-5">
        <h2 className="testimonial-title">What Our Students Say</h2>
        <p className="testimonial-subtitle">Success stories from our graduates</p>
      </div>

      <div className="testimonial-carousel">
        <div className="carousel-wrapper">
          <div className="carousel-content">
            {testimonialData.map((testimonial, index) => (
              <div
                key={testimonial.id}
                className={`testimonial-card ${index === currentIndex ? 'active' : ''} ${
                  index === (currentIndex - 1 + testimonialData.length) % testimonialData.length ? 'prev' : ''
                } ${
                  index === (currentIndex + 1) % testimonialData.length ? 'next' : ''
                }`}
              >
                <div className="testimonial-content">
                  <div className="quote-icon">
                    <i className="fas fa-quote-left"></i>
                  </div>
                  
                  <div className="testimonial-text">
                    <p>{testimonial.text}</p>
                  </div>

                  <div className="testimonial-author">
                    <div className="author-image">
                      <img 
                        src={testimonial.image} 
                        alt={testimonial.name}
                        onError={(e) => {
                          e.target.src = 'https://via.placeholder.com/150x150/6c757d/ffffff?text=' + testimonial.name.charAt(0);
                        }}
                      />
                    </div>
                    <div className="author-info">
                      <h5 className="author-name">{testimonial.name}</h5>
                      <p className="author-role">{testimonial.role}</p>
                      <p className="author-company">{testimonial.company}</p>
                      <div className="course-badge">
                        <span>{testimonial.course}</span>
                      </div>
                    </div>
                    <div className="rating">
                      {renderStars(testimonial.rating)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Arrows */}
        <button 
          className="carousel-nav carousel-prev" 
          onClick={prevSlide}
          aria-label="Previous testimonial"
        >
          <i className="fas fa-chevron-left"></i>
        </button>
        <button 
          className="carousel-nav carousel-next" 
          onClick={nextSlide}
          aria-label="Next testimonial"
        >
          <i className="fas fa-chevron-right"></i>
        </button>

        {/* Dots Indicator */}
        <div className="carousel-dots">
          {testimonialData.map((_, index) => (
            <button
              key={index}
              className={`dot ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to testimonial ${index + 1}`}
            ></button>
          ))}
        </div>
      </div>

      {/* Stats Section */}
      <div className="testimonial-stats">
        <div className="row text-center">
          <div className="col-md-3 col-6 mb-4">
            <div className="stat-item">
              <div className="stat-number">5000+</div>
              <div className="stat-label">Happy Students</div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-4">
            <div className="stat-item">
              <div className="stat-number">95%</div>
              <div className="stat-label">Success Rate</div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-4">
            <div className="stat-item">
              <div className="stat-number">50+</div>
              <div className="stat-label">Expert Instructors</div>
            </div>
          </div>
          <div className="col-md-3 col-6 mb-4">
            <div className="stat-item">
              <div className="stat-number">100+</div>
              <div className="stat-label">Corporate Partners</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCarousel; 