import fs from "fs";
import Papa from "papaparse";
import path from "path";
import invariant from "tiny-invariant";
import { groupBy, partition } from "./array";
import nekonames from "nekonames";
import type { Campus, Row } from "./types";
import { capitalize, kebabify, pascalify } from "~/string";
import { campuses } from "~/types";
import { DateTime } from "luxon";

const teachers: Record<string, string> = {
  "1MonkeyCAR": "Jin Ruoxi",
  "1TigerCAR": "Cui Wenyue",
  "1ZebraCAR": "Xie Jing",
  "2HorseCAR": "Yu Zhikai",
  "2LionCAR": "Yan Wenjing",
  "2OwlCAR": "Luo Qianying",
  KKoalaCAR: "Zhang Ailing",
  KPandaCAR: "Cathy Li",
  KPenguinCAR: "Cai Lili",
  "1MonkeyCHE": "Emily Lu",
  "1TigerCHE": "Liao Yiran",
  "1ZebraCHE": "Fang Yiwei",
  "2HorseCHE": "Wen Alin",
  "2LionCHE": "Yu Zecong",
  "2OwlCHE": "Wendy Wei",
  "3DogCHE": "Su Wen",
  "3PeacockCHE": "Cheng Mengting",
  "3PhoenixCHE": "Tsai, Jin",
  "3RabbitCHE": "Erin Yi",
  "3SeaHorseCHE": "Bai Shaojun",
  "3SeaLionCHE": "Luo Minyu",
  "4DolphinCHE": "Liu Lian",
  "4SeaTurtleCHE": "Jiang Ningxin",
  TSeaOtterCHE: "Chen Xiaoting",
  KKoalaCHE: "Victoria Ma",
  KPandaCHE: "Yang Huize",
  KPenguinCHE: "Zhang Jiaxin",
  "3DogADE": "Erin Yi",
  "3PhoenixADE": "Bella Chen",
  "3SeaHorseADE": "Cheng Mengting",
  "4DolphinADE": "Kevin Liu",
  "4QilinADE": "Tang Yaxing",
  "4DolphinMLK": "Nie Shanshan",
  "4QilinMLK": "Tang Yaxing",
  "4SeaTurtleMLK": "Jiang Ningxin",
  "5ElephantMLK": "Pat Low",
  "5GiraffeMLK": "Weng Cheng",
  "5RhinoMLK": "Tascian Ani",
  "6CraneMLK": "Hui Yue",
  "6LeopardMLK": "Louis Wu",
  "7BearMLK": "Shao Yun",
  "7FalconMLK": "Ryan Mulcahy",
  "8PantherMLK": "Nie Shanshan",
  "8SharkMLK": "Jennifer Lee",
};

export function className(x: {
  campus: string;
  grade: number;
  animal: string;
}) {
  const gradePrefix =
    x.grade === 0 ? "K" : x.grade === -1 ? "T" : x.grade.toString();

  return `${gradePrefix}${pascalify(x.animal)}${x.campus.toUpperCase()}`;
}

const regex = new RegExp(/^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d)(\d\d)\.csv$/);

async function parseCSV(): Promise<[Papa.ParseResult<Row>, string]> {
  const files = fs
    .readdirSync(path.join(process.cwd(), "src"))
    .filter((f) => regex.exec(f))
    .sort();
  const fileName = files.pop()!;
  const filePath = `./src/${fileName}`;
  const match = regex.exec(fileName);
  if (!match) {
    throw new Error(`Failed to parse date from ${fileName}`);
  }
  const [, year, month, day, hour, minute] = match;

  const lastUpdate = DateTime.utc(
    Number(year),
    Number(month),
    Number(day),
    Number(hour),
    Number(minute),
  )
    .setZone("America/Los_Angeles", { keepLocalTime: true })
    .toLocaleString(DateTime.DATETIME_SHORT);

  const file = fs.readFileSync(filePath, "utf8");
  return new Promise((resolve, reject) => {
    Papa.parse<Row>(file, {
      header: true,
      dynamicTyping: true,
      error: reject,
      complete: function (results) {
        // Discard summary/footer rows that begin with "Total" in the
        // "Last Name" column (these are aggregate rows from the export).
        results.data = results.data.filter(
          (r) => String((r["Last Name"] ?? "")).trim().toLowerCase() !== "total",
        );
        resolve([results, lastUpdate]);
      },
    });
  });
}

// Roster-based validation has been removed — all class decisions come from
// the Pledgestar CSV (`Class Name`). The old `2024-roster.csv` lookup and
// autofix logic have been intentionally deleted because the roster is stale.

type OfflinePledgesRow = {
  offlinePledges: number;
  firstName: string;
  lastName: string;
  class: string;
};

function parseOfflinePledges(): Promise<OfflinePledgesRow[]> {
  const file = fs.readFileSync(
    path.join(process.cwd(), "./src/2024-offline-pledges.csv"),
    "utf8",
  );
  return new Promise((resolve, reject) => {
    Papa.parse<OfflinePledgesRow>(file, {
      header: true,
      dynamicTyping: true,
      error: reject,
      complete: (results) => {
        resolve(results.data);
      },
    });
  });
}

function isMixedCase(s: string) {
  return s.toLocaleUpperCase() !== s && s.toLocaleLowerCase() !== s;
}

function cleanupName(s: string) {
  if (s.length < 2) return s;
  if (isMixedCase(s)) return s;

  const s2 = capitalize(s.toLocaleLowerCase());
  // console.info(`Cleaned up name ${s} to ${s2}`);
  return s2;
}

function fullName(firstName: string, lastName: string) {
  return lastName.length > 0 ? `${firstName} ${lastName}` : firstName;
}

export async function loadStudents() {
  const [[csv, lastUpdate], offlinePledges] = await Promise.all([
    parseCSV(),
    parseOfflinePledges(),
  ]);

  const [badClasses, rawStudents] = partition(
    csv.data,
    (x) => x["Class Name"] == null || x["Class Name"] === "General",
  );
  console.info(
    `${rawStudents.length} rows remain after filtering out bad data`,
    badClasses,
  );

  const allStudents = rawStudents.flatMap((s) => {
    const firstName = cleanupName(s["First Name"]);
    const lastName = cleanupName(s["Last Name"]);

    const pledgestarClass = s["Class Name"]?.split(/[\s,]+/)[0] ?? "";
    // Roster lookup removed — keep the Pledgestar-provided class as authoritative
    const classroom = pledgestarClass;
    const movedFrom: string | null = null;

    // add offline pledges
    const offlinePledge = offlinePledges.find(
      (p) =>
        p.firstName === firstName &&
        p.lastName === lastName &&
        p.class === classroom,
    );

    const match = /^(\w)(\w+)(\w{3}).*$/.exec(classroom);
    if (!match) {
      console.error("Failed to match", s["Class Name"]);
      return [];
    }

    const [, rawGrade, animal, rawCampus] = match;

    invariant(rawCampus != null);
    if (!(rawCampus in campuses)) {
      throw new Error(`Unknown campus ${rawCampus}`);
    }
    const campus = rawCampus as Campus;

    invariant(animal != null);
    invariant(rawGrade != null);
    const grade =
      rawGrade === "K" ? 0 : rawGrade === "T" ? -1 : Number.parseInt(rawGrade);

    const pledgesOnline =
      s["Online Donation #"] + s["Potential Online Donation #"];
    const pledgesOffline = offlinePledge?.offlinePledges ?? 0;

    return [
      {
        id: [campus, rawGrade, animal, lastName, firstName].join("|"),
        firstName,
        lastName,
        _raw: [s],
        campus,
        animal: kebabify(animal),
        grade,
        movedFrom,
        _pledgesOnline: pledgesOnline,
        _pledgesOffline: pledgesOffline,
        pledges: pledgesOnline + pledgesOffline,
        minutes: s["Minute Count"],
        expectedRaised: s["Total + Potential"],
      },
    ];
  });

  // merge duplicates
  const uniqStudents = new Map<string, (typeof allStudents)[number]>();
  for (const s of allStudents) {
    const existing = uniqStudents.get(s.id);
    if (existing != null) {
      existing._pledgesOnline += s._pledgesOnline;
      existing._pledgesOffline += s._pledgesOffline;
      existing.pledges += s.pledges;
      existing.minutes += s.minutes;
      existing.expectedRaised += s.expectedRaised;
      existing._raw.push(...s._raw);
    } else {
      uniqStudents.set(s.id, s);
    }
  }

  const students = [...uniqStudents.values()];

  // TODO: awardPrizes should sort items itself
  const getScore = (c: { pledges: number; classes: number }) =>
    c.pledges / c.classes;
  const topCampuses = awardPrizes(
    0,
    [...groupBy(students, (s) => s.campus).entries()]
      .map(([campus, students]) => ({
        campus,
        minutes: students.reduce((a, s) => a + s.minutes, 0),
        pledges: students.reduce((a, s) => a + s.pledges, 0),
        raised: students.reduce((a, s) => a + s.expectedRaised, 0),
        classes: new Set(students.map((s) => s.animal)).size, // TODO: include nonparticipating classes
      }))
      .sort(
        (a, b) => getScore(b) - getScore(a) || a.campus.localeCompare(b.campus),
      ),
    getScore,
  );

  return { topCampuses, students, lastUpdate };
}

type Sortable = Readonly<{
  minutes: number;
  pledges: number;
  displayName: string;
}>;
function byReadingComparator(a: Sortable, b: Sortable) {
  return (
    b.minutes - a.minutes ||
    b.pledges - a.pledges ||
    a.displayName.localeCompare(b.displayName)
  );
}
function byPledgingComparator(a: Sortable, b: Sortable) {
  return (
    b.pledges - a.pledges ||
    b.minutes - a.minutes ||
    a.displayName.localeCompare(b.displayName)
  );
}

export async function loadData(campus: string) {
  const { students: allStudents, lastUpdate } = await loadStudents();

  const campusStudents = allStudents.filter((s) => s.campus === campus);
  const studentNames = campusStudents.map((s) =>
    fullName(s.firstName, s.lastName),
  );
  const displayNames = nekonames(studentNames);
  const students = campusStudents.map((s) => ({
    ...s,
    displayName:
      displayNames[fullName(s.firstName, s.lastName)] ??
      fullName(s.firstName, s.lastName),
  }));

  const campusTopReaders = awardPrizes(
    10,
    students.slice().sort(byReadingComparator),
    (s) => s.minutes,
  );

  const campusTopPledgers = awardPrizes(
    5,
    students.slice().sort(byPledgingComparator),
    (s) => s.pledges,
  );

  const classes = Array.from(
    groupBy(students.values(), className).entries(),
    ([className, students]) => {
      const teacher = teachers[className];
      if (teacher == null) {
        console.warn(`No teacher found for ${className}`);
      }
      students.sort(byReadingComparator);
      return {
        students,
        teacher,
        className,
        grade: students[0]!.grade,
        campus: students[0]!.campus,
        animal: students[0]!.animal,
        displayName: className,
        pledges: students.reduce((x, s) => x + s.pledges, 0),
        minutes: students.reduce((x, s) => x + s.minutes, 0),
      };
    },
  );

  const campusClasses = classes.filter((c) => c.campus === campus);
  const grouped = groupBy(campusClasses, (c) => `${c.campus}${c.grade}`);

  const classesByGrade = new Map(
    [...grouped.entries()].map(([league, classes]) => [
      league,
      awardPrizes(
        1,
        classes.slice().sort(byReadingComparator),
        (c) => c.minutes,
      ),
    ]),
  );

  const gradeTopReaders = new Map(
    [...classesByGrade.entries()].map(([grade, classes]) => [
      grade,
      awardPrizes(
        5,
        classes.flatMap(({ item }) => item.students).sort(byReadingComparator),
        (s) => s.minutes,
      ),
    ]),
  );

  const gradeTopPledgers = new Map(
    [...classesByGrade.entries()].map(([grade, classes]) => [
      grade,
      awardPrizes(
        3,
        classes.flatMap(({ item }) => item.students).sort(byPledgingComparator),
        (s) => s.pledges,
      ),
    ]),
  );

  const classTopReaders = new Map(
    campusClasses.map((classroom) => [
      classroom.className,
      awardPrizes(
        3,
        classroom.students.slice().sort(byReadingComparator),
        (s) => s.minutes,
      ),
    ]),
  );

  const classTopPledgers = new Map(
    campusClasses.map((classroom) => [
      classroom.className,
      awardPrizes(
        1,
        classroom.students.slice().sort(byPledgingComparator),
        (s) => s.pledges,
      ),
    ]),
  );

  return {
    classTopReaders,
    classTopPledgers,
    gradeTopReaders,
    gradeTopPledgers,
    campusTopReaders,
    campusTopPledgers,
    classesByGrade,
    lastUpdate,
  };
}

export type CompetitionRank<T> = {
  item: T;
  score: number;
  rank: number;
  prize: boolean;
};

function awardPrizes<T>(
  prizes: number,
  items: Array<T>,
  f: (row: T) => number,
): Array<CompetitionRank<T>> {
  if (items.length === 0) {
    return [];
  }
  const ranks: Array<CompetitionRank<T>> = [];
  let lastScore = f(items[0]!);
  let rank = 1;
  let equalRank = 0;
  for (const r of items) {
    const score = f(r);
    if (score < lastScore) {
      rank = rank + equalRank;
      equalRank = 1;
      lastScore = score;
    } else {
      equalRank = equalRank + 1;
    }
    ranks.push({
      item: r,
      score,
      rank,
      prize: score > 0 && rank <= prizes,
    });
  }
  return ranks;
}

import { type Student } from "./types";

export async function exportCSV(campus: Campus) {
  const {
    campusTopReaders,
    campusTopPledgers,
    gradeTopReaders,
    gradeTopPledgers,
    classTopReaders,
    classTopPledgers,
  } = await loadData(campus);

  const competitions: Array<[string, Array<CompetitionRank<Student>>]> = [
    ["Campus Top Reader", campusTopReaders],
    ["Campus Top Pledger", campusTopPledgers],
  ];

  const moreComps = [
    ["Grade Top Reader", gradeTopReaders],
    ["Grade Top Pledger", gradeTopPledgers],
    ["Class Top Reader", classTopReaders],
    ["Class Top Pledger", classTopPledgers],
  ] as const;

  for (const [title, comp] of moreComps) {
    for (const x of comp.values()) {
      competitions.push([title, x]);
    }
  }

  const result = competitions.flatMap(([title, results]) =>
    results
      .filter((r) => r.prize)
      .map((r) =>
        [
          r.item.campus,
          r.item.grade,
          r.item.animal,
          title,
          r.rank,
          r.score,
          r.item.lastName,
          r.item.firstName,
        ].join(","),
      ),
  );

  result.unshift(
    [
      "Campus",
      "Grade",
      "Class",
      "Competition",
      "Rank",
      "Score",
      "Last name",
      "First name",
    ].join(","),
  );

  return result.join("\n");
}
