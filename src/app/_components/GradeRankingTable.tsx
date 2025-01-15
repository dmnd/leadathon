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
  classes: Array<Class>;
  viewer?: string;
}) {
  const rows = awardPrizes(1, classes, (c) => c.minutes).map(
    (ranking) =>
      [
        ranking,
        {
          key: ranking.item.className,
          contents: (
            <Link
              className="inline-block transition-transform hover:-translate-y-px hover:underline hover:underline-offset-4"
              href={toURL(ranking.item)}
            >
              {humanize(ranking.item.animal)}
            </Link>
          ),
          scoreCell: (
            <>
              <ClockIcon /> <Minutes minutes={ranking.item.minutes} />
            </>
          ),
          highlight: ranking.item.className === viewer,
        },
      ] as const,
  );
  return <RankingTable rows={rows} minRows={rows.length} />;
}
