import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './StuLabs.css';
import FrontLayout from '../../../Component/Layouts/Front';
const StuLabs = () => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Lab course offerings data
  const labCourses = [
    {
      id: 1,
      title: "Robotics & AI",
      ageGroup: "8-14 years",
      duration: "12 weeks",
      description: "Hands-on learning with robot building and programming basics for young innovators",
      icon: "/images/robot-icon.svg",
      features: ["Build your own robot", "Learn coding fundamentals", "Weekly challenges", "End-of-course competition"]
    },
    {
      id: 2,
      title: "Virtual Reality Creation",
      ageGroup: "10-16 years",
      duration: "10 weeks",
      description: "Design virtual worlds and interactive experiences using the latest VR technology",
      icon: "/images/vr-icon.svg",
      features: ["Create 3D environments", "Develop interactive games", "Experience your creations", "Showcase final projects"]
    },
    {
      id: 3,
      title: "Coding for Games",
      ageGroup: "9-15 years",
      duration: "8 weeks",
      description: "Learn programming through game development with fun, engaging projects",
      icon: "/images/game-icon.svg",
      features: ["Game design principles", "Logic and algorithm basics", "Create 2D games", "Multiplayer concepts"]
    },
    {
      id: 4,
      title: "Science & Innovation Lab",
      ageGroup: "7-13 years",
      duration: "12 weeks",
      description: "Explore scientific concepts through practical experiments and creative problem-solving",
      icon: "/images/science-icon.svg",
      features: ["Hands-on experiments", "Critical thinking challenges", "Scientific method application", "Innovation projects"]
    }
  ];

  // Facility features
  const facilities = [
    { icon: "fa-laptop-code", title: "State-of-the-art Computers", description: "Latest hardware and software for optimal learning" },
    { icon: "fa-robot", title: "Robotics Equipment", description: "Modern robotics kits and components for building" },
    { icon: "fa-vr-cardboard", title: "VR/AR Technology", description: "Immersive technology for cutting-edge experiences" },
    { icon: "fa-tools", title: "Maker Space", description: "Creative zone for building and designing projects" },
    { icon: "fa-chalkboard-teacher", title: "Expert Instructors", description: "Passionate educators with industry experience" },
    { icon: "fa-users", title: "Small Class Sizes", description: "Personalized attention with limited students per batch" }
  ];

  // Testimonials
  const testimonials = [
    {
      id: 1,
      name: "Priya Sharma",
      child: "Aryan, 12",
      quote: "The robotics program has completely transformed my son's interest in technology. He's now building his own projects at home!",
      image: "/images/parent1.jpg"
    },
    {
      id: 2,
      name: "Rajiv Mehta",
      child: "Isha, 10",
      quote: "My daughter used to be shy about STEM subjects, but after attending the Science & Innovation Lab, she's become confident and curious.",
      image: "/images/parent2.jpg"
    },
    {
      id: 3,
      name: "Ananya Patel",
      child: "Vikram, 14",
      quote: "The coding course gave my son practical skills that complement his school education. The project-based approach keeps him engaged.",
      image: "/images/parent3.jpg"
    }
  ];

  return (
    <FrontLayout>
    <div className="student-labs-container">
      {/* Hero Section */}
      <div className="hero-section">
        <div className="hero-content">
          <h1>Future-Ready Learning Labs</h1>
          <h2>Preparing your child for tomorrow's world, right in your neighborhood</h2>
          <p>Hands-on technology education designed to inspire creativity, critical thinking, and innovation</p>
          <div className="hero-buttons">
            <button className="primary-btn">Schedule a Visit</button>
            <button className="secondary-btn">Explore Courses</button>
          </div>
        </div>
        <div className="hero-image">
          <img src="/images/lab-hero.jpg" alt="Children learning in tech lab" />
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="tabs-container">
        <div className="tabs">
          <button 
            className={activeTab === 'overview' ? 'active' : ''} 
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button 
            className={activeTab === 'courses' ? 'active' : ''} 
            onClick={() => setActiveTab('courses')}
          >
            Courses
          </button>
          <button 
            className={activeTab === 'facilities' ? 'active' : ''} 
            onClick={() => setActiveTab('facilities')}
          >
            Facilities
          </button>
          <button 
            className={activeTab === 'testimonials' ? 'active' : ''} 
            onClick={() => setActiveTab('testimonials')}
          >
            Testimonials
          </button>
          <button 
            className={activeTab === 'locations' ? 'active' : ''} 
            onClick={() => setActiveTab('locations')}
          >
            Locations
          </button>
        </div>
      </div>

      {/* Overview Section */}
      {activeTab === 'overview' && (
        <div className="overview-section">
          <div className="overview-content">
            <div className="section-heading">
              <h2>Why Choose Our Tech Labs?</h2>
              <div className="heading-underline"></div>
            </div>
            
            <div className="benefits-grid">
              <div className="benefit-card">
                <div className="benefit-icon">
                  <i className="fas fa-map-marker-alt"></i>
                </div>
                <h3>Conveniently Local</h3>
                <p>Located right in your community, making quality tech education easily accessible</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <i className="fas fa-rocket"></i>
                </div>
                <h3>Future-Ready Skills</h3>
                <p>Curriculum designed to develop skills needed for the careers of tomorrow</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <i className="fas fa-hands-helping"></i>
                </div>
                <h3>Hands-On Learning</h3>
                <p>Project-based approach where students learn by creating and building</p>
              </div>
              
              <div className="benefit-card">
                <div className="benefit-icon">
                  <i className="fas fa-user-graduate"></i>
                </div>
                <h3>Expert Instructors</h3>
                <p>Passionate educators with real-world experience in technology fields</p>
              </div>
            </div>

            <div className="approach-container">
              <div className="approach-content">
                <h2>Our Approach to Learning</h2>
                <p>We believe children learn best through hands-on experiences that engage their curiosity and creativity. Our labs provide a safe, supportive environment where students can experiment, make mistakes, and develop confidence in their abilities.</p>
                <ul className="approach-list">
                  <li><i className="fas fa-check-circle"></i> Project-based learning that builds real-world skills</li>
                  <li><i className="fas fa-check-circle"></i> Collaborative environment that encourages teamwork</li>
                  <li><i className="fas fa-check-circle"></i> Personalized guidance tailored to each child's interests and abilities</li>
                  <li><i className="fas fa-check-circle"></i> Regular showcases where students present their work to parents</li>
                </ul>
              </div>
              <div className="approach-image">
                <img src="/images/approach-image.jpg" alt="Student working on project" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Courses Section */}
      {activeTab === 'courses' && (
        <div className="courses-section">
          <div className="section-heading">
            <h2>Our Futuristic Courses</h2>
            <div className="heading-underline"></div>
            <p>Designed to inspire curiosity and develop future-ready skills</p>
          </div>

          <div className="courses-grid">
            {labCourses.map(course => (
              <div className="course-card" key={course.id}>
                <div className="course-icon">
                  <img src={course.icon} alt={course.title} />
                </div>
                <div className="course-details">
                  <h3>{course.title}</h3>
                  <div className="course-meta">
                    <span><i className="fas fa-user-graduate"></i> {course.ageGroup}</span>
                    <span><i className="fas fa-clock"></i> {course.duration}</span>
                  </div>
                  <p>{course.description}</p>
                  <div className="course-features">
                    <h4>What your child will learn:</h4>
                    <ul>
                      {course.features.map((feature, index) => (
                        <li key={index}><i className="fas fa-check-circle"></i> {feature}</li>
                      ))}
                    </ul>
                  </div>
                  <button className="course-btn">Learn More</button>
                </div>
              </div>
            ))}
          </div>

          <div className="courses-cta">
            <h3>Looking for a specific topic?</h3>
            <p>We regularly update our course offerings based on the latest technological trends and parent feedback.</p>
            <button className="primary-btn">View All Courses</button>
          </div>
        </div>
      )}

      {/* Facilities Section */}
      {activeTab === 'facilities' && (
        <div className="facilities-section">
          <div className="section-heading">
            <h2>Our World-Class Facilities</h2>
            <div className="heading-underline"></div>
            <p>Equipped with the latest technology to provide the best learning experience</p>
          </div>

          <div className="facilities-grid">
            {facilities.map((facility, index) => (
              <div className="facility-card" key={index}>
                <div className="facility-icon">
                  <i className={`fas ${facility.icon}`}></i>
                </div>
                <h3>{facility.title}</h3>
                <p>{facility.description}</p>
              </div>
            ))}
          </div>

          <div className="facility-gallery">
            <h3>Take a Virtual Tour</h3>
            <div className="gallery-grid">
              <div className="gallery-item">
                <img src="/images/lab-interior-1.jpg" alt="Lab interior" />
              </div>
              <div className="gallery-item">
                <img src="/images/lab-interior-2.jpg" alt="Students working" />
              </div>
              <div className="gallery-item">
                <img src="/images/lab-interior-3.jpg" alt="Robotics equipment" />
              </div>
              <div className="gallery-item">
                <img src="/images/lab-interior-4.jpg" alt="VR equipment" />
              </div>
            </div>
            <button className="secondary-btn">Schedule a Visit</button>
          </div>
        </div>
      )}

      {/* Testimonials Section */}
      {activeTab === 'testimonials' && (
        <div className="testimonials-section">
          <div className="section-heading">
            <h2>What Parents Say</h2>
            <div className="heading-underline"></div>
            <p>Hear from parents whose children have experienced our labs</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map(testimonial => (
              <div className="testimonial-card" key={testimonial.id}>
                <div className="testimonial-content">
                  <div className="quote-icon">
                    <i className="fas fa-quote-left"></i>
                  </div>
                  <p className="testimonial-quote">{testimonial.quote}</p>
                  <div className="testimonial-author">
                    <div className="author-image">
                      <img src={testimonial.image} alt={testimonial.name} />
                    </div>
                    <div className="author-details">
                      <h4>{testimonial.name}</h4>
                      <p>Parent of {testimonial.child}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="parent-impact">
            <h3>The Impact on Your Child</h3>
            <div className="impact-stats">
              <div className="stat-item">
                <h4>95%</h4>
                <p>of parents report increased interest in STEM subjects</p>
              </div>
              <div className="stat-item">
                <h4>87%</h4>
                <p>notice improvement in problem-solving skills</p>
              </div>
              <div className="stat-item">
                <h4>91%</h4>
                <p>see enhanced creativity and critical thinking</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Locations Section */}
      {activeTab === 'locations' && (
        <div className="locations-section">
          <div className="section-heading">
            <h2>Our Lab Locations</h2>
            <div className="heading-underline"></div>
            <p>Conveniently located right in your neighborhood</p>
          </div>

          <div className="locations-grid">
            <div className="location-card">
              <div className="location-details">
                <h3>Rajiv Gandhi Nagar Center</h3>
                <p><i className="fas fa-map-marker-alt"></i> 123 Tech Park, Rajiv Gandhi Nagar</p>
                <p><i className="fas fa-phone"></i> +91 98765 43210</p>
                <p><i className="fas fa-clock"></i> Mon-Sat: 9 AM - 6 PM</p>
                <button className="location-btn">Get Directions</button>
              </div>
              <div className="location-map">
                <img src="/images/map-location-1.jpg" alt="Map location" />
              </div>
            </div>

            <div className="location-card">
              <div className="location-details">
                <h3>Vijay Nagar Center</h3>
                <p><i className="fas fa-map-marker-alt"></i> 45 Innovation Hub, Vijay Nagar</p>
                <p><i className="fas fa-phone"></i> +91 98765 43211</p>
                <p><i className="fas fa-clock"></i> Mon-Sat: 9 AM - 6 PM</p>
                <button className="location-btn">Get Directions</button>
              </div>
              <div className="location-map">
                <img src="/images/map-location-2.jpg" alt="Map location" />
              </div>
            </div>

            <div className="location-card">
              <div className="location-details">
                <h3>Indraprastha Center</h3>
                <p><i className="fas fa-map-marker-alt"></i> 78 Digital Zone, Indraprastha Colony</p>
                <p><i className="fas fa-phone"></i> +91 98765 43212</p>
                <p><i className="fas fa-clock"></i> Mon-Sat: 9 AM - 6 PM</p>
                <button className="location-btn">Get Directions</button>
              </div>
              <div className="location-map">
                <img src="/images/map-location-3.jpg" alt="Map location" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Call to Action Section */}
      <div className="cta-section">
        <div className="cta-content">
          <h2>Give Your Child the Gift of Future-Ready Skills</h2>
          <p>Enroll now for our upcoming sessions and secure a spot in our innovative learning labs</p>
          <div className="cta-buttons">
            <button className="primary-btn">Enroll Now</button>
            <button className="secondary-btn">Schedule a Visit</button>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="faq-section">
        <div className="section-heading">
          <h2>Frequently Asked Questions</h2>
          <div className="heading-underline"></div>
        </div>
        
        <div className="faq-grid">
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> What age groups do you cater to?</h3>
            <p>Our programs are designed for children between 7-16 years, with different courses tailored to specific age ranges.</p>
          </div>
          
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> Do children need prior experience?</h3>
            <p>No prior experience is necessary. Our courses are designed to accommodate beginners and provide challenges for those with some experience.</p>
          </div>
          
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> How large are the class sizes?</h3>
            <p>We maintain small class sizes of 8-12 students to ensure personalized attention and optimal learning.</p>
          </div>
          
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> What COVID safety measures are in place?</h3>
            <p>We follow all recommended safety protocols including regular sanitization, temperature checks, and optional mask policies.</p>
          </div>
          
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> How do I know which course is right for my child?</h3>
            <p>We offer a free assessment and consultation to help determine which program best suits your child's interests and abilities.</p>
          </div>
          
          <div className="faq-item">
            <h3><i className="fas fa-question-circle"></i> Are there opportunities to showcase their work?</h3>
            <p>Yes, we host regular showcase events where students present their projects to parents and peers.</p>
          </div>
        </div>
      </div>

      {/* Contact Section */}
      <div className="contact-section">
        <div className="contact-content">
          <div className="contact-form-container">
            <h2>Contact Us</h2>
            <p>Have questions? We're here to help!</p>
            <form className="contact-form">
              <div className="form-group">
                <label htmlFor="name">Your Name</label>
                <input type="text" id="name" placeholder="Enter your name" />
              </div>
              <div className="form-group">
                <label htmlFor="email">Email Address</label>
                <input type="email" id="email" placeholder="Enter your email" />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone Number</label>
                <input type="tel" id="phone" placeholder="Enter your phone number" />
              </div>
              <div className="form-group">
                <label htmlFor="message">Your Message</label>
                <textarea id="message" rows="4" placeholder="How can we help you?"></textarea>
              </div>
              <button type="submit" className="submit-btn">Send Message</button>
            </form>
          </div>
          
          <div className="contact-info-container">
            <div className="contact-info">
              <h3>Get in Touch</h3>
              <div className="info-item">
                <i className="fas fa-envelope"></i>
                <p>info@studentlabs.com</p>
              </div>
              <div className="info-item">
                <i className="fas fa-phone-alt"></i>
                <p>+91 800 123 4567</p>
              </div>
              <div className="info-item">
                <i className="fas fa-clock"></i>
                <p>Monday - Saturday: 9 AM - 6 PM</p>
              </div>
              <div className="social-media">
                <h3>Follow Us</h3>
                <div className="social-icons">
                  <a href="#" className="social-icon"><i className="fab fa-facebook-f"></i></a>
                  <a href="#" className="social-icon"><i className="fab fa-instagram"></i></a>
                  <a href="#" className="social-icon"><i className="fab fa-twitter"></i></a>
                  <a href="#" className="social-icon"><i className="fab fa-youtube"></i></a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    </FrontLayout>
  );
};

export default StuLabs;