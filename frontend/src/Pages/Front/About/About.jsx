import { useEffect, useState, React } from "react";
import "./About.css"
import $ from 'jquery';
import axios from 'axios';
import 'slick-carousel';
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FrontLayout from "../../../Component/Layouts/Front";
function About() {

    const [seniorManagement, setSeniorManagement] = useState([]);
    const [management, setManagement] = useState([]);
    const [staff, setStaff] = useState([]);
    const bucketUrl = process.env.REACT_APP_MIPIE_BUCKET_URL;
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await axios.get(`${backendUrl}/team`);
                console.log(response.data.management)
                setSeniorManagement(response.data.seniorManagement)
                setManagement(response.data.management)
                setStaff(response.data.staff)
            } catch (error) {
                console.error("Error fetching course data:", error);
            }
        };
        fetchData();
    }, []);

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
                <section className="bg-white">
                    <div className="focalBanner">
                        <div className="container">
                            <div className="row align-items-center mb-3">
                                <div className="col-4">
                                    <div className="focalytLogo">
                                        {/* <img src="/Assets/public/images/logo/logo.png" alt="focal logo" /> */}
                                        <img src="/Assets/public/images/logo/logo.png" alt="focal logo" />
                                    </div>
                                </div>
                                <div className="col-4"></div>
                                <div className="col-4">
                                    <div className="focalytLogo">
                                        <img src="/Assets/public/images/logo/focal.png" alt="focal logo" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-white">
                    <div className="skill-Tech-Brand">
                        <div className="container">
                            <div className="row">
                                <div className="col-12">
                                    <h2 className="skillTech text-black">
                                        <span className="gradient">Focalyt</span>
                                        <span>&nbsp; A Skill-Tech brand of Focal Skill</span>
                                        <span className="gradient">&nbsp; Development Pvt. Ltd.</span>
                                    </h2>
                                </div>
                                <div className="col-12">
                                    <p className="globalLearning text-black py-3">
                                        At Focalyt, we are committed to revolutionizing the way people learn
                                        and grow in today's rapidly evolving world. As an innovative skill
                                        tech platform, Focalyt is dedicated to empowering individuals and
                                        organizations with cutting-edge education and skill development
                                        opportunities. Our parent company,Focal Skill Development Pvt Ltd,
                                        is a driving force behind our mission to foster knowledge,
                                        creativity, and growth in the global learning landscape.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="bg-black">
                    <div className="container-fluid">
                        {/* <!-- key Areas  --> */}
                        <div className="workingArea">
                            <h2 className="key_area text-center text-white pb-4">Key Areas of Working</h2>
                            <div className="row g-3">
                                <div className="col-md-3">
                                    <div className="mainArea">
                                        <div className="icon-box">
                                            <figure>
                                                <img src="/Assets/public_assets/images/icons/skill.png" alt="" />
                                            </figure>
                                            {/* <!-- <span className="svg">

                                        </span> --> */}
                                        </div>
                                        <div className="icon-box-content">
                                            <h4>skill Development</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="mainArea">
                                        <div className="icon-box">
                                            <figure>
                                                <img src="/Assets/public_assets/images/icons/development.png" alt="" />
                                            </figure>
                                        </div>
                                        <div className="icon-box-content">
                                            <h4>Entrepreneurship development</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="mainArea">
                                        <div className="icon-box">
                                            <figure>
                                                <img src="/Assets/public_assets/images/icons/guidance.png" alt="" />
                                            </figure>
                                        </div>
                                        <div className="icon-box-content">
                                            <h4>Career counselling and guidance</h4>
                                        </div>
                                    </div>
                                </div>
                                <div className="col-md-3">
                                    <div className="mainArea">
                                        <div className="icon-box">
                                            <figure>
                                                <img src="/Assets/public_assets/images/icons/services.png" alt="" />
                                            </figure>
                                        </div>
                                        <div className="icon-box-content">
                                            <h4>Placement Employment services</h4>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* <!-- vision --> */}
                <section id="vision">
                    <div className="container-fluid">
                        <div className="row justify-content-center align-items-center g-3 mt-3 py-5" id="mission">
                            <div className="col-md-6">
                                <div className="vision">
                                    <h3 className="v_header">Our Vision</h3>
                                    <p className="v_para">
                                        To be the global leader in the skills technology sector,
                                        transforming skills through innovation, and making high-quality,
                                        blended learning accessible to anyone, anywhere. We envision a world
                                        where anyone can achieve their full potential through personalized
                                        education, fostering a lifelong learning culture that prepares
                                        individuals for the challenges and opportunities of the future.
                                    </p>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="vision">
                                    <h3 className="v_header">Our Mission</h3>
                                    <p className="v_para">
                                        Our Mission Is To Revolutionize the Skills Of 1 Million Youths By 2027 Providing accessible, Flexible, And Comprehensive Blended Learning Experiences. We are dedicated to empowering learners of all ages with the skills and knowledge needed to thrive in a rapidly changing world and bridge the gap between traditional skills and the evolving demands of the global job market.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <section id="partners">
                    
                </section>
                {/* <!-- focalyt Team  --> */}
                <section className="bg-black">
                    <div className="container-fluid">
                        <div className="FSD" id="fsd">
                            <div className="row g-3">
                                <div className="col-md-12">
                                    <div className="text-center pt-3 pb-5">
                                        <h2 className="focalyt_Team text-black">Focalyt Team</h2>
                                    </div>
                                </div>
                                <div class="col-md-12">
                                    <div class="row justify-content-evenly ">

                                        {
                                            seniorManagement.map((a) => (
                                                <div class="col-md-4 pb-4">
                                                    <div class="elementor-widget-containers">
                                                        <div class="elementor-image-box-wrapper">
                                                            <figure class="elementor-image-box-img">
                                                                <img src={a.image.fileURL} alt="" />
                                                            </figure>
                                                            <div class="elementor-image-box-content">
                                                                <h3 class="elementor-image-box-title text-white text-center">
                                                                    {a.name}<br />
                                                                    <span class="founder"> {a.designation} </span>
                                                                </h3>
                                                                <p class="elementor-image-box-description text-white">
                                                                    {a.description}

                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        

                                    </div>
                                </div>

                                <div className="col-md-12">

                                    <div className="row justify-content-evenly g-4 align-items-center">
                                        {management.map ((a)=>(
                                        <div className="col-md-4 pb-4">
                                            <div className="elementor-widget-containers">
                                                <div className="elementor-image-box-wrapper">
                                                    <figure className="elementor-image-box-img">
                                                        <img src= {a.image.fileURL} alt="" />
                                                    </figure>
                                                    <div className="elementor-image-box-content">
                                                    <h3 class="elementor-image-box-title text-white text-center">
                                                                    {a.name}<br />
                                                                    <span class="founder"> {a.designation} </span>
                                                                </h3>
                                                                <p class="elementor-image-box-description text-white">
                                                                    {a.description}

                                                                </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>))}

                                       {staff.map ((a)=>(

                                        <div className="col-md-4">
                                            <div className="elementor-widget-containers">
                                                <div className="elementor-image-box-wrapper">
                                                    <figure className="elementor-image-box-img">
                                                        <img src={a.image.fileURL}alt="" />
                                                    </figure>
                                                    <div className="elementor-image-box-content">
                                                    <h3 class="elementor-image-box-title text-white text-center">
                                                                    {a.name}<br />
                                                                    <span class="founder"> {a.designation} </span>
                                                                </h3>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>))}
                                        
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>


            </FrontLayout>
        </>
    )
}

export default About
