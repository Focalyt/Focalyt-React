import { useEffect, React } from "react";
import "./SocialImpact.css"
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
            $(".slick-initialized").slick("unslick");
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
            </FrontLayout>
        </>
    )
}

export default SocialImpact
