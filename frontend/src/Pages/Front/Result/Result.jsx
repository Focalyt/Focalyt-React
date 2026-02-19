import React, { useMemo } from 'react'
import FrontLayout from '../../../Component/Layouts/Front'
function Result() {
    const results = useMemo(() => ([
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS01', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS02', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS03', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS04', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS05', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS06', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS07', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS08', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS09', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS10', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS11', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS12', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS13', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS14', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS15', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS16', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS17', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
        { project: 'MOT_Hunar Se Rojgar Tak', batchId: 'THS18', jobRoleCode: '(THC/Q0301)', jobRole: 'STT - F and B Service - Associate' },
    ]), []);

    const getPdfUrl = (batchId) => {
        console.log("PUBLIC_URL:", process.env.PUBLIC_URL);
        return `${process.env.PUBLIC_URL}/Assets/pdf/${batchId}.PDF`;
      };
      
    return (
        <>
            <FrontLayout>
                <section className="section-padding-120 mt-5 bg-white">
                    <div className="container">
                        <div className="result-section">
                            <h1
                                className="mb-4"
                                style={{
                                    color: "rgb(252, 43, 90)",
                                    fontFamily: '"Inter", sans-serif',
                                }}
                            >
                                Result
                            </h1>

                            <div
                                className="table-responsive"
                                style={{ maxHeight: "400px", overflowY: "auto" }}
                            >
                                <table className="table table-bordered table-hover align-middle">
                                    <thead className="table-light">
                                        <tr>
                                            <th style={{ position: "sticky", top: 0, zIndex: 2 }}>Project</th>
                                            <th style={{ position: "sticky", top: 0, zIndex: 2 }}>Batch ID</th>
                                            <th style={{ position: "sticky", top: 0, zIndex: 2 }}>Job Role Code</th>
                                            <th style={{ position: "sticky", top: 0, zIndex: 2 }}>Job Role</th>
                                            <th style={{ position: "sticky", top: 0, zIndex: 2 }}>Download Link</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {results.map((row) => (
                                            <tr key={`${row.batchId}-${row.jobRoleCode}`}>
                                                <td>{row.project}</td>
                                                <td>{row.batchId}</td>
                                                <td>{row.jobRoleCode}</td>
                                                <td>{row.jobRole}</td>
                                                <td>
                                                    <a
                                                        className="btn btn-sm btn-primary"
                                                        href={getPdfUrl(row.batchId)}
                                                        download={`${row.batchId}.PDF`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        Download Result
                                                    </a>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                    
                                </table>
                            </div>

                        </div>
                    </div>
                </section>

              
            </FrontLayout>
            <style>
                {`
                .result-section table tbody tr {
                    transition: background-color 0.2s ease, transform 0.15s ease;
                }

                .result-section table tbody tr:hover {
                    background-color: #f8f9ff;
                    transform: translateY(-1px);
                }

                .result-section a.btn.btn-primary {
                    background-color: rgb(252, 43, 90);
                    border-color: rgb(252, 43, 90);
                    transition: background-color 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease;
                }

                .result-section a.btn.btn-primary:hover {
                    background-color: #d51e48;
                    border-color: #d51e48;
                    box-shadow: 0 4px 10px rgba(252, 43, 90, 0.35);
                    transform: translateY(-1px);
                }

                @media (max-width: 576px) {
                    .result-section h1 {
                        font-size: 26px;
                        text-align: center;
                        margin-bottom: 1rem;
                    }

                    .result-section .table-responsive {
                        max-height: none;
                    }

                    .result-section table thead th {
                        font-size: 12px;
                        padding: 8px 6px;
                        white-space: nowrap;
                    }

                    .result-section table tbody td {
                        font-size: 11px;
                        padding: 8px 6px;
                    }

                    .result-section a.btn.btn-primary {
                        width: 100%;
                        display: inline-block;
                        padding: 6px 8px;
                        font-size: 12px;
                    }
                }
                `}
            </style>
        </>
    )
}

export default Result