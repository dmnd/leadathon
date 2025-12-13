import fs from "fs";
import path from "path";
import Papa from "papaparse";

const regex = /^(\d\d\d\d)-(\d\d)-(\d\d)T(\d\d)(\d\d)\.csv$/;

function findLatestCSV(dir) {
  const files = fs
    .readdirSync(dir)
    .filter((f) => regex.exec(f))
    .sort();
  return files.pop();
}

function isNumberLike(v) {
  if (v === null || v === undefined || v === "") return false;
  // allow numeric strings with commas by stripping commas
  const cleaned = String(v).replace(/,/g, "");
  return Number.isFinite(Number(cleaned));
}

function isZeroMoney(row) {
  const moneyFields = ["Online Donation $", "Potential Online Donation $", "Offline Donation $"];
  return moneyFields.every((k) => !isNumberLike(row[k]) || Number(String(row[k]).replace(/,/g, "")) === 0);
}

function validateRow(row, index) {
  const errors = [];
  const warnings = [];

  // Skip summary/footer rows early
  if (String((row["Last Name"] || "")).toLowerCase() === "total") return null;

  const required = ["First Name", "Last Name", "Class Name"];
  for (const k of required) {
    if (!row[k] && row[k] !== 0) errors.push({ code: "missing_field", field: k });
  }

  // class format (matches runtime parsing in src/data.ts)
  const classMatch = /^(\w)(\w+)(\w{3}).*/.exec(row["Class Name"] || "");
  if (!classMatch) errors.push({ code: "bad_class_format", value: row["Class Name"] });

  // numeric fields sanity
  const numericFields = [
    "Minute Count",
    "Online Donation #",
    "Potential Online Donation #",
    "Online Donation $",
    "Potential Online Donation $",
    "Total + Potential",
    "Offline Donation $",
    "Total",
    "Requests Sent",
    "Requests Delivered",
  ];
  for (const k of numericFields) {
    if (k in row) {
      if (!isNumberLike(row[k])) {
        // treat donation-money non-numbers as errors, minor fields as warnings
        if (["Online Donation $", "Potential Online Donation $", "Offline Donation $", "Total + Potential", "Total"].includes(k)) {
          errors.push({ code: "not_number", field: k, value: row[k] });
        } else {
          warnings.push({ code: "not_number", field: k, value: row[k] });
        }
      } else if (Number(String(row[k]).replace(/,/g, "")) < 0) {
        errors.push({ code: "negative", field: k, value: Number(String(row[k]).replace(/,/g, "")) });
      }
    }
  }

  // simple email check
  if (row["Email Address"] && typeof row["Email Address"] === "string") {
    if (!row["Email Address"].includes("@")) {
      warnings.push({ code: "bad_email", value: row["Email Address"] });
    }
  }

  // common CSV typo: ONline Donation # vs Online Donation #
  if ("ONline Donation #" in row && !("Online Donation #" in row)) {
    warnings.push({ code: "typo_ONline", message: "Found 'ONline Donation #' (capital O)" });
  }

  // If all donation money fields are zero, skip money-mismatch checks to reduce noise
  const moneyFields = ["Online Donation $", "Potential Online Donation $", "Offline Donation $"];
  const moneyExpected = moneyFields.reduce((sum, k) => sum + (isNumberLike(row[k]) ? Number(String(row[k]).replace(/,/g, "")) : 0), 0);
  const declared = isNumberLike(row["Total + Potential"]) ? Number(String(row["Total + Potential"]).replace(/,/g, "")) : (isNumberLike(row["Total"]) ? Number(String(row["Total"]).replace(/,/g, "")) : 0);

  if (!(moneyExpected === 0 && declared === 0)) {
    const diff = Math.abs(moneyExpected - declared);
    const threshold = Math.max(5, Math.abs(declared) * 0.05);
    if (diff > threshold) {
      // treat mismatches as warnings (conservative); if totals are money but missing numeric fields flagged earlier, that will be an error
      warnings.push({ code: "total_mismatch", moneyExpected, declared, diff });
    }
  }

  if (errors.length === 0 && warnings.length === 0) return null;
  return { index, errors, warnings, row };
}

async function main() {
  const srcDir = path.join(process.cwd(), "src");
  const fileName = findLatestCSV(srcDir);
  if (!fileName) {
    console.error("No CSV files found in src/");
    process.exit(2);
  }
  const filePath = path.join(srcDir, fileName);
  console.log(`Validating ${filePath}`);

  const file = fs.readFileSync(filePath, "utf8");
  // Detect a trailing summary/footer raw line that begins with "Total" and
  // instruct parsing to drop it. This handles exports that append a final
  // aggregate row like: `"Total",...`.
  const lines = file.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const lastLine = lines.length ? lines[lines.length - 1] : "";
  const trailingTotalRaw = /^\s*\"?Total\"?\s*[,;].*/i.test(lastLine);

  const results = Papa.parse(file, { header: true, dynamicTyping: false });
  if (trailingTotalRaw && results.data.length > 0) {
    // If the last raw line is a Total row, remove the last parsed row too.
    results.data.pop();
  }
  const rows = results.data;

  const problems = [];
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const p = validateRow(r, i + 1);
    if (p) problems.push(p);
  }

  console.log(`Rows parsed: ${rows.length}`);
  console.log(`Rows with issues: ${problems.length}`);

  if (problems.length > 0) {
    console.log("Top problems sample:");
    for (const p of problems.slice(0, 20)) {
      const errCodes = (p.errors || []).map((x) => `E:${x.code}`);
      const warnCodes = (p.warnings || []).map((x) => `W:${x.code}`);
      console.log(`Row ${p.index}:`, [...errCodes, ...warnCodes].join(", "));
    }
    const outPath = path.join(process.cwd(), "scripts", "validation-donor-problems.json");
    fs.writeFileSync(outPath, JSON.stringify(problems, null, 2), "utf8");
    console.log(`Wrote detailed report to ${outPath}`);
    const hasErrors = problems.some((p) => (p.errors || []).length > 0);
    console.log(hasErrors ? "Errors present — exiting with failure." : "Only warnings present — exiting success.");
    process.exit(hasErrors ? 1 : 0);
  }

  console.log("No problems found.");
}

main().catch((err) => {
  console.error(err);
  process.exit(2);
});
