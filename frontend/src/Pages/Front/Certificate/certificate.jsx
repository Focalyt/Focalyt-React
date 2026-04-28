import React from 'react'

function Certificate() {
    return (
        <div className="certificatePage">
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
  .certificatePage, .certificatePage * { box-sizing: border-box; }
  .certificatePage {
    background-color: #e8e8e8;
    min-height: 100vh;
    padding: 40px 20px;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    font-family: 'Segoe UI', sans-serif;
  }
  .certificatePage .card {
    background: #ffffff;
    border-radius: 6px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.12);
    padding: 28px 32px 28px 32px;
    width: 100%;
    max-width: 540px;
    position: relative;
  }
  .certificatePage .icon {
    position: absolute;
    top: 20px;
    right: 24px;
    font-size: 18px;
    color: #aaa;
  }
  .certificatePage .name {
    font-size: 26px;
    font-weight: 400;
    color: #2c2c2c;
    margin-bottom: 8px;
    word-break: break-word;
  }
  .certificatePage .course {
    font-size: 14px;
    color: #2c2c2c;
    margin-bottom: 20px;
  }
  .certificatePage .course span {
    font-weight: 600;
  }
  .certificatePage .divider {
    border: none;
    border-top: 1px solid #e0e0e0;
    margin-bottom: 20px;
  }
  .certificatePage .dates {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  .certificatePage .date-row {
    font-size: 14px;
    color: #2c2c2c;
  }
  .certificatePage .date-row span {
    font-weight: 600;
  }

  @media (max-width: 480px) {
    .certificatePage {
      padding: 20px 12px;
    }
    .certificatePage .card {
      padding: 18px 16px;
    }
    .certificatePage .name {
      font-size: 20px;
    }
    .certificatePage .course,
    .certificatePage .date-row {
      font-size: 13px;
    }
    .certificatePage .icon {
      top: 12px;
      right: 12px;
    }
  }
                    `
                }
            </style>
        </div>
    );
}

export default Certificate;