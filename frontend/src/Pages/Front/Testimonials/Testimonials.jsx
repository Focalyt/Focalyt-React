import React from 'react';
import FrontLayout from '../../../Component/Layouts/Front/index';
import TestimonialCarousel from '../../../Component/TestimonialCarousel';

const Testimonials = () => {
  // Custom testimonials data (optional - the component has default data)
  const customTestimonials = [
    {
      id: 1,
      name: "Alex Johnson",
      role: "Senior Web Developer",
      company: "TechStart Inc",
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The Full Stack Development course at Focalyt completely changed my career trajectory. The hands-on projects and mentorship helped me land a senior position within 6 months.",
      course: "Full Stack Web Development"
    },
    {
      id: 2,
      name: "Maria Garcia",
      role: "Data Analyst",
      company: "DataCorp Solutions",
      image: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The Data Science program exceeded all my expectations. The instructors are industry experts and the curriculum is perfectly aligned with current market demands.",
      course: "Data Science & Analytics"
    },
    {
      id: 3,
      name: "David Chen",
      role: "Digital Marketing Specialist",
      company: "GrowthFirst Marketing",
      image: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The Digital Marketing course provided practical strategies that I immediately applied to grow my client's business by 250%. Highly recommended!",
      course: "Digital Marketing"
    },
    {
      id: 4,
      name: "Sarah Williams",
      role: "UI/UX Designer",
      company: "Creative Design Studio",
      image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The design course helped me build a strong portfolio and understand user-centered design principles. I'm now working with top-tier clients.",
      course: "UI/UX Design"
    },
    {
      id: 5,
      name: "Michael Brown",
      role: "Software Engineer",
      company: "InnovateTech",
      image: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=face",
      rating: 5,
      text: "The programming fundamentals course was exactly what I needed to switch careers. The support team and community are incredibly helpful.",
      course: "Programming Fundamentals"
    }
  ];

  return (
    <FrontLayout>
      {/* Hero Section */}
      <section className="hero-section bg-gradient-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">Student Success Stories</h1>
              <p className="lead mb-4">
                Discover how our courses have transformed careers and opened new opportunities for our students.
              </p>
              <div className="d-flex gap-3">
                <div className="text-center">
                  <div className="h3 mb-0">5000+</div>
                  <small>Happy Students</small>
                </div>
                <div className="text-center">
                  <div className="h3 mb-0">95%</div>
                  <small>Success Rate</small>
                </div>
                <div className="text-center">
                  <div className="h3 mb-0">50+</div>
                  <small>Expert Instructors</small>
                </div>
              </div>
            </div>
            <div className="col-lg-6 text-center">
              <div className="hero-image">
                <i className="fas fa-users" style={{ fontSize: '8rem', opacity: 0.3 }}></i>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial Carousel Section */}
      <section className="py-5">
        <div className="container">
          <TestimonialCarousel 
            testimonials={customTestimonials}
            autoPlay={true}
            interval={6000}
          />
        </div>
      </section>

      {/* Additional Content */}
      <section className="py-5 bg-light">
        <div className="container">
          <div className="row">
            <div className="col-lg-8 mx-auto text-center">
              <h2 className="mb-4">Why Students Choose Focalyt</h2>
              <div className="row g-4">
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-graduation-cap text-primary" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <h5 className="card-title">Expert Instructors</h5>
                      <p className="card-text">Learn from industry professionals with years of real-world experience.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-laptop-code text-primary" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <h5 className="card-title">Hands-on Projects</h5>
                      <p className="card-text">Build real-world projects that you can showcase in your portfolio.</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card h-100 border-0 shadow-sm">
                    <div className="card-body text-center p-4">
                      <div className="mb-3">
                        <i className="fas fa-users text-primary" style={{ fontSize: '2.5rem' }}></i>
                      </div>
                      <h5 className="card-title">Career Support</h5>
                      <p className="card-text">Get personalized career guidance and job placement assistance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-5 bg-primary text-white">
        <div className="container text-center">
          <h2 className="mb-4">Ready to Start Your Journey?</h2>
          <p className="lead mb-4">
            Join thousands of successful students who have transformed their careers with Focalyt.
          </p>
          <div className="d-flex gap-3 justify-content-center flex-wrap">
            <a href="/courses" className="btn btn-light btn-lg">
              <i className="fas fa-book me-2"></i>
              Explore Courses
            </a>
            <a href="/contact" className="btn btn-outline-light btn-lg">
              <i className="fas fa-phone me-2"></i>
              Contact Us
            </a>
          </div>
        </div>
      </section>
    </FrontLayout>
  );
};

export default Testimonials; 