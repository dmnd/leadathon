import fs from "fs";
import Papa from "papaparse";
import path from "path";
import invariant from "tiny-invariant";
import { groupBy, partition } from "./array";
import nekonames from "nekonames";
import type { Row } from "./types";
import { capitalize, kebabify, pascalify } from "~/string";

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

async function parseCSV(): Promise<[Papa.ParseResult<Row>, Date]> {
  const files = fs
    .readdirSync(path.join(process.cwd(), "src"))
    .filter((f) => f.endsWith(".csv"))
    .sort();
  const fileName = files.pop()!;
  const filePath = `./src/${fileName}`;
  const match = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d)(\d\d)\.csv$/.exec(fileName);
  if (!match) {
    throw new Error(`Failed to parse date from ${fileName}`);
  }
  const [, year, month, day, hour, minute] = match;

  const lastUpdate = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hour),
    Number(minute),
  );
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

function cleanupName(s: string) {
  if (s.length < 2) return s;
  if (s.toLocaleUpperCase() !== s) return s;

  const s2 = capitalize(s.toLocaleLowerCase());
  console.log(`cleaned up name ${s} to ${s2}`);
  return s2;
}

function fullName(firstName: string, lastName: string) {
  return lastName.length > 0 ? `${firstName} ${lastName}` : firstName;
}

export async function loadData(campus: string) {
  const [csv, lastUpdate] = await parseCSV();

  const [badClasses, rawStudents] = partition(
    csv.data,
    (x) => x["Class Name"] == null || x["Class Name"] === "General",
  );
  console.info(
    `${rawStudents.length} rows remain after filtering out bad data`,
    badClasses,
  );

  const students = rawStudents.flatMap((s) => {
    const match = /^(\w)(\w+)(\w{3}).*$/.exec(s["Class Name"]);
    if (!match) {
      console.error("Failed to match", s["Class Name"]);
      return [];
    }

    const [, grade, animal, campus] = match;

    invariant(campus != null);
    invariant(animal != null);
    invariant(grade != null);

    const firstName = cleanupName(s["First Name"]);
    const lastName = cleanupName(s["Last Name"]);

    return [
      {
        id: [campus, grade, animal, lastName, firstName].join("|"),
        firstName,
        lastName,
        displayName: fullName(firstName, lastName),
        _raw: [s],
        campus,
        animal: kebabify(animal),
        grade: grade === "K" ? 0 : Number.parseInt(grade),
        pledgesOnline:
          s["Online Donation #"] + s["Potential Online Donation #"],
        pledgesOffline: 0, // TODO
        minutes: s["Minute Count"],
      },
    ];
  });

  // merge duplicates
  const uniqStudents = new Map<string, (typeof students)[number]>();
  for (const s of students) {
    const existing = uniqStudents.get(s.id);
    if (existing != null) {
      existing.pledgesOnline += s.pledgesOnline;
      existing.pledgesOffline += s.pledgesOffline;
      existing.minutes += s.minutes;
      existing._raw.push(...s._raw);
    } else {
      uniqStudents.set(s.id, s);
    }
  }

  const campusStudents = Array.from(uniqStudents.values()).filter(
    (s) => s.campus === campus,
  );
  const studentNames = campusStudents.map((s) => s.displayName);
  const displayNames = nekonames(studentNames);
  for (const [, s] of campusStudents.entries()) {
    s.displayName =
      displayNames[fullName(s.firstName, s.lastName)] ?? s.displayName;
  }

  const topReaders = campusStudents
    .sort((a, b) => b.minutes - a.minutes || b.pledgesOnline - a.pledgesOnline)
    .slice(0, 10);

  const topPledgers = campusStudents
    .sort((a, b) => b.pledgesOnline - a.pledgesOnline || b.minutes - a.minutes)
    .slice(0, 10);

  const classes = new Map(
    Array.from(
      groupBy(uniqStudents.values(), className).entries(),
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
            pledges: students.reduce(
              (x, s) => x + s.pledgesOnline + s.pledgesOffline,
              0,
            ),
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
