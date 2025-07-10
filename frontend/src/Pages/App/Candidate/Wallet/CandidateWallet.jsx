import React, { useState, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const CandidateWallet = () => {
    const [thresholdCashback, setThresholdCashback] = useState({});
    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

    useEffect(() => {
        fetchCashbackData();
    }, []);

    const fetchCashbackData = async () => {
        try {
            const response = await axios.get(`${backendUrl}/cashback`);
            setThresholdCashback(response.data || {});
            console.log("Fetched Threshold Cashback Data:", response.data);
        } catch (error) {
            console.error("Error fetching cashback data:", error);
        }
    };

    return (
        <>
            <section className="money-rain py-3">
                <div className="mipie-earn px-2">
                    <h4 className="font-weight-bold now-padding">Now you can earn with Focalyt</h4>
                    <h4 className="font-weight-bold">अब आप Focalyt से कमा सकते हैं</h4>
                </div>
                <div className="container-fluid mt-3">
                    <div className="row">
                        <div className="col-xl-8 col-lg-8 col-md-12 col-sm-12 col-12 ">
                            <h4 className="font-weight-bolder mt-3">Rules / नियम:</h4>
                            <div className="single-footer">
                                <ul className="contact-info list-unstyled">
                                    <li className="pt-1">
                                        <img src="/Assets/images/nikelogo.png" alt="check icon" />
                                        <h5 className="font-weight-bold">
                                            Complete your profile and earn upto रु {thresholdCashback.profilecomplete || 50}  / अपना प्रोफ़ाइल पूरा करें और रु{thresholdCashback.profilecomplete || 50} तक कमाएँ

                                        </h5>
                                    </li>
                                    <li className="pt-1">
                                        <img src="/Assets/images/nikelogo.png" alt="check icon" />
                                        <h5 className="font-weight-bold">
                                            Apply on jobs and earn up to रु {thresholdCashback.apply || 10} /
                                            नौकरियों पर आवेदन करें और रु {thresholdCashback.apply || 10} तक कमाएं
                                        </h5>
                                    </li>
                                    <li className="pt-1">
                                        <img src="/Assets/images/nikelogo.png" alt="check icon" />
                                        <h5 className="font-weight-bold">
                                            Focalyt will pay you रु {thresholdCashback.apply || 10}  if your profile gets shortlisted / यदि आपकी प्रोफ़ाइल को शॉर्टलिस्ट किया जाता है तो Focalyt आपको रु 10 का भुगतान करेगा

                                        </h5>
                                    </li>
                                    <li className="pt-1">
                                        <img src="/Assets/images/nikelogo.png" alt="check icon" />
                                        <h5 className="font-weight-bold">
                                            Please ensure that you are applying on Focalyt every week or else your money will be forfeited / कृपया सुनिश्चित करें कि आप हर सप्ताह Focalyt पर आवेदन कर रहे हैं अन्यथा आपका पैसा जब्त कर लिया जाएगा
                                        </h5>
                                    </li>
                                </ul>
                            </div>
                            <h5 className="mt-3 extra-wallet font-stick ">
                                Don't wait, Complete your Profile, Apply on the Jobs and Start earning with Focalyt/
                            </h5>
                            <h5 className="font-weight-bolder font-stick mt-2">
                                प्रतीक्षा न करें, अपना प्रोफ़ाइल पूरा करें, नौकरियों के लिए आवेदन करें और Focalyt पर कमाई शुरू करें
                            </h5>
                        </div>
                    </div>


                </div>
            </section>

            {/* Earnings Sections */}
            <section className="earnings-section container-fluid mt-3 px-0">
                <div className="row">
                    {/* Active Profile */}
                    <EarningCard
                        imageSrc="/Assets/images/inter-first.png"
                        title="Active Profile"
                        description={`Complete your profile and earn Rs ${thresholdCashback.profilecomplete || 50}/-. Please note that you need to provide complete information on City, State, Qualification, Experience, Skills and Current Google Location`}
                        descriptions={`अपनी प्रोफ़ाइल पूरी करें और 10/- रुपये कमाएँ। कृपया ध्यान दें कि आपको शहर, राज्य, योग्यता, अनुभव, कौशल और वर्तमान Google स्थान पर पूरी जानकारी प्रदान करने की आवश्यकता है।`}
                        buttonText="Click here"
                        buttonLink="/candidate/myProfile/"
                        earnAmount={thresholdCashback.profilecomplete || 50}
                        className="icon-feature"
                        buttonClass="card-bottom-one"
                    />

                    {/* Video Profile */}
                    <EarningCard
                        imageSrc="/Assets/images/you-tube.png"
                        title="Video Profile"
                        description={`Upload Your Video Profile and earn Rs ${thresholdCashback.videoprofile || 20}/-. Kindly review the sample video under My Profile. Please make sure you are uploading your own video or else we will blacklist your profile.`}
                        descriptions={`अपनी वीडियो प्रोफाइल अपलोड करें और 20/- रुपये कमाएं। कृपया मेरी प्रोफ़ाइल के अंतर्गत नमूना वीडियो की समीक्षा करें। कृपया सुनिश्चित करें कि आप अपना स्वयं का वीडियो अपलोड कर रहे हैं अन्यथा हम आपकी प्रोफ़ाइल को ब्लैकलिस्ट कर देंगे।`}
                        buttonText="Click here"
                        buttonLink="/candidate/myProfile/"
                        earnAmount={thresholdCashback.videoprofile || 20}
                        className="icon-feature-two"
                        buttonClass="card-bottom-two"
                    />

                    {/* Job Apply */}
                    <EarningCard
                        imageSrc="/Assets/images/search-job.png"
                        title="Job Apply"
                        description={`Apply for jobs and earn Rs ${thresholdCashback.apply || 10}/- per application for each application. Kindly ensure that you are completing your profile before applying for the job`}
                        descriptions={`Focalyt में नौकरियों के लिए आवेदन करें और प्रत्येक आवेदन के लिए 5/- रुपये कमाएं। कृपया सुनिश्चित करें कि आप नौकरी के लिए आवेदन करने से पहले अपना प्रोफाइल पूरा कर रहे हैं।`}
                        buttonText="Click here"
                        buttonLink="/candidate/nearbyJobs"
                        earnAmount={thresholdCashback.apply || 10}
                        className="icon-feature-three"
                        buttonClass="card-bottom-three"
                    />

                    {/* On Shortlisting */}
                    <EarningCard
                        imageSrc="/Assets/images/searching.png"
                        title="On Shortlisting"
                        description={`Complete your profile so that the company can shortlist your profile. On one shortlist, you will earn${thresholdCashback.shortlisted || 5}/- when your profile gets shortlisted. Make sure you are completing your profile to get shortlisted.`}
                        descriptions={`अपनी प्रोफ़ाइल पूरी करें ताकि कंपनी आपकी प्रोफ़ाइल को शॉर्टलिस्ट कर सके। एक शॉर्टलिस्ट पर, आप 10/- रुपये कमाएंगे। शॉर्टलिस्ट होने के लिए सुनिश्चित करें कि आप अपना प्रोफ़ाइल पूरा कर रहे हैं।`}
                        buttonText="Click here"
                        buttonLink="/candidate/myProfile"
                        earnAmount={thresholdCashback.shortlisted || 5}
                        className="icon-feature-four"
                        buttonClass="card-bottom-four"
                    />

                    {/* Refer and Earn */}
                    <EarningCard
                        imageSrc="/Assets/images/referal.png"
                        title="Refer and Earn"
                        description={`Refer your friend and earn Rs ${thresholdCashback.Referral || 30}/-  रुपये कमाएं <br>
Please note: You will receive cashback once the candidate has completed his profile.`}
                        descriptions={`कृपया ध्यान दें: उम्मीदवार द्वारा इस प्रोफ़ाइल को पूरा करने के बाद आपको कैशबैक प्राप्त होगा।`}
                        buttonText="Click here"
                        buttonLink="/candidate/referral"
                        earnAmount={thresholdCashback.Referral || 30}
                        className="icon-feature-five"
                        buttonClass="card-bottom-five"
                    />
                </div>
            </section>
        </>
    );
};

// Reusable Card Component
const EarningCard = ({ imageSrc, title, description, descriptions, buttonText, buttonLink, earnAmount, className, buttonClass }) => {
    return (
        <div className="col-md-6 mb-4">
            <div className="card applied_card rounded card_shad">
                <div className="headerr border-bottom">
                    <div className="row py-2 px-3">
                        <div className="col-7 pt-1 font-weight-bold text-left">
                            <img src={imageSrc} className="me-2" alt="icon" /> {title}
                        </div>
                        <div className="col-5 text-right">
                            <div className={`btn btn-md ${className} bott_size text-white`}>
                                Earn <span className="font-weight-bold">₹ {earnAmount}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="card-body">
                    <p className="pb-3">{description}</p>
                    <p>{descriptions}</p>
                </div>
                <Link to={buttonLink} className={`btn btn-block text-white ${buttonClass}`}>
                    {buttonText}
                </Link>
            </div>
            <style>
                {`
                .card-bottom-one {
                    background-color: #417ebd;
                    font-size: 18px;
                    border-top-right-radius: 0;
                    border-top-left-radius: 0;
                }
                .card-bottom-one:hover{
                border: 2px solid #417ebd;
                color:#000!important;
                }
                .icon-feature {
                    background-color: #417ebd;
                    font-size: 17px;
                    border: 2px solid #35679a;
                    // transition: 3s ease-in-out;
                }
                .icon-feature:hover{
                    background-color: transparent;
                    border:2px solid #35679a;
                    color:#000!important;
                }
                .icon-feature-two {
                    background-color: #e95b37;
                    font-size: 17px;
                    border: 2px solid #e95b37;
                }
                 .icon-feature-two:hover {
                 background-color: transparent;
                    border:2px solid #e95b37;
                    color: #000!important;
                 }
                .card-bottom-two {
                    background-color: #e95b37;
                    font-size: 18px;
                    border-top-right-radius: 0;
                    border-top-left-radius: 0;
                }
                    .card-bottom-two:hover{
                    border: 1px solid #e95b37;
                    color: #000!important;
                    }
                .icon-feature-three {
                    background-color: #bc405a;
                    font-size: 17px;
                    border: 2px solid #bc405a;
                }
                .icon-feature-three:hover{
                background-color: transparent;
                border: 2px solid #bc405a;
                color:#000!important;
                }
                .card-bottom-three {
                    background-color: #bc405a;
                    border: 2px solid #bc405a;
                    font-size: 18px;
                    border-top-right-radius: 0;
                    border-top-left-radius: 0;
                }
                    .card-bottom-three:hover{
                    border: 2px solid #bc405a;
                    color:#000!important;
                    }
                .icon-feature-four {
                    padding-top: 10px;
                    background-color: #42a181;
                    font-size: 17px;
                    border: 2px solid #42a181;
                    padding-bottom: 10px;
                }
                  .icon-feature-four:hover{
                background-color: transparent;
                border: 2px solid #42a181;
                color:#000!important;
                }  
                .card-bottom-four {
                    background-color: #42a181;
                    font-size: 18px;
                    border-top-right-radius: 0;
                    border-top-left-radius: 0;
                }
                .card-bottom-four:hover{
                border: 1px solid #42a181;
                color:#000!important; 
                }
                .icon-feature-five {
                    background-color: #640064;
                    font-size: 17px;
                    border: 2px solid #640064;
                    // transition: 3s ease-in-out;
                }
                .icon-feature-five:hover {
                background-color:transparent;
                border: 2px solid #640064;
                color:#000!important;
                }
                .card-bottom-five {
                    background-color: #640064;
                    font-size: 18px;
                    border-top-right-radius: 0;
                    border-top-left-radius: 0;
                }
                    .card-bottom-five:hover{
                    background-color: transparent;
                    border: 1px solid #640064;
                    color:#000!important;
                    }
                    .applied_card{
    height: 100%;
    width:100%!important;
}
                `}
            </style>
            <style>
                {
                    `
                    .money-rain {
    /* background: url(public/Assets/images/money-rain.jpg) no-repeat; */
    background: url(/Assets/images/money-rain.jpg) no-repeat;
    background-size: 100%;
    background-size: cover;
    background-position: right;
    box-shadow: 0 4px 8px 0 rgba(0, 0, 0, 0.2), 0 6px 20px 0 rgba(0, 0, 0, 0.19);
    border-radius: 10px;
}
.mipie-earn {
    width: 33%;
    background-color: #fcecb3;
    border: 1px solid #f0c59f;
}
.now-padding {
    padding-top: 8px;
    font-size:1rem;
}
.single-footer ul {
    list-style-type: none;
    padding: 0;
    margin: 0;
}
.single-footer .contact-info li {
    margin-bottom: 10px!important;
    color: #000;
    font-weight: 500;
    position: relative;
    padding-left: 20px!important;
}

.single-footer .contact-info li img {
    position: absolute;
    left: 0;
    top: 3px;
    height: auto;
    width: 12px;
}

   .applied_card img {
    width: 11%;
    height: auto;
}

@media only screen and (max-width: 1440px) {
    .font-stick {
        font-weight: 500 !important;
    }
}
@media (max-width: 1138px) and (min-width: 99px) {
    .money-rain {
        background-position: top !important;
    }
}

@media only screen and (max-width: 900px) {
    .money-rain {
        /* background-image: url(../../../../../../public/Assets/images/mobilebg.jpg) !important; */
        background-image: url(/Assets/images/mobilebg.jpg)!important;
        background-repeat: no-repeat !important;
        background-size: cover !important;
        background-position: bottom !important;
    }
}
                    `
                }
            </style>
        </div>

    );
};


export default CandidateWallet;
