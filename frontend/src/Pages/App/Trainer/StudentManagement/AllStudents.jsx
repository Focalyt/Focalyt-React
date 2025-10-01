import React, { useEffect, useState } from 'react'



function AllStudents(){
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Temporary mock data until API is connected
        const mockStudents = [
            { id: 1, name: 'Aman Verma', gender: 'Male', qualification: 'B.Tech', yearOfPassing: '2022', experience: 'Fresher' , category: 'AI'},
            { id: 2, name: 'Priya Sharma', gender: 'Female', qualification: 'B.Sc', yearOfPassing: '2021', experience: '1 Year', category: 'AI' },
            { id: 3, name: 'Rohit Singh', gender: 'Male', qualification: 'MCA', yearOfPassing: '2020', experience: '2 Years' , category: 'AI'},
            { id: 4, name: 'Neha Gupta', gender: 'Female', qualification: 'BCA', yearOfPassing: '2023', experience: 'Fresher', category: 'AI' }
        ]
        setStudents(mockStudents)
        setLoading(false)
    }, [])

    return(
        <>
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
                <div className="row breadcrumbs-top">
                    <div className="col-12">
                        <h3 className="content-header-title float-left mb-0">All Students</h3>
                        <div className="breadcrumb-wrapper col-12">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <a href="#">Students</a>
                                </li>
                                <li className="breadcrumb-item active">All Students</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section id="trainer-all-students">
            <div className="row">
                <div className="col-xl-12 col-lg-12">
                    <div className="card">
                        <div className="card-header border border-top-0 border-left-0 border-right-0">
                            <h4 className="card-title pb-1">All Students</h4>
                        </div>
                        <div className="card-content">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover-animation mb-0 table-hover">
                                        <thead>
                                            <tr>
                                                <th>Candidate</th>
                                                <th>Gender</th>
                                                <th>Qualification</th>
                                                <th>Year Of Passing</th>
                                                <th>Experience</th>
                                                <th>Course</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="5" className="text-center">Loading...</td>
                                                </tr>
                                            ) : students && students.length > 0 ? (
                                                students.map((student) => (
                                                    <tr key={student.id}>
                                                        <td className="text-capitalize">{student.name}</td>
                                                        <td className="text-capitalize">{student.gender || 'NA'}</td>
                                                        <td>{student.qualification || 'NA'}</td>
                                                        <td>{student.yearOfPassing || 'NA'}</td>
                                                        <td className="text-capitalize">{student.experience || 'NA'}</td>
                                                        <td className="text-capitalize">{student.category || 'NA'}</td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="5" className="text-center">No Result Found</td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}

export default AllStudents