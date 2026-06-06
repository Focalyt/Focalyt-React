import React, { useEffect, useMemo } from "react";
import { Download } from "lucide-react";
import FrontLayout from "../../../Component/Layouts/Front";

function Result() {
  const results = useMemo(
    () => [
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS01", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS02", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS03", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS04", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS05", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS06", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS07", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS08", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS09", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS10", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS11", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS12", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS13", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS14", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS15", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS16", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS17", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
      { project: "MOT_Hunar Se Rojgar Tak", batchId: "THS18", jobRoleCode: "(THC/Q0301)", jobRole: "STT - F and B Service - Associate" },
    ],
    []
  );

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-foc-theme", "sky-magenta");
    root.style.setProperty("--front-layout-bg", "var(--foc-color-bg)");
    return () => {
      root.style.removeProperty("--front-layout-bg");
    };
  }, []);

  const getPdfUrl = (batchId) => `${process.env.PUBLIC_URL}/Assets/pdf/${batchId}.PDF`;

  return (
    <FrontLayout>
      <div className="foc-cyber-home foc-results-page">
        <section className="section grid-bg" id="batch-results">
          <div className="container">
            <div className="section-head">
              <div className="stag">Training Outcomes</div>
              <h1 className="sh2">
                Batch <span className="cyan">Results</span>
              </h1>
              <p className="s-body">Download assessment results by batch ID for each completed training batch.</p>
            </div>

            <div className="results-panel">
              <div className="results-panel__meta">
                <span className="results-panel__tag">Available batches</span>
                <span className="results-panel__count">{results.length} results</span>
              </div>
              <div className="results-table-wrap">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>Project</th>
                      <th>Batch ID</th>
                      <th>Job Role Code</th>
                      <th>Job Role</th>
                      <th>Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((row) => (
                      <tr key={row.batchId}>
                        <td data-label="Project">{row.project}</td>
                        <td data-label="Batch ID">
                          <span className="results-batch-id">{row.batchId}</span>
                        </td>
                        <td data-label="Job Role Code">{row.jobRoleCode}</td>
                        <td data-label="Job Role">{row.jobRole}</td>
                        <td data-label="Download">
                          <a
                            className="results-download-btn"
                            href={getPdfUrl(row.batchId)}
                            download={`${row.batchId}.PDF`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <Download size={14} aria-hidden />
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
      </div>

      <style>{`
.foc-cyber-home.foc-results-page,
.foc-cyber-home.foc-results-page * { box-sizing: border-box; }
.foc-cyber-home.foc-results-page {
  --cyan: var(--foc-cyan);
  --red: var(--foc-magenta);
  --bg: var(--foc-color-bg);
  --surface: var(--foc-color-surface);
  --border: rgba(4, 25, 45, .12);
  --text: var(--foc-color-text);
  --muted: var(--foc-color-text-muted);
  --orb1: rgba(27,167,255,.14);
  --orb2: rgba(255,45,170,.12);
  --grid-line: rgba(6,20,38,.055);
  --cyan-soft: rgba(27,167,255,.085);
  --r: var(--foc-radius-lg);
  --ease: var(--foc-ease);
  font-family: var(--foc-font-sans);
  background: var(--bg);
  color: var(--text);
  min-height: 100%;
  position: relative;
  overflow-x: hidden;
  padding-top: 88px;
  padding-bottom: 48px;
}
.foc-results-page > section {
  padding: 24px 0 48px;
  background: var(--bg) !important;
  position: relative;
}
.foc-results-page .container {
  max-width: var(--foc-container-max);
  margin: 0 auto;
  padding: 0 var(--foc-container-pad);
  position: relative;
  z-index: 1;
}
.foc-results-page .grid-bg::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image:
    radial-gradient(circle at 18% 12%, var(--orb1) 0%, transparent 55%),
    radial-gradient(circle at 82% 28%, var(--orb2) 0%, transparent 60%),
    linear-gradient(var(--grid-line) 1px, transparent 1px),
    linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
  background-size: auto, auto, 48px 48px, 48px 48px;
  opacity: .9;
  pointer-events: none;
}
.foc-results-page .section-head { text-align: center; margin-bottom: 28px; }
.foc-results-page .stag {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  color: var(--cyan);
  font-size: 10px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  padding: 5px 14px;
  border-radius: 2px;
  margin-top: 24px;
  margin-bottom: 14px;
}
.foc-results-page .stag::before { content: '//'; color: var(--red); }
.foc-results-page .sh2 {
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: clamp(26px, 4vw, 44px);
  font-weight: 700;
  color: var(--text);
  line-height: 1.1;
  letter-spacing: .04em;
  margin: 0;
}
.foc-results-page .sh2 .cyan {
  background: linear-gradient(90deg, var(--cyan), var(--red));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
}
.foc-results-page .s-body {
  font-size: 15px;
  color: var(--muted);
  margin: 12px auto 0;
  text-align: center;
  line-height: 1.75;
  font-style: italic;
  // max-width: 640px;
}
.foc-results-page .results-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--r);
  padding: 18px;
  box-shadow: 0 12px 32px rgba(27, 167, 255, 0.08);
}
.foc-results-page .results-panel__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border);
}
.foc-results-page .results-panel__tag {
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: var(--cyan);
}
.foc-results-page .results-panel__count {
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
}
.foc-results-page .results-table-wrap {
  max-height: min(520px, 70vh);
  overflow: auto;
  border-radius: 8px;
  border: 1px solid var(--border);
  isolation: isolate;
  scrollbar-width: thin;
  scrollbar-color: rgba(27, 167, 255, 0.4) transparent;
}
.foc-results-page .results-table-wrap::-webkit-scrollbar { width: 6px; height: 6px; }
.foc-results-page .results-table-wrap::-webkit-scrollbar-thumb {
  background: rgba(27, 167, 255, 0.35);
  border-radius: 999px;
}
.foc-results-page .results-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-size: 14px;
}
.foc-results-page .results-table thead {
  position: sticky;
  top: 0;
  z-index: 5;
}
.foc-results-page .results-table thead th {
  position: sticky;
  top: 0;
  z-index: 5;
  background-color: var(--surface);
  background-image: linear-gradient(90deg, rgba(27,167,255,.1), rgba(255,45,170,.06));
  box-shadow: 0 1px 0 var(--border), 0 4px 10px rgba(4, 25, 45, 0.06);
  color: var(--text);
  font-family: var(--foc-font-display), Orbitron, sans-serif;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .08em;
  text-transform: uppercase;
  text-align: left;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  white-space: nowrap;
}
.foc-results-page .results-table tbody td {
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  color: var(--text);
  vertical-align: middle;
  line-height: 1.45;
}
.foc-results-page .results-table tbody tr:nth-child(even) {
  background: rgba(27, 167, 255, 0.03);
}
.foc-results-page .results-table tbody tr {
  transition: background-color 0.2s var(--ease);
}
.foc-results-page .results-table tbody tr:hover {
  background: rgba(27, 167, 255, 0.07);
}
.foc-results-page .results-batch-id {
  display: inline-block;
  font-weight: 700;
  font-size: 12px;
  letter-spacing: .06em;
  color: var(--cyan);
  background: var(--cyan-soft);
  border: 1px solid var(--border);
  padding: 3px 8px;
  border-radius: 4px;
}
.foc-results-page .results-download-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 14px;
  border-radius: 50px;
  font-family: var(--foc-font-sans), Inter, system-ui, sans-serif;
  font-size: 12px;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  background: var(--foc-color-cta, #fc2b5a);
  border: 1px solid var(--foc-color-cta, #fc2b5a);
  white-space: nowrap;
  transition: transform 0.2s var(--ease), box-shadow 0.2s var(--ease), background 0.2s ease;
}
.foc-results-page .results-download-btn:hover {
  color: var(--cyan);
  background: var(--foc-color-cta, #fc2b5a);
  transform: translateY(-1px);
  box-shadow: 0 8px 20px rgba(252, 43, 90, 0.28);
}
@media (max-width: 768px) {
  .foc-results-page .results-table thead { display: none; }
  .foc-results-page .results-table tbody tr {
    display: block;
    margin-bottom: 12px;
    border: 1px solid var(--border);
    border-radius: 8px;
    overflow: hidden;
    background: var(--surface);
  }
  .foc-results-page .results-table tbody td {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--border);
    font-size: 13px;
  }
  .foc-results-page .results-table tbody td:last-child { border-bottom: none; }
  .foc-results-page .results-table tbody td::before {
    content: attr(data-label);
    font-weight: 700;
    font-size: 10px;
    letter-spacing: .08em;
    text-transform: uppercase;
    color: var(--muted);
    flex-shrink: 0;
  }
  .foc-results-page .results-download-btn {
    width: 100%;
    margin-left: auto;
    max-width: 200px;
  }
  .foc-results-page .results-table-wrap { max-height: none; }
}
      `}</style>
    </FrontLayout>
  );
}

export default Result;
