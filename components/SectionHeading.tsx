import Reveal from "./Reveal";

export default function SectionHeading({
  kicker,
  title,
  arabic,
  center = true,
}: {
  kicker: string;
  title: string;
  arabic?: string;
  center?: boolean;
}) {
  return (
    <Reveal className={center ? "text-center" : "text-left"}>
      <p className="text-xs font-black tracking-[0.35em] text-signal uppercase">
        {kicker}
      </p>
      <h2 className="mt-2 font-display text-4xl tracking-wide uppercase sm:text-5xl">
        {title}
      </h2>
      {arabic && (
        <p className="font-arabic mt-2 text-xl text-gold">{arabic}</p>
      )}
    </Reveal>
  );
}
