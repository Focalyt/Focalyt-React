import React, { useEffect, useMemo, useState } from 'react'



function StudentProgress(){
    const [courseFilter, setCourseFilter] = useState('All')
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Mock progress data until API is connected
        const mock = [
            { id: 1, name: 'Aman Verma', course: 'AI & ML', progress: 72, attendance: 88, assignmentsCompleted: 14, totalAssignments: 18, avgScore: 81 },
            { id: 2, name: 'Priya Sharma', course: 'Python Programming', progress: 58, attendance: 92, assignmentsCompleted: 10, totalAssignments: 16, avgScore: 75 },
            { id: 3, name: 'Rohit Singh', course: 'Web Development', progress: 38, attendance: 70, assignmentsCompleted: 6, totalAssignments: 15, avgScore: 62 },
            { id: 4, name: 'Neha Gupta', course: 'AI & ML', progress: 84, attendance: 95, assignmentsCompleted: 16, totalAssignments: 18, avgScore: 88 }
        ]
        setStudents(mock)
        setLoading(false)
    }, [])

    const courses = useMemo(() => {
        const set = new Set(['All'])
        students.forEach(s => set.add(s.course))
        return Array.from(set)
    }, [students])

    const filtered = useMemo(() => {
        if (courseFilter === 'All') return students
        return students.filter(s => s.course === courseFilter)
    }, [students, courseFilter])

    return(
        <>
        <div className="content-header row d-xl-block d-lg-block d-md-none d-sm-none d-none">
            <div className="content-header-left col-md-9 col-12 mb-2">
                <div className="row breadcrumbs-top">
                    <div className="col-12">
                        <h3 className="content-header-title float-left mb-0">Student Progress</h3>
                        <div className="breadcrumb-wrapper col-12">
                            <ol className="breadcrumb">
                                <li className="breadcrumb-item">
                                    <a href="#">Students</a>
                                </li>
                                <li className="breadcrumb-item active">Progress</li>
                            </ol>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <section id="student-progress">
            <div className="row">
                <div className="col-xl-12 col-lg-12">
                    <div className="card">
                        <div className="card-header border border-top-0 border-left-0 border-right-0 d-flex justify-content-between align-items-center">
                            <h4 className="card-title pb-1">Progress Overview</h4>
                            <div className="d-flex align-items-center">
                                <label className="mr-1 mb-0">Course:</label>
                                <select className="form-control form-control-sm" style={{minWidth: '200px'}} value={courseFilter} onChange={(e) => setCourseFilter(e.target.value)}>
                                    {courses.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="card-body">
                                <div className="table-responsive">
                                    <table className="table table-hover-animation mb-0 table-hover">
                                        <thead>
                                            <tr>
                                                <th>Student</th>
                                                <th>Course</th>
                                                <th>Progress</th>
                                                <th>Attendance</th>
                                                <th>Assignments</th>
                                                <th>Avg. Score</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loading ? (
                                                <tr>
                                                    <td colSpan="6" className="text-center">Loading...</td>
                                                </tr>
                                            ) : filtered.length > 0 ? (
                                                filtered.map(s => (
                                                    <tr key={s.id}>
                                                        <td className="text-capitalize">{s.name}</td>
                                                        <td>{s.course}</td>
                                                        <td>
                                                            <div className="d-flex align-items-center">
                                                                <div className="progress flex-grow-1 mr-2" style={{height: '8px'}}>
                                                                    <div className="progress-bar bg-primary" style={{width: `${s.progress}%`}}></div>
                                                                </div>
                                                                <small className="font-weight-bold">{s.progress}%</small>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-light-success">{s.attendance}%</span>
                                                        </td>
                                                        <td>
                                                            {s.assignmentsCompleted}/{s.totalAssignments}
                                                        </td>
                                                        <td>
                                                            <span className="badge badge-light-info">{s.avgScore}%</span>
                                                        </td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr>
                                                    <td colSpan="6" className="text-center">No data</td>
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

export default StudentProgress