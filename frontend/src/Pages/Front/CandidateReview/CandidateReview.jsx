import React from 'react'

import FrontLayout from "../../../Component/Layouts/Front";

const partners = [
  {
    name: "Beetel",
    img: "/Assets/public_assets/images/partners/beetel.png",
  },
  {
    name: "Colorplast",
    img: "/Assets/public_assets/images/partners/colorplast.png",
  },
  {
    name: "EarlyJobs",
    img: "/Assets/public_assets/images/partners/earlyjobs.png",
  },
  {
    name: "MoneySolutions",
    img: "/Assets/public_assets/images/partners/moneysolutions.png",
  },
  {
    name: "Overdrive",
    img: "/Assets/public_assets/images/partners/overdrive.png",
  },
  {
    name: "ShiningStar",
    img: "/Assets/public_assets/images/partners/shiningstar.png",
  },
  {
        name: "Juipter Laminators",
    img: "/Assets/public_assets/images/partners/jupiterlaminators.png",
  },
  {
    name: "Lava",
    img: "/Assets/public_assets/images/partners/lava.png",
  },
]

const firstRow = partners.slice(0, partners.length / 2)
const secondRow = partners.slice(partners.length / 2)

const PartnerCard = ({ img, name }) => {
  return (
    <figure className="partner-card">
      <div className="partner-card-content">
        <img className="partner-logo" alt={name} src={img} />
        <figcaption className="partner-name">{name}</figcaption>
      </div>
    </figure>
  )
}

function CandidateReviews() {
    return (
        <>
            <section className="section-padding-30 mt-4">
                <h1 className="section-title">Company Partners</h1>
                
                <div className="marquee-container">
                    <div className="marquee-wrapper">
                        <div className="marquee-content animate-marquee" style={{'--duration': '30s', '--gap': '16px'}}>
                            {[...firstRow, ...firstRow, ...firstRow].map((partner, index) => (
                                <PartnerCard key={`${partner.name}-${index}`} {...partner} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="marquee-wrapper">
                        <div className="marquee-content animate-marquee-reverse" style={{'--duration': '30s', '--gap': '16px'}}>
                            {[...secondRow, ...secondRow, ...secondRow].map((partner, index) => (
                                <PartnerCard key={`${partner.name}-${index}`} {...partner} />
                            ))}
                        </div>
                    </div>
                    
                    <div className="marquee-fade marquee-fade-left"></div>
                    <div className="marquee-fade marquee-fade-right"></div>
                </div>
            </section>

            <style>
                {`
                :root {
                    --gap: 20px;
                    --color-primary: #FC2B5A;
                    --color-primary-rgb: 252, 43, 90;
                    --color-secondary: #FFD542;
                    --color-purple: #9747FF;
                    --color-purple-rgb: 151, 71, 255;
                    --color-dark: #121212;
                }
                .section-padding-30 {
                    padding-block: 60px;
                }

                .section-title {
                    font-size: 2.5rem;
                    font-weight: 700;
                    text-align: center;
                    margin-bottom: 20px;
                    background: linear-gradient(135deg, rgba(151, 71, 255, 1) 0%, rgba(252, 43, 90, 1) 100%);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                }

                .marquee-container {
                    position: relative;
                    width: 100%;
                    overflow: hidden;
                    margin-top: 40px;
                }

                .marquee-wrapper {
                    display: flex;
                    width: 100%;
                    overflow: hidden;
                    margin-bottom: 24px;
                    padding: 12px 0;
                }

                .marquee-content {
                    display: flex;
                    gap: var(--gap, 16px);
                    width: max-content;
                    will-change: transform;
                }

                .animate-marquee {
                    animation: marquee var(--duration, 30s) infinite linear;
                }

                .animate-marquee-reverse {
                    animation: marquee-reverse var(--duration, 30s) infinite linear;
                }

                .marquee-wrapper:hover .marquee-content {
                    animation-play-state: paused;
                }

                @keyframes marquee {
                    0% {
                        transform: translateX(0);
                    }
                    100% {
                        transform: translateX(calc(-100% / 3));
                    }
                }

                @keyframes marquee-reverse {
                    0% {
                        transform: translateX(calc(-100% / 3));
                    }
                    100% {
                        transform: translateX(0);
                    }
                }

                .partner-card {
                    position: relative;
                    height: 100%;
                    width: 200px;
                    min-width: 200px;
                    cursor: pointer;
                    overflow: hidden;
                    border-radius: 24px;
                    // border: 2px solid rgba(252, 43, 90, 0.15);
                    padding: 32px 24px;
                    // background: linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(255, 255, 255, 0.7) 100%);
                    backdrop-filter: blur(10px);
                    // box-shadow: 0 4px 20px rgba(252, 43, 90, 0.1),
                    //             0 2px 8px rgba(0, 0, 0, 0.05),
                    //             inset 0 1px 0 rgba(255, 255, 255, 0.8);
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .partner-card::before {
                    content: '';
                    position: absolute;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    border-radius: 24px;
                    padding: 2px;
                    background: linear-gradient(135deg, rgba(151, 71, 255, 0.3), rgba(252, 43, 90, 0.3));
                    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
                    -webkit-mask-composite: xor;
                    mask-composite: exclude;
                    opacity: 0;
                    transition: opacity 0.4s ease;
                }

                .partner-card:hover {
                    transform: scale(1.05);
                    // background: linear-gradient(135deg, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.95) 100%);
                    // box-shadow: 0 12px 40px rgba(252, 43, 90, 0.2),
                    //             0 4px 16px rgba(151, 71, 255, 0.15),
                    //             inset 0 1px 0 rgba(255, 255, 255, 1);
                    border-color: rgba(252, 43, 90, 0.3);
                }

                .partner-card:hover::before {
                    opacity: 1;
                }

                .partner-card-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    gap: 16px;
                    width: 100%;
                    position: relative;
                    z-index: 1;
                }

                .partner-logo {
                    max-width: 100%;
                    max-height: 100px;
                    object-fit: contain;
                    filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.1));
                    transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
                }

                .partner-card:hover .partner-logo {
                    transform: scale(1.1) rotate(2deg);
                    filter: drop-shadow(0 4px 12px rgba(252, 43, 90, 0.3));
                }

                .partner-name {
                    font-size: 15px;
                    font-weight: 600;
                    color: #4a5568;
                    margin: 0;
                    text-align: center;
                    letter-spacing: 0.3px;
                    transition: all 0.3s ease;
                    position: relative;
                }

                .partner-card:hover .partner-name {
                    color: var(--color-primary);
                }

                .partner-name::after {
                    content: '';
                    position: absolute;
                    bottom: -4px;
                    left: 50%;
                    transform: translateX(-50%) scaleX(0);
                    width: 40px;
                    height: 2px;
                    background: linear-gradient(90deg, #9747FF, #FC2B5A);
                    border-radius: 2px;
                    transition: transform 0.3s ease;
                }

                .partner-card:hover .partner-name::after {
                    transform: translateX(-50%) scaleX(1);
                }

                .marquee-fade {
                    position: absolute;
                    top: 0;
                    bottom: 0;
                    width: 25%;
                    pointer-events: none;
                    z-index: 1;
                }

                .marquee-fade-left {
                    left: 0;
                    background: linear-gradient(to right, rgba(255, 255, 255, 1), transparent);
                }

                .marquee-fade-right {
                    right: 0;
                    background: linear-gradient(to left, rgba(255, 255, 255, 1), transparent);
                }

                /* Dark mode support */
                @media (prefers-color-scheme: dark) {
                    .section-title {
                        background: linear-gradient(135deg, rgba(151, 71, 255, 1) 0%, rgba(252, 43, 90, 1) 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    }

                    .partner-card {
                        border-color: rgba(252, 43, 90, 0.2);
                        background: linear-gradient(135deg, rgba(30, 30, 40, 0.9) 0%, rgba(40, 40, 55, 0.8) 100%);
                        box-shadow: 0 4px 20px rgba(252, 43, 90, 0.15),
                                    0 2px 8px rgba(0, 0, 0, 0.3),
                                    inset 0 1px 0 rgba(255, 255, 255, 0.1);
                    }

                    .partner-card:hover {
                        // background: linear-gradient(135deg, rgba(40, 40, 55, 1) 0%, rgba(50, 50, 65, 0.95) 100%);
                        // box-shadow: 0 12px 40px rgba(252, 43, 90, 0.25),
                        //             0 4px 16px rgba(252, 43, 90, 0.2),
                        //             inset 0 1px 0 rgba(255, 255, 255, 0.15);
                        border-color: rgba(252, 43, 90, 0.4);
                    }

                    .partner-name {
                        color: #e2e8f0;
                    }

                    .partner-card:hover .partner-name {
                        color: #FC2B5A;
                    }

                    .marquee-fade-left {
                        background: linear-gradient(to right, rgba(15, 15, 20, 1), transparent);
                    }

                    .marquee-fade-right {
                        background: linear-gradient(to left, rgba(15, 15, 20, 1), transparent);
                    }
                }

                `}
            </style>
        </>
    )
}

export default CandidateReviews


// import React from 'react';
// import FrontLayout from "../../../Component/Layouts/Front";

// const reviews = [
//   {
//     name: "Jack",
//     username: "@jack",
//     body: "I've never seen anything like this before. It's amazing. I love it.",
//     img: "https://avatar.vercel.sh/jack",
//   },
//   {
//     name: "Jill",
//     username: "@jill",
//     body: "I don't know what to say. I'm speechless. This is amazing.",
//     img: "https://avatar.vercel.sh/jill",
//   },
//   {
//     name: "John",
//     username: "@john",
//     body: "I'm at a loss for words. This is amazing. I love it.",
//     img: "https://avatar.vercel.sh/john",
//   },
//   {
//     name: "Jane",
//     username: "@jane",
//     body: "I'm at a loss for words. This is amazing. I love it.",
//     img: "https://avatar.vercel.sh/jane",
//   },
// ]

// // Distribute reviews across 4 columns
// const firstRow = [reviews[0]]
// const secondRow = [reviews[1]]
// const thirdRow = [reviews[2]]
// const fourthRow = [reviews[3]]

// const ReviewCard = ({ img, name, username, body }) => {
//   return (
//     <figure className="review-card">
//       <div className="review-card-header">
//         <img className="review-avatar" width="32" height="32" alt="" src={img} />
//         <div className="review-info">
//           <figcaption className="review-name">{name}</figcaption>
//           <p className="review-username">{username}</p>
//         </div>
//       </div>
//       <blockquote className="review-body">{body}</blockquote>
//     </figure>
//   )
// }

// function CandidateReview() {
//     return(
//         <FrontLayout>
//             <section className="section-padding-30 mt-4">
//                 <h1>Candidate Reviews</h1>
                
//                 <div className="marquee-3d-container">
//                     <div className="marquee-3d-wrapper">
//                         <div className="marquee-column-wrapper">
//                             <div className="marquee-content-vertical animate-marquee-up" style={{'--duration': '20s', '--gap': '16px'}}>
//                                 {[...firstRow, ...firstRow, ...firstRow].map((review, index) => (
//                                     <ReviewCard key={`${review.username}-${index}-1`} {...review} />
//                                 ))}
//                             </div>
//                         </div>
                        
//                         <div className="marquee-column-wrapper">
//                             <div className="marquee-content-vertical animate-marquee-down" style={{'--duration': '20s', '--gap': '16px'}}>
//                                 {[...secondRow, ...secondRow, ...secondRow].map((review, index) => (
//                                     <ReviewCard key={`${review.username}-${index}-2`} {...review} />
//                                 ))}
//                             </div>
//                         </div>
                        
//                         <div className="marquee-column-wrapper">
//                             <div className="marquee-content-vertical animate-marquee-down" style={{'--duration': '20s', '--gap': '16px'}}>
//                                 {[...thirdRow, ...thirdRow, ...thirdRow].map((review, index) => (
//                                     <ReviewCard key={`${review.username}-${index}-3`} {...review} />
//                                 ))}
//                             </div>
//                         </div>
                        
//                         <div className="marquee-column-wrapper">
//                             <div className="marquee-content-vertical animate-marquee-up" style={{'--duration': '20s', '--gap': '16px'}}>
//                                 {[...fourthRow, ...fourthRow, ...fourthRow].map((review, index) => (
//                                     <ReviewCard key={`${review.username}-${index}-4`} {...review} />
//                                 ))}
//                             </div>
//                         </div>
//                     </div>
                    
//                     <div className="marquee-fade marquee-fade-top"></div>
//                     <div className="marquee-fade marquee-fade-bottom"></div>
//                     <div className="marquee-fade marquee-fade-left"></div>
//                     <div className="marquee-fade marquee-fade-right"></div>
//                 </div>
//             </section>

//             <style>
//                 {`
//                 .section-padding-30 {
//                     padding-block: 60px;
//                 }

//                 .marquee-3d-container {
//                     position: relative;
//                     width: 100%;
//                     height: 500px;
//                     overflow: hidden;
//                     margin-top: 40px;
//                     display: flex;
//                     flex-direction: row;
//                     align-items: center;
//                     justify-content: center;
//                     perspective: 1000px;
//                     perspective-origin: center center;
//                     background: transparent;
//                 }

//                 .marquee-3d-wrapper {
//                     display: flex;
//                     flex-direction: row;
//                     align-items: center;
//                     justify-content: center;
//                     gap: 20px;
//                     transform: translateX(-80px) translateY(0px) translateZ(-150px) rotateX(15deg) rotateY(-8deg) rotateZ(2deg);
//                     transform-style: preserve-3d;
//                 }

//                 .marquee-column-wrapper {
//                     display: flex;
//                     flex-direction: column;
//                     width: 200px;
//                     height: 100%;
//                     overflow: hidden;
//                     transform-style: preserve-3d;
//                 }

//                 .marquee-content-vertical {
//                     display: flex;
//                     flex-direction: column;
//                     gap: 0;
//                     width: 100%;
//                     will-change: transform;
//                 }

//                 .animate-marquee-up {
//                     animation: marquee-up var(--duration, 20s) infinite linear;
//                 }

//                 .animate-marquee-down {
//                     animation: marquee-down var(--duration, 20s) infinite linear;
//                 }

//                 .marquee-column-wrapper:hover .marquee-content-vertical {
//                     animation-play-state: paused;
//                 }

//                 @keyframes marquee-up {
//                     0% {
//                         transform: translateY(0);
//                     }
//                     100% {
//                         transform: translateY(calc(-100% / 3));
//                     }
//                 }

//                 @keyframes marquee-down {
//                     0% {
//                         transform: translateY(calc(-100% / 3));
//                     }
//                     100% {
//                         transform: translateY(0);
//                     }
//                 }

//                 .review-card {
//                     position: relative;
//                     height: fit-content;
//                     width: 100%;
//                     cursor: pointer;
//                     overflow: hidden;
//                     border-radius: 12px;
//                     border: 1px solid rgba(0, 0, 0, 0.08);
//                     padding: 16px;
//                     background: #ffffff;
//                     transition: all 0.3s ease;
//                     box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.04);
//                     flex-shrink: 0;
//                     margin-bottom: 16px;
//                 }

//                 .review-card:hover {
//                     background: #fafafa;
//                     transform: translateY(-2px);
//                     box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12), 0 2px 4px rgba(0, 0, 0, 0.08);
//                 }

//                 .review-card-header {
//                     display: flex;
//                     flex-direction: row;
//                     align-items: center;
//                     gap: 8px;
//                 }

//                 .review-avatar {
//                     border-radius: 50%;
//                 }

//                 .review-info {
//                     display: flex;
//                     flex-direction: column;
//                 }

//                 .review-name {
//                     font-size: 14px;
//                     font-weight: 500;
//                     color: #000;
//                     margin: 0;
//                 }

//                 .review-username {
//                     font-size: 12px;
//                     font-weight: 500;
//                     color: rgba(0, 0, 0, 0.4);
//                     margin: 0;
//                 }

//                 .review-body {
//                     margin-top: 8px;
//                     font-size: 14px;
//                     color: #000;
//                     margin-bottom: 0;
//                     line-height: 1.5;
//                 }

//                 .marquee-fade {
//                     position: absolute;
//                     pointer-events: none;
//                     z-index: 1;
//                 }

//                 .marquee-fade-top {
//                     top: 0;
//                     left: 0;
//                     right: 0;
//                     height: 30%;
//                     background: linear-gradient(to bottom, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.5) 60%, transparent 100%);
//                 }

//                 .marquee-fade-bottom {
//                     bottom: 0;
//                     left: 0;
//                     right: 0;
//                     height: 30%;
//                     background: linear-gradient(to top, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.5) 60%, transparent 100%);
//                 }

//                 .marquee-fade-left {
//                     left: 0;
//                     top: 0;
//                     bottom: 0;
//                     width: 20%;
//                     background: linear-gradient(to right, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.5) 60%, transparent 100%);
//                 }

//                 .marquee-fade-right {
//                     right: 0;
//                     top: 0;
//                     bottom: 0;
//                     width: 20%;
//                     background: linear-gradient(to left, rgba(255, 255, 255, 1) 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0.5) 60%, transparent 100%);
//                 }

//                 /* Dark mode support */
//                 @media (prefers-color-scheme: dark) {
//                     .review-card {
//                         border-color: rgba(255, 255, 255, 0.1);
//                         background: rgba(255, 255, 255, 0.1);
//                     }

//                     .review-card:hover {
//                         background: rgba(255, 255, 255, 0.15);
//                     }

//                     .review-name {
//                         color: #fff;
//                     }

//                     .review-username {
//                         color: rgba(255, 255, 255, 0.4);
//                     }

//                     .review-body {
//                         color: #fff;
//                     }

//                     .marquee-fade-top {
//                         background: linear-gradient(to bottom, #000, transparent);
//                     }

//                     .marquee-fade-bottom {
//                         background: linear-gradient(to top, #000, transparent);
//                     }

//                     .marquee-fade-left {
//                         background: linear-gradient(to right, #000, transparent);
//                     }

//                     .marquee-fade-right {
//                         background: linear-gradient(to left, #000, transparent);
//                     }
//                 }
//                 `}
//             </style>
//         </FrontLayout>
//     )
// }

// export default CandidateReview;