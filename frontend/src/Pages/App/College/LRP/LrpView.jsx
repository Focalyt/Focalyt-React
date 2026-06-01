import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

const readLrpMeta = (items, metaKey) => {
  const it = (items || []).find((x) => x && x.metaKey === metaKey);
  return it ? String(it.value || "").trim() : "";
};

const Card = ({ number, title, children }) => (
  <div
    style={{
      background: "white",
      borderRadius: "16px",
      boxShadow: "0 1px 3px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
      marginBottom: "20px",
      overflow: "hidden",
    }}
  >
    <div
      style={{
        padding: "16px 24px",
        borderBottom: "1px solid #f1f5f9",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          background: "linear-gradient(135deg,#FC2B5A,#a5003a)",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: "13px",
          fontWeight: 700,
        }}
      >
        {number}
      </div>
      <h5 style={{ margin: 0, fontWeight: 700, color: "#1e293b", fontSize: "15px" }}>{title}</h5>
    </div>
    <div style={{ padding: "20px 24px" }}>{children}</div>
  </div>
);

const lblStyle = {
  display: "block",
  fontSize: "11px",
  fontWeight: 700,
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "5px",
};

const valStyle = { fontSize: 14, color: "#0f172a", fontWeight: 600, wordBreak: "break-word" };

const FieldRow = ({ label, value, children }) => (
  <div style={{ flex: "1 1 240px", minWidth: 200, marginBottom: 16 }}>
    <div style={lblStyle}>{label}</div>
    {children !== undefined && children !== null ? (
      children
    ) : (
      <div style={valStyle}>{value !== undefined && value !== null && String(value).trim() ? value : "—"}</div>
    )}
  </div>
);

function LrpView() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isEmbedded = searchParams.get("embedded") === "1";
  const b2bLeadId = useMemo(() => String(searchParams.get("b2bLeadId") || searchParams.get("leadId") || "").trim(), [searchParams]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [qaItems, setQaItems] = useState([]);
  const [categoryLabel, setCategoryLabel] = useState("");
  const [typeLabel, setTypeLabel] = useState("");
  const [deptLabel, setDeptLabel] = useState("");
  const [projLabel, setProjLabel] = useState("");
  const [meta, setMeta] = useState({
    partnerType: "",
    implementationPartnerName: "",
    visitDate: "",
    geoTaggedPhoto: "",
    state: "",
    district: "",
  });

  useEffect(() => {
    if (!b2bLeadId) {
      setLoading(false);
      setError("Missing lead id. Open this page from a B2B lead.");
      return;
    }

    const backendUrl = process.env.REACT_APP_MIPIE_BACKEND_URL;
    const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
    const token = userData.token;
    if (!backendUrl || !token) {
      setLoading(false);
      setError(!token ? "Login required." : "Backend URL is not configured.");
      return;
    }

    const headers = { "x-auth": token };

    const run = async () => {
      setLoading(true);
      setError("");
      setNotFound(false);
      try {
        const [lrpRes, leadRes] = await Promise.all([
          fetch(`${backendUrl}/college/lrp/by-b2b-lead/${b2bLeadId}`, { headers }),
          fetch(`${backendUrl}/college/lrp/b2b-lead/${b2bLeadId}`, { headers }),
        ]);
        const lrpJson = await lrpRes.json().catch(() => ({}));
        const leadJson = await leadRes.json().catch(() => ({}));

        if (leadJson?.success && leadJson?.data) {
          const lead = leadJson.data;
          const cat = lead.leadCategory;
          const typ = lead.typeOfB2B;
          const dept = lead.b2bDepartment;
          const proj = lead.b2bProject;
          setCategoryLabel(
            cat && typeof cat === "object" ? String(cat.name || cat.title || "").trim() || "—" : "—"
          );
          setTypeLabel(typ && typeof typ === "object" ? String(typ.name || "").trim() || "—" : "—");
          setDeptLabel(dept && typeof dept === "object" ? String(dept.name || "").trim() || "—" : "—");
          setProjLabel(proj && typeof proj === "object" ? String(proj.name || "").trim() || "—" : "—");
        } else {
          setCategoryLabel("—");
          setTypeLabel("—");
          setDeptLabel("—");
          setProjLabel("—");
        }

        if (!lrpRes.ok || !lrpJson?.success || !lrpJson?.data) {
          setNotFound(true);
          setQaItems([]);
          setMeta({
            partnerType: "",
            implementationPartnerName: "",
            visitDate: "",
            geoTaggedPhoto: "",
            state: "",
            district: "",
          });
          return;
        }

        const d = lrpJson.data;
        const items = d?.leadSourceQA?.items || [];
        setQaItems(items);
        setMeta({
          partnerType: readLrpMeta(items, "lrp_partnerType"),
          implementationPartnerName: readLrpMeta(items, "lrp_implementationPartnerName"),
          visitDate: readLrpMeta(items, "lrp_visitDate"),
          geoTaggedPhoto: readLrpMeta(items, "lrp_geoTaggedPhoto"),
          state: readLrpMeta(items, "lrp_state"),
          district: readLrpMeta(items, "lrp_district"),
        });
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[LrpView] load failed", e);
        setError("Could not load this report.");
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [b2bLeadId]);

  const leadSourceRows = useMemo(
    () => (qaItems || []).filter((it) => it && !it.metaKey && String(it.question || "").trim()),
    [qaItems]
  );

  const geoUrl = meta.geoTaggedPhoto;
  const isImageUrl = /^https?:\/\//i.test(geoUrl || "");

  return (
    <div style={{ background: isEmbedded ? "#ffffff" : "#f1f5f9", minHeight: isEmbedded ? "auto" : "100vh", padding: isEmbedded ? "16px" : "20px" }}>
      {!isEmbedded && (
      <div
        style={{
          background: "linear-gradient(135deg, #FC2B5A 0%, #a5003a 100%)",
          borderRadius: "16px",
          padding: "24px 32px",
          marginBottom: "24px",
          color: "white",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 10px 25px rgba(252,43,90,0.35)",
          flexWrap: "wrap",
        }}
      >
        <button
          type="button"
          onClick={() => navigate(-1)}
          style={{
            background: "rgba(255,255,255,0.2)",
            border: "none",
            borderRadius: "10px",
            color: "white",
            padding: "10px 14px",
            fontWeight: 700,
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          ← Back
        </button>
        <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: "12px", padding: "10px 14px" }}>
          <i className="fa fa-eye" style={{ fontSize: "20px" }} aria-hidden="true" />
        </div>
        <div style={{ flex: "1 1 auto" }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: "22px" }}>Lead report</h2>
          
        </div>
      </div>
      )}

      {isEmbedded && (
        <div style={{ marginBottom: 16 }}>
          <h2 style={{ margin: 0, fontWeight: 800, fontSize: 20, color: "#881337" }}>Lead report</h2>
        </div>
      )}

      {loading && (
        <div style={{ marginBottom: 14, fontSize: 13, fontWeight: 700, color: "#475569" }}>Loading report…</div>
      )}

      {error && !loading && (
        <div
          style={{
            marginBottom: 14,
            padding: "12px 14px",
            borderRadius: 10,
            background: "#fef2f2",
            border: "1px solid #fecaca",
            color: "#b91c1c",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {error}
        </div>
      )}

      {!loading && !error && notFound && (
        <div
          style={{
            padding: "16px 18px",
            borderRadius: 12,
            background: "white",
            border: "1px solid #e2e8f0",
            color: "#475569",
            fontWeight: 600,
            fontSize: 14,
          }}
        >
          No saved lead report for this B2B lead yet. Use “Add Lead Report” to create one.
        </div>
      )}

      {!loading && !error && !notFound && (
        <>
          <Card number={1} title="Partner & visit">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", alignItems: "flex-start" }}>
              <FieldRow label="B2B lead source" value={categoryLabel} />
              <FieldRow label="B2B department" value={deptLabel} />
              <FieldRow label="B2B project" value={projLabel} />
              <FieldRow label="B2B type" value={typeLabel} />
              <FieldRow label="Type of partner" value={meta.partnerType} />
              <FieldRow label="Field implementation partner name" value={meta.implementationPartnerName} />
              <FieldRow label="Visit date" value={meta.visitDate} />
              <FieldRow label="Geo-tagged photograph">
                {!geoUrl ? (
                  <div style={valStyle}>—</div>
                ) : isImageUrl ? (
                  <div>
                    <a href={geoUrl} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 700, color: "#be123c" }}>
                      Open full image
                    </a>
                    <div style={{ marginTop: 10, maxWidth: 420 }}>
                      <img
                        src={geoUrl}
                        alt="Geo-tagged visit"
                        style={{ width: "100%", borderRadius: 10, border: "1px solid #e2e8f0" }}
                      />
                    </div>
                  </div>
                ) : (
                  <div style={valStyle}>{geoUrl}</div>
                )}
              </FieldRow>
            </div>
          </Card>

          <Card number={2} title="Location">
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px" }}>
              <FieldRow label="State" value={meta.state} />
              <FieldRow label="District" value={meta.district} />
            </div>
          </Card>

          <Card number={3} title="Lead source details">
            {leadSourceRows.length ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {leadSourceRows.map((item, i) => (
                  <div
                    key={`${i}-${item.question}`}
                    style={{
                      paddingBottom: 12,
                      borderBottom: i < leadSourceRows.length - 1 ? "1px solid #f1f5f9" : "none",
                    }}
                  >
                    <div style={lblStyle}>{item.question}</div>
                    <div style={valStyle}>{String(item.value || "").trim() ? item.value : "—"}</div>
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ margin: 0, fontSize: 14, color: "#64748b", fontWeight: 600 }}>
                No questionnaire responses on file for this report.
              </p>
            )}
          </Card>
        </>
      )}
    </div>
  );
}

export default LrpView;
