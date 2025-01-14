import CampusSelector from "~/app/_components/CampusSelector";
import ClassBox from "~/app/_components/ClassBox";
import { awardPrizes, loadData, loadStudents } from "~/data";
import { type Campus, campuses, type Student } from "~/types";
import { ClockIcon } from "../_components/ClockIcon";
import { Box } from "../_components/Box";
import { Minutes } from "../_components/Minutes";
import { notFound } from "next/navigation";
import { groupBy } from "~/array";
import { humanize } from "~/string";
import Link from "next/link";
import { GradeLabel } from "../_components/GradeLabel";
import Footer from "../_components/Footer";
import RankingTable from "../_components/RankingTable";

function Student({ student }: { student: Student }) {
  return (
    <>
      {student.displayName}{" "}
      <span className="ml-1 text-xs text-white/50">
        <GradeLabel grade={student.grade} />
      </span>
    </>
  );
}

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

  const campusRows = awardPrizes(
    [...groupBy(students, (s) => s.campus).entries()]
      .map(([campus, students]) => ({
        campus,
        minutes: students.reduce((a, s) => a + s.minutes, 0),
        pledges: students.reduce((a, s) => a + s.pledges, 0),
        raised: students.reduce((a, s) => a + s.expectedRaised, 0),
        classes: new Set(students.map((s) => s.animal)).size, // TODO: include nonparticipating classes
      }))
      .map((c) => ({
        contents: (
          <Link
            className="inline-block transition-transform hover:-translate-y-px hover:underline hover:underline-offset-4"
            href={`/${c.campus.toLowerCase()}`}
          >
            {campuses[c.campus]}
          </Link>
        ),
        scoreCell: (
          <>
            {(c.pledges / c.classes).toFixed(1).toLocaleString()}{" "}
            <span className="text-sm">pledges per class</span>
          </>
        ),
        pledges: c.pledges,
        key: c.campus,
        score: c.pledges / c.classes,
        highlight: c.campus === campus,
      }))
      .sort((a, b) => b.score - a.score || a.key.localeCompare(b.key)),
    0,
  );

  const {
    classes: campusClasses,
    topReaders,
    topPledgers,
  } = await loadData(campus);

  const gradeLeagues = groupBy(
    campusClasses.values(),
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

  const topReadersRows = awardPrizes(
    topReaders.map((s) => ({
      contents: <Student student={s} />,
      scoreCell: (
        <>
          <ClockIcon /> <Minutes minutes={s.minutes} />
        </>
      ),
      pledges: s.pledges,
      key: s.id,
      score: s.minutes,
    })),
    10,
  );

  const topPledgersRows = awardPrizes(
    topPledgers.map((s) => ({
      contents: <Student student={s} />,
      scoreCell: (
        <>
          {s.pledges.toLocaleString()} <span className="text-sm">pledges</span>
        </>
      ),
      pledges: s.pledges,
      key: s.id,
      score: s.pledges,
    })),
    5,
  );

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex items-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Yu Ming Readathon
        </h1>
        <CampusSelector campus={campus} />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:grid-cols-3 md:gap-8">
        {/* School level competitions */}
        <Box className="md:col-span-2">
          <h2 className="text-xl font-bold">Campuses</h2>
          <RankingTable rows={campusRows} minRows={campusRows.length} />
        </Box>

        {/* Grade level competitions */}
        {[...minutesGradeLeagues.entries()].sort().map(([league, classes]) => (
          <ClassBox key={league} classes={classes} />
        ))}

        {/* Campus top readers */}
        <Box>
          <h2 className="text-xl font-bold">{campuses[campus]} top readers</h2>
          {(topReaders[0]?.minutes ?? 0 > 0) ? (
            <RankingTable rows={topReadersRows} minRows={10} />
          ) : (
            <span className="text-white/70">Nobody yet. Log your reading!</span>
          )}
        </Box>

        {/* Campus top pledgers */}
        <Box>
          <h2 className="text-xl font-bold">{campuses[campus]} top pledgers</h2>
          {(topPledgers[0]?.pledges ?? 0 > 0) ? (
            <RankingTable rows={topPledgersRows} minRows={10} />
          ) : (
            <span className="text-white/70">None yet. Go get pledges!</span>
          )}
        </Box>
      </div>

      {/* Campus race for 80 pledges */}
      <div className="w-full max-w-4xl">
        <h2 className="mb-4 text-xl font-bold">Race for 80 pledges</h2>
        <div className="relative">
          {/* Finish line with checker pattern */}
          <div
            className="absolute right-0 top-0 h-full w-6 overflow-hidden"
            style={{
              width: "20px",
              backgroundPosition: "0px 0px, 10px 10px",
              backgroundSize: "20px 20px",
              backgroundImage: `linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000 100%),
                                  linear-gradient(45deg, #000 25%, white 25%, white 75%, #000 75%, #000 100%)`,
            }}
          ></div>

          {/* Race lanes */}
          <div className="flex flex-col gap-2">
            {Array.from(campusClasses.values())
              .sort(
                (a, b) => a.grade - b.grade || a.animal.localeCompare(b.animal),
              )
              .map((classroom) => {
                const pledges = classroom.students.reduce(
                  (acc, s) => acc + s.pledges,
                  0,
                );

                const progress = Math.min(100, (pledges / 80) * 100);

                return (
                  <div key={classroom.animal} className="relative h-8">
                    {/* Lane background */}
                    <div className="absolute h-full w-full rounded bg-white/5" />

                    {/* Progress bar */}
                    <div
                      className="absolute h-full bg-yellow-300/40"
                      style={{
                        width: `${progress}%`,
                        borderRadius: "20px 50px 50px 20px",
                      }}
                    />

                    {/* Class "runner" */}
                    <div
                      className="absolute h-6 w-6 rounded-full bg-yellow-300 text-center shadow-lg"
                      style={{
                        left: `${progress}%`,
                        top: "4px",
                        transform: "translateX(-100%) translateX(-4px)",
                        mixBlendMode: "screen",
                        color: "black",
                      }}
                    >
                      <span className="text-sm font-bold">
                        {classroom.pledges}
                      </span>
                    </div>

                    {/* Labels */}
                    {progress > 10 ? (
                      <div className="absolute left-2 top-1/2 -translate-y-1/2 text-lg font-bold uppercase text-white/40">
                        {humanize(classroom.animal)}
                      </div>
                    ) : null}

                    {progress < 90 ? (
                      <div className="absolute right-7 top-1/2 -translate-y-1/2 text-lg font-bold uppercase text-white/40">
                        {humanize(classroom.animal)}
                      </div>
                    ) : null}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      <Footer lastUpdate={lastUpdate} />
    </div>
  );
}
