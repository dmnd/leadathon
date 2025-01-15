import type { Class } from "../../types";
import { GradeLabel } from "./GradeLabel";
import RankingTable from "./RankingTable";
import { ClockIcon } from "./ClockIcon";
import GradeRankingTable from "./GradeRankingTable";
import { Box } from "./Box";
import { Minutes } from "./Minutes";
import { pluralize } from "~/string";
import { awardPrizes } from "~/data";

export default function ClassBox({ classes }: { classes: Array<Class> }) {
  const topReaders = awardPrizes(
    5,
    classes
      .flatMap((c) => c.students)
      .sort(
        (a, b) =>
          b.minutes - a.minutes ||
          b.pledges - a.pledges ||
          a.displayName.localeCompare(b.displayName),
      ),
    (s) => s.minutes,
  ).map(
    (ranking) =>
      [
        ranking,
        {
          key: ranking.item.id,
          contents: ranking.item.displayName,
          scoreCell: (
            <>
              <ClockIcon /> <Minutes minutes={ranking.item.minutes} />
            </>
          ),
        },
      ] as const,
  );

  const topPledgers = awardPrizes(
    3,
    classes
      .flatMap((c) => c.students)
      .sort(
        (a, b) =>
          b.pledges - a.pledges ||
          b.minutes - a.minutes ||
          a.displayName.localeCompare(b.displayName),
      )
      .filter((s) => s.pledges > 0),
    (s) => s.pledges,
  ).map(
    (ranking) =>
      [
        ranking,
        {
          key: ranking.item.id,
          contents: ranking.item.displayName,
          scoreCell: (
            <>
              {ranking.item.pledges.toLocaleString()}{" "}
              <span className="text-sm">
                {pluralize("pledge", ranking.item.pledges)}
              </span>
            </>
          ),
        },
      ] as const,
  );

  return (
    <Box className="row-span-2">
      <h2 className="text-xl font-bold">
        <GradeLabel grade={classes[0]!.grade} long /> rankings
      </h2>
      <GradeRankingTable classes={classes} />

      <h2 className="text-xl font-bold">Top readers</h2>
      {(topReaders[0]?.[0].score ?? 0 > 0) ? (
        <RankingTable rows={topReaders} minRows={5} />
      ) : (
        <span className="text-white/70">Nobody yet. Log your reading!</span>
      )}

      <h2 className="text-xl font-bold">Top pledgers</h2>
      {(topPledgers[0]?.[0].score ?? 0 > 0) ? (
        <RankingTable rows={topPledgers} minRows={3} />
      ) : (
        <span className="text-white/70">Nobody has pledges yet!</span>
      )}
    </Box>
  );
}
