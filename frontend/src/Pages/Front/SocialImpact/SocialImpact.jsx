import { useEffect, React } from "react";
import $ from 'jquery';

import 'slick-carousel';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FrontLayout from "../../../Component/Layouts/Front";
function SocialImpact() {

    useEffect(() => {
        // Helper function to initialize sliders
        const initSlickSlider = (selector, settings) => {
            if ($(selector).length > 0 && !$(selector).hasClass("slick-initialized")) {
                $(selector).slick(settings);
            }
        };

        // Initialize multiple Slick sliders
        initSlickSlider("#happy_candidate .slider_images", {
            dots: false,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 1 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        initSlickSlider("#happy_candidate_images .happy_candidate_images", {
            dots: false,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 1 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        initSlickSlider("#mobilization .slider_images", {
            dots: true,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        initSlickSlider("#hostel .slider_images", {
            dots: false,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        initSlickSlider("#trainings .slider_images", {
            dots: true,
            infinite: true,
            slidesToShow: 3,
            slidesToScroll: 1,
            arrows: false,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        initSlickSlider("#Placement .slider_images", {
            dots: true,
            infinite: true,
            slidesToShow: 1,
            slidesToScroll: 1,
            arrows: true,
            autoplay: true,
            autoplaySpeed: 2000,
            responsive: [
                { breakpoint: 1366, settings: { slidesToShow: 1 } },
                { breakpoint: 768, settings: { slidesToShow: 1 } },
            ],
        });

        return () => {
            // Cleanup: Destroy sliders when unmounting
            try {
                $(".slick-initialized").each(function() {
                    if ($(this).hasClass('slick-initialized')) {
                        $(this).slick("unslick");
                    }
                });
            } catch (error) {
                console.warn('Error destroying slick sliders:', error);
            }
        };
    }, []);

    return (
        <>
            <FrontLayout>
                <section className="section-padding-30 mt-5"></section>
                <section>
                    {/* <!-- training_partners --> */}
                    <div className="container-fluid bg-white">
                        <div className="Partners">
                            <h3 className="affiliated_partner bg-white">Affiliated Training Partner</h3>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="affilated_partner_image">
                                        <figure>
                                            <img src="/Assets/public_assets/images/brand.png" alt="" />
                                        </figure>
                                    </div>
                                </div>

                                {/* <!-- <div className="col-md-3">
                                <div className="partner_image">

                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="partner_image"></div>
                            </div>
                            <div className="col-md-3">
                                <div className="partner_image"></div>
                            </div>
                            <div className="col-md-3">
                                <div className="partner_image"></div>
                            </div> --> */}
                            </div>
                        </div>
                    </div>
                </section>
           {/* <!-- trainig centers  --> */}
           <section>
                    <div className="container-fluid training-centres">
                        <div className="text-center">
                            <h3 className="section-title">Training Centres</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Ghaziabad.jpg" alt="Ghaziabad" />
                                    </figure>
                                    <h4 className="centre-name">Ghaziabad</h4>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Hamirpur.jpg" alt="Hamirpur" />
                                    </figure>
                                    <h4 className="centre-name">Hamirpur</h4>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Shahpur.jpg" alt="Shahpur" />
                                    </figure>
                                    <h4 className="centre-name">Shahpur</h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="partners">
                    <div className="container-fluid bg-white">
                        <div className="main_partners">
                            <h3 className="affiliated_partner bg-white">Our Partners</h3>

                            <div className="row">
                                <div className="col-md-12">
                                    <div className="affilated_partner_image">
                                        <figure>
                                            <img src="/Assets/public_assets/images/brand2.png" alt="" />
                                        </figure>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <!-- projects  --> */}
                <section>
                    {/* <!-- training_partners --> */}
                    <div className="container-fluid bg-white">
                        <div className="Partners">
                            <h3 className="affiliated_partner bg-white">Key Govt. Project and Clients</h3>
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="affilated_partner_image">
                                        <figure>
                                            <img src="/Assets/public_assets/images/brand3.png" alt="" />
                                        </figure>
                                    </div>
                                    <div className="affilated_partner_image">
                                        <figure>
                                            <img src="/Assets/public_assets/images/brand4.png" alt="" />
                                        </figure>
                                    </div>
                                </div>


                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- mobilization  --> */}
                <section>
                    <div className="container-fluid training-centres">
                        <div className="text-center">
                            <h3 className="section-title text-white">Mobilization</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-12">
                                <div className="mobilization" id="mobilization">
                                    <div className="slider_images">
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-1.jpg"
                                                className="d-block w-100"
                                                alt="video1"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-3.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-4.png"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-5.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-6.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-7.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/MOBILIZATION-8.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- hostel --> */}
                <section className="bg-white">
                    <div className="container-fluid">
                        <div className="text-center">
                            <h3 className="section-title text-black">Hostel Facilities</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-12">
                                <div className="mobilization" id="hostel">
                                    <div className="slider_images">
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/hOSTEL-FACILITIES-2.jpg"
                                                className="d-block w-100"
                                                alt="Hostel Facility 1"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/hOSTEL-FACILITIES.jpg"
                                                className="d-block w-100"
                                                alt="Hostel Facility 2"
                                            />
                                        </div>
                                        {/* <!-- <div>
                                        <img
                                            src="public_assets/images/hOSTEL-FACILITIES-2.jpg"
                                            className="d-block w-100"
                                            alt="Hostel Facility 3"
                                        />
                                    </div> --> */}
                                        {/* <!-- <div>
                                        <img
                                            src="public_assets/images/hOSTEL-FACILITIES-2.jpg"
                                            className="d-block w-100"
                                            alt="Hostel Facility 1"
                                        />
                                    </div> --> */}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Training Facilities --> */}
                <section className="bg-white">
                    <div className="container-fluid">
                        <div className="text-center">
                            <h3 className="section-title text-black">Training Facilities</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-12">
                                <div className="mobilization" id="trainings">
                                    <div className="slider_images">
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/TRAINING-FACILITIES-1.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/TRAINING-FACILITIES-3.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                        <div>

                                            <img
                                                src="/Assets/public_assets/images/TRAINING-FACILITIES-2-1.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />

                                        </div>
                                        <div>
                                            <img
                                                src="/Assets/public_assets/images/TRAINING-FACILITIES-3.jpg"
                                                className="d-block w-100"
                                                alt="video3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Placement --> */}
                <section>
                    <div className="container-fluid training-centres">
                        <div className="text-center">
                            <h3 className="section-title text-white">Placement and Entrepreneurship</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-10">
                                <div className="mobilization" id="Placement">
                                    <div className="slider_images">
                                        <div className='place'>
                                            <img
                                                src="/Assets/public_assets/images/placement-pic-2.jpg"
                                                className="d-block w-75"
                                                alt="video3"
                                            />
                                        </div>
                                        <div className='place'>
                                            <img
                                                src="/Assets/public_assets/images/placement-pic-3.jpg"
                                                className="d-block w-75"
                                                alt="video3"
                                            />
                                        </div>
                                        <div className='place'>
                                            <img
                                                src="/Assets/public_assets/images/placement-pic-4.jpg"
                                                className="d-block w-75"
                                                alt="video3"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Media Coverage  --> */}
                <section>
                    <div className="container-fluid training-centres">
                        <div className="text-center">
                            <h3 className="section-title">Media Coverage</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER2.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER3.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER4.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER5.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER6.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-4 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/NEWSPAPER7.png" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Extra curricular Activity  --> */}
                <section className="bg-white">
                    <div className="container-fluid">
                        <div className="text-center">
                            <h3 className="section-title">Extra Curricular Activity</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/ACTIVITIES-4.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/ACTIVITIES-2.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/ACTIVITIES-1.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/ACTIVITIES-3.jpg" alt="" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Project Launches  --> */}
                <section className="bg-white">
                    <div className="container-fluid">
                        <div className="text-center">
                            <h3 className="section-title">Project Launches</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-6 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/DSC_5654.jpg" alt="" />
                                    </figure>
                                    <h4 className="centre-name">
                                        Inauguration of Focal Skill Training Center at Bhagat Phool Singh
                                        Women University
                                    </h4>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Untitled-design.png" alt="" />
                                    </figure>
                                    <h4 className="centre-name">
                                        Inauguration of Focal Skill Training Center at Manesar, Haryana
                                    </h4>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Untitled-design-2.png" alt="" />
                                    </figure>
                                    <h4 className="centre-name">
                                        Inauguration and Launch of 18 Skill Van RPL Project at Lucknow,
                                        Uttar Pradesh
                                    </h4>
                                </div>
                            </div>
                            <div className="col-md-6 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/Untitled-design-3.png" alt="" />
                                    </figure>
                                    <h4 className="centre-name">
                                        E-Waste Art Sculpture Inauguration Ceremony with Panasonic (Harit
                                        Umang)
                                    </h4>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                {/* <!-- Awards and Recognition  --> */}
                <section>
                    <div className="container-fluid training-centres">
                        <div className="text-center">
                            <h3 className="section-title text-white">Awards and Recognition</h3>
                        </div>
                        <div className="row justify-content-center">
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/AWARD-5.png" alt="Ghaziabad" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/AWARD-2.png" alt="Hamirpur" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/AWARD-4.png" alt="Shahpur" />
                                    </figure>
                                </div>
                            </div>
                            <div className="col-md-3 col-sm-6 mb-4">
                                <div className="centre-card">
                                    <figure>
                                        <img src="/Assets/public_assets/images/AWARD-3.png" alt="Shahpur" />
                                    </figure>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <style>
                    {
                        `
                        .place{
                        display:flex!important;
                        align-items:center;
                        justify-content:center
                        }
                        `
                    }
                </style>
                <style>
                    {
                        `
                        .training-centres {
    background-color: #000; 
    padding-bottom:20px;
  }
  
  .section-title {
    font-size: 28px;
    color: #FF3366; 
    font-weight: bold;
   padding-block: 20px;
  }
  
  /* Centre Card Styling */
  .centre-card {
    text-align: center;
    background-color: #111; 
    border-radius: 15px; 
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.5); 
    padding: 15px 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  /* Hover Effect */
  .centre-card:hover {
    transform: translateY(-10px); 
    /* box-shadow: 0px 12px 20px rgba(255, 51, 102, 0.8);  */
  }
  
  /* Image Styling */
  .centre-card figure img {
    width: 100%;
    border-radius: 10px; 
    /* border: 5px solid #ff3366;  */
  }
  
 
  .centre-name {
    margin-top: 15px;
    font-size: 18px;
    font-weight: bold;
    color: #ff3366; 
    text-transform: uppercase;
  }

  #mobilization .slider_images img, #hostel .slider_images img, #trainings .slider_images img {
    border-radius: 25px;
    padding: 10px;
  }
 
#trainings .slider_images > div {
  padding: 10px;
}


#trainings .slider_images img {
  width: 95%!important;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); 
}


#trainings .slider_images {
  display: flex;
  gap: 10px; 
}


#trainings .slick-dots, #hostel .slick-dots {
  position: absolute;
  bottom: -25px;
  /* Adjust position */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 10px;
  list-style: none;
  z-index: 10;
}

#trainings .slick-dots li button, #hostel .slick-dots li button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #aaa;
  /* Default dot color */
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#trainings .slick-dots li button:before , #hostel .slick-dots li button:before{
  color: transparent;
}

#trainings .slick-dots li.slick-active button , #hostel .slick-dots li.slick-active button {
  background-color: #FC2B5A;
}

#trainings .slick-dots li button:hover , #hostel .slick-dots li button:hover,#hostel .slick-dots li button:hover{
  background-color: #333;
}
.mobilization .slick-prev, 
.mobilization .slick-next {
  width: 40px;
  height: 40px;
  background-color: rgb(254, 4, 4) !important;
  border-radius: 50%;
  z-index: 10;
}

  /* Responsive Design */
  @media (max-width: 768px) {
    .mainArea {
      margin-bottom: 20px; 
    }
  }
  
                        `
                    }
            </style>
      <style>
        {

            `
            .training-centres {
    background-color: #000; 
    padding-bottom:20px;
  }
  
  .section-title {
    font-size: 28px;
    color: #FF3366; 
    font-weight: bold;
   padding-block: 20px;
  }
  
  /* Centre Card Styling */
  .centre-card {
    text-align: center;
    background-color: #111; 
    border-radius: 15px; 
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.5); 
    padding: 15px 10px;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  
  /* Hover Effect */
  .centre-card:hover {
    transform: translateY(-10px); 
    /* box-shadow: 0px 12px 20px rgba(255, 51, 102, 0.8);  */
  }
  
  /* Image Styling */
  .centre-card figure img {
    width: 100%;
    border-radius: 10px; 
    /* border: 5px solid #ff3366;  */
  }
  
 
  .centre-name {
    margin-top: 15px;
    font-size: 18px;
    font-weight: bold;
    color: #ff3366; 
    text-transform: uppercase;
  }

  #mobilization .slider_images img, #hostel .slider_images img, #trainings .slider_images img {
    border-radius: 25px;
    padding: 10px;
  }
 
#trainings .slider_images > div {
  padding: 10px;
}


#trainings .slider_images img {
  width: 95%!important;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); 
}


#trainings .slider_images {
  display: flex;
  gap: 10px; 
}


#trainings .slick-dots, #hostel .slick-dots {
  position: absolute;
  bottom: -25px;
  /* Adjust position */
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  justify-content: center;
  gap: 10px;
  list-style: none;
  z-index: 10;
}

#trainings .slick-dots li button, #hostel .slick-dots li button {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #aaa;
  /* Default dot color */
  border: none;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

#trainings .slick-dots li button:before , #hostel .slick-dots li button:before{
  color: transparent;
}

#trainings .slick-dots li.slick-active button , #hostel .slick-dots li.slick-active button {
  background-color: #FC2B5A;
}

#trainings .slick-dots li button:hover , #hostel .slick-dots li button:hover,#hostel .slick-dots li button:hover{
  background-color: #333;
}
.mobilization .slick-prev, 
.mobilization .slick-next {
  width: 40px;
  height: 40px;
  background-color: rgb(254, 4, 4) !important;
  border-radius: 50%;
  z-index: 10;
}


/* .section-padding-60{
    padding-block: 60px;
} */

.skillTech{
    font-size: 38px;
    font-weight: 750;
    text-align: center;
    padding-block: 20px;
}
.skillTech .gradient{

    color:rgb(255, 60, 100);
}
.focalBanner{
    padding-top: 30px;
}
/* .focalytLogo img{
    width: 60%;
} */
.focalytLogo:nth-child(1) img{
  width: 75%;
}
.focalytLogo:nth-child(3) img{
  width: 60%;
}
/* .skill-Tech-Brand, .workingArea, .Partners{
padding-top:30px;
} */
.globalLearning{
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    color: #fff;
    line-height: 1.5rem;
    padding-top: 10px;
    padding-bottom: 20px
}
.Partners{
    padding: 15px;
}
.affiliated_partner{
    color: rgb(255, 60, 100);
    text-align: center;
    font-size: 30px;
    font-weight: 700;
    padding: 10px 0 20px 0;
}
/* General Styles */
.workingArea {
    background-color: #000; /* Black background */
    padding: 40px 20px;
  }
  
  .key_area {
    font-size: 28px;
    font-weight: bold;
    color: #fff; /* White text */
  }
  #vision{
    /* background: #fff; */
    background: #000;
  }
  /* Main Area */
  .mainArea {
    background-image: linear-gradient(161deg, #FF3C64 0%, #FF3C64 100%);
    background-color: transparent;
    border-radius: 15px; /* Rounded corners */
    text-align: center; /* Center-align content */
    padding: 30px 20px;
    box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.3); /* Add shadow for depth */
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border-radius: 35px 25px 35px 25px;
    text-align: center;
    height: 100%;
  }
  /* Hover Effect for Boxes */
  .mainArea:hover {
    transform: translateY(-10px); /* Move up on hover */
    box-shadow: 0px 12px 20px rgba(0, 0, 0, 0.5); /* Darker shadow */
  }
  .section-padding-30{
    padding-block: 30px;
  }
  /* Icon Box */
  .icon-box {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 80px;
    height: 80px;
    background-color: #fff; /* White background for icons */
    border-radius: 50%; /* Circle shape */
    margin: 0 auto 20px auto; /* Center and add space below */
  }
  
  .icon-box figure img {
    width: 100%;
    color: #FF3366; /* Match icon color with box */
  }
  
  /* Box Content */
  .icon-box-content h4 {
    font-size: 18px;
    color: #fff; /* White text */
    text-transform: uppercase; /* Make text uppercase */
    font-weight: bold;
    margin: 0;
    line-height: 1.4;
  }
  
.affilated_partner_image{
    width: 100%;
    padding: 5px 0 25px 0;
}
.affilated_partner_image figure img{
    width: 100%;
}
.vision{
    display: flex;
    flex-direction: column;
    gap: 15px;
}
.v_header{
    color: #fff;
    text-align: center;
    font-size: 35px;
    font-weight: 700;
}
.v_para{
    color: #fff;
    line-height: normal;
    text-align: center;
}
.main_partners{
    padding: 15px;
}
.FSD{
    padding:30px 10px;
}
.elementor-widget-container{
    margin: 0;
    padding: 8px 15px 8px 15px;
    border-radius:15px 25px 15px 25px;
    box-shadow: 0px 0px 25px 0px #CCCACA;
    height: 100%;
}
.elementor-widget-containers{
    margin: 0;
    padding: 8px 15px 8px 15px ;
    border-radius:15px 25px 15px 25px;
    box-shadow: 0px 0px 25px 0px #CCCACA;
    height: 100%;
}
.elementor-image-box-img{
    text-align: center;
    padding-bottom: 10px;
}
.elementor-image-box-img img{
    width: 80px;
    height: 80px;
    clip-path: circle(50%);
    padding: 0;
}
.elementor-image-box-title{
    font-size: 20px;
    /* padding-bottom: 10px; */
}
.founder{
    font-size: 13px;
    text-align: center;
}
.elementor-image-box-description{
    line-height: normal;
    font-size: 12px;
    text-align: center;
}

/* training section  */

/* General Section Styling */
@media(max-width:768px){
    .skillTech {
    font-size: 30px;
    }
}
@media (max-width:576px){
    .skillTech {
font-size: 21px;}
}

  /* Responsive Design */
  @media (max-width: 768px) {
    .mainArea {
      margin-bottom: 20px; 
    }
  }
  
            `
        }
      </style>
            </FrontLayout>
        </>
    )
}

export default SocialImpact
