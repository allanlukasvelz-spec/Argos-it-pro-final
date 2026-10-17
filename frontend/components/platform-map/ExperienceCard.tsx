import Link from "next/link";
import MockLabel from "./MockLabel";

type Props = {
  href: string;
  kicker: string;
  title: string;
  body: string;
  route: string;
  label?: "TARGET" | "DEMO" | "CURRENT";
};

export default function ExperienceCard({ href, kicker, title, body, route, label = "TARGET" }: Props) {
  return (
    <Link href={href} className="pm-card">
      <p className="pm-kicker">{kicker}</p>
      <h3>{title}</h3>
      <p>{body}</p>
      <p className="pm-card__meta">
        {route} · <MockLabel kind={label} />
      </p>
    </Link>
  );
}
