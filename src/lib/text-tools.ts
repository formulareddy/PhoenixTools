// Premium client-side text processing tools
// All processing happens in the browser - no server needed
// Inspired by CodePen, JSFiddle, Carbon, and other premium dev tools

export function wordCounter(text: string): string {
  const words = text.trim().split(/\s+/).filter(w => w.length > 0)
  const characters = text.length
  const charactersNoSpaces = text.replace(/\s/g, "").length
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length
  const paragraphs = text.split(/\n\n+/).filter(p => p.trim().length > 0).length
  const lines = text.split("\n").length
  const avgWordLength = words.length > 0 ? (words.reduce((a, w) => a + w.length, 0) / words.length).toFixed(1) : 0

  return `# Word Counter Results

## Statistics
| Metric | Count |
|--------|-------|
| Words | ${words.length} |
| Characters | ${characters} |
| Characters (no spaces) | ${charactersNoSpaces} |
| Sentences | ${sentences} |
| Paragraphs | ${paragraphs} |
| Lines | ${lines} |
| Avg Word Length | ${avgWordLength} chars |

## Reading Time
- Average reading speed: ~200 words/minute
- Estimated reading time: ${Math.ceil(words.length / 200)} minute(s)

## Speaking Time
- Average speaking speed: ~150 words/minute
- Estimated speaking time: ${Math.ceil(words.length / 150)} minute(s)`
}

export function textDiff(text1: string, text2: string): string {
  const lines1 = text1.split("\n")
  const lines2 = text2.split("\n")
  const changes: { type: string; line: number; content: string }[] = []

  const maxLen = Math.max(lines1.length, lines2.length)
  for (let i = 0; i < maxLen; i++) {
    if (i >= lines1.length) {
      changes.push({ type: "added", line: i + 1, content: lines2[i] })
    } else if (i >= lines2.length) {
      changes.push({ type: "removed", line: i + 1, content: lines1[i] })
    } else if (lines1[i] !== lines2[i]) {
      changes.push({ type: "removed", line: i + 1, content: lines1[i] })
      changes.push({ type: "added", line: i + 1, content: lines2[i] })
    }
  }

  const added = changes.filter(c => c.type === "added").length
  const removed = changes.filter(c => c.type === "removed").length
  const unchanged = lines1.filter((line, i) => i < lines2.length && line === lines2[i]).length

  let result = `# Text Diff Results

## Summary
| Metric | Count |
|--------|-------|
| Lines Added | ${added} |
| Lines Removed | ${removed} |
| Lines Unchanged | ${unchanged} |
| Total Lines (Left) | ${lines1.length} |
| Total Lines (Right) | ${lines2.length} |

## Changes
`

  for (const change of changes) {
    if (change.type === "added") {
      result += `+ [Line ${change.line}] ${change.content}\n`
    } else {
      result += `- [Line ${change.line}] ${change.content}\n`
    }
  }

  return result
}

export function unitConverter(value: string, from: string, to: string, category: string): string {
  const num = parseFloat(value)
  if (isNaN(num)) return "Error: Invalid number"

  const conversions: Record<string, Record<string, number>> = {
    length: { m: 1, km: 0.001, cm: 100, mm: 1000, ft: 3.28084, in: 39.3701, yd: 1.09361, mi: 0.000621371 },
    weight: { kg: 1, g: 1000, mg: 1000000, lb: 2.20462, oz: 35.274, ton: 0.001 },
    temperature: { C: 1, F: 1.8, K: 1 },
    volume: { l: 1, ml: 1000, gal: 0.264172, qt: 1.05669, pt: 2.11338, cup: 4.22675 },
    speed: { mps: 1, kph: 3.6, mph: 2.23694, knot: 1.94384 },
  }

  if (category === "temperature") {
    let celsius: number
    if (from === "C") celsius = num
    else if (from === "F") celsius = (num - 32) / 1.8
    else celsius = num - 273.15

    let result: number
    if (to === "C") result = celsius
    else if (to === "F") result = celsius * 1.8 + 32
    else result = celsius + 273.15

    return `# Unit Conversion Result

## Input
- Value: ${num}
- From: ${from}

## Output
- Value: ${result.toFixed(4)}
- To: ${to}

## Formula
${from} → C → ${to}`
  }

  const categoryConversions = conversions[category]
  if (!categoryConversions) return "Error: Unknown category"

  const fromFactor = categoryConversions[from]
  const toFactor = categoryConversions[to]
  if (!fromFactor || !toFactor) return "Error: Unknown unit"

  const baseValue = num / fromFactor
  const result = baseValue * toFactor

  return `# Unit Conversion Result

## Input
- Value: ${num}
- From: ${from}

## Output
- Value: ${result.toFixed(6)}
- To: ${to}

## Conversion Factor
1 ${from} = ${(toFactor / fromFactor).toFixed(6)} ${to}`
}

export function caseConverter(text: string, caseType: string): string {
  let result: string

  switch (caseType) {
    case "upper":
      result = text.toUpperCase()
      break
    case "lower":
      result = text.toLowerCase()
      break
    case "title":
      result = text.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase())
      break
    case "sentence":
      result = text.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, sep, char) => sep + char.toUpperCase())
      break
    case "camel":
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
        index === 0 ? word.toLowerCase() : word.toUpperCase()
      ).replace(/[\s\-_]+/g, "")
      break
    case "pascal":
      result = text.replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase()).replace(/[\s\-_]+/g, "")
      break
    case "snake":
      result = text.replace(/([A-Z])/g, "_$1").toLowerCase().replace(/^_/, "").replace(/[\s\-]+/g, "_")
      break
    case "kebab":
      result = text.replace(/([A-Z])/g, "-$1").toLowerCase().replace(/^\-/, "").replace(/[\s_]+/g, "-")
      break
    default:
      result = text
  }

  return `# Case Converter Result

## Input
\`\`\`
${text}
\`\`\`

## Output (${caseType})
\`\`\`
${result}
\`\`\`

## Statistics
- Characters: ${result.length}
- Words: ${result.split(/\s+/).filter(w => w).length}`
}

export function textCleaner(text: string, options: string): string {
  let cleaned = text

  if (options === "all" || options.includes("extra-spaces")) {
    cleaned = cleaned.replace(/[ \t]+/g, " ")
  }
  if (options === "all" || options.includes("empty-lines")) {
    cleaned = cleaned.replace(/\n\s*\n/g, "\n\n")
  }
  if (options === "all" || options.includes("trailing")) {
    cleaned = cleaned.replace(/[ \t]+$/gm, "")
  }
  if (options === "all" || options.includes("tabs")) {
    cleaned = cleaned.replace(/\t/g, "  ")
  }

  const originalLines = text.split("\n").length
  const cleanedLines = cleaned.split("\n").length
  const originalWords = text.split(/\s+/).filter(w => w).length
  const cleanedWords = cleaned.split(/\s+/).filter(w => w).length

  return `# Text Cleaner Result

## Statistics
| Metric | Before | After |
|--------|--------|-------|
| Characters | ${text.length} | ${cleaned.length} |
| Lines | ${originalLines} | ${cleanedLines} |
| Words | ${originalWords} | ${cleanedWords} |
| Size Saved | - | ${((1 - cleaned.length / text.length) * 100).toFixed(1)}% |

## Cleaned Output
\`\`\`
${cleaned}
\`\`\``
}

export function findReplace(text: string, find: string, replace: string): string {
  if (!find) return "Error: Find string is empty"

  const regex = new RegExp(find, "gi")
  const matches = text.match(regex)
  const count = matches ? matches.length : 0
  const result = text.replace(regex, replace)

  return `# Find & Replace Result

## Statistics
| Metric | Value |
|--------|-------|
| Search Term | "${find}" |
| Replacement | "${replace}" |
| Matches Found | ${count} |
| Characters Changed | ${Math.abs(result.length - text.length)} |

## Output
\`\`\`
${result}
\`\`\``
}

export function loremIpsum(paragraphs: string): string {
  const paraCount = parseInt(paragraphs) || 3
  const loremParts = [
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit.",
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.",
    "Nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse.",
    "Cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident.",
    "Sunt in culpa qui officia deserunt mollit anim id est laborum.",
  ]

  const result: string[] = []
  for (let i = 0; i < paraCount; i++) {
    const start = i % loremParts.length
    const paraLength = 3 + Math.floor(Math.random() * 3)
    const para: string[] = []
    for (let j = 0; j < paraLength; j++) {
      para.push(loremParts[(start + j) % loremParts.length])
    }
    result.push(para.join(" "))
  }

  return `# Lorem Ipsum Generated

## Statistics
- Paragraphs: ${paraCount}
- Words: ${result.join(" ").split(/\s+/).length}
- Characters: ${result.join("\n\n").length}

## Output
${result.join("\n\n")}`
}

export function textToSlug(text: string, separator: string): string {
  const sep = separator === "underscore" ? "_" : separator === "space" ? " " : "-"
  const slug = text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, sep)
    .replace(/^-+|-+$/g, "")

  return `# Slug Generator Result

## Input
\`\`\`
${text}
\`\`\`

## Output
\`\`\`
${slug}
\`\`\`

## Statistics
- Characters: ${slug.length}
- Words: ${slug.split(sep).length}`
}

export function duplicateRemover(text: string, sort: string): string {
  const lines = text.split("\n")
  const unique = [...new Set(lines)]
  const removed = lines.length - unique.length

  if (sort === "asc") unique.sort()
  else if (sort === "desc") unique.sort().reverse()

  return `# Duplicate Remover Result

## Statistics
| Metric | Count |
|--------|-------|
| Original Lines | ${lines.length} |
| Unique Lines | ${unique.length} |
| Duplicates Removed | ${removed} |

## Output
\`\`\`
${unique.join("\n")}
\`\`\``
}

export function textSorter(text: string, order: string): string {
  const lines = text.split("\n")
  const sorted = [...lines]
  if (order === "asc") sorted.sort()
  else if (order === "desc") sorted.sort().reverse()
  else if (order === "length") sorted.sort((a, b) => a.length - b.length)
  else if (order === "length-desc") sorted.sort((a, b) => b.length - a.length)

  return `# Text Sorter Result

## Statistics
- Lines: ${lines.length}
- Order: ${order}

## Output
\`\`\`
${sorted.join("\n")}
\`\`\``
}

export function charCounter(text: string): string {
  const stats: Record<string, number> = {}
  for (const char of text) {
    stats[char] = (stats[char] || 0) + 1
  }

  const sorted = Object.entries(stats).sort((a, b) => b[1] - a[1]).slice(0, 20)

  let result = `# Character Counter Result

## Overall Statistics
| Metric | Count |
|--------|-------|
| Total Characters | ${text.length} |
| Letters | ${text.replace(/[^a-zA-Z]/g, "").length} |
| Numbers | ${text.replace(/[^0-9]/g, "").length} |
| Spaces | ${text.replace(/[^ ]/g, "").length} |
| Special Characters | ${text.replace(/[a-zA-Z0-9 ]/g, "").length} |
| Lines | ${text.split("\n").length} |

## Top 20 Characters
| Character | Count | Percentage |
|-----------|-------|------------|
`

  for (const [char, count] of sorted) {
    const display = char === " " ? "Space" : char === "\n" ? "Newline" : char === "\t" ? "Tab" : `"${char}"`
    result += `| ${display} | ${count} | ${((count / text.length) * 100).toFixed(1)}% |\n`
  }

  return result
}

export function base64EncodeDecode(text: string, action: string): string {
  try {
    if (action === "encode") {
      const encoded = btoa(unescape(encodeURIComponent(text)))
      return `# Base64 Encoder Result

## Input
\`\`\`
${text}
\`\`\`

## Output (Encoded)
\`\`\`
${encoded}
\`\`\`

## Statistics
- Input Length: ${text.length} characters
- Output Length: ${encoded.length} characters
- Size Increase: ${((encoded.length / text.length - 1) * 100).toFixed(1)}%`
    } else {
      const decoded = decodeURIComponent(escape(atob(text.trim())))
      return `# Base64 Decoder Result

## Input
\`\`\`
${text}
\`\`\`

## Output (Decoded)
\`\`\`
${decoded}
\`\`\`

## Statistics
- Input Length: ${text.length} characters
- Output Length: ${decoded.length} characters`
    }
  } catch (e: any) {
    return `# Base64 Error

## Error
${e.message}

## Tip
Make sure you paste a valid Base64 string. Valid characters: A-Z, a-z, 0-9, +, /, =`
  }
}

export function urlEncodeDecode(text: string, action: string): string {
  try {
    if (action === "encode") {
      const encoded = encodeURIComponent(text)
      return `# URL Encoder Result

## Input
\`\`\`
${text}
\`\`\`

## Output (Encoded)
\`\`\`
${encoded}
\`\`\`

## Statistics
- Input Length: ${text.length} characters
- Output Length: ${encoded.length} characters
- Special Characters Encoded: ${encoded.replace(/[a-zA-Z0-9\-_.~]/g, "").length}`
    } else {
      const decoded = decodeURIComponent(text)
      return `# URL Decoder Result

## Input
\`\`\`
${text}
\`\`\`

## Output (Decoded)
\`\`\`
${decoded}
\`\`\`

## Statistics
- Input Length: ${text.length} characters
- Output Length: ${decoded.length} characters`
    }
  } catch (e: any) {
    return `# URL Error

## Error
${e.message}

## Tip
Make sure you paste a valid URL-encoded string.`
  }
}

export function jsonFormatter(text: string, indent: string): string {
  try {
    const parsed = JSON.parse(text)
    const spaces = indent === "tab" ? "\t" : parseInt(indent) || 2
    const formatted = JSON.stringify(parsed, null, spaces)
    const lines = formatted.split("\n").length
    const keys = (formatted.match(/"/g) || []).length / 2

    return `# JSON Formatter Result

## Status: Valid JSON ✓

## Statistics
| Metric | Value |
|--------|-------|
| Characters | ${formatted.length} |
| Lines | ${lines} |
| Keys | ${Math.round(keys)} |
| Indentation | ${indent === "tab" ? "Tab" : `${indent} spaces`} |

## Formatted Output
\`\`\`json
${formatted}
\`\`\``
  } catch (e: any) {
    const match = e.message.match(/position (\d+)/)
    const pos = match ? parseInt(match[1]) : null
    const line = pos ? text.substring(0, pos).split("\n").length : null

    return `# JSON Formatter Error

## Status: Invalid JSON ✗

## Error Details
| Property | Value |
|----------|-------|
| Message | ${e.message} |
| Position | ${pos || "N/A"} |
| Line | ${line || "N/A"} |

## Tip
Check for missing commas, brackets, or quotes. The error is near position ${pos || "unknown"}.`
  }
}

export function jsFormatter(text: string): string {
  let formatted = text
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, " {\n  ")
    .replace(/\s*}\s*/g, "\n}\n")
    .replace(/\s*;\s*/g, ";\n  ")
    .replace(/;/g, ";\n")

  const lines = formatted.split("\n")
  let indent = 0
  const result: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) continue

    if (trimmed.startsWith("}")) indent = Math.max(0, indent - 1)
    result.push("  ".repeat(indent) + trimmed)
    if (trimmed.endsWith("{")) indent++
  }

  const output = result.join("\n")
  const lineCount = output.split("\n").length

  return `# JavaScript Formatter Result

## Statistics
| Metric | Value |
|--------|-------|
| Characters | ${output.length} |
| Lines | ${lineCount} |
| Indentation | 2 spaces |

## Formatted Code
\`\`\`javascript
${output}
\`\`\``
}

export function jsMinifier(text: string): string {
  const original = text.length
  const originalLines = text.split("\n").length
  const minified = text
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\s+/g, " ")
    .replace(/\s*{\s*/g, "{")
    .replace(/\s*}\s*/g, "}")
    .replace(/\s*;\s*/g, ";")
    .replace(/\s*,\s*/g, ",")
    .replace(/\s*:\s*/g, ":")
    .trim()

  const saved = ((1 - minified.length / original) * 100).toFixed(1)
  const minifiedLines = minified.split("\n").length

  return `# JavaScript Minifier Result

## Statistics
| Metric | Before | After | Saved |
|--------|--------|-------|-------|
| Characters | ${original} | ${minified.length} | ${saved}% |
| Lines | ${originalLines} | ${minifiedLines} | ${((1 - minifiedLines / originalLines) * 100).toFixed(1)}% |

## Minified Code
\`\`\`javascript
${minified}
\`\`\``
}

export function jwtDecoder(token: string): string {
  try {
    const parts = token.trim().split(".")
    if (parts.length !== 3) throw new Error("Invalid JWT format - expected 3 parts")

    const header = JSON.parse(atob(parts[0].replace(/-/g, "+").replace(/_/g, "/")))
    const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")))

    const expDate = payload.exp ? new Date(payload.exp * 1000).toLocaleString() : "N/A"
    const iatDate = payload.iat ? new Date(payload.iat * 1000).toLocaleString() : "N/A"
    const isExpired = payload.exp ? Date.now() > payload.exp * 1000 : false

    return `# JWT Decoder Result

## Header
\`\`\`json
${JSON.stringify(header, null, 2)}
\`\`\`

## Payload
\`\`\`json
${JSON.stringify(payload, null, 2)}
\`\`\`

## Claims
| Claim | Value |
|-------|-------|
| Algorithm | ${header.alg || "N/A"} |
| Type | ${header.typ || "N/A"} |
| Issued At | ${iatDate} |
| Expires | ${expDate} |
| Subject | ${payload.sub || "N/A"} |
| Issuer | ${payload.iss || "N/A"} |
| Status | ${isExpired ? "❌ Expired" : "✅ Valid"} |

## Token Structure
- Part 1 (Header): ${parts[0].substring(0, 50)}...
- Part 2 (Payload): ${parts[1].substring(0, 50)}...
- Part 3 (Signature): ${parts[2].substring(0, 50)}...`
  } catch (e: any) {
    return `# JWT Decoder Error

## Error
${e.message}

## Tip
Make sure you paste a valid JWT token (three base64url-encoded parts separated by dots).

## Valid JWT Format
\`\`\`
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
\`\`\``
  }
}

export function regexTester(pattern: string, flags: string, testString: string): string {
  try {
    const regex = new RegExp(pattern, flags)
    const matches = testString.match(regex)
    const allMatches = testString.match(new RegExp(pattern, flags.includes("g") ? flags : flags + "g"))

    let result = `# Regex Tester Result

## Pattern
\`\`\`
/${pattern}/${flags}
\`\`\`

## Test String
\`\`\`
${testString}
\`\`\`

## Matches
| Metric | Value |
|--------|-------|
| Total Matches | ${allMatches?.length || 0} |
| First Match | ${matches ? `"${matches[0]}" at index ${matches.index}` : "None"} |
`

    if (matches && matches.length > 1) {
      result += `\n## Capture Groups\n| Group | Value |\n|-------|-------|\n`
      for (let i = 1; i < matches.length; i++) {
        result += `| ${i} | "${matches[i]}" |\n`
      }
    }

    if (allMatches && allMatches.length > 0) {
      result += `\n## All Matches\n| # | Match | Position |\n|---|-------|----------|\n`
      for (let i = 0; i < Math.min(allMatches.length, 20); i++) {
        const idx = testString.indexOf(allMatches[i])
        result += `| ${i + 1} | "${allMatches[i]}" | ${idx} |\n`
      }
      if (allMatches.length > 20) result += `| ... | ... | ... |\n`
    }

    return result
  } catch (e: any) {
    return `# Regex Error

## Error
${e.message}

## Tip
Check your regex pattern syntax. Common issues:
- Unclosed brackets or parentheses
- Invalid escape sequences
- Missing forward slashes

## Example Valid Patterns
\`\`\`
/[a-z]+/g     - Match lowercase letters
/\\d{3}-\\d{4}/  - Match phone numbers
/^https?:\\/\\// - Match URLs
\`\`\``
  }
}

export function hashGenerator(text: string, algo: string): string {
  // Simple hash implementation for demo
  // In production, use crypto.subtle
  let hash = 0
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }

  const hashHex = Math.abs(hash).toString(16).padStart(8, "0")

  // Generate different hashes based on algorithm
  let hashValue = hashHex
  if (algo === "md5") hashValue = hashHex.repeat(4).substring(0, 32)
  else if (algo === "sha1") hashValue = hashHex.repeat(5).substring(0, 40)
  else if (algo === "sha256") hashValue = hashHex.repeat(8).substring(0, 64)
  else if (algo === "sha512") hashValue = hashHex.repeat(16).substring(0, 128)

  return `# Hash Generator Result

## Input
\`\`\`
${text}
\`\`\`

## Output
| Algorithm | Hash |
|-----------|------|
| ${algo.toUpperCase()} | ${hashValue} |

## Statistics
| Metric | Value |
|--------|-------|
| Input Length | ${text.length} characters |
| Hash Length | ${hashValue.length} characters |
| Algorithm | ${algo.toUpperCase()} |

## Note
This is a demonstration hash. For production use, use crypto.subtle API for proper cryptographic hashing.`
}

export function sqlFormatter(text: string): string {
  const keywords = ["SELECT", "FROM", "WHERE", "AND", "OR", "JOIN", "LEFT", "RIGHT", "INNER", "OUTER", "ON", "GROUP BY", "ORDER BY", "HAVING", "LIMIT", "INSERT", "INTO", "VALUES", "UPDATE", "SET", "DELETE", "CREATE", "TABLE", "ALTER", "DROP", "INDEX", "AS", "DISTINCT", "COUNT", "SUM", "AVG", "MIN", "MAX"]

  let formatted = text.trim()
  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, "gi")
    formatted = formatted.replace(regex, `\n${keyword}`)
  }

  formatted = formatted.replace(/^\n/, "").trim()
  const lines = formatted.split("\n").length

  return `# SQL Formatter Result

## Statistics
| Metric | Value |
|--------|-------|
| Characters | ${formatted.length} |
| Lines | ${lines} |
| Keywords Uppercased | Yes |

## Formatted Query
\`\`\`sql
${formatted}
\`\`\``
}

export function cssFormatter(text: string): string {
  let formatted = text
    .replace(/\s*{\s*/g, " {\n  ")
    .replace(/\s*}\s*/g, "\n}\n\n")
    .replace(/\s*:\s*/g, ": ")
    .replace(/\s*;\s*/g, ";\n  ")
    .replace(/;\n\s*}/g, ";\n}")

  const output = formatted.trim()
  const lines = output.split("\n").length
  const selectors = (output.match(/[^{}]+(?=\s*{)/g) || []).length

  return `# CSS Formatter Result

## Statistics
| Metric | Value |
|--------|-------|
| Characters | ${output.length} |
| Lines | ${lines} |
| Selectors | ${selectors} |

## Formatted CSS
\`\`\`css
${output}
\`\`\``
}
