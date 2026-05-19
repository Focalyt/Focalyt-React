import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function Certificate() {
  const location = useLocation();
  const navigate = useNavigate();

  const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;

  const derived = useMemo(() => {
    const params = new URLSearchParams(location.search || "");

    const stateCert =
      location.state && typeof location.state === "object"
        ? location.state.certificate
        : null;

    const cert = {
      name: params.get("name") || stateCert?.name || "—",
      course: params.get("course") || stateCert?.course || "—",
      dateFrom: params.get("from") || stateCert?.dateFrom || "—",
      dateEnd: params.get("to") || stateCert?.dateEnd || "—",
    };

    const id = params.get("id") || stateCert?.id || stateCert?._id || "";
    return { certificate: cert, id };
  }, [location.search, location.state]);

  const [remoteCertificate, setRemoteCertificate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [list, setList] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setErrorText("");
      setRemoteCertificate(null);

      if (!backendUrl) {
        setErrorText("Backend URL missing (REACT_APP_MIPIE_BACKEND_URL).");
        return;
      }

      // If no id, show list page
      if (!derived.id) {
        setLoading(true);
        try {
          const res = await fetch(`${backendUrl}/api/certificates`, { method: "GET" });
          if (!res.ok) throw new Error(`Request failed (${res.status})`);
          const json = await res.json();
          const items = Array.isArray(json?.data) ? json.data : [];
          if (!cancelled) setList(items);
        } catch (e) {
          if (!cancelled) setErrorText(e?.message || "Failed to load list");
        } finally {
          if (!cancelled) setLoading(false);
        }
        return;
      }

      setList([]);
      if (!backendUrl) {
        setErrorText("Backend URL missing (REACT_APP_MIPIE_BACKEND_URL).");
        return;
      }

      setLoading(true);
      try {
        const url = `${backendUrl}/api/certificates/${encodeURIComponent(derived.id)}`;

        const res = await fetch(url, { method: "GET" });
        if (!res.ok) throw new Error(`Request failed (${res.status})`);
        const json = await res.json();

        const payload =
          json?.certificate ||
          json?.data?.certificate ||
          json?.data ||
          json?.result ||
          json;

        if (!payload || typeof payload !== "object") {
          throw new Error("Invalid response shape");
        }

        const mapped = {
          name:
            payload.name ||
            payload.studentName ||
            payload.candidateName ||
            payload.fullName ||
            "—",
          course: payload.course || payload.courseName || payload.program || "—",
          dateFrom:
            payload.dateFrom ||
            payload.from ||
            payload.startDate ||
            payload.start ||
            "—",
          dateEnd:
            payload.dateEnd || payload.to || payload.endDate || payload.end || "—",
        };

        if (!cancelled) setRemoteCertificate(mapped);
      } catch (e) {
        if (!cancelled) setErrorText(e?.message || "Failed to load certificate");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [backendUrl, derived.id]);

  const certificate = remoteCertificate || derived.certificate;

  return (
    <div className="certificatePage">
      {!derived.id ? (
        <div className="card">
          <div className="name">Certificates</div>
          <div className="course">
            <span>Total:</span> {list.length}
          </div>
          <hr className="divider" />
          {loading ? <div className="statusText">Loading…</div> : null}
          {errorText ? <div className="errorText">{errorText}</div> : null}

          <div className="listWrap">
            {list.map((item) => (
              <button
                key={item._id}
                type="button"
                className="listItem"
                onClick={() => navigate(`/certificates?id=${item._id}`)}
              >
                <div className="liName">{item.name || "—"}</div>
                <div className="liMeta">
                  <span>Course:</span> {item.course || "—"}
                </div>
              </button>
            ))}
            {!loading && !errorText && list.length === 0 ? (
              <div className="statusText">No certificates found.</div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="name">{certificate.name}</div>
          <div className="course">
            <span>Course:</span> {certificate.course}
          </div>
          <hr className="divider" />
          {loading ? <div className="statusText">Loading…</div> : null}
          {errorText ? <div className="errorText">{errorText}</div> : null}
          <div className="dates">
            <div className="date-row">
              <span>Date From:</span> {certificate.dateFrom}
            </div>
            <div className="date-row">
              <span>Date End:</span> {certificate.dateEnd}
            </div>
          </div>
        </div>
      )}
      <style>
        {`
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
  .certificatePage .listWrap {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  .certificatePage .listItem {
    width: 100%;
    text-align: left;
    background: #fff;
    border: 1px solid #e9e9e9;
    border-radius: 8px;
    padding: 12px 12px;
    cursor: pointer;
  }
  .certificatePage .listItem:hover { border-color: #cfcfcf; }
  .certificatePage .liName {
    font-size: 16px;
    font-weight: 600;
    color: #2c2c2c;
    margin-bottom: 4px;
  }
  .certificatePage .liMeta {
    font-size: 13px;
    color: #2c2c2c;
  }
  .certificatePage .liMeta span { font-weight: 600; }
  .certificatePage .statusText {
    font-size: 12px;
    color: #444;
    margin-bottom: 10px;
  }
  .certificatePage .errorText {
    font-size: 12px;
    color: #b00020;
    margin-bottom: 10px;
    word-break: break-word;
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
        `}
      </style>
    </div>
  );
}

export default Certificate;