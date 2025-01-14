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
  "1TigerCAR": "Zhou Jing",
  "1ZebraCAR": "Xie Jing",
  "2HorseCAR": "Yu Zhikai",
  "2LionCAR": "Teng Qiong",
  "2OwlCAR": "Liu Xi",
  KKoalaCAR: "Guo Qiaoling",
  KPandaCAR: "Luo Qianying",
  KPenguinCAR: "Cai Yuanxi",
  "1MonkeyCHE": "Wen Alin",
  "1TigerCHE": "Liao Yiran",
  "1ZebraCHE": "Fang Yiwei",
  "2HorseCHE": "Emily Lu",
  "2LionCHE": "Yu Zecong",
  "2OwlCHE": "Shi Longping",
  "3DogCHE": "Liu Lian",
  "3PeacockCHE": "Cheng Mengting",
  "3PhoenixCHE": "Zhu Fengjiao",
  "3RabbitCHE": "Erin Yi",
  "3SeaHorseCHE": "Bai Shaojun",
  "3SeaLionCHE": "Luo Minyu",
  KKoalaCHE: "Zhang Jiayin",
  KPandaCHE: "Yang Huize",
  KPenguinCHE: "Zhang Jiaxin",
  "4DolphinMLK": "Nie Shanshan",
  "4QilinMLK": "Tang Yaxing",
  "4SeaTurtleMLK": "Jiang Ningxin",
  "5ElephantMLK": "Liu Yu",
  "5GiraffeMLK": "Chen Jaoling",
  "5RhinoMLK": "Tascian Ani",
  "6CraneMLK": "Hui Yue",
  "6LeopardMLK": "Louis Wu",
  "7BearMLK": "Shao Yun",
  "7FalconMLK": "Jennifer Lee",
  "8PantherMLK": "Xiao Wenjing",
  "8SharkMLK": "Weng Cheng",
};

export function className(x: {
  campus: string;
  grade: number;
  animal: string;
}) {
  return `${x.grade === 0 ? "K" : x.grade}${pascalify(x.animal)}${x.campus.toUpperCase()}`;
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
        resolve([results, lastUpdate]);
      },
    });
  });
}

function cleanupClassName(s: string) {
  return s
    .replace(
      /[A-Z]$/,
      (c) =>
        ({
          A: "CHE",
          M: "MLK",
          C: "CAR",
        })[c]!,
    )
    .replace("4SeaTurtlMLK", "4SeaTurtleMLK");
}

function rosterName(first: string, last: string) {
  return `${first.toLowerCase()}|${last.toLowerCase()}`;
}

function parseRoster(): Promise<Map<string, Set<string>>> {
  const file = fs.readFileSync(
    path.join(process.cwd(), "./src/2024-roster.csv"),
    "utf8",
  );

  type RosterRow = {
    First: string;
    Last: string;
    GR: string;
    Class: string;
  };

  return new Promise((resolve, reject) => {
    Papa.parse<RosterRow>(file, {
      header: true,
      dynamicTyping: true,
      error: reject,
      complete: (results) => {
        const map = new Map<string, Set<string>>();
        for (const r of results.data) {
          if (r.First == null) continue;
          const key = rosterName(r.First, r.Last);
          const set = map.get(key) ?? new Set();
          set.add(cleanupClassName(r.Class));
          map.set(key, set);
        }
        resolve(map);
      },
    });
  });
}

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
  const [roster, [csv, lastUpdate], offlinePledges] = await Promise.all([
    parseRoster(),
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

  const students = rawStudents.flatMap((s) => {
    const firstName = cleanupName(s["First Name"]);
    const lastName = cleanupName(s["Last Name"]);

    const pledgestarClass = s["Class Name"]?.split(/[\s,]+/)[0] ?? "";
    const rosterClasses =
      roster.get(rosterName(firstName, lastName)) ?? new Set();

    let classroom = pledgestarClass;
    let movedFrom: string | null = null;
    if (rosterClasses.size === 0) {
      // console.warn(`${rosterName(firstName, lastName)} not found in roster`);
      // TODO: investigate these
    } else if (rosterClasses.size > 1) {
      // There are kids with the same name!
      console.info(
        `Multiple roster classes found for ${firstName} ${lastName}, skipping autofix`,
      );
    } else {
      const rosterClass = [...rosterClasses.values()][0]!;

      if (rosterClass !== pledgestarClass) {
        // autofix kids that selected the wrong campus or animal on pledgestar,
        // but don't move between grades!
        if (rosterClass.slice(0, 1) === pledgestarClass.slice(0, 1)) {
          console.warn(
            `Moved ${firstName} ${lastName} from Pledgestar class ${pledgestarClass} to rostered class ${rosterClass}`,
          );
          movedFrom = pledgestarClass;
          classroom = rosterClass;
        } else {
          console.info(
            `Possible Pledgestar data issue for ${firstName} ${lastName}: pledgestar class '${pledgestarClass}' but roster class '${rosterClass}'`,
          );
        }
      }
    }

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
    const grade = rawGrade === "K" ? 0 : Number.parseInt(rawGrade);

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

  console.log(
    "dmndst",
    students.filter((s) => s.lastName === "Ramirez"),
  );

  // merge duplicates
  const uniqStudents = new Map<string, (typeof students)[number]>();
  for (const s of students) {
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
  return { students: [...uniqStudents.values()], lastUpdate };
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

  const topReaders = students
    .slice()
    .sort(
      (a, b) =>
        b.minutes - a.minutes ||
        b.pledges - a.pledges ||
        b.displayName.localeCompare(a.displayName),
    );

  const topPledgers = students
    .slice()
    .sort(
      (a, b) =>
        b.pledges - a.pledges ||
        b.minutes - a.minutes ||
        b.displayName.localeCompare(a.displayName),
    );

  const classes = new Map(
    Array.from(
      groupBy(students.values(), className).entries(),
      ([className, students]) => {
        const teacher = teachers[className];
        if (teacher == null) {
          console.warn(`No teacher found for ${className}`);
        }
        return [
          className,
          {
            students,
            teacher,
            className,
            grade: students[0]!.grade,
            campus: students[0]!.campus,
            animal: students[0]!.animal,
            pledges: students.reduce((x, s) => x + s.pledges, 0),
            minutes: students.reduce((x, s) => x + s.minutes, 0),
          },
        ];
      },
    ),
  );

  const campusClasses = new Map(
    Array.from(classes.entries()).filter(([_, c]) => c.campus === campus),
  );

  return {
    classes: campusClasses,
    topReaders,
    topPledgers,
    lastUpdate,
  };
}

export function awardPrizes<T extends { score: number }>(
  rows: Array<T>,
  prizes: number,
): Array<[number, T, boolean]> {
  if (rows.length === 0) {
    return [];
  }
  const ranks: Array<[number, T, boolean]> = [];
  let lastScore = rows[0]!.score;
  let rank = 1;
  let equalRank = 0;
  for (const r of rows) {
    if (r.score < lastScore) {
      rank = rank + equalRank;
      equalRank = 1;
      lastScore = r.score;
    } else {
      equalRank = equalRank + 1;
    }
    ranks.push([rank, r, r.score > 0 && rank <= prizes]);
  }
  return ranks;
}
