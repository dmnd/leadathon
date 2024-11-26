import CampusSelector from "~/app/_components/CampusSelector";
import TopReadingClass from "~/app/_components/TopReadingClass";
import { loadData, loadStudents } from "~/data";
import { Campus, campuses, type Student } from "~/types";
import { ClockIcon } from "../_components/ClockIcon";
import RankingTable from "../_components/RankingTable";
import { Box } from "../_components/Box";
import { Minutes } from "../_components/Minutes";
import { notFound } from "next/navigation";
import { groupBy } from "~/array";
import Link from "next/link";

export default async function Home({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const campus = (await params).campus.toUpperCase() as Campus;
  if (!(campus in campuses)) {
    return notFound();
  }

  const { students, lastUpdate } = await loadStudents();

  const campusStudents = groupBy(students, (s) => s.campus);

  const campusStats = new Map(
    [...campusStudents.entries()].map(([campus, students]) => [
      campus,
      {
        campus,
        minutes: students.reduce((a, s) => a + s.minutes, 0),
        pledges: students.reduce((a, s) => a + s.pledgesOnline, 0),
        raised: students.reduce((a, s) => a + s.expectedRaised, 0),
        classes: new Set(students.map((s) => s.animal)).size, // TODO: include nonparticipating classes
      },
    ]),
  );

  const {
    classes: campusClasses,
    topReaders,
    topPledgers,
  } = await loadData(campus);

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex items-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Yu Ming Readathon
        </h1>
        <CampusSelector campus={campus} />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:grid-cols-3 md:gap-8">
        <Box className="col-span-2">
          <h2 className="text-xl font-bold">Campuses</h2>
          <RankingTable
            awards={0}
            rows={Array.from(campusStats.entries())
              .map(([c, stats]) => ({
                contents: (
                  <Link
                    className="inline-block transition-transform hover:-translate-y-px hover:underline hover:underline-offset-4"
                    href={`/${c.toLowerCase()}`}
                  >
                    {campuses[c]}
                  </Link>
                ),
                scoreCell: (
                  <>
                    {(stats.pledges / stats.classes)
                      .toFixed(1)
                      .toLocaleString()}{" "}
                    <span className="text-sm">pledges per class</span>
                  </>
                ),
                pledges: stats.pledges,
                key: c,
                score: stats.pledges / stats.classes,
                highlight: c === campus,
              }))
              .sort((a, b) => b.score - a.score)}
          />
        </Box>

        <TopReadingClass classes={campusClasses} />

        <Box>
          <h2 className="text-xl font-bold">{campuses[campus]} top readers</h2>
          {(topReaders[0]?.minutes ?? 0 > 0) ? (
            <RankingTable
              rows={topReaders.map((s) => ({
                contents: s.displayName,
                scoreCell: (
                  <>
                    <ClockIcon /> <Minutes minutes={s.minutes} />
                  </>
                ),
                pledges: s.pledgesOnline,
                key: s.id,
                score: s.minutes,
              }))}
              awards={10}
            />
          ) : (
            <span className="text-white/70">Nobody yet. Log your reading!</span>
          )}
        </Box>

        <Box>
          <h2 className="text-xl font-bold">{campuses[campus]} top pledgers</h2>
          {(topPledgers[0]?.pledgesOnline ?? 0 > 0) ? (
            <RankingTable
              rows={topPledgers.map((s) => ({
                contents: s.displayName,
                scoreCell: (
                  <>
                    {s.pledgesOnline.toLocaleString()}{" "}
                    <span className="text-sm">pledges</span>
                  </>
                ),
                pledges: s.pledgesOnline,
                key: s.id,
                score: s.pledgesOnline,
              }))}
              awards={5}
            />
          ) : (
            <span className="text-white/70">None yet. Go get pledges!</span>
          )}
        </Box>
      </div>

      <div className="text-sm text-white/50">
        Data updated {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
}
