import type { Class, Student } from "../../types";
import { GradeLabel } from "./GradeLabel";
import RankingTable from "./RankingTable";
import { ClockIcon } from "./ClockIcon";
import GradeRankingTable from "./GradeRankingTable";
import { Box } from "./Box";
import { Minutes } from "./Minutes";
import { pluralize } from "~/string";
import { type CompetitionRank } from "~/data";

export default function ClassBox({
  classes,
  topReaders,
  topPledgers,
}: {
  classes: Array<CompetitionRank<Class>>;
  topReaders: Array<CompetitionRank<Student>>;
  topPledgers: Array<CompetitionRank<Student>>;
}) {
  return (
    <Box className="row-span-2">
      <h2 className="text-xl font-bold">
        <GradeLabel grade={classes[0]!.item.grade} long /> rankings
      </h2>
      <GradeRankingTable classes={classes} />

      <h2 className="text-xl font-bold">Top readers</h2>
      {(topReaders[0]?.score ?? 0 > 0) ? (
        <RankingTable
          rows={topReaders}
          minRows={5}
          keyFn={(x) => x.id}
          description={({ item }) => item.displayName}
          score={({ item }) => (
            <>
              <ClockIcon /> <Minutes minutes={item.minutes} />
            </>
          )}
        />
      ) : (
        <span className="text-white/70">Nobody yet. Log your reading!</span>
      )}

      <h2 className="text-xl font-bold">Top pledgers</h2>
      {(topPledgers[0]?.score ?? 0 > 0) ? (
        <RankingTable
          rows={topPledgers}
          minRows={3}
          keyFn={(x) => x.id}
          description={({ item }) => item.displayName}
          score={({ item }) => (
            <>
              {item.pledges.toLocaleString()}{" "}
              <span className="text-sm">
                {pluralize("pledge", item.pledges)}
              </span>
            </>
          )}
        />
      ) : (
        <span className="text-white/70">Nobody has pledges yet!</span>
      )}
    </Box>
  );
}
