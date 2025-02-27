import React from 'react'
import "./CandidateDashboard.css"
import CandidateLayout from '../../../../Component/Layouts/App/Candidates'
import CandidateHeader from '../../../../Component/Layouts/App/Candidates/CandidateHeader/CandidateHeader'
import CandidateSidebar from '../../../../Component/Layouts/App/Candidates/CandidateSidebar/CandidateSidebar'
const CandidateDashboard = () =>  {
    return (

        <CandidateLayout>
        {/* <div className="candidate-dashboard-sidebar">
          <CandidateSidebar />
        </div> */}
        
            <CandidateHeader />

            <div className='content-wrapper'>
                <div class="content-body  mb-4">
                    <a href="/candidate/cashback">
                        <div class="  height-structure bannerCan">
                        </div>
                    </a>

                    <section id="jobs_update  ">
                        <div class="row">

                            <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-2 mb-sm-0 mb-0 candidate-card">
                                <div class="card mt-1 mb-2">
                                    <div class="col-xl-12 py-1">
                                        <div class="row">
                                            <div class="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto">
                                                <h4 class="card-title mb-0" id="wrapping-bottom">Interested Companies / इच्छुक कंपनियां</h4>
                                            </div>
                                            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 text-right my-auto">
                                                <a href="/candidate/InterestedCompanies" class="btn btn-outline-primary btn-sm">View All</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="table-responsive">
                                            <table class="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Date & Time</th>
                                                        <th>Company</th>
                                                        <th>Industry</th>
                                                        <th>City</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="table-body">

                                                    <tr>
                                                        <td></td></tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <div class="col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12 mb-xl-0 mb-lg-0 mb-md-sm-0 mb-0 candidate-card">
                                <div class="card mt-1 mb-2">
                                    <div class="col-xl-12 py-1">
                                        <div class="row">
                                            <div class="col-xl-8 col-lg-8 col-md-8 col-sm-8 col-8 my-auto " >
                                                <h4 class="card-title mb-0" id="wrapping-bottom">Latest Applied Jobs / नवीनतम लागू नौकरियां</h4>
                                            </div>
                                            <div class="col-xl-4 col-lg-4 col-md-4 col-sm-4 col-4 text-right my-auto">
                                                <a href="/candidate/appliedJobs" class="btn btn-outline-primary btn-sm">View All</a>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="card-content">
                                        <div class="table-responsive">
                                            <table class="table table-hover-animation mb-0 table-hover">
                                                <thead>
                                                    <tr>
                                                        <th>Company</th>
                                                        <th>Industry</th>
                                                        <th>City</th>
                                                        <th>State</th>
                                                    </tr>
                                                </thead>
                                                <tbody id="table-body">

                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </section>

                </div>
            </div>
        </CandidateLayout>

    )
}

export default CandidateDashboard
