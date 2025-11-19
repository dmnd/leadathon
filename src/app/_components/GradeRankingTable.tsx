import RankingTable from "./RankingTable";
import Link from "next/link";
import { ClockIcon } from "./ClockIcon";
import type { Class } from "../../types";
import { humanize } from "~/string";
import { Minutes } from "./Minutes";
import { type CompetitionRank } from "~/data";

function toURL(c: Class) {
  const gradeSegment =
    c.grade === 0
      ? "k"
      : c.grade === -1
        ? "t"
        : c.grade.toString().toLowerCase();

  return `/${c.campus.toLowerCase()}/${gradeSegment}/${c.animal}`;
}

export default function GradeRankingTable({
  classes,
  viewer,
}: {
  classes: Array<CompetitionRank<Class>>;
  viewer?: string;
}) {
  return (
    <RankingTable
      rows={classes}
      minRows={classes.length}
      keyFn={(x) => x.className}
      highlight={({ item: { className } }) => className === viewer}
      description={({ item }) => (
        <Link
          className="inline-block transition-transform hover:-translate-y-px hover:underline hover:underline-offset-4"
          href={toURL(item)}
        >
          {humanize(item.animal)}
        </Link>
      )}
      score={({ item: { minutes } }) => (
        <>
          <ClockIcon /> <Minutes minutes={minutes} />
        </>
      )}
    />
  );
}
