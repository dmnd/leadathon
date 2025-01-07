import Link from "next/link";
import { ClockIcon } from "~/app/_components/ClockIcon";
import { GradeLabel } from "~/app/_components/GradeLabel";
import GradeRankingTable from "~/app/_components/GradeRankingTable";
import { Minutes } from "~/app/_components/Minutes";
import RankingTable from "~/app/_components/RankingTable";
import { className, loadData } from "~/data";
import { humanize } from "~/string";
import { Campus, campuses } from "~/types";
import { Box } from "../../../_components/Box";
import { notFound } from "next/navigation";
import Footer from "~/app/_components/Footer";

export default async function Animal({
  params,
}: {
  params: Promise<{ animal: string; grade: string; campus: string }>;
}) {
  const campus = (await params).campus.toUpperCase() as Campus;
  if (!(campus in campuses)) {
    return notFound();
  }

  const rawGrade = (await params).grade.toLowerCase();
  const grade = rawGrade === "k" ? 0 : Number.parseInt(rawGrade);
  const { animal } = await params;
  const classroomName = className({ grade, animal, campus });

  const { classes, lastUpdate } = await loadData(campus);
  const classroom = classes.get(classroomName);
  if (classroom == null) {
    return notFound();
  }

  const students = classroom.students.sort(
    (a, b) =>
      b.minutes - a.minutes ||
      b.pledgesOnline - a.pledgesOnline ||
      a.displayName.localeCompare(b.displayName),
  );

  const gradeClasses = [...classes.values()]
    .filter((c) => c.grade === classroom.grade)
    .sort(
      (a, b) =>
        b.minutes - a.minutes ||
        b.pledges - a.pledges ||
        a.animal.localeCompare(b.animal),
    );
  const position = gradeClasses.findIndex((c) => c === classroom) + 1;

  const classPledges = students.reduce((acc, s) => acc + s.pledgesOnline, 0);

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div>
        <Link
          href={`/${campus.toLowerCase()}`}
          className="inline-block text-white/50 transition-transform hover:-translate-y-px hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="relative -top-px inline-block"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
          Back to Yu Ming {campuses[campus]} campus
        </Link>
        <h1 className="text-5xl font-extrabold capitalize tracking-tight">
          {classroom.teacher}&apos;s {humanize(classroom.animal)} class
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <div className="mb-6 sm:col-span-3">
          <div className="box-border flex justify-between pl-8 text-sm">
            <div
              className="relative"
              style={{
                left: `${Math.min(80, (classPledges / 80) * 100)}%`,
              }}
            >
              {classPledges.toLocaleString()} pledges
            </div>
            <div>80</div>
          </div>

          <div className="relative -top-2">
            <div className="absolute h-10 w-10 rounded-full bg-yellow-300" />

            <div className="relative top-2.5 box-border h-5 w-full overflow-hidden rounded-full bg-white/10 pl-8">
              <div
                className="h-full bg-yellow-300 transition-all"
                style={{
                  width: `${Math.min(100, (classPledges / 80) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <Box>
          <h2 className="text-xl font-bold">
            Ranked #{position} in <GradeLabel grade={grade} long />
          </h2>
          <GradeRankingTable viewer={classroomName} classes={gradeClasses} />
        </Box>

        <Box className="sm:row-span-2">
          <h2 className="text-xl font-bold">
            {humanize(animal)} class readers
          </h2>
          {(students[0]?.minutes ?? 0 > 0) ? (
            <RankingTable
              showPledges
              rows={students.map((s) => ({
                key: s.id,
                contents: s.displayName,
                scoreCell: (
                  <>
                    <ClockIcon /> <Minutes minutes={s.minutes} />
                  </>
                ),
                pledges: s.pledgesOnline,
                score: s.minutes,
              }))}
              awards={3}
              targetRows={students.length}
            />
          ) : (
            <span className="text-white/70">None yet. Log your reading!</span>
          )}
        </Box>
      </div>

      <Footer lastUpdate={lastUpdate} />
    </div>
  );
}
