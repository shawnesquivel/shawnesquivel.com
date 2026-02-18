import fs from "node:fs/promises";
import path from "node:path";

const SOURCE_CSV = path.join(
  process.cwd(),
  "public",
  "Cursor Hackathon Vancouver - Guests - 2026-02-18-17-20-40.csv",
);
const OUTPUT_JSON = path.join(
  process.cwd(),
  "src",
  "lib",
  "hackathon-vancouver-approved.json",
);

function parseCsvRows(csvText) {
  const rows = [];
  let currentRow = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i += 1) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && nextChar === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      if (currentRow.some((cell) => cell.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = "";
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function findHeaderByIncludes(headers, phrase) {
  const normalizedPhrase = phrase.toLowerCase();
  return (
    headers.find((header) => header.toLowerCase().includes(normalizedPhrase)) ??
    null
  );
}

function sanitizeValue(value) {
  return value.trim();
}

async function run() {
  const csvText = await fs.readFile(SOURCE_CSV, "utf-8");
  const parsedRows = parseCsvRows(csvText);

  if (parsedRows.length === 0) {
    throw new Error("CSV has no rows.");
  }

  const headers = parsedRows[0].map((header) => header.trim());
  const rows = parsedRows.slice(1);

  const firstNameHeader = "first_name";
  const lastNameHeader = "last_name";
  const approvalHeader = "approval_status";
  const linkedinHeader = findHeaderByIncludes(headers, "linkedin profile");
  const buildHeader = findHeaderByIncludes(headers, "what do you want to build");
  const attendanceHeader = findHeaderByIncludes(
    headers,
    "are you attending in-person",
  );
  const cursorExperienceHeader = findHeaderByIncludes(
    headers,
    "cursor experience level",
  );
  const companyHeader = findHeaderByIncludes(headers, "if working, what company");
  const majorHeader = findHeaderByIncludes(
    headers,
    "if student, what is your major",
  );

  const headerIndex = new Map(headers.map((header, index) => [header, index]));
  const idx = (header) => (header ? (headerIndex.get(header) ?? -1) : -1);

  const approvedGuests = rows
    .map((row) => {
      const valueAt = (header) => {
        const index = idx(header);
        return index >= 0 ? sanitizeValue(row[index] ?? "") : "";
      };

      return {
        firstName: valueAt(firstNameHeader) || "Unknown",
        lastName: valueAt(lastNameHeader),
        linkedinUrl: valueAt(linkedinHeader),
        jobOrCompany: valueAt(companyHeader),
        majorOrSchool: valueAt(majorHeader),
        buildIdea: valueAt(buildHeader) || "No idea shared",
        attendanceMode: valueAt(attendanceHeader),
        cursorExperienceLevel: valueAt(cursorExperienceHeader),
        approvalStatus: valueAt(approvalHeader).toLowerCase(),
      };
    })
    .filter((guest) => guest.approvalStatus === "approved")
    .map(({ approvalStatus, ...guest }) => guest);

  await fs.writeFile(OUTPUT_JSON, `${JSON.stringify(approvedGuests, null, 2)}\n`);
  console.log(`Wrote ${approvedGuests.length} approved guests to ${OUTPUT_JSON}`);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
