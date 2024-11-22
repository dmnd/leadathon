import { groupBy } from "../../array";
import type { Class } from "../../types";
import { GradeLabel } from "./GradeLabel";
import RankingTable from "./RankingTable";
import { ClockIcon } from "./ClockIcon";
import GradeRankingTable from "./GradeRankingTable";
import { Box } from "./Box";
import { Minutes } from "./Minutes";

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
      classes.slice().sort((a, b) => b.minutes - a.minutes),
    ]),
  );

  return (
    <>
      {[...minutesGradeLeagues.entries()].sort().map(([league, classes]) => {
        return (
          <Box key={league}>
            <h2 className="text-xl font-bold">
              <GradeLabel grade={classes[0]!.grade} long /> rankings
            </h2>
            <GradeRankingTable classes={classes} />

            <h2 className="text-xl font-bold">Top readers</h2>
            <RankingTable
              rows={classes
                .flatMap((c) => c.students)
                .sort((a, b) => b.minutes - a.minutes)
                .slice(0, 5)
                .map((s) => ({
                  key: s.id,
                  contents: s.displayName,
                  scoreCell: (
                    <>
                      <ClockIcon /> <Minutes minutes={s.minutes} />
                    </>
                  ),
                  minutes: s.minutes,
                  pledges: s.pledgesOnline,
                  score: s.minutes,
                }))}
              awards={5}
            />

            <h2 className="text-xl font-bold">Top pledgers</h2>

            <RankingTable
              rows={classes
                .flatMap((c) => c.students)
                .sort((a, b) => b.pledgesOnline - a.pledgesOnline)
                .slice(0, 3)
                .map((s) => ({
                  key: s.id,
                  contents: s.displayName,
                  scoreCell: (
                    <>
                      {s.pledgesOnline.toLocaleString()}{" "}
                      <span className="text-sm">pledges</span>
                    </>
                  ),
                  minutes: s.minutes,
                  pledges: s.pledgesOnline,
                  score: s.pledgesOnline,
                }))}
              awards={3}
            />
          </Box>
        );
      })}
    </>
  );
}
