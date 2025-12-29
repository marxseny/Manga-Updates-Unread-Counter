/**
 * Cleans the chapter text to isolate the number + suffix.
 * Handles cases like "c.123", "Ch. 123 end", "123.5".
 */
function cleanChapterText(text) {
  if (!text) return "";
  let str = String(text).trim();

  str = str.replace(/\s*[\(\[]?end[\)\]]?/gi, "").trim();

  // Handle ranges like "120-125", taking the last number
  if (str.includes('-')) {
    const parts = str.split('-');
    str = parts[parts.length - 1].trim();
  }

  const chapterMatch = str.match(/(?:c|ch|chapter)\.?\s*(\d+[\w.]*)/i);
  if (chapterMatch) return chapterMatch[1];

  const numberMatch = str.match(/(\d+(\.\d+|[a-z]+)?)/i);
  return numberMatch ? numberMatch[0] : "";
}

export function extractNumberFromString(text) {
  if (text === null || text === undefined) return null;
  const clean = cleanChapterText(text);
  const match = clean.match(/^(\d+(\.\d+)?)/);
  return match ? parseFloat(match[0]) : null;
}

export function getSelectedSortOptionValue(selector) {
  const checkedRadio = document.querySelector(selector);
  return checkedRadio ? checkedRadio.value : null;
}

/**
 * Splits a chapter string into numeric base and suffix.
 * e.g., "12.5" -> { base: 12, suffix: ".5" }
 * e.g., "10a" -> { base: 10, suffix: "a" }
 */
function parseChapterComponents(chapStr) {
  const clean = cleanChapterText(chapStr).toLowerCase();
  const regex = /^(\d+)(.*)$/;
  const match = clean.match(regex);

  if (!match) return {
    base: parseFloat(clean) || 0,
    suffix: ""
  };

  let suffix = match[2].replace(/[^a-z0-9]/g, "");

  return {
    base: parseInt(match[1], 10),
    suffix: suffix
  };
}

export function compareChapters(chapA, chapB) {
  const a = parseChapterComponents(chapA);
  const b = parseChapterComponents(chapB);

  if (a.base !== b.base) return a.base - b.base;
  if (!a.suffix && b.suffix) return -1;
  if (a.suffix && !b.suffix) return 1;

  const numSufA = parseFloat(a.suffix);
  const numSufB = parseFloat(b.suffix);
  if (!isNaN(numSufA) && !isNaN(numSufB)) return numSufA - numSufB;

  return a.suffix.localeCompare(b.suffix, undefined, {
    numeric: true
  });
}

/**
 * Calculates the difference between the latest chapter and current chapter.
 * Handles complex cases (fractions, suffixes).
 */
export function calculateUnreadGap(latestStr, currentStr) {
  const latest = parseChapterComponents(latestStr);
  const current = parseChapterComponents(currentStr);

  if (latest.base > current.base) return latest.base - current.base;

  if (latest.base === current.base) {
    if (!latest.suffix && !current.suffix) return 0;
    if (latest.suffix && !current.suffix) return 0.1;

    if (latest.suffix === current.suffix) return 0;

    const latIsChar = /^[a-z]+$/.test(latest.suffix);
    const curIsChar = /^[a-z]+$/.test(current.suffix);

    if (latIsChar && curIsChar) {
      const diff = latest.suffix.charCodeAt(0) - current.suffix.charCodeAt(0);
      return diff > 0 ? diff : 0;
    }

    const latNum = parseFloat(latest.suffix);
    const curNum = parseFloat(current.suffix);
    if (!isNaN(latNum) && !isNaN(curNum)) {
      if (latNum > curNum) return latNum - curNum;
    }

    if (latest.suffix.localeCompare(current.suffix, undefined, {
        numeric: true
      }) > 0) {
      return 0.1;
    }
  }

  return 0;
}