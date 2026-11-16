import React from "react";

// /privacypolicy is not rewritten to privacypolicy.html on the live server.
// The static file stays the source of the page; this route shows it inside the app.
const PrivacyPolicyPage = () => (
  <iframe
    title="Privacy Policy"
    src="/privacypolicy.html"
    style={{
      position: "fixed",
      inset: 0,
      width: "100%",
      height: "100%",
      border: "none",
      background: "#f5fbff",
      zIndex: 10000,
    }}
  />
);

export default PrivacyPolicyPage;
