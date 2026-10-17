type EvidenceItem = {
  title: string;
  detail: string;
};

export default function EvidenceStack({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="pm-grid-2">
      {items.map((item) => (
        <article key={item.title} className="pm-card">
          <h3>{item.title}</h3>
          <p>{item.detail}</p>
        </article>
      ))}
    </div>
  );
}
