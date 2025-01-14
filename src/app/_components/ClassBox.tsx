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
    classes
      .flatMap((c) => c.students)
      .sort(
        (a, b) =>
          b.minutes - a.minutes ||
          b.pledges - a.pledges ||
          a.displayName.localeCompare(b.displayName),
      )
      .map((s) => ({
        key: s.id,
        contents: s.displayName,
        scoreCell: (
          <>
            <ClockIcon /> <Minutes minutes={s.minutes} />
          </>
        ),
        pledges: s.pledges,
        score: s.minutes,
      })),
    5,
  );

  const topPledgers = awardPrizes(
    classes
      .flatMap((c) => c.students)
      .sort(
        (a, b) =>
          b.pledges - a.pledges ||
          b.minutes - a.minutes ||
          a.displayName.localeCompare(b.displayName),
      )
      .filter((s) => s.pledges > 0)
      .map((s) => ({
        key: s.id,
        contents: s.displayName,
        scoreCell: (
          <>
            {s.pledges.toLocaleString()}{" "}
            <span className="text-sm">{pluralize("pledge", s.pledges)}</span>
          </>
        ),
        pledges: s.pledges,
        score: s.pledges,
      })),
    3,
  );

  return (
    <Box className="row-span-2">
      <h2 className="text-xl font-bold">
        <GradeLabel grade={classes[0]!.grade} long /> rankings
      </h2>
      <GradeRankingTable classes={classes} />

      <h2 className="text-xl font-bold">Top readers</h2>
      {(topReaders[0]?.[1].score ?? 0 > 0) ? (
        <RankingTable rows={topReaders} minRows={5} />
      ) : (
        <span className="text-white/70">Nobody yet. Log your reading!</span>
      )}

      <h2 className="text-xl font-bold">Top pledgers</h2>
      {(topPledgers[0]?.[1].score ?? 0 > 0) ? (
        <RankingTable rows={topPledgers} minRows={3} />
      ) : (
        <span className="text-white/70">Nobody has pledges yet!</span>
      )}
    </Box>
  );
}
