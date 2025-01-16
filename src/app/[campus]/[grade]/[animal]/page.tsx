import Link from "next/link";
import { ClockIcon } from "~/app/_components/ClockIcon";
import { GradeLabel } from "~/app/_components/GradeLabel";
import GradeRankingTable from "~/app/_components/GradeRankingTable";
import { Minutes } from "~/app/_components/Minutes";
import RankingTable from "~/app/_components/RankingTable";
import { awardPrizes, className, loadData } from "~/data";
import { humanize, pluralize } from "~/string";
import { type Campus, campuses } from "~/types";
import { Box } from "../../../_components/Box";
import { notFound } from "next/navigation";
import Footer from "~/app/_components/Footer";
import Tippy from "~/app/_components/Tippy";
import PledgeIcon from "~/app/_components/PledgeIcon";

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

  const { classesByGrade, lastUpdate } = await loadData(campus);
  const gradeClasses = classesByGrade.get(`${campus}${grade}`);
  if (gradeClasses == null) {
    return notFound();
  }

  const room = gradeClasses.find((c) => c.item.animal === animal);
  if (room == null) {
    return notFound();
  }

  const classTopReaders = awardPrizes(3, room.item.students, (s) => s.minutes);
  const classTopPledgers = awardPrizes(
    1,
    room.item.students.sort(
      (a, b) =>
        b.pledges - a.pledges ||
        b.minutes - a.minutes ||
        a.displayName.localeCompare(b.displayName),
    ),
    (s) => s.pledges,
  ).filter(({ rank }) => rank === 1);

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
          {room.item.teacher}&apos;s {humanize(room.item.animal)} class
        </h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-8">
        <div className="mb-6 sm:col-span-3">
          <div className="box-border flex justify-between pl-8 text-sm">
            <div
              className="relative"
              style={{
                left: `${Math.min(80, (room.item.pledges / 80) * 100)}%`,
              }}
            >
              {room.item.pledges.toLocaleString()} pledges
            </div>
            <div>80</div>
          </div>

          <div className="relative -top-2">
            <div className="absolute h-10 w-10 rounded-full bg-yellow-300" />

            <div className="relative top-2.5 box-border h-5 w-full overflow-hidden rounded-full bg-white/10 pl-8">
              <div
                className="h-full bg-yellow-300 transition-all"
                style={{
                  width: `${Math.min(100, (room.item.pledges / 80) * 100)}%`,
                }}
              />
            </div>
          </div>
        </div>

        <Box>
          <h2 className="text-xl font-bold">
            Ranked #{room.rank} in <GradeLabel grade={grade} long />
          </h2>
          <GradeRankingTable viewer={classroomName} classes={gradeClasses} />
        </Box>

        <Box className="sm:row-span-2">
          <h2 className="text-xl font-bold">
            {humanize(animal)} class readers
          </h2>
          {(classTopReaders[0]?.score ?? 0 > 0) ? (
            <RankingTable
              rows={classTopReaders}
              minRows={classTopReaders.length}
              keyFn={(s) => s.id}
              description={({ item }) => item.displayName}
              score={({ item }) => (
                <>
                  <ClockIcon /> <Minutes minutes={item.minutes} />
                </>
              )}
              extra={({ item }) =>
                classTopPledgers.find(
                  ({ item: pledgingItem }) => item.id === pledgingItem.id,
                ) ? (
                  <Tippy
                    content={`Pledge leader (${item.pledges} ${pluralize("pledge", item.pledges)})`}
                    delay={0}
                    animation={false}
                    placement="right"
                  >
                    <PledgeIcon />
                  </Tippy>
                ) : null
              }
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
