interface EncyclopediaPlaceholderProps {
  title: string;
  summary: string;
  /** Internal notes / reference docs — not shown as product copy. */
  references?: string[];
}

const EncyclopediaPlaceholder = ({ title, summary, references }: EncyclopediaPlaceholderProps) => (
  <div className="info-content encyclopedia-placeholder">
    <h2>{title}</h2>
    <p className="custom-section-intro">{summary}</p>
    <p className="encyclopedia-tbd-badge">TBD</p>
    {references && references.length > 0 && (
      <ul className="encyclopedia-tbd-refs" hidden>
        {references.map((ref) => (
          <li key={ref}>{ref}</li>
        ))}
      </ul>
    )}
  </div>
);

export default EncyclopediaPlaceholder;
