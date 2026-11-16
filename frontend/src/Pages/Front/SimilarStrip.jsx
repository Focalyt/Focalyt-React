export default function SimilarStrip({ title, accent, className = "", children }) {
  if (!children) return null;

  return (
    <section
      className={`similar-section similar-live foc-cyber-home foc-courses-page ${className}`.trim()}
      aria-label={`${title} ${accent}`}
    >
      <div className="container">
        <h3 className="similar-heading">
          {title} <span>{accent}</span>
        </h3>
        <div className="similar-track">{children}</div>
      </div>
    </section>
  );
}
