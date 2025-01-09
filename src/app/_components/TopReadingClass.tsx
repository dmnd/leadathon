import { groupBy } from "../../array";
import type { Class } from "../../types";
import { GradeLabel } from "./GradeLabel";
import RankingTable from "./RankingTable";
import { ClockIcon } from "./ClockIcon";
import GradeRankingTable from "./GradeRankingTable";
import { Box } from "./Box";
import { Minutes } from "./Minutes";
import { pluralize } from "~/string";

export default function TopReadingClass({
  classes,
}: {
  classes: Map<string, Class>;
}) {
  const gradeLeagues = groupBy(
    classes.values(),
    (c) => `${c.campus}${c.grade}`,
  );

  const minutesGradeLeagues = new Map(
    Array.from(gradeLeagues.entries()).map(([league, classes]) => [
      league,
      classes
        .slice()
        .sort(
          (a, b) =>
            b.minutes - a.minutes ||
            b.pledges - a.pledges ||
            a.animal.localeCompare(b.animal),
        ),
    ]),
  );

  return (
    <>
      {[...minutesGradeLeagues.entries()].sort().map(([league, classes]) => {
        const topReaders = classes
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
          }));

        const topPledgers = classes
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
                <span className="text-sm">
                  {pluralize("pledge", s.pledges)}
                </span>
              </>
            ),
            pledges: s.pledges,
            score: s.pledges,
          }));

        return (
          <Box key={league} className="row-span-2">
            <h2 className="text-xl font-bold">
              <GradeLabel grade={classes[0]!.grade} long /> rankings
            </h2>
            <GradeRankingTable classes={classes} />

            <h2 className="text-xl font-bold">Top readers</h2>
            {(topReaders[0]?.score ?? 0 > 0) ? (
              <RankingTable rows={topReaders} awards={5} targetRows={5} />
            ) : (
              <span className="text-white/70">
                Nobody yet. Log your reading!
              </span>
            )}

            <h2 className="text-xl font-bold">Top pledgers</h2>
            {(topPledgers[0]?.score ?? 0 > 0) ? (
              <RankingTable rows={topPledgers} awards={3} targetRows={3} />
            ) : (
              <span className="text-white/70">Nobody has pledges yet!</span>
            )}
          </Box>
        );
      })}
    </>
  );
}
