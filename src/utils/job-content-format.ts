// src/utils/job-content-format.ts

export interface JobContentFields {
  aboutRole: string;
  whatYoullDo: string; // ek line = ek bullet
  whatYoullBring: string; // ek line = ek bullet
  niceToHave: string; // ek line = ek bullet
  additionalInfo: string; // optional, free text
}

export const EMPTY_JOB_CONTENT_FIELDS: JobContentFields = {
  aboutRole: "",
  whatYoullDo: "",
  whatYoullBring: "",
  niceToHave: "",
  additionalInfo: "",
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

  if (fields.additionalInfo.trim()) {
    sections.push(`## Additional Information\n\n${fields.additionalInfo.trim()}`);
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
  "additional information": "additionalInfo",
  "additional info": "additionalInfo",
  "more information": "additionalInfo",
  "other information": "additionalInfo",
  "notes": "additionalInfo",
};

function stripMarkdownBold(s: string): string {
  return s.replace(/\*\*(.*?)\*\*/g, "$1").replace(/\*(.*?)\*/g, "$1").trim();
}

/**
 * Existing DB "content" (markdown) ko wapas fields mein todta hai —
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
    additionalInfo: [],
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
  result.additionalInfo = buckets.additionalInfo.join("\n\n");

  return result;
}