import React from 'react';
import FrontLayout from '../../../Component/Layouts/Front';

function JobCards() {
    return (
        <FrontLayout>
            <section className="jobs section-padding-60">
                <div className="container">
                    <div className="row">
                        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mx-auto mt-xxl-5 mt-xl-3 mt-lg-3 mt-md-3 mt-sm-3 mt-3">
                            <div className="row my-xl-5 my-lg-5 my-md-3 my-sm-3 my-5 mobileJobs">
                                <h1 className="text-center text-uppercase jobs-heading pb-4">Select jobs for your career</h1>



                                {/* Filter Container */}
                                <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                    <div className="filter-container">
                                        <div className="filter-headerss">
                                            <div className='row align-items-center justify-content-between'>
                                                <div className='col-md-6 col-12'>
                                                    <div className='filter-header'>
                                                        <span>▶</span>
                                                        <h2 className='fill--sec'>Filter by Sector</h2>
                                                    </div>

                                                </div>

                                                {/* Search Bar */}

                                                {/* <div className="col-md-3 col-12">
                            <div className="search-container">
                              <input
                                type="text"
                                className="form-control search-input"
                                placeholder="Search courses by Name, Location, Duration, etc."
                                value={searchTerm}
                                onChange={handleSearchChange} style={{ background: "transparent", border: "1px solid" }}
                              />
                              <span className="search-icon">
                                <FontAwesomeIcon icon={faSearch} />
                              </span>
                            </div>
                          </div> */}
                                            </div>

                                        </div>

                                        <div className="filter-buttonss">
                                            <button
                                                id="all"
                                                className={`filter-button text-uppercase ${activeFilter === "all" ? "active" : ""}`}
                                                onClick={() => handleFilterClick("all")}
                                            >
                                                All
                                                <span className="count">{Array.isArray(courses) ? courses.length : 0}</span>

                                                {activeFilter === "all" && <div className="active-indicator"></div>}
                                            </button>

                                            {Array.isArray(uniqueSectors) && uniqueSectors.map((sector) => (

                                                <button
                                                    key={sector._id}
                                                    id={`id_${sector._id}`}
                                                    className={`filter-button text-uppercase ${activeFilter === `id_${sector._id}` ? "active" : ""}`}
                                                    onClick={() => handleFilterClick(`id_${sector._id}`)}
                                                >
                                                    {sector.name}
                                                    <span className="count">
                                                        {courses.filter(course =>
                                                            course._industry &&
                                                            course._industry._id.toString() === sector._id.toString()
                                                        ).length}
                                                    </span>
                                                    {activeFilter === `id_${sector._id}` && <div className="active-indicator"></div>}
                                                </button>
                                            ))}
                                        </div>
                                        <div className='d-flex align-items-center d-md-none d-sm-block'>
                                            <span className="font-medium text-uppercase me-2">Selected Sector:</span>
                                            <span className="filter-button active text-uppercase">
                                                {activeFilter === "all"
                                                    ? "ALL"
                                                    : uniqueSectors.find(s => `id_${s._id}` === activeFilter)?.name || "ALL"}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* <CompanyPartners/> */}
                                {/* Selected Sector Display */}
                                <div className="d-flex justify-content-between gap-3 text-gray-600 mb-4 mt-3">
                                    <div className='sector--select'>
                                        <span className="font-medium text-uppercase me-2">Selected Sector:</span>
                                        <span className="filter-button active text-uppercase">
                                            {activeFilter === "all"
                                                ? "ALL"
                                                : uniqueSectors.find(s => `id_${s._id}` === activeFilter)?.name || "ALL"}
                                        </span>
                                    </div>
                                    {/* <div className='d-flex gap-1' ><span className="font-medium text-uppercase align-content-center me-2">Select Job Type:</span>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "all" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("all")}
                      >

                        ALL
                      </button>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "paid" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("paid")}
                      >
                        Paid
                      </button>
                      <button
                        className={`filter-button text-uppercase ${feeFilter === "free" ? "active" : ""}`}
                        onClick={() => handleFeeFilterClick("free")}
                      >
                        Free
                      </button>

                    </div> */}
                                </div>

                                {/* Course Cards */}
                                <div className="row">
                                    {filteredCourses.length > 0 ? (
                                        filteredCourses.map((course) => (
                                            <div key={course._id} className="col-lg-4 col-md-6 col-sm-12 col-12 pb-4 card-padd">
                                                <div className="card bg-dark courseCard">
                                                    <div className="bg-img">
                                                        {/* <a
                              href="#"
                              data-bs-target="#videoModal"
                              data-bs-toggle="modal"
                              data-bs-link={course.videos && course.videos[0] ? `${bucketUrl}/${course.videos[0]}` : ""}
                              className="pointer img-fluid"
                            >
                              <img
                                src={course.thumbnail
                                  ? `${bucketUrl}/${course.thumbnail}`
                                  : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                className="digi"
                                alt={course.name}
                              />
                              <img
                                src="/Assets/public_assets/images/newjoblisting/play.svg"
                                alt="Play"
                                className="group1"
                              />
                            </a> */}
                                                        <a
                                                            href="#"
                                                            data-bs-toggle="modal"
                                                            data-bs-target="#videoModal"
                                                            onClick={(e) => {
                                                                e.preventDefault(); // ✅ Prevents default link behavior
                                                                // setVideoSrc(course.videos && course.jobVideo ? `${bucketUrl}/${course.jobVideo}` : "");
                                                                // setVideoSrc(course.jobVideo);
                                                                if (course.jobVideo) {
                                                                    console.log("Opening video:", course.jobVideo);
                                                                    setVideoSrc(course.jobVideo);
                                                                } else {
                                                                    console.warn("No video found for this job");
                                                                    setVideoSrc("");
                                                                }
                                                            }}
                                                            className="pointer img-fluid"
                                                        >

                                                            <div className="verified-badge-container" style={{ position: "absolute", top: "10px", right: "10px", width: "60px", height: "60px", zIndex: "10" }}>
                                                                <span className="wave-ring wave-1"></span>
                                                                <span className="wave-ring wave-2"></span>
                                                                <span className="wave-ring wave-3"></span>
                                                                <img src="/Assets/public_assets/images/verified.png" className="digi verified-badge" alt={course.name} />
                                                            </div>
                                                            <img
                                                                src={course.jobVideoThumbnail ? `${course.jobVideoThumbnail}` : "/Assets/public_assets/images/newjoblisting/course_img.svg"}
                                                                //  src={getThumbnailUrl(course)}
                                                                className="digi"
                                                                alt={course.name}
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = "/Assets/public_assets/images/newjoblisting/course_img.svg";
                                                                }}
                                                            />


                                                            <img src="/Assets/public_assets/images/newjoblisting/play.svg" alt="Play" className="group1" />
                                                        </a>


                                                        <div className="flag"></div>
                                                        <div className="right_obj shadow shadow-new">
                                                            {course.courseType === 'coursejob' ? 'Course + Jobs' : 'Jobs'}
                                                        </div>
                                                    </div>

                                                    <div className="card-body px-0 pb-0">
                                                        <h4 class=" text-center course-title text-white fw-bolder text-truncate text-capitalize ellipsis mx-auto" style={{ fontSize: "25px!important", fontWeight: "700!important" }}>
                                                            {course.title}
                                                        </h4>
                                                        <h5
                                                            className="text-center text-white companyname mb-2 mx-auto text-capitalize ellipsis"
                                                            title={course.name}
                                                        >
                                                            ({course.displayCompanyName})
                                                        </h5>
                                                        {(
                                                            (course.isFixed && course.amount) ||
                                                            (!course.isFixed && course.min && course.max)
                                                        ) ? (
                                                            <p className="text-center digi-price mb-3 mt-3">
                                                                <span className="rupee text-white">₹ &nbsp;</span>
                                                                <span className="r-price text-white">
                                                                    {course.isFixed
                                                                        ? (course.amount || "--")
                                                                        : ((course.min && course.max) ? `${course.min}-${course.max}` : "--")}
                                                                </span>
                                                            </p>
                                                        ) : (
                                                            <p className="text-center digi-price mb-3 mt-3">
                                                                <span className="r-price text-white">--</span>
                                                            </p>
                                                        )}


                                                        <div className="row" id="course_height">
                                                            <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12">
                                                                <div className="col-xxl-10 col-xl-10 col-lg-10 col-md-10 col-sm-10 col-10 mx-auto mb-2">
                                                                    <div className="row">
                                                                        {/* Eligibility */}
                                                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                                                            <div className="row">
                                                                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                                                                    <figure className="text-end">
                                                                                        <img
                                                                                            src="/Assets/public_assets/images/newjoblisting/qualification.png"
                                                                                            className="img-fluid new_img p-0"
                                                                                            draggable="false"
                                                                                        />
                                                                                    </figure>
                                                                                </div>
                                                                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                                                                    <p className="mb-0 text-white" title={course._qualification?.name || 'N/A'}>
                                                                                        {course._qualification?.name || 'N/A'}
                                                                                    </p>

                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Duration */}
                                                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                                                            <div className="row">
                                                                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                                                                    <figure className="text-end">
                                                                                        <img
                                                                                            src="/Assets/public_assets/images/newjoblisting/fresher.png"
                                                                                            className="img-fluid new_img p-0"
                                                                                            draggable="false"
                                                                                        />
                                                                                    </figure>
                                                                                </div>
                                                                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">
                                                                                    <p className="mb-0 text-white" title={((course.experience == 0 && course.experienceMonths == 0) || (course.experience == 0 && !course.experienceMonths)
                                                                                        ? "Fresher"
                                                                                        : `${course.experience > 0 ? `${course.experience} ${course.experience === 1 ? 'Year' : 'Years'}` : ''} ${course.experienceMonths > 0 ? `${course.experienceMonths} ${course.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim())}>
                                                                                        {(course.experience == 0 && course.experienceMonths == 0) || (course.experience == 0 && !course.experienceMonths)
                                                                                            ? "Fresher"
                                                                                            : `${course.experience > 0 ? `${course.experience} ${course.experience === 1 ? 'Year' : 'Years'}` : ''} ${course.experienceMonths > 0 ? `${course.experienceMonths} ${course.experienceMonths === 1 ? 'Month' : 'Months'}` : ''}`.trim()}
                                                                                    </p>

                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Location */}
                                                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                                                            <div className="row">
                                                                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                                                                    <figure className="text-end">
                                                                                        <img
                                                                                            src="/Assets/public_assets/images/icons/location-pin.png"
                                                                                            className="img-fluid new_img p-0"
                                                                                            draggable="false"
                                                                                        />
                                                                                    </figure>
                                                                                </div>
                                                                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                                                                    <div className="ellipsis-wrapper">
                                                                                        <p
                                                                                            className="mb-0 text-white"
                                                                                            title={course.city ? `${course.city.name}, ${course.state.name}` : 'NA'}
                                                                                        >
                                                                                            {course.city
                                                                                                ? `(${course.city.name}, ${course.state.name})`
                                                                                                : 'NA'}

                                                                                        </p>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Mode */}
                                                                        <div className="col-xxl-6 col-xl-6 col-lg-6 col-md-6 col-sm-6 col-6 mb-2">
                                                                            <div className="row">
                                                                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 my-auto">
                                                                                    <figure className="text-end">
                                                                                        <img
                                                                                            src="/Assets/public_assets/images/newjoblisting/onsite.png"
                                                                                            className="img-fluid new_img p-0"
                                                                                            draggable="false"
                                                                                        />
                                                                                    </figure>
                                                                                </div>

                                                                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 text-white courses_features ps-0">

                                                                                    <p className="mb-0 text-white" title={course.work || 'N/A'}>
                                                                                        {course.work}

                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>

                                                                        {/* Last Date */}
                                                                        <div className="col-xxl-12 col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 mb-2 text-center">
                                                                            <div className="row">
                                                                                <div className="col-xxl-7 col-xl-7 col-lg-7 col-md-7 col-sm-7 col-7 my-auto">
                                                                                    <p className="text-white apply_date">Last Date for apply</p>
                                                                                </div>
                                                                                <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 text-white courses_features ps-0">
                                                                                    <p className="color-yellow fw-bold">
                                                                                        {course.validity
                                                                                            ? moment(course.validity).utcOffset("+05:30").format('DD MMM YYYY')
                                                                                            : 'NA'}
                                                                                    </p>
                                                                                </div>
                                                                            </div>
                                                                        </div>


                                                                        {/* Action Buttons */}
                                                                        <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center me-2">
                                                                            <a
                                                                                className="btn cta-callnow btn-bg-color shr--width"
                                                                                href={`/candidate/login?returnUrl=/candidate/job/${course._id}`}
                                                                            >
                                                                                Apply Now
                                                                            </a>
                                                                        </div>
                                                                        {/* <div className="col-xxl-4 col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 mb-2 text-center">
                                        <button onClick={() => openChatbot()} className="btn cta-callnow shr--width">
                                          Chat Now
                                        </button>
                                      </div> */}
                                                                        <div className="col-xxl-5 col-xl-5 col-lg-5 col-md-5 col-sm-5 col-5 mb-2 text-center ms-2">
                                                                            <button
                                                                                onClick={() => {
                                                                                    // Priority: jobVideoThumbnail only (backend will handle default image)
                                                                                    const thumbnail = course.jobVideoThumbnail || null;
                                                                                    handleShare(
                                                                                        course._id,
                                                                                        course.title || course.name,
                                                                                        thumbnail
                                                                                    );
                                                                                }}
                                                                                className="btn cta-callnow shr--width">
                                                                                {/* <Share2 size={16} className="mr-1" /> */}
                                                                                Share
                                                                            </button>
                                                                        </div>

                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Footer */}
                                                        <div className="col-xxl-12 col-12 col-lg-12 col-md-12 col-sm-12 col-12 course_card_footer">
                                                            <div className="row py-2">
                                                                <div className="col-xl-12 col-lg-12 col-md-12 col-sm-12 col-12 justify-content-center align-items-center text-center">
                                                                    <a href={`/candidate/login?returnUrl=/candidate/job/${course._id}`}>
                                                                        <span className="learnn pt-1 text-white">Learn More</span>
                                                                        <img src="/Assets/public_assets/images/link.png" className="align-text-top" />
                                                                    </a>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="col-12 text-center py-5">
                                            <h3 className="text-muted">No Jobs found matching your criteria</h3>
                                            <p>Try adjusting your search or filters to find more Jobs</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </FrontLayout>
    )
}


export default JobCards;