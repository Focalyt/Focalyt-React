import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
    <style>
      {
        `
        
  /* Container with Slightly Futuristic Feel */
  .future-labs-container {
    max-width: 1280px;
    margin: 0 auto;
    padding: 0 20px;
    position: relative;
  }
  
  /* Tech-inspired Section Heading */
  .section-heading {
    text-align: center;
    margin-bottom: 4rem;
    position: relative;
  }
  
  .section-heading h2 {
    color: var(--tech-dark);
    font-size: 2.8rem;
    font-weight: 700;
    margin-bottom: 1rem;
    position: relative;
    display: inline-block;
  }
  
  .section-heading h2::after {
    content: '';
    position: absolute;
    bottom: -10px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: var(--gradient-primary);
    border-radius: 4px;
  }
  
  .section-heading p {
    font-size: 1.2rem;
    color: #555;
    max-width: 700px;
    margin: 1rem auto 0;
  }
  
  /* Futuristic Buttons */
  .tech-primary-btn {
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 14px 32px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: var(--transition);
    box-shadow: var(--box-shadow);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  
  .tech-primary-btn:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
  }
  
  .tech-primary-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(135deg, var(--tech-purple), var(--tech-blue));
    z-index: -1;
    transition: opacity 0.3s ease;
    opacity: 0;
  }
  
  .tech-primary-btn:hover::after {
    opacity: 1;
  }
  
  .tech-secondary-btn {
    background-color: transparent;
    color: var(--tech-blue);
    border: 2px solid var(--tech-blue);
    padding: 12px 30px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  
  .tech-secondary-btn:hover {
    color: white;
  }
  
  .tech-secondary-btn::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: var(--gradient-primary);
    z-index: -1;
    transition: transform 0.3s ease;
    transform: translateX(-100%);
  }
  
  .tech-secondary-btn:hover::after {
    transform: translateX(0);
  }
  
  /* Hero Section with Futuristic Elements */
  .tech-hero-section {
    background: var(--tech-dark);
    color: white;
    padding: 5rem 0;
    margin: 0 0 4rem;
    border-radius: 0 0 30px 30px;
    position: relative;
    overflow: hidden;
  }
  
  .tech-hero-section::before {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: 
      radial-gradient(circle at 25% 25%, rgba(0, 242, 255, 0.1) 0%, transparent 20%),
      radial-gradient(circle at 75% 75%, rgba(94, 92, 230, 0.1) 0%, transparent 20%);
    animation: rotate 30s linear infinite;
  }
  
  @keyframes rotate {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
  
  .tech-hero-content {
    display: flex;
    align-items: center;
    position: relative;
    z-index: 2;
  }
  
  .tech-hero-text {
    flex: 1;
    padding-right: 3rem;
  }
  
  .tech-hero-text h1 {
    font-size: 3.5rem;
    font-weight: 800;
    line-height: 1.2;
    margin-bottom: 1.5rem;
    background: linear-gradient(135deg, white, var(--neon-blue));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  
  .tech-hero-text h2 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: var(--tech-light);
    opacity: 0.9;
  }
  
  .tech-hero-text p {
    font-size: 1.1rem;
    color: var(--tech-light);
    opacity: 0.8;
    margin-bottom: 2.5rem;
    max-width: 600px;
  }
  
  .tech-hero-buttons {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
  }
  
  .tech-hero-image {
    flex: 1;
    position: relative;
  }
  
  .tech-hero-image img {
    border-radius: 16px;
    box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    animation: float 6s ease-in-out infinite;
  }
  
  @keyframes float {
    0% {
      transform: translateY(0px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }
    50% {
      transform: translateY(-20px);
      box-shadow: 0 25px 40px rgba(0, 0, 0, 0.2);
    }
    100% {
      transform: translateY(0px);
      box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
    }
  }
  
  /* High-Tech Features Section */
  .tech-features-section {
    padding: 4rem 0;
  }
  
  .tech-features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2.5rem;
    margin-bottom: 4rem;
  }
  
  .tech-feature-card {
    background: white;
    padding: 2.5rem;
    border-radius: var(--card-border-radius);
    box-shadow: var(--box-shadow);
    transition: var(--transition);
    position: relative;
    overflow: hidden;
    z-index: 1;
  }
  
  .tech-feature-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: var(--gradient-primary);
    z-index: 1;
  }
  
  .tech-feature-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
  }
  
  .tech-feature-icon {
    width: 80px;
    height: 80px;
    margin-bottom: 2rem;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--tech-light);
    border-radius: 20px;
    transition: var(--transition);
  }
  
  .tech-feature-card:hover .tech-feature-icon {
    box-shadow: var(--glow-effect);
  }
  
  .tech-feature-icon img {
    width: 50px;
    height: 50px;
    object-fit: contain;
  }
  
  .tech-feature-card h3 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--tech-dark);
    position: relative;
    padding-bottom: 0.8rem;
  }
  
  .tech-feature-card h3::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background: var(--tech-teal);
    border-radius: 3px;
  }
  
  .tech-feature-card p {
    color: #555;
    line-height: 1.7;
    margin-bottom: 1.5rem;
  }
  
  .tech-feature-list li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 0.8rem;
    color: #555;
  }
  
  .tech-feature-list li i {
    color: var(--tech-teal);
    margin-right: 0.8rem;
    font-size: 1.1rem;
    transform: translateY(2px);
  }
  
  /* Technology Showcase Section */
  .tech-showcase-section {
    padding: 4rem 0;
    background-color: var(--tech-light);
    border-radius: 30px;
    margin: 2rem 0;
  }
  
  .tech-showcase-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 2rem;
  }
  
  .tech-showcase-card {
    background: white;
    border-radius: var(--card-border-radius);
    overflow: hidden;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .tech-showcase-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.15);
  }
  
  .tech-showcase-image {
    height: 200px;
    overflow: hidden;
    position: relative;
  }
  
  .tech-showcase-image::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.8));
    opacity: 0;
    transition: var(--transition);
  }
  
  .tech-showcase-card:hover .tech-showcase-image::after {
    opacity: 1;
  }
  
  .tech-showcase-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .tech-showcase-card:hover .tech-showcase-image img {
    transform: scale(1.1);
  }
  
  .tech-showcase-content {
    padding: 1.5rem;
    flex-grow: 1;
    display: flex;
    flex-direction: column;
  }
  
  .tech-showcase-content h3 {
    font-size: 1.4rem;
    margin-bottom: 1rem;
    color: var(--tech-dark);
  }
  
  .tech-showcase-content p {
    color: #555;
    margin-bottom: 1.5rem;
    flex-grow: 1;
  }
  
  .tech-showcase-buttons {
    display: flex;
    gap: 1rem;
  }
  
  .tech-showcase-btn {
    background: var(--tech-light);
    color: var(--tech-dark);
    border: none;
    padding: 8px 16px;
    border-radius: 50px;
    font-size: 0.9rem;
    transition: var(--transition);
    flex: 1;
    text-align: center;
  }
  
  .tech-showcase-btn:hover {
    background: var(--tech-teal);
    color: white;
  }
  
  /* Course Cards for Tech Labs */
  .tech-courses-section {
    padding: 4rem 0;
  }
  
  .tech-courses-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2.5rem;
    margin-bottom: 3rem;
  }
  
  .tech-course-card {
    background: white;
    border-radius: var(--card-border-radius);
    overflow: hidden;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
    position: relative;
  }
  
  .tech-course-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
  }
  
  .tech-course-header {
    background: var(--gradient-primary);
    padding: 1.5rem;
    color: white;
    position: relative;
    overflow: hidden;
  }
  
  .tech-course-header::before {
    content: '';
    position: absolute;
    top: -50%;
    right: -50%;
    width: 100%;
    height: 200%;
    background: rgba(255, 255, 255, 0.1);
    transform: rotate(30deg);
  }
  
  .tech-course-title {
    font-size: 1.8rem;
    margin-bottom: 0.5rem;
    position: relative;
  }
  
  .tech-course-subtitle {
    font-size: 1rem;
    opacity: 0.9;
    position: relative;
  }
  
  .tech-course-body {
    padding: 2rem;
  }
  
  .tech-course-details {
    display: flex;
    margin-bottom: 2rem;
    flex-wrap: wrap;
    gap: 1.5rem;
  }
  
  .tech-course-detail {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .tech-course-detail i {
    color: var(--tech-blue);
  }
  
  .tech-course-description {
    margin-bottom: 2rem;
    color: #555;
    line-height: 1.7;
  }
  
  .tech-course-features {
    background: var(--tech-light);
    padding: 1.5rem;
    border-radius: 10px;
    margin-bottom: 2rem;
  }
  
  .tech-course-features h4 {
    font-size: 1.2rem;
    margin-bottom: 1rem;
    color: var(--tech-dark);
    position: relative;
    padding-left: 1.5rem;
  }
  
  .tech-course-features h4::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 10px;
    height: 10px;
    background: var(--tech-blue);
    border-radius: 50%;
  }
  
  .tech-feature-list li {
    margin-bottom: 0.8rem;
    padding-left: 2rem;
    position: relative;
  }
  
  .tech-feature-list li::before {
    content: '✓';
    position: absolute;
    left: 0;
    color: var(--tech-teal);
    font-weight: bold;
  }
  
  .tech-course-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .tech-course-price {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--tech-dark);
  }
  
  .tech-enroll-btn {
    background: var(--gradient-secondary);
    color: white;
    border: none;
    padding: 10px 25px;
    border-radius: 50px;
    font-weight: 600;
    transition: var(--transition);
  }
  
  .tech-enroll-btn:hover {
    box-shadow: 0 5px 15px rgba(0, 199, 190, 0.4);
    transform: translateY(-3px);
  }
  
  /* Advanced Tech Equipment Showcase */
  .tech-equipment-section {
    padding: 4rem 0;
    background: var(--tech-dark);
    border-radius: 30px;
    color: white;
    margin: 3rem 0;
  }
  
  .tech-equipment-section .section-heading h2 {
    color: white;
  }
  
  .tech-equipment-section .section-heading p {
    color: rgba(255, 255, 255, 0.8);
  }
  
  .tech-equipment-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 2rem;
  }
  
  .tech-equipment-card {
    background: var(--tech-gray);
    border-radius: var(--card-border-radius);
    padding: 2rem;
    text-align: center;
    transition: var(--transition);
    position: relative;
    overflow: hidden;
  }
  
  .tech-equipment-card::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 5px;
    background: var(--gradient-secondary);
    transform: scaleX(0);
    transform-origin: right;
    transition: transform 0.3s ease;
  }
  
  .tech-equipment-card:hover {
    transform: translateY(-5px);
  }
  
  .tech-equipment-card:hover::after {
    transform: scaleX(1);
    transform-origin: left;
  }
  
  .tech-equipment-icon {
    width: 80px;
    height: 80px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 1.5rem;
    transition: var(--transition);
  }
  
  .tech-equipment-card:hover .tech-equipment-icon {
    box-shadow: 0 0 15px rgba(0, 242, 255, 0.5);
  }
  
  .tech-equipment-icon img {
    width: 40px;
    height: 40px;
    object-fit: contain;
  }
  
  .tech-equipment-card h3 {
    font-size: 1.3rem;
    margin-bottom: 1rem;
    color: white;
  }
  
  .tech-equipment-card p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.95rem;
    line-height: 1.7;
  }
  
  /* Call to Action Section */
  .tech-cta-section {
    background: var(--gradient-primary);
    padding: 4rem 0;
    margin: 4rem 0;
    border-radius: 20px;
    color: white;
    position: relative;
    overflow: hidden;
  }
  
  .tech-cta-section::before {
    content: '';
    position: absolute;
    top: -30%;
    right: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .tech-cta-section::after {
    content: '';
    position: absolute;
    bottom: -30%;
    left: -10%;
    width: 300px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
  }
  
  .tech-cta-content {
    text-align: center;
    position: relative;
    z-index: 2;
    max-width: 800px;
    margin: 0 auto;
  }
  
  .tech-cta-content h2 {
    font-size: 2.5rem;
    margin-bottom: 1.5rem;
  }
  
  .tech-cta-content p {
    font-size: 1.2rem;
    margin-bottom: 2.5rem;
    opacity: 0.9;
  }
  
  .tech-cta-buttons {
    display: flex;
    justify-content: center;
    gap: 1.5rem;
  }
  
  .tech-cta-primary {
    background: white;
    color: var(--tech-blue);
    border: none;
    padding: 14px 32px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: var(--transition);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  .tech-cta-primary:hover {
    transform: translateY(-3px);
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.2);
  }
  
  .tech-cta-secondary {
    background: transparent;
    color: white;
    border: 2px solid white;
    padding: 12px 30px;
    border-radius: 50px;
    font-weight: 600;
    font-size: 1rem;
    transition: var(--transition);
  }
  
  .tech-cta-secondary:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-3px);
  }
  
  /* Testimonials Section */
  .tech-testimonials-section {
    padding: 4rem 0;
  }
  
  .tech-testimonials-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2.5rem;
  }
  
  .tech-testimonial-card {
    background: white;
    border-radius: var(--card-border-radius);
    padding: 2.5rem;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
    position: relative;
  }
  
  .tech-testimonial-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 25px rgba(0, 0, 0, 0.15);
  }
  
  .tech-testimonial-rating {
    margin-bottom: 1.5rem;
    color: #ffb400;
  }
  
  .tech-testimonial-content {
    margin-bottom: 2rem;
    color: #555;
    font-style: italic;
    line-height: 1.8;
    position: relative;
  }
  
  .tech-testimonial-content::before {
    content: '"';
    font-size: 5rem;
    position: absolute;
    top: -2.5rem;
    left: -1rem;
    color: rgba(94, 92, 230, 0.1);
    font-family: serif;
  }
  
  .tech-testimonial-author {
    display: flex;
    align-items: center;
  }
  
  .tech-author-image {
    width: 60px;
    height: 60px;
    border-radius: 50%;
    overflow: hidden;
    margin-right: 1rem;
  }
  
  .tech-author-image img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  
  .tech-author-info h4 {
    font-size: 1.2rem;
    margin-bottom: 0.3rem;
    color: var(--tech-dark);
  }
  
  .tech-author-info p {
    color: #777;
    font-size: 0.9rem;
  }
  
  /* Contact Section */
  .tech-contact-section {
    padding: 4rem 0;
    background: var(--tech-light);
    border-radius: 30px;
    margin-bottom: 4rem;
  }
  
  .tech-contact-container {
    display: flex;
    gap: 3rem;
    flex-wrap: wrap;
  }
  
  .tech-contact-form {
    flex: 2;
    min-width: 350px;
    background: white;
    padding: 2.5rem;
    border-radius: var(--card-border-radius);
    box-shadow: var(--box-shadow);
  }
  
  .tech-contact-form h3 {
    font-size: 2rem;
    margin-bottom: 2rem;
    color: var(--tech-dark);
    position: relative;
    padding-bottom: 1rem;
  }
  
  .tech-contact-form h3::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 60px;
    height: 4px;
    background: var(--gradient-primary);
    border-radius: 2px;
  }
  
  .tech-form-group {
    margin-bottom: 1.5rem;
  }
  
  .tech-form-group label {
    display: block;
    margin-bottom: 0.8rem;
    color: var(--tech-dark);
    font-weight: 600;
  }
  
  .tech-form-group input,
  .tech-form-group textarea {
    width: 100%;
    padding: 1rem;
    border: 1px solid #ddd;
    border-radius: 8px;
    font-family: inherit;
    font-size: 1rem;
    transition: var(--transition);
  }
  
  .tech-form-group input:focus,
  .tech-form-group textarea:focus {
    outline: none;
    border-color: var(--tech-blue);
    box-shadow: 0 0 0 3px rgba(10, 132, 255, 0.2);
  }
  
  .tech-form-submit {
    background: var(--gradient-primary);
    color: white;
    border: none;
    padding: 1rem 2rem;
    border-radius: 8px;
    font-weight: 600;
    font-size: 1rem;
    width: 100%;
    transition: var(--transition);
    cursor: pointer;
    margin-top: 1rem;
  }
  
  .tech-form-submit:hover {
    box-shadow: 0 10px 20px rgba(10, 132, 255, 0.3);
    transform: translateY(-3px);
  }
  
  .tech-contact-info {
    flex: 1;
    min-width: 300px;
  }
  
  .tech-info-card {
    background: white;
    border-radius: var(--card-border-radius);
    padding: 2.5rem;
    box-shadow: var(--box-shadow);
    margin-bottom: 2rem;
  }
  
  .tech-info-card h3 {
    font-size: 1.5rem;
    margin-bottom: 2rem;
    color: var(--tech-dark);
    position: relative;
    padding-bottom: 1rem;
  }
  
  .tech-info-card h3::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background: var(--tech-teal);
    border-radius: 2px;
  }
  
  .tech-info-item {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1.5rem;
  }
  
  .tech-info-icon {
    width: 45px;
    height: 45px;
    background: var(--tech-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 1rem;
    flex-shrink: 0;
  }
  
  .tech-info-icon i {
    color: var(--tech-blue);
    font-size: 1.2rem;
  }
  
  .tech-info-content p {
    color: #555;
    line-height: 1.6;
  }
  
  .tech-social-icons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .tech-social-icon {
    width: 40px;
    height: 40px;
    background: var(--tech-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--tech-dark);
    transition: var(--transition);
  }
  
  .tech-social-icon:hover {
    background: var(--tech-blue);
    color: white;
    transform: translateY(-3px);
  }
  
  /* Footer Section */
  .tech-footer {
    background: var(--tech-dark);
    color: white;
    padding: 4rem 0 2rem;
    border-radius: 30px 30px 0 0;
  }
  
  .tech-footer-content {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 3rem;
    margin-bottom: 3rem;
  }
  
  .tech-footer-column h3 {
    font-size: 1.5rem;
    margin-bottom: 1.5rem;
    color: white;
    position: relative;
    padding-bottom: 0.8rem;
  }
  
  .tech-footer-column h3::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    width: 40px;
    height: 3px;
    background: var(--tech-teal);
    border-radius: 2px;
  }
  
  .tech-footer-about p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1.5rem;
    line-height: 1.7;
  }
  
  .tech-footer-links li {
    margin-bottom: 1rem;
  }
  
  .tech-footer-links a {
    color: rgba(255, 255, 255, 0.7);
    transition: var(--transition);
    display: inline-flex;
    align-items: center;
  }
  
  .tech-footer-links a:hover {
    color: var(--tech-teal);
    transform: translateX(5px);
  }
  
  .tech-footer-links a i {
    margin-right: 0.8rem;
    font-size: 0.8rem;
  }
  
  .tech-footer-contact li {
    display: flex;
    align-items: flex-start;
    margin-bottom: 1.5rem;
    color: rgba(255, 255, 255, 0.7);
  }
  
  .tech-footer-contact li i {
    margin-right: 1rem;
    color: var(--tech-teal);
  }
  
  .tech-footer-newsletter p {
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 1.5rem;
    line-height: 1.7;
  }
  
  .tech-newsletter-form {
    display: flex;
    margin-bottom: 1.5rem;
  }
  
  .tech-newsletter-input {
    flex-grow: 1;
    padding: 0.8rem 1rem;
    border: none;
    border-radius: 8px 0 0 8px;
    font-family: inherit;
  }
  
  .tech-newsletter-input:focus {
    outline: none;
  }
  
  .tech-newsletter-btn {
    background: var(--tech-teal);
    color: white;
    border: none;
    padding: 0 1.5rem;
    border-radius: 0 8px 8px 0;
    cursor: pointer;
    transition: var(--transition);
  }
  
  .tech-newsletter-btn:hover {
    background: var(--neon-blue);
  }
  
  .tech-footer-bottom {
    text-align: center;
    padding-top: 2rem;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
  }
  
  .tech-footer-bottom p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 0.9rem;
  }
  
  /* Media Queries for Responsive Design */
  @media (max-width: 1024px) {
    .tech-hero-text h1 {
      font-size: 3rem;
    }
    
    .tech-hero-content {
      flex-direction: column;
      text-align: center;
    }
    
    .tech-hero-text {
      padding-right: 0;
      margin-bottom: 3rem;
    }
    
    .tech-hero-buttons {
      justify-content: center;
    }
    
    .tech-cta-buttons {
      flex-direction: column;
      max-width: 350px;
      margin: 0 auto;
    }
  }
  
  @media (max-width: 768px) {
    .section-heading h2 {
      font-size: 2.2rem;
    }
    
    .tech-hero-text h1 {
      font-size: 2.5rem;
    }
    
    .tech-hero-text h2 {
      font-size: 1.3rem;
    }
    
    .tech-cta-content h2 {
      font-size: 2rem;
    }
    
    .tech-feature-card {
      padding: 2rem;
    }
    
    .tech-course-header {
      padding: 1.2rem;
    }
    
    .tech-course-body {
      padding: 1.5rem;
    }
    
    .tech-contact-form,
    .tech-info-card {
      padding: 2rem;
    }
  }
  
  @media (max-width: 576px) {
    .tech-hero-text h1 {
      font-size: 2rem;
    }
    
    .tech-hero-buttons,
    .tech-course-footer {
      flex-direction: column;
      gap: 1rem;
    }
    
    .tech-hero-section,
    .tech-showcase-section,
    .tech-equipment-section,
    .tech-contact-section {
      border-radius: 20px;
    }
    
    .tech-feature-card,
    .tech-contact-form,
    .tech-info-card {
      padding: 1.5rem;
    }
    
    .tech-course-details {
      gap: 1rem;
    }
  }
  
  /* Special Tech Lab Elements */
  .tech-lab-highlight {
    background: linear-gradient(135deg, rgba(10, 132, 255, 0.1), rgba(0, 242, 255, 0.1));
    border-radius: 20px;
    padding: 3rem;
    margin: 4rem 0;
    position: relative;
    overflow: hidden;
  }
  
  .tech-lab-highlight::before {
    content: '';
    position: absolute;
    top: -10px;
    right: -10px;
    width: 70px;
    height: 70px;
    background: var(--tech-teal);
    opacity: 0.2;
    border-radius: 50%;
    z-index: 0;
  }
  
  .tech-lab-content {
    display: flex;
    gap: 3rem;
    align-items: center;
    position: relative;
    z-index: 1;
  }
  
  .tech-lab-text {
    flex: 1;
  }
  
  .tech-lab-text h3 {
    font-size: 2rem;
    margin-bottom: 1.5rem;
    color: var(--tech-dark);
  }
  
  .tech-lab-text p {
    color: #555;
    margin-bottom: 2rem;
    line-height: 1.7;
  }
  
  .tech-lab-image {
    flex: 1;
  }
  
  .tech-lab-image img {
    border-radius: 15px;
    box-shadow: var(--box-shadow);
  }
  
  .tech-tech-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 2rem;
    margin: 3rem 0;
  }
  
  .tech-tech-item {
    background: white;
    padding: 1.5rem;
    border-radius: var(--border-radius);
    box-shadow: var(--box-shadow);
    text-align: center;
    transition: var(--transition);
  }
  
  .tech-tech-item:hover {
    transform: translateY(-5px);
  }
  
  .tech-tech-icon {
    font-size: 2.5rem;
    color: var(--tech-blue);
    margin-bottom: 1rem;
  }
  
  .tech-tech-item h4 {
    font-size: 1.3rem;
    margin-bottom: 0.5rem;
    color: var(--tech-dark);
  }
  
  .tech-tech-item p {
    color: #555;
    font-size: 0.9rem;
  }
  
  /* Animations for Tech Elements */
  @keyframes glow {
    0% {
      box-shadow: 0 0 5px rgba(0, 242, 255, 0.5);
    }
    50% {
      box-shadow: 0 0 20px rgba(0, 242, 255, 0.5);
    }
    100% {
      box-shadow: 0 0 5px rgba(0, 242, 255, 0.5);
    }
  }
  
  .glow-effect {
    animation: glow 3s infinite;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fade-in-up {
    animation: fadeInUp 0.8s ease forwards;
  }
  
  .tech-lab-specific {
    margin-top: 4rem;
  }
  
  .tech-lab-specific h3 {
    font-size: 2rem;
    text-align: center;
    margin-bottom: 3rem;
    color: var(--tech-dark);
    position: relative;
  }
  
  .tech-lab-specific h3::after {
    content: '';
    position: absolute;
    bottom: -15px;
    left: 50%;
    transform: translateX(-50%);
    width: 80px;
    height: 4px;
    background: var(--gradient-primary);
    border-radius: 2px;
  }
  
  .tech-lab-cards {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 2.5rem;
  }
  
  .tech-lab-card {
    background: white;
    border-radius: var(--card-border-radius);
    overflow: hidden;
    box-shadow: var(--box-shadow);
    transition: var(--transition);
  }
  
  .tech-lab-card:hover {
    transform: translateY(-10px);
    box-shadow: 0 20px 30px rgba(0, 0, 0, 0.15);
  }
  
  .tech-lab-img {
    height: 200px;
    overflow: hidden;
  }
  
  .tech-lab-img img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s ease;
  }
  
  .tech-lab-card:hover .tech-lab-img img {
    transform: scale(1.1);
  }
  
  .tech-lab-info {
    padding: 2rem;
  }
  
  .tech-lab-info h4 {
    font-size: 1.5rem;
    margin-bottom: 1rem;
    color: var(--tech-dark);
  }
  
  .tech-lab-info p {
    color: #555;
    margin-bottom: 1.5rem;
    line-height: 1.7;
  }
  
  .tech-lab-features {
    margin-bottom: 1.5rem;
  }
  
  .tech-lab-features li {
    display: flex;
    align-items: center;
    margin-bottom: 0.8rem;
    color: #555;
  }
  
  .tech-lab-features li i {
    color: var(--tech-teal);
    margin-right: 0.8rem;
  }
  
  .tech-lab-button {
    display: inline-block;
    background: var(--gradient-primary);
    color: white;
    padding: 10px 25px;
    border-radius: 50px;
    text-align: center;
    transition: var(--transition);
  }
  
  .tech-lab-button:hover {
    transform: translateY(-3px);
    box-shadow: 0 10px 20px rgba(10, 132, 255, 0.3);
  }
        `
      }
    </style>
    </FrontLayout>
  );
};

export default StuLabs;