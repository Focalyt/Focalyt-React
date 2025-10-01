import React from 'react';

export default function ViewCourses() {
    const bannerUrl = "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500";
    // Course sections with lectures; meta will auto-calc from array length
    const sections = [
        {
            title: 'Introduction',
            lectures: [
                { title: 'Welcome to the course', components: ['Course overview', 'Learning outcomes'] },
                { title: 'How this course works', components: ['Structure', 'Prerequisites', 'Tools setup'] },
                { title: 'Setting expectations', components: ['Project scope', 'Assessment', 'Support'] }
            ]
        },
        {
            title: 'Multi‑copter drone basics',
            lectures: [
                { title: 'Types of multi‑copters', components: ['Quadcopter', 'Hexacopter', 'Octocopter'] },
                { title: 'Frame and components', components: ['Arms & frame', 'Propellers', 'Mounts'] },
                { title: 'Flight controller overview', components: ['Sensors', 'PID basics', 'Calibration'] }
            ]
        },
        {
            title: 'ESC and motors',
            lectures: [
                { title: 'Motor basics', components: ['KV rating', 'Thrust', 'Efficiency'] },
                { title: 'ESC calibration', components: ['Throttle range', 'BLHeli config'] },
                { title: 'Safety checklist', components: ['Prop safety', 'Wiring checks'] }
            ]
        },
        {
            title: 'Power distribution board assembly',
            lectures: [
                { title: 'PDB overview', components: ['Voltage rails', 'BECs'] },
                { title: 'Wiring and soldering', components: ['Gauge selection', 'Solder joints', 'Heatshrink'] },
                { title: 'Testing and troubleshooting', components: ['Continuity test', 'Smoke stopper'] }
            ]
        }
    ];

    return (
        <>
            <div className="view-course-container">
                <div className="trainer-header">
                    <div className="breadcrumb">
                        <a href="/trainer/dashboard">Trainer</a>
                        <span className="sep">›</span>
                        <a href="/trainer/courses">Course Management</a>
                        <span className="sep">›</span>
                        <span className="current">View Course</span>
                    </div>
                    <span className="role-badge">Trainer Mode</span>
                </div>
                <div className="banner-wrapper">
                    <img src={bannerUrl} alt="Course banner" className="banner-img" />
                   
                </div>

                <div className="course-layout">
                    <div className="left">
                        <section className="card learn-card">
                            <h4 className="section-title">What you'll learn</h4>
                            <div className="learn-grid">
                                <ul>
                                    <li>Different types of multi-rotor drones</li>
                                    <li>Principles of drone flight</li>
                                    <li>Battery types and safe usage</li>
                                    <li>Bind a radio receiver and transmitter</li>
                                </ul>
                                <ul>
                                    <li>Flight terminology</li>
                                    <li>Role of propellers and motors</li>
                                    <li>Use of GPS in drone flight</li>
                                    <li>Pre-flight checks and safety</li>
                                </ul>
                            </div>
                        </section>

                        <section className="card includes-card">
                            <h4 className="section-title">This course includes:</h4>
                            <ul className="includes-list">
                                <li>11.5 hours on‑demand video</li>
                                <li>3 articles</li>
                                <li>5 downloadable resources</li>
                                <li>Access on mobile and TV</li>
                                <li>Certificate of completion</li>
                            </ul>
                        </section>

                        <section className="card content-card">
                            <h4 className="section-title">Course content</h4>
                            <div className="accordion" id="courseAccordion">
                                {sections.map((section, index) => {
                                    const headingId = `heading-${index+1}`;
                                    const collapseId = `acc-${index+1}`;
                                    return (
                                        <div className="accordion-item" key={collapseId}>
                                            <h2 className="accordion-header" id={headingId}>
                                                <button className="accordion-button collapsed d-flex justify-content-between" type="button" data-bs-toggle="collapse" data-bs-target={`#${collapseId}`} aria-expanded="false" aria-controls={collapseId}>
                                                    <span className="item-title">{section.title}</span>
                                                    <small className="text-muted item-meta">{section.lectures.length} lectures</small>
                                                </button>
                                            </h2>
                                            <div id={collapseId} className="accordion-collapse collapse" aria-labelledby={headingId} data-bs-parent="#courseAccordion">
                                                <div className="accordion-body">
                                                    <div className="accordion accordion-flush" id={`inner-${index+1}`}>
                                                        {section.lectures.map((lec, i) => {
                                                            const innerId = `inner-${index+1}-${i+1}`;
                                                            const innerHeading = `inner-heading-${index+1}-${i+1}`;
                                                            return (
                                                                <div className="accordion-item" key={innerId}>
                                                                    <h2 className="accordion-header" id={innerHeading}>
                                                                        <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target={`#${innerId}`} aria-expanded="false" aria-controls={innerId}>
                                                                            {lec.title}
                                                                        </button>
                                                                    </h2>
                                                                    <div id={innerId} className="accordion-collapse collapse" aria-labelledby={innerHeading} data-bs-parent={`#inner-${index+1}`}>
                                                                        <div className="accordion-body">
                                                                            <ul>
                                                                                {lec.components.map((c, ci) => (
                                                                                    <li key={ci}>{c}</li>
                                                                                ))}
                                                                            </ul>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </section>

                        <section className="card description-card">
                            <h4 className="section-title">About this course</h4>
                            <p>
                                Learn core Artificial Intelligence and Machine Learning concepts with practical projects.
                                This course covers supervised and unsupervised learning, model evaluation, and
                                deployment best practices.
                            </p>
                        </section>
                    </div>

                    <aside className="right">
                        <div className="manage-card card">
                            <div className="manage-head">
                                <span className="status active">Active</span>
                            </div>
                            <div className="manage-actions">
                                <button className="btn btn-primary btn-block">
                                    <i className="feather icon-edit mr-50"></i>
                                    Edit course
                                </button>
                                <button className="btn btn-outline-primary btn-block">
                                    <i className="feather icon-layers mr-50"></i>
                                    Manage lessons
                                </button>
                                
                            
                            </div>
                          
                        </div>
                    </aside>
                </div>
            </div>

            <style jsx>{`
                .view-course-container {
                    padding: 0;
                }

                .trainer-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 10px;
                }

                .breadcrumb { color: #6c757d; }
                .breadcrumb a { color: #6c757d; text-decoration: none; }
                .breadcrumb .sep { margin: 0 6px; }
                .breadcrumb .current { color: #343a40; font-weight: 600; }
                .role-badge {
                    background: rgba(40, 199, 111, 0.12);
                    color: #28c76f;
                    padding: 6px 10px;
                    border-radius: 16px;
                    font-weight: 700;
                    font-size: 12px;
                }

                .banner-wrapper {
                    position: relative;
                    height: 280px;
                    border-radius: 12px;
                    overflow: hidden;
                    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
                    margin-bottom: 18px;
                }

                .banner-img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                    transform: scale(1.02);
                }

                .banner-overlay {
                    position: absolute;
                    inset: 0;
                    background: linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.55) 100%);
                    color: #fff;
                    display: flex;
                    flex-direction: column;
                    justify-content: flex-end;
                    padding: 18px;
                }

                .category {
                    align-self: flex-start;
                    margin-bottom: 8px;
                    background: rgba(255,255,255,0.15);
                    backdrop-filter: blur(6px);
                    border-radius: 16px;
                    padding: 6px 10px;
                    font-weight: 600;
                }

                .title {
                    margin: 0 0 6px 0;
                    font-size: 1.4rem;
                    font-weight: 700;
                    line-height: 1.25;
                }

                .subtitle {
                    margin: 0;
                    opacity: 0.9;
                }

                .course-layout {
                    display: grid;
                    grid-template-columns: minmax(0, 1fr) 340px;
                    gap: 18px;
                }

                .card {
                    border: none;
                    border-radius: 12px;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
                    padding: 16px;
                    background: #fff;
                }

                .right .purchase-card { position: sticky; top: 18px; }
                .right .manage-card { position: sticky; top: 18px; }
                .manage-head { display:flex; justify-content:flex-end; margin-bottom: 8px; }
                .status { padding:4px 10px; border-radius: 14px; font-weight:700; font-size:12px; }
                .status.active { background: rgba(40,199,111,.12); color:#28c76f; }
                .manage-actions .btn-block { width:100%; margin-bottom:10px; }
                .manage-meta { font-size:12px; color:#6c757d; margin-top:6px; }

                .section-title { margin: 0 0 10px 0; font-weight: 700; }

                .learn-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 24px; }
                .learn-grid ul { list-style: none; padding: 0; margin: 0; }
                .learn-grid li::before { content: '✔'; color: #28c76f; margin-right: 8px; }

                .includes-list { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 16px; padding-left: 18px; margin: 0; }

                .accordion .accordion-button { font-weight: 600; }
                .accordion .item-title { flex: 1; }
                .accordion .item-meta { margin-left: 12px; }
                .accordion-body ul { margin: 0; padding-left: 18px; }

                .price { font-size: 1.6rem; font-weight: 800; margin-bottom: 10px; }
                .btn-block { width: 100%; margin-bottom: 10px; }
                .guarantee { font-size: 12px; color: #6c757d; margin-top: 6px; }
                .mini-actions { display: flex; gap: 8px; margin-top: 10px; }

                @media (max-width: 768px) {
                    .banner-wrapper { height: 220px; }
                    .course-layout { grid-template-columns: 1fr; }
                    .trainer-header { flex-direction: column; align-items: flex-start; gap: 6px; }
                }
            `}</style>
        </>
    );
}