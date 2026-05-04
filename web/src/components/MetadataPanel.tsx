interface MetadataPanelProps {
  metadata: Record<string, unknown>;
}

export default function MetadataPanel({ metadata }: MetadataPanelProps) {
  return (
    <div className="panel">
      <p className="panel-title">Metadata</p>
      <dl className="meta-grid">
        {Object.entries(metadata).map(([label, value]) => (
          <div className="meta-row" key={label}>
            <dt>{label}</dt>
            <dd>{String(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
