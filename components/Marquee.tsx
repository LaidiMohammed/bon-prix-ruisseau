export default function Marquee({ items }: { items: string[] }) {
  const row = [...items, ...items];
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-signal py-3">
      <div className="animate-marquee flex w-max items-center gap-8 pr-8">
        {row.map((t, i) => (
          <span
            key={i}
            className="font-display text-xl tracking-wide whitespace-nowrap text-white uppercase"
          >
            {t} <span className="mx-4 text-ink">★</span>
          </span>
        ))}
      </div>
    </div>
  );
}
