// src/utils/job-content-format.ts

export interface JobContentFields {
  aboutRole: string;
  whatYoullDo: string; // ek line = ek bullet
  whatYoullBring: string; // ek line = ek bullet
  niceToHave: string; // ek line = ek bullet
}

export const EMPTY_JOB_CONTENT_FIELDS: JobContentFields = {
  aboutRole: "",
  whatYoullDo: "",
  whatYoullBring: "",
  niceToHave: "",
};

/**
 * Alag alag fields se DB mein save hone wala markdown "content" banata hai.
 * Sab jobs ka format hamesha consistent rahega isliye — headings manually
 * type nahi karni padtin, isliye typo ka risk khatam.
 */
export function composeJobContent(fields: JobContentFields): string {
  const sections: string[] = [];

  if (fields.aboutRole.trim()) {
    sections.push(`## About the Role\n\n${fields.aboutRole.trim()}`);
  }

  const doLines = fields.whatYoullDo
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (doLines.length) {
    sections.push(`## Key Responsibilities\n\n${doLines.map((l) => `- ${l}`).join("\n")}`);
  }

  const bringLines = fields.whatYoullBring
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (bringLines.length) {
    sections.push(`## Requirements\n\n${bringLines.map((l) => `- ${l}`).join("\n")}`);
  }

  const niceLines = fields.niceToHave
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (niceLines.length) {
    sections.push(`## Nice to Have\n\n${niceLines.map((l) => `- ${l}`).join("\n")}`);
  }

  return sections.join("\n\n");
}

const MARKDOWN_SECTION_ALIASES: Record<string, keyof JobContentFields> = {
  "about us": "aboutRole",
  "the role": "aboutRole",
  "position overview": "aboutRole",
  "about the role": "aboutRole",
  "role overview": "aboutRole",
  "job overview": "aboutRole",
  "key responsibilities": "whatYoullDo",
  "responsibilities": "whatYoullDo",
  "what you'll do": "whatYoullDo",
  "duties": "whatYoullDo",
  "requirements & qualifications": "whatYoullBring",
  "requirements and qualifications": "whatYoullBring",
  "skills & requirements": "whatYoullBring",
  "requirements": "whatYoullBring",
  "what you'll bring": "whatYoullBring",
  "qualifications": "whatYoullBring",
  "what we offer": "niceToHave",
  "benefits": "niceToHave",
  "nice to have": "niceToHave",
  "perks": "niceToHave",
};

function stripMarkdownBold(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();
}

const FREEFORM_HEADING_ALIASES: Record<string, keyof JobContentFields> = {
  "about us": "aboutRole",
  "about the role": "aboutRole",
  "the role": "aboutRole",
  "role overview": "aboutRole",
  "job overview": "aboutRole",
  "position overview": "aboutRole",
  "overview": "aboutRole",
  "job description": "aboutRole",
  "responsibilities": "whatYoullDo",
  "key responsibilities": "whatYoullDo",
  "what you'll do": "whatYoullDo",
  "duties": "whatYoullDo",
  "your role": "whatYoullDo",
  "core responsibilities": "whatYoullDo",
  "main responsibilities": "whatYoullDo",
  "requirements": "whatYoullBring",
  "qualifications": "whatYoullBring",
  "what you'll bring": "whatYoullBring",
  "skills": "whatYoullBring",
  "skills required": "whatYoullBring",
  "skills & requirements": "whatYoullBring",
  "who you are": "whatYoullBring",
  "candidate profile": "whatYoullBring",
  "benefits": "niceToHave",
  "nice to have": "niceToHave",
  "perks": "niceToHave",
  "what we offer": "niceToHave",
  "good to have": "niceToHave",
};

function normalizeHeadingLine(line: string): string {
  return line
    .replace(/^#{1,6}\s*/, "") // agar admin ## bhi laga de to bhi chal jaye
    .replace(/[:：]\s*$/, "") // trailing colon hata do
    .trim()
    .toLowerCase();
}

/**
 * "Quick Paste" box ke liye — bina kisi "##" ya bullet convention ke, sirf
 * heading naam apni line pe likhne se sections pehchan leta hai. Heading
 * milne se pehle jo bhi text ho, usse "About the Role" maan liya jata hai.
 */
export function parseFreeformJobText(raw: string): JobContentFields {
  const result: JobContentFields = { ...EMPTY_JOB_CONTENT_FIELDS };
  if (!raw.trim()) return result;

  const buckets: Record<keyof JobContentFields, string[]> = {
    aboutRole: [],
    whatYoullDo: [],
    whatYoullBring: [],
    niceToHave: [],
  };

  const lines = raw.split(/\r?\n/);
  let currentKey: keyof JobContentFields | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    const normalized = normalizeHeadingLine(line);
    const matchedKey = FREEFORM_HEADING_ALIASES[normalized];

    // Chhoti line (max 6 words) jo known heading se match kare, usse hi
    // heading maano — warna normal sentence galti se heading ban sakta hai.
    if (matchedKey && line.split(/\s+/).length <= 6) {
      currentKey = matchedKey;
      continue;
    }

    if (!currentKey) {
      currentKey = "aboutRole";
    }

    const bulletMatch = line.match(/^[-*•]\s+(.+)$/);
    buckets[currentKey].push(bulletMatch ? bulletMatch[1].trim() : line);
  }

  result.aboutRole = buckets.aboutRole.join("\n\n");
  result.whatYoullDo = buckets.whatYoullDo.join("\n");
  result.whatYoullBring = buckets.whatYoullBring.join("\n");
  result.niceToHave = buckets.niceToHave.join("\n");

  return result;
}

/**
 * Existing DB "content" (markdown) ko wapas 4 fields mein todta hai —
 * edit form kholte waqt purana data fields mein populate karne ke liye.
 */
export function parseJobContent(rawContent: string | null | undefined): JobContentFields {
  const result: JobContentFields = { ...EMPTY_JOB_CONTENT_FIELDS };
  if (!rawContent) return result;

  const buckets: Record<keyof JobContentFields, string[]> = {
    aboutRole: [],
    whatYoullDo: [],
    whatYoullBring: [],
    niceToHave: [],
  };

  const lines = rawContent.split(/\r?\n/).map((l) => l.trim());
  let currentKey: keyof JobContentFields | null = null;

  for (const line of lines) {
    if (!line || line === "---") continue;

    const headingMatch = line.match(/^#{1,6}\s*(.+)$/);
    if (headingMatch) {
      const headingText = stripMarkdownBold(headingMatch[1]).toLowerCase();
      currentKey = MARKDOWN_SECTION_ALIASES[headingText] || null;
      continue;
    }

    if (!currentKey) continue;

    const bulletMatch = line.match(/^[*-]\s+(.+)$/);
    buckets[currentKey].push(bulletMatch ? stripMarkdownBold(bulletMatch[1]) : stripMarkdownBold(line));
  }

  result.aboutRole = buckets.aboutRole.join("\n\n");
  result.whatYoullDo = buckets.whatYoullDo.join("\n");
  result.whatYoullBring = buckets.whatYoullBring.join("\n");
  result.niceToHave = buckets.niceToHave.join("\n");

  return result;
}