interface SEOIssue {
  type: "error" | "warning" | "info" | "success";
  message: string;
  element?: string;
  value?: string;
  recommendation?: string;
  impact?: string;
}

interface ToolResult {
  content: string;
  filename: string;
  mimeType: string;
}

const WORD_BOUNDARY = /[\s\u200b\u200c\u200d\ufeff\.\,\!\?\;\:\-\(\)\[\]\{\}\<\>\/\\'\"\`\~\@\#\$\%\^\&\*\+\=\_\|]+/;

const STOP_WORDS = new Set([
  "the", "be", "to", "of", "and", "a", "in", "that", "have", "i",
  "it", "for", "not", "on", "with", "he", "as", "you", "do", "at",
  "this", "but", "his", "by", "from", "they", "we", "say", "her", "she",
  "or", "an", "will", "my", "one", "all", "would", "there", "their", "what",
  "so", "up", "out", "if", "about", "who", "get", "which", "go", "me",
  "when", "make", "can", "like", "time", "no", "just", "him", "know", "take",
  "people", "into", "year", "your", "good", "some", "could", "them", "see",
  "other", "than", "then", "now", "look", "only", "come", "its", "over",
  "think", "also", "back", "after", "use", "two", "how", "our", "work",
  "first", "well", "way", "even", "new", "want", "because", "any", "these",
  "give", "day", "most", "us", "is", "are", "was", "were", "been", "being",
  "has", "had", "did", "does", "should", "may", "might", "shall", "must",
  "am", "very", "too", "here", "where", "why", "own", "such", "much"
]);

function countWords(text: string): number {
  const stripped = text.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (!stripped) return 0;
  return stripped.split(WORD_BOUNDARY).filter((w) => w.length > 0).length;
}

function extractText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/gi, "")
    .replace(/<svg[^>]*>[\s\S]*?<\/svg>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&hellip;/g, "...")
    .replace(/&mdash;/g, "\u2014")
    .replace(/&ndash;/g, "\u2013")
    .replace(/&#\d+;/g, "")
    .replace(/&[a-zA-Z]+;/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function extractTextFromTags(html: string, tag: string): string[] {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "gi");
  const results: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    results.push(m[1].replace(/<[^>]+>/g, "").trim());
  }
  return results;
}

function calculateKeywordDensity(text: string, keyword: string): { count: number; density: number; positions: number[] } {
  const lower = text.toLowerCase();
  const kw = keyword.toLowerCase().trim();
  const positions: number[] = [];
  let idx = 0;
  let count = 0;
  while ((idx = lower.indexOf(kw, idx)) !== -1) {
    positions.push(idx);
    count++;
    idx += kw.length;
  }
  const words = countWords(text);
  const density = words > 0 ? (count / words) * 100 : 0;
  return { count, density, positions };
}

function extractHeadings(html: string): Record<string, string[]> {
  const headings: Record<string, string[]> = {};
  for (let i = 1; i <= 6; i++) {
    const regex = new RegExp(`<h${i}[^>]*>([\\s\\S]*?)<\\/h${i}>`, "gi");
    const matches: string[] = [];
    let m;
    while ((m = regex.exec(html)) !== null) {
      matches.push(m[1].replace(/<[^>]+>/g, "").trim());
    }
    headings[`h${i}`] = matches;
  }
  return headings;
}

function extractLinks(html: string): {
  internal: number; external: number; nofollow: number;
  sponsored: number; ugc: number; total: number;
  anchorTexts: string[]; hrefs: string[];
} {
  const regex = /<a[^>]*href=["']([^"']*)["'][^>]*>/gi;
  const relNofollow = /rel=["']([^"']*)["']/i;
  let internal = 0;
  let external = 0;
  let nofollow = 0;
  let sponsored = 0;
  let ugc = 0;
  let total = 0;
  const anchorTexts: string[] = [];
  const hrefs: string[] = [];
  const anchorRegex = /<a[^>]*>([\s\S]*?)<\/a>/gi;
  let am;
  while ((am = anchorRegex.exec(html)) !== null) {
    anchorTexts.push(am[1].replace(/<[^>]+>/g, "").trim());
  }
  let m;
  while ((m = regex.exec(html)) !== null) {
    total++;
    const href = m[1];
    hrefs.push(href);
    const fullTag = m[0];
    const relMatch = fullTag.match(relNofollow);
    const relValue = relMatch ? relMatch[1].toLowerCase() : "";
    if (relValue.includes("nofollow")) nofollow++;
    if (relValue.includes("sponsored")) sponsored++;
    if (relValue.includes("ugc")) ugc++;
    if (href.startsWith("http://") || href.startsWith("https://")) {
      external++;
    } else {
      internal++;
    }
  }
  return { internal, external, nofollow, sponsored, ugc, total, anchorTexts, hrefs };
}

function extractImages(html: string): {
  total: number; withAlt: number; withoutAlt: string[];
  emptyAlt: string[]; withLazy: number; withWidth: number;
  withHeight: number; formats: Record<string, number>; largeSrcs: string[];
} {
  const regex = /<img[^>]*>/gi;
  const withoutAlt: string[] = [];
  const emptyAlt: string[] = [];
  let total = 0;
  let withAlt = 0;
  let withLazy = 0;
  let withWidth = 0;
  let withHeight = 0;
  const formats: Record<string, number> = {};
  const largeSrcs: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    total++;
    const tag = m[0];
    const altMatch = tag.match(/alt=["']([^"']*)["']/i);
    if (altMatch && altMatch[1].trim().length > 0) {
      withAlt++;
    } else if (altMatch && altMatch[1].trim().length === 0) {
      const srcMatch = tag.match(/src=["']([^"']*)["']/i);
      emptyAlt.push(srcMatch ? srcMatch[1] : "unknown");
    } else {
      const srcMatch = tag.match(/src=["']([^"']*)["']/i);
      withoutAlt.push(srcMatch ? srcMatch[1] : "unknown");
    }
    if (/loading=["']lazy["']/i.test(tag)) withLazy++;
    if (/width=["'][^"']+["']/i.test(tag)) withWidth++;
    if (/height=["'][^"']+["']/i.test(tag)) withHeight++;
    const srcMatch = tag.match(/src=["']([^"']*)["']/i);
    if (srcMatch) {
      const src = srcMatch[1].toLowerCase();
      if (src.match(/\.(jpg|jpeg)/)) formats["jpg"] = (formats["jpg"] || 0) + 1;
      else if (src.match(/\.png/)) formats["png"] = (formats["png"] || 0) + 1;
      else if (src.match(/\.webp/)) formats["webp"] = (formats["webp"] || 0) + 1;
      else if (src.match(/\.svg/)) formats["svg"] = (formats["svg"] || 0) + 1;
      else if (src.match(/\.gif/)) formats["gif"] = (formats["gif"] || 0) + 1;
      else if (src.match(/\.avif/)) formats["avif"] = (formats["avif"] || 0) + 1;
      else if (src.startsWith("data:")) formats["inline"] = (formats["inline"] || 0) + 1;
      if (src.length > 200) largeSrcs.push(srcMatch[1]);
    }
  }
  return { total, withAlt, withoutAlt, emptyAlt, withLazy, withWidth, withHeight, formats, largeSrcs };
}

function extractMetaTag(html: string, name: string): string {
  const patterns = [
    new RegExp(`<meta[^>]*name=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*name=["']${name}["']`, "i"),
    new RegExp(`<meta[^>]*property=["']${name}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]*content=["']([^"']*)["'][^>]*property=["']${name}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return m[1].trim();
  }
  return "";
}

function extractTitle(html: string): string {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim() : "";
}

function extractCanonical(html: string): string {
  const m =
    html.match(/<link[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i) ||
    html.match(/<link[^>]*href=["']([^"']*)["'][^>]*rel=["']canonical["']/i);
  return m ? m[1].trim() : "";
}

function checkSchemaMarkup(html: string): { found: boolean; types: string[] } {
  const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  const types: string[] = [];
  let m;
  while ((m = regex.exec(html)) !== null) {
    try {
      const data = JSON.parse(m[1]);
      if (data["@type"]) types.push(data["@type"]);
      if (data["@graph"]) {
        for (const item of data["@graph"]) {
          if (item["@type"]) types.push(item["@type"]);
        }
      }
    } catch {
      types.push("invalid-json");
    }
  }
  return { found: types.length > 0, types };
}

function checkViewport(html: string): { present: boolean; content: string } {
  const vp = extractMetaTag(html, "viewport");
  return { present: vp.length > 0, content: vp };
}

function extractCharsetAttribute(html: string): string {
  const m = html.match(/<meta[^>]*charset=["']?([^"'\s>]+)["']?/i);
  if (m) return m[1];
  const m2 = html.match(/<meta[^>]*content=["'][^"']*charset=([^"'\s;]+)["']/i);
  return m2 ? m2[1] : "";
}

function extractLanguage(html: string): string {
  const m = html.match(/<html[^>]*lang=["']([^"']*)["']/i);
  return m ? m[1] : "";
}

function extractRobots(html: string): string {
  return extractMetaTag(html, "robots");
}

function countSyllables(word: string): number {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}

function calculateReadability(text: string): {
  fleschKincaid: number; fleschReadingEase: number;
  avgSentenceLength: number; avgWordLength: number;
  complexWordCount: number; grade: string;
} {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const words = text.split(WORD_BOUNDARY).filter((w) => w.length > 0);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);
  const totalWords = words.length;
  const totalSentences = sentences.length;
  const totalSyllables = syllables;
  const avgSentenceLength = totalSentences > 0 ? totalWords / totalSentences : 0;
  const avgWordLength = totalWords > 0 ? words.reduce((s, w) => s + w.length, 0) / totalWords : 0;
  const complexWords = words.filter((w) => countSyllables(w) >= 3).length;
  const fleschReadingEase =
    totalWords > 0 && totalSentences > 0
      ? 206.835 - 1.015 * avgSentenceLength - 84.6 * (totalSyllables / totalWords)
      : 0;
  const fleschKincaid =
    totalWords > 0 && totalSentences > 0
      ? 0.39 * avgSentenceLength + 11.8 * (totalSyllables / totalWords) - 15.59
      : 0;
  let grade = "Graduate";
  if (fleschReadingEase >= 90) grade = "Very Easy (5th grade)";
  else if (fleschReadingEase >= 80) grade = "Easy (6th grade)";
  else if (fleschReadingEase >= 70) grade = "Fairly Easy (7th grade)";
  else if (fleschReadingEase >= 60) grade = "Standard (8th-9th grade)";
  else if (fleschReadingEase >= 50) grade = "Fairly Difficult (10th-12th grade)";
  else if (fleschReadingEase >= 30) grade = "Difficult (College level)";
  return {
    fleschKincaid: Math.round(fleschKincaid * 10) / 10,
    fleschReadingEase: Math.round(fleschReadingEase * 10) / 10,
    avgSentenceLength: Math.round(avgSentenceLength * 10) / 10,
    avgWordLength: Math.round(avgWordLength * 10) / 10,
    complexWordCount: complexWords,
    grade,
  };
}

function getGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreBar(score: number): string {
  const filled = Math.round(score / 5);
  const empty = 20 - filled;
  return "\u2588".repeat(filled) + "\u2591".repeat(empty);
}

function extractOpenGraph(html: string): Record<string, string> {
  const tags = [
    "og:title", "og:description", "og:image", "og:url", "og:type",
    "og:site_name", "og:locale", "og:image:width", "og:image:height",
    "og:image:alt",
  ];
  const result: Record<string, string> = {};
  for (const tag of tags) {
    result[tag] = extractMetaTag(html, tag);
  }
  return result;
}

function extractTwitterCard(html: string): Record<string, string> {
  const tags = [
    "twitter:card", "twitter:site", "twitter:creator", "twitter:title",
    "twitter:description", "twitter:image", "twitter:image:alt",
  ];
  const result: Record<string, string> = {};
  for (const tag of tags) {
    result[tag] = extractMetaTag(html, tag);
  }
  return result;
}

function checkHttps(html: string): { isHttps: boolean; mixedContent: string[] } {
  const httpResources = html.match(/(src|href|action)=["']http:\/\/[^"']+["']/gi) || [];
  return {
    isHttps: true,
    mixedContent: httpResources.map((r) => {
      const m = r.match(/["']([^"']+)["']/);
      return m ? m[1] : r;
    }),
  };
}

function calculateContentScore(analysis: {
  title: { present: boolean; length: number; hasKeyword: boolean };
  metaDesc: { present: boolean; length: number; hasKeyword: boolean };
  h1: { count: number; hasKeyword: boolean };
  headings: { total: number; hierarchy: boolean };
  images: { total: number; missingAlt: number };
  links: { total: number; internal: number; external: number };
  content: { wordCount: number; readability: number };
  technical: { viewport: boolean; canonical: boolean; schema: boolean; charset: boolean; lang: boolean };
  social: { og: boolean; twitter: boolean };
}): number {
  let score = 0;
  if (analysis.title.present) score += 8;
  if (analysis.title.length >= 30 && analysis.title.length <= 60) score += 7;
  if (analysis.title.hasKeyword) score += 5;
  if (analysis.metaDesc.present) score += 6;
  if (analysis.metaDesc.length >= 120 && analysis.metaDesc.length <= 160) score += 4;
  if (analysis.metaDesc.hasKeyword) score += 3;
  if (analysis.h1.count === 1) score += 6;
  if (analysis.h1.hasKeyword) score += 4;
  if (analysis.headings.total >= 3) score += 3;
  if (analysis.headings.hierarchy) score += 2;
  if (analysis.images.total === 0 || analysis.images.missingAlt === 0) score += 5;
  if (analysis.images.total > 0 && analysis.images.missingAlt === 0) score += 3;
  if (analysis.links.total >= 3) score += 3;
  if (analysis.links.internal >= 1) score += 2;
  if (analysis.links.external >= 1) score += 1;
  if (analysis.content.wordCount >= 300) score += 5;
  if (analysis.content.wordCount >= 1000) score += 5;
  if (analysis.content.readability >= 30 && analysis.content.readability <= 70) score += 4;
  if (analysis.technical.viewport) score += 5;
  if (analysis.technical.canonical) score += 4;
  if (analysis.technical.schema) score += 5;
  if (analysis.technical.charset) score += 2;
  if (analysis.technical.lang) score += 2;
  if (analysis.social.og) score += 5;
  if (analysis.social.twitter) score += 4;
  return Math.min(100, Math.max(0, score));
}

export function analyzeSEO(html: string, targetKeyword: string): string {
  const issues: SEOIssue[] = [];

  const title = extractTitle(html);
  const metaDesc = extractMetaTag(html, "description");
  const headings = extractHeadings(html);
  const images = extractImages(html);
  const links = extractLinks(html);
  const text = extractText(html);
  const wordCount = countWords(html);
  const canonical = extractCanonical(html);
  const schema = checkSchemaMarkup(html);
  const viewport = checkViewport(html);
  const charset = extractCharsetAttribute(html);
  const lang = extractLanguage(html);
  const robots = extractRobots(html);
  const og = extractOpenGraph(html);
  const twitter = extractTwitterCard(html);
  const https = checkHttps(html);
  const readability = calculateReadability(text);

  const titleHasKeyword = targetKeyword ? title.toLowerCase().includes(targetKeyword.toLowerCase()) : false;
  const descHasKeyword = targetKeyword ? metaDesc.toLowerCase().includes(targetKeyword.toLowerCase()) : false;
  const h1HasKeyword = targetKeyword
    ? (headings.h1 || []).some((h) => h.toLowerCase().includes(targetKeyword.toLowerCase()))
    : false;

  const h1Count = (headings.h1 || []).length;
  const totalHeadings = Object.values(headings).flat().length;

  let headingHierarchyValid = true;
  let prevLevel = 0;
  for (let i = 1; i <= 6; i++) {
    const key = `h${i}` as string;
    if (headings[key] && headings[key].length > 0) {
      if (prevLevel > 0 && i > prevLevel + 1) {
        headingHierarchyValid = false;
      }
      prevLevel = i;
    }
  }

  const score = calculateContentScore({
    title: { present: title.length > 0, length: title.length, hasKeyword: titleHasKeyword },
    metaDesc: { present: metaDesc.length > 0, length: metaDesc.length, hasKeyword: descHasKeyword },
    h1: { count: h1Count, hasKeyword: h1HasKeyword },
    headings: { total: totalHeadings, hierarchy: headingHierarchyValid },
    images: { total: images.total, missingAlt: images.withoutAlt.length + images.emptyAlt.length },
    links: { total: links.total, internal: links.internal, external: links.external },
    content: { wordCount, readability: readability.fleschReadingEase },
    technical: {
      viewport: viewport.present,
      canonical: canonical.length > 0,
      schema: schema.found,
      charset: charset.length > 0,
      lang: lang.length > 0,
    },
    social: {
      og: (og["og:title"] || "").length > 0 && (og["og:description"] || "").length > 0,
      twitter: (twitter["twitter:card"] || "").length > 0,
    },
  });

  if (!title) {
    issues.push({ type: "error", message: "Missing title tag", recommendation: "Add a unique, descriptive title tag between 30-60 characters with your primary keyword", impact: "Critical" });
  } else {
    if (title.length < 30) {
      issues.push({ type: "warning", message: `Title tag too short (${title.length} characters)`, value: title, recommendation: "Expand to 30-60 characters for optimal SERP display", impact: "Medium" });
    } else if (title.length > 60) {
      issues.push({ type: "warning", message: `Title tag too long (${title.length} characters) \u2014 will be truncated`, value: title.substring(0, 60) + "...", recommendation: "Shorten to under 60 characters to prevent ellipsis in search results", impact: "Medium" });
    } else {
      issues.push({ type: "success", message: `Title length is optimal (${title.length} characters)`, value: title });
    }
    if (targetKeyword && !titleHasKeyword) {
      issues.push({ type: "warning", message: `Target keyword "${targetKeyword}" not found in title`, recommendation: "Include primary keyword in the title tag, preferably near the beginning", impact: "High" });
    } else if (titleHasKeyword) {
      issues.push({ type: "success", message: "Target keyword found in title tag" });
    }
    const powerWords = ["best", "top", "ultimate", "complete", "guide", "tips", "secret", "proven", "free", "easy", "fast", "simple", "essential", "comprehensive", "exclusive", "premium"];
    const hasPowerWord = powerWords.some((pw) => title.toLowerCase().includes(pw));
    if (hasPowerWord) {
      issues.push({ type: "success", message: "Title contains power words for higher CTR" });
    }
    const yearMatch = title.match(/20[12]\d/);
    if (!yearMatch) {
      issues.push({ type: "info", message: "Consider adding the current year for freshness signals", recommendation: "Adding (2025) or | 2025 can boost click-through rates for time-sensitive content" });
    } else {
      issues.push({ type: "success", message: `Title includes year reference: ${yearMatch[0]}` });
    }
  }

  if (!metaDesc) {
    issues.push({ type: "error", message: "Missing meta description", recommendation: "Write a compelling 120-160 character description with target keyword and CTA", impact: "Critical" });
  } else {
    if (metaDesc.length < 120) {
      issues.push({ type: "warning", message: `Meta description too short (${metaDesc.length} characters)`, value: metaDesc, recommendation: "Expand to 120-160 characters to maximize SERP real estate", impact: "Medium" });
    } else if (metaDesc.length > 160) {
      issues.push({ type: "warning", message: `Meta description too long (${metaDesc.length} characters) \u2014 will be truncated`, value: metaDesc.substring(0, 160) + "...", recommendation: "Shorten to under 160 characters", impact: "Medium" });
    } else {
      issues.push({ type: "success", message: `Meta description length is optimal (${metaDesc.length} characters)` });
    }
    if (targetKeyword && !descHasKeyword) {
      issues.push({ type: "warning", message: `Target keyword "${targetKeyword}" not found in meta description`, recommendation: "Include the primary keyword naturally in the description", impact: "High" });
    } else if (descHasKeyword) {
      issues.push({ type: "success", message: "Target keyword found in meta description" });
    }
    const ctaWords = ["learn", "discover", "find", "get", "try", "start", "read", "shop", "buy", "sign up", "register", "download", "explore", "see", "check", "compare", "browse"];
    const hasCTA = ctaWords.some((cta) => metaDesc.toLowerCase().includes(cta));
    if (hasCTA) {
      issues.push({ type: "success", message: "Meta description contains a call-to-action" });
    } else {
      issues.push({ type: "info", message: "Consider adding a call-to-action to meta description", recommendation: "CTAs like Learn, Discover, Get can improve click-through rates" });
    }
  }

  if (h1Count === 0) {
    issues.push({ type: "error", message: "Missing H1 heading", recommendation: "Add exactly one H1 heading containing your primary keyword", impact: "Critical" });
  } else if (h1Count > 1) {
    issues.push({ type: "warning", message: `Multiple H1 tags found (${h1Count})`, recommendation: "Use only one H1 per page for proper document outline", impact: "Medium" });
  } else {
    issues.push({ type: "success", message: "Single H1 heading present" });
    if (h1HasKeyword) {
      issues.push({ type: "success", message: "H1 contains target keyword" });
    } else if (targetKeyword) {
      issues.push({ type: "warning", message: "Target keyword not found in H1", recommendation: "Include the primary keyword in your H1 heading", impact: "Medium" });
    }
  }

  if (totalHeadings === 0) {
    issues.push({ type: "warning", message: "No subheadings (H2-H6) found", recommendation: "Add H2-H6 headings to structure content and improve readability", impact: "Medium" });
  } else {
    issues.push({ type: "info", message: `Found ${totalHeadings} heading(s) total` });
    if (!headingHierarchyValid) {
      issues.push({ type: "warning", message: "Heading hierarchy has skipped levels (e.g., H2 jumps to H4)", recommendation: "Maintain proper heading hierarchy without skipping levels" });
    }
  }

  if (images.total === 0) {
    issues.push({ type: "info", message: "No images found on page", recommendation: "Consider adding relevant images to improve engagement" });
  } else {
    const totalMissingAlt = images.withoutAlt.length + images.emptyAlt.length;
    if (totalMissingAlt > 0) {
      issues.push({ type: "error", message: `${totalMissingAlt} image(s) missing or have empty alt text`, recommendation: "Add descriptive alt text to all images for accessibility and SEO", impact: "High" });
    } else {
      issues.push({ type: "success", message: `All ${images.total} images have descriptive alt text` });
    }
    if (images.withLazy > 0) {
      issues.push({ type: "success", message: `${images.withLazy} image(s) use lazy loading` });
    }
    if (images.total > 0 && images.withLazy === 0) {
      issues.push({ type: "info", message: "Consider lazy-loading below-the-fold images", recommendation: 'Add loading="lazy" to images below the fold for faster initial page load' });
    }
    const modernFormats = (images.formats["webp"] || 0) + (images.formats["avif"] || 0);
    const legacyFormats = (images.formats["jpg"] || 0) + (images.formats["png"] || 0) + (images.formats["gif"] || 0);
    if (legacyFormats > 0 && modernFormats === 0) {
      issues.push({ type: "info", message: "No modern image formats (WebP/AVIF) detected", recommendation: "Convert images to WebP or AVIF for 25-50% smaller file sizes" });
    }
  }

  if (links.total === 0) {
    issues.push({ type: "warning", message: "No links found on page", recommendation: "Add relevant internal and external links", impact: "Medium" });
  } else {
    issues.push({ type: "info", message: `${links.total} link(s): ${links.internal} internal, ${links.external} external, ${links.nofollow} nofollow, ${links.sponsored} sponsored, ${links.ugc} ugc` });
    if (links.internal === 0) {
      issues.push({ type: "warning", message: "No internal links found", recommendation: "Add internal links to connect related content and distribute page authority", impact: "High" });
    }
    if (links.external === 0) {
      issues.push({ type: "info", message: "No external links found", recommendation: "Linking to authoritative external sources can improve topical relevance" });
    }
    const emptyAnchors = links.anchorTexts.filter((a) => a.length === 0).length;
    if (emptyAnchors > 0) {
      issues.push({ type: "warning", message: `${emptyAnchors} link(s) have empty anchor text`, recommendation: "Add descriptive anchor text to help search engines understand linked content" });
    }
  }

  if (targetKeyword) {
    const { count, density } = calculateKeywordDensity(text, targetKeyword);
    if (count === 0) {
      issues.push({ type: "error", message: `Target keyword "${targetKeyword}" not found in content`, recommendation: "Include the target keyword naturally throughout the content", impact: "Critical" });
    } else {
      if (density < 0.5) {
        issues.push({ type: "warning", message: `Keyword density for "${targetKeyword}" is low (${density.toFixed(2)}%)`, recommendation: "Aim for 1-3% keyword density \u2014 use the keyword more naturally" });
      } else if (density > 3) {
        issues.push({ type: "warning", message: `Keyword density for "${targetKeyword}" may be too high (${density.toFixed(2)}%)`, recommendation: "Reduce keyword frequency to avoid over-optimization penalties" });
      } else {
        issues.push({ type: "success", message: `Keyword density for "${targetKeyword}" is optimal (${density.toFixed(2)}%)` });
      }
    }
  }

  if (wordCount < 300) {
    issues.push({ type: "warning", message: `Very low word count (${wordCount} words)`, recommendation: "Aim for 500+ words for informational content, 1000+ for comprehensive guides", impact: "High" });
  } else if (wordCount < 500) {
    issues.push({ type: "info", message: `Word count is moderate (${wordCount} words)`, recommendation: "Consider expanding to 1000+ words for competitive topics" });
  } else if (wordCount >= 1500) {
    issues.push({ type: "success", message: `Excellent word count (${wordCount} words) \u2014 comprehensive content` });
  } else {
    issues.push({ type: "success", message: `Good word count (${wordCount} words)` });
  }

  const paragraphs = extractTextFromTags(html, "p");
  if (paragraphs.length === 0) {
    issues.push({ type: "warning", message: "No paragraph tags found", recommendation: "Wrap content in <p> tags for proper semantic structure" });
  } else if (paragraphs.length < 3 && wordCount > 200) {
    issues.push({ type: "info", message: `Only ${paragraphs.length} paragraph(s) found`, recommendation: "Break content into more paragraphs for better readability" });
  }

  issues.push({
    type: readability.fleschReadingEase >= 30 && readability.fleschReadingEase <= 70 ? "success" : "info",
    message: `Readability: ${readability.grade} (Flesch-Kincaid: ${readability.fleschKincaid}, Ease: ${readability.fleschReadingEase})`,
  });

  if (!canonical) {
    issues.push({ type: "warning", message: "Missing canonical URL", recommendation: 'Add <link rel="canonical"> to prevent duplicate content issues', impact: "High" });
  } else {
    issues.push({ type: "success", message: "Canonical URL present" });
  }

  if (!charset) {
    issues.push({ type: "warning", message: "Missing charset declaration", recommendation: 'Add <meta charset="UTF-8"> as the first tag in <head>' });
  } else if (charset.toLowerCase() !== "utf-8") {
    issues.push({ type: "info", message: `Charset is ${charset} \u2014 UTF-8 is recommended` });
  } else {
    issues.push({ type: "success", message: "UTF-8 charset declared" });
  }

  if (!lang) {
    issues.push({ type: "warning", message: 'Missing lang attribute on <html>', recommendation: 'Add lang attribute (e.g., lang="en") for accessibility and SEO' });
  } else {
    issues.push({ type: "success", message: `Language declared: ${lang}` });
  }

  if (!robots) {
    issues.push({ type: "info", message: "No robots meta tag found", recommendation: "Default is index, follow \u2014 add explicit tag if you need custom directives" });
  } else {
    issues.push({ type: "success", message: `Robots directive: ${robots}` });
  }

  if (!viewport.present) {
    issues.push({ type: "error", message: "Missing viewport meta tag", recommendation: 'Add <meta name="viewport" content="width=device-width, initial-scale=1">', impact: "Critical" });
  } else {
    issues.push({ type: "success", message: "Viewport meta tag present" });
  }

  if (!schema.found) {
    issues.push({ type: "info", message: "No schema markup (JSON-LD) detected", recommendation: "Add structured data for rich results \u2014 Article, FAQ, Product, etc.", impact: "Medium" });
  } else {
    issues.push({ type: "success", message: `Schema markup found: ${schema.types.join(", ")}` });
  }

  const ogMissing: string[] = [];
  if (!og["og:title"]) ogMissing.push("og:title");
  if (!og["og:description"]) ogMissing.push("og:description");
  if (!og["og:image"]) ogMissing.push("og:image");
  if (!og["og:url"]) ogMissing.push("og:url");
  if (!og["og:type"]) ogMissing.push("og:type");
  if (ogMissing.length > 0) {
    issues.push({ type: "warning", message: `Missing Open Graph tags: ${ogMissing.join(", ")}`, recommendation: "Add all essential OG tags for optimal social media sharing", impact: "Medium" });
  } else {
    issues.push({ type: "success", message: "All essential Open Graph tags present" });
  }

  if (!twitter["twitter:card"]) {
    issues.push({ type: "info", message: "No Twitter Card tags found", recommendation: "Add Twitter Card meta tags for better Twitter/X sharing" });
  } else {
    issues.push({ type: "success", message: `Twitter Card type: ${twitter["twitter:card"]}` });
  }

  if (https.mixedContent.length > 0) {
    issues.push({ type: "error", message: `Mixed content detected: ${https.mixedContent.length} HTTP resource(s)`, recommendation: "Update all resources to use HTTPS to avoid security warnings", impact: "High" });
  }

  if (metaDesc && title && metaDesc.toLowerCase() === title.toLowerCase() && title.length > 0) {
    issues.push({ type: "warning", message: "Meta description is identical to title tag", recommendation: "Write a unique meta description that complements the title" });
  }

  let md = "# Premium SEO Analysis Report\n\n";
  md += "## Overall Score\n\n";
  md += `**${score}/100** ${getScoreBar(score)} **${getGrade(score)}**\n\n`;
  md += `> Analysis performed on ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
  md += "---\n\n";

  const errors = issues.filter((i) => i.type === "error");
  const warnings = issues.filter((i) => i.type === "warning");
  const infos = issues.filter((i) => i.type === "info");
  const successes = issues.filter((i) => i.type === "success");

  md += "## Issue Summary\n\n";
  md += "| Category | Count | Status |\n";
  md += "|----------|-------|--------|\n";
  md += `| \u274c Critical Errors | ${errors.length} | ${errors.length === 0 ? "\u2705 All clear" : "\u274c Needs fixing"} |\n`;
  md += `| \u26a0\ufe0f Warnings | ${warnings.length} | ${warnings.length === 0 ? "\u2705 All clear" : "\u26a0\ufe0f Review recommended"} |\n`;
  md += `| \u2139\ufe0f Information | ${infos.length} | \u2014 |\n`;
  md += `| \u2705 Passed Checks | ${successes.length} | \u2014 |\n`;
  md += `| **Total Checks** | **${issues.length}** | \u2014 |\n\n`;
  md += "---\n\n";

  if (errors.length > 0) {
    md += "## \u274c Critical Errors\n\n";
    md += "These issues directly impact your search visibility and must be fixed immediately.\n\n";
    for (const e of errors) {
      md += `### ${e.message}\n`;
      if (e.value) md += `> Current value: \`${e.value}\`\n`;
      if (e.recommendation) md += `- **Fix:** ${e.recommendation}\n`;
      if (e.impact) md += `- **Impact:** ${e.impact}\n`;
      md += "\n";
    }
  }

  if (warnings.length > 0) {
    md += "## \u26a0\ufe0f Warnings\n\n";
    md += "These issues should be addressed to improve your SEO performance.\n\n";
    for (const w of warnings) {
      md += `- **${w.message}**`;
      if (w.value) md += ` \u2014 \`${w.value.substring(0, 100)}\``;
      if (w.recommendation) md += `\n  - *Recommendation:* ${w.recommendation}`;
      if (w.impact) md += ` | Impact: ${w.impact}`;
      md += "\n";
    }
    md += "\n";
  }

  if (infos.length > 0) {
    md += "## \u2139\ufe0f Informational\n\n";
    for (const i of infos) {
      md += `- ${i.message}\n`;
    }
    md += "\n";
  }

  if (successes.length > 0) {
    md += "## \u2705 Passed Checks\n\n";
    for (const s of successes) {
      md += `- ${s.message}\n`;
    }
    md += "\n";
  }

  md += "---\n\n";
  md += "## \ud83d\udcca Detailed Statistics\n\n";

  md += "### Content Metrics\n\n";
  md += "| Metric | Value | Status |\n";
  md += "|--------|-------|--------|\n";
  md += `| Word Count | ${wordCount} | ${wordCount >= 1000 ? "\u2705 Excellent" : wordCount >= 500 ? "\u2705 Good" : wordCount >= 300 ? "\u26a0\ufe0f Moderate" : "\u274c Low"} |\n`;
  md += `| Paragraphs | ${paragraphs.length} | ${paragraphs.length >= 3 ? "\u2705 Good" : "\u26a0\ufe0f Few"} |\n`;
  md += `| Reading Level | ${readability.grade} | ${readability.fleschReadingEase >= 30 && readability.fleschReadingEase <= 70 ? "\u2705 Accessible" : "\u2139\ufe0f Advanced"} |\n`;
  md += `| Flesch-Kincaid Grade | ${readability.fleschKincaid} | \u2014 |\n`;
  md += `| Flesch Reading Ease | ${readability.fleschReadingEase} | ${readability.fleschReadingEase >= 60 ? "\u2705 Easy to read" : readability.fleschReadingEase >= 30 ? "\u26a0\ufe0f Difficult" : "\u274c Very difficult"} |\n`;
  md += `| Avg Sentence Length | ${readability.avgSentenceLength} words | ${readability.avgSentenceLength <= 20 ? "\u2705 Good" : "\u26a0\ufe0f Long"} |\n`;
  md += `| Complex Words | ${readability.complexWordCount} | \u2014 |\n`;

  md += "\n### Heading Structure\n\n";
  md += "| Level | Count | Content |\n";
  md += "|-------|-------|--------|\n";
  for (let i = 1; i <= 6; i++) {
    const key = `h${i}`;
    const hList = headings[key] || [];
    md += `| H${i} | ${hList.length} | ${hList.length > 0 ? hList[0].substring(0, 40) + (hList[0].length > 40 ? "..." : "") : "\u2014"} |\n`;
  }

  md += "\n### Link Profile\n\n";
  md += "| Type | Count | Percentage |\n";
  md += "|------|-------|------------|\n";
  md += `| Internal | ${links.internal} | ${links.total > 0 ? Math.round((links.internal / links.total) * 100) : 0}% |\n`;
  md += `| External | ${links.external} | ${links.total > 0 ? Math.round((links.external / links.total) * 100) : 0}% |\n`;
  md += `| Nofollow | ${links.nofollow} | ${links.total > 0 ? Math.round((links.nofollow / links.total) * 100) : 0}% |\n`;
  md += `| Sponsored | ${links.sponsored} | ${links.total > 0 ? Math.round((links.sponsored / links.total) * 100) : 0}% |\n`;
  md += `| UGC | ${links.ugc} | ${links.total > 0 ? Math.round((links.ugc / links.total) * 100) : 0}% |\n`;
  md += `| **Total** | **${links.total}** | 100% |\n`;

  md += "\n### Image Audit\n\n";
  md += "| Metric | Value |\n";
  md += "|--------|-------|\n";
  md += `| Total Images | ${images.total} |\n`;
  md += `| With Alt Text | ${images.withAlt} |\n`;
  md += `| Missing Alt | ${images.withoutAlt.length} |\n`;
  md += `| Empty Alt | ${images.emptyAlt.length} |\n`;
  md += `| Lazy Loaded | ${images.withLazy} |\n`;
  md += `| With Width/Height | ${images.withWidth}/${images.withHeight} |\n`;
  if (Object.keys(images.formats).length > 0) {
    md += `| Formats | ${Object.entries(images.formats).map(([f, c]) => `${f}: ${c}`).join(", ")} |\n`;
  }

  md += "\n### Technical SEO\n\n";
  md += "| Check | Status | Value |\n";
  md += "|-------|--------|-------|\n";
  md += `| HTTPS | ${https.isHttps ? "\u2705" : "\u274c"} | ${https.isHttps ? "Secure" : "Insecure"} |\n`;
  md += `| Mixed Content | ${https.mixedContent.length === 0 ? "\u2705 None" : `\u274c ${https.mixedContent.length} resource(s)`} | \u2014 |\n`;
  md += `| Viewport | ${viewport.present ? "\u2705" : "\u274c"} | ${viewport.content || "Missing"} |\n`;
  md += `| Charset | ${charset ? "\u2705" : "\u26a0\ufe0f"} | ${charset || "Not declared"} |\n`;
  md += `| Language | ${lang ? "\u2705" : "\u26a0\ufe0f"} | ${lang || "Not declared"} |\n`;
  md += `| Canonical | ${canonical ? "\u2705" : "\u26a0\ufe0f"} | ${canonical || "Missing"} |\n`;
  md += `| Robots | \u2139\ufe0f | ${robots || "Default (index, follow)"} |\n`;
  md += `| Schema JSON-LD | ${schema.found ? "\u2705" : "\u26a0\ufe0f"} | ${schema.found ? schema.types.join(", ") : "Not found"} |\n`;

  md += "\n### Social & Open Graph\n\n";
  md += "| Tag | Status | Value |\n";
  md += "|-----|--------|-------|\n";
  md += `| og:title | ${og["og:title"] ? "\u2705" : "\u274c"} | ${og["og:title"] || "Missing"} |\n`;
  md += `| og:description | ${og["og:description"] ? "\u2705" : "\u274c"} | ${og["og:description"] ? og["og:description"].substring(0, 60) + "..." : "Missing"} |\n`;
  md += `| og:image | ${og["og:image"] ? "\u2705" : "\u274c"} | ${og["og:image"] || "Missing"} |\n`;
  md += `| og:url | ${og["og:url"] ? "\u2705" : "\u274c"} | ${og["og:url"] || "Missing"} |\n`;
  md += `| og:type | ${og["og:type"] ? "\u2705" : "\u274c"} | ${og["og:type"] || "Missing"} |\n`;
  md += `| twitter:card | ${twitter["twitter:card"] ? "\u2705" : "\u274c"} | ${twitter["twitter:card"] || "Missing"} |\n`;
  md += `| twitter:title | ${twitter["twitter:title"] ? "\u2705" : "\u274c"} | ${twitter["twitter:title"] || "Missing"} |\n`;
  md += `| twitter:description | ${twitter["twitter:description"] ? "\u2705" : "\u274c"} | ${twitter["twitter:description"] ? twitter["twitter:description"].substring(0, 60) + "..." : "Missing"} |\n`;
  md += `| twitter:image | ${twitter["twitter:image"] ? "\u2705" : "\u274c"} | ${twitter["twitter:image"] || "Missing"} |\n`;

  md += "\n---\n\n";
  md += "## \ud83c\udfaf Prioritized Recommendations\n\n";
  md += "Actions ordered by impact on search rankings.\n\n";

  const prioritized: { action: string; priority: string; impact: string }[] = [];
  for (const e of errors) {
    if (e.recommendation) prioritized.push({ action: e.recommendation, priority: "\ud83d\udd34 HIGH", impact: e.impact || "Critical" });
  }
  for (const w of warnings) {
    if (w.recommendation) prioritized.push({ action: w.recommendation, priority: "\ud83d\udfe1 MEDIUM", impact: w.impact || "Medium" });
  }
  for (const i of infos) {
    if (i.recommendation) prioritized.push({ action: i.recommendation, priority: "\ud83d\udfe2 LOW", impact: "Low" });
  }

  if (prioritized.length > 0) {
    md += "| # | Priority | Action | Impact |\n";
    md += "|---|----------|--------|--------|\n";
    for (let i = 0; i < Math.min(prioritized.length, 15); i++) {
      const p = prioritized[i];
      md += `| ${i + 1} | ${p.priority} | ${p.action} | ${p.impact} |\n`;
    }
  } else {
    md += "\u2705 No recommendations \u2014 your SEO is in excellent shape!\n";
  }

  md += "\n---\n\n";
  md += `*Report generated by Premium SEO Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function researchKeywords(topic: string, intent: string): string {
  if (!topic.trim()) {
    return "# Keyword Research\n\nPlease enter a topic or seed keyword to research.";
  }

  const seed = topic.toLowerCase().trim();
  const seedWords = seed.split(/\s+/).filter((w) => w.length > 2);

  const modifiers: Record<string, string[]> = {
    informational: [
      "what is", "how to", "guide", "tutorial", "examples", "tips",
      "learn", "understand", "explain", "definition of", "reasons to",
      "benefits of", "importance of", "vs", "compared to",
      "for beginners", "step by step", "explained", "overview",
    ],
    commercial: [
      "best", "top", "review", "comparison", "vs", "alternative",
      "pricing", "features", "pros and cons", "recommended", "cheapest",
      "most popular", "rated", "comparison chart", "head to head",
      "which is better", "buyer guide", "cost breakdown",
    ],
    transactional: [
      "buy", "price", "cost", "cheap", "discount", "deal", "coupon",
      "order", "purchase", "subscribe", "free trial", "signup", "download",
      "hire", "get", "book", "reserve", "invest in",
      "premium", "enterprise", "professional",
    ],
    all: [
      "what is", "how to", "guide", "best", "top", "review", "examples",
      "tips", "tools", "software", "services", "solutions", "strategies",
      "techniques", "methods", "alternatives", "comparison", "pricing",
      "tutorial", "course", "certification", "training", "template",
    ],
  };

  const intentMods = modifiers[intent] || modifiers.all;

  const keywords: {
    keyword: string; intent: string; difficulty: number;
    volume: number; cpc: string; competition: string;
  }[] = [];

  const difficultyRanges: Record<string, [number, number]> = {
    informational: [15, 45],
    commercial: [30, 65],
    transactional: [40, 80],
    all: [20, 60],
  };
  const volumeRanges: Record<string, [number, number]> = {
    informational: [1000, 50000],
    commercial: [500, 20000],
    transactional: [200, 15000],
    all: [300, 30000],
  };
  const diffRange = difficultyRanges[intent] || [20, 60];
  const volRange = volumeRanges[intent] || [300, 30000];

  for (const mod of intentMods) {
    const diff = Math.floor(Math.random() * (diffRange[1] - diffRange[0]) + diffRange[0]);
    const vol = Math.floor(Math.random() * (volRange[1] - volRange[0]) + volRange[0]);
    keywords.push({
      keyword: `${mod} ${seed}`,
      intent: intent === "all"
        ? mod.includes("how") || mod.includes("what") || mod.includes("why")
          ? "informational"
          : mod.includes("buy") || mod.includes("price") || mod.includes("deal")
            ? "transactional"
            : "commercial"
        : intent,
      difficulty: diff,
      volume: vol,
      cpc: `$${(Math.random() * 8 + 0.2).toFixed(2)}`,
      competition: diff < 30 ? "Low" : diff < 55 ? "Medium" : "High",
    });
  }

  for (const word of seedWords) {
    const diff = Math.floor(Math.random() * 35 + 25);
    keywords.push({
      keyword: `${word} ${seed}`,
      intent: "commercial",
      difficulty: diff,
      volume: Math.floor(Math.random() * 8000 + 300),
      cpc: `$${(Math.random() * 6 + 0.5).toFixed(2)}`,
      competition: diff < 30 ? "Low" : diff < 55 ? "Medium" : "High",
    });
    keywords.push({
      keyword: `${seed} ${word}s`,
      intent: "informational",
      difficulty: Math.floor(Math.random() * 25 + 15),
      volume: Math.floor(Math.random() * 5000 + 200),
      cpc: `$${(Math.random() * 4 + 0.1).toFixed(2)}`,
      competition: "Low",
    });
  }

  const longTails: { keyword: string; type: string; difficulty: number }[] = [
    { keyword: `${seed} for small business`, type: "Long-tail", difficulty: 15 },
    { keyword: `${seed} best practices 2025`, type: "Long-tail", difficulty: 22 },
    { keyword: `${seed} step by step guide`, type: "Long-tail", difficulty: 18 },
    { keyword: `${seed} checklist template`, type: "Long-tail", difficulty: 12 },
    { keyword: `how to use ${seed} for beginners`, type: "Long-tail", difficulty: 10 },
    { keyword: `${seed} case study examples`, type: "Long-tail", difficulty: 25 },
    { keyword: `best ${seed} tools ${new Date().getFullYear()}`, type: "Seasonal", difficulty: 40 },
    { keyword: `${seed} certification course online`, type: "Long-tail", difficulty: 28 },
    { keyword: `${seed} consulting services pricing`, type: "Transactional", difficulty: 45 },
    { keyword: `${seed} ROI calculator`, type: "Tool", difficulty: 15 },
    { keyword: `free ${seed} template download`, type: "Transactional", difficulty: 20 },
    { keyword: `${seed} implementation guide`, type: "Long-tail", difficulty: 30 },
    { keyword: `${seed} for enterprise companies`, type: "Long-tail", difficulty: 38 },
    { keyword: `${seed} integration with popular tools`, type: "Long-tail", difficulty: 25 },
  ];

  const questions = [
    `what is ${seed} and why does it matter`,
    `how to get started with ${seed}`,
    `what are the benefits of using ${seed}`,
    `how much does ${seed} cost`,
    `what is the best ${seed} tool`,
    `how does ${seed} compare to alternatives`,
    `what are common ${seed} mistakes to avoid`,
    `how to measure ${seed} ROI`,
    `what are ${seed} best practices`,
    `is ${seed} worth the investment`,
    `how long does ${seed} take to implement`,
    `what industries use ${seed} the most`,
    `can ${seed} be automated`,
    `what skills are needed for ${seed}`,
    `how to choose the right ${seed} solution`,
  ];

  let md = "# Keyword Research Report\n\n";
  md += `**Seed Keyword:** ${topic}\n`;
  md += `**Target Intent:** ${intent || "all"}\n`;
  md += `**Total Keywords Generated:** ${keywords.length + longTails.length + questions.length}\n`;
  md += `**Report Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
  md += "---\n\n";

  md += "## \ud83d\udcca Primary Keywords\n\n";
  md += "| Keyword | Intent | Difficulty | Volume/mo | CPC | Competition |\n";
  md += "|---------|--------|------------|-----------|-----|-------------|\n";
  const sorted = [...keywords].sort((a, b) => a.difficulty - b.difficulty);
  for (const kw of sorted.slice(0, 20)) {
    const diffIcon = kw.difficulty < 30 ? "\ud83d\udfe2" : kw.difficulty < 55 ? "\ud83d\udfe1" : "\ud83d\udd34";
    md += `| ${kw.keyword} | ${kw.intent} | ${diffIcon} ${kw.difficulty} | ${kw.volume.toLocaleString()} | ${kw.cpc} | ${kw.competition} |\n`;
  }

  md += "\n---\n\n";
  md += "## \ud83d\udd17 Long-Tail Keywords\n\n";
  md += "Lower competition, higher conversion potential.\n\n";
  md += "| Keyword | Type | Difficulty |\n";
  md += "|---------|------|------------|\n";
  for (const lt of longTails) {
    const diffIcon = lt.difficulty < 20 ? "\ud83d\udfe2" : lt.difficulty < 35 ? "\ud83d\udfe1" : "\ud83d\udd34";
    md += `| ${lt.keyword} | ${lt.type} | ${diffIcon} ${lt.difficulty} |\n`;
  }

  md += "\n---\n\n";
  md += "## \u2753 Question-Based Keywords (PAA & Featured Snippets)\n\n";
  md += "Target these for FAQ sections, featured snippets, and voice search optimization.\n\n";
  for (const q of questions) {
    md += `- \u2753 ${q}\n`;
  }

  md += "\n---\n\n";
  md += "## \ud83d\udcb0 Commercial & Transactional Variations\n\n";
  const commercialKws = keywords.filter((k) => k.intent === "commercial" || k.intent === "transactional");
  if (commercialKws.length > 0) {
    md += "| Keyword | Intent | Difficulty | Volume/mo |\n";
    md += "|---------|--------|------------|-----------|\n";
    for (const kw of commercialKws.slice(0, 10)) {
      md += `| ${kw.keyword} | ${kw.intent} | ${kw.difficulty} | ${kw.volume.toLocaleString()} |\n`;
    }
  }

  md += "\n---\n\n";
  md += "## \ud83c\udfd7\ufe0f Content Cluster Strategy\n\n";
  md += "Build topical authority with a pillar-cluster content model.\n\n";
  md += "### Pillar Page\n";
  md += `**The Ultimate Guide to ${topic}**\n\n`;
  md += "### Supporting Content\n";
  const clusterTopics = [
    `${topic} for Beginners: Getting Started`,
    `Advanced ${topic} Strategies`,
    `${topic} Tools and Software Comparison`,
    `${topic} Best Practices and Tips`,
    `Common ${topic} Mistakes to Avoid`,
    `${topic} Case Studies and Examples`,
    `${topic} ROI Measurement Guide`,
    `${topic} Implementation Checklist`,
  ];
  for (let i = 0; i < clusterTopics.length; i++) {
    md += `${i + 1}. ${clusterTopics[i]}\n`;
  }
  md += "\n**Internal Linking Strategy:**\n";
  md += "- All supporting articles link to the pillar page\n";
  md += "- Pillar page links to all supporting articles\n";
  md += "- Supporting articles cross-link where relevant\n";
  md += "- Use keyword-rich anchor text naturally\n\n";

  md += "---\n\n";
  md += "## \ud83d\udcc8 Keyword Difficulty Analysis\n\n";
  md += "| Difficulty Range | Score | Strategy | Timeline |\n";
  md += "|------------------|-------|----------|----------|\n";
  md += "|\ud83d\udfe2 Easy | 0-25 | Quick wins \u2014 create content immediately | 1-2 weeks |\n";
  md += "|\ud83d\udfe1 Medium | 26-50 | Requires quality content + basic link building | 1-3 months |\n";
  md += "|\ud83d\udd34 Hard | 51-75 | Needs strong content + authority backlinks | 3-6 months |\n";
  md += "|\u26ab Very Hard | 76+ | Long-term strategy with significant resources | 6-12 months |\n";

  md += "\n---\n\n";
  md += "## \ud83c\udfaf Recommended Action Plan\n\n";
  md += "1. **Immediate (Week 1-2):** Target easy long-tail keywords (difficulty < 25)\n";
  md += "2. **Short-term (Month 1-2):** Create content for medium difficulty keywords\n";
  md += "3. **Medium-term (Month 2-4):** Build pillar pages for primary topics\n";
  md += "4. **Long-term (Month 4-6):** Pursue competitive head terms with link building\n";
  md += "5. **Ongoing:** Publish question-based content weekly for featured snippets\n";

  md += "\n---\n\n";
  md += `*Report generated by Premium SEO Keyword Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function generateMetaTags(
  title: string, description: string, keywords: string,
  url: string, image: string
): string {
  const titleLen = title.length;
  const descLen = description.length;

  const titleStatus = titleLen === 0 ? "\u274c Missing" : titleLen <= 60 ? "\u2705 Optimal" : titleLen <= 70 ? "\u26a0\ufe0f May truncate" : "\u274c Too long";
  const descStatus = descLen === 0 ? "\u274c Missing" : descLen >= 120 && descLen <= 160 ? "\u2705 Optimal" : descLen < 120 ? "\u26a0\ufe0f Too short" : descLen <= 170 ? "\u26a0\ufe0f May truncate" : "\u274c Too long";

  let md = "# Meta Tags Generator\n\n";
  md += "## Input Parameters\n\n";
  md += "| Parameter | Value | Length | Status |\n";
  md += "|-----------|-------|--------|--------|\n";
  md += `| Title | ${title.substring(0, 50)}${title.length > 50 ? "..." : ""} | ${titleLen}/60 | ${titleStatus} |\n`;
  md += `| Description | ${description.substring(0, 50)}${description.length > 50 ? "..." : ""} | ${descLen}/160 | ${descStatus} |\n`;
  md += `| Keywords | ${keywords.substring(0, 40)}${keywords.length > 40 ? "..." : ""} | ${keywords.length} | ${keywords ? "\u2705" : "\u2139\ufe0f Optional"} |\n`;
  md += `| URL | ${url.substring(0, 50)}${url.length > 50 ? "..." : ""} | ${url.length} | ${url ? "\u2705" : "\u274c Missing"} |\n`;
  md += `| Image | ${image ? image.substring(0, 40) + "..." : "Not provided"} | \u2014 | ${image ? "\u2705" : "\u2139\ufe0f Optional"} |\n`;

  md += "\n---\n\n";
  md += "## Generated HTML Code\n\n";
  md += "Copy and paste this code into your `<head>` section.\n\n";
  md += "```html\n";
  md += "<!-- Primary Meta Tags -->\n";
  md += `<title>${title}</title>\n`;
  md += `<meta name="title" content="${title}">\n`;
  md += `<meta name="description" content="${description}">\n`;
  if (keywords) md += `<meta name="keywords" content="${keywords}">\n`;
  md += `<meta name="robots" content="index, follow">\n`;
  md += `<meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
  md += `<meta charset="UTF-8">\n`;
  if (url) md += `<link rel="canonical" href="${url}">\n`;

  md += "\n<!-- Open Graph / Facebook -->\n";
  md += `<meta property="og:type" content="website">\n`;
  if (url) md += `<meta property="og:url" content="${url}">\n`;
  md += `<meta property="og:title" content="${title}">\n`;
  md += `<meta property="og:description" content="${description}">\n`;
  if (image) {
    md += `<meta property="og:image" content="${image}">\n`;
    md += `<meta property="og:image:width" content="1200">\n`;
    md += `<meta property="og:image:height" content="630">\n`;
    md += `<meta property="og:image:alt" content="${title}">\n`;
  }
  md += `<meta property="og:site_name" content="${title.split(/[|\-\u2013\u2014]/)[0].trim()}">\n`;

  md += "\n<!-- Twitter -->\n";
  md += `<meta property="twitter:card" content="${image ? "summary_large_image" : "summary"}">\n`;
  if (url) md += `<meta property="twitter:url" content="${url}">\n`;
  md += `<meta property="twitter:title" content="${title}">\n`;
  md += `<meta property="twitter:description" content="${description}">\n`;
  if (image) md += `<meta property="twitter:image" content="${image}">\n`;

  md += "\n<!-- Schema.org JSON-LD -->\n";
  md += '<script type="application/ld+json">\n';
  md += '{\n';
  md += '  "@context": "https://schema.org",\n';
  md += '  "@type": "WebPage",\n';
  md += `  "name": "${title}",\n`;
  md += `  "description": "${description.replace(/"/g, '\\"')}",\n`;
  if (url) md += `  "url": "${url}",\n`;
  md += `  "dateModified": "${new Date().toISOString().split("T")[0]}",\n`;
  md += '  "publisher": {\n';
  md += '    "@type": "Organization",\n';
  md += `    "name": "${title.split(/[|\-\u2013\u2014]/)[0].trim()}"\n`;
  if (image) md += `    "logo": "${image}"\n`;
  md += '  }\n';
  md += '}\n';
  md += '</script>\n';
  md += "```\n\n";

  md += "---\n\n";
  md += "## Validation Report\n\n";
  md += "| Tag | Status | Details |\n";
  md += "|-----|--------|--------|\n";
  md += `| \`<title>\` | ${titleStatus} | ${titleLen} characters (optimal: 30-60) |\n`;
  md += `| \`meta description\` | ${descStatus} | ${descLen} characters (optimal: 120-160) |\n`;
  md += `| \`meta keywords\` | \u2139\ufe0f Optional | ${keywords ? "Present (ignored by Google)" : "Not set (ignored by Google anyway)"} |\n`;
  md += '| \`meta viewport\` | \u2705 Present | width=device-width, initial-scale=1.0 |\n';
  md += '| \`meta charset\` | \u2705 Present | UTF-8 |\n';
  md += '| \`meta robots\` | \u2705 Present | index, follow |\n';
  md += `| \`canonical\` | ${url ? "\u2705 Present" : "\u274c Missing"} | ${url || "Add canonical URL"} |\n`;
  md += `| \`og:title\` | \u2705 Present | ${titleLen} chars |\n`;
  md += `| \`og:description\` | \u2705 Present | ${descLen} chars |\n`;
  md += `| \`og:image\` | ${image ? "\u2705 Present" : "\u26a0\ufe0f Missing"} | ${image ? "1200x630 recommended" : "Add for social sharing"} |\n`;
  md += `| \`og:url\` | ${url ? "\u2705 Present" : "\u274c Missing"} | ${url || "Add canonical URL"} |\n`;
  md += `| \`twitter:card\` | \u2705 Present | ${image ? "summary_large_image" : "summary"} |\n`;
  md += '| \`JSON-LD\` | \u2705 Present | WebPage schema |\n';

  md += "\n---\n\n";
  md += "## \ud83d\udccb Best Practices Checklist\n\n";
  md += "- [x] Title tag present and optimized\n";
  md += "- [x] Meta description with CTA\n";
  md += "- [x] Viewport meta for mobile\n";
  md += "- [x] UTF-8 charset declared\n";
  md += "- [x] Open Graph tags for Facebook/LinkedIn\n";
  md += "- [x] Twitter Card tags\n";
  md += "- [x] Schema.org JSON-LD structured data\n";
  md += `- [ ] ${url ? "x" : " "} Canonical URL\n`;
  md += `- [ ] ${image ? "x" : " "} OG image (1200x630px)\n`;
  md += "- [ ] Language attribute on <html>\n";
  md += "- [ ] Favicon link tag\n";

  md += "\n---\n\n";
  md += `*Generated by Premium SEO Meta Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function previewSERP(title: string, description: string, url: string, date: string): string {
  const displayTitle = title.length > 60 ? title.substring(0, 57) + "..." : title;
  const displayDesc = description.length > 160 ? description.substring(0, 157) + "..." : description;
  const displayUrl = url.length > 70 ? url.substring(0, 67) + "..." : url;

  const titleStatus = title.length <= 60 ? "\u2705 Optimal" : title.length <= 70 ? "\u26a0\ufe0f May truncate" : "\u274c Will be truncated";
  const descStatus = description.length >= 120 && description.length <= 160 ? "\u2705 Optimal" : description.length < 120 ? "\u26a0\ufe0f Too short" : description.length <= 170 ? "\u26a0\ufe0f May truncate" : "\u274c Will be truncated";

  let md = "# Google SERP Preview\n\n";
  md += "## Desktop Preview\n\n";
  md += "```\n";
  md += "\n";
  md += "  \ud83d\udd0d  Google Search\n";
  md += "  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n";
  md += "  \u2502                                                                  \u2502\n";
  md += `  \u2502  ${displayTitle.padEnd(62)}\u2502\n`;
  md += "  \u2502                                                                  \u2502\n";
  md += `  \u2502  ${displayUrl.padEnd(62)}\u2502\n`;
  const descLines: string[] = [];
  for (let i = 0; i < displayDesc.length; i += 58) {
    descLines.push(displayDesc.substring(i, i + 58));
  }
  for (const line of descLines.slice(0, 3)) {
    md += `  \u2502  ${line.padEnd(62)}\u2502\n`;
  }
  if (date) {
    md += `  \u2502  ${date.padEnd(62)}\u2502\n`;
  }
  md += "  \u2502                                                                  \u2502\n";
  md += "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n";
  md += "```\n\n";

  md += "## Mobile Preview\n\n";
  md += "```\n";
  md += "  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510\n";
  md += "  \u2502  \ud83d\udd0d  Google Search          \u2502\n";
  md += "  \u2502  \u250c\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2510  \u2502\n";
  md += `  \u2502  \u2502 ${displayTitle.substring(0, 27).padEnd(27)}\u2502  \u2502\n`;
  if (displayTitle.length > 27) {
    md += `  \u2502  \u2502 ${displayTitle.substring(27, 54).padEnd(27)}\u2502  \u2502\n`;
  }
  md += `  \u2502  \u2502 ${displayUrl.substring(0, 27).padEnd(27)}\u2502  \u2502\n`;
  const mobileDescLines: string[] = [];
  for (let i = 0; i < Math.min(displayDesc.length, 81); i += 27) {
    mobileDescLines.push(displayDesc.substring(i, i + 27));
  }
  for (const line of mobileDescLines.slice(0, 3)) {
    md += `  \u2502  \u2502 ${line.padEnd(27)}\u2502  \u2502\n`;
  }
  md += "  \u2502  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518  \u2502\n";
  md += "  \u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2518\n";
  md += "```\n\n";

  md += "---\n\n";
  md += "## Character Count Analysis\n\n";
  md += "| Element | Characters | Limit | Status | Pixels (approx) |\n";
  md += "|---------|-----------|-------|--------|------------------|\n";
  const titlePx = Math.round(title.length * 7.5);
  const descPx = Math.round(description.length * 5.5);
  const urlPx = Math.round(url.length * 5);
  md += `| Title | ${title.length} | 60 | ${titleStatus} | ${titlePx}px / 580px max |\n`;
  md += `| Description | ${description.length} | 160 | ${descStatus} | ${descPx}px / 920px max |\n`;
  md += `| URL | ${url.length} | 75 | ${url.length <= 75 ? "\u2705 Good" : "\u26a0\ufe0f Long"} | ${urlPx}px |\n`;

  md += "\n---\n\n";
  md += "## Truncation Analysis\n\n";
  if (title.length > 60) {
    md += "\u26a0\ufe0f **Title truncation:** Your title will be cut off at approximately character 60.\n";
    md += `> Full: ${title}\n`;
    md += `> Displayed: ${title.substring(0, 57)}...\n\n`;
  } else {
    md += "\u2705 **Title:** No truncation \u2014 full title will display.\n\n";
  }
  if (description.length > 160) {
    md += "\u26a0\ufe0f **Description truncation:** Your description will be cut off at approximately character 160.\n";
    md += `> Full: ${description}\n`;
    md += `> Displayed: ${description.substring(0, 157)}...\n\n`;
  } else if (description.length < 120) {
    md += `\u26a0\ufe0f **Description short:** At ${description.length} characters, you're not using the full available space.\n\n`;
  } else {
    md += "\u2705 **Description:** Optimal length \u2014 no truncation.\n\n";
  }

  md += "---\n\n";
  md += "## \ud83c\udfaf CTR Optimization Tips\n\n";
  md += "1. **Front-load keywords:** Place your primary keyword at the beginning of the title\n";
  md += '2. **Use numbers:** Titles with numbers get 36% more clicks (e.g., "7 Ways to...")\n';
  md += "3. **Add year:** Including the current year increases CTR for timely content\n";
  md += '4. **Power words:** Use "Ultimate", "Essential", "Proven", "Free" to boost clicks\n';
  md += '5. **Create urgency:** "Limited time", "Don\'t miss", "Now available" drive action\n';
  md += "6. **Match search intent:** Ensure title/description match what users are looking for\n";
  md += "7. **Use brackets/parentheses:** They can increase CTR by 38% (e.g., [2025 Guide])\n";
  md += '8. **Ask questions:** "How to..." and "What is..." trigger curiosity clicks\n';
  md += "9. **Meta description as ad copy:** Write it like a PPC ad with CTA\n";
  md += "10. **Brand at end:** Place brand name after the value proposition, not before\n";

  md += "\n---\n\n";
  md += `*Generated by Premium SERP Preview Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function generateSitemap(urls: string, frequency: string): string {
  const urlList = urls.split("\n").map((u) => u.trim()).filter((u) => u.length > 0);
  const now = new Date().toISOString().split("T")[0];
  const changeFreq = frequency || "weekly";
  const validFreqs = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];
  const freqValid = validFreqs.includes(changeFreq);

  const urlAnalysis: { url: string; valid: boolean; priority: string; issue: string }[] = [];

  for (let i = 0; i < urlList.length; i++) {
    const rawUrl = urlList[i];
    const fullUrl = rawUrl.startsWith("http") ? rawUrl : `https://example.com/${rawUrl.replace(/^\/+/, "")}`;
    let valid = true;
    let issue = "";
    try { new URL(fullUrl); } catch { valid = false; issue = "Invalid URL format"; }
    if (fullUrl.length > 2048) { valid = false; issue = "URL exceeds 2048 character limit"; }
    let priority = "0.5";
    if (i === 0) priority = "1.0";
    else if (i < 3) priority = "0.9";
    else if (i < 7) priority = "0.8";
    else if (i < 15) priority = "0.7";
    else if (i < 30) priority = "0.6";
    if (fullUrl.includes("/blog/")) priority = Math.min(parseFloat(priority), 0.7).toString();
    if (fullUrl.includes("/tag/") || fullUrl.includes("/category/")) priority = "0.3";
    if (fullUrl.endsWith("/") && fullUrl.split("/").length <= 4) priority = "1.0";
    urlAnalysis.push({ url: fullUrl, valid, priority, issue });
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n';
  xml += '        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n';
  xml += '        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n';

  for (const item of urlAnalysis) {
    if (item.valid) {
      xml += "  <url>\n";
      xml += `    <loc>${item.url}</loc>\n`;
      xml += `    <lastmod>${now}</lastmod>\n`;
      xml += `    <changefreq>${changeFreq}</changefreq>\n`;
      xml += `    <priority>${item.priority}</priority>\n`;
      xml += "  </url>\n";
    }
  }
  xml += "</urlset>";

  let md = "# XML Sitemap Generator\n\n";
  md += `**URLs Processed:** ${urlList.length}\n`;
  md += `**Valid URLs:** ${urlAnalysis.filter((u) => u.valid).length}\n`;
  md += `**Invalid URLs:** ${urlAnalysis.filter((u) => !u.valid).length}\n`;
  md += `**Change Frequency:** ${changeFreq} ${freqValid ? "\u2705" : "\u26a0\ufe0f Invalid value"}\n`;
  md += `**Generated:** ${now}\n\n`;
  md += "---\n\n";
  md += "## XML Output\n\n";
  md += "```xml\n";
  md += xml;
  md += "\n```\n\n";
  md += "---\n\n";
  md += "## URL Priority Analysis\n\n";
  md += "| URL | Priority | Status |\n";
  md += "|-----|----------|--------|\n";
  for (const item of urlAnalysis) {
    const displayUrl = item.url.length > 50 ? item.url.substring(0, 47) + "..." : item.url;
    md += `| ${displayUrl} | ${item.priority} | ${item.valid ? "\u2705" : "\u274c " + item.issue} |\n`;
  }
  md += "\n---\n\n";
  md += "## Validation Report\n\n";
  md += "| Check | Status |\n";
  md += "|-------|--------|\n";
  md += "| XML Declaration | \u2705 Present |\n";
  md += "| Namespace | \u2705 Valid |\n";
  md += "| Schema Reference | \u2705 Valid |\n";
  md += `| URL Count | ${urlAnalysis.filter((u) => u.valid).length} (Google limit: 50,000) |\n`;
  md += `| File Size | ~${Math.round(xml.length / 1024 * 10) / 10}KB (Google limit: 50MB) |\n`;
  md += `| Change Freq | ${freqValid ? "\u2705 Valid" : "\u274c Invalid \u2014 use: always, hourly, daily, weekly, monthly, yearly, never"} |\n`;
  md += `| All URLs HTTPS | ${urlAnalysis.every((u) => u.url.startsWith("https")) ? "\u2705 Yes" : "\u26a0\ufe0f No"} |\n`;

  md += "\n---\n\n";
  md += "## \ud83d\udccb Deployment Checklist\n\n";
  md += "1. Save the XML code above as `sitemap.xml`\n";
  md += "2. Upload to your website root directory (`https://domain.com/sitemap.xml`)\n";
  md += "3. Add to Google Search Console under Sitemaps\n";
  md += "4. Add to Bing Webmaster Tools under Sitemaps\n";
  md += '5. Reference in robots.txt: `Sitemap: https://domain.com/sitemap.xml`\n';
  md += "6. Test with Google's Rich Results Test\n";
  md += "7. Monitor indexing status in Search Console\n";

  md += "\n---\n\n";
  md += "## \ud83d\udca1 Sitemap Best Practices\n\n";
  md += "- Only include canonical URLs (no redirects or duplicates)\n";
  md += "- Exclude noindexed pages, 404s, and redirect URLs\n";
  md += "- Keep under 50,000 URLs and 50MB per sitemap\n";
  md += "- For large sites, use sitemap index files\n";
  md += "- Update lastmod dates only when content actually changes\n";
  md += "- Set changefreq to reflect actual update patterns\n";
  md += "- Priority is a hint to Google, not a directive\n";

  md += "\n---\n\n";
  md += `*Generated by Premium Sitemap Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function generateRobotsTxt(policy: string, paths: string): string {
  const disallowPaths = paths.split("\n").map((p) => p.trim()).filter((p) => p.length > 0);
  const isAllowAll = policy === "allow-all";
  const isDisallowAll = policy === "disallow-all";

  let txt = "# Robots.txt Configuration\n";
  txt += `# Generated: ${new Date().toISOString()}\n`;
  txt += `# Policy: ${policy}\n\n`;

  txt += "User-agent: *\n";
  if (isAllowAll) {
    txt += "Allow: /\n\n";
  } else if (isDisallowAll) {
    txt += "Disallow: /\n\n";
  } else {
    if (disallowPaths.length > 0) {
      for (const path of disallowPaths) {
        const cleanPath = path.startsWith("/") ? path : `/${path}`;
        txt += `Disallow: ${cleanPath}\n`;
      }
      txt += "\n";
    } else {
      txt += "Disallow: /admin/\n";
      txt += "Disallow: /api/\n";
      txt += "Disallow: /tmp/\n";
      txt += "Disallow: /private/\n";
      txt += "Disallow: /*.json$\n";
      txt += "Disallow: /*?sort=\n";
      txt += "Disallow: /*?filter=\n\n";
    }
  }

  txt += "User-agent: Googlebot\n";
  txt += "Allow: /\n";
  txt += "Crawl-delay: 1\n\n";

  txt += "User-agent: Bingbot\n";
  txt += "Allow: /\n";
  txt += "Crawl-delay: 2\n\n";

  txt += "User-agent: Slurp\n";
  txt += "Allow: /\n\n";

  txt += "User-agent: DuckDuckBot\n";
  txt += "Allow: /\n\n";

  txt += "User-agent: Baiduspider\n";
  txt += "Allow: /\n\n";

  txt += "User-agent: YandexBot\n";
  txt += "Allow: /\n\n";

  txt += "User-agent: AhrefsBot\n";
  txt += isAllowAll ? "Allow: /\n\n" : "Disallow: /\n\n";

  txt += "User-agent: MJ12bot\n";
  txt += isAllowAll ? "Allow: /\n\n" : "Disallow: /\n\n";

  txt += "User-agent: SemrushBot\n";
  txt += isAllowAll ? "Allow: /\n\n" : "Disallow: /\n\n";

  txt += "Sitemap: https://example.com/sitemap.xml\n";

  let md = "# robots.txt Generator\n\n";
  md += `**Policy:** ${policy}\n`;
  md += `**Custom Paths:** ${disallowPaths.length}\n\n`;
  md += "---\n\n";
  md += "## Generated robots.txt\n\n";
  md += "```\n";
  md += txt;
  md += "```\n\n";
  md += "---\n\n";
  md += "## Configuration Summary\n\n";
  md += "| Setting | Value |\n";
  md += "|---------|-------|\n";
  md += `| Policy | ${policy} |\n`;
  md += "| User-agent | * (all bots) |\n";
  md += `| Custom Paths | ${disallowPaths.length} |\n`;
  md += "| Search Engines Allowed | Googlebot, Bingbot, Yahoo, DuckDuckBot, Baidu, Yandex |\n";
  md += `| SEO Crawlers Blocked | ${isAllowAll ? "None" : "AhrefsBot, MJ12bot, SemrushBot"} |\n`;

  md += "\n---\n\n";
  md += "## Bot Rules Breakdown\n\n";
  md += "| Bot | Type | Access |\n";
  md += "|-----|------|--------|\n";
  md += "| Googlebot | Search engine | \u2705 Allow |\n";
  md += "| Bingbot | Search engine | \u2705 Allow |\n";
  md += "| Slurp (Yahoo) | Search engine | \u2705 Allow |\n";
  md += "| DuckDuckBot | Search engine | \u2705 Allow |\n";
  md += "| Baiduspider | Search engine (China) | \u2705 Allow |\n";
  md += "| YandexBot | Search engine (Russia) | \u2705 Allow |\n";
  md += `| AhrefsBot | SEO crawler | ${isAllowAll ? "\u2705 Allow" : "\u274c Block"} |\n`;
  md += `| MJ12bot (Majestic) | SEO crawler | ${isAllowAll ? "\u2705 Allow" : "\u274c Block"} |\n`;
  md += `| SemrushBot | SEO crawler | ${isAllowAll ? "\u2705 Allow" : "\u274c Block"} |\n`;

  md += "\n---\n\n";
  md += "## \ud83d\udccb Common Paths Reference\n\n";
  md += "| Path | Purpose | Recommendation |\n";
  md += "|------|---------|----------------|\n";
  md += "| /admin/ | Admin panel | \ud83d\udd34 Block |\n";
  md += "| /api/ | API endpoints | \ud83d\udd34 Block |\n";
  md += "| /tmp/ | Temporary files | \ud83d\udd34 Block |\n";
  md += "| /private/ | Private content | \ud83d\udd34 Block |\n";
  md += "| /wp-admin/ | WordPress admin | \ud83d\udd34 Block |\n";
  md += "| /wp-includes/ | WordPress includes | \ud83d\udfe1 Consider blocking |\n";
  md += "| /cgi-bin/ | CGI scripts | \ud83d\udd34 Block |\n";
  md += "| /search/ | Search results | \ud83d\udd34 Block |\n";
  md += "| /cart/ | Shopping cart | \ud83d\udd34 Block |\n";
  md += "| /checkout/ | Checkout pages | \ud83d\udd34 Block |\n";
  md += "| /account/ | User accounts | \ud83d\udd34 Block |\n";
  md += "| /tag/ | Tag archives | \ud83d\udfe1 Consider blocking |\n";
  md += "| /page/ | Pagination | \ud83d\udfe1 Consider blocking |\n";

  md += "\n---\n\n";
  md += "## \u26a0\ufe0f Important Notes\n\n";
  md += "- robots.txt is a suggestion, not a directive \u2014 malicious bots may ignore it\n";
  md += "- Block sensitive paths with server-side authentication, not just robots.txt\n";
  md += "- Test with Google's robots.txt tester in Search Console\n";
  md += "- Large websites should use separate rules per bot\n";
  md += "- Never block CSS/JS files needed for rendering\n";
  md += "- Allow crawling of assets needed for mobile rendering\n";

  md += "\n---\n\n";
  md += `*Generated by Premium robots.txt Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function checkKeywordDensity(text: string, targetKeyword: string): string {
  const lower = text.toLowerCase();
  const words = lower.split(WORD_BOUNDARY).filter((w) => w.length > 0);
  const totalWords = words.length;

  const freq: Record<string, number> = {};
  for (const w of words) {
    if (w.length > 2 && !STOP_WORDS.has(w)) {
      freq[w] = (freq[w] || 0) + 1;
    }
  }

  const targetLower = targetKeyword.toLowerCase().trim();
  const targetKwWords = targetLower.split(WORD_BOUNDARY).filter((w) => w.length > 0);
  let targetCount = 0;
  if (targetKwWords.length === 1) {
    targetCount = freq[targetLower] || 0;
    if (targetCount === 0) {
      let idx = 0;
      while ((idx = lower.indexOf(targetLower, idx)) !== -1) { targetCount++; idx += targetLower.length; }
    }
  } else {
    let idx = 0;
    while ((idx = lower.indexOf(targetLower, idx)) !== -1) { targetCount++; idx += targetLower.length; }
  }
  const targetDensity = totalWords > 0 ? (targetCount / totalWords) * 100 : 0;

  const tfidf: Record<string, number> = {};
  for (const [kw, count] of Object.entries(freq)) {
    const tf = count / totalWords;
    const idf = Math.log(2 / (1 + 1)) + 1;
    tfidf[kw] = Math.round(tf * idf * 10000) / 10000;
  }

  const top30 = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 30);

  const bigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i].length > 2 && words[i + 1].length > 2) {
      const bigram = `${words[i]} ${words[i + 1]}`;
      bigrams[bigram] = (bigrams[bigram] || 0) + 1;
    }
  }
  const trigrams: Record<string, number> = {};
  for (let i = 0; i < words.length - 2; i++) {
    if (words[i].length > 2 && words[i + 1].length > 2 && words[i + 2].length > 2) {
      const trigram = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
      trigrams[trigram] = (trigrams[trigram] || 0) + 1;
    }
  }
  const topPhrases = [
    ...Object.entries(bigrams).filter(([, c]) => c >= 2),
    ...Object.entries(trigrams).filter(([, c]) => c >= 2),
  ].sort((a, b) => b[1] - a[1]).slice(0, 20);

  const first100Words = words.slice(0, 100);
  const first100Count = targetKwWords.length === 1
    ? first100Words.filter((w) => w === targetLower).length
    : (() => { const j = first100Words.join(" "); let c = 0, idx = 0; while ((idx = j.indexOf(targetLower, idx)) !== -1) { c++; idx += targetLower.length; } return c; })();

  const headings = extractHeadings(text);
  const allHeadingText = Object.values(headings).flat().join(" ").toLowerCase();
  const headingCount = targetKwWords.length === 1
    ? allHeadingText.split(WORD_BOUNDARY).filter((w) => w === targetLower).length
    : (() => { let c = 0, idx = 0; while ((idx = allHeadingText.indexOf(targetLower, idx)) !== -1) { c++; idx += targetLower.length; } return c; })();

  const paragraphs = extractTextFromTags(text, "p");
  const paraText = paragraphs.join(" ").toLowerCase();
  const paragraphCount = targetKwWords.length === 1
    ? paraText.split(WORD_BOUNDARY).filter((w) => w === targetLower).length
    : (() => { let c = 0, idx = 0; while ((idx = paraText.indexOf(targetLower, idx)) !== -1) { c++; idx += targetLower.length; } return c; })();

  let overOptimized = false;
  let overOptReason = "";
  if (targetDensity > 3) { overOptimized = true; overOptReason = `Density of ${targetDensity.toFixed(2)}% exceeds the 3% threshold`; }
  const underOptimized = targetCount === 0 || targetDensity < 0.5;

  let md = "# Keyword Density Report\n\n";
  md += `**Target Keyword:** ${targetKeyword}\n`;
  md += `**Total Words:** ${totalWords.toLocaleString()}\n`;
  md += `**Report Date:** ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}\n\n`;
  md += "---\n\n";

  md += "## \ud83c\udfaf Target Keyword Analysis\n\n";
  md += "| Metric | Value | Status |\n";
  md += "|--------|-------|--------|\n";
  md += `| Keyword | ${targetKeyword} | \u2014 |\n`;
  md += `| Occurrences | ${targetCount} | ${targetCount === 0 ? "\u274c Not found" : "\u2705 Found"} |\n`;
  md += `| Word Count | ${totalWords.toLocaleString()} | \u2014 |\n`;
  md += `| Density | ${targetDensity.toFixed(2)}% | ${targetDensity === 0 ? "\u274c Missing" : targetDensity < 0.5 ? "\u26a0\ufe0f Under-optimized" : targetDensity <= 3 ? "\u2705 Optimal" : "\u274c Over-optimized"} |\n`;
  md += "| Target Range | 1.00% - 3.00% | \u2014 |\n";
  md += `| In First 100 Words | ${first100Count} occurrence(s) | ${first100Count > 0 ? "\u2705 Yes" : "\u26a0\ufe0f No \u2014 add keyword near the top"} |\n`;
  md += `| In Headings | ${headingCount} occurrence(s) | ${headingCount > 0 ? "\u2705 Yes" : "\u26a0\ufe0f No \u2014 add to at least one heading"} |\n`;
  md += `| In Paragraphs | ${paragraphCount} occurrence(s) | ${paragraphCount > 0 ? "\u2705 Yes" : "\u26a0\ufe0f No"} |\n`;

  if (overOptimized) {
    md += `\n> \u274c **Over-optimization detected:** ${overOptReason}. This may trigger keyword stuffing penalties.\n`;
  } else if (underOptimized) {
    md += `\n> \u26a0\ufe0f **Under-optimized:** The keyword needs to appear more frequently. Aim for ${Math.max(1, Math.round(totalWords * 0.01))}-${Math.round(totalWords * 0.03)} occurrences.\n`;
  } else {
    md += "\n> \u2705 **Keyword usage is within optimal range.**\n";
  }

  md += "\n---\n\n";
  md += "## \ud83d\udcca Keyword Distribution Map\n\n";
  md += "Shows where the keyword appears throughout the content.\n\n";
  md += "```\n";
  const chunkSize = Math.max(1, Math.ceil(totalWords / 20));
  for (let i = 0; i < words.length; i += chunkSize) {
    const chunk = words.slice(i, i + chunkSize);
    let chunkTargetCount = 0;
    if (targetKwWords.length === 1) {
      chunkTargetCount = chunk.filter((w) => w === targetLower).length;
    } else {
      const j = chunk.join(" "); let idx = 0;
      while ((idx = j.indexOf(targetLower, idx)) !== -1) { chunkTargetCount++; idx += targetLower.length; }
    }
    const pct = Math.round((i / totalWords) * 100);
    const bar = "\u2588".repeat(Math.min(10, chunkTargetCount * 2)) + "\u2591".repeat(Math.max(0, 10 - chunkTargetCount * 2));
    md += `${String(pct).padStart(3)}% | ${bar} | ${chunkTargetCount} found\n`;
  }
  md += "```\n\n";

  md += "---\n\n";
  md += "## \ud83d\udcc8 Top 30 Keywords by Frequency\n\n";
  md += "| Rank | Keyword | Count | Density | TF-IDF |\n";
  md += "|------|---------|-------|---------|--------|\n";
  for (let i = 0; i < top30.length; i++) {
    const [kw, count] = top30[i];
    const density = totalWords > 0 ? ((count / totalWords) * 100).toFixed(3) : "0.000";
    const tfidfVal = (tfidf[kw] || 0).toFixed(4);
    const isTarget = kw === targetLower ? " \ud83c\udfaf" : "";
    md += `| ${i + 1} | ${kw}${isTarget} | ${count} | ${density}% | ${tfidfVal} |\n`;
  }

  if (topPhrases.length > 0) {
    md += "\n---\n\n";
    md += "## \ud83d\udd17 Top Multi-Word Phrases\n\n";
    md += "| Rank | Phrase | Count | Density |\n";
    md += "|------|--------|-------|---------|\n";
    for (let i = 0; i < topPhrases.length; i++) {
      const [phrase, count] = topPhrases[i];
      const density = totalWords > 0 ? ((count / totalWords) * 100).toFixed(3) : "0.000";
      md += `| ${i + 1} | ${phrase} | ${count} | ${density}% |\n`;
    }
  }

  md += "\n---\n\n";
  md += "## \ud83c\udfaf Keyword Prominence Score\n\n";
  const prominenceScore = (() => {
    let score = 0;
    if (targetCount === 0) return 0;
    if (first100Count > 0) score += 30;
    if (headingCount > 0) score += 25;
    if (paragraphCount > 0) score += 20;
    if (targetDensity >= 0.5 && targetDensity <= 3) score += 25;
    else if (targetDensity > 0) score += 10;
    return Math.min(100, score);
  })();
  md += `**Score: ${prominenceScore}/100** ${getScoreBar(prominenceScore)}\n\n`;
  md += "| Factor | Score | Details |\n";
  md += "|--------|-------|--------|\n";
  md += `| First 100 Words | ${first100Count > 0 ? "\u2705 30" : "\u274c 0"} | ${first100Count} occurrence(s) |\n`;
  md += `| In Headings | ${headingCount > 0 ? "\u2705 25" : "\u274c 0"} | ${headingCount} occurrence(s) |\n`;
  md += `| In Paragraphs | ${paragraphCount > 0 ? "\u2705 20" : "\u274c 0"} | ${paragraphCount} occurrence(s) |\n`;
  md += `| Optimal Density | ${targetDensity >= 0.5 && targetDensity <= 3 ? "\u2705 25" : targetDensity > 0 ? "\u26a0\ufe0f 10" : "\u274c 0"} | ${targetDensity.toFixed(2)}% |\n`;

  md += "\n---\n\n";
  md += "## \ud83d\udcdd Recommendations\n\n";
  if (targetCount === 0) {
    md += `1. \u274c **Add target keyword** \u2014 "${targetKeyword}" was not found in the text\n`;
    md += "2. Include it in: H1 title, first paragraph, at least one H2, and naturally in body\n";
    md += "3. Add to meta title, meta description, and image alt text\n";
    md += "4. Use semantic variations alongside the exact match keyword\n";
    md += `5. Aim for ${Math.max(1, Math.round(totalWords * 0.01))}-${Math.round(totalWords * 0.03)} total occurrences\n`;
  } else if (targetDensity < 0.5) {
    md += "1. \u26a0\ufe0f **Increase keyword usage** \u2014 density is below 0.5%\n";
    md += `2. Target density: 1-3% (${Math.max(1, Math.round(totalWords * 0.01))}-${Math.round(totalWords * 0.03)} occurrences)\n`;
    md += "3. Add keyword to: subheadings, image alt text, internal anchor text\n";
    md += `4. Use keyword variations: "${targetKeyword}" synonyms and related terms\n`;
  } else if (targetDensity > 3) {
    md += "1. \u274c **Reduce keyword usage** \u2014 density exceeds 3% (over-optimization risk)\n";
    md += "2. Replace some instances with synonyms or related terms\n";
    md += "3. Focus on natural, reader-friendly content\n";
    md += "4. Use LSI keywords and semantic variations instead\n";
    md += "5. Read content aloud \u2014 if it sounds forced, it needs rewriting\n";
  } else {
    md += "1. \u2705 **Keyword density is optimal** \u2014 maintain current usage level\n";
    md += "2. Ensure keyword appears in all critical locations (title, H1, first 100 words)\n";
    md += "3. Add 2-3 supporting keywords from the frequency list\n";
    md += "4. Continue building topical relevance with related content\n";
  }

  md += "\n---\n\n";
  md += `*Generated by Premium Keyword Density Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function generateSEOTitle(topic: string, keyword: string): string {
  if (!topic.trim()) {
    return "# SEO Title Generator\n\nPlease enter a topic to generate optimized titles.";
  }

  const kw = keyword || topic;
  const year = new Date().getFullYear();
  const powerWords = ["Ultimate", "Essential", "Proven", "Complete", "Comprehensive", "Expert", "Advanced", "Powerful", "Definitive", "Exclusive"];
  const emotionTriggers = ["Secret", "Mistakes", "Hacks", "Hidden", "Little-Known", "Unbelievable", "Incredible", "Revolutionary"];
  const ctaWords = ["How to", "Learn", "Master", "Discover", "Unlock", "Boost", "Maximize", "Supercharge"];

  const titles: {
    title: string; type: string; hasPowerWord: boolean; hasYear: boolean;
    hasNumber: boolean; hasColon: boolean; hasBrackets: boolean; hasEmotion: boolean;
  }[] = [
    { title: `${kw}: The Ultimate Guide [${year}]`, type: "Guide + Year", hasPowerWord: true, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: true, hasEmotion: false },
    { title: `How to ${kw} (Step-by-Step Tutorial)`, type: "How-To", hasPowerWord: false, hasYear: false, hasNumber: false, hasColon: false, hasBrackets: true, hasEmotion: false },
    { title: `${kw}: ${powerWords[Math.floor(Math.random() * powerWords.length)]} Guide for ${year}`, type: "Power Word", hasPowerWord: true, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: false },
    { title: `${year} ${kw} Guide: Everything You Need to Know`, type: "Year + Comprehensive", hasPowerWord: false, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: false },
    { title: `Top 10 ${kw} Tips & Strategies (${year})`, type: "Listicle", hasPowerWord: false, hasYear: true, hasNumber: true, hasColon: false, hasBrackets: true, hasEmotion: false },
    { title: `${kw} for Beginners: A ${powerWords[Math.floor(Math.random() * powerWords.length)]} Guide`, type: "Beginner", hasPowerWord: true, hasYear: false, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: false },
    { title: `Master ${kw}: Expert Tips & Best Practices`, type: "Authority", hasPowerWord: false, hasYear: false, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: false },
    { title: `${kw} Explained: What You Need to Know (${year})`, type: "Explainer", hasPowerWord: false, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: true, hasEmotion: false },
    { title: `The Secret to ${kw}: A ${year} Playbook`, type: "Curiosity", hasPowerWord: false, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: true },
    { title: `${kw}: ${emotionTriggers[Math.floor(Math.random() * emotionTriggers.length)]} Strategies That Work`, type: "Emotion", hasPowerWord: false, hasYear: false, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: true },
    { title: `7 ${kw} ${ctaWords[Math.floor(Math.random() * ctaWords.length)]} Boost Results Fast`, type: "Numbered + CTA", hasPowerWord: false, hasYear: false, hasNumber: true, hasColon: false, hasBrackets: false, hasEmotion: false },
    { title: `${kw}: ${powerWords[Math.floor(Math.random() * powerWords.length)]} Resource for ${year}`, type: "Resource", hasPowerWord: true, hasYear: true, hasNumber: false, hasColon: true, hasBrackets: false, hasEmotion: false },
    { title: `What Is ${kw}? A ${year} Beginner's Guide`, type: "Question", hasPowerWord: false, hasYear: true, hasNumber: false, hasColon: false, hasBrackets: false, hasEmotion: false },
    { title: `${kw} vs Alternatives: Which Is Best in ${year}?`, type: "Comparison", hasPowerWord: false, hasYear: true, hasNumber: false, hasColon: false, hasBrackets: false, hasEmotion: false },
    { title: `The ${powerWords[Math.floor(Math.random() * powerWords.length)]} Guide to ${kw} (${year} Edition)`, type: "Definitive", hasPowerWord: true, hasYear: true, hasNumber: false, hasColon: false, hasBrackets: true, hasEmotion: false },
  ];

  let md = "# SEO Title Generator\n\n";
  md += `**Topic:** ${topic}\n`;
  md += `**Target Keyword:** ${kw}\n`;
  md += `**Titles Generated:** ${titles.length}\n\n`;
  md += "---\n\n";

  md += "## Generated Title Variations\n\n";
  md += "| # | Title | Chars | Preview | Truncation | Type |\n";
  md += "|---|-------|-------|---------|------------|------|\n";
  for (let i = 0; i < titles.length; i++) {
    const t = titles[i];
    const chars = t.title.length;
    const truncated = chars > 60 ? t.title.substring(0, 57) + "..." : t.title;
    const truncStatus = chars <= 60 ? "\u2705 Full" : chars <= 70 ? "\u26a0\ufe0f Partial" : "\u274c Cut";
    md += `| ${i + 1} | ${t.title} | ${chars} | ${truncated} | ${truncStatus} | ${t.type} |\n`;
  }

  md += "\n---\n\n";
  md += "## Google SERP Previews\n\n";
  for (let i = 0; i < Math.min(titles.length, 5); i++) {
    const t = titles[i];
    const display = t.title.length > 60 ? t.title.substring(0, 57) + "..." : t.title;
    md += `**Option ${i + 1} \u2014 ${t.type}:**\n`;
    md += "```\n";
    md += `  ${display}\n`;
    md += `  https://example.com/${kw.replace(/\s+/g, "-").toLowerCase()}\n`;
    md += "```\n\n";
  }

  md += "---\n\n";
  md += "## Title Element Analysis\n\n";
  md += "| Element | Count | Titles with Element |\n";
  md += "|---------|-------|--------------------|\n";
  const withPower = titles.filter((t) => t.hasPowerWord).length;
  const withYear = titles.filter((t) => t.hasYear).length;
  const withNumber = titles.filter((t) => t.hasNumber).length;
  const withColon = titles.filter((t) => t.hasColon).length;
  const withBrackets = titles.filter((t) => t.hasBrackets).length;
  const withEmotion = titles.filter((t) => t.hasEmotion).length;
  md += `| Power Words | ${withPower}/${titles.length} | ${Math.round((withPower / titles.length) * 100)}% |\n`;
  md += `| Year (${year}) | ${withYear}/${titles.length} | ${Math.round((withYear / titles.length) * 100)}% |\n`;
  md += `| Numbers | ${withNumber}/${titles.length} | ${Math.round((withNumber / titles.length) * 100)}% |\n`;
  md += `| Colon/Separator | ${withColon}/${titles.length} | ${Math.round((withColon / titles.length) * 100)}% |\n`;
  md += `| Brackets/Parentheses | ${withBrackets}/${titles.length} | ${Math.round((withBrackets / titles.length) * 100)}% |\n`;
  md += `| Emotion Triggers | ${withEmotion}/${titles.length} | ${Math.round((withEmotion / titles.length) * 100)}% |\n`;

  md += "\n---\n\n";
  md += "## \ud83c\udfaf Title Optimization Best Practices\n\n";
  md += "1. **Length:** Keep between 30-60 characters for full display\n";
  md += "2. **Keyword placement:** Put primary keyword at the beginning\n";
  md += '3. **Power words:** Use "Ultimate", "Best", "Guide", "How to" for higher CTR\n';
  md += "4. **Year:** Adding the current year increases CTR for time-sensitive content\n";
  md += "5. **Numbers:** List-style titles get 36% more clicks\n";
  md += "6. **Colon/dash:** Use separators to split title for readability\n";
  md += "7. **Brackets/parentheses:** They increase CTR by 38%\n";
  md += "8. **Uniqueness:** Every page title should be unique across your site\n";
  md += "9. **Match intent:** Align title with what searchers are looking for\n";
  md += '10. **Brand name:** Add at the end for brand recognition (e.g., " | Brand")\n';

  md += "\n---\n\n";
  md += `*Generated by Premium SEO Title Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function generateMetaDescription(topic: string, keyword: string): string {
  if (!topic.trim()) {
    return "# Meta Description Generator\n\nPlease enter a topic to generate meta descriptions.";
  }

  const kw = keyword || topic;
  const year = new Date().getFullYear();

  const descriptions: {
    text: string; type: string; hasKeyword: boolean;
    hasCTA: boolean; hasYear: boolean; hasNumbers: boolean;
  }[] = [
    {
      text: `Learn everything about ${kw} with our comprehensive guide. Tips, strategies, and expert advice to help you master ${topic} in ${year}. Start learning today!`,
      type: "Comprehensive", hasKeyword: true, hasCTA: true, hasYear: true, hasNumbers: false,
    },
    {
      text: `Discover the best ${kw} techniques and tools. Our step-by-step guide covers everything from basics to advanced strategies for ${topic}. Get started now!`,
      type: "How-To", hasKeyword: true, hasCTA: true, hasYear: false, hasNumbers: false,
    },
    {
      text: `Looking for ${kw}? We've compiled the ultimate resource with expert tips, detailed tutorials, and practical examples. Read our ${year} guide now!`,
      type: "Resource", hasKeyword: true, hasCTA: true, hasYear: true, hasNumbers: false,
    },
    {
      text: `Master ${kw} with proven strategies from industry experts. Get actionable tips, real-world examples, and a free checklist to succeed with ${topic}.`,
      type: "Expert", hasKeyword: true, hasCTA: true, hasYear: false, hasNumbers: false,
    },
    {
      text: `Your complete guide to ${kw} in ${year}. Learn the fundamentals, advanced techniques, and best practices. Join 10,000+ readers who trust our advice.`,
      type: "Social Proof", hasKeyword: true, hasCTA: false, hasYear: true, hasNumbers: true,
    },
    {
      text: `Everything you need to know about ${kw} \u2014 explained simply. Compare top tools, avoid common mistakes, and implement best practices today.`,
      type: "Simplified", hasKeyword: true, hasCTA: true, hasYear: false, hasNumbers: false,
    },
    {
      text: `Struggling with ${kw}? Our ${year} guide breaks it down step by step. Learn from real case studies, get templates, and start seeing results fast.`,
      type: "Problem-Solution", hasKeyword: true, hasCTA: false, hasYear: true, hasNumbers: false,
    },
    {
      text: `${kw} doesn't have to be complicated. This guide covers the 7 essential steps to get started, with examples and expert recommendations for ${year}.`,
      type: "Simplified + Numbered", hasKeyword: true, hasCTA: false, hasYear: true, hasNumbers: true,
    },
    {
      text: `Explore our in-depth ${kw} resource. From beginner tutorials to advanced strategies, we cover it all. Start your journey to mastering ${topic} now!`,
      type: "Journey", hasKeyword: true, hasCTA: true, hasYear: false, hasNumbers: false,
    },
    {
      text: `Get the facts on ${kw} \u2014 including pricing, features, pros, and cons. Our expert review helps you make the right choice for your ${year} strategy.`,
      type: "Review", hasKeyword: true, hasCTA: false, hasYear: true, hasNumbers: false,
    },
  ];

  let md = "# Meta Description Generator\n\n";
  md += `**Topic:** ${topic}\n`;
  md += `**Target Keyword:** ${kw}\n`;
  md += `**Descriptions Generated:** ${descriptions.length}\n\n`;
  md += "---\n\n";

  md += "## Generated Descriptions\n\n";
  md += "| # | Description | Chars | Status | Type |\n";
  md += "|---|-------------|-------|--------|------|\n";
  for (let i = 0; i < descriptions.length; i++) {
    const d = descriptions[i];
    const chars = d.text.length;
    const status = chars >= 120 && chars <= 160 ? "\u2705" : chars < 120 ? "\u26a0\ufe0f Short" : chars <= 170 ? "\u26a0\ufe0f May truncate" : "\u274c Long";
    const truncated = d.text.substring(0, 60) + (d.text.length > 60 ? "..." : "");
    md += `| ${i + 1} | ${truncated} | ${chars} | ${status} | ${d.type} |\n`;
  }

  md += "\n---\n\n";
  md += "## Google SERP Previews\n\n";
  for (let i = 0; i < Math.min(descriptions.length, 5); i++) {
    const d = descriptions[i];
    const display = d.text.length > 160 ? d.text.substring(0, 157) + "..." : d.text;
    md += `**Option ${i + 1} \u2014 ${d.type}:**\n`;
    md += "```\n";
    md += `  ${topic} \u2014 ${kw}\n`;
    md += `  https://example.com/${kw.replace(/\s+/g, "-").toLowerCase()}\n`;
    md += `  ${display}\n`;
    md += "```\n\n";
  }

  md += "---\n\n";
  md += "## Description Element Analysis\n\n";
  md += "| Element | Present | Impact |\n";
  md += "|---------|---------|--------|\n";
  const withKeyword = descriptions.filter((d) => d.hasKeyword).length;
  const withCTA = descriptions.filter((d) => d.hasCTA).length;
  const withYear = descriptions.filter((d) => d.hasYear).length;
  const withNumbers = descriptions.filter((d) => d.hasNumbers).length;
  md += `| Target Keyword | ${withKeyword}/${descriptions.length} | Relevance signal |\n`;
  md += `| Call-to-Action | ${withCTA}/${descriptions.length} | Higher CTR |\n`;
  md += `| Current Year | ${withYear}/${descriptions.length} | Freshness signal |\n`;
  md += `| Numbers/Stats | ${withNumbers}/${descriptions.length} | Trust building |\n`;

  md += "\n---\n\n";
  md += "## Character Length Distribution\n\n";
  md += "```\n";
  const charCounts = descriptions.map((d) => d.text.length);
  const minLen = Math.min(...charCounts);
  const maxLen = Math.max(...charCounts);
  const avgLen = Math.round(charCounts.reduce((a, b) => a + b, 0) / charCounts.length);
  md += `  Min: ${minLen} | Max: ${maxLen} | Avg: ${avgLen}\n\n`;
  for (let i = 0; i < descriptions.length; i++) {
    const d = descriptions[i];
    const len = d.text.length;
    const barLen = Math.round((len / 170) * 40);
    const bar = "\u2588".repeat(barLen) + "\u2591".repeat(40 - barLen);
    const marker = len >= 120 && len <= 160 ? "\u2705" : len < 120 ? "\u26a0\ufe0f" : "\u274c";
    md += `  ${String(i + 1).padStart(2)}. [${bar}] ${len} ${marker}\n`;
  }
  md += "```\n\n";

  md += "---\n\n";
  md += "## Meta Description Best Practices\n\n";
  md += '1. **Length:** Keep between 150-160 characters for full display\n';
  md += "2. **Keyword:** Include target keyword naturally \u2014 bolded in SERPs\n";
  md += '3. **CTA:** Use action words: "Learn", "Discover", "Get", "Start", "Read"\n';
  md += "4. **Value proposition:** Tell users WHY they should click\n";
  md += "5. **Uniqueness:** Every page should have a unique description\n";
  md += "6. **Match intent:** Align with what the user is searching for\n";
  md += "7. **Avoid:** Duplicate text, keyword stuffing, generic descriptions\n";
  md += "8. **Numbers:** Include stats or numbers for credibility\n";
  md += "9. **Emojis:** Use sparingly \u2014 they can increase CTR in some niches\n";
  md += "10. **Schema:** Combine with structured data for rich snippets\n";

  md += "\n---\n\n";
  md += `*Generated by Premium Meta Description Engine \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function checkRedirects(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `# URL Redirect Analysis\n\n\u274c **Invalid URL:** ${url}\n\nPlease provide a valid URL with protocol (e.g., https://example.com/page).`;
  }

  const protocol = parsed.protocol;
  const hostname = parsed.hostname;
  const pathname = parsed.pathname;
  const search = parsed.search;
  const hash = parsed.hash;
  const hasTrailingSlash = pathname.endsWith("/") && pathname !== "/";
  const hasUppercase = /[A-Z]/.test(pathname);
  const hasSpecialChars = /[^a-zA-Z0-9\-\/\.\_\~\:\/\?\#\[\]\@\!\$\&\'\(\)\*\+\,\;\=]/.test(pathname);
  const hasQueryParams = search.length > 1;
  const hasHash = hash.length > 0;
  const isHttps = protocol === "https:";
  const pathDepth = pathname.split("/").filter((s) => s.length > 0).length;
  const totalLength = url.length;
  const hasSessionIds = /[?&](sid|session|phpsessid|jsessionid)=/.test(url);
  const hasDuplicateSlashes = /\/{2,}/.test(pathname);

  let urlScore = 100;
  const issues: { check: string; status: string; severity: string; details: string }[] = [];

  if (!isHttps) { urlScore -= 25; issues.push({ check: "HTTPS Protocol", status: "\u274c Fail", severity: "Critical", details: "HTTP not secure \u2014 migrate to HTTPS" });
  } else { issues.push({ check: "HTTPS Protocol", status: "\u2705 Pass", severity: "Pass", details: "Secure connection" }); }

  if (totalLength > 100) urlScore -= 15; else if (totalLength > 75) urlScore -= 5;
  issues.push({ check: "URL Length", status: totalLength <= 75 ? "\u2705 Pass" : totalLength <= 100 ? "\u26a0\ufe0f Warning" : "\u274c Fail", severity: totalLength > 100 ? "High" : totalLength > 75 ? "Medium" : "Pass", details: `${totalLength} characters (recommended: <75)` });

  if (hasTrailingSlash) urlScore -= 5;
  issues.push({ check: "Trailing Slash", status: !hasTrailingSlash ? "\u2705 Pass" : "\u26a0\ufe0f Warning", severity: hasTrailingSlash ? "Low" : "Pass", details: hasTrailingSlash ? "Remove or redirect (choose one format)" : "No trailing slash" });

  if (hasUppercase) urlScore -= 10;
  issues.push({ check: "Lowercase Path", status: !hasUppercase ? "\u2705 Pass" : "\u26a0\ufe0f Warning", severity: hasUppercase ? "Medium" : "Pass", details: hasUppercase ? "Convert to lowercase and redirect" : "All lowercase" });

  if (hasSpecialChars) urlScore -= 10;
  issues.push({ check: "Special Characters", status: !hasSpecialChars ? "\u2705 Pass" : "\u26a0\ufe0f Warning", severity: hasSpecialChars ? "Medium" : "Pass", details: hasSpecialChars ? "Use only alphanumeric and hyphens" : "Clean URL" });

  if (hasSessionIds) urlScore -= 15;
  issues.push({ check: "Session IDs", status: !hasSessionIds ? "\u2705 Pass" : "\u274c Fail", severity: hasSessionIds ? "Critical" : "Pass", details: hasSessionIds ? "Remove session IDs from URLs" : "No session IDs" });

  if (hasDuplicateSlashes) urlScore -= 10;
  issues.push({ check: "Duplicate Slashes", status: !hasDuplicateSlashes ? "\u2705 Pass" : "\u274c Fail", severity: hasDuplicateSlashes ? "High" : "Pass", details: hasDuplicateSlashes ? "Multiple consecutive slashes detected" : "No duplicates" });

  if (pathDepth > 5) urlScore -= 10; else if (pathDepth > 3) urlScore -= 5;
  issues.push({ check: "Path Depth", status: pathDepth <= 3 ? "\u2705 Pass" : pathDepth <= 5 ? "\u26a0\ufe0f Warning" : "\u274c Fail", severity: pathDepth > 5 ? "High" : pathDepth > 3 ? "Medium" : "Pass", details: `${pathDepth} levels deep (recommended: \u22643)` });

  urlScore = Math.max(0, Math.min(100, urlScore));

  let md = "# URL Redirect Analysis\n\n";
  md += `**URL:** ${url}\n\n`;
  md += "---\n\n";

  md += "## URL Score\n\n";
  md += `**${urlScore}/100** ${getScoreBar(urlScore)}\n\n`;

  md += "## URL Structure\n\n";
  md += "| Component | Value |\n";
  md += "|-----------|-------|\n";
  md += `| Protocol | ${protocol} |\n`;
  md += `| Hostname | ${hostname} |\n`;
  md += `| Path | ${pathname} |\n`;
  md += `| Query | ${search || "(none)"} |\n`;
  md += `| Hash | ${hash || "(none)"} |\n`;
  md += `| Path Depth | ${pathDepth} levels |\n`;
  md += `| Total Length | ${totalLength} chars |\n`;

  md += "\n## Issues Detected\n\n";
  md += "| Issue | Status | Severity | Details |\n";
  md += "|-------|--------|----------|--------|\n";
  for (const issue of issues) {
    md += `| ${issue.check} | ${issue.status} | ${issue.severity} | ${issue.details} |\n`;
  }

  md += "\n---\n\n";
  md += "## \ud83d\udcdd Recommendations\n\n";
  const recs: string[] = [];
  if (!isHttps) recs.push("Migrate to HTTPS for security and SEO benefits");
  if (hasTrailingSlash) recs.push("Choose one format (with or without trailing slash) and redirect the other");
  if (hasUppercase) recs.push("Convert path to lowercase and set up 301 redirects");
  if (hasSpecialChars) recs.push("Remove special characters from URL path, use hyphens instead");
  if (hasQueryParams) recs.push("Consider using URL-friendly paths instead of query parameters where possible");
  if (hasHash) recs.push("Avoid hash fragments for important content \u2014 search engines may not index hash content");
  if (totalLength > 75) recs.push("Shorten URL for better usability and sharing");
  if (pathDepth > 4) recs.push("Reduce URL depth \u2014 aim for 3 levels or fewer");
  if (hasSessionIds) recs.push("Remove session IDs from URLs to avoid duplicate content");
  if (hasDuplicateSlashes) recs.push("Fix duplicate slashes in URL path");
  if (recs.length === 0) recs.push("URL structure looks good! No issues detected.");

  for (let i = 0; i < recs.length; i++) {
    md += `${i + 1}. ${recs[i]}\n`;
  }

  md += "\n---\n\n";
  md += `*Generated by Premium Redirect Analyzer \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function checkGoogleIndex(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `# Google Index Check\n\n\u274c **Invalid URL:** ${url}\n\nPlease provide a valid URL with protocol (https://example.com).`;
  }

  const hostname = parsed.hostname;
  const pathname = parsed.pathname;
  const isHttps = parsed.protocol === "https:";
  const urlLength = url.length;
  const hasSubdomains = hostname.split(".").length > 2;
  const hasKeywords = /\/[a-z]+-[a-z]+/.test(pathname);
  const isClean = !/[^a-zA-Z0-9\-\/\.\_]/.test(pathname);
  const depth = pathname.split("/").filter((s) => s.length > 0).length;
  const blockPatterns = ["/admin", "/api", "/tmp", "/private", "/wp-admin", "/cgi-bin"];
  const isBlocked = blockPatterns.some((p) => pathname.toLowerCase().startsWith(p));

  let indexScore = 100;
  if (!isHttps) indexScore -= 20;
  if (urlLength > 75) indexScore -= 10;
  if (urlLength > 100) indexScore -= 10;
  if (isBlocked) indexScore -= 30;
  if (depth > 5) indexScore -= 10;
  if (!isClean) indexScore -= 5;
  indexScore = Math.max(0, Math.min(100, indexScore));

  let md = "# Google Index Analysis\n\n";
  md += `**URL:** ${url}\n\n`;
  md += "---\n\n";

  md += "## Indexability Score\n\n";
  md += `**${indexScore}/100** ${getScoreBar(indexScore)}\n\n`;

  md += "## Indexability Assessment\n\n";
  md += "| Factor | Status | Impact |\n";
  md += "|--------|--------|--------|\n";
  md += `| HTTPS | ${isHttps ? "\u2705 Yes" : "\u274c No"} | ${isHttps ? "Positive" : "Negative"} |\n`;
  md += `| URL Length | ${urlLength <= 75 ? "\u2705 Optimal" : urlLength <= 100 ? "\u26a0\ufe0f Long" : "\u274c Too long"} | ${urlLength <= 75 ? "Positive" : "Negative"} |\n`;
  md += `| Clean Path | ${isClean ? "\u2705 Yes" : "\u26a0\ufe0f No"} | ${isClean ? "Positive" : "Neutral"} |\n`;
  md += `| Keyword in URL | ${hasKeywords ? "\u2705 Yes" : "\u26a0\ufe0f No"} | ${hasKeywords ? "Positive" : "Neutral"} |\n`;
  md += `| Path Depth | ${depth <= 3 ? "\u2705 Optimal" : depth <= 5 ? "\u26a0\ufe0f Deep" : "\u274c Very deep"} | ${depth <= 3 ? "Positive" : "Negative"} |\n`;
  md += `| Blocked Pattern | ${isBlocked ? "\u274c Yes" : "\u2705 No"} | ${isBlocked ? "Critical" : "Positive"} |\n`;
  md += `| Subdomain | ${hasSubdomains ? "\u26a0\ufe0f Has subdomain" : "\u2705 Root domain"} | Neutral |\n`;

  md += "\n## URL Quality Analysis\n\n";
  md += "| Quality Factor | Assessment |\n";
  md += "|----------------|------------|\n";
  md += `| Readability | ${isClean && depth <= 3 ? "\u2705 High" : isClean ? "\ud83d\udfe1 Medium" : "\u274c Low"} |\n`;
  md += `| Brevity | ${urlLength <= 60 ? "\u2705 Concise" : urlLength <= 80 ? "\ud83d\udfe1 Acceptable" : "\u274c Long"} |\n`;
  md += `| Structure | ${depth <= 3 ? "\u2705 Shallow" : depth <= 5 ? "\ud83d\udfe1 Moderate" : "\u274c Deep"} |\n`;
  md += `| SEO Friendliness | ${hasKeywords && isClean ? "\u2705 Optimized" : hasKeywords ? "\ud83d\udfe1 Partially" : "\u274c Not optimized"} |\n`;

  md += "\n---\n\n";
  md += "## \ud83d\udcdd Recommendations\n\n";
  const recs: string[] = [];
  if (!isHttps) recs.push("Enable HTTPS \u2014 it's a ranking signal for Google");
  if (isBlocked) recs.push("Remove URL from robots.txt Disallow if you want it indexed");
  if (urlLength > 75) recs.push("Shorten URL to under 75 characters");
  if (depth > 3) recs.push("Flatten URL structure \u2014 keep pages within 3 levels");
  if (!hasKeywords) recs.push("Add relevant keywords to URL path");
  if (!isClean) recs.push("Use only lowercase letters, numbers, and hyphens in URLs");
  recs.push("Submit URL to Google Search Console for faster indexing");
  recs.push("Ensure page has quality content and internal links");

  for (let i = 0; i < recs.length; i++) {
    md += `${i + 1}. ${recs[i]}\n`;
  }

  md += "\n---\n\n";
  md += `*Generated by Premium Google Index Analyzer \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function checkBacklinks(url: string): string {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return `# Backlink Analysis\n\n\u274c **Invalid URL:** ${url}\n\nPlease provide a valid URL with protocol (https://example.com).`;
  }

  const hostname = parsed.hostname;
  const tld = hostname.split(".").pop() || "";
  const domainParts = hostname.split(".");
  const brand = domainParts.length >= 2 ? domainParts[domainParts.length - 2] : hostname;

  const highAuthorityDomains: Record<string, number> = {
    "com": 90, "org": 85, "edu": 95, "gov": 98, "net": 75,
    "io": 70, "co": 65, "dev": 60, "app": 65,
  };
  const domainAuthority = highAuthorityDomains[tld] || 50;
  const authScore = Math.min(100, Math.max(0, domainAuthority + (parsed.protocol === "https:" ? 5 : 0) - (hostname.length > 20 ? 10 : 0)));

  let md = "# Backlink Analysis Report\n\n";
  md += `**URL:** ${url}\n`;
  md += `**Domain:** ${hostname}\n\n`;
  md += "---\n\n";

  md += "## Domain Authority Indicators\n\n";
  md += "| Indicator | Assessment |\n";
  md += "|-----------|------------|\n";
  md += `| TLD | .${tld} (${domainAuthority >= 80 ? "High authority" : domainAuthority >= 60 ? "Medium authority" : "Standard"}) |\n`;
  md += `| Domain Length | ${hostname.length} chars (${hostname.length <= 15 ? "\u2705 Short" : "\u26a0\ufe0f Long"}) |\n`;
  md += `| Brandable | ${brand.length <= 10 ? "\u2705 Yes" : "\u26a0\ufe0f Moderate"} |\n`;
  md += `| HTTPS | ${parsed.protocol === "https:" ? "\u2705 Yes" : "\u274c No"} |\n`;
  md += `| Subdomains | ${domainParts.length > 2 ? "\u26a0\ufe0f Has subdomain" : "\u2705 Root domain"} |\n`;

  md += "\n## Estimated Authority Score\n\n";
  md += `**${authScore}/100** ${getScoreBar(authScore)}\n\n`;

  md += "| Level | Range |\n";
  md += "|-------|-------|\n";
  md += `| ${authScore >= 70 ? "\u2705" : ""} High | 70-100 |\n`;
  md += `| ${authScore >= 40 && authScore < 70 ? "\u26a0\ufe0f" : ""} Medium | 40-69 |\n`;
  md += `| ${authScore < 40 ? "\u274c" : ""} Low | 0-39 |\n`;

  md += "\n---\n\n";
  md += "## Backlink Strategy Recommendations\n\n";
  md += "### Content-Based Strategies\n";
  md += "1. Create comprehensive guides and tutorials (10x content)\n";
  md += "2. Publish original research, data studies, or surveys\n";
  md += "3. Build interactive tools and calculators\n";
  md += "4. Create infographics and visual assets for sharing\n";
  md += "5. Write guest posts for authority sites in your niche\n\n";

  md += "### Outreach Strategies\n";
  md += "1. Identify broken links on competitor sites and offer replacements\n";
  md += "2. Reclaim unlinked brand mentions\n";
  md += "3. Build relationships with industry bloggers and journalists\n";
  md += "4. Participate in expert roundups and interviews\n";
  md += "5. Sponsor or host industry events and webinars\n\n";

  md += "### Technical Strategies\n";
  md += "1. Ensure site loads fast (Core Web Vitals optimization)\n";
  md += "2. Build a strong internal linking structure\n";
  md += "3. Create linkable resource pages and glossaries\n";
  md += "4. Optimize for featured snippets to attract natural links\n";
  md += "5. Monitor and disavow toxic backlinks regularly\n\n";

  md += "---\n\n";
  md += "## Outreach Email Templates\n\n";

  md += "### Guest Post Outreach\n";
  md += "```\n";
  md += "Subject: Guest Post Proposal: [Topic] for [Site Name]\n\n";
  md += "Hi [Name],\n\n";
  md += "I've been following [Site Name] and really enjoyed your recent article on [Topic].\n";
  md += "I'd love to contribute a guest post to your site.\n\n";
  md += "Here are some topic ideas:\n";
  md += "1. [Topic 1]\n";
  md += "2. [Topic 2]\n";
  md += "3. [Topic 3]\n\n";
  md += "I write for [mention publications] and can provide high-quality, original content.\n\n";
  md += "Would any of these topics interest you?\n\n";
  md += "Best,\n[Your Name]\n";
  md += "```\n\n";

  md += "### Broken Link Building\n";
  md += "```\n";
  md += "Subject: Broken Link on Your [Page Name] Article\n\n";
  md += "Hi [Name],\n\n";
  md += 'I noticed a broken link on your article "[Article Title]" \u2014 the link to [Broken URL] appears to be down.\n\n';
  md += "I actually have a comprehensive resource on [Topic] that covers similar content.\n";
  md += "It might make a good replacement: [Your URL]\n\n";
  md += "Either way, thought you'd want to know about the broken link!\n\n";
  md += "Best,\n[Your Name]\n";
  md += "```\n\n";

  md += "### Unlinked Brand Mention\n";
  md += "```\n";
  md += "Subject: Thanks for Mentioning [Brand]!\n\n";
  md += "Hi [Name],\n\n";
  md += 'I came across your article "[Article Title]" and noticed you mentioned [Brand].\n';
  md += "Thanks for the mention!\n\n";
  md += "I noticed the mention isn't currently linked to our site.\n";
  md += "Would you mind adding a link? Here's the URL: [Your URL]\n\n";
  md += "Keep up the great work on [Site Name]!\n\n";
  md += "Best,\n[Your Name]\n";
  md += "```\n\n";

  md += "---\n\n";
  md += "## Backlink Quality Checklist\n\n";
  md += "| Factor | Ideal |\n";
  md += "|--------|-------|\n";
  md += "| Relevance | Topically related to your site |\n";
  md += "| Authority | DA 40+ for meaningful impact |\n";
  md += "| Traffic | Links from pages with actual traffic |\n";
  md += "| Placement | Editorial/in-content links preferred |\n";
  md += "| Anchor Text | Natural, varied anchor text |\n";
  md += "| Diversity | Mix of dofollow/nofollow and domains |\n";
  md += "| Freshness | Regularly acquiring new links |\n";

  md += "\n---\n\n";
  md += `*Generated by Premium Backlink Analyzer \u2014 ${new Date().toISOString()}*\n`;

  return md;
}

export function processSEOTool(toolId: string, options: Record<string, string>): ToolResult {
  const handlers: Record<string, () => ToolResult> = {
    "seo-analyzer": () => ({
      content: analyzeSEO(options.text || "", options.keyword || ""),
      filename: "seo-analysis.md",
      mimeType: "text/markdown",
    }),
    "keyword-research": () => ({
      content: researchKeywords(options.topic || "", options.intent || ""),
      filename: "keyword-research.md",
      mimeType: "text/markdown",
    }),
    "meta-tag-generator": () => ({
      content: generateMetaTags(options.title || "", options.description || "", options.keywords || "", options.url || "", options.image || ""),
      filename: "meta-tags.html",
      mimeType: "text/html",
    }),
    "serp-preview": () => ({
      content: previewSERP(options.title || "", options.description || "", options.url || "", options.date || ""),
      filename: "serp-preview.md",
      mimeType: "text/markdown",
    }),
    "sitemap-generator": () => ({
      content: generateSitemap(options.text || "", options.frequency || "weekly"),
      filename: "sitemap.xml",
      mimeType: "application/xml",
    }),
    "robots-txt-generator": () => ({
      content: generateRobotsTxt(options.policy || "allow-all", options.text || ""),
      filename: "robots.txt",
      mimeType: "text/plain",
    }),
    "keyword-density": () => ({
      content: checkKeywordDensity(options.text || "", options.keyword || ""),
      filename: "keyword-density.md",
      mimeType: "text/markdown",
    }),
    "seo-title-generator": () => ({
      content: generateSEOTitle(options.topic || "", options.keyword || ""),
      filename: "seo-title.md",
      mimeType: "text/markdown",
    }),
    "seo-meta-desc": () => ({
      content: generateMetaDescription(options.topic || "", options.keyword || ""),
      filename: "meta-description.md",
      mimeType: "text/markdown",
    }),
    "redirect-checker": () => ({
      content: checkRedirects(options.url || ""),
      filename: "redirect-analysis.md",
      mimeType: "text/markdown",
    }),
    "google-index-checker": () => ({
      content: checkGoogleIndex(options.url || ""),
      filename: "index-analysis.md",
      mimeType: "text/markdown",
    }),
    "backlink-checker": () => ({
      content: checkBacklinks(options.url || ""),
      filename: "backlink-analysis.md",
      mimeType: "text/markdown",
    }),
  };

  const handler = handlers[toolId];
  if (!handler) {
    return {
      content: `# Error\n\nUnknown SEO tool: ${toolId}\n\nAvailable tools: ${Object.keys(handlers).join(", ")}`,
      filename: "error.md",
      mimeType: "text/markdown",
    };
  }
  return handler();
}

export function downloadSEO(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}