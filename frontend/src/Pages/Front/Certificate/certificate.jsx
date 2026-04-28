import React from 'react'

function Certificate() {
    return (
        <div>
            <div className="card">
                <div className="icon"></div>
                <div className="name">Varsha</div>
                <div className="course"><span>Course:</span> Big Data</div>
                <hr className="divider" />
                <div className="dates">
                    <div className="date-row"><span>Date From:</span> 24-11-2025</div>
                    <div className="date-row"><span>Date End:</span> 03-03-2026</div>
                </div>
            </div>
            <style>
                {
                    `
                     * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    background-color: #e8e8e8;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    padding: 40px 20px;
    min-height: 100vh;
    font-family: 'Segoe UI', sans-serif;
  }
  .card {
    background: #ffffff;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    padding: 28px 32px 28px 32px;
    width: 540px;
    position: relative;
  }
  .icon {
    position: absolute;
    top: 20px;
    right: 24px;
    font-size: 18px;
    color: #aaa;
  }
  .name {
    font-size: 26px;
    font-weight: 400;
    color: #2c2c2c;
    margin-bottom: 8px;
  }
  .course {
    font-size: 14px;
    color: #2c2c2c;
    margin-bottom: 20px;
  }
  .course span {
    font-weight: 600;
  }
  .divider {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin-bottom: 20px;
  }
  .dates {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .date-row {
    font-size: 14px;
    color: #2c2c2c;
  }
  .date-row span {
    font-weight: 600;
  }
                    `
                }
            </style>
        </div>
    );
}

export default Certificate;