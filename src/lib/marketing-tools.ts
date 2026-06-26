export interface MarketingResult {
  content: string;
  filename: string;
  mimeType: string;
}

function generateQRMatrix(url: string): boolean[][] {
  const size = 21;
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );
  const setModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) matrix[r][c] = dark;
  };
  const placeFinder = (row: number, col: number) => {
    for (let r = -1; r <= 7; r++) {
      for (let c = -1; c <= 7; c++) {
        const dark = r === -1 || r === 7 || c === -1 || c === 7 || (r >= 2 && r <= 4 && c >= 2 && c <= 4);
        setModule(row + r, col + c, dark);
      }
    }
  };
  const placeTiming = () => {
    for (let i = 8; i < size - 8; i++) {
      setModule(6, i, i % 2 === 0);
      setModule(i, 6, i % 2 === 0);
    }
  };
  const placeAlignment = (row: number, col: number) => {
    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 2; c++) {
        setModule(row + r, col + c, Math.abs(r) === 2 || Math.abs(c) === 2 || (r === 0 && c === 0));
      }
    }
  };
  placeFinder(0, 0);
  placeFinder(0, size - 7);
  placeFinder(size - 7, 0);
  placeTiming();
  placeAlignment(size - 9, size - 9);
  const dataBytes: number[] = [];
  for (let i = 0; i < url.length; i++) dataBytes.push(url.charCodeAt(i) & 0xff);
  let bitIdx = 0, col = size - 1, up = true;
  while (col >= 0) {
    if (col === 6) col--;
    const rows = up ? Array.from({ length: size }, (_, i) => size - 1 - i) : Array.from({ length: size }, (_, i) => i);
    for (const row of rows) {
      for (let c = 0; c < 2; c++) {
        const cc = col - c;
        if (cc < 0 || matrix[row][cc]) continue;
        let bit = 0;
        if (bitIdx < dataBytes.length * 8) {
          bit = (dataBytes[Math.floor(bitIdx / 8)] >> (7 - (bitIdx % 8))) & 1;
        }
        setModule(row, cc, bit === 1);
        bitIdx++;
      }
    }
    up = !up;
    col -= 2;
  }
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (!matrix[r][c] && (r + c) % 3 === 0 && !(r < 9 && c < 9) && !(r < 9 && c > size - 9) && !(r > size - 9 && c < 9)) {
        setModule(r, c, true);
      }
    }
  }
  return matrix;
}

function matrixToSVG(matrix: boolean[][], modSize: number, color: string, bg: string): string {
  const s = matrix.length;
  const q = 4;
  const total = (s + q * 2) * modSize;
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" width="${total}" height="${total}">`;
  svg += `<rect width="${total}" height="${total}" fill="${bg}"/>`;
  for (let r = 0; r < s; r++) {
    for (let c = 0; c < s; c++) {
      if (matrix[r][c]) {
        svg += `<rect x="${(c + q) * modSize}" y="${(r + q) * modSize}" width="${modSize}" height="${modSize}" fill="${color}"/>`;
      }
    }
  }
  svg += `</svg>`;
  return svg;
}

import QRCode from "qrcode";

export function generateQRCode(url: string, options: string = "400;#000000;#FFFFFF"): string {
  const parts = options.split(";");
  const size = parseInt(parts[0]) || 400;
  const color = parts[1] || "#000000";
  const bgColor = parts[2] || "#FFFFFF";

  if (!url) {
    return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    let completed = false;
    QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: {
        dark: color,
        light: bgColor,
      },
      errorCorrectionLevel: "M",
    }, (err: Error | null | undefined) => {
      if (!err) completed = true;
    });

    if (completed) {
      return canvas.toDataURL("image/png");
    }
  } catch (e) {
    // Fall through
  }
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";
}

export function buildUTMUrl(url: string, source: string, medium: string, campaign: string, term: string, content: string): string {
  if (!url) {
    return `# ❌ UTM URL Builder Failed

## Error Details
- **Status**: Failed
- **Error**: Base URL is required
- **Received**: Empty string

## Usage
\`\`\`typescript
buildUTMUrl("https://example.com", "google", "cpc", "summer_sale", "shoes", "banner_v1")
\`\`\``;
  }

  try {
    let baseUrl = url;
    if (!baseUrl.startsWith("http://") && !baseUrl.startsWith("https://")) {
      baseUrl = "https://" + baseUrl;
    }
    const urlObj = new URL(baseUrl);
    const utmParams: Record<string, string> = {};
    if (source) utmParams.utm_source = source.toLowerCase().trim();
    if (medium) utmParams.utm_medium = medium.toLowerCase().trim();
    if (campaign) utmParams.utm_campaign = campaign.toLowerCase().trim().replace(/\s+/g, "_");
    if (term) utmParams.utm_term = term.toLowerCase().trim();
    if (content) utmParams.utm_content = content.toLowerCase().trim().replace(/\s+/g, "_");
    Object.entries(utmParams).forEach(([k, v]) => urlObj.searchParams.set(k, v));
    const finalUrl = urlObj.toString();
    const paramRows = Object.entries(utmParams).map(([k, v]) => `| **${k}** | \`${v}\` |`).join("\n");

    return `# ✅ UTM URL Generated Successfully

## UTM URL Overview
| Property | Value |
|----------|-------|
| **Base URL** | ${baseUrl} |
| **Final URL** | ${finalUrl} |
| **Total Parameters** | ${Object.keys(utmParams).length} |
| **URL Length** | ${finalUrl.length} characters |

## Generated UTM URL
\`\`\`
${finalUrl}
\`\`\`

## Parameter Breakdown

| Parameter | Value | Description |
|-----------|-------|-------------|
${paramRows}

## UTM Parameter Guide

### Required Parameters
| Parameter | Purpose | Example |
|-----------|---------|---------|
| **utm_source** | Traffic source | google, facebook, newsletter |
| **utm_medium** | Marketing medium | cpc, email, social, organic |
| **utm_campaign** | Campaign name | summer_sale, product_launch |

### Optional Parameters
| Parameter | Purpose | Example |
|-----------|---------|---------|
| **utm_term** | Paid search keywords | running_shoes, marketing_tools |
| **utm_content** | Content differentiation | banner_v1, text_link, cta_button |

## Naming Convention Best Practices

### ✅ Do's
- Use lowercase: \`google\` not \`Google\`
- Use underscores: \`summer_sale\` not \`summer sale\`
- Be consistent: \`cpc\` across all campaigns
- Include dates: \`q1_2024\`, \`june_promo\`
- Be descriptive: \`product_launch_video\`

### ❌ Don'ts
- Don't use spaces: \`summer sale\` → \`summer_sale\`
- Don't mix case: \`Google\` → \`google\`
- Don't use special chars: \`sale%20off\` → \`sale_off\`
- Don't use abbreviations: \`fb\` → \`facebook\`

## Platform-Specific UTM Structures

### Google Ads
| Parameter | Value |
|-----------|-------|
| utm_source | google |
| utm_medium | cpc |
| utm_campaign | {campaign_name} |
| utm_term | {keyword} |
| utm_content | {ad_group} |

### Facebook Ads
| Parameter | Value |
|-----------|-------|
| utm_source | facebook |
| utm_medium | paid_social |
| utm_campaign | {campaign_name} |
| utm_content | {ad_creative} |

### Email Campaigns
| Parameter | Value |
|-----------|-------|
| utm_source | newsletter |
| utm_medium | email |
| utm_campaign | {campaign_name} |
| utm_content | {cta_location} |

### LinkedIn Ads
| Parameter | Value |
|-----------|-------|
| utm_source | linkedin |
| utm_medium | paid_social |
| utm_campaign | {campaign_name} |
| utm_content | {ad_variant} |

## GA4 Integration

### Event Parameters
When users click your UTM link, GA4 automatically captures:
- Source/Medium as traffic dimensions
- Campaign as campaign dimension
- Content as custom dimension

### Custom Reports
Create custom reports in GA4 using:
1. **Acquisition Reports**: Traffic by source/medium
2. **Campaign Reports**: Campaign performance
3. **Conversion Reports**: Goal completions by campaign

### Attribution Models
GA4 uses data-driven attribution by default. UTM parameters help:
- Track multi-touch journeys
- Measure campaign ROI
- Optimize ad spend

## Tracking Setup Checklist

- [ ] All campaigns have unique UTM parameters
- [ ] Naming conventions are documented
- [ ] Team follows consistent format
- [ ] UTM parameters are tested before launch
- [ ] GA4 goals are configured
- [ ] Regular reporting schedule established

## Common UTM Patterns

### Seasonal Campaigns
\`\`\`
?utm_source=newsletter&utm_medium=email&utm_campaign=spring_sale_2024
\`\`\`

### Product Launches
\`\`\`
?utm_source=social&utm_medium=organic&utm_campaign=product_x_launch
\`\`\`

### A/B Testing
\`\`\`
?utm_source=google&utm_medium=cpc&utm_campaign=test_campaign&utm_content=variant_a
\`\`\`

## Analytics Dashboard Template

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Clicks** | 12,450 | 10,000 | ✅ |
| **CTR** | 3.2% | 2.5% | ✅ |
| **Conversions** | 456 | 400 | ✅ |
| **Cost/Click** | $0.85 | $1.00 | ✅ |
| **ROI** | 340% | 300% | ✅ |

## Next Steps
1. ✅ Copy the UTM URL above
2. ✅ Test the link in a browser
3. ✅ Add to your marketing materials
4. ✅ Monitor performance in GA4
5. ✅ Report results weekly`;
  } catch (error) {
    return `# ❌ UTM URL Builder Error

## Error Details
- **Status**: Failed
- **Error**: ${error instanceof Error ? error.message : "Unknown error"}
- **URL Provided**: ${url}

## Troubleshooting
- Ensure URL is valid and accessible
- Check for special characters
- Verify URL format (include https://)`;
  }
}

export function generateHashtags(topic: string, platform: string): string {
  if (!topic) {
    return `# ❌ Hashtag Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Topic is required

## Usage
\`\`\`typescript
generateHashtags("digital marketing", "instagram")
\`\`\``;
  }

  const p = platform.toLowerCase();
  const t = topic.toLowerCase().trim();
  const words = t.split(/\s+/).filter((w) => w.length > 2);
  const tag = (w: string) => `#${w}`;

  const db: Record<string, { popular: string[]; growing: string[]; niche: string[] }> = {
    instagram: {
      popular: ["#marketing", "#digitalmarketing", "#socialmediamarketing", "#marketingtips", "#contentmarketing", "#marketingstrategy", "#onlinemarketing", "#success", "#entrepreneur", "#business"],
      growing: ["#growthmarketing", "#performance-marketing", "#marketingagency", "#marketingdigital", "#emailmarketing", "#marketing101", "#brandmarketing", "#b2bmarketing", "#socialmediastrategy", "#contentcreator"],
      niche: ["#marketingcoach", "#marketingconsultant", "#marketinggenius", "#marketingtipsdaily", "#marketinginspiration", "#marketingguru", "#marketinglife", "#marketingnerd", "#marketingpros", "#marketingmasters"],
    },
    tiktok: {
      popular: ["#marketing", "#digitalmarketing", "#socialmediamarketing", "#makemoneyonline", "#sidehustle", "#passiveincome", "#entrepreneur", "#tiktokmarketing", "#fyp", "#viral"],
      growing: ["#growthhacks", "#marketinghacks", "#businesshacks", "#salesstrategies", "#conversionrate", "#emailmarketingtips", "#tiktokforbusiness", "#moneytok", "#businesstok", "#ceo"],
      niche: ["#adstutorial", "#copywritingtips", "#marketing101", "#brandingtips", "#growthmarketing", "#b2bmarketing", "#seooptimization", "#marketingtips", "#tiktoktips", "#tiktokviral"],
    },
    linkedin: {
      popular: ["#marketing", "#digitalmarketing", "#socialmediamarketing", "#contentmarketing", "#branding", "#businessgrowth", "#entrepreneurship", "#leadership", "#innovation", "#strategy"],
      growing: ["#b2bmarketing", "#growthmarketing", "#demandgeneration", "#accountbasedmarketing", "#leadgeneration", "#marketingautomation", "#contentstrategy", "#digitalstrategy", "#personalbranding", "#thoughtleadership"],
      niche: ["#salesmarketing", "#marketingleadership", "#marketinginsights", "#marketingtrends", "#marketingroi", "#marketingmetrics", "#marketingconsultant", "#marketingagency", "#marketingexpert", "#hrtech"],
    },
    twitter: {
      popular: ["#marketing", "#digitalmarketing", "#socialmediamarketing", "#marketingtips", "#contentmarketing", "#startuplife", "#entrepreneur", "#smallbiz", "#socialmedia", "#sales"],
      growing: ["#growthhacks", "#marketinghacks", "#businesshacks", "#branding", "#copywriting", "#emailmarketing", "#seotips", "#conversionrate", "#leadgen", "#demandgen"],
      niche: ["#marketinganalytics", "#marketingroi", "#marketingtipsdaily", "#marketingnews", "#marketingworld", "#marketingexpert", "#marketingguru", "#marketinggenius", "#marketingpro", "#marketingmaster"],
    },
    youtube: {
      popular: ["#marketing", "#digitalmarketing", "#socialmediamarketing", "#marketingtips", "#seo", "#youtube", "#youtubetips", "#youtubers", "#youtubevideo", "#youtubers"],
      growing: ["#marketingtutorial", "#marketingcourse", "#marketingforbeginners", "#youtubemarketing", "#youtubegrowth", "#youtubechannelgrowth", "#youtubealgorithm", "#youtubetipsandtricks", "#youtubetutorial", "#youtubecontent"],
      niche: ["#youtubesubscribers", "#youtubeanalytics", "#youtubemonetization", "#youtubevideosideas", "#youtubetrends", "#youtubeoptimization", "#youtubetools", "#youtubestrategy", "#youtubeeducation", "#youtubelearning"],
    },
  };

  const data = db[p] || db.instagram;
  const popTags = [...words.map(tag), ...data.popular].slice(0, 12);
  const growTags = data.growing.slice(0, 10);
  const nicheTags = data.niche.slice(0, 10);
  const all = [...popTags, ...growTags, ...nicheTags];
  const limits: Record<string, number> = { instagram: 30, tiktok: 15, linkedin: 5, twitter: 2, youtube: 15 };
  const limit = limits[p] || 30;
  const selected = all.slice(0, limit);

  const mkTable = (tags: string[], reach: string) => tags.map((h) => `| ${h} | ${reach} |`).join("\n");

  return `# ✅ Hashtag Strategy Generated Successfully

## Hashtag Overview
| Property | Value |
|----------|-------|
| **Topic** | ${topic} |
| **Platform** | ${platform} |
| **Total Hashtags** | ${all.length} |
| **Selected** | ${selected.length} |
| **Platform Limit** | ${limit} |

## 🎯 Recommended Hashtags
\`\`\`
${selected.join(" ")}
\`\`\`

## Tier 1: Popular Hashtags (1M+ Reach)
| Hashtag | Est. Reach |
|---------|------------|
${mkTable(popTags, "1M+")}

**Strategy**: Use 3-5 popular hashtags for maximum visibility

## Tier 2: Growing Hashtags (100K-1M Reach)
| Hashtag | Est. Reach |
|---------|------------|
${mkTable(growTags, "100K-1M")}

**Strategy**: Use 4-6 growing hashtags for balanced reach

## Tier 3: Niche Hashtags (<100K Reach)
| Hashtag | Est. Reach |
|---------|------------|
${mkTable(nicheTags, "<100K")}

**Strategy**: Use 3-5 niche hashtags for targeted engagement

## Platform-Specific Guidelines

### Instagram
- **Optimal**: 20-30 hashtags per post
- **Mix**: 10 popular + 10 growing + 10 niche
- **Placement**: First comment or caption
- **Rotation**: Change hashtags every 3-5 posts

### TikTok
- **Optimal**: 5-15 hashtags per video
- **Mix**: 3 popular + 5 growing + 7 niche
- **Trending**: Check Discover page daily

### LinkedIn
- **Optimal**: 3-5 hashtags per post
- **Mix**: 2 popular + 2 growing + 1 niche
- **Professional**: Focus on industry terms

### Twitter/X
- **Optimal**: 1-2 hashtags per tweet
- **Mix**: 1 popular + 1 niche
- **Trending**: Join relevant conversations

### YouTube
- **Optimal**: 10-15 hashtags per video
- **Mix**: 4 popular + 6 growing + 5 niche
- **Description**: Place in video description

## Hashtag Performance Metrics

### Engagement Rates by Tier
| Tier | Avg. Engagement | Best Time | Reach Potential |
|------|-----------------|-----------|-----------------|
| Popular | 1.2-2.5% | 9-11 AM | Very High |
| Growing | 2.5-4.8% | 12-2 PM | High |
| Niche | 4.8-8.2% | 7-9 PM | Medium |

### Hashtag Mix Formula
| Platform | Popular | Growing | Niche |
|----------|---------|---------|-------|
| Instagram | 33% | 33% | 34% |
| TikTok | 20% | 33% | 47% |
| LinkedIn | 40% | 40% | 20% |
| Twitter | 50% | 50% | 0% |
| YouTube | 27% | 40% | 33% |

## Hashtag Research Tips

### Finding Trending Hashtags
1. **Platform Search**: Use search bar to find related tags
2. **Competitor Analysis**: Check what competitors use
3. **Hashtag Tools**: Use Hashtagify, RiteTag, AllHashtag
4. **Industry Events**: Monitor conference hashtags
5. **Seasonal Trends**: Track holiday/event hashtags

### Hashtag Optimization
1. **Relevance**: Ensure hashtags match content
2. **Specificity**: Balance broad and specific tags
3. **Branded**: Create unique branded hashtags
4. **Community**: Use community hashtags for engagement
5. **Location**: Add location tags for local reach

## Hashtag Calendar

### Daily Rotation
| Day | Theme | Focus Hashtags |
|-----|-------|----------------|
| Monday | Motivation | #MondayMotivation, #GoalSetting |
| Tuesday | Tips | #TuesdayTips, #HowTo |
| Wednesday | Wisdom | #WednesdayWisdom, #ProTips |
| Thursday | Throwback | #ThrowbackThursday, #TBT |
| Friday | Fun | #FridayFeeling, #WeekendVibes |
| Saturday | Showcase | #SaturdayShowcase |
| Sunday | Self-care | #SundayVibes, #SelfCare |

## Performance Tracking

### Key Metrics to Monitor
| Metric | Target | How to Track |
|--------|--------|--------------|
| Reach | +20% monthly | Platform analytics |
| Engagement | 3-5% | Likes/comments/shares |
| Follower Growth | 5-10% monthly | Follower count |
| Hashtag Performance | Top 10 | Hashtag analytics |

## Next Steps
1. ✅ Copy the recommended hashtags above
2. ✅ Save to your hashtag library
3. ✅ Test different combinations
4. ✅ Track performance weekly
5. ✅ Update strategy monthly`;
}

export function generateSocialCaption(topic: string, platform: string, tone: string): string {
  if (!topic) {
    return `# ❌ Social Caption Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Topic is required

## Usage
\`\`\`typescript
generateSocialCaption("digital marketing tips", "instagram", "professional")
\`\`\``;
  }

  const p = platform.toLowerCase();
  const t = tone.toLowerCase();
  const ht = (s: string) => s.replace(/\s+/g, "").toLowerCase();

  const captions: Record<string, string[]> = {
    professional: [
      `🎯 **${topic}**: The key to success in today's digital landscape is understanding your audience deeply.\n\n✅ Data-driven decisions\n✅ Strategic planning\n✅ Consistent execution\n✅ Measurable results\n\nWhat's your biggest challenge with ${topic.toLowerCase()}? Comment below 👇\n\n#${ht(topic)} #digitalmarketing #success #growth`,
      `💡 **Pro Tip on ${topic}**\n\nAfter analyzing 500+ campaigns, here's what works:\n\n1️⃣ Start with clear objectives\n2️⃣ Know your target audience\n3️⃣ Create compelling content\n4️⃣ Test and optimize continuously\n\nThe difference between good and great is attention to detail.\n\n#marketingtips #${ht(topic)} #strategy`,
      `🚀 **${topic} Masterclass**\n\nWant to level up your ${topic.toLowerCase()} game? Here's your roadmap:\n\n📊 Phase 1: Research & Planning\n🎯 Phase 2: Strategy Development\n⚡ Phase 3: Execution\n📈 Phase 4: Analysis & Optimization\n\nWhich phase are you currently in?\n\n#${ht(topic)} #growthhacks #businessgrowth`,
      `✅ **${topic} Checklist**\n\n□ Define your goals\n□ Research your market\n□ Create your strategy\n□ Execute with precision\n□ Measure your results\n□ Optimize for better\n\nSave this for later! 🔖\n\n#${ht(topic)} #checklist #productivity`,
      `🏆 **${topic} Excellence**\n\nTop performers understand these principles:\n\n→ Quality over quantity\n→ Consistency beats intensity\n→ Data drives decisions\n→ Adaptability is key\n→ Never stop learning\n\nWhich principle resonates most with you?\n\n#${ht(topic)} #excellence #leadership`,
    ],
    casual: [
      `Hey everyone! 👋\n\nLet's talk about ${topic.toLowerCase()} real quick...\n\nHonestly? Most people overcomplicate this. Keep it simple:\n\n✨ Focus on what works\n✨ Don't chase every trend\n✨ Stay consistent\n✨ Have fun with it!\n\nWho else is working on this today? 🙋‍♀️\n\n#${ht(topic)} #marketinglife #mondayvibes`,
      `So I was thinking about ${topic.toLowerCase()} today... 🤔\n\nAnd you know what? The secret is actually pretty simple:\n\n1. Show up every day\n2. Be genuinely helpful\n3. Don't take yourself too seriously\n4. Enjoy the journey!\n\nLife's too short to stress about metrics all the time 📊\n\n#${ht(topic)} #realmarketing #authenticity`,
      `Real talk about ${topic.toLowerCase()} 🗣️\n\nStop overthinking it. Seriously.\n\nHere's what actually matters:\n\n→ Being authentic\n→ Providing value\n→ Building relationships\n→ Staying consistent\n\nThat's literally it. Everything else is just noise.\n\nAgree? Drop a 🙌\n\n#${ht(topic)} #realtalk #marketingtruth`,
      `Okay, can we normalize talking about ${topic.toLowerCase()} openly? 🙈\n\nBecause here's the thing:\n\n• It's okay to not know everything\n• It's okay to make mistakes\n• It's okay to ask for help\n• It's okay to take breaks\n\nWe're all figuring it out as we go! 💪\n\n#${ht(topic)} #vulnerable #honestmarketing`,
      `POV: You finally figured out ${topic.toLowerCase()} 😅\n\nAfter months of trial and error, here's what clicked:\n\n🎯 Focus > Perfection\n⏰ Consistency > Intensity\n🤝 Relationships > Transactions\n📈 Growth > Vanity metrics\n\nIf you're struggling, keep going. You got this! 💪\n\n#${ht(topic)} #growthmindset #nevergiveup`,
    ],
    humorous: [
      `Me explaining ${topic.toLowerCase()} to my non-marketer friends: 🤓\n\n"It's like... you know when you post something and hope people like it? But with more data and less crying into your coffee ☕"\n\nAnyone else? Just me? 😂\n\n#${ht(topic)} #marketerlife #relatable`,
      `${topic.charAt(0).toUpperCase() + topic.slice(1)} tips nobody asked for but everyone needs:\n\n1. Your logo doesn't need to be redesigned AGAIN\n2. No, posting 5x a day won't help if the content is garbage\n3. The algorithm isn't against you, your content just isn't good\n4. Take. A. Break. 🧘‍♂️\n\nYou're welcome 😎\n\n#${ht(topic)} #marketinghumor #truthbomb`,
      `Nobody:\nAbsolutely nobody:\nMy brain at 3 AM: "What if we tried this ${topic.toLowerCase()} strategy?" 🧠\n\n*proceeds to not sleep for 3 days building the most overcomplicated marketing funnel ever*\n\n*it gets 12 views*\n\nWorth it. Definitely worth it. 🏆\n\n#${ht(topic)} #marketerthings #insomnia`,
      `Stages of ${topic.toLowerCase()}:\n\n1. 🤩 "This is going to be amazing!"\n2. 😓 "Why is this so hard?"\n3. 😭 "I'm a failure"\n4. 🤔 "Wait, I think I see something"\n5. 🎉 "IT WORKS!"\n6. 😴 "Never doing that again"\n\n*2 weeks later... back to stage 1*\n\n#${ht(topic)} #marketingstruggles #relatablecontent`,
      `My ${topic.toLowerCase()} strategy be like:\n\nStep 1: Research for 3 months 📚\nStep 2: Plan for 2 months 📝\nStep 3: Overthink for 1 month 🤔\nStep 4: Finally launch 🚀\nStep 5: Realize I forgot something obvious 😅\nStep 6: Fix it in 5 minutes 🔧\n\n*Marketing is fun they said...*\n\n#${ht(topic)} #marketerslife #funnybuttrue`,
    ],
    inspirational: [
      `✨ ${topic.charAt(0).toUpperCase() + topic.slice(1)}: Your Journey to Success Starts Today ✨\n\nRemember:\n\n🌟 Every expert was once a beginner\n🌟 Every success story started with a single step\n🌟 Every setback is a setup for a comeback\n🌟 You are capable of amazing things\n\nStart where you are. Use what you have. Do what you can.\n\n#${ht(topic)} #inspiration #motivation #success`,
      `🚀 **The Power of ${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\n"Success is not final, failure is not fatal: it is the courage to continue that counts."\n\nYour journey matters. Your effort matters. YOU matter.\n\nKeep pushing. Keep learning. Keep growing.\n\nThe world needs what you have to offer. 💪\n\n#${ht(topic)} #nevergiveup #growthmindset #believe`,
      `💫 **A Reminder About ${topic.charAt(0).toUpperCase() + topic.slice(1)}**\n\nYou are not behind. You are exactly where you need to be.\n\nEvery small step forward is still progress.\n\n• Celebrate your wins 🎉\n• Learn from your losses 📚\n• Trust the process 🙏\n• Stay true to yourself 💖\n\nYour time will come. Keep going. ⭐\n\n#${ht(topic)} #keepgoing #believeinyourself #journey`,
      `✨ **${topic.charAt(0).toUpperCase() + topic.slice(1)} Wisdom** ✨\n\n"Don't watch the clock; do what it does. Keep going."\n\nEvery day is a new opportunity to:\n\n→ Learn something new 📖\n→ Help someone else 🤝\n→ Grow as a person 🌱\n→ Make a difference 🌍\n\nYou have the power to create the life and career you want. Believe it. 🙌\n\n#${ht(topic)} #dailyinspiration #growth #purpose`,
      `🌟 **Your ${topic.charAt(0).toUpperCase() + topic.slice(1)} Journey** 🌟\n\nToday, remember:\n\nYou are braver than you believe.\nYou are stronger than you seem.\nYou are smarter than you think.\nYou are loved more than you know.\n\nNow go out there and make today count! 💪✨\n\n#${ht(topic)} #believeinyourself #youareamazing #keepshining`,
    ],
  };

  const vars = captions[t] || captions.professional;
  const platformGuide: Record<string, string> = {
    instagram: "Instagram: Long-form captions (up to 2,200 characters), line breaks for readability, hashtags in first comment",
    tiktok: "TikTok: Short, punchy captions (100-150 characters), trending hashtags, call-to-action",
    linkedin: "LinkedIn: Professional tone, story-driven, 1,300 characters max, 3-5 hashtags",
    twitter: "Twitter: Concise (280 characters), thread-friendly, 1-2 hashtags",
    youtube: "YouTube: Descriptive titles, SEO-friendly, timestamps, links in description",
  };

  return `# ✅ Social Caption Generated Successfully

## Caption Overview
| Property | Value |
|----------|-------|
| **Topic** | ${topic} |
| **Platform** | ${platform} |
| **Tone** | ${tone} |
| **Variations** | ${vars.length} |
| **Platform Guide** | ${platformGuide[p] || platformGuide.instagram} |

## Caption Variations

### Variation 1
${vars[0]}

---

### Variation 2
${vars[1]}

---

### Variation 3
${vars[2]}

---

### Variation 4
${vars[3]}

---

### Variation 5
${vars[4]}

---

## Platform-Specific Optimization

### Instagram
| Element | Recommendation |
|---------|----------------|
| **Length** | 150-300 characters for feed |
| **Line Breaks** | Use for readability |
| **Hashtags** | 20-30 in first comment |
| **Emojis** | 3-5 per caption |
| **CTA** | "Link in bio", "Comment below" |

### TikTok
| Element | Recommendation |
|---------|----------------|
| **Length** | 100-150 characters |
| **Hashtags** | 3-5 trending tags |
| **Emojis** | 2-3 per caption |
| **CTA** | "Follow for more", "Comment" |
| **Tone** | Casual, relatable |

### LinkedIn
| Element | Recommendation |
|---------|----------------|
| **Length** | 1,000-1,300 characters |
| **Hashtags** | 3-5 professional tags |
| **Emojis** | Minimal (1-2) |
| **CTA** | "What do you think?" |
| **Tone** | Professional, insightful |

### Twitter/X
| Element | Recommendation |
|---------|----------------|
| **Length** | 200-280 characters |
| **Hashtags** | 1-2 relevant tags |
| **Emojis** | 1-2 max |
| **CTA** | "Retweet if you agree" |
| **Tone** | Conversational, witty |

### YouTube
| Element | Recommendation |
|---------|----------------|
| **Length** | 200-500 characters |
| **Hashtags** | 3-5 in description |
| **Emojis** | Minimal |
| **CTA** | "Subscribe", "Like", "Comment" |
| **Tone** | Educational, engaging |

## Tone Analysis

| Tone | Best For | Engagement | Brand Voice |
|------|----------|------------|-------------|
| **Professional** | B2B, corporate | Medium-high | Authoritative |
| **Casual** | Lifestyle, personal | High | Relatable |
| **Humorous** | Entertainment, viral | Very high | Fun, playful |
| **Inspirational** | Coaching, wellness | High | Uplifting, positive |

## Copywriting Frameworks Used

### AIDA Framework
- **Attention**: Hook with strong opening
- **Interest**: Build curiosity
- **Desire**: Create emotional connection
- **Action**: Clear CTA

### PAS Framework
- **Problem**: Identify pain point
- **Agitation**: Amplify the problem
- **Solution**: Present your answer

### BAB Framework
- **Before**: Current situation
- **After**: Desired outcome
- **Bridge**: How to get there

## Emoji Usage Guide

### High-Performing Emojis by Platform
| Platform | Best Emojis | Avoid |
|----------|-------------|-------|
| Instagram | 🎯 ✨ 🔥 💡 📊 | 🙏 (overused) |
| TikTok | 😂 🔥 👀 ✨ 💯 | 💼 (too formal) |
| LinkedIn | 🚀 📈 💡 ✅ 🎯 | 😂 (too casual) |
| Twitter | 🔥 👀 💯 🎯 ✅ | ❌ (negative) |
| YouTube | 👍 🔔 📺 ⭐ 🎬 | 🙏 (overused) |

## A/B Testing Variations

### Test 1: Hook Style
- **Version A**: Question-based hook
- **Version B**: Statement-based hook

### Test 2: CTA Placement
- **Version A**: CTA at beginning
- **Version B**: CTA at end

### Test 3: Emoji Count
- **Version A**: Heavy emoji use
- **Version B**: Minimal emojis

## Performance Metrics

### Expected Engagement Rates
| Platform | Average | Good | Excellent |
|----------|---------|------|-----------|
| Instagram | 1.5-3% | 3-6% | 6%+ |
| TikTok | 3-5% | 5-10% | 10%+ |
| LinkedIn | 1-2% | 2-4% | 4%+ |
| Twitter | 0.5-1% | 1-3% | 3%+ |
| YouTube | 2-4% | 4-8% | 8%+ |

## Next Steps
1. ✅ Choose your favorite variation
2. ✅ Customize for your brand voice
3. ✅ Add your unique perspective
4. ✅ Schedule for optimal posting time
5. ✅ Monitor engagement and iterate`;
}

export function generateEmailSubject(topic: string, audience: string, goal: string): string {
  if (!topic) {
    return `# ❌ Email Subject Line Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Topic is required

## Usage
\`\`\`typescript
generateEmailSubject("product launch", "existing customers", "increase sales")
\`\`\``;
  }

  const tp = topic.charAt(0).toUpperCase() + topic.slice(1);
  const subjects = [
    `🚀 ${tp}: Your Exclusive Early Access`,
    `${tp} is here - and you're first in line`,
    `Don't miss this: ${tp}`,
    `${tp} 🔥 Limited time offer inside`,
    `[${tp}] 50% off for 24 hours only`,
    `Quick question about ${topic.toLowerCase()}`,
    `${tp}: A game-changer for ${audience.toLowerCase()}`,
    `You asked, we listened: ${tp}`,
    `⚡ Breaking: ${tp} just dropped`,
    `${tp} + ${audience.charAt(0).toUpperCase() + audience.slice(1)} = Magic ✨`,
    `[Last chance] ${tp} deal ends tonight`,
    `How ${topic.toLowerCase()} can 10x your ${goal.toLowerCase()}`,
    `The ${topic.toLowerCase()} playbook you've been waiting for`,
    `${tp}: Inside scoop for ${audience.toLowerCase()}`,
    `Your ${topic.toLowerCase()} blueprint (free download)`,
  ];

  const abPairs = [
    { a: subjects[0], b: subjects[1], rationale: "Emoji vs no emoji - test visual appeal" },
    { a: subjects[2], b: subjects[3], rationale: "Direct vs curiosity-driven" },
    { a: subjects[5], b: subjects[6], rationale: "Personal question vs value proposition" },
    { a: subjects[8], b: subjects[9], rationale: "Urgency vs benefit-focused" },
    { a: subjects[10], b: subjects[11], rationale: "Scarcity vs education" },
  ];

  const analysis = subjects.map((s, i) => {
    const chars = s.length;
    const emoji = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(s);
    const score = Math.min(100, 40 + (chars <= 50 ? 20 : chars <= 60 ? 15 : 10) + (emoji ? 10 : 0) + (/\d/.test(s) ? 5 : 0) + (/[:]/.test(s) ? 5 : 0));
    return { n: i + 1, s: s.substring(0, 45) + (s.length > 45 ? "..." : ""), chars, emoji, score };
  });

  const rows = analysis.map((a) => `| ${a.n} | ${a.s} | ${a.chars} | ${a.emoji ? "✅" : "❌"} | ${a.score}/100 |`).join("\n");

  return `# ✅ Email Subject Lines Generated Successfully

## Subject Line Overview
| Property | Value |
|----------|-------|
| **Topic** | ${topic} |
| **Audience** | ${audience} |
| **Goal** | ${goal} |
| **Total Variations** | ${subjects.length} |
| **A/B Test Pairs** | ${abPairs.length} |
| **Optimal Length** | 40-60 characters |

## All Subject Lines

${subjects.map((s, i) => `${i + 1}. ${s}`).join("\n")}

## Character Count Analysis

| # | Subject Line | Chars | Emoji | Score |
|---|--------------|-------|-------|-------|
${rows}

## A/B Test Pairs

${abPairs.map((p, i) => `### Test ${i + 1}: ${p.rationale}
- **Version A**: ${p.a}
- **Version B**: ${p.b}
`).join("\n")}

## Subject Line Formulas

### Curiosity Gap
- "The ${topic.toLowerCase()} secret nobody tells you"
- "Why ${audience.toLowerCase()} are switching to ${topic.toLowerCase()}"
- "You won't believe what ${topic.toLowerCase()} just did"

### Urgency/Scarcity
- "Last 24 hours: ${tp} deal"
- "Only ${Math.floor(Math.random() * 50 + 10)} spots left"
- "Expires tonight: ${tp} offer"

### Social Proof
- "${Math.floor(Math.random() * 5000 + 1000)}+ ${audience.toLowerCase()} already switched"
- "Join 10,000+ ${audience.toLowerCase()} using ${topic.toLowerCase()}"
- "See why ${audience.toLowerCase()} love ${topic.toLowerCase()}"

### Personalization
- "[First Name], your ${topic.toLowerCase()} guide is ready"
- "Custom ${topic.toLowerCase()} plan for ${audience.toLowerCase()}"
- "Your ${goal.toLowerCase()} blueprint inside"

### Value Proposition
- "How to ${goal.toLowerCase()} with ${topic.toLowerCase()}"
- "Free: ${tp} toolkit"
- "The ${topic.toLowerCase()} checklist you need"

## Character Count Guidelines

| Platform | Optimal | Max | Mobile Preview |
|----------|---------|-----|----------------|
| Gmail | 40-50 | 70 | ~35 chars |
| Outlook | 40-50 | 60 | ~30 chars |
| Apple Mail | 40-50 | 65 | ~35 chars |
| Yahoo | 40-50 | 60 | ~30 chars |
| Mobile | 30-40 | 50 | ~25 chars |

## Emoji Usage Statistics

### Open Rate Impact
| Emoji Type | Open Rate Change | Best Use |
|------------|------------------|----------|
| 🚀 Rocket | +15-25% | Launches, growth |
| 🔥 Fire | +12-20% | Hot deals, trending |
| ⚡ Lightning | +10-18% | Speed, urgency |
| 🎯 Target | +8-15% | Goals, precision |
| 💡 Lightbulb | +8-15% | Tips, ideas |
| ⏰ Clock | +10-20% | Time-sensitive |
| 🎁 Gift | +12-22% | Free offers |
| ✅ Checkmark | +5-12% | Confirmation |

### Industry Benchmarks
| Industry | Avg. Open Rate | Top Performers |
|----------|----------------|----------------|
| E-commerce | 15.6% | 25%+ |
| Technology | 13.4% | 22%+ |
| Finance | 12.8% | 20%+ |
| Healthcare | 14.2% | 23%+ |
| Education | 16.5% | 28%+ |

## Urgency Techniques

### Time-Based
- "Ends tonight at midnight"
- "24-hour flash sale"
- "Last chance before price increase"
- "Only 3 hours left"

### Quantity-Based
- "Only 50 spots available"
- "Limited edition: 100 only"
- "First 100 signups get bonus"
- "Inventory running low"

### Exclusivity-Based
- "Invite only: ${audience.toLowerCase()}"
- "VIP early access for ${audience.toLowerCase()}"
- "Private launch for subscribers"
- "Members-only deal"

## Personalization Elements

### Dynamic Fields
- {{first_name}} - Subscriber's first name
- {{company}} - Company name
- {{location}} - City/region
- {{last_purchase}} - Previous purchase

### Behavioral Triggers
- Welcome series
- Abandoned cart
- Re-engagement
- Post-purchase
- Birthday/anniversary

## Deliverability Tips

### ✅ Do's
- Keep under 50 characters
- Avoid ALL CAPS
- Limit punctuation (!!!)
- Use real words
- Match preview text

### ❌ Don'ts
- Don't use spam words (free, guarantee)
- Don't mislead
- Don't use excessive emojis
- Don't forget mobile preview
- Don't skip A/B testing

## Metrics to Track

| Metric | Target | How to Improve |
|--------|--------|----------------|
| Open Rate | 20%+ | Better subject lines |
| Click Rate | 2-5% | Relevant content |
| Unsubscribe | <0.5% | Set expectations |
| Spam Complaints | <0.1% | Easy opt-out |
| Reply Rate | 1-3% | Ask questions |

## Next Steps
1. ✅ Choose top 3 subject lines
2. ✅ Set up A/B test pairs
3. ✅ Test with small segment first
4. ✅ Measure open rates after 24h
5. ✅ Use winning version for full list`;
}

export function generateCTA(product: string, goal: string, style: string): string {
  if (!product) {
    return `# ❌ CTA Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Product is required

## Usage
\`\`\`typescript
generateCTA("marketing software", "increase conversions", "button")
\`\`\``;
  }

  const s = style.toLowerCase();
  const tp = product.charAt(0).toUpperCase() + product.slice(1);
  const gp = goal.charAt(0).toUpperCase() + goal.slice(1);

  const ctas: Record<string, string[]> = {
    button: [
      `🚀 Start Free Trial`,
      `Get ${tp} Now`,
      `Try ${tp} Free`,
      `Start Building Today`,
      `See It In Action`,
      `Get Started →`,
      `Claim Your Free Account`,
      `Unlock Full Access`,
      `Join 10,000+ Users`,
      `Start Your Journey`,
      `Experience the Difference`,
      `Level Up Your ${gp}`,
      `Get Instant Access`,
      `See Pricing`,
      `Book a Demo`,
    ],
    link: [
      `Learn more about ${tp} →`,
      `Discover how ${tp} can help →`,
      `See how it works →`,
      `Watch the demo →`,
      `Read customer stories →`,
      `Compare plans →`,
      `View features →`,
      `Start your free trial →`,
      `Get started in 2 minutes →`,
      `See pricing details →`,
      `Watch video tutorial →`,
      `Download free guide →`,
      `Join our community →`,
      `Book a consultation →`,
      `Explore integrations →`,
    ],
    popup: [
      `🎁 Get 20% Off ${tp} - Enter Your Email`,
      `Free ${tp} Guide - Download Now`,
      `Exclusive Offer: Try ${tp} Free for 30 Days`,
      `Limited Time: ${tp} Special Pricing`,
      `Join 10,000+ Success Stories - Start Free`,
      `Your ${gp} Blueprint Awaits`,
      `Don't Miss Out: ${tp} Deal`,
      `Get Personalized ${tp} Demo`,
      `Free Consultation: Maximize Your ${gp}`,
      `VIP Access: ${tp} Beta Program`,
      `Instant Access: ${tp} Toolkit`,
      `Surprise Bonus: ${tp} Premium Features`,
      `Last Chance: ${tp} Launch Offer`,
      `Members Only: ${tp} Masterclass`,
      `Claim Your Spot: ${tp} Webinar`,
    ],
    banner: [
      `🎉 Special Offer: ${tp} - ${Math.floor(Math.random() * 30 + 20)}% Off Today Only!`,
      `🚀 ${tp}: Transform Your ${gp} - Try Free`,
      `⚡ Limited Time: Get ${tp} Premium at Starter Price`,
      `🏆 #1 Rated ${tp} - Start Free Trial`,
      `💡 The Smart Way to ${gp} - See ${tp} in Action`,
      `🎯 ${tp}: Your ${gp} Solution - Learn More`,
      `✨ Join 10,000+ Happy ${tp} Users - Start Today`,
      `🔥 Hot Deal: ${tp} Annual Plan - Save 40%`,
      `💼 Professional ${tp} for Serious ${gp} - Get Started`,
      `📈 See Why ${tp} Delivers ${gp} - Free Demo`,
      `🎓 ${tp} + Free Training: Master Your ${gp}`,
      `🌟 ${tp} Pro: Advanced Features for Maximum ${gp}`,
      `⏰ Flash Sale: ${tp} - Ends Midnight`,
      `🎁 Holiday Special: ${tp} Bundle - Limited Availability`,
      `💎 Premium ${tp} Experience - Exclusive Access`,
    ],
  };

  const items = ctas[s] || ctas.button;
  const verbCategories: Record<string, string[]> = {
    urgency: ["Get", "Claim", "Join", "Start", "Try", "Unlock", "Discover", "Experience"],
    value: ["Save", "Learn", "Grow", "Improve", "Optimize", "Transform", "Master", "Build"],
    social: ["Join", "Connect", "Network", "Collaborate", "Share", "Compare", "Review"],
    curiosity: ["See", "Watch", "Explore", "Discover", "Find", "Learn", "Understand"],
  };

  const verbRows = Object.entries(verbCategories).map(([cat, verbs]) => `| **${cat.charAt(0).toUpperCase() + cat.slice(1)}** | ${verbs.join(", ")} |`).join("\n");

  return `# ✅ CTA Generated Successfully

## CTA Overview
| Property | Value |
|----------|-------|
| **Product** | ${product} |
| **Goal** | ${goal} |
| **Style** | ${style} |
| **Total Variations** | ${items.length} |
| **Optimal Length** | 2-5 words (button), 5-10 words (link) |

## All CTA Variations

${items.map((c, i) => `${i + 1}. ${c}`).join("\n")}

## CTA Style Guide

### Button CTAs
| Element | Best Practice |
|---------|---------------|
| **Length** | 2-5 words |
| **Action** | Start, Get, Try, Join |
| **Urgency** | Now, Today, Instantly |
| **Value** | Free, Exclusive, Premium |
| **Design** | High contrast, clear CTA |

### Link CTAs
| Element | Best Practice |
|---------|---------------|
| **Length** | 5-10 words |
| **Action** | Learn, Discover, See, Watch |
| **Arrow** | → for visual direction |
| **Context** | Brief value proposition |
| **Placement** | Within content flow |

### Popup CTAs
| Element | Best Practice |
|---------|---------------|
| **Length** | 8-15 words |
| **Headline** | Attention-grabbing |
| **Value** | Clear benefit |
| **Urgency** | Time-limited offers |
| **Exit** | Easy close button |

### Banner CTAs
| Element | Best Practice |
|---------|---------------|
| **Length** | 10-20 words |
| **Headline** | Bold statement |
| **Subtext** | Supporting detail |
| **Button** | Clear action |
| **Design** | Eye-catching colors |

## Action Verb Analysis

| Category | Verbs |
|----------|-------|
${verbRows}

## Urgency vs Value Tradeoffs

### High Urgency, Lower Value
- "Buy Now"
- "Limited Time"
- "Don't Miss Out"
- "Last Chance"

### Balanced Urgency + Value
- "Start Free Trial"
- "Get Instant Access"
- "Claim Your Spot"
- "Join Now"

### High Value, Lower Urgency
- "Learn More"
- "See How It Works"
- "Explore Features"
- "Watch Demo"

### Premium Value, No Urgency
- "Schedule a Consultation"
- "Get a Custom Quote"
- "Book a Demo"
- "Contact Sales"

## Conversion Rate Benchmarks

| CTA Type | Avg. CTR | Top Performers |
|----------|----------|----------------|
| Button | 3-5% | 8%+ |
| Link | 1-3% | 5%+ |
| Popup | 2-4% | 7%+ |
| Banner | 0.5-1.5% | 3%+ |

## A/B Testing Framework

### Test 1: Action Verb
- **A**: "Start Free Trial"
- **B**: "Get Free Trial"

### Test 2: Urgency Level
- **A**: "Try Now"
- **B**: "Try Free"

### Test 3: Value Proposition
- **A**: "Start Building"
- **B**: "Start Growing"

### Test 4: Social Proof
- **A**: "Join Us"
- **B**: "Join 10,000+ Users"

### Test 5: Personalization
- **A**: "Get Started"
- **B**: "Start Your Journey"

## Psychology Behind CTAs

### Loss Aversion
People fear losing more than they enjoy gaining:
- "Don't miss out"
- "Last chance"
- "Before it's gone"

### Social Proof
People follow others' actions:
- "Join 10,000+ users"
- "Most popular choice"
- "Recommended by experts"

### Reciprocity
Give first, then ask:
- "Free guide"
- "No credit card required"
- "Try before you buy"

### Scarcity
Limited availability increases desire:
- "Only 50 spots left"
- "Limited time offer"
- "Exclusive access"

## Placement Best Practices

### Above the Fold
- Primary CTA
- High visibility
- Clear value proposition

### Within Content
- Contextual CTAs
- Relevant to content
- Natural flow

### End of Content
- Summary CTA
- Reinforce value
- Clear next step

## Mobile Optimization

### Touch-Friendly
- Minimum 44x44px buttons
- Adequate spacing
- Easy thumb reach

### Readable
- Large text
- High contrast
- Clear hierarchy

## Next Steps
1. ✅ Choose top 5 CTA variations
2. ✅ A/B test with your audience
3. ✅ Track click-through rates
4. ✅ Optimize based on data
5. ✅ Iterate monthly`;
}

export function generateHeadline(product: string, audience: string, style: string): string {
  if (!product) {
    return `# ❌ Headline Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Product is required

## Usage
\`\`\`typescript
generateHeadline("marketing software", "small businesses", "power words")
\`\`\``;
  }

  const tp = product.charAt(0).toUpperCase() + product.slice(1);
  const ap = audience.charAt(0).toUpperCase() + audience.slice(1);

  const headlines = [
    `How ${tp} Helps ${ap} Achieve Explosive Growth`,
    `${tp}: The Ultimate Solution for ${ap} Who Want Results`,
    `Why Smart ${ap} Are Switching to ${tp}`,
    `The ${tp} Advantage: Transform Your Business Today`,
    `${tp} vs. The Competition: Why We Win`,
    `Unlock Your Potential with ${tp}`,
    `${tp}: The Secret Weapon for ${ap}`,
    `Stop Struggling, Start Thriving with ${tp}`,
    `${tp}: Where ${ap} Meet Success`,
    `The Complete Guide to ${tp} for ${ap}`,
    `${tp}: The ${ap}'s Edge`,
    `Revolutionize Your Approach with ${tp}`,
    `${tp}: Built for ${ap} Who Demand Excellence`,
    `The Future of ${tp} Is Here: Are You Ready?`,
    `${tp}: Your Path to Unstoppable Growth`,
  ];

  function getFormula(h: string): string {
    const l = h.toLowerCase();
    if (l.startsWith("how")) return "How-To";
    if (l.includes("why")) return "Why";
    if (l.includes("vs")) return "Versus";
    if (l.includes("secret")) return "Secret";
    if (l.includes("?")) return "Question";
    if (l.includes(":")) return "Colon";
    if (l.includes("the")) return "The";
    return "Statement";
  }

  const analysis = headlines.map((h, i) => {
    const chars = h.length;
    const pw = ["ultimate", "secret", "proven", "exclusive", "free", "guaranteed", "instant", "new", "revolutionary", "breakthrough"].some((w) => h.toLowerCase().includes(w));
    return { n: i + 1, h: h.substring(0, 50) + (h.length > 50 ? "..." : ""), chars, formula: getFormula(h), pw };
  });

  const rows = analysis.map((a) => `| ${a.n} | ${a.h} | ${a.chars} | ${a.formula} | ${a.pw ? "✅" : "❌"} |`).join("\n");

  return `# ✅ Headlines Generated Successfully

## Headline Overview
| Property | Value |
|----------|-------|
| **Product** | ${product} |
| **Audience** | ${audience} |
| **Style** | ${style} |
| **Total Headlines** | ${headlines.length} |
| **Optimal Length** | 6-12 words (50-60 chars) |

## All Headlines

${headlines.map((h, i) => `${i + 1}. ${h}`).join("\n")}

## Headline Analysis

| # | Headline | Chars | Formula | Power Word |
|---|----------|-------|---------|------------|
${rows}

## Copywriting Formulas

### AIDA (Attention, Interest, Desire, Action)
1. **Attention**: Hook with strong opening
2. **Interest**: Build curiosity
3. **Desire**: Create emotional connection
4. **Action**: Clear call to action

### PAS (Problem, Agitation, Solution)
1. **Problem**: Identify pain point
2. **Agitation**: Amplify the problem
3. **Solution**: Present your answer

### BAB (Before, After, Bridge)
1. **Before**: Current situation
2. **After**: Desired outcome
3. **Bridge**: How to get there

### 4 U's (Useful, Urgent, Unique, Ultra-specific)
1. **Useful**: Provides value
2. **Urgent**: Time-sensitive
3. **Unique**: Differentiates
4. **Ultra-specific**: Clear benefit

## Power Words Analysis

### Curiosity
- Secret, Hidden, Little-known, Surprising
- What, How, Why, When, Where, Who

### Urgency
- Now, Today, Limited, Hurry, Fast, Quick, Instant
- Deadline, Last chance, Before, Until

### Exclusivity
- Exclusive, Premium, VIP, Elite, Special, Private
- Members-only, Invite-only, Limited

### Value
- Free, Bonus, Gift, Save, Discount, Deal
- Proven, Guaranteed, Certified, Trusted

### Emotion
- Amazing, Incredible, Stunning, Revolutionary
- Breakthrough, Game-changing, Life-changing

## Emotional Triggers

### Fear of Missing Out (FOMO)
- "Don't miss out"
- "Last chance"
- "Before it's gone"

### Desire for Status
- "Join the elite"
- "Premium experience"
- "For leaders"

### Need for Security
- "Guaranteed results"
- "Proven system"
- "Trusted by thousands"

### Curiosity Gap
- "The secret to..."
- "What nobody tells you"
- "The truth about..."

## Character Count Guidelines

| Platform | Optimal | Max | Mobile Preview |
|----------|---------|-----|----------------|
| Google Ads | 30 | 30 | 25-30 |
| Facebook | 40-60 | 80 | 40-50 |
| Instagram | 40-60 | 80 | 40-50 |
| LinkedIn | 40-60 | 80 | 40-50 |
| Twitter | 40-60 | 70 | 40-50 |
| YouTube | 50-70 | 100 | 50-60 |
| Blog | 50-60 | 70 | 50-60 |

## A/B Testing Framework

### Test 1: Formula
- **A**: How-To headline
- **B**: Question headline

### Test 2: Power Words
- **A**: "Ultimate" headline
- **B**: "Proven" headline

### Test 3: Length
- **A**: Short (5-7 words)
- **B**: Long (8-12 words)

### Test 4: Specificity
- **A**: General benefit
- **B**: Specific number/benefit

### Test 5: Emotional vs Rational
- **A**: Emotional trigger
- **B**: Logical benefit

## Performance Metrics

### Click-Through Rates
| Headline Type | Avg. CTR | Top Performers |
|---------------|----------|----------------|
| Number-based | 2.5-3.5% | 5%+ |
| How-to | 2-3% | 4%+ |
| Question | 1.5-2.5% | 4%+ |
| Command | 2-3% | 4.5%+ |
| News | 1.5-2.5% | 3.5%+ |

## Next Steps
1. ✅ Choose top 5 headlines
2. ✅ A/B test with your audience
3. ✅ Track click-through rates
4. ✅ Optimize based on data
5. ✅ Iterate monthly`;
}

export function generateAdCopy(product: string, platform: string, goal: string): string {
  if (!product) {
    return `# ❌ Ad Copy Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Product is required

## Usage
\`\`\`typescript
generateAdCopy("marketing software", "google", "increase conversions")
\`\`\``;
  }

  const p = platform.toLowerCase();
  const tp = product.charAt(0).toUpperCase() + product.slice(1);
  const gp = goal.charAt(0).toUpperCase() + goal.slice(1);

  const adData: Record<string, { headlines: string[]; descriptions: string[]; limits: { headline: number; description: number } }> = {
    google: {
      headlines: [
        `${tp} - Official Site`, `Try ${tp} Free`, `${tp} for ${gp}`, `${tp} - See Results`, `${tp} | Trusted by 10K+`,
        `${tp} - Start Today`, `${tp} - Best Value`, `${tp} - 50% Off`, `${tp} - Free Trial`, `${tp} - Get Started`,
        `${tp} - Proven Results`, `${tp} - Limited Offer`, `${tp} - #1 Rated`, `${tp} - Premium`, `${tp} - Fast Results`,
      ],
      descriptions: [
        `Transform your ${goal.toLowerCase()} with ${tp}. Start your free trial today and see results in 30 days. No credit card required.`,
        `Join 10,000+ businesses using ${tp} to ${goal.toLowerCase()}. Trusted, proven, and guaranteed to deliver results.`,
        `${tp} is the #1 solution for ${goal.toLowerCase()}. Get started in minutes, see results in days. Try free today.`,
        `Stop wasting time and money. ${tp} helps you ${goal.toLowerCase()} faster and more efficiently. Start now.`,
        `${tp} delivers measurable results for ${goal.toLowerCase()}. See why 10,000+ businesses trust us. Free trial.`,
      ],
      limits: { headline: 30, description: 90 },
    },
    facebook: {
      headlines: [
        `Discover ${tp}`, `${tp}: Your ${gp} Solution`, `Transform Your ${gp} Today`, `${tp} - See Results Fast`, `Join 10K+ Happy Users`,
        `${tp}: Free Trial`, `${tp} - Best Value`, `Start Your ${gp} Journey`, `${tp} Proven Results`, `${tp} - Limited Time`,
      ],
      descriptions: [
        `Ready to ${goal.toLowerCase()}? ${tp} helps you achieve more in less time. Start your free trial today!`,
        `Join thousands of businesses using ${tp} to ${goal.toLowerCase()}. See why we're #1 rated.`,
        `${tp} makes ${goal.toLowerCase()} easy. No technical skills needed. Try it free for 30 days.`,
        `Stop struggling with ${goal.toLowerCase()}. ${tp} gives you the tools to succeed. Get started now.`,
        `${tp}: The smart way to ${goal.toLowerCase()}. Trusted by 10,000+ businesses worldwide.`,
      ],
      limits: { headline: 40, description: 125 },
    },
    instagram: {
      headlines: [
        `${tp} 🔥`, `${gp} Made Easy ✨`, `Your ${gp} Solution 🚀`, `Join the ${tp} Family 💪`, `${tp}: Level Up 📈`,
        `Transform Your Results Today 🎯`, `${tp} Proven 🏆`, `Start Free, Stay Free ✅`, `${tp} Premium 🔥`, `Get Results Fast ⚡`,
      ],
      descriptions: [
        `✨ ${tp} helps you ${goal.toLowerCase()} like a pro.\n\n🚀 Start your free trial today!\n\n💡 No credit card required\n\n👉 Link in bio`,
        `🎯 Ready to ${goal.toLowerCase()}?\n\n${tp} is your secret weapon.\n\n💪 Join 10K+ users who transformed their results.\n\n🔗 Try it free now!`,
        `🔥 ${tp} = ${gp} made easy.\n\n✅ Free trial\n✅ No commitment\n✅ Results in 30 days\n\n👉 Get started today!`,
        `💡 The smart way to ${goal.toLowerCase()}?\n\n${tp}.\n\n🚀 Trusted by 10,000+ businesses\n📈 Proven results\n💎 Premium quality\n\n🔗 Link in bio`,
        `🎯 Stop struggling with ${goal.toLowerCase()}.\n\n${tp} gives you:\n✅ Better results\n✅ Less time\n✅ More growth\n\n👉 Start free today!`,
      ],
      limits: { headline: 40, description: 125 },
    },
    linkedin: {
      headlines: [
        `${tp}: The Professional's Choice`, `${gp} Excellence with ${tp}`, `${tp}: Enterprise-Grade Solution`, `Transform Your ${gp} Strategy`,
        `${tp}: Trusted by Industry Leaders`, `The ${tp} Advantage`, `${tp}: Proven ROI`, `${gp} Optimization Starts Here`,
        `${tp}: Professional Results`, `${tp} for Enterprise`,
      ],
      descriptions: [
        `Looking to ${goal.toLowerCase()}? ${tp} is trusted by Fortune 500 companies to deliver measurable results. See how.`,
        `${tp} helps professionals ${goal.toLowerCase()} with enterprise-grade features and proven methodologies. Learn more.`,
        `Join 10,000+ professionals using ${tp} to ${goal.toLowerCase()}. See why industry leaders choose us.`,
        `${tp}: The professional's choice for ${goal.toLowerCase()}. ROI-focused, results-driven, trusted worldwide.`,
        `Transform your ${goal.toLowerCase()} strategy with ${tp}. Enterprise features, startup agility. Start free trial.`,
      ],
      limits: { headline: 70, description: 100 },
    },
  };

  const d = adData[p] || adData.google;
  const hRows = d.headlines.map((h, i) => `| ${i + 1} | ${h} | ${h.length} | ${h.length <= d.limits.headline ? "✅" : "❌"} |`).join("\n");
  const descRows = d.descriptions.map((d2, i) => `| ${i + 1} | ${d2.substring(0, 60)}... | ${d2.length} | ${d2.length <= d.limits.description ? "✅" : "❌"} |`).join("\n");

  return `# ✅ Ad Copy Generated Successfully

## Ad Copy Overview
| Property | Value |
|----------|-------|
| **Product** | ${product} |
| **Platform** | ${platform} |
| **Goal** | ${goal} |
| **Headlines** | ${d.headlines.length} |
| **Descriptions** | ${d.descriptions.length} |
| **Headline Limit** | ${d.limits.headline} chars |
| **Description Limit** | ${d.limits.description} chars |

## Headlines

| # | Headline | Chars | Within Limit |
|---|----------|-------|--------------|
${hRows}

## Descriptions

| # | Description | Chars | Within Limit |
|---|-------------|-------|--------------|
${descRows}

## Platform-Specific Guidelines

### Google Ads
| Element | Limit | Best Practice |
|---------|-------|---------------|
| **Headline 1** | 30 chars | Include keyword |
| **Headline 2** | 30 chars | Unique value prop |
| **Headline 3** | 30 chars | CTA or social proof |
| **Description 1** | 90 chars | Benefits + CTA |
| **Description 2** | 90 chars | Features + proof |

### Facebook Ads
| Element | Limit | Best Practice |
|---------|-------|---------------|
| **Primary Text** | 125 chars | Hook in first line |
| **Headline** | 40 chars | Clear value prop |
| **Description** | 30 chars | Supporting detail |
| **CTA Button** | Varies | Match intent |

### Instagram Ads
| Element | Limit | Best Practice |
|---------|-------|---------------|
| **Primary Text** | 125 chars | Short, punchy |
| **Headline** | 40 chars | Eye-catching |
| **Description** | 30 chars | Brief detail |
| **Visual** | Required | High-quality image |

### LinkedIn Ads
| Element | Limit | Best Practice |
|---------|-------|---------------|
| **Headline** | 70 chars | Professional tone |
| **Intro Text** | 150 chars | Value proposition |
| **Description** | 70 chars | Supporting detail |
| **CTA** | Varies | Business-focused |

## A/B Testing Framework

### Test 1: Headline Style
- **A**: Benefit-focused
- **B**: Feature-focused

### Test 2: Description Length
- **A**: Short (50-70 chars)
- **B**: Long (80-120 chars)

### Test 3: CTA Placement
- **A**: CTA in headline
- **B**: CTA in description

### Test 4: Social Proof
- **A**: With numbers ("10K+ users")
- **B**: Without numbers

### Test 5: Emotional vs Rational
- **A**: Emotional appeal
- **B**: Logical benefits

## Ad Copy Formulas

### Before-After-Bridge
**Before**: "Struggling with ${goal.toLowerCase()}?"
**After**: "Imagine achieving [desired result]"
**Bridge**: "${tp} makes it possible"

### Problem-Agitate-Solve
**Problem**: "Tired of ${goal.toLowerCase()} taking too long?"
**Agitate**: "Every day wasted is money lost"
**Solve**: "${tp} accelerates your results"

### Features-Advantages-Benefits
**Features**: "${tp} includes [feature]"
**Advantages**: "This means you can [advantage]"
**Benefits**: "So you'll [benefit]"

## Conversion Optimization

### Headline Best Practices
- Include target keyword
- Highlight unique value
- Create urgency
- Use numbers/data
- Ask questions

### Description Best Practices
- Expand on headline
- Include social proof
- Address objections
- Clear CTA
- Benefits over features

### Visual Best Practices
- High-quality images
- Consistent branding
- Mobile-optimized
- A/B test creatives
- Use video when possible

## Performance Benchmarks

| Metric | Google | Facebook | Instagram | LinkedIn |
|--------|--------|----------|-----------|----------|
| **CTR** | 2-5% | 0.9-1.5% | 0.8-1.2% | 0.4-0.8% |
| **CPC** | $1-3 | $0.50-2 | $0.50-2 | $2-5 |
| **Conv. Rate** | 3-5% | 2-4% | 1-3% | 2-4% |
| **ROAS** | 4:1 | 3:1 | 3:1 | 4:1 |

## Budget Allocation

### Starter Budget ($500/month)
| Platform | Allocation | Daily |
|----------|------------|-------|
| Google | 40% | $6.67 |
| Facebook | 35% | $5.83 |
| Instagram | 25% | $4.17 |

### Growth Budget ($2,000/month)
| Platform | Allocation | Daily |
|----------|------------|-------|
| Google | 45% | $30.00 |
| Facebook | 30% | $20.00 |
| Instagram | 15% | $10.00 |
| LinkedIn | 10% | $6.67 |

### Enterprise Budget ($10,000/month)
| Platform | Allocation | Daily |
|----------|------------|-------|
| Google | 35% | $116.67 |
| Facebook | 30% | $100.00 |
| Instagram | 15% | $50.00 |
| LinkedIn | 20% | $66.67 |

## Next Steps
1. ✅ Choose top headline/description combos
2. ✅ Create ad variants for testing
3. ✅ Set up tracking pixels
4. ✅ Launch with small budget
5. ✅ Scale winning combinations`;
}

export function generateMarketingCalendar(business: string, industry: string, goals: string): string {
  if (!business) {
    return `# ❌ Marketing Calendar Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Business name is required

## Usage
\`\`\`typescript
generateMarketingCalendar("Acme Corp", "technology", "increase brand awareness")
\`\`\``;
  }

  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const themes = ["Educational", "Behind-the-Scenes", "User-Generated", "Promotional", "Engagement", "Inspirational", "Entertainment"];
  const platforms = ["Instagram", "LinkedIn", "Twitter", "TikTok", "YouTube"];
  const times = ["9:00 AM", "12:00 PM", "3:00 PM", "6:00 PM", "9:00 PM"];
  const ht = (s: string) => s.replace(/\s+/g, "");

  const calData = Array.from({ length: 4 }, (_, wi) =>
    days.map((day, di) => ({
      day,
      theme: themes[(wi * 7 + di) % themes.length],
      platform: platforms[(wi + di) % platforms.length],
      time: times[di % 5],
    }))
  );

  const ideas = [
    "Share industry tips and best practices",
    "Show team culture and company values",
    "Feature customer success stories",
    "Promote product/service with limited offer",
    "Ask poll/question to drive engagement",
    "Share motivational quote or story",
    "Create fun/entertaining content",
    "Post tutorial or how-to guide",
    "Share behind-the-scenes content",
    "Celebrate a milestone or achievement",
    "Reshare user-generated content",
    "Host AMA (Ask Me Anything)",
    "Share infographics or data visualizations",
    "Post case study or results",
    "Create carousel post with tips",
    "Share podcast or video content",
    "Post meme or trending content",
    "Share industry news and insights",
    "Create quiz or interactive content",
    "Post before/after transformation",
    "Share team member spotlight",
    "Post product demo or walkthrough",
    "Share customer testimonials",
    "Create challenge or contest",
    "Post weekly roundup or highlights",
    "Share upcoming events or webinars",
    "Post FAQ or common questions",
    "Share partnership or collaboration",
    "Post seasonal or holiday content",
    "Share company news or updates",
  ];

  const mkWeek = (wi: number) =>
    calData[wi]
      .map((d) => `| ${d.day} | ${d.theme} | ${d.platform} | ${d.time} |`)
      .join("\n");

  const mkIdeas = (start: number) =>
    Array.from({ length: 7 }, (_, i) => `${i + 1}. ${ideas[start + i]}`).join("\n");

  return `# ✅ 30-Day Marketing Calendar Generated

## Calendar Overview
| Property | Value |
|----------|-------|
| **Business** | ${business} |
| **Industry** | ${industry} |
| **Goals** | ${goals} |
| **Duration** | 30 Days |
| **Posts per Week** | 7 |
| **Total Posts** | 28 |
| **Platforms** | ${platforms.join(", ")} |

## Week 1: Foundation

| Day | Theme | Platform | Best Time |
|-----|-------|----------|-----------|
${mkWeek(0)}

### Week 1 Content Ideas
${mkIdeas(0)}

## Week 2: Engagement

| Day | Theme | Platform | Best Time |
|-----|-------|----------|-----------|
${mkWeek(1)}

### Week 2 Content Ideas
${mkIdeas(7)}

## Week 3: Growth

| Day | Theme | Platform | Best Time |
|-----|-------|----------|-----------|
${mkWeek(2)}

### Week 3 Content Ideas
${mkIdeas(14)}

## Week 4: Conversion

| Day | Theme | Platform | Best Time |
|-----|-------|----------|-----------|
${mkWeek(3)}

### Week 4 Content Ideas
${mkIdeas(21)}

## Platform-Specific Posting Times

### Instagram
| Day | Best Times | Engagement Rate |
|-----|------------|-----------------|
| Monday | 11 AM, 2 PM | 3.2% |
| Tuesday | 10 AM, 1 PM | 3.5% |
| Wednesday | 11 AM, 3 PM | 3.8% |
| Thursday | 10 AM, 2 PM | 3.4% |
| Friday | 10 AM, 12 PM | 3.1% |
| Saturday | 10 AM, 1 PM | 2.8% |
| Sunday | 10 AM, 1 PM | 2.5% |

### LinkedIn
| Day | Best Times | Engagement Rate |
|-----|------------|-----------------|
| Monday | 8 AM, 10 AM | 2.8% |
| Tuesday | 8 AM, 10 AM | 3.2% |
| Wednesday | 8 AM, 12 PM | 3.5% |
| Thursday | 8 AM, 10 AM | 3.0% |
| Friday | 8 AM, 10 AM | 2.6% |
| Saturday | N/A | Low |
| Sunday | N/A | Low |

### Twitter/X
| Day | Best Times | Engagement Rate |
|-----|------------|-----------------|
| Monday | 8 AM, 12 PM | 2.1% |
| Tuesday | 8 AM, 12 PM | 2.3% |
| Wednesday | 8 AM, 12 PM | 2.5% |
| Thursday | 8 AM, 12 PM | 2.2% |
| Friday | 8 AM, 12 PM | 1.9% |
| Saturday | 10 AM | 1.5% |
| Sunday | 10 AM | 1.3% |

### TikTok
| Day | Best Times | Engagement Rate |
|-----|------------|-----------------|
| Monday | 6 AM, 10 AM | 8.5% |
| Tuesday | 2 AM, 4 AM | 9.2% |
| Wednesday | 7 AM, 11 AM | 9.8% |
| Thursday | 9 AM, 12 PM | 8.9% |
| Friday | 5 AM, 1 PM | 8.2% |
| Saturday | 11 AM, 7 PM | 7.5% |
| Sunday | 7 AM, 8 AM | 7.0% |

### YouTube
| Day | Best Times | Engagement Rate |
|-----|------------|-----------------|
| Monday | 3 PM, 6 PM | 4.2% |
| Tuesday | 3 PM, 6 PM | 4.5% |
| Wednesday | 3 PM, 6 PM | 4.8% |
| Thursday | 3 PM, 6 PM | 4.4% |
| Friday | 3 PM, 6 PM | 4.0% |
| Saturday | 9 AM, 12 PM | 3.5% |
| Sunday | 9 AM, 12 PM | 3.2% |

## Content Mix Strategy

### 40-30-20-10 Rule
- **40% Educational**: Tips, tutorials, how-tos
- **30% Engaging**: Questions, polls, discussions
- **20% Promotional**: Product/service highlights
- **10% Entertaining**: Fun, memes, trends

### Content Pillars
1. **Education**: Industry insights, how-tos, tips
2. **Engagement**: Questions, polls, community
3. **Promotion**: Products, services, offers
4. **Brand**: Culture, values, behind-scenes
5. **Social Proof**: Testimonials, case studies

## Hashtag Strategy

### Primary Hashtags (10)
- #${ht(business)}
- #${ht(industry)}
- #Marketing
- #DigitalMarketing
- #SocialMediaMarketing
- #ContentMarketing
- #MarketingStrategy
- #BusinessGrowth
- #Entrepreneurship
- #Success

### Secondary Hashtags (10)
- #MarketingTips
- #GrowthHacks
- #SmallBusiness
- #StartupLife
- #MarketingAgency
- #BrandBuilding
- #ContentCreator
- #SocialMediaTips
- #DigitalStrategy
- #MarketingGoals

### Niche Hashtags (10)
- #${ht(industry)}Marketing
- #${ht(industry)}Business
- #${ht(business)}Tips
- #${ht(business)}Community
- #${ht(industry)}Growth
- #${ht(business)}Success
- #${ht(industry)}Strategy
- #${ht(business)}Results
- #${ht(industry)}Experts
- #${ht(business)}Life

## Monthly Goals Tracker

### Awareness Goals
| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| **Reach** | 50,000 | | | | |
| **Impressions** | 100,000 | | | | |
| **Followers** | +500 | | | | |
| **Brand Mentions** | 50 | | | | |

### Engagement Goals
| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| **Likes** | 2,000 | | | | |
| **Comments** | 500 | | | | |
| **Shares** | 200 | | | | |
| **Saves** | 300 | | | | |

### Conversion Goals
| Metric | Target | Week 1 | Week 2 | Week 3 | Week 4 |
|--------|--------|--------|--------|--------|--------|
| **Website Visits** | 5,000 | | | | |
| **Leads** | 200 | | | | |
| **Sales** | 50 | | | | |
| **Revenue** | $10,000 | | | | |

## Content Creation Workflow

### Week Before
1. ✅ Review previous week's performance
2. ✅ Research trending topics
3. ✅ Plan content themes
4. ✅ Create content briefs
5. ✅ Schedule content creation

### Day Before
1. ✅ Finalize all content
2. ✅ Get approvals
3. ✅ Schedule posts
4. ✅ Prepare engagement plan
5. ✅ Review analytics

### Day Of
1. ✅ Publish content
2. ✅ Monitor engagement
3. ✅ Respond to comments
4. ✅ Track metrics
5. ✅ Note learnings

## Tools & Resources

### Content Creation
- **Design**: Canva, Figma, Adobe Creative Suite
- **Video**: CapCut, InShot, Premiere Pro
- **Writing**: Grammarly, Hemingway Editor
- **Scheduling**: Buffer, Hootsuite, Sprout Social

### Analytics
- **Platform Native**: Instagram Insights, LinkedIn Analytics
- **Third-party**: Google Analytics, HubSpot
- **Social Listening**: Brandwatch, Mention

## Next Steps
1. ✅ Customize calendar for your brand
2. ✅ Create content for Week 1
3. ✅ Schedule all posts
4. ✅ Set up analytics tracking
5. ✅ Review and adjust weekly`;
}

export function generateYouTubeTitle(topic: string, keyword: string): string {
  if (!topic) {
    return `# ❌ YouTube Title Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Topic is required

## Usage
\`\`\`typescript
generateYouTubeTitle("digital marketing", "marketing tips")
\`\`\``;
  }

  const tp = topic.charAt(0).toUpperCase() + topic.slice(1);
  const yr = new Date().getFullYear();

  const titles = [
    `${tp}: The Ultimate Guide for ${yr}`,
    `How to Master ${tp} (Step-by-Step)`,
    `${tp} Tutorial for Beginners - Start Today!`,
    `The ${tp} Strategy That Changed Everything`,
    `${tp}: ${Math.floor(Math.random() * 5 + 3)} Secrets Nobody Tells You`,
    `I Tried ${tp} for ${Math.floor(Math.random() * 30 + 1)} Days - Here's What Happened`,
    `${tp} in ${Math.floor(Math.random() * 10 + 5)} Minutes - Crash Course`,
    `Why ${tp} Is Failing (And How to Fix It)`,
    `${tp} Masterclass: From Zero to Hero`,
    `The Truth About ${tp} (Honest Review)`,
    `${tp} ${Math.floor(Math.random() * 10 + 5)} Hacks That Actually Work`,
    `Stop Doing ${tp} Wrong! Do This Instead`,
    `${tp}: $0 to $${Math.floor(Math.random() * 10 + 1)}K in ${Math.floor(Math.random() * 6 + 1)} Months`,
    `The ${tp} Blueprint You NEED in ${yr}`,
    `${tp} for Dummies - Complete Beginner Guide`,
  ];

  const analysis = titles.map((t, i) => {
    const chars = t.length;
    const pw = /\b(ultimate|secret|proven|master|guide|truth|honest|complete|step-by-step|beginner|advanced|exclusive)\b/i.test(t);
    const emo = /\b(changed|everything|fail|wrong|fix|truth|honest|surprising|amazing)\b/i.test(t);
    const score = Math.min(100, 30 + (chars >= 50 && chars <= 60 ? 20 : 10) + (/\d/.test(t) ? 10 : 0) + (pw ? 10 : 0) + (emo ? 10 : 0) + (t.split(/\s+/).length >= 8 && t.split(/\s+/).length <= 12 ? 10 : 5));
    const ctr = score >= 80 ? "High (8-12%)" : score >= 60 ? "Medium (4-8%)" : "Low (2-4%)";
    return { n: i + 1, t: t.substring(0, 45) + (t.length > 45 ? "..." : ""), chars, score, ctr };
  });

  const rows = analysis.map((a) => `| ${a.n} | ${a.t} | ${a.chars} | ${a.score}/100 | ${a.ctr} |`).join("\n");

  return `# ✅ YouTube Titles Generated Successfully

## Title Overview
| Property | Value |
|----------|-------|
| **Topic** | ${topic} |
| **Keyword** | ${keyword} |
| **Total Titles** | ${titles.length} |
| **Optimal Length** | 50-60 characters |
| **Max Length** | 100 characters |

## All Titles

${titles.map((t, i) => `${i + 1}. ${t}`).join("\n")}

## Title Analysis

| # | Title | Chars | SEO Score | CTR Prediction |
|---|-------|-------|-----------|----------------|
${rows}

## SEO Optimization Factors

### Character Count
| Range | Score | Recommendation |
|-------|-------|----------------|
| 30-40 | Good | Add more keywords |
| 40-50 | Better | Optimal for mobile |
| 50-60 | Best | Maximum visibility |
| 60-70 | Okay | May be truncated |
| 70+ | Poor | Likely truncated |

### Power Words That Boost CTR
| Word | CTR Impact | Best Use |
|------|------------|----------|
| Ultimate | +15-25% | Guides, tutorials |
| Secret | +12-20% | Tips, strategies |
| Proven | +10-18% | Case studies, results |
| Master | +10-15% | In-depth content |
| Truth | +8-15% | Reviews, opinions |
| Beginner | +10-15% | Tutorial content |
| Step-by-Step | +12-18% | How-to content |

### Number Formulas
| Formula | Example | CTR Impact |
|---------|---------|------------|
| X Ways to... | "7 Ways to..." | +15-20% |
| X Things... | "5 Things..." | +12-18% |
| X Reasons... | "3 Reasons..." | +10-15% |
| X Secrets... | "5 Secrets..." | +18-25% |
| $X to $Y | "$0 to $10K" | +20-30% |

## Click-Through Rate Predictions

### By Title Type
| Type | Avg. CTR | Top Performers |
|------|----------|----------------|
| How-To | 4-6% | 8%+ |
| List | 5-7% | 10%+ |
| Tutorial | 4-6% | 8%+ |
| Review | 3-5% | 7%+ |
| Challenge | 6-8% | 12%+ |
| Story | 5-7% | 9%+ |

### By Length
| Length | Avg. CTR | Notes |
|--------|----------|-------|
| 30-40 chars | 4.5% | Mobile optimized |
| 40-50 chars | 5.2% | Balanced |
| 50-60 chars | 5.8% | Optimal |
| 60-70 chars | 4.8% | May truncate |
| 70+ chars | 3.5% | Often truncated |

## Title Formulas Database

### How-To Formula
"How to [Achieve Result] in [Timeframe]"
- "How to Master Digital Marketing in 30 Days"
- "How to Grow Your Business in 6 Months"

### List Formula
"[Number] [Adjective] [Topic] for [Audience]"
- "7 Proven Marketing Strategies for Small Business"
- "5 Essential Tools Every Marketer Needs"

### Question Formula
"Are You Making These [Topic] Mistakes?"
- "Are You Making These Marketing Mistakes?"
- "Do You Know These 5 Marketing Secrets?"

### Challenge Formula
"I Tried [Topic] for [Timeframe] - Here's What Happened"
- "I Tried Digital Marketing for 30 Days - Here's What Happened"
- "I Tested 5 Marketing Strategies - Results Surprised Me"

### Controversy Formula
"Why [Common Belief] Is Wrong"
- "Why Traditional Marketing Is Dead"
- "Why Most Marketing Advice Is Wrong"

## Thumbnail Optimization

### Text Guidelines
- Maximum 6-8 words
- Large, readable font
- High contrast colors
- No more than 3 lines

### Visual Elements
- Expressive faces
- Bright colors
- Clear focal point
- Consistent branding

### A/B Testing
- Test different expressions
- Test color schemes
- Test text placement
- Test background images

## Keyword Optimization

### Primary Keyword Placement
- Start of title (highest weight)
- Within first 3 words
- Natural integration

### Secondary Keywords
- Mid-title placement
- Related terms
- Long-tail variations

### Keyword Research Tools
- YouTube Search Suggest
- TubeBuddy
- vidIQ
- Google Trends

## Performance Metrics

### Key Metrics to Track
| Metric | Target | How to Improve |
|--------|--------|----------------|
| CTR | 5%+ | Better titles/thumbnails |
| Watch Time | 50%+ | Engaging content |
| Average View Duration | 50%+ | Hook viewers early |
| Subscriber Conversion | 2%+ | Clear value proposition |

## A/B Testing Framework

### Test 1: Number vs No Number
- **A**: "Marketing Tips"
- **B**: "5 Marketing Tips"

### Test 2: Question vs Statement
- **A**: "How to Master Marketing"
- **B**: "Do You Know These Marketing Secrets?"

### Test 3: Emotional vs Rational
- **A**: "Marketing Secrets That Changed Everything"
- **B**: "Marketing Strategy Guide"

### Test 4: Length
- **A**: Short title (30-40 chars)
- **B**: Long title (50-60 chars)

## Next Steps
1. ✅ Choose top 5 titles
2. ✅ A/B test with your audience
3. ✅ Track click-through rates
4. ✅ Optimize based on data
5. ✅ Iterate monthly`;
}

export function generateYouTubeDescription(topic: string, keyword: string): string {
  if (!topic) {
    return `# ❌ YouTube Description Generation Failed

## Error Details
- **Status**: Failed
- **Error**: Topic is required

## Usage
\`\`\`typescript
generateYouTubeDescription("digital marketing", "marketing tips")
\`\`\``;
  }

  const tp = topic.charAt(0).toUpperCase() + topic.slice(1);
  const kw = keyword.toLowerCase();
  const yr = new Date().getFullYear();

  return `# ✅ YouTube Description Generated Successfully

## Description Overview
| Property | Value |
|----------|-------|
| **Topic** | ${topic} |
| **Keyword** | ${keyword} |
| **Word Count** | 500+ |
| **SEO Optimized** | Yes |
| **Timestamps** | Included |
| **Hashtags** | 15 |

## Optimized Description

\`\`\`
${tp}: The Complete Guide for ${yr}

In this video, we dive deep into ${topic.toLowerCase()}, covering everything you need to know to master ${keyword.toLowerCase()} and achieve outstanding results. Whether you're a beginner or experienced professional, this guide will help you level up your ${topic.toLowerCase()} game.

🔑 What You'll Learn:
• Core fundamentals of ${topic.toLowerCase()}
• Advanced strategies for ${keyword.toLowerCase()}
• Step-by-step implementation guide
• Common mistakes to avoid
• Pro tips from industry experts
• Tools and resources to accelerate your growth

⏱️ TIMESTAMPS:
0:00 - Introduction
1:30 - What is ${topic.toLowerCase()}?
4:15 - Why ${topic.toLowerCase()} matters in ${yr}
7:30 - Core principles and fundamentals
12:00 - Getting started guide
18:45 - Advanced strategies
25:30 - Common mistakes to avoid
30:15 - Tools and resources
35:00 - Case studies and examples
42:00 - Step-by-step tutorial
50:00 - Q&A and final thoughts
55:00 - What's next?

🎯 WHO IS THIS FOR?
• Entrepreneurs looking to grow their business
• Marketers wanting to improve their skills
• Beginners starting their ${topic.toLowerCase()} journey
• Professionals seeking advanced strategies
• Anyone interested in ${keyword.toLowerCase()}

📚 RESOURCES MENTIONED:
• Free ${tp} Checklist: [Link in pinned comment]
• ${tp} Course: [Link in pinned comment]
• Recommended Tools: [Link in pinned comment]
• Downloadable Templates: [Link in pinned comment]
• Community Group: [Link in pinned comment]

🔔 SUBSCRIBE for more ${topic.toLowerCase()} content:
https://youtube.com/c/YourChannel?sub_confirmation=1

📱 CONNECT WITH ME:
• Instagram: @yourhandle
• Twitter: @yourhandle
• LinkedIn: /in/yourprofile
• Website: https://yoursite.com
• Email: contact@yoursite.com

📖 ABOUT THIS VIDEO:
This ${topic.toLowerCase()} tutorial covers ${keyword.toLowerCase()} in detail. We break down complex concepts into easy-to-understand segments, making this perfect for both beginners and advanced practitioners. By the end of this video, you'll have a clear understanding of how to implement ${topic.toLowerCase()} strategies that actually work.

💡 PRO TIP: Watch this video at 1.5x speed if you're short on time, but take notes during the strategy sections - that's where the real value is!

🏆 FEATURED IN:
• Top ${topic.toLowerCase()} Resources ${yr}
• Best ${keyword.toLowerCase()} Tutorials
• Recommended by [Industry Expert]

⬇️ FREE DOWNLOADS:
• ${tp} Checklist: [Link]
• ${tp} Template: [Link]
• ${tp} Cheat Sheet: [Link]
• ${tp} Workbook: [Link]

🏷️ TAGS:
${topic.toLowerCase()}, ${keyword.toLowerCase()}, ${topic.toLowerCase()} tutorial, ${keyword.toLowerCase()} tips, ${topic.toLowerCase()} for beginners, ${topic.toLowerCase()} ${yr}, how to ${kw}, ${kw} guide, ${kw} strategy, ${kw} tips, ${topic.toLowerCase()} strategy, ${topic.toLowerCase()} guide, ${keyword.toLowerCase()} strategy, ${topic.toLowerCase()} course

#️⃣ HASHTAGS:
#${topic.replace(/\s+/g, "")} #${keyword.replace(/\s+/g, "")} #MarketingTips #DigitalMarketing #SocialMediaMarketing #ContentMarketing #MarketingStrategy #BusinessGrowth #Entrepreneurship #Success #MarketingTips ${yr} #${keyword.replace(/\s+/g, "")}Guide #LearnMarketing #MarketingCourse

📋 CHAPTERS:
• Introduction (0:00)
• Core Concepts (1:30)
• Why It Matters (4:15)
• Fundamentals (7:30)
• Getting Started (12:00)
• Advanced Tips (18:45)
• Common Mistakes (25:30)
• Tools & Resources (30:15)
• Case Studies (35:00)
• Tutorial (42:00)
• Final Thoughts (50:00)

🎵 MUSIC CREDITS:
• Track: [Song Name] by [Artist]
• Source: Epidemic Sound

📸 IMAGE CREDITS:
• All images used with permission or under Creative Commons license

⚠️ DISCLAIMER:
Some links in this description are affiliate links, meaning I earn a commission if you make a purchase through them. This comes at no extra cost to you and helps support the channel. I only recommend products I personally use and believe in.

Thank you for watching! If you found this helpful, please give it a thumbs up 👍, subscribe to the channel 🔔, and share it with someone who needs to see this. Drop a comment below with your biggest takeaway or any questions you have!

#${topic.replace(/\s+/g, "")} #${keyword.replace(/\s+/g, "")} #MarketingTips #DigitalMarketing #SocialMediaMarketing #ContentMarketing #MarketingStrategy
\`\`\`

## SEO Keywords

### Primary Keywords
| Keyword | Search Volume | Competition |
|---------|---------------|-------------|
| ${topic.toLowerCase()} | High | High |
| ${keyword.toLowerCase()} | High | Medium |
| ${topic.toLowerCase()} tutorial | Medium | Medium |
| ${topic.toLowerCase()} guide | Medium | Low |
| ${topic.toLowerCase()} ${yr} | Medium | Low |

### Long-Tail Keywords
| Keyword | Search Volume | Competition |
|---------|---------------|-------------|
| how to ${kw} for beginners | Low | Low |
| ${kw} strategy ${yr} | Low | Low |
| ${topic.toLowerCase()} tips and tricks | Low | Low |
| best ${kw} techniques | Low | Low |
| ${kw} step by step guide | Low | Low |

### Related Keywords
| Keyword | Relevance | Priority |
|---------|-----------|----------|
| marketing tips | High | High |
| business growth | High | Medium |
| digital strategy | Medium | Medium |
| content creation | Medium | Low |
| social media tips | Medium | Low |

## Description Best Practices

### Structure
1. **Hook**: First 2-3 lines (visible without "Show More")
2. **Value Proposition**: What viewers will learn
3. **Timestamps**: For easy navigation
4. **Links**: Resources and social media
5. **Hashtags**: For discoverability

### Character Limits
| Element | Limit | Recommendation |
|---------|-------|----------------|
| Description | 5,000 chars | Use full limit |
| Title | 100 chars | 50-60 optimal |
| Tags | 500 chars | Use all available |
| Hashtags | 15 max | Use 3-5 in title |

### SEO Tips
- Include primary keyword in first 25 words
- Use variations throughout
- Add timestamps for watch time
- Include links to related videos
- Use hashtags strategically

## Performance Optimization

### Watch Time Tips
- Hook viewers in first 10 seconds
- Use pattern interrupts every 2-3 minutes
- Create curiosity loops
- Deliver on promises
- End with clear next steps

### Engagement Tips
- Ask questions throughout
- Use polls in community tab
- Respond to comments quickly
- Create follow-up content
- Build anticipation

## Next Steps
1. ✅ Copy the description above
2. ✅ Customize links and social handles
3. ✅ Add your specific timestamps
4. ✅ Upload to YouTube Studio
5. ✅ Monitor analytics after 48 hours`;
}

export function processMarketingTool(toolId: string, options: Record<string, string>): MarketingResult {
  const handlers: Record<string, () => MarketingResult> = {
    "qr-generator": () => ({
      content: generateQRCode(options.text || "", options.type || "url"),
      filename: `qr-code-${Date.now()}.png`,
      mimeType: "image/png",
    }),
    "utm-builder": () => ({
      content: buildUTMUrl(options.url || "", options.source || "", options.medium || "", options.campaign || "", options.term || "", options.content || ""),
      filename: `utm-url-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "hashtag-generator": () => ({
      content: generateHashtags(options.topic || "", options.platform || "instagram"),
      filename: `hashtags-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "social-caption": () => ({
      content: generateSocialCaption(options.topic || "", options.platform || "instagram", options.tone || "professional"),
      filename: `caption-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "email-subject": () => ({
      content: generateEmailSubject(options.topic || "", options.type || "marketing", options.goal || ""),
      filename: `email-subjects-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "cta-generator": () => ({
      content: generateCTA(options.product || "", options.goal || "sales", options.style || "button"),
      filename: `cta-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "landing-page-headline": () => ({
      content: generateHeadline(options.product || "", options.audience || "", options.style || "power words"),
      filename: `headlines-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "ad-copy": () => ({
      content: generateAdCopy(options.product || "", options.platform || "google", options.audience || ""),
      filename: `ad-copy-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "marketing-calendar": () => ({
      content: generateMarketingCalendar(options.industry || "", options.period || "month", options.industry || ""),
      filename: `marketing-calendar-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "youtube-title": () => ({
      content: generateYouTubeTitle(options.topic || "", options.keyword || ""),
      filename: `youtube-titles-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
    "youtube-desc": () => ({
      content: generateYouTubeDescription(options.topic || "", options.keyword || ""),
      filename: `youtube-description-${Date.now()}.txt`,
      mimeType: "text/plain",
    }),
  };

  const handler = handlers[toolId];
  if (!handler) {
    return {
      content: `Unknown tool: ${toolId}`,
      filename: "error.txt",
      mimeType: "text/plain",
    };
  }
  return handler();
}

export function downloadMarketing(content: string, filename: string, mimeType: string): void {
  if (typeof window === "undefined") {
    console.warn("downloadMarketing is client-side only");
    return;
  }
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
