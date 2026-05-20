import { useState } from "react";
import { Link } from "react-router-dom";

const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700;800;900&family=Baloo+2:wght@700;800&display=swap');

  .oa, .oa *, .oa *::before, .oa *::after { box-sizing: border-box; }

  .oa {
    --green: #1a7a4a;
    --blue: #1565c0;
    --purple: #6a1f9a;
    --orange: #e65100;
    --teal: #00838f;
    --navy: #0d2146;
    --cream: #f8faff;
    font-family: 'Nunito', sans-serif;
    background: var(--cream);
    overflow-x: hidden;
  }

  .oa .oa-wrap { max-width: 1280px; margin: 0 auto; padding: 0 32px; position: relative; z-index: 1; }

  .oa .oa-badge {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, var(--navy), #163565);
    color: #fff; font-size: 11px; font-weight: 800; letter-spacing: 2px;
    text-transform: uppercase; padding: 8px 18px; border-radius: 50px;
    margin-bottom: 18px;
  }

  .oa .oa-title {
    font-family: 'Baloo 2', cursive; font-weight: 800;
    font-size: clamp(30px, 4.5vw, 52px); line-height: 1.1; color: var(--navy); margin-bottom: 12px;
  }

  .oa .oa-subtitle { color: #5a6680; font-size: clamp(14px, 1.5vw, 17px); line-height: 1.75; max-width: 720px; margin: 0 auto 36px; }

  .oa .oa-tabs {
    display: flex; gap: 10px; overflow-x: auto; padding: 6px 4px 14px;
    margin-bottom: 32px; scrollbar-width: thin;
    -webkit-overflow-scrolling: touch;
  }
  .oa .oa-tabs::-webkit-scrollbar { height: 5px; }
  .oa .oa-tabs::-webkit-scrollbar-thumb { background: #c8d4e8; border-radius: 4px; }

  .oa .oa-tab {
    flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
    padding: 12px 20px; border-radius: 50px; border: 2px solid #dce4f5;
    background: #fff; color: #4a5568; font-weight: 700; font-size: 13px;
    cursor: pointer; transition: all 0.25s ease; white-space: nowrap;
    font-family: 'Nunito', sans-serif;
  }
  .oa .oa-tab:hover { transform: translateY(-2px); border-color: #b0c4de; }
  .oa .oa-tab.active {
    background: linear-gradient(135deg, var(--navy), #163972);
    color: #fff; border-color: var(--navy);
    box-shadow: 0 8px 24px rgba(13,33,70,0.22);
  }
  .oa .oa-tab-ico { font-size: 18px; }

  .oa .oa-panel {
    background: #fff; border-radius: 24px; border: 2px solid #e4ebf8;
    box-shadow: 0 12px 48px rgba(13,33,70,0.08); overflow: hidden;
    animation: oaFadeIn 0.45s ease;
    position: relative; z-index: 2; isolation: isolate;
  }
  @keyframes oaFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }

  .oa .oa-hero {
    display: grid; grid-template-columns: 1fr auto; gap: 28px; align-items: center;
    padding: 32px 36px; border-bottom: 2px solid #edf1f8;
    background: linear-gradient(135deg, #f8faff 0%, #fff 60%);
  }
  @media (max-width: 768px) {
    .oa .oa-hero { grid-template-columns: 1fr; padding: 24px 20px; }
    .oa .oa-hero-visual { justify-self: center; }
  }

  .oa .oa-hero-tag {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 6px 14px; border-radius: 50px; font-size: 11px; font-weight: 800;
    letter-spacing: 1.5px; text-transform: uppercase; margin-bottom: 12px;
  }

  .oa .oa-hero h3 {
    font-family: 'Baloo 2', cursive; font-weight: 800;
    font-size: clamp(22px, 3vw, 32px); line-height: 1.2; margin-bottom: 12px;
  }

  .oa .oa-hero p { color: #5a6680; font-size: 14.5px; line-height: 1.75; }

  .oa .oa-hero-visual {
    width: 120px; height: 120px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 52px; flex-shrink: 0;
    box-shadow: 0 16px 40px rgba(13,33,70,0.12);
  }

  .oa .oa-body { padding: 28px 36px 36px; }
  @media (max-width: 768px) { .oa .oa-body { padding: 20px 18px 28px; } }

  .oa .oa-grid-2 { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; margin-bottom: 24px; }
  .oa .oa-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; margin-bottom: 24px; }
  .oa .oa-grid-4 { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; margin-bottom: 24px; }
  @media (max-width: 1100px) { .oa .oa-grid-4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
  @media (max-width: 900px) { .oa .oa-grid-3 { grid-template-columns: 1fr; } }
  @media (max-width: 700px) { .oa .oa-grid-2, .oa .oa-grid-4 { grid-template-columns: 1fr; } }

  .oa .oa-block {
    background: #fff;
    border-radius: 16px;
    border: 1px solid #e8edf5;
    border-left: 4px solid var(--block-accent, #1a7a4a);
    padding: 0;
    height: 100%;
    box-shadow: 0 4px 18px rgba(13, 33, 70, 0.06);
    position: relative;
    z-index: 1;
    overflow: hidden;
    transition: box-shadow 0.25s ease, transform 0.25s ease;
  }
  .oa .oa-block:hover {
    box-shadow: 0 8px 28px rgba(13, 33, 70, 0.1);
    transform: translateY(-2px);
  }

  .oa .oa-block-head {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 18px 20px 14px;
    border-bottom: 1px solid #f0f3f8;
    background: #fff;
  }

  .oa .oa-block-ico {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 22px;
    flex-shrink: 0;
  }

  .oa .oa-block-title {
    font-family: 'Baloo 2', cursive;
    font-weight: 800;
    font-size: 16px;
    color: var(--navy);
    line-height: 1.25;
  }

  .oa .oa-info-list {
    list-style: none;
    padding: 8px 20px 16px;
    margin: 0;
    background: #fff;
  }
  .oa .oa-info-list li {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #f4f6fa;
    font-size: 13.5px;
    color: #4a5568;
    line-height: 1.55;
  }
  .oa .oa-info-list li:last-child { border-bottom: none; padding-bottom: 4px; }
  .oa .oa-info-list li::before {
    content: '';
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--dot-color, #1a7a4a);
    flex-shrink: 0;
    margin-top: 7px;
  }

  .oa .oa-block-stat {
    text-align: center;
    padding: 22px 16px !important;
    border-left-width: 1px;
  }

  .oa .oa-list { list-style: none; padding: 0; margin: 0; }
  .oa .oa-list li {
    display: flex; align-items: flex-start; gap: 10px;
    font-size: 13px; color: #5a6680; line-height: 1.6; margin-bottom: 8px;
  }
  .oa .oa-list li::before { display: none; }
  .oa .oa-chk {
    flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; font-weight: 900; color: #fff; margin-top: 1px;
  }

  .oa .oa-subcard {
    border-radius: 18px; overflow: hidden; border: 2px solid #e4ebf8;
    background: #fff; transition: transform 0.3s ease, box-shadow 0.3s ease;
  }
  .oa .oa-subcard:hover { transform: translateY(-6px); box-shadow: 0 16px 40px rgba(13,33,70,0.12); }

  .oa .oa-subcard-bar { height: 5px; }
  .oa .oa-subcard-head {
    display: flex; align-items: center; gap: 12px; padding: 16px 18px 10px;
  }
  .oa .oa-subcard-num {
    width: 36px; height: 36px; border-radius: 10px; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 14px; flex-shrink: 0;
  }
  .oa .oa-subcard-title {
    font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 14.5px; line-height: 1.3;
  }
  .oa .oa-subcard-body { padding: 0 18px 18px; }
  .oa .oa-subcard-body p { font-size: 12.5px; color: #5a6680; line-height: 1.65; margin-bottom: 12px; }
  .oa .oa-subcard-body h5 { font-size: 11px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase; margin: 10px 0 8px; }

  .oa .oa-pill-row { display: flex; flex-wrap: wrap; gap: 10px; margin-bottom: 24px; }
  .oa .oa-pill {
    display: flex; align-items: center; gap: 8px; padding: 10px 16px;
    background: #fff; border: 1.5px solid #e4ebf8; border-radius: 50px;
    font-size: 12.5px; font-weight: 700; color: var(--navy);
  }
  .oa .oa-pill span { font-size: 18px; }

  .oa .oa-commit {
    background: linear-gradient(135deg, #f0f8f4, #e8f4ff);
    border: 2px solid #d8edf8; border-radius: 18px; padding: 22px 24px; margin-bottom: 24px;
  }
  .oa .oa-commit h4 {
    font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 17px; color: var(--navy); margin-bottom: 12px;
  }

  .oa .oa-cta {
    display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 18px;
    background: linear-gradient(135deg, var(--navy), #163565);
    border-radius: 18px; padding: 24px 28px; margin-top: 8px;
  }
  .oa .oa-cta-text { display: flex; align-items: center; gap: 14px; flex: 1; min-width: 220px; }
  .oa .oa-cta-text p { color: #b8cce0; font-size: 13.5px; line-height: 1.6; margin: 0; }
  .oa .oa-cta-text strong { display: block; color: #fff; font-family: 'Baloo 2', cursive; font-size: 16px; margin-bottom: 4px; }
  .oa .oa-cta-btn {
    display: inline-flex; align-items: center; gap: 8px;
    background: linear-gradient(135deg, var(--green), #25a060); color: #fff;
    border: none; border-radius: 12px; padding: 14px 28px;
    font-family: 'Baloo 2', cursive; font-weight: 800; font-size: 14px;
    text-decoration: none; cursor: pointer; transition: all 0.25s ease;
    box-shadow: 0 8px 26px rgba(26,122,74,0.35); white-space: nowrap;
  }
  .oa .oa-cta-btn:hover { transform: translateY(-3px); box-shadow: 0 14px 32px rgba(26,122,74,0.45); }

  .oa .oa-closing {
    text-align: center; padding: 20px; margin-top: 20px;
    border-top: 2px dashed #e4ebf8;
  }
  .oa .oa-closing p {
    font-family: 'Baloo 2', cursive; font-weight: 800; font-size: clamp(16px, 2vw, 20px); line-height: 1.4;
  }

  .oa .oa-flow {
    display: flex; align-items: center; justify-content: center; flex-wrap: wrap; gap: 8px;
    margin: 16px 0 8px;
  }
  .oa .oa-flow-step {
    display: flex; align-items: center; gap: 8px; padding: 10px 16px;
    background: #fff; border: 1.5px solid #e4ebf8; border-radius: 50px;
    font-size: 12.5px; font-weight: 700; color: var(--navy);
  }
  .oa .oa-flow-arrow { color: #8896aa; font-weight: 900; font-size: 16px; }

  .oa .oa-blob {
    position: absolute; border-radius: 50%; filter: blur(72px); opacity: 0.07; pointer-events: none;
  }
`;

const PILLARS = [
  {
    id: "mobilisation",
    emoji: "👥",
    color: "#1a7a4a",
    label: "Mobilisation",
    tagline: "Reaching Communities. Empowering Futures.",
    overview:
      "Focalyt conducts structured mobilisation activities to identify, engage, counsel, and enroll eligible beneficiaries. Our mobilisation strategy is designed to maximize outreach, community participation, and program awareness across diverse geographies and beneficiary groups.",
    blocks: [
      {
        title: "Key Activities",
        emoji: "📋",
        items: [
          "Community meetings and awareness sessions",
          "Door-to-door mobilisation and counselling",
          "Information dissemination campaigns",
          "Banner displays and public announcements",
          "Engagement with village-level stakeholders and institutions",
          "Outreach and Counselling of School/College Students",
          "Career counselling and guidance sessions",
          "Candidate screening and enrollment support",
        ],
      },
      {
        title: "Target Beneficiaries",
        emoji: "🎯",
        items: [
          "Unemployed youth",
          "School and college students",
          "Women and SHGs",
          "Tribal and rural communities",
          "MSME workforce and entrepreneurs",
          "Aspirational and underserved communities",
        ],
      },
      {
        title: "Outcomes & Impact",
        emoji: "📈",
        items: [
          "Increased community awareness and participation",
          "Higher enrollment and candidate engagement",
          "Improved understanding of training and livelihood opportunities",
          "Better alignment between beneficiary aspirations and program outcomes",
          "Stronger community and institutional partnerships",
        ],
      },
      {
        title: "Sectors & Programs Supported",
        emoji: "🏛️",
        items: [
          "Skill Development",
          "Future Technologies",
          "MSME Development",
          "School Innovation Programs",
          "Environment & Sustainability",
          "Entrepreneurship & Livelihood Programs",
        ],
      },
    ],
    approach:
      "Our mobilisation model combines on-ground outreach with counselling and stakeholder engagement to ensure effective participation and informed enrollment. Activities are customized based on project objectives, geography, sector focus, and beneficiary profiles.",
    approachTitle: "Delivery Approach",
    closing: "Strong Outreach. Stronger Tomorrow.",
    cta: "Partner with Focalyt for scalable, community-driven mobilisation and outreach solutions for government and development initiatives.",
  },
  {
    id: "training-centers",
    emoji: "🏫",
    color: "#1565c0",
    label: "Training Centers",
    tagline: "Strong Infrastructure. Skilled Futures.",
    overview:
      "Focalyt develops and operates diverse models of training centers to ensure accessibility, industry relevance, practical learning, and inclusive participation across different geographies and beneficiary groups. We establish training centers through institutional partnerships, industry collaborations, rural outreach models, mobile training solutions, and advanced Centers of Excellence.",
    subcards: [
      {
        num: "01",
        title: "Academic Institution Based Training Centers",
        color: "#1565c0",
        overview: "Training centers established within schools, colleges, universities, ITIs, and educational institutions to integrate skill development with formal education.",
        features: ["Campus-based skill development labs and classrooms", "Integration with academic ecosystem", "Future technology and employability training", "Easy access for students and youth", "Institutional collaboration model"],
        advantages: ["Utilizes existing educational infrastructure", "Higher student participation and continuity", "Promotes skill integration with academics", "Cost-effective and scalable model", "Encourages innovation and future-ready learning"],
        suitable: ["Schools and Colleges", "Universities and ITIs", "Future Technology Labs", "AI, IoT, Robotics, Drone, Coding Programs", "Career readiness initiatives"],
      },
      {
        num: "02",
        title: "Industry Led Training Centers",
        color: "#1a7a4a",
        overview: "Training centers developed in collaboration with industries and employers to provide practical, job-oriented, and placement-linked skill training aligned with market demand.",
        features: ["Industry-aligned curriculum", "Practical and hands-on training", "Real equipment and workplace simulation", "Placement-focused delivery", "Industry expert involvement"],
        advantages: ["Improves employability and job readiness", "Exposure to real industry practices", "Better placement opportunities", "Strong industry linkage and feedback loop", "Updated training aligned with market trends"],
        suitable: ["Manufacturing and ESDM", "Telecom and Electronics", "Hospitality and Retail", "Industrial and Technical Training", "Placement-linked government projects"],
      },
      {
        num: "03",
        title: "Training Centers Near Remote & Rural Areas",
        color: "#e65100",
        overview: "Community-based training centers established close to rural, tribal, aspirational, and underserved regions to improve accessibility and participation.",
        features: ["Local community outreach", "Rural and tribal accessibility", "Women and SHG participation support", "Community engagement driven model", "Livelihood-oriented training delivery"],
        advantages: ["Reduces travel barriers for beneficiaries", "Encourages participation from rural youth and women", "Supports local livelihoods and community development", "Creates inclusive access to skill training", "Bridges urban-rural opportunity gaps"],
        suitable: ["Rural and Tribal Communities", "SHG and Livelihood Programs", "Agriculture and Agritech Training", "Environment and Sustainability Programs", "Community Development Initiatives"],
      },
      {
        num: "04",
        title: "Mobile Vans as Training Centers",
        color: "#6a1f9a",
        overview: "Mobile training vans equipped with training infrastructure, digital tools, and awareness material to deliver last-mile skilling and outreach in remote and hard-to-reach areas.",
        features: ["Portable and mobile learning setup", "Flexible deployment across locations", "Digital and practical training support", "Awareness and counselling campaigns", "Short-term and need-based training delivery"],
        advantages: ["Brings training directly to beneficiaries", "Ideal for remote and underserved regions", "Cost-effective outreach solution", "Enables rapid deployment for community initiatives", "Ensures last-mile impact and accessibility"],
        suitable: ["Rural Outreach Programs", "Awareness Campaigns", "Digital Literacy Initiatives", "Short-Term Skill Programs", "Aspirational District Projects"],
      },
      {
        num: "05",
        title: "Centers of Excellence (CoE)",
        color: "#00838f",
        overview: "Advanced training and innovation centers focused on future technologies, high-end skill development, research-oriented learning, and industry-driven innovation ecosystems.",
        features: ["Advanced technology labs and infrastructure", "Specialized future-ready skill programs", "Industry and institutional collaboration", "Innovation and project-based learning", "High-quality trainer and expert ecosystem"],
        advantages: ["Creates future-ready workforce", "Promotes innovation, R&D, and applied learning", "Supports emerging technologies and advanced skilling", "Enhances industry-academia collaboration", "Develops specialized talent pipelines"],
        suitable: ["AI and Data Science", "IoT and Robotics", "Drone Technology", "Industry 4.0", "Advanced Manufacturing", "Future Technology Innovation Programs"],
      },
    ],
    commit: [
      "Accessibility across geographies",
      "Industry relevance and employability",
      "Inclusion of underserved communities",
      "Future-ready skill development",
      "Practical and experiential learning",
      "Scalable implementation for government and CSR initiatives",
    ],
    commitTitle: "Our Training Center Approach",
    closing: "Multiple Models. One Goal — Creating Skilled, Future-Ready Communities.",
    cta: "Partner with Focalyt to build future-ready training centers and transform lives through quality skill development.",
  },
  {
    id: "trainers",
    emoji: "👨‍🏫",
    color: "#6a1f9a",
    label: "Trainers",
    tagline: "Skilled Trainers. Stronger Learning. Better Outcomes.",
    overview:
      "Focalyt believes that quality trainers are the foundation of impactful skill development and successful learning outcomes. Our trainer ecosystem is designed to deliver industry-relevant, practical, learner-centric, and future-ready training across government initiatives, CSR programs, educational institutions, and community development projects.",
    subcards: [
      {
        num: "01",
        title: "Training of Trainers (ToT)",
        color: "#1a7a4a",
        overview: "Focalyt conducts structured Training of Trainers (ToT) programs to build trainer capacity, standardize delivery quality, and strengthen implementation capabilities across projects and geographies.",
        features: ["Trainer certification and upskilling programs", "Standardized training methodologies", "Curriculum orientation and pedagogy training", "Technology-enabled training delivery", "Assessment and quality monitoring support"],
      },
      {
        num: "02",
        title: "Industry Experienced Trainers",
        color: "#1565c0",
        overview: "Industry experienced trainers bring practical exposure, real-world insights, and workplace-oriented learning into the training ecosystem to enhance employability and job readiness.",
        features: ["Trainers with hands-on industry experience", "Practical and application-based learning", "Exposure to current industry standards and practices", "Real equipment and workplace simulation training", "Industry case studies and problem-solving approach"],
      },
      {
        num: "03",
        title: "Domain Trainers",
        color: "#6a1f9a",
        overview: "Domain trainers specialize in technical and sector-specific skill development programs across multiple industries and future technologies.",
        features: ["Sector-specific expertise and knowledge", "Technical training and practical demonstrations", "Curriculum-aligned learning delivery", "Hands-on skill development approach", "Assessment and competency-based training"],
      },
      {
        num: "04",
        title: "Soft Skill & Entrepreneurial Skills Trainers",
        color: "#e65100",
        overview: "Soft skill and entrepreneurial skills trainers focus on personality development, communication skills, workplace behavior, entrepreneurship readiness, confidence building, and employability enhancement.",
        features: ["Communication and interpersonal skills training", "Personality development and confidence building", "Entrepreneurial mindset and business orientation", "Workplace etiquette and professionalism", "Interview preparation and career readiness", "Leadership, teamwork, and problem-solving skills", "Financial literacy and basic business awareness"],
      },
    ],
    commit: [
      "High-quality and standardized training delivery",
      "Industry relevance and practical learning",
      "Future-ready skill development",
      "Learner-centric and engaging pedagogy",
      "Inclusive and community-focused training approaches",
      "Scalable implementation across multiple geographies and sectors",
    ],
    commitTitle: "Our Trainer Ecosystem",
    delivery: ["Technical expertise", "Practical exposure", "Digital learning tools", "Interactive methodologies", "Community engagement approaches", "Industry-oriented delivery models"],
    closing: "Skilled Trainers. Stronger Learning. Better Outcomes.",
    cta: "Partner with Focalyt to build a strong trainer ecosystem for impactful skill development.",
  },
  {
    id: "training-delivery",
    emoji: "📚",
    color: "#1a7a4a",
    label: "Training Delivery",
    tagline: "Comprehensive Learning. Real Skills. Real Impact.",
    overview:
      "Focalyt follows a comprehensive and outcome-oriented training delivery model designed to build technical competencies, practical exposure, workplace readiness, and future-ready skills among learners. Our training methodology combines classroom learning, hands-on practice, industry engagement, experiential learning, and holistic development.",
    subcards: [
      { num: "01", title: "Theory Sessions", color: "#1a7a4a", emoji: "📖", overview: "Structured classroom and digital learning sessions designed to build conceptual understanding, domain knowledge, and foundational competencies.", features: ["Curriculum-aligned learning delivery", "Interactive classroom sessions", "Digital and blended learning methodologies", "Sector-specific theoretical concepts", "Technology-enabled content delivery", "Industry-oriented learning modules"], focus: ["Technical knowledge", "Industry concepts and standards", "Process understanding", "Safety and compliance awareness", "Future technology orientation", "Communication and workplace readiness"] },
      { num: "02", title: "Practical Training", color: "#1565c0", emoji: "🔧", overview: "Hands-on practical training focused on skill application, equipment handling, simulations, and experiential learning to strengthen competency and confidence.", features: ["Lab-based and hands-on training", "Equipment handling and demonstrations", "Simulation-based learning", "Real-time problem-solving exercises", "Practice-oriented skill development", "Technology and tool-based learning"], focus: ["Technical skill competency", "Practical implementation", "Operational efficiency", "Industry process simulations", "Application-based learning", "Confidence building through practice"] },
      { num: "03", title: "On Job Training (OJT)", color: "#2e7d32", emoji: "🏭", overview: "Industry-integrated on-the-job training designed to provide learners with real workplace exposure, operational understanding, and practical work experience.", features: ["Workplace-based learning", "Exposure to real work environments", "Industry mentorship and supervision", "Task-based learning assignments", "Productivity and performance orientation", "Workplace discipline and professional behavior"], focus: ["Real-time industry exposure", "Job role understanding", "Workplace communication", "Operational processes and workflows", "Team collaboration and professionalism", "Employability enhancement"] },
      { num: "04", title: "Industry Exposure", color: "#6a1f9a", emoji: "🏢", overview: "Industry exposure activities help learners understand workplace practices, emerging technologies, industrial operations, and career opportunities through direct interaction with industry ecosystems.", features: ["Industry visits and exposure sessions", "Guest lectures by industry experts", "Interaction with professionals and employers", "Exposure to industrial processes and technologies", "Career awareness and guidance sessions", "Employer engagement activities"], focus: ["Understanding industry expectations", "Exposure to current technologies and trends", "Workplace culture and practices", "Career pathway awareness", "Industry networking opportunities", "Bridging academia and industry"] },
      { num: "05", title: "Capstone Projects", color: "#e65100", emoji: "💡", overview: "Capstone projects provide learners with opportunities to apply their knowledge and skills to solve practical challenges, develop innovative solutions, and build project execution capabilities.", features: ["Project-based experiential learning", "Team collaboration and innovation", "Problem-solving and critical thinking", "Industry and technology-oriented projects", "Research and practical implementation", "Presentation and project evaluation support"], focus: ["Innovation and creativity", "Applied learning and execution", "Technical and analytical skills", "Teamwork and leadership", "Industry problem-solving approach", "Portfolio and project readiness"] },
      { num: "06", title: "Extra Curricular Activities", color: "#00838f", emoji: "🎭", overview: "Extra curricular activities are integrated into the training ecosystem to support personality development, leadership, teamwork, communication, confidence building, and overall learner engagement.", features: ["Group activities and competitions", "Leadership and team-building exercises", "Communication and presentation activities", "Cultural and engagement events", "Entrepreneurship and innovation activities", "Motivation and confidence-building sessions"], focus: ["Personality development", "Leadership and teamwork", "Communication effectiveness", "Creativity and innovation", "Confidence and motivation", "Holistic learner development"] },
    ],
    commit: ["Practical and experiential learning", "Industry relevance and employability", "Learner-centric engagement", "Future-ready skill development", "Holistic personality and career development", "Outcome-driven implementation across sectors and geographies"],
    commitTitle: "Our Training Delivery Approach",
    closing: "Learning Beyond Classrooms. Building Skills for Real-World Success.",
    cta: "Partner with Focalyt to deliver impactful training experiences and create brighter futures.",
  },
  {
    id: "assessments",
    emoji: "🏅",
    color: "#1565c0",
    label: "Assessments & Certifications",
    tagline: "Recognizing Skills. Validating Competencies. Enabling Careers.",
    overview:
      "Focalyt follows a structured assessment and certification framework designed to validate learner competencies, ensure industry alignment, and enhance employability outcomes. Our assessment ecosystem focuses on transparent evaluation, practical competency measurement, quality assurance, and industry-recognized certification.",
    subcards: [
      { num: "01", title: "Industry Recognized Certification", color: "#1a7a4a", emoji: "📜", overview: "Focalyt facilitates industry-recognized certifications that validate technical competencies, practical skills, and employability readiness across multiple sectors and emerging technologies.", features: ["Certifications aligned with industry standards", "Sector Skill Council and institutional certifications", "Co-branded and project-based certifications", "Future-ready technology certifications", "Skill competency and employability validation", "Recognition across industries and sectors"] },
      { num: "02", title: "Third Party Assessment", color: "#1565c0", emoji: "✅", overview: "Third-party assessments are conducted through independent assessment agencies, industry experts, and authorized bodies to ensure transparency, objectivity, and quality assurance in the evaluation process.", features: ["Independent and unbiased evaluation process", "Practical and theory-based assessments", "Competency-based skill evaluation", "Standardized assessment methodologies", "Quality monitoring and compliance support", "Sector and job-role aligned evaluation criteria"] },
      { num: "03", title: "Certification Ceremonies", color: "#6a1f9a", emoji: "🎓", overview: "Certification ceremonies are organized to recognize learner achievements, celebrate successful program completion, and motivate candidates toward career growth, employment, entrepreneurship, and lifelong learning.", features: ["Formal certification distribution events", "Participation of industry, institutional, and government stakeholders", "Recognition of learner achievements and performance", "Community and stakeholder engagement", "Motivation and confidence-building initiatives", "Showcase of project outcomes and success stories"] },
    ],
    blocks: [
      {
        title: "Our Assessment & Certification Approach",
        emoji: "🎯",
        items: ["Transparent and standardized evaluation processes", "Industry relevance and credibility", "Practical competency measurement", "Outcome-oriented certification systems", "Enhanced employability and career readiness", "Quality assurance across programs and geographies"],
      },
      {
        title: "Assessment Methodology",
        emoji: "📊",
        items: ["Theory-based evaluation", "Practical skill assessment", "Industry-aligned competency checks", "Continuous performance monitoring", "Third-party validation mechanisms", "Project and application-based evaluation approaches"],
      },
    ],
    impact: ["Validates Skills & Knowledge", "Improves Employability", "Builds Industry Trust & Confidence", "Opens Doors to Better Opportunities", "Encourages Lifelong Learning"],
    closing: "Recognizing Skills. Validating Competencies. Enabling Careers.",
    cta: "Partner with Focalyt to build credible assessment and certification ecosystems for stronger career outcomes.",
  },
  {
    id: "placements",
    emoji: "💼",
    color: "#e65100",
    label: "Placements & Employment",
    tagline: "From Skills to Careers. From Learning to Livelihoods.",
    overview:
      "Focalyt follows a structured placement and employment approach focused on connecting trained candidates with meaningful career opportunities, industry requirements, entrepreneurship pathways, and sustainable livelihoods. Our placement ecosystem is designed to bridge the gap between skilling and employment through strong industry partnerships, placement facilitation, candidate readiness, and continuous support mechanisms.",
    subcards: [
      { num: "01", title: "Industry Tie-Ups", color: "#1565c0", emoji: "🤝", overview: "Focalyt collaborates with industries, employers, MSMEs, and sector partners to create strong placement ecosystems and ensure alignment between training delivery and workforce requirements.", features: ["Partnerships with industries and employers", "Placement-linked skilling models", "Industry-aligned job opportunities", "Employer engagement and workforce planning", "Sector-specific placement partnerships", "Continuous industry relationship management"], focus: ["Manufacturing and ESDM", "Telecom and Electronics", "Hospitality and Tourism", "Retail and Services", "IT and Emerging Technologies", "MSME and Industrial Workforce Development"] },
      { num: "02", title: "Placement Drives", color: "#1a7a4a", emoji: "📋", overview: "Placement drives are organized to connect trained candidates directly with employers through interviews, hiring events, campus placements, and recruitment activities.", features: ["Campus and center-based placement drives", "Employer interaction sessions", "Interview and recruitment support", "Job fairs and hiring events", "Candidate profiling and job matching", "Pre-placement orientation and readiness support"], focus: ["Candidate-employer interaction", "Placement opportunities across sectors", "Recruitment facilitation and coordination", "Interview preparation and confidence building", "Industry exposure and networking", "Employment-focused outcomes"] },
      { num: "03", title: "Offer Letters", color: "#6a1f9a", emoji: "📄", overview: "Focalyt supports candidates through the employment onboarding process by facilitating offer letter issuance, employer communication, documentation assistance, and joining coordination.", features: ["Offer letter facilitation support", "Documentation and onboarding guidance", "Employer-candidate coordination", "Joining process assistance", "Employment communication support", "Placement tracking and reporting"], focus: ["Smooth candidate onboarding", "Transparent placement processes", "Employer coordination and communication", "Candidate confidence and preparedness", "Employment documentation support", "Placement outcome management"] },
      { num: "04", title: "Hand Holding Support", color: "#e65100", emoji: "🌱", overview: "Focalyt provides continuous hand holding and post-placement support to help candidates successfully transition into workplaces, adapt to professional environments, and sustain employment outcomes.", features: ["Post-placement follow-up and counselling", "Workplace adjustment support", "Career guidance and mentoring", "Migration and relocation support where applicable", "Soft skill and workplace behavior reinforcement", "Problem resolution and candidate engagement"], focus: ["Candidate retention and stability", "Workplace confidence and adaptation", "Professional communication and conduct", "Career progression support", "Employee well-being and motivation", "Long-term employability enhancement"] },
    ],
    commit: ["Industry-linked employment opportunities", "Placement-oriented training delivery", "Candidate readiness and confidence building", "Employer engagement and workforce alignment", "Sustainable livelihood and career support", "Scalable placement solutions across sectors and geographies"],
    commitTitle: "Our Placement Approach",
    ecosystem: ["Industry partnerships and employer networks", "Placement drives and hiring events", "Candidate screening and job matching", "Interview preparation and soft skill support", "Offer letter and onboarding assistance", "Post-placement hand holding and mentoring"],
    closing: "From Skills to Careers. From Learning to Livelihoods.",
    cta: "Partner with Focalyt to connect skilled talent with meaningful career opportunities.",
  },
  {
    id: "entrepreneurship",
    emoji: "🌱",
    color: "#1a7a4a",
    label: "Entrepreneurship & Livelihoods",
    tagline: "Empowering Entrepreneurs. Building Livelihoods. Transforming Communities.",
    overview:
      "Focalyt promotes entrepreneurship and sustainable livelihood development by empowering individuals, youth, women, SHGs, rural communities, tribal populations, and aspiring entrepreneurs with the skills, knowledge, mentorship, and ecosystem support required to create self-employment and income-generation opportunities.",
    subcards: [
      { num: "01", title: "Entrepreneurship Development Programs", color: "#1a7a4a", emoji: "💡", overview: "Structured entrepreneurship development programs designed to build entrepreneurial mindset, business awareness, innovation capabilities, and enterprise management skills among learners and community groups.", features: ["Entrepreneurship orientation and awareness", "Business planning and enterprise development", "Innovation and problem-solving approach", "Startup and self-employment readiness", "Market understanding and opportunity identification", "Entrepreneurial mindset and leadership development"] },
      { num: "02", title: "SHG & Community Livelihood Support", color: "#1565c0", emoji: "👩‍👩‍👧", overview: "Focalyt works with Self Help Groups (SHGs), women groups, rural communities, and tribal households to strengthen livelihood opportunities, income generation, and community-based enterprise development.", features: ["SHG capacity building and training", "Livelihood and income-generation activities", "Community-based enterprise support", "Rural and tribal entrepreneurship promotion", "Women empowerment initiatives", "Skill-based livelihood enhancement programs"] },
      { num: "03", title: "Business Mentorship & Handholding Support", color: "#6a1f9a", emoji: "🧭", overview: "Focalyt provides continuous mentorship and handholding support to aspiring entrepreneurs and livelihood beneficiaries to help them establish, manage, and sustain enterprises successfully.", features: ["Business mentoring and guidance", "Enterprise setup support", "Operational and business management assistance", "Market and customer understanding", "Growth and sustainability guidance", "Continuous entrepreneur engagement and support"] },
      { num: "04", title: "Financial Literacy & Digital Empowerment", color: "#e65100", emoji: "📱", overview: "Financial literacy and digital empowerment initiatives help beneficiaries understand financial management, digital tools, business transactions, and technology-enabled livelihood opportunities.", features: ["Basic financial literacy training", "Digital payment and transaction awareness", "Budgeting and financial planning support", "Digital business and marketing orientation", "Awareness of government schemes and support systems", "Technology-enabled entrepreneurship learning"] },
      { num: "05", title: "Market Linkages & Enterprise Exposure", color: "#00838f", emoji: "🛒", overview: "Focalyt supports entrepreneurs and livelihood beneficiaries through market linkage initiatives, exposure opportunities, and ecosystem engagement to strengthen business visibility and growth potential.", features: ["Market linkage facilitation", "Buyer and stakeholder engagement", "Exposure visits and networking opportunities", "Product and service awareness support", "Community and institutional partnerships", "Promotion of local enterprise ecosystems"] },
    ],
    commit: ["Promotion of self-employment and enterprise development", "Community-driven economic empowerment", "Inclusion of women, SHGs, rural, and tribal communities", "Sustainable livelihood creation", "Future-ready entrepreneurial skills", "Scalable and impact-driven implementation models"],
    commitTitle: "Our Entrepreneurship & Livelihood Approach",
    ecosystem: ["Skill development and enterprise orientation", "Mentorship and handholding support", "Financial and digital literacy", "Community mobilisation and engagement", "Market exposure and ecosystem partnerships", "Livelihood-focused implementation strategies"],
    stats: [
      { emoji: "👥", value: "5,000+", label: "Aspiring Entrepreneurs Supported" },
      { emoji: "🏢", value: "2,500+", label: "Enterprises Facilitated" },
      { emoji: "👩", value: "60%+", label: "Women Entrepreneurs Empowered" },
      { emoji: "💰", value: "35+", label: "Sectors & Livelihood Opportunities" },
      { emoji: "📈", value: "Sustainable", label: "Incomes & Stronger Communities" },
    ],
    closing: "Empowering Job Creators. Strengthening Livelihoods. Transforming Communities.",
    cta: "Partner with Focalyt to empower entrepreneurs and build sustainable livelihoods across communities.",
  },
];

function Tagline({ text, color }) {
  const parts = text.split(". ").filter(Boolean);
  if (parts.length <= 1) return <span style={{ color }}>{text}</span>;
  return (
    <>
      {parts.slice(0, -1).join(". ")}.{" "}
      <span style={{ color }}>{parts[parts.length - 1]}</span>
    </>
  );
}

function CheckList({ items, color }) {
  return (
    <ul className="oa-list">
      {items.map((item) => (
        <li key={item}>
          <span className="oa-chk" style={{ background: color }}>✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function InfoBlock({ block, color }) {
  return (
    <div className="oa-block" style={{ "--block-accent": color, "--dot-color": color }}>
      <div className="oa-block-head">
        <div className="oa-block-ico" style={{ background: `${color}14`, border: `1.5px solid ${color}28` }}>
          {block.emoji}
        </div>
        <div className="oa-block-title">{block.title}</div>
      </div>
      <ul className="oa-info-list">
        {block.items.map((item) => (
          <li key={item} style={{ "--dot-color": color }}>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubCard({ card }) {
  return (
    <div className="oa-subcard">
      <div className="oa-subcard-bar" style={{ background: `linear-gradient(90deg, ${card.color}, ${card.color}88)` }} />
      <div className="oa-subcard-head">
        <div className="oa-subcard-num" style={{ background: card.color }}>
          {card.num}
        </div>
        <div className="oa-subcard-title" style={{ color: card.color }}>
          {card.emoji && <span style={{ marginRight: 6 }}>{card.emoji}</span>}
          {card.title}
        </div>
      </div>
      <div className="oa-subcard-body">
        <p>{card.overview}</p>
        {card.features && (
          <>
            <h5 style={{ color: card.color }}>Key Features</h5>
            <CheckList items={card.features} color={card.color} />
          </>
        )}
        {card.advantages && (
          <>
            <h5 style={{ color: card.color }}>Advantages</h5>
            <CheckList items={card.advantages} color={card.color} />
          </>
        )}
        {card.suitable && (
          <>
            <h5 style={{ color: card.color }}>Suitable For</h5>
            <CheckList items={card.suitable} color={card.color} />
          </>
        )}
        {card.focus && (
          <>
            <h5 style={{ color: card.color }}>Focus Areas</h5>
            <CheckList items={card.focus} color={card.color} />
          </>
        )}
      </div>
    </div>
  );
}

function PillarPanel({ pillar }) {
  const c = pillar.color;

  return (
    <div className="oa-panel" key={pillar.id}>
      <div className="oa-hero">
        <div>
          <div className="oa-hero-tag" style={{ background: `${c}18`, color: c, border: `1.5px solid ${c}33` }}>
            {pillar.emoji} {pillar.label}
          </div>
          <h3 style={{ color: "#0d2146" }}>
            <Tagline text={pillar.tagline} color={c} />
          </h3>
          <p>{pillar.overview}</p>
        </div>
        <div className="oa-hero-visual" style={{ background: `linear-gradient(135deg, ${c}22, ${c}08)`, border: `3px solid ${c}33` }}>
          {pillar.emoji}
        </div>
      </div>

      <div className="oa-body">
        {pillar.blocks && (
          <div className="oa-grid-2">
            {pillar.blocks.map((block) => (
              <InfoBlock key={block.title} block={block} color={c} />
            ))}
          </div>
        )}

        {pillar.approach && (
          <div className="oa-commit" style={{ borderColor: `${c}33` }}>
            <h4>{pillar.approachTitle || "Our Approach"}</h4>
            <p style={{ color: "#5a6680", fontSize: 14, lineHeight: 1.75, margin: 0 }}>{pillar.approach}</p>
            {pillar.id === "mobilisation" && (
              <div className="oa-flow">
                <div className="oa-flow-step"><span>👣</span> Outreach</div>
                <span className="oa-flow-arrow">→</span>
                <div className="oa-flow-step"><span>💬</span> Counselling</div>
                <span className="oa-flow-arrow">→</span>
                <div className="oa-flow-step"><span>📝</span> Enrollment</div>
              </div>
            )}
          </div>
        )}

        {pillar.subcards && (
          <div className={pillar.subcards.length <= 4 ? "oa-grid-2" : pillar.subcards.length === 5 ? "oa-grid-2" : "oa-grid-3"}>
            {pillar.subcards.map((card) => (
              <SubCard key={card.title} card={card} />
            ))}
          </div>
        )}

        {pillar.impact && (
          <div className="oa-pill-row">
            {pillar.impact.map((item, i) => (
              <div key={item} className="oa-pill">
                <span>{["🏅", "📈", "🤝", "🚪", "🎓"][i]}</span>
                {item}
              </div>
            ))}
          </div>
        )}

        {pillar.commit && (
          <div className="oa-commit" style={{ borderColor: `${c}33` }}>
            <h4>{pillar.commitTitle}</h4>
            <CheckList items={pillar.commit} color={c} />
            {pillar.delivery && (
              <>
                <h4 style={{ marginTop: 18 }}>Trainer Delivery Approach</h4>
                <p style={{ color: "#5a6680", fontSize: 13.5, marginBottom: 10 }}>Our trainers combine:</p>
                <CheckList items={pillar.delivery} color={c} />
              </>
            )}
            {pillar.ecosystem && (
              <>
                <h4 style={{ marginTop: 18 }}>{pillar.id === "placements" ? "Placement Support Ecosystem" : "Entrepreneurship Support Ecosystem"}</h4>
                <CheckList items={pillar.ecosystem} color={c} />
              </>
            )}
          </div>
        )}

        {pillar.stats && (
          <div className="oa-grid-4" style={{ marginTop: 8 }}>
            {pillar.stats.map((s) => (
              <div key={s.label} className="oa-block oa-block-stat" style={{ "--block-accent": c }}>
                <div style={{ fontSize: 28, marginBottom: 6 }}>{s.emoji}</div>
                <div style={{ fontFamily: "'Baloo 2', cursive", fontWeight: 800, fontSize: 20, color: c }}>{s.value}</div>
                <div style={{ fontSize: 11.5, color: "#5a6680", fontWeight: 600, marginTop: 4, lineHeight: 1.4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        )}

        <div className="oa-closing">
          <p style={{ color: "#0d2146" }}>
            <Tagline text={pillar.closing} color={c} />
          </p>
        </div>

        <div className="oa-cta">
          <div className="oa-cta-text">
            <span style={{ fontSize: 32 }}>{pillar.emoji}</span>
            <div>
              <strong>{pillar.closing}</strong>
              <p>{pillar.cta}</p>
            </div>
          </div>
          <Link to="/contact" className="oa-cta-btn">
            Let&apos;s Create Impact Together →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OurApproachSection() {
  const [active, setActive] = useState(0);
  const pillar = PILLARS[active];

  return (
    <>
      <style>{STYLES}</style>
      <section className="oa" id="our-approach" style={{ padding: "72px 0", position: "relative", overflow: "hidden" }}>
        <div className="oa-blob" style={{ width: 340, height: 340, background: "#1a7a4a", top: "-8%", left: "-4%" }} />
        <div className="oa-blob" style={{ width: 280, height: 280, background: "#1565c0", top: "40%", right: "-6%" }} />
        <div className="oa-blob" style={{ width: 220, height: 220, background: "#6a1f9a", bottom: "5%", left: "30%" }} />

        <div className="oa-wrap" style={{ textAlign: "center", marginBottom: 8 }}>
          <div className="oa-badge">🎯 Our Approach</div>
          <h2 className="oa-title">
            Integrated <span style={{ color: "#1a7a4a" }}>Implementation</span> Ecosystem
          </h2>
          <p className="oa-subtitle">
            A holistic framework connecting mobilisation, training infrastructure, expert trainers, delivery, assessments, placements, and entrepreneurship — designed to create skilled, employable, and future-ready communities.
          </p>
        </div>

        <div className="oa-wrap">
          <div className="oa-tabs" role="tablist" aria-label="Our Approach pillars">
            {PILLARS.map((p, i) => (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={active === i}
                className={`oa-tab${active === i ? " active" : ""}`}
                onClick={() => setActive(i)}
              >
                <span className="oa-tab-ico">{p.emoji}</span>
                {p.label}
              </button>
            ))}
          </div>

          <PillarPanel pillar={pillar} />
        </div>
      </section>

      <div style={{ height: 5, background: "linear-gradient(90deg,#1a7a4a,#1565c0,#6a1f9a,#e65100)" }} />
    </>
  );
}
