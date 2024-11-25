import CampusSelector from "~/app/_components/CampusSelector";
import TopReadingClass from "~/app/_components/TopReadingClass";
import { loadData } from "~/data";
import { campuses, type Student } from "~/types";
import { ClockIcon } from "../_components/ClockIcon";
import RankingTable from "../_components/RankingTable";
import { Box } from "../_components/Box";
import { Minutes } from "../_components/Minutes";
import { notFound } from "next/navigation";

export default async function Home({
  params,
}: {
  params: Promise<{ campus: string }>;
}) {
  const campus = (await params).campus.toUpperCase() as keyof typeof campuses;
  if (!(campus in campuses)) {
    return notFound();
  }

  const {
    classes: campusClasses,
    topReaders,
    topPledgers,
    lastUpdate,
  } = await loadData(campus);

  const places: Array<[number, Student]> = [];
  let place = 1;
  let equalPlace = 0;
  let score = topPledgers[0]!.pledgesOnline;
  for (const s of topPledgers) {
    if (s.pledgesOnline < score) {
      place = place + equalPlace;
      equalPlace = 1;
      score = s.pledgesOnline;
    } else {
      equalPlace = equalPlace + 1;
    }
    places.push([place, s]);
  }

  return (
    <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
      <div className="flex items-center gap-4">
        <h1 className="text-5xl font-extrabold tracking-tight">
          Yu Ming Readathon
        </h1>
        <CampusSelector campus={campus} />
      </div>
      <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:grid-cols-3 md:gap-8">
        <TopReadingClass classes={campusClasses} />
      </div>

      <div className="grid w-full grid-cols-1 gap-4 md:w-auto md:grid-cols-3 md:gap-8">
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
