import RankingTable from "./RankingTable";
import Link from "next/link";
import { ClockIcon } from "./ClockIcon";
import type { Class } from "../../types";
import { humanize } from "~/string";
import { Minutes } from "./Minutes";
import { awardPrizes } from "~/data";

function toURL(c: Class) {
  return `/${c.campus.toLowerCase()}/${
    c.grade === 0 ? "k" : c.grade.toString().toLowerCase()
  }/${c.animal}`;
}

export default function GradeRankingTable({
  classes,
  viewer,
}: {
  classes: Class[];
  viewer?: string;
}) {
  const rows = awardPrizes(
    classes.map((c) => ({
      key: c.className,
      contents: (
        <Link
          className="inline-block transition-transform hover:-translate-y-px hover:underline hover:underline-offset-4"
          href={toURL(c)}
        >
          {humanize(c.animal)}
        </Link>
      ),
      scoreCell: (
        <>
          <ClockIcon /> <Minutes minutes={c.minutes} />
        </>
      ),
      minutes: c.minutes,
      pledges: c.pledges,
      score: c.minutes,
      highlight: c.className === viewer,
    })),
    1,
  );
  return <RankingTable rows={rows} />;
}
