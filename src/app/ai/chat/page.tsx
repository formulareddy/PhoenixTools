"use client"

import { useState, useEffect, useRef, useCallback, useMemo, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  Send, Sparkles, FileText, Image as ImageIcon, Volume2, Film, Music,
  Mic, MicOff, Plus, MessageSquare, ChevronLeft, Loader2, ArrowRight,
  Settings, X, FileDown, Scissors, RefreshCw, Eraser, Crop, Wand2,
  Globe, Search, Shield, Lock, Check, ExternalLink,
} from "lucide-react"
import { tools } from "@/lib/constants"
import { callFreeAI, isAIConfigured, setConfig, getConfigured, getProviderInfo } from "@/lib/free-ai"
import { checkRateLimit, filterSensitiveContent, isSensitiveQuery } from "@/lib/chat-security"
import { searchWeb, buildDetailedAnswer, shouldSearchWeb } from "@/lib/web-search"
import { useChatUsage } from "@/lib/chat-usage"
import { useSubscription } from "@/contexts/subscription-context"

interface ChatMessage {
  id: string
  role: "user" | "assistant"
  content: string
  tool?: { id: string; name: string; description: string; href: string; category: string } | null
  timestamp: Date
  provider?: string
}

interface ChatSession {
  id: string
  title: string
  messages: ChatMessage[]
  createdAt: Date
}

const STORAGE_KEY = "phoenixtools-chat"

const toolKeywords: Record<string, string[]> = {
  "pdf-compress": ["compress pdf", "shrink pdf", "reduce pdf", "make pdf smaller"],
  "pdf-merge": ["merge pdf", "combine pdf", "join pdf", "multiple pdf"],
  "pdf-split": ["split pdf", "separate pdf", "divide pdf", "extract pages"],
  "pdf-to-word": ["pdf to word", "pdf to docx", "convert pdf to word"],
  "pdf-to-jpg": ["pdf to jpg", "pdf to image", "pdf to png"],
  "pdf-unlock": ["unlock pdf", "remove password", "decrypt pdf"],
  "pdf-watermark": ["watermark pdf", "stamp pdf"],
  "pdf-ocr": ["ocr", "scan pdf", "extract text from scan"],
  "pdf-to-text": ["pdf to text", "extract text from pdf"],
  "image-resize": ["resize image", "change image size", "image dimensions"],
  "image-compress": ["compress image", "optimize image", "reduce image size"],
  "image-convert": ["convert image", "png to jpg", "jpg to png", "webp to png"],
  "remove-bg": ["remove background", "background removal", "transparent background", "cutout"],
  "image-crop": ["crop image", "trim image", "cut image"],
  "ai-image-gen": ["generate image", "create image", "ai image", "text to image", "draw"],
  "video-trim": ["trim video", "cut video", "shorten video", "video clip"],
  "video-compress": ["compress video", "reduce video size", "shrink video"],
  "video-convert": ["convert video", "video format", "mp4 to", "avi to", "mov to", "mkv to"],
  "video-to-gif": ["video to gif", "make gif", "create gif", "animated gif"],
  "extract-audio": ["extract audio", "rip audio", "audio from video", "mp3 from video"],
  "audio-convert": ["convert audio", "audio format", "wav to mp3", "mp3 to wav", "mkv to mp3", "mp4 to mp3", "to mp3", "to wav"],
  "audio-trim": ["trim audio", "cut audio", "shorten audio"],
  "qr-generator": ["qr code", "qrcode", "generate qr", "create qr"],
  "invoice-generator": ["invoice", "create invoice", "bill", "generate invoice"],
  "receipt-generator": ["receipt", "create receipt", "generate receipt"],
  "quotation-generator": ["quotation", "quote", "create quote"],
  "text-summary": ["summarize", "summary", "tldr", "brief", "shorten text"],
  "text-translate": ["translate", "translation", "language"],
  "word-counter": ["word count", "count words", "character count", "text length"],
  "seo-analyzer": ["seo", "seo analysis", "analyze seo", "seo score"],
  "keyword-research": ["keyword research", "find keywords", "keyword analysis"],
  "meta-tag-generator": ["meta tags", "generate meta", "meta description"],
  "business-name-generator": ["business name", "company name", "startup name"],
  "profit-margin": ["profit margin", "calculate profit", "margin calculator"],
  "gst-vat-calculator": ["gst", "vat", "tax calculator", "calculate tax"],
  "salary-calculator": ["salary", "take home pay", "net salary"],
  "social-caption": ["social media caption", "instagram caption", "facebook post"],
  "email-subject": ["email subject line", "subject line", "email open rate"],
  "hashtag-generator": ["hashtag", "instagram hashtag", "tiktok hashtag"],
  "youtube-title": ["youtube title", "video title", "youtube SEO"],
  "landing-page-headline": ["landing page headline", "headline", "copywriting"],
  "ad-copy": ["ad copy", "advertisement", "facebook ad", "google ad"],
  "utm-builder": ["utm", "tracking url", "campaign url"],
  "marketing-calendar": ["marketing calendar", "content calendar", "social media calendar"],
  "business-proposal": ["business proposal", "proposal", "pitch deck"],
  "contract-generator": ["contract", "agreement", "legal document"],
  "purchase-order-generator": ["purchase order", "po", "order form"],
  "robots-txt-generator": ["robots.txt", "crawl rules", "bot rules"],
  "sitemap-generator": ["sitemap", "xml sitemap", "site map"],
  "redirect-checker": ["redirect", "301 redirect", "redirect checker"],
  "backlink-checker": ["backlink", "inbound link", "link building"],
}

function findBestTool(query: string): typeof tools[0] | null {
  const lower = query.toLowerCase().trim()

  const stopWords = ["the", "a", "an", "is", "are", "was", "were", "what", "who", "how", "why", "when", "where", "which", "can", "could", "would", "should", "will", "do", "does", "did", "has", "have", "had", "about", "tell", "explain", "describe", "movie", "film", "show", "actor", "actress", "director", "singer", "band", "song", "album", "book", "author", "story", "character"]
  const words = lower.split(/\s+/)
  const nonStopWords = words.filter((w) => !stopWords.includes(w) && w.length > 2)
  if (nonStopWords.length === 0) return null

  for (const [toolId, keywords] of Object.entries(toolKeywords)) {
    for (const kw of keywords) {
      const kwWords = kw.split(/\s+/)
      const allKwWordsFound = kwWords.every((kwWord) => lower.split(/\s+/).some((qw) => qw === kwWord || qw.startsWith(kwWord)))
      if (allKwWordsFound) {
        const tool = tools.find((t) => t.id === toolId)
        if (tool) return tool
      }
    }
  }
  return null
}

const KNOWLEDGE_BASE: Array<{ keywords: string[]; answer: string }> = [
  // Greetings
  { keywords: ["hello", "hi ", "hey ", "hi!", "hey!", "good morning", "good afternoon", "good evening"], answer: "Hello! I'm PhoenixTools AI. I can help you find tools, answer questions, or guide you through any task. What would you like to do?" },
  { keywords: ["who are you", "what are you", "your name", "tell me about yourself"], answer: "I'm **PhoenixTools AI**, your assistant for PhoenixTools — a premium utility platform with **142 tools** for PDFs, images, video, audio, text, code, SEO, marketing, and business. I can also answer general knowledge questions!" },
  { keywords: ["what can you do", "your capabilities", "what do you know"], answer: "I can:\n\n• **Find tools** — Describe your task, I'll recommend the best tool\n• **Answer questions** — Ask anything about our tools or any general topic\n• **Guide workflows** — Step-by-step instructions\n• **General knowledge** — Science, technology, history, geography, and more\n\nWe have 142 tools across PDF, image, video, audio, AI, text, developer, SEO, marketing, and business." },
  { keywords: ["thank", "thanks"], answer: "You're welcome! Let me know if you need anything else." },
  { keywords: ["bye", "goodbye", "see you"], answer: "Goodbye! Have a great day!" },

  // PhoenixTools
  { keywords: ["how many tools", "what tools", "tool count"], answer: "PhoenixTools has **142 tools**:\n\n• PDF (20) — Compress, merge, split, convert, edit\n• Image (14) — Resize, compress, remove background\n• Video (13) — Trim, compress, convert\n• Audio (13) — Convert, trim, merge\n• AI (14) — Chat, translate, summarize\n• Text (20) — Format, count, convert\n• Developer (13) — JSON, regex, hash\n• SEO (12) — Analyze, keywords, meta tags\n• Marketing (11) — QR codes, UTM, hashtags\n• Business (10) — Invoices, receipts, contracts" },
  { keywords: ["how to work", "how does it work", "how it works", "how do i use"], answer: "**How PhoenixTools Works:**\n\n1. **Choose a tool** — Browse categories or search\n2. **Upload or enter data** — Most tools work client-side\n3. **Get results** — Download or copy output\n\n**No uploads needed** for text, code, SEO, marketing, and business tools — everything processes in your browser.\n\n**PDF/image/video/audio** tools process on our server for best quality." },
  { keywords: ["price", "cost", "how much", "is it free", "pricing"], answer: "PhoenixTools is **free to use**! All 142 tools are available at no cost. Some advanced features may require a Pro account in the future." },
  { keywords: ["account", "login", "sign up", "register"], answer: "PhoenixTools doesn't require an account! All tools work directly in your browser. Your data stays private and secure." },
  { keywords: ["download", "install", "app"], answer: "PhoenixTools is a web app — no download needed! Just visit the tool page and start using it. Works on any device with a modern browser." },
  { keywords: ["mobile", "phone", "android", "iphone", "tablet"], answer: "Yes! PhoenixTools works on mobile devices. All tools are responsive and work in mobile browsers." },
  { keywords: ["safe", "secure", "private", "privacy"], answer: "Yes! PhoenixTools is safe and secure:\n\n• Most tools process data **in your browser** (no uploads)\n• File-based tools process on secure servers\n• No data is stored or shared\n• All processing is encrypted" },

  // AI Companies
  { keywords: ["openai", "open ai", "chatgpt", "gpt-4", "gpt4", "sam altman"], answer: "**OpenAI** is an AI research company founded in December 2015 by Sam Altman, Greg Brockman, Elon Musk, Ilya Sutskever, Wojciech Zaremba, and John Schulman. Key facts:\n\n• **Headquarters:** San Francisco, California\n• **Mission:** Ensure artificial general intelligence (AGI) benefits all of humanity\n• **Key Products:** ChatGPT, GPT-4, DALL-E, Whisper, Sora, Codex\n• **ChatGPT:** Launched November 2022, reached 100M users in 2 months — fastest-growing consumer app in history\n• **GPT-4:** Released March 2023, multimodal (text + images), passed bar exam in top 10%\n• **Revenue:** ~$5 billion annualized (2024)\n• **Valuation:** ~$157 billion (2024)\n• **Partnership:** Microsoft invested $13 billion, uses Azure for infrastructure\n• **DALL-E:** AI image generator from text descriptions\n• **Whisper:** Open-source speech recognition model\n• **Sora:** AI video generation model\n\nOpenAI transitioned from non-profit to \"capped profit\" structure to attract investment while maintaining safety focus." },
  { keywords: ["anthropic", "claude"], answer: "**Anthropic** is an AI safety company founded in 2021 by Dario Amodei and Daniela Amodei (former OpenAI executives). Key facts:\n\n• **Headquarters:** San Francisco, California\n• **Mission:** Build reliable, interpretable, and steerable AI systems\n• **Key Product:** Claude — AI assistant focused on safety and helpfulness\n• **Claude Models:** Claude 3.5 Sonnet, Claude 3 Opus, Claude 3 Haiku\n• **Constitutional AI:** Training method where AI learns from principles rather than human feedback\n• **Funding:** Raised $7.3 billion (including $4 billion from Amazon)\n• **Valuation:** ~$18 billion (2024)\n• **Notable:** Claude 3.5 Sonnet outperforms GPT-4 on many benchmarks\n• **Focus:** AI safety research, avoiding harmful outputs, honest and harmless AI\n\nAnthropic is known for publishing influential AI safety research and taking a science-driven approach to alignment." },
  { keywords: ["google ai", "gemini", "deepmind", "google brain", "bard"], answer: "**Google AI** encompasses several divisions:\n\n• **Google DeepMind** (merged 2023): Formed from Google Brain + DeepMind. Led by Demis Hassabis. Created AlphaFold (protein folding), AlphaGo, Gemini\n• **Gemini:** Google's most capable AI model (Dec 2023), comes in Ultra, Pro, and Nano sizes. Multimodal — understands text, images, audio, video\n• **Google Brain:** Founded 2011, pioneered deep learning at Google\n• **DeepMind:** Founded 2010 in London, acquired by Google in 2015 for ~$500M\n• **Key Achievements:** AlphaGo (beat world Go champion 2016), AlphaFold (solved protein folding), Gemini Ultra (exceeds GPT-4 on many benchmarks)\n• **Bard:** Google's ChatGPT competitor, now powered by Gemini\n• **Google Search AI:** AI Overviews, AI-powered search results\n• **LaMDA:** Language model for dialogue applications\n• **PaLM:** Pathways Language Model, foundation for Gemini\n\nGoogle has the world's largest AI research investment and most TPUs (tensor processing units) for AI training." },
  { keywords: ["meta ai", "llama", "facebook ai", "yann lecun"], answer: "**Meta AI** (formerly Facebook AI) is Meta's artificial intelligence research division:\n\n• **Leader:** Yann LeCun (Chief AI Scientist, Turing Award winner)\n• **Llama Models:** Open-source large language models (Llama 1, 2, 3)\n  - Llama 3.1 405B: Largest open-source model, competitive with GPT-4\n  - Free to use for research and commercial applications\n• **Key Research:** Computer vision, NLP, reinforcement learning\n• **PyTorch:** Meta's open-source ML framework (most popular in the world)\n• **Segment Anything:** AI model for image segmentation\n• **Make-A-Video:** AI text-to-video generation\n• **Emu:** AI image generation model\n• **DINO/DETR:** Self-supervised vision models\n• **NoFA:** Self-supervised learning breakthroughs\n\nMeta's approach is unique: they release models as open-source, allowing anyone to build on their research. Llama models are used by millions of developers worldwide." },
  { keywords: ["microsoft ai", "copilot", "bing ai"], answer: "**Microsoft AI** is deeply integrated across Microsoft's products:\n\n• **Microsoft Copilot:** AI assistant across Windows, Office, Edge, and more\n  - Copilot in Word: Write, edit, summarize documents\n  - Copilot in Excel: Analyze data, create formulas\n  - Copilot in PowerPoint: Generate presentations from text\n  - Copilot in Teams: Summarize meetings, action items\n• **Bing Chat:** AI-powered search (now Microsoft Copilot)\n• **GitHub Copilot:** AI pair programmer — suggests code in real-time\n  - Uses OpenAI Codex model\n  - Used by 1.3M+ developers\n• **Azure OpenAI:** Enterprise API for GPT-4, DALL-E, etc.\n• **Investment:** $13 billion invested in OpenAI\n• **Partnership:** Exclusive cloud provider for OpenAI\n• **Philosophy:** \"AI as a copilot, not a replacement\"\n\nMicrosoft has embedded AI into virtually every product, making it the most AI-integrated major tech company." },
  { keywords: ["amazon ai", "alexa", "bedrock"], answer: "**Amazon AI** services include:\n\n• **Amazon Bedrock:** Managed service for foundation models (Claude, Llama, Titan, Stable Diffusion)\n• **Alexa:** Voice AI assistant — 500M+ devices, 100K+ skills\n• **Amazon Q:** AI assistant for developers and businesses\n• **Titan:** Amazon's own foundation models\n• **SageMaker:** Machine learning platform for building, training models\n• **Rekognition:** Computer vision API (image/video analysis)\n• **Comprehend:** Natural language processing\n• **Lex:** Chatbot builder (powers Alexa)\n• **Polly:** Text-to-speech\n• **Translate:** Language translation\n• **Transcribe:** Speech-to-text\n\nAmazon is the largest cloud provider (AWS) and offers the most comprehensive AI/ML services for enterprises." },
  { keywords: ["nvidia", "gpu", "cuda", "jensen huang"], answer: "**NVIDIA** is the world's leading AI hardware company:\n\n• **CEO:** Jensen Huang (founded 1993)\n• **Market Cap:** ~$3 trillion (2024) — briefly became most valuable company\n• **GPU Dominance:** ~80-90% of AI training chips\n• **Key Products:**\n  - H100/B200 GPUs: The standard for AI training ($25,000-$40,000 each)\n  - CUDA: Parallel computing platform (2M+ developers)\n  - TensorRT: AI inference optimization\n  - DGX Systems: AI supercomputers\n• **Why Important:** Every major AI model (GPT-4, Gemini, Llama) is trained on NVIDIA GPUs\n• **NVIDIA AI Enterprise:** Software stack for AI deployment\n• **Autonomous Vehicles:** DRIVE platform for self-driving cars\n• **Metaverse:** Omniverse platform for 3D simulation\n\nNVIDIA's CUDA ecosystem creates a massive moat — even if competitors build cheaper chips, the software ecosystem is NVIDIA-only." },
  { keywords: ["apple ai", "apple intelligence", "siri"], answer: "**Apple AI** focuses on on-device and privacy-preserving AI:\n\n• **Apple Intelligence (2024):** AI system integrated into iOS 18, macOS Sequoia\n  - Writing tools, image generation, smart replies\n  - On-device processing for privacy\n  - ChatGPT integration for complex queries\n• **Siri:** Voice assistant (2011), being enhanced with AI\n• **Core ML:** On-device machine learning framework\n• **Create ML:** Train models on Mac\n• **Vision Framework:** Computer vision on-device\n• **Natural Language:** Text analysis on-device\n• **Key Differentiator:** Privacy-first — most AI runs on the device, not in the cloud\n• **Apple Silicon:** M-series chips with Neural Engine for fast on-device AI\n\nApple's approach is unique: instead of cloud AI, they focus on models that run directly on iPhone/Mac for maximum privacy." },
  { keywords: ["deepseek", "deep seek", "chinese ai"], answer: "**DeepSeek** is a Chinese AI company creating competitive open-source models:\n\n• **Founded:** 2023, backed by High-Flyer Capital Management\n• **DeepSeek-V3:** Open-source model competitive with GPT-4\n• **DeepSeek-R1:** Reasoning model (thinks step-by-step like o1)\n• **Key Innovation:** Mixture of Experts (MoE) architecture — activates only part of the network per query, making it much more efficient\n• **Cost:** Training cost estimated at ~$5.5M vs GPT-4's ~$100M+\n• **Impact:** Proved competitive AI can be built at fraction of cost\n• **Open Source:** Models freely available, causing disruption in AI industry\n• **Benchmark Performance:** Matches or exceeds GPT-4o on many tasks\n\nDeepSeek's efficiency breakthrough challenged the assumption that AI requires massive spending, shaking the AI industry in early 2025." },

  // AI Concepts
  { keywords: ["what is ai", "artificial intelligence", "define ai", "explain ai"], answer: "**Artificial Intelligence (AI)** is the simulation of human intelligence by machines:\n\n• **Definition:** Systems that can perform tasks requiring human intelligence — learning, reasoning, problem-solving, perception, language understanding\n• **Types:**\n  - Narrow AI: Designed for specific tasks (Siri, chess, recommendations) — what we have today\n  - General AI (AGI): Human-level intelligence across all domains — doesn't exist yet\n  - Super AI: Exceeds human intelligence — theoretical\n• **Key Technologies:**\n  - Machine Learning (ML): Algorithms that learn from data\n  - Deep Learning: Neural networks with many layers\n  - Natural Language Processing (NLP): Understanding human language\n  - Computer Vision: Interpreting images and video\n  - Reinforcement Learning: Learning through trial and error\n• **Applications:** Virtual assistants, self-driving cars, medical diagnosis, recommendations, content generation, robotics\n• **History:** Coined by John McCarthy in 1956 at Dartmouth Conference" },
  { keywords: ["machine learning", "what is ml"], answer: "**Machine Learning (ML)** is a subset of AI where systems learn from data:\n\n• **Definition:** Algorithms that improve automatically through experience\n• **Types:**\n  - Supervised Learning: Learns from labeled data (spam detection, image classification)\n  - Unsupervised Learning: Finds patterns in unlabeled data (clustering, recommendations)\n  - Reinforcement Learning: Learns through rewards/penalties (game AI, robotics)\n  - Semi-supervised: Mix of labeled and unlabeled data\n• **Key Algorithms:** Linear regression, decision trees, random forests, SVM, neural networks, k-means\n• **Workflow:** Data collection → preprocessing → model selection → training → evaluation → deployment\n• **Applications:** Recommendation systems, fraud detection, medical diagnosis, autonomous vehicles, natural language processing\n• **Tools:** Python (scikit-learn, TensorFlow, PyTorch), R, MATLAB" },
  { keywords: ["deep learning", "neural network", "what is dl"], answer: "**Deep Learning** is a subset of ML using neural networks with many layers:\n\n• **Neural Networks:** Inspired by brain neurons — layers of connected nodes process information\n• **Key Architectures:**\n  - CNN (Convolutional Neural Networks): Image recognition, computer vision\n  - RNN/LSTM: Sequential data — text, speech, time series\n  - Transformers: Current state-of-the-art for NLP (GPT, BERT)\n  - GANs (Generative Adversarial Networks): Generate realistic images, deepfakes\n  - Diffusion Models: Stable Diffusion, DALL-E — image generation\n• **Why \"Deep\":** Multiple hidden layers (GPT-4 has ~120 layers, billions of parameters)\n• **Training:** Requires massive data and GPU power — GPT-4 trained on ~13 trillion tokens\n• **Applications:** Image recognition (99%+ accuracy), speech recognition, language translation, self-driving cars, drug discovery" },
  { keywords: ["chatgpt", "what is chatgpt"], answer: "**ChatGPT** is an AI chatbot by OpenAI:\n\n• **Launched:** November 30, 2022\n• **Based on:** GPT (Generative Pre-trained Transformer) models\n• **GPT-3.5:** Initial model, 175 billion parameters\n• **GPT-4:** Multimodal (text + images), released March 2023\n• **GPT-4o:** Latest model, faster and cheaper\n• **Features:** Conversational AI, writing, coding, analysis, math, creative tasks\n• **Growth:** 100M users in 2 months (fastest-growing app ever)\n• **Revenue:** ~$5 billion/year (2024)\n• **Plus/Pro:** $20/month for GPT-4 access, $200/month for Pro\n• **API:** Available for developers to build apps\n• **Plugins:** Connect to web browsing, code interpreter, plugins\n• **Voice/Video:** Real-time voice and video conversations\n\nChatGPT popularized AI chatbots and triggered the current AI revolution." },

  // Technology
  { keywords: ["python", "what is python"], answer: "**Python** is a popular programming language:\n\n• **Created:** 1991 by Guido van Rossum\n• **Philosophy:** Simple, readable syntax — \"batteries included\"\n• **Key Features:**\n  - Easy to learn and read\n  - Dynamic typing\n  - Extensive standard library\n  - Huge ecosystem of packages (PyPI: 400K+ packages)\n• **Popular Uses:**\n  - AI/Machine Learning (TensorFlow, PyTorch, scikit-learn)\n  - Web Development (Django, Flask, FastAPI)\n  - Data Science (pandas, NumPy, matplotlib)\n  - Automation/Scripting\n  - Scientific computing\n• **Companies Using:** Google, Netflix, Spotify, Instagram, NASA\n• **Job Market:** One of the highest-paying languages, most in-demand\n• **Latest Version:** Python 3.13 (2024)\n• **Comparison:** Slower than C++/Java but much faster to write and maintain" },
  { keywords: ["javascript", "what is javascript", "js"], answer: "**JavaScript** is the language of the web:\n\n• **Created:** 1995 by Brendan Eich (in 10 days!)\n• **Key Features:**\n  - Runs in every web browser (no installation needed)\n  - Event-driven, asynchronous\n  - Prototypal inheritance\n  - First-class functions\n• **Ecosystem:**\n  - Frontend: React, Vue, Angular, Svelte\n  - Backend: Node.js, Deno, Bun\n  - Mobile: React Native, Ionic\n  - Desktop: Electron\n• **TypeScript:** JavaScript with static types (created by Microsoft)\n• **npm:** World's largest package registry (2M+ packages)\n• **Use Cases:** Websites, web apps, servers, mobile apps, games, IoT\n• **Market:** ~65% of developers use JavaScript (Stack Overflow survey)\n• **Notable:** Despite its name, it has nothing to do with Java" },
  { keywords: ["rust", "what is rust"], answer: "**Rust** is a systems programming language:\n\n• **Created:** 2010 by Graydon Hoare (Mozilla)\n• **First Release:** 2015\n• **Key Features:**\n  - Memory safety without garbage collector\n  - Zero-cost abstractions\n  - Concurrency without data races\n  - Pattern matching, generics, traits\n• **Why Popular:**\n  - Most loved language (Stack Overflow survey 8 years running)\n  - Used by Linux kernel, Windows, Android, Firefox\n  - AWS, Google, Microsoft, Meta all use Rust\n• **Use Cases:** Operating systems, browsers, game engines, embedded systems, WebAssembly\n• **Ecosystem:** Cargo (package manager), crates.io (registry)\n• **Comparison:** Similar performance to C/C++ but much safer\n• **Notable:** Ferris the crab is its mascot 🦀" },
  { keywords: ["blockchain", "what is blockchain"], answer: "**Blockchain** is a distributed ledger technology:\n\n• **Definition:** A chain of blocks where each block contains transactions, cryptographically linked to the previous block\n• **Key Properties:**\n  - Decentralized: No single point of control\n  - Immutable: Once recorded, cannot be changed\n  - Transparent: All transactions visible to participants\n  - Secure: Protected by cryptography\n• **Cryptocurrencies:** Bitcoin (2009), Ethereum (2015)\n• **Smart Contracts:** Self-executing code on blockchain (Ethereum, Solana)\n• **Uses Beyond Crypto:** Supply chain, voting, identity verification, NFTs, DeFi\n• **Consensus Mechanisms:**\n  - Proof of Work (Bitcoin): Energy-intensive mining\n  - Proof of Stake (Ethereum): Validators stake coins\n• **Limitations:** Slow, energy consumption, scalability issues\n• **Web3:** Vision of decentralized internet built on blockchain" },
  { keywords: ["cloud computing", "what is cloud", "aws", "azure"], answer: "**Cloud Computing** is delivering computing services over the internet:\n\n• **Definition:** On-demand access to computing resources (servers, storage, databases, networking) over the internet\n• **Service Models:**\n  - IaaS: Virtual machines, storage (AWS EC2, Azure VMs)\n  - PaaS: Platform for building apps (Heroku, Google App Engine)\n  - SaaS: Software over internet (Gmail, Office 365)\n• **Major Providers:**\n  - AWS (Amazon): 31% market share — largest\n  - Azure (Microsoft): 25% — growing fastest\n  - Google Cloud: 11% — strong in AI/ML\n• **Benefits:** Scalability, cost savings, global reach, reliability\n• **Deployment Models:** Public, private, hybrid, multi-cloud\n• **Key Services:** Compute (VMs, containers), storage (S3, Blob), databases (RDS, CosmosDB), AI/ML services\n• **Market Size:** ~$600 billion (2024)" },
  { keywords: ["cybersecurity", "cyber security", "hacking", "information security"], answer: "**Cybersecurity** is protecting systems and data from digital attacks:\n\n• **Key Areas:**\n  - Network Security: Firewalls, intrusion detection\n  - Application Security: Secure coding, penetration testing\n  - Cloud Security: Protecting cloud infrastructure\n  - Endpoint Security: Antivirus, EDR\n  - Identity & Access Management: Authentication, authorization\n• **Common Attacks:**\n  - Phishing: Fake emails/websites to steal credentials\n  - Ransomware: Encrypts data, demands payment\n  - SQL Injection: Injecting malicious database queries\n  - XSS: Cross-site scripting attacks\n  - DDoS: Overwhelming servers with traffic\n• **Best Practices:** Strong passwords, 2FA, encryption, regular updates, security training\n• **Career:** Cybersecurity market ~$200B, millions of unfilled jobs\n• **Certifications:** CompTIA Security+, CEH, CISSP, OSCP\n• **Zero Trust:** Security model — never trust, always verify" },

  // Geography & History
  { keywords: ["president of india", "indian president"], answer: "**President of India:** Droupadi Murmu — the 15th President, serving since July 25, 2022. She is the first person from a tribal community and the second woman to hold this office.\n\n**Prime Minister:** Narendra Modi — serving since May 26, 2014 (third term from June 2024)." },
  { keywords: ["president of usa", "president of america", "us president", "who is the president"], answer: "**President of the United States:** Joe Biden — the 46th president, inaugurated January 20, 2021. He previously served as Vice President under Barack Obama (2009-2017)." },
  { keywords: ["capital of india", "india capital"], answer: "**Capital of India:** New Delhi — located in the National Capital Territory of Delhi, home to ~20 million people in the metro area." },
  { keywords: ["capital of usa", "us capital", "america capital", "capital of united states"], answer: "**Capital of the United States:** Washington, D.C. — located between Maryland and Virginia, home to the White House, Capitol Building, and Supreme Court." },
  { keywords: ["capital of japan", "japan capital"], answer: "**Capital of Japan:** Tokyo — the world's most populous metropolitan area (~37 million people). Known for technology, cuisine, and culture." },
  { keywords: ["capital of china", "china capital"], answer: "**Capital of China:** Beijing — population ~21 million, home to the Forbidden City, Great Wall, and Tiananmen Square." },
  { keywords: ["capital of france", "france capital"], answer: "**Capital of France:** Paris — the \"City of Light,\" population ~2.1 million (12M metro). Home to the Eiffel Tower, Louvre, and Notre-Dame." },
  { keywords: ["capital of uk", "capital of england", "capital of britain", "capital of united kingdom"], answer: "**Capital of the United Kingdom:** London — population ~9 million, financial center of Europe, home to Big Ben, Buckingham Palace, and the Tower of London." },
  { keywords: ["capital of germany", "germany capital"], answer: "**Capital of Germany:** Berlin — population ~3.6 million, known for its history, art scene, and the Brandenburg Gate." },
  { keywords: ["capital of russia", "russia capital"], answer: "**Capital of Russia:** Moscow — population ~12.5 million, the largest city in Europe, home to the Kremlin and Red Square." },
  { keywords: ["capital of brazil", "brazil capital"], answer: "**Capital of Brazil:** Brasília — a planned city, inaugurated in 1960, population ~3 million." },
  { keywords: ["capital of australia", "australia capital"], answer: "**Capital of Australia:** Canberra — not Sydney or Melbourne! Population ~450,000, purpose-built as capital." },
  { keywords: ["capital of canada", "canada capital"], answer: "**Capital of Canada:** Ottawa — population ~1 million, located in Ontario, home to Parliament Hill." },
  { keywords: ["capital of south korea", "korea capital"], answer: "**Capital of South Korea:** Seoul — population ~9.7 million (25M metro), a global tech and cultural hub." },

  // Science
  { keywords: ["what is gravity", "explain gravity"], answer: "**Gravity** is the force of attraction between objects with mass:\n\n• **Newton's Law (1687):** Every mass attracts every other mass. Force = G × m₁ × m₂ / r²\n• **Einstein's General Relativity (1915):** Gravity is the curvature of spacetime caused by mass and energy\n• **Key Facts:**\n  - G (gravitational constant) = 6.674 × 10⁻¹¹ N⋅m²/kg²\n  - Earth's gravity: 9.8 m/s²\n  - Moon's gravity: ~1/6 of Earth's\n  - Sun's gravity keeps planets in orbit\n- **Speed:** Gravity travels at the speed of light\n- **Black Holes:** Where gravity is so strong nothing escapes\n- **Tides:** Caused by Moon's gravity pulling on Earth's oceans\n- **Weakness:** Weakest of the four fundamental forces (10³⁶ times weaker than electromagnetic)" },
  { keywords: ["speed of light", "how fast is light"], answer: "**Speed of Light:** 299,792,458 meters per second (approximately 300,000 km/s or 186,000 miles/s).\n\n• **Key Facts:**\n  - Nothing can travel faster than light in vacuum\n  - Light from the Sun takes 8 minutes 20 seconds to reach Earth\n  - Light from the nearest star (Proxima Centauri) takes 4.24 years\n  - The observable universe is 93 billion light-years in diameter\n  - Einstein showed E=mc² — energy and mass are equivalent\n- **In Different Media:**\n  - Vacuum: 3 × 10⁸ m/s\n  - Water: ~2.25 × 10⁸ m/s (75% of c)\n  - Glass: ~2 × 10⁸ m/s (67% of c)\n  - Diamond: ~1.24 × 10⁸ m/s (41% of c)" },
  { keywords: ["what is dna", "explain dna"], answer: "**DNA (Deoxyribonucleic Acid)** is the molecule carrying genetic instructions:\n\n• **Structure:** Double helix (discovered 1953 by Watson & Crick)\n• **Building Blocks:** Nucleotides — A (adenine), T (thymine), G (guanine), C (cytosine)\n• **Base Pairing:** A-T and G-C (Chargaff's rules)\n• **Size:** Human DNA has ~3.2 billion base pairs\n• **Genes:** ~20,000-25,000 protein-coding genes\n• **Location:** In cell nucleus, organized into 23 pairs of chromosomes\n• **Functions:**\n  - Codes for proteins (the \"blueprint\" of life)\  - Determines traits (eye color, height, etc.)\n  - 99.9% identical between all humans\n• **Applications:**\n  - Forensic science (DNA profiling)\n  - Paternity testing\n  - Genetic medicine\n  - Ancestry/DNA testing\n  - CRISPR gene editing" },
  { keywords: ["what is atom", "atomic structure"], answer: "**Atom** is the basic unit of matter:\n\n• **Structure:**\n  - Nucleus: Protons (+) and Neutrons (neutral)\n  - Electron cloud: Electrons (-) orbiting\n• **Size:** ~100 picometers (10⁻¹⁰ m)\n• **118 Elements:** Hydrogen (1 proton) to Oganesson (118 protons)\n• **Key Models:**\n  - Dalton (1803): Solid sphere model\n  - Thomson (1904): Plum pudding model\n  - Rutherford (1911): Nuclear model\n  - Bohr (1913): Planetary model\n  - Quantum mechanical: Electron probability clouds\n• **Isotopes:** Same element, different neutrons (e.g., Carbon-12 vs Carbon-14)\n• **Ions:** Atoms with charge (lost/gained electrons)\n• **Bonding:** Ionic (transfer electrons), Covalent (share electrons), Metallic" },
  { keywords: ["what is energy", "types of energy"], answer: "**Energy** is the capacity to do work:\n\n• **Types:**\n  - Kinetic: Energy of motion (½mv²)\n  - Potential: Stored energy (gravitational, elastic, chemical)\n  - Thermal: Heat energy (molecular motion)\n  - Chemical: Stored in bonds (food, fuel)\n  - Nuclear: Stored in atoms (fission, fusion)\n  - Electromagnetic: Light, radio waves, X-rays\n  - Electrical: Flow of electrons\n• **Law of Conservation:** Energy cannot be created or destroyed, only transformed\n• **Units:** Joule (J), calorie (cal), kilowatt-hour (kWh)\n• **Einstein:** E=mc² — mass is a form of energy\n• **Sources:**\n  - Renewable: Solar, wind, hydro, geothermal\n  - Non-renewable: Coal, oil, natural gas\n  - Nuclear: Uranium fission\n• **Global Energy:** ~580,000 TWh/year consumed globally" },

  // Math
  { keywords: ["what is pi", "value of pi", "pi value"], answer: "**Pi (π)** is the ratio of a circle's circumference to its diameter:\n\n• **Value:** 3.14159265358979... (irrational, infinite, non-repeating)\n• **Formula:** π = C/d (circumference ÷ diameter)\n• **History:** Calculated for thousands of years — ancient Egyptians and Babylonians knew ~3.12-3.16\n• **Digits:** Computed to 100 trillion digits (2024)\n• **Common Approximations:** 22/7 ≈ 3.1428, 355/113 ≈ 3.1415929\n• **Uses:**\n  - Circumference: C = 2πr\n  - Area: A = πr²\n  - Volume of sphere: V = (4/3)πr³\n  - Normal distribution (Gaussian)\n  - Fourier transforms\n  - Many physics formulas\n• **Pi Day:** March 14 (3/14) — celebrated worldwide" },
  { keywords: ["what is zero", "who invented zero", "zero history"], answer: "**Zero (0)** is both a number and a concept:\n\n• **History:**\n  - Ancient Babylonians: Used placeholder (but not as a number)\n  - India (7th century): Brahmagupta first defined 0 as a number with rules\n  - Spread to Arab world, then Europe via Fibonacci\n• **Significance:**\n  - Placeholder in positional notation (101 vs 11)\n  - Additive identity: a + 0 = a\n  - Multiplicative annihilator: a × 0 = 0\n  - Enabled algebra, calculus, computer science\n• **Properties:**\n  - Even number\n  - Neither positive nor negative\n  - 0! = 1 (factorial)\n  - x⁰ = 1 (except 0⁰)\n• **In Computing:**\n  - Binary: 0 and 1\n  - Null pointer in C\n  - Falsy value in JavaScript\n• **Philosophy:** Heated debate about whether zero \"exists\"" },
  { keywords: ["fibonacci", "fibonacci sequence"], answer: "**Fibonacci Sequence:** 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...\n\n• **Rule:** Each number is sum of two preceding ones (F(n) = F(n-1) + F(n-2))\n• **Named After:** Leonardo of Pisa (Fibonacci), 1202 book \"Liber Abaci\"\n• **Golden Ratio:** Ratio approaches φ = 1.6180339887... (golden ratio)\n• **In Nature:**\n  - Flower petals (lilies: 3, buttercups: 5, daisies: 34)\n  - Pinecone spirals\n  - Sunflower seeds\n  - Shell spirals (nautilus)\n  - Hurricane formation\n• **In Math:**\n  - Golden ratio (φ = (1+√5)/2)\n  - Fibonacci heap data structure\n  - Continued fractions\n• **Applications:** Stock market analysis, algorithms, architecture, art composition" },
  { keywords: ["what is 2+2", "2 plus 2", "what does 2+2 equal"], answer: "**2 + 2 = 4**\n\nThis is one of the most fundamental arithmetic facts. In binary (computing), 10 + 10 = 100." },

  // Programming
  { keywords: ["what is api", "explain api"], answer: "**API (Application Programming Interface)** is a set of rules for software communication:\n\n• **Definition:** A contract that defines how software components interact\n• **Types:**\n  - REST API: Uses HTTP methods (GET, POST, PUT, DELETE)\n  - GraphQL: Query language for APIs (Facebook)\n  - WebSocket: Real-time bidirectional communication\n  - SOAP: XML-based (legacy, enterprise)\n  - gRPC: High-performance (Google)\n• **How It Works:**\n  1. Client sends request to API endpoint\n  2. API processes request\n  3. API returns response (JSON, XML, etc.)\n• **Examples:**\n  - Twitter API: Access tweets, users\n  - Stripe API: Process payments\n  - Google Maps API: Show maps\n  - OpenAI API: Access GPT models\n• **Authentication:** API keys, OAuth, JWT tokens\n• **Status Codes:** 200 (OK), 404 (Not Found), 500 (Server Error)\n• **Rate Limiting:** Limits requests per time period" },
  { keywords: ["what is sql", "explain sql"], answer: "**SQL (Structured Query Language)** is for managing databases:\n\n• **Purpose:** Query, insert, update, and delete data in relational databases\n• **Key Commands:**\n  - SELECT: Retrieve data\n  - INSERT: Add new records\n  - UPDATE: Modify existing records\n  - DELETE: Remove records\n  - CREATE TABLE: Create new tables\n  - ALTER TABLE: Modify table structure\n  - JOIN: Combine data from multiple tables\n• **Example:**\n  ```sql\n  SELECT name, age FROM users WHERE age > 18 ORDER BY name;\n  ```\n• **Databases:** MySQL, PostgreSQL, SQLite, SQL Server, Oracle\n• **NoSQL Alternatives:** MongoDB (document), Redis (key-value), Neo4j (graph)\n• **Career:** DBA, data analyst, backend developer\n• **Complexity:** Simple queries are easy; advanced queries with joins/subqueries can be complex" },
  { keywords: ["what is git", "explain git"], answer: "**Git** is a distributed version control system:\n\n• **Created:** 2005 by Linus Torvalds (Linux creator)\n• **Purpose:** Track changes in code, enable collaboration\n• **Key Concepts:**\n  - Repository: Project folder tracked by Git\n  - Commit: Snapshot of changes\n  - Branch: Independent line of development\n  - Merge: Combining branches\n  - Pull Request: Proposed changes for review\n• **Basic Commands:**\n  - git init: Create new repo\n  - git add: Stage changes\n  - git commit: Save changes\n  - git push: Upload to remote\n  - git pull: Download from remote\n  - git branch: Manage branches\n• **GitHub:** Web-based Git hosting (owned by Microsoft)\n• **Alternatives:** GitLab, Bitbucket, Azure DevOps\n• **Used By:** 93%+ of developers, every major tech company" },
  { keywords: ["what is html", "explain html"], answer: "**HTML (HyperText Markup Language)** is the standard for web pages:\n\n• **Purpose:** Structure and content of web pages\n• **Tags:** Elements enclosed in < > (e.g., <p>, <div>, <h1>)\n• **HTML5:** Latest version (2014), semantic elements\n• **Key Elements:**\n  - Headings: h1-h6\n  - Paragraphs: p\n  - Links: a (anchor)\n  - Images: img\n  - Lists: ul, ol, li\n  - Tables: table, tr, td\n  - Forms: form, input, button\n  - Semantic: header, nav, main, article, footer\n• **Relationship:**\n  - HTML: Structure\n  - CSS: Styling\n  - JavaScript: Behavior\n• **Example:**\n  ```html\n  <h1>Hello World</h1>\n  <p>This is a paragraph.</p>\n  ```\n• **Learning Path:** HTML → CSS → JavaScript → Frameworks (React, Vue)" },
  { keywords: ["what is css", "explain css"], answer: "**CSS (Cascading Style Sheets)** styles web pages:\n\n• **Purpose:** Control layout, colors, fonts, animations\n• **Syntax:** selector { property: value; }\n• **Example:**\n  ```css\n  body { background: #0F0E0A; color: #F6F3EE; }\n  .button { background: #D97757; border-radius: 8px; }\n  ```\n• **Key Concepts:**\n  - Selectors: Target elements (class, id, attribute)\n  - Box Model: margin, border, padding, content\n  - Flexbox: 1D layout\n  - Grid: 2D layout\n  - Responsive: media queries, clamp()\n  - Animations: @keyframes, transitions\n• **Frameworks:** Tailwind CSS, Bootstrap, Sass, Less\n• **CSS-in-JS:** Styled-components, Emotion (with React)\n• **Modern CSS:** Container queries, cascade layers, :has() selector" },

  // Business & Finance
  { keywords: ["what is gst", "explain gst"], answer: "**GST (Goods and Services Tax)** is an indirect tax on goods and services:\n\n• **Type:** Value-added tax (consumption tax)\n• **Countries:** India, Canada, Australia, Singapore, Malaysia, New Zealand\n• **India GST Rates:**\n  - 0%: Essential items (fresh vegetables, milk)\n  - 5%: Packaged food, footwear <₹1000\n  - 12%: Processed food, computers\n  - 18%: Most goods and services\n  - 28%: Luxury items, cars, tobacco\n• **How It Works:**\n  - Input Tax Credit (ITC): Businesses can claim credit for tax paid on inputs\n  - Destination-based: Tax collected where goods are consumed\n  - Multiple rates: Different rates for different categories\n• **Registration:** Mandatory if turnover exceeds ₹40 lakhs (₹20 lakhs for services)\n• **Returns:** GSTR-1 (monthly/quarterly), GSTR-3B (summary return)\n• **Benefits:** Reduced tax evasion, unified market, easier compliance" },
  { keywords: ["what is vat", "explain vat"], answer: "**VAT (Value Added Tax)** is a consumption tax on value added at each stage of production:\n\n• **Definition:** Tax on the difference between the cost of materials and selling price\n• **How It Works:**\n  - Each business charges VAT on sales\n  - Each business can reclaim VAT paid on purchases\n  - Only the value added is actually taxed\n• **Rates:** Vary by country (15-25% typically)\n• **Countries:** Used in 160+ countries (EU, UK, most of the world)\n• **Example:**\n  - Farmer sells wheat for $100 + $20 VAT = $120\n  - Baker buys for $120, pays $20 VAT (reclaims $20)\n  - Baker sells bread for $200 + $40 VAT = $240\n  - Government collects $40 (from final consumer)\n• **Difference from GST:** GST is essentially the same thing — many countries use the terms interchangeably\n• **EU VAT:** Standard rates range from 17% (Luxembourg) to 27% (Hungary)" },
  { keywords: ["what is invoice", "explain invoice"], answer: "**Invoice** is a commercial document requesting payment:\n\n• **Purpose:** Record of goods/services provided, amount owed, payment terms\n• **Key Elements:**\n  - Invoice number and date\n  - Seller and buyer details\n  - Itemized list of products/services\n  - Prices and quantities\n  - Tax (GST/VAT)\n  - Total amount\n  - Payment terms and due date\n• **Types:**\n  - Proforma: Pre-delivery estimate\n  - Tax Invoice: Official, includes tax details\n  - Credit Note: For returns/adjustments\n  - Self-billing: Buyer creates invoice for supplier\n• **Legal Requirements:**\n  - Sequential numbering\n  - Must include tax registration number\n  - Must show tax separately\n  - Retention period (usually 5-7 years)\n• **Tools:** Use our **Invoice Generator** to create professional invoices instantly!" },
  { keywords: ["stock market", "share market", "what is stock"], answer: "**Stock Market** is where shares of publicly traded companies are bought and sold:\n\n• **Definition:** A marketplace for trading ownership shares (equity) of companies\n• **Key Concepts:**\n  - Stock/Share: Unit of ownership in a company\n  - IPO: Initial Public Offering (first time shares are sold to public)\n  - Market Capitalization: Total value of all shares (share price × total shares)\n  - Dividend: Distribution of profits to shareholders\n  - Bull Market: Rising prices\n  - Bear Market: Falling prices\n• **Major Exchanges:**\n  - NYSE (New York): Largest by market cap\n  - NASDAQ: Tech-heavy, electronic trading\n  - LSE (London)\n  - NSE/BSE (India)\n  - TSE (Tokyo)\n• **How to Invest:**\n  - Through brokerages (Zerodha, Robinhood)\n  - Index funds (S&P 500)\n  - ETFs (Exchange Traded Funds)\n• **Risk:** Prices are volatile — can lose money" },
  { keywords: ["mutual fund", "what is mutual fund"], answer: "**Mutual Fund** is a professionally managed investment pool:\n\n• **Definition:** Pools money from many investors to buy a diversified portfolio of stocks, bonds, or other securities\n• **How It Works:**\n  - Investor buys units/shares of the fund\n  - Fund manager invests the money\n  - Returns (or losses) are distributed proportionally\n  - NAV (Net Asset Value) = Total assets ÷ Total units\n• **Types:**\n  - Equity Fund: Invests in stocks\n  - Debt/Bond Fund: Invests in bonds\n  - Hybrid: Mix of equity and debt\n  - Index Fund: Tracks a market index (S&P 500)\n  - ELSS: Tax-saving equity fund (India)\n• **Advantages:**\n  - Professional management\n  - Diversification (reduces risk)\n  - Low minimum investment\n  - Liquidity (easy to buy/sell)\n• **Fees:**\n  - Expense Ratio: 0.1% - 2% annually\n  - Entry/Exit Load: Sometimes charged\n• **Returns:** Average 10-12% annually (equity, long term)" },
  { keywords: ["what is inflation", "explain inflation"], answer: "**Inflation** is the rate at which prices rise over time:\n\n• **Definition:** A general increase in prices and fall in purchasing power of money\n• **How It's Measured:**\n  - CPI (Consumer Price Index): Tracks price changes of a basket of goods\n  - WPI (Wholesale Price Index): Tracks wholesale prices\n  - PCE (Personal Consumption Expenditures): Fed's preferred measure\n• **Causes:**\n  - Demand-pull: Too much money chasing too few goods\n  - Cost-push: Rising production costs (oil, wages)\n  - Monetary: Too much money printed (quantitative easing)\n• **Types:**\n  - Creeping: 1-3% (healthy)\n  - Galloping: 10-50% (dangerous)\n  - Hyperinflation: 50%+/month (catastrophic)\n• **Examples:**\n  - US inflation peaked at 9.1% (June 2022)\n  - Zimbabwe hyperinflation: 79.6 billion % (2008)\n  - Venezuela: 1,000,000% (2018)\n• **Impact:**\n  - Reduces purchasing power\n  - Benefits borrowers (debt becomes cheaper)\n  - Hurts savers (savings lose value)" },

  // General Knowledge
  { keywords: ["what is water", "chemical formula of water"], answer: "**Water (H₂O)** is essential for life:\n\n• **Formula:** Two hydrogen atoms + one oxygen atom\n• **Properties:**\n  - Boiling point: 100°C (212°F)\n  - Freezing point: 0°C (32°F)\n  - Density: 1 g/cm³ (ice is less dense — it floats!)\n  - Universal solvent (dissolves more substances than any other liquid)\n• **States:** Solid (ice), liquid (water), gas (steam/vapor)\n• **Importance:**\n  - 60% of human body is water\n  - Essential for all known life\n  - Covers 71% of Earth's surface\n  - Used for drinking, agriculture, industry, cleaning\n• **Water Cycle:** Evaporation → Condensation → Precipitation → Collection\n• **Pure Water:** Tasteless, odorless, colorless\n• **pH:** 7 (neutral) — acid rain has pH < 5.6" },
  { keywords: ["what is sun", "about sun"], answer: "**The Sun** is the star at the center of our solar system:\n\n• **Type:** Yellow dwarf star (G-type main-sequence)\n• **Age:** ~4.6 billion years old (mid-life)\n• **Size:** 1.4 million km diameter (109× Earth)\n• **Temperature:** 5,500°C surface, 15 million°C core\n• **Mass:** 99.86% of solar system's total mass\n• **Composition:** 73% hydrogen, 25% helium, 2% heavier elements\n• **Energy:** Nuclear fusion — 600 million tons of hydrogen fused into helium every second\n• **Light:** Takes 8 minutes 20 seconds to reach Earth\n• **Distance:** 150 million km (1 AU)\n• **Lifespan:** Will become a red giant in ~5 billion years\n• **Solar Flares:** Can disrupt Earth's communications\n• **Importance:**\n  - Source of light and heat for Earth\n  - Drives weather and climate\n  - Enables photosynthesis (all food chains)\n  - Renewable energy source (solar panels)" },
  { keywords: ["what is moon", "about moon"], answer: "**The Moon** is Earth's only natural satellite:\n\n• **Distance:** 384,400 km from Earth\n• **Diameter:** 3,474 km (about 1/4 of Earth's)\n• **Age:** ~4.5 billion years (formed from debris after Mars-sized impact)\n• **Surface:**\n  - No atmosphere (no wind/weather)\n  - Temperature: -173°C to 127°C\n  - Covered in craters and maria (dark plains)\n  - 6 human missions landed (1969-1972)\n• **Phases:** New Moon → Crescent → Quarter → Gibbous → Full Moon (29.5 day cycle)\n• **Tides:** Moon's gravity causes ocean tides\n• **Importance:**\n  - Stabilizes Earth's axial tilt (23.5°)\n  - Causes tides (important for marine life)\n  - Cultural significance (calendars, mythology)\n  - Future: Lunar base, helium-3 mining\n• **Apollo Missions:** 12 humans walked on the Moon (1969-1972)" },
  { keywords: ["what is oxygen", "oxygen element"], answer: "**Oxygen (O)** is essential for life:\n\n• **Symbol:** O (from Greek \"oxys\" = acid)\n• **Atomic Number:** 8\n• **Appearance:** Colorless, odorless gas\n• **Properties:**\n  - Supports combustion (but doesn't burn itself)\n  - 3 forms: O₂ (normal), O₃ (ozone), nascent oxygen\n• **Uses:**\n  - Breathing (essential for animal life)\n  - Combustion (burning fuel)\n  - Welding and cutting metals\n  - Medical oxygen\n  - Water treatment\n• **Importance:**\n  - 21% of Earth's atmosphere\n  - 46% of Earth's crust by mass\n  - Makes up 65% of human body by mass\n• **Ozone Layer:** O₃ in stratosphere blocks UV radiation\n• **Discovery:** Carl Wilhelm Scheele (1772), Joseph Priestley (1774)\n• **Oxygen Cycle:** Photosynthesis produces O₂, respiration uses O₂" },
  { keywords: ["what is carbon", "carbon element"], answer: "**Carbon (C)** is the basis of all known life:\n\n• **Symbol:** C\n• **Atomic Number:** 6\n• **Allotropes:**\n  - Diamond: Hardest natural substance, each C bonded to 4 others\n  - Graphite: Soft, conducts electricity, used in pencils\n  - Graphene: Single layer of graphite, strongest material known\n  - Fullerenes (C₆₀): Buckyballs\n  - Carbon nanotubes: Extraordinary strength\n• **Importance:**\n  - Basis of all organic chemistry\n  - Found in all living organisms\n  - 4th most abundant element in the universe\n• **Carbon Cycle:** Plants absorb CO₂ → animals eat plants → decomposition → CO₂ released\n• **Isotopes:** C-12 (stable), C-13 (stable), C-14 (radioactive, used in dating)\n• **Carbon Dating:** C-14 decays over 5,730 years — used to date ancient objects\n• **Carbon Footprint:** Amount of CO₂ produced by human activities" },

  // People & Companies
  { keywords: ["ceo of google", "google ceo", "who leads google", "who runs google", "sundar pichai"], answer: "**Sundar Pichai** is the CEO of Alphabet Inc. (Google's parent company). He has been leading Google since 2015 and became CEO of Alphabet in 2019. Born in Chennai, India, he studied at IIT Kharagpur and Stanford University. Under his leadership, Google has expanded into AI (Gemini), cloud computing, and hardware. He is one of the most influential tech leaders in the world." },
  { keywords: ["ceo of microsoft", "microsoft ceo", "satya nadella"], answer: "**Satya Nadella** is the CEO of Microsoft, a position he has held since 2014. Born in Hyderabad, India, he transformed Microsoft from a Windows-focused company to a cloud and AI leader. Under his leadership, Microsoft's market cap grew from $300 billion to over $3 trillion. He is known for his leadership philosophy of empathy and growth mindset." },
  { keywords: ["ceo of apple", "apple ceo", "tim cook"], answer: "**Tim Cook** is the CEO of Apple Inc., succeeding Steve Jobs in 2011. He previously served as Apple's Chief Operating Officer. Under his leadership, Apple launched Apple Watch, AirPods, Apple Silicon (M-series chips), and Apple Vision Pro. He is known for his operational expertise and focus on privacy." },
  { keywords: ["ceo of amazon", "amazon ceo", "jeff bezos", "andy jassy"], answer: "**Andy Jassy** is the CEO of Amazon since Jeff Bezos stepped down in 2021. Bezos founded Amazon in 1994 as an online bookstore, growing it into the world's largest e-commerce and cloud computing company. Jassy previously led Amazon Web Services (AWS), the world's largest cloud platform." },
  { keywords: ["ceo of tesla", "tesla ceo", "elon musk"], answer: "**Elon Musk** is the CEO of Tesla, SpaceX, and owner of X (Twitter). Born in South Africa, he co-founded PayPal, then founded SpaceX (2002) and joined Tesla as chairman (2004), becoming CEO in 2008. He is the wealthiest person in the world with a net worth exceeding $200 billion." },
  { keywords: ["ceo of meta", "meta ceo", "mark zuckerberg", "facebook ceo"], answer: "**Mark Zuckerberg** is the CEO and co-founder of Meta Platforms (formerly Facebook). He launched Facebook from his Harvard dorm room in 2004 at age 19. Under his leadership, Meta acquired Instagram and WhatsApp, and is now focused on building the metaverse and AI. He is one of the youngest self-made billionaires." },
  { keywords: ["who is elon musk", "tell me about elon musk"], answer: "**Elon Musk** is a South African-born entrepreneur and business magnate:\n\n• **Companies:** Tesla (CEO), SpaceX (CEO), X/Twitter (owner), Neuralink, The Boring Company\n• **Net Worth:** ~$200+ billion (wealthiest person in the world)\n• **Born:** June 28, 1971, in Pretoria, South Africa\n• **Education:** University of Pennsylvania (Physics & Economics)\n• **Key Achievements:**\n  - Co-founded PayPal (sold to eBay for $1.5B)\n  - Founded SpaceX — revolutionized space travel with reusable rockets\n  - Led Tesla to become the world's most valuable car company\n  - Pioneered electric vehicles, solar energy, and AI\n• **Notable:** Known for ambitious goals like colonizing Mars, creating brain-computer interfaces, and building hyperloops" },
  { keywords: ["who is jeff bezos", "tell me about jeff bezos"], answer: "**Jeff Bezos** is an American entrepreneur and founder of Amazon:\n\n• **Born:** January 12, 1964, in Albuquerque, New Mexico\n• **Education:** Princeton University (Electrical Engineering & Computer Science)\n• **Amazon:** Founded in 1994 as an online bookstore, grew into the world's largest e-commerce company\n• **Blue Origin:** Founded in 2000 — space exploration company\n• **Washington Post:** Purchased in 2013 for $250 million\n• **Net Worth:** ~$150+ billion\n• **Key Achievements:**\n  - Created Amazon Web Services (AWS) — largest cloud platform\n  - Pioneered online shopping, Alexa, Kindle, Prime\n  - Invented the concept of customer obsession over competitor focus\n• **Stepped down as Amazon CEO in 2021** to focus on Blue Origin and philanthropy" },
  { keywords: ["who is bill gates", "tell me about bill gates"], answer: "**Bill Gates** is an American entrepreneur, philanthropist, and co-founder of Microsoft:\n\n• **Born:** October 28, 1955, in Seattle, Washington\n• **Microsoft:** Co-founded in 1975 with Paul Allen — created Windows, Office, and dominated personal computing\n• **Philanthropy:** Co-founded the Bill & Melinda Gates Foundation — the world's largest private charity\n• **Net Worth:** ~$100+ billion\n• **Key Achievements:**\n  - Made personal computing accessible to everyone\n  - Led Microsoft to become the world's largest software company\n  - Foundation has spent $50+ billion on global health, education, and poverty\n  - Eradicated polio in most of the world\n• **Currently:** Focuses on climate change, global health, and education through the Gates Foundation" },
  { keywords: ["spider man director", "who directed spider man", "spiderman director"], answer: "**Sam Raimi** directed the original Spider-Man trilogy (2002-2007):\n\n• **Spider-Man (2002):** Tobey Maguire as Peter Parker — grossed $821 million\n• **Spider-Man 2 (2004):** Widely considered one of the best superhero films ever\n• **Spider-Man 3 (2007):** Mixed reception but grossed $890 million\n\nOther Spider-Man directors:\n• **Marc Webb:** The Amazing Spider-Man (2012) and sequel (2014)\n• **Jon Watts:** Spider-Man: Homecoming, Far From Home, No Way Home (Tom Holland)\n• **Sony's Spider-Verse:** Animated films directed by Bob Persichetti, Peter Ramsey, Rodney Rothman\n\nSam Raimi's films are credited with launching the modern superhero film era." },
  { keywords: ["who is sundar pichai", "tell me about sundar pichai"], answer: "**Sundar Pichai** (Pichai Sundararajan) is the CEO of Alphabet Inc. and Google:\n\n• **Born:** June 10, 1972, in Madurai, India\n• **Education:** IIT Kharagpur (Metallurgical Engineering), Stanford University (MS), Wharton (MBA)\n• **Joined Google:** 2004 — led development of Chrome, Gmail, and Google Maps\n• **CEO of Google:** 2015\n• **CEO of Alphabet:** 2019\n• **Key Achievements:**\n  - Launched Chrome browser (dominant market share)\n  - Led Google's AI-first transformation\n  - Oversaw development of Gemini AI\n  - Expanded Google Cloud to compete with AWS and Azure\n• **Known for:** Calm leadership style, focus on AI and user experience" },

  // Movies & Entertainment
  { keywords: ["director of titanic", "who directed titanic"], answer: "**James Cameron** directed Titanic (1997). The film starred Leonardo DiCaprio and Kate Winslet, won 11 Academy Awards including Best Picture, and became the highest-grossing film of all time at the time ($2.2 billion). Cameron is also known for Avatar, Terminator 2, and Aliens." },
  { keywords: ["avatar movie", "avator movie", "who directed avatar", "director of avatar"], answer: "**James Cameron** directed Avatar (2009) and Avatar: The Way of Water (2022). Avatar revolutionized 3D filmmaking and became the highest-grossing film ever ($2.9 billion). The film is set on the alien moon Pandora, where humans mine a valuable mineral while the indigenous Na'vi people fight to protect their home. Cameron is known for pushing technological boundaries in filmmaking." },
  { keywords: ["director of interstellar", "who directed interstellar", "interstellar movie"], answer: "**Christopher Nolan** directed Interstellar (2014), a sci-fi epic about space exploration and time dilation. The film starred Matthew McConaughey and won the Academy Award for Best Visual Effects. Nolan is also known for The Dark Knight trilogy, Inception, and Oppenheimer." },
  { keywords: ["who is srk", "shah rukh khan", "tell me about srk", "srk movies"], answer: "**Shah Rukh Khan** (SRK) is an Indian actor, often called the \"King of Bollywood\":\n\n• **Born:** November 2, 1965, in New Delhi, India\n• **Career:** 30+ years, 90+ films\n• **Famous Films:** DDLJ, Chak De India, My Name Is Khan, Pathaan, Jawan\n• **Awards:** 14 Filmfare Awards, Padma Shri, Ordre des Arts et des Lettres (France)\n• **Net Worth:** ~$770 million — one of the richest actors in the world\n• **Fan Following:** 1 billion+ fans worldwide, especially in India, Middle East, and Europe\n• **Known for:** Romantic roles, dance sequences, and charismatic screen presence" },
  { keywords: ["ben 10", "ben ten", "what is ben 10"], answer: "**Ben 10** is a popular animated franchise created by \"Man of Action\" (Duncan Rouleau, Joe Casey, Joe Kelly, Steven T. Seagle) and produced by Cartoon Network:\n\n• **Premise:** A 10-year-old boy named Ben Tennyson finds an alien watch-like device called the \"Omnitrix\" that allows him to transform into 10 different alien species\n• **Original Series:** Aired from 2005 to 2008 (52 episodes)\n• **Spin-offs:**\n  - Ben 10: Alien Force (2008-2010)\n  - Ben 10: Ultimate Alien (2010-2012)\n  - Ben 10: Omniverse (2012-2014)\n  - Ben 10 (2016 reboot)\n• **Key Aliens:** Heatblast, Four Arms, XLR8, Diamondhead, Ghostfreak, Upgrade, Wildmutt, Stinkfly, Ripjaws, Grey Matter\n• **Movies:** Ben 10: Secret of the Omnitrix, Ben 10 vs. the Universe\n• **Games:** Multiple video games across platforms\n• **Cultural Impact:** One of the most popular animated franchises of the 2000s, beloved by kids and nostalgic for young adults" },
  { keywords: ["spider man", "spiderman", "who is spider man", "what is spider man"], answer: "**Spider-Man** is a Marvel Comics superhero created by Stan Lee and Steve Ditko:\n\n• **First Appearance:** Amazing Fantasy #15 (August 1962)\n• **Alter Ego:** Peter Parker — a high school student bitten by a radioactive spider\n• **Powers:** Superhuman strength, wall-crawling, spider-sense (danger awareness), web-slinging\n• **Movies:**\n  - Sam Raimi trilogy (2002-2007): Tobey Maguire\n  - Amazing Spider-Man (2012-2014): Andrew Garfield\n  - MCU Spider-Man (2017-present): Tom Holland\n  - Spider-Verse animated (2018-present): Miles Morales\n• **Iconic Villains:** Green Goblin, Doctor Octopus, Venom, Sandman, Vulture, Mysterio, Electro\n• **Catchphrase:** \"With great power comes great responsibility\"\n• **Popularity:** One of the most recognizable and beloved superheroes worldwide" },
  { keywords: ["avengers movie", "what is avengers", "avengers explained"], answer: "**The Avengers** is a superhero team from Marvel Comics and the Marvel Cinematic Universe (MCU):\n\n• **MCU Films:**\n  - The Avengers (2012)\n  - Avengers: Age of Ultron (2015)\n  - Avengers: Infinity War (2018)\n  - Avengers: Endgame (2019) — highest-grossing film ever ($2.79 billion)\n• **Key Characters:** Iron Man, Captain America, Thor, Hulk, Black Widow, Hawkeye, Spider-Man, Black Panther, Doctor Strange\n• **Directed by:** Russo Brothers (Infinity War & Endgame), Joss Whedon (first two)\n• **Plot:** Earth's mightiest heroes team up to face threats too powerful for any single hero — from Loki to Thanos\n• **Cultural Impact:** The Infinity Saga (22 films) is the highest-grossing film franchise ever ($22.5 billion)" },
  { keywords: ["batman", "who is batman", "what is batman"], answer: "**Batman** is a DC Comics superhero created by Bob Kane and Bill Finger:\n\n• **First Appearance:** Detective Comics #27 (May 1939)\n• **Alter Ego:** Bruce Wayne — a billionaire philanthropist who witnessed his parents' murder as a child\n• **Powers:** No superhuman powers — relies on intelligence, martial arts, detective skills, and advanced technology\n• **Movies:**\n  - Tim Burton: Batman (1989), Batman Returns (1992)\n  - Christopher Nolan: The Dark Knight Trilogy (2005-2012)\n  - DCEU: Batman v Superman (2016), The Batman (2022)\n• **Iconic Villains:** Joker, Two-Face, Riddler, Penguin, Catwoman, Scarecrow, Bane\n• **Base:** Batcave in Gotham City\n• **Catchphrase:** \"I am vengeance, I am the night, I am Batman!\"\n• **Cultural Impact:** One of the most iconic and adaptable superheroes in history" },
  { keywords: ["dragon ball", "dragonball", "what is dragon ball"], answer: "**Dragon Ball** is a Japanese manga and anime franchise created by Akira Toriyama:\n\n• **Original Manga:** 1984-1995 (519 chapters)\n• **Anime Series:**\n  - Dragon Ball (1986-1989): Goku's childhood adventures\n  - Dragon Ball Z (1989-1996): Adult Goku fights powerful enemies\n  - Dragon Ball GT (1996-1997): Non-canon sequel\n  - Dragon Ball Super (2015-2018): Canon continuation\n• **Plot:** Follows Son Goku from childhood to adulthood as he trains in martial arts and explores the world in search of the seven Dragon Balls\n• **Key Concepts:** Saiyans, Super Saiyan transformations, Ki energy, Dragon Balls (grant wishes)\n• **Famous Sagas:** Saiyan, Frieza, Cell, Buu, Tournament of Power\n• **Cultural Impact:** One of the most influential manga/anime ever, inspired Naruto, One Piece, and many others" },
  { keywords: ["naruto", "what is naruto", "tell me about naruto"], answer: "**Naruto** is a Japanese manga and anime series created by Masashi Kishimoto:\n\n• **Manga:** 1999-2014 (700 chapters)\n• **Anime:** Naruto (2002-2007), Naruto Shippuden (2007-2017), Boruto (2017-present)\n• **Plot:** Follows Naruto Uzumaki, a young ninja who dreams of becoming Hokage (leader of his village) while dealing with the Nine-Tailed Fox spirit sealed inside him\n• **Key Characters:** Naruto, Sasuke, Sakura, Kakashi, Itachi, Madara, Hashirama\n• **Themes:** Friendship, perseverance, never giving up, bonds between people\n• **Power Systems:** Chakra, jutsu (techniques),Sharingan, Rasengan\n• **Movies:** Multiple films including The Last: Naruto the Movie\n• **Cultural Impact:** One of the \"Big Three\" anime (with One Piece and Bleach), massive global fanbase" },
  { keywords: ["one piece", "what is one piece", "tell me about one piece"], answer: "**One Piece** is a Japanese manga and anime series created by Eiichiro Oda:\n\n• **Manga:** 1997-present (1100+ chapters, still ongoing)\n• **Anime:** 1999-present (1100+ episodes)\n• **Plot:** Follows Monkey D. Luffy, a young pirate with a rubber body, as he explores the Grand Line in search of the legendary \"One Piece\" treasure to become King of the Pirates\n• **Key Characters:** Luffy, Zoro, Nami, Usopp, Sanji, Chopper, Robin, Franky, Brook, Jinbe\n• **World:** Complex world with unique islands, Devil Fruits (grant powers), Marines, pirates, and Yonko (Four Emperors)\n• **Milestones:**\n  - Best-selling manga series in history (500+ million copies)\n  - Longest-running anime currently on air\n  - Live-action Netflix series (2023-present)\n• **Themes:** Freedom, dreams, friendship, adventure, will of D." },
  { keywords: ["cricket", "what is cricket", "explain cricket"], answer: "**Cricket** is a bat-and-ball sport played between two teams of 11 players:\n\n• **Origin:** England (16th century)\n• **How to Play:**\n  - Batting team scores runs by hitting the ball and running between two wickets\n  - Bowling/fielding team tries to get batters out (bowled, caught, LBW, run out)\n  - Each team bats once or twice depending on format\n• **Formats:**\n  - Test Cricket: 5 days, traditional format\n  - One Day International (ODI): 50 overs per team\n  - T20: 20 overs per team (fastest, most popular)\n• **Major Events:**\n  - ICC Cricket World Cup (ODI, every 4 years)\n  - ICC T20 World Cup (every 2 years)\n  - The Ashes (England vs Australia)\n  - Indian Premier League (IPL) — world's richest cricket league\n• **Top Teams:** India, Australia, England, South Africa, Pakistan\n• **Famous Players:** Sachin Tendulkar, Virat Kohli, Don Bradman, Brian Lara, Shane Warne" },
  { keywords: ["football", "what is football", "explain football", "soccer"], answer: "**Football (Soccer)** is the world's most popular sport:\n\n• **Origin:** England (1863, modern rules)\n• **How to Play:** Two teams of 11 players try to score by getting the ball into the opponent's goal\n• **Rules:**\n  - 90 minutes (two 45-minute halves)\n  - Offside rule\n  - Yellow/red cards for fouls\n  - VAR (Video Assistant Referee) introduced in 2018\n• **Major Events:**\n  - FIFA World Cup (every 4 years, most-watched sporting event)\n  - UEFA Champions League (Europe's top clubs)\n  - Premier League (England, most-watched league)\n  - La Liga (Spain), Serie A (Italy), Bundesliga (Germany)\n• **Top Players:** Lionel Messi, Cristiano Ronaldo, Pelé, Diego Maradona, Zinedine Zidane\n• **Top Clubs:** Real Madrid, Barcelona, Manchester United, Bayern Munich, Liverpool\n• **Fan Base:** ~4 billion fans worldwide" },
  { keywords: ["basketball", "what is basketball", "explain basketball"], answer: "**Basketball** is a team sport played on a rectangular court:\n\n• **Origin:** Created by Dr. James Naismith in 1891 in Springfield, Massachusetts\n• **How to Play:** Two teams of 5 players try to score by shooting a ball through the opponent's hoop (10 feet high)\n• **Rules:**\n  - NBA games: 4 quarters of 12 minutes\n  - 3-point line, free throws, dunking\n  - Shot clock (24 seconds to shoot)\n• **NBA (National Basketball Association):**\n  - 30 teams, most prestigious basketball league\n  - Season: October to June\n  - Famous teams: Lakers, Celtics, Warriors, Bulls\n• **Greatest Players:**\n  - Michael Jordan: 6 championships, widely considered the GOAT\n  - LeBron James: 4 championships, all-time leading scorer\n  - Kobe Bryant: 5 championships, \"Black Mamba\"\n  - Kareem Abdul-Jabbar, Magic Johnson, Larry Bird\n• **FIBA World Cup:** International tournament\n• **Global Popularity:** ~2 billion fans worldwide" },

  // Technology
  { keywords: ["what is chatgpt", "tell me about chatgpt", "explain chatgpt"], answer: "**ChatGPT** is an AI chatbot developed by OpenAI:\n\n• **Launched:** November 30, 2022\n• **Based on:** GPT (Generative Pre-trained Transformer) models\n• **GPT-3.5:** Initial model, 175 billion parameters\n• **GPT-4:** Multimodal (text + images), released March 2023\n• **GPT-4o:** Latest model, faster and cheaper\n• **Features:** Conversational AI, writing, coding, analysis, math, creative tasks\n• **Growth:** 100M users in 2 months (fastest-growing app ever)\n• **Revenue:** ~$5 billion/year (2024)\n• **Plus/Pro:** $20/month for GPT-4 access, $200/month for Pro\n• **API:** Available for developers to build apps\n• **Plugins:** Connect to web browsing, code interpreter, plugins\n• **Voice/Video:** Real-time voice and video conversations\n\nChatGPT popularized AI chatbots and triggered the current AI revolution." },
  { keywords: ["what is instagram", "tell me about instagram"], answer: "**Instagram** is a photo and video sharing social media platform:\n\n• **Founded:** October 6, 2010 by Kevin Systrom and Mike Krieger\n• **Acquired by Facebook (Meta):** 2012 for $1 billion\n• **Users:** 2+ billion monthly active users\n• **Features:**\n  - Photos and videos with filters\n  - Stories (24-hour content, copied from Snapchat)\n  - Reels (short-form videos, competing with TikTok)\n  - Direct messaging\n  - Shopping and e-commerce\n  - IGTV (long-form video)\n• **Key Stats:**\n  - Most-liked photo: Egg (56 million likes)\n  - Most-followed: Cristiano Ronaldo (600M+)\n  - 100M+ photos uploaded daily\n• **Revenue:** ~$50 billion/year (mainly from ads)" },
  { keywords: ["what is tiktok", "tell me about tiktok"], answer: "**TikTok** is a short-form video social media platform:\n\n• **Parent Company:** ByteDance (Chinese company)\n• **Launched:** 2016 (as Douyin in China), 2018 internationally\n• **Users:** 1.5+ billion monthly active users\n• **Features:**\n  - 15-second to 10-minute videos\n  - Music and sound effects\n  - Filters and effects\n  - Duet and Stitch features\n  - Live streaming\n  - Shopping\n• **Key Facts:**\n  - Most downloaded app in the world (2020-2023)\n  - Average user spends 95 minutes/day\n  - Launched careers of Charli D'Amelio, Khaby Lame, and many others\n• **Controversy:** Faced bans in India (2020), potential US ban over data privacy concerns\n• **Revenue:** ~$20+ billion/year (mainly from ads)" },

  // Geography & Countries
  { keywords: ["population of india", "india population"], answer: "**India's population:** ~1.44 billion people (2024) — the most populous country in the world, surpassing China in 2023.\n\n• **Capital:** New Delhi\n• **Languages:** Hindi (official), English (official), 22 scheduled languages\n• **States:** 28 states + 8 union territories\n• **Largest City:** Mumbai (21 million metro)" },
  { keywords: ["population of china", "china population"], answer: "**China's population:** ~1.42 billion people (2024) — second most populous country after India.\n\n• **Capital:** Beijing\n• **Languages:** Mandarin (official)\n• **Provinces:** 23 provinces + 5 autonomous regions\n• **Largest City:** Shanghai (28 million metro)" },
  { keywords: ["population of usa", "usa population", "us population", "america population"], answer: "**United States population:** ~335 million people (2024) — third most populous country.\n\n• **Capital:** Washington, D.C.\n• **Languages:** No official language at federal level (English is de facto)\n• **States:** 50 states + D.C. + territories\n• **Largest City:** New York City (8.3 million city, 20 million metro)" },
  { keywords: ["largest country", "biggest country in the world"], answer: "**Russia** is the largest country by area at 17.1 million km² (6.6 million sq mi) — almost twice the size of Canada. It spans 11 time zones across Europe and Asia.\n\nBy population: India (1.44B), China (1.42B), USA (335M)." },
  { keywords: ["smallest country", "smallest country in the world"], answer: "**Vatican City** is the smallest country in the world at just 0.44 km² (0.17 sq mi) — about 110 acres. It's an independent city-state within Rome, Italy, and is the spiritual center of the Roman Catholic Church." },

  // Science & Space
  { keywords: ["how far is the sun", "distance to sun"], answer: "**Distance from Earth to the Sun:** ~149.6 million kilometers (93 million miles) — defined as 1 Astronomical Unit (AU).\n\nLight takes about 8 minutes 20 seconds to travel from the Sun to Earth. The Sun's diameter is 1.39 million km (109× Earth's diameter)." },
  { keywords: ["how far is the moon", "distance to moon"], answer: "**Distance from Earth to the Moon:** ~384,400 kilometers (238,900 miles) on average.\n\nThe Moon orbits Earth at varying distances:\n- Perigee (closest): ~363,300 km\n- Apogee (farthest): ~405,500 km\n\nLight takes about 1.3 seconds to travel from the Moon to Earth." },
  { keywords: ["what is black hole", "explain black hole"], answer: "**Black holes** are regions of spacetime where gravity is so strong that nothing can escape:\n\n• **Formation:** When massive stars collapse at the end of their life (supernova)\n• **Types:**\n  - Stellar: 5-100×太阳 mass (from star collapse)\n  - Supermassive: millions to billions of solar masses (at galaxy centers)\n  - Intermediate: between stellar and supermassive\n• **Event Horizon:** The point of no return — nothing escapes once past this\n• **Singularity:** The center where matter is compressed to infinite density\n• **Time Dilation:** Time slows down near a black hole (from an outside observer's perspective)\n• **First Image:** Captured by Event Horizon Telescope in 2019 (M87 galaxy)\n• **Notable Black Holes:** Sagittarius A* (center of Milky Way), TON 618 (one of the largest known)" },
  { keywords: ["what is quantum computing", "explain quantum computing"], answer: "**Quantum computing** uses quantum mechanics to process information:\n\n• **Classical Bits:** 0 or 1\n• **Quantum Bits (Qubits):** Can be 0, 1, or both simultaneously (superposition)\n• **Key Principles:**\n  - Superposition: Qubits exist in multiple states at once\n  - Entanglement: Qubits can be linked (measuring one instantly affects the other)\n  - Interference: Quantum states can amplify or cancel each other\n• **Advantages:**\n  - Exponentially faster for certain problems\n  - Drug discovery, materials science, cryptography\n  - Optimization problems (logistics, finance)\n  - Machine learning\n• **Challenges:**\n  - Qubits are extremely fragile (need near absolute zero temperature)\n  - Error rates are high\n  - Limited number of qubits (currently ~1000+)\n• **Key Players:** IBM, Google, Microsoft, IonQ, Rigetti\n• **Milestone:** Google achieved \"quantum supremacy\" in 2019 (Sycamore processor)" },
  { keywords: ["what is climate change", "explain climate change"], answer: "**Climate change** refers to long-term shifts in global temperatures and weather patterns:\n\n• **Primary Cause:** Human activities since the Industrial Revolution, mainly burning fossil fuels (coal, oil, gas)\n• **Key Evidence:**\n  - Global temperature has risen ~1.1°C since pre-industrial times\n  - Arctic ice is declining 13% per decade\n  - Sea levels rising 3.4mm per year\n  - CO₂ levels at 420+ ppm (highest in 800,000 years)\n• **Effects:**\n  - More extreme weather (hurricanes, droughts, floods)\n  - Rising sea levels threatening coastal cities\n  - Loss of biodiversity\n  - Threats to food and water security\n• **Paris Agreement (2015):** 196 countries agreed to limit warming to 1.5°C\n• **Solutions:** Renewable energy, electric vehicles, carbon capture, reforestation" },

  // Math & Numbers
  { keywords: ["what is fibonacci", "fibonacci sequence", "fibonacci number"], answer: "**Fibonacci Sequence:** 0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144...\n\n• **Rule:** Each number is sum of two preceding ones (F(n) = F(n-1) + F(n-2))\n• **Named After:** Leonardo of Pisa (Fibonacci), 1202 book \"Liber Abaci\"\n• **Golden Ratio:** Ratio approaches φ = 1.6180339887... (golden ratio)\n• **In Nature:**\n  - Flower petals (lilies: 3, buttercups: 5, daisies: 34)\n  - Pinecone spirals\n  - Sunflower seeds\n  - Shell spirals (nautilus)\n  - Hurricane formation\n• **In Math:**\n  - Golden ratio (φ = (1+√5)/2)\n  - Fibonacci heap data structure\n  - Continued fractions\n• **Applications:** Stock market analysis, algorithms, architecture, art composition" },
  { keywords: ["what is 2+2", "2 plus 2", "what does 2+2 equal"], answer: "**2 + 2 = 4**\n\nThis is one of the most fundamental arithmetic facts. In binary (computing), 10 + 10 = 100." },

  // History
  { keywords: ["world war 2", "world war ii", "second world war"], answer: "**World War II (1939-1945)** was the deadliest conflict in human history:\n\n• **Started:** September 1, 1939 (Germany invaded Poland)\n• **Ended:** September 2, 1945 (Japan surrendered)\n• **Sides:**\n  - Allies: UK, USA, USSR, France, China, and others\n  - Axis: Germany, Italy, Japan\n• **Key Events:**\n  - Holocaust: 6 million Jews murdered by Nazis\n  - D-Day (June 6, 1944): Allied invasion of Normandy\n  - Atomic bombs: Hiroshima (Aug 6) and Nagasaki (Aug 9, 1945)\n• **Casualties:** 70-85 million (3% of world population)\n• **Aftermath:**\n  - United Nations founded (1945)\n  - Cold War between USA and USSR\n  - Decolonization of Asia and Africa\n  - Nuremberg Trials for war criminals" },
  { keywords: ["who invented internet", "who created internet", "origin of internet"], answer: "**The Internet** was developed by multiple pioneers:\n\n• **ARPANET (1969):** US Department of Defense project — first message sent between UCLA and Stanford\n• **Key Figures:**\n  - Vint Cerf and Bob Kahn: Created TCP/IP protocol (\"fathers of the Internet\")\n  - Tim Berners-Lee: Invented the World Wide Web (1989) — HTML, HTTP, URLs\n  - Marc Andreessen: Created Mosaic browser (1993), co-founded Netscape\n• **Timeline:**\n  - 1969: ARPANET (4 nodes)\n  - 1983: TCP/IP adopted\n  - 1991: World Wide Web public\n  - 1993: Mosaic browser\n  - 1995: Commercial internet boom\n• **Impact:** Transformed communication, commerce, education, entertainment, and virtually every aspect of modern life" },

  // PhoenixTools Specific
  { keywords: ["what is pdf", "explain pdf"], answer: "**PDF (Portable Document Format)** is a file format for documents:\n\n• **Created:** 1993 by Adobe Systems\n• **Purpose:** Present documents consistently regardless of software, hardware, or OS\n• **Features:**\n  - Preserves fonts, images, formatting\n  - Can include interactive forms, multimedia\n  - Supports digital signatures\n  - Password protection\n• **Standard:** PDF 2.0 (ISO 32000-2:2017)\n• **Tools:** Use our 20 PDF tools to compress, merge, split, convert, edit, and more!\n• **PDF/A:** Archival format for long-term preservation" },
  { keywords: ["what is seo", "explain seo"], answer: "**SEO (Search Engine Optimization)** improves website visibility in search results:\n\n• **Goal:** Rank higher on Google, get more organic (free) traffic\n• **Key Factors:**\n  - Content: High-quality, relevant, original content\n  - Keywords: Terms people search for\n  - Backlinks: Other sites linking to yours\n  - Technical: Site speed, mobile-friendliness, SSL\n  - User Experience: Low bounce rate, high engagement\n• **Types:**\n  - On-page: Title tags, meta descriptions, headings, content\n  - Off-page: Backlinks, social signals\n  - Technical: Site structure, crawlability, indexation\n  - Local: Google Business Profile, local citations\n• **Tools:** Use our **SEO Analyzer** tool to check your site!\n• **Timeline:** Results typically take 3-6 months\n• **Important:** Quality content > tricks/gaming algorithms" },
  { keywords: ["what is qr code", "explain qr code"], answer: "**QR Code (Quick Response Code)** is a 2D barcode:\n\n• **Created:** 1994 by Denso Wave (Toyota subsidiary)\n• **How It Works:**\n  - Stores data in black and white squares on a grid\n  - Read by cameras and QR scanners\n  - Error correction allows reading even if partially damaged\n• **Capacity:** Up to 7,089 numeric characters or 4,296 alphanumeric\n• **Types:**\n  - Static: Data encoded directly\n  - Dynamic: Links to URL, can be updated\n• **Uses:**\n  - URLs and website links\n  - Contact information (vCard)\n  - Wi-Fi passwords\n  - Payment (UPI, Venmo)\n  - Product packaging\n  - Marketing materials\n• **Scan:** Use your phone's camera — most modern phones support QR scanning\n• **Generator:** Use our **QR Code Generator** to create custom QR codes!" },
  { keywords: ["what is html css", "difference between html and css"], answer: "**HTML vs CSS:**\n\n| Feature | HTML | CSS |\n|---------|------|-----|\n| Purpose | Structure & content | Styling & layout |\n| Syntax | Tags: <p>, <div> | Rules: { color: red; } |\n| Created | 1993 | 1996 |\n| Example | <h1>Hello</h1> | h1 { color: blue; } |\n\n**HTML** defines what's on the page. **CSS** defines how it looks. They work together — HTML is the skeleton, CSS is the skin and clothes." },
  { keywords: ["what is react", "explain react"], answer: "**React** is a JavaScript library for building user interfaces:\n\n• **Created:** 2013 by Facebook (Meta)\n• **Purpose:** Build reusable UI components\n• **Key Concepts:**\n  - Components: Reusable UI pieces (like LEGO blocks)\n  - JSX: HTML-like syntax in JavaScript\n  - Virtual DOM: Efficient updates\n  - Hooks: useState, useEffect, useContext\n  - One-way data flow: Data flows down, events flow up\n• **Ecosystem:**\n  - Next.js: Full-stack React framework\n  - React Native: Mobile apps\n  - Redux/Zustand: State management\n  - React Router: Navigation\n• **Why Popular:**\n  - Component-based architecture\n  - Large ecosystem and community\n  - Used by Facebook, Instagram, Netflix, Airbnb\n  - High performance with Virtual DOM\n• **Alternatives:** Vue.js, Angular, Svelte, SolidJS" },
  { keywords: ["what is node js", "explain node js", "what is nodejs"], answer: "**Node.js** is a JavaScript runtime for server-side code:\n\n• **Created:** 2009 by Ryan Dahl\n• **Based on:** Chrome's V8 JavaScript engine\n• **Purpose:** Run JavaScript on the server (not just browser)\n• **Key Features:**\n  - Event-driven, non-blocking I/O\n  - Single-threaded but highly concurrent\n  - npm (Node Package Manager) — 2M+ packages\n  - Fast for I/O-heavy operations\n• **Use Cases:**\n  - REST APIs and microservices\n  - Real-time apps (chat, gaming)\n  - Streaming services\n  - Build tools (Webpack, Vite)\n  - Server-side rendering (Next.js)\n• **Frameworks:** Express.js, Fastify, NestJS, Koa\n• **Limitations:** Not ideal for CPU-intensive tasks (use workers)\n• **Version:** Current LTS is Node 22 (2024)\n• **Used By:** Netflix, LinkedIn, PayPal, NASA" },
  { keywords: ["what is docker", "explain docker"], answer: "**Docker** is a platform for containerized applications:\n\n• **Definition:** Packages applications into lightweight, portable containers\n• **Container vs Virtual Machine:**\n  - Container: Shares host OS kernel, much lighter\n  - VM: Full OS, heavier but more isolated\n• **Key Concepts:**\n  - Dockerfile: Recipe for building an image\n  - Image: Read-only template with app + dependencies\n  - Container: Running instance of an image\n  - Docker Hub: Repository of public images\n• **Benefits:**\n  - \"Works on my machine\" problem solved\n  - Consistent environments (dev = staging = prod)\n  - Easy scaling and deployment\n  - Isolation between applications\n• **Docker Compose:** Define multi-container apps\n• **Alternatives:** Podman, containerd, LXC\n• **Used By:** Every major tech company, CI/CD pipelines, cloud deployments" },
]

function generateLocalResponse(query: string): { text: string; tool: typeof tools[0] | null } {
  const tool = findBestTool(query)
  if (tool) return { text: `I found the perfect tool for that. Click the tool card below to get started.`, tool }

  const lower = query.toLowerCase().trim()

  // Match against knowledge base
  for (const entry of KNOWLEDGE_BASE) {
    if (entry.keywords.some((kw) => lower.includes(kw))) {
      return { text: entry.answer, tool: null }
    }
  }

  // Check for "tell me about X" or "what is X" patterns
  const tellAbout = lower.match(/(?:tell me about|explain|describe|what is|who is|what are)\s+(.+)/)
  if (tellAbout) {
    const topic = tellAbout[1].replace(/[?!.,]/g, "").trim()
    for (const entry of KNOWLEDGE_BASE) {
      if (entry.keywords.some((kw) => topic.includes(kw) || kw.includes(topic))) {
        return { text: entry.answer, tool: null }
      }
    }
  }

  // Check for "how to" patterns
  const howTo = lower.match(/how to (.+)/)
  if (howTo) {
    const task = howTo[1].replace(/[?!.,]/g, "").trim()
    const toolMatch = findBestTool(task)
    if (toolMatch) return { text: `I found the perfect tool for that. Click the tool card below to get started.`, tool: toolMatch }
  }

  return { text: `That's a great question! I have knowledge about many topics:\n\n• **Technology** — AI, programming, web development, cloud computing\n• **Science** — Physics, chemistry, biology, astronomy\n• **Math** — Algebra, geometry, statistics, famous numbers\n• **Geography** — Countries, capitals, world facts\n• **Business** — Finance, accounting, taxes, marketing\n• **General Knowledge** — History, culture, everyday questions\n\nTry asking about any of these topics! For example:\n- \"Tell me about OpenAI\"\n- \"What is Python?\"\n- \"How does DNA work?\"\n- \"What is the capital of Japan?\"`, tool: null }
}

function generateGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return "Good morning"
  if (h < 17) return "Good afternoon"
  return "Good evening"
}

function getToolIcon(toolId: string) {
  const m: Record<string, typeof FileText> = {
    "pdf-compress": FileDown, "pdf-merge": FileText, "pdf-split": Scissors, "pdf-to-word": FileText,
    "pdf-to-jpg": ImageIcon, "pdf-unlock": Lock, "pdf-watermark": FileText, "pdf-ocr": Search,
    "image-resize": Crop, "image-compress": FileDown, "image-convert": RefreshCw, "remove-bg": Eraser,
    "image-crop": Crop, "ai-image-gen": Wand2, "video-trim": Scissors, "video-compress": FileDown,
    "video-convert": RefreshCw, "video-to-gif": ImageIcon, "extract-audio": Music, "audio-convert": RefreshCw,
    "audio-trim": Scissors, "qr-generator": Sparkles, "invoice-generator": FileText, "receipt-generator": FileText,
  }
  return m[toolId] || FileText
}

export default function AIChatPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#0F0E0A] flex items-center justify-center"><Loader2 className="w-6 h-6 text-[#D97757] animate-spin" /></div>}>
      <AIChatContent />
    </Suspense>
  )
}

function AIChatContent() {
  const searchParams = useSearchParams()
  const initialQuery = searchParams.get("q") || ""
  const { isPremium } = useSubscription()
  const { getUsage, trackUsage, canUseChat, FREE_DAILY_LIMIT } = useChatUsage()

  const [chatUsage, setChatUsage] = useState(() => getUsage())

  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [input, setInput] = useState("")
  const [isThinking, setIsThinking] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [aiStatus, setAiStatus] = useState<string>("")
  const [settingsProvider, setSettingsProvider] = useState("openrouter")
  const [settingsKey, setSettingsKey] = useState("")
  const [settingsModel, setSettingsModel] = useState("auto")
  const [settingsSaved, setSettingsSaved] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)

  const activeSession = useMemo(() => sessions.find((s) => s.id === activeSessionId) || null, [sessions, activeSessionId])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const data = JSON.parse(saved)
        if (data.sessions && Array.isArray(data.sessions)) {
          const unique = data.sessions.filter((s: any, i: number, arr: any[]) => arr.findIndex((x: any) => x.id === s.id) === i)
          const restored = unique.map((s: any) => ({
            ...s,
            messages: s.messages.map((m: any) => ({ ...m, timestamp: new Date(m.timestamp) })),
            createdAt: new Date(s.createdAt),
          }))
          setSessions(restored)
          if (data.activeSessionId) setActiveSessionId(data.activeSessionId)
        }
      }
    } catch {}
    const config = getConfigured()
    setSettingsProvider(config.provider === "auto" ? "openrouter" : config.provider)
    setSettingsKey(config.apiKey)
    setSettingsModel(config.model)
    setSidebarOpen(window.innerWidth >= 768)
  }, [])

  useEffect(() => {
    try {
      const unique = sessions.filter((s, i, arr) => arr.findIndex((x) => x.id === s.id) === i)
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sessions: unique, activeSessionId }))
    } catch {}
  }, [sessions, activeSessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [activeSession?.messages, isThinking])

  const createSession = useCallback((firstMessage?: string): string => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
    const session: ChatSession = {
      id,
      title: firstMessage ? firstMessage.slice(0, 40) + (firstMessage.length > 40 ? "..." : "") : "New chat",
      messages: [],
      createdAt: new Date(),
    }
    setSessions((prev) => [session, ...prev])
    setActiveSessionId(id)
    return id
  }, [])

  const addMessage = useCallback((sessionId: string, message: ChatMessage) => {
    setSessions((prev) => prev.map((s) => s.id === sessionId ? { ...s, messages: [...s.messages, message] } : s))
  }, [])

  const handleSend = useCallback(async (customInput?: string) => {
    const query = customInput || input.trim()
    if (!query || isThinking) return
    setInput("")

    // Check chat usage for free users
    if (!isPremium) {
      const usage = getUsage()
      if (usage.remaining <= 0) {
        setInput("")
        return
      }
      const newUsage = trackUsage()
      setChatUsage(newUsage)
    }

    let sessionId = activeSessionId
    if (!sessionId) sessionId = createSession(query)

    addMessage(sessionId, {
      id: `${Date.now()}-user-${Math.random().toString(36).slice(2, 7)}`,
      role: "user",
      content: query,
      timestamp: new Date(),
    })

    setIsThinking(true)
    setAiStatus("Thinking...")

    if (isSensitiveQuery(query)) {
      addMessage(sessionId, {
        id: `${Date.now()}-assistant-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: "I cannot help with that request for security reasons.",
        timestamp: new Date(),
        provider: "blocked",
      })
      setIsThinking(false)
      setAiStatus("")
      return
    }

    const rateLimit = checkRateLimit()
    if (!rateLimit.allowed) {
      addMessage(sessionId, {
        id: `${Date.now()}-assistant-${Math.random().toString(36).slice(2, 7)}`,
        role: "assistant",
        content: `Rate limit reached. Please wait ${rateLimit.resetIn} seconds.`,
        timestamp: new Date(),
      })
      setIsThinking(false)
      setAiStatus("")
      return
    }

    let finalText = ""
    let finalTool = null
    let provider = "local"

    const aiResponse = await callFreeAI(query)
    if (aiResponse && aiResponse.text && aiResponse.provider !== "blocked") {
      finalText = filterSensitiveContent(aiResponse.text)
      provider = aiResponse.provider
      const tool = findBestTool(query)
      if (tool) finalTool = tool
    } else {
      const local = generateLocalResponse(query)
      const isGenericFallback = local.text.startsWith("That's a great question!")

      if (isGenericFallback && shouldSearchWeb(query)) {
        setAiStatus("Searching the web...")
        const searchResponse = await searchWeb(query)
        if (searchResponse.results && searchResponse.results.length > 0) {
          setAiStatus("Reading page content...")
          const detailedAnswer = await buildDetailedAnswer(query, searchResponse.results)
          finalText = detailedAnswer
          provider = "web-search"
        } else {
          finalText = local.text
          finalTool = local.tool
        }
      } else {
        finalText = local.text
        finalTool = local.tool
      }
    }

    addMessage(sessionId, {
      id: `${Date.now()}-assistant-${Math.random().toString(36).slice(2, 7)}`,
      role: "assistant",
      content: finalText,
      tool: finalTool,
      timestamp: new Date(),
      provider,
    })
    setIsThinking(false)
    setAiStatus("")
  }, [input, isThinking, activeSessionId, createSession, addMessage])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend() }
  }, [handleSend])

  const startNewChat = useCallback(() => {
    setActiveSessionId(null)
    setInput("")
    inputRef.current?.focus()
  }, [])

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) setActiveSessionId(null)
  }, [activeSessionId])

  const toggleRecording = useCallback(() => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition not supported in your browser.")
      return
    }
    if (isRecording) { recognitionRef.current?.stop(); setIsRecording(false); return }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    const recognition = new SR()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = "en-US"
    recognition.onresult = (event: any) => {
      setInput((prev) => prev + (prev ? " " : "") + event.results[0][0].transcript)
      setIsRecording(false)
    }
    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => setIsRecording(false)
    recognitionRef.current = recognition
    recognition.start()
    setIsRecording(true)
  }, [isRecording])

  const saveSettings = useCallback(() => {
    setConfig({
      provider: settingsProvider as any,
      apiKey: settingsKey,
      model: settingsModel,
    })
    setSettingsSaved(true)
    setTimeout(() => setSettingsSaved(false), 2000)
  }, [settingsProvider, settingsKey, settingsModel])

  useEffect(() => {
    if (initialQuery && !activeSessionId) {
      setInput(initialQuery)
      setTimeout(() => handleSend(initialQuery), 100)
    }
  }, [initialQuery])

  const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  const providerInfo = getProviderInfo()
  const selectedProviderInfo = providerInfo.providers.find((p) => p.id === settingsProvider)

  return (
    <div className="min-h-screen bg-[#0F0E0A] flex" style={{ fontFamily: '"Claude-Text", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-30 bg-black/50 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "w-[280px]" : "w-0"} fixed md:static inset-y-0 left-0 z-40 transition-all duration-300 overflow-hidden border-r border-[rgba(255,255,255,0.06)] bg-[#171612] flex flex-col shrink-0`}>
        <div className="p-3 border-b border-[rgba(255,255,255,0.06)]">
          <button onClick={startNewChat} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[rgba(255,255,255,0.08)] hover:bg-[rgba(255,255,255,0.04)] transition-colors text-[13px] text-[#F6F3EE]">
            <Plus className="w-4 h-4" /> New chat
          </button>
        </div>
        <div className="px-3 py-2"><p className="text-[11px] text-[#BEB7AC]/40 uppercase tracking-wider font-medium">Recents</p></div>
        <div className="flex-1 overflow-y-auto px-2">
          {sessions.length === 0 ? (
            <div className="text-center py-8 px-4"><MessageSquare className="w-8 h-8 text-[#BEB7AC]/20 mx-auto mb-3" /><p className="text-[12px] text-[#BEB7AC]/40">No conversations yet</p></div>
          ) : (
            <div className="space-y-0.5">
              {sessions.map((s) => (
                <div key={s.id} className={`group flex items-center rounded-lg transition-colors ${s.id === activeSessionId ? "bg-[rgba(217,119,87,0.1)]" : "hover:bg-[rgba(255,255,255,0.04)]"}`}>
                  <button onClick={() => setActiveSessionId(s.id)} className="flex-1 text-left px-3 py-2 text-[13px] truncate text-[#BEB7AC]">{s.title}</button>
                  <button onClick={() => deleteSession(s.id)} className="pr-2 opacity-0 group-hover:opacity-100 text-[#BEB7AC]/30 hover:text-[#EF4444] transition-all"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="p-3 border-t border-[rgba(255,255,255,0.06)]">
          <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-[12px] text-[#BEB7AC]/50 hover:text-[#D97757] transition-colors mb-2">
            <Settings className="w-3.5 h-3.5" /> Settings
          </button>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-[#D97757]/20 flex items-center justify-center text-[11px] text-[#D97757] font-medium">U</div>
            <div className="flex-1 min-w-0"><p className="text-[12px] text-[#F6F3EE] truncate">User</p><p className="text-[10px] text-[#BEB7AC]/40">Free plan</p></div>
          </div>
          <Link href="/ai" className="flex items-center gap-2 text-[12px] text-[#BEB7AC]/50 hover:text-[#D97757] transition-colors">
            <ChevronLeft className="w-3 h-3" /> Back to AI Features
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-12 border-b border-[rgba(255,255,255,0.06)] flex items-center px-3 sm:px-4 gap-2 sm:gap-3 shrink-0">
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[#BEB7AC]">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </button>
          <span className="text-[13px] text-[#F6F3EE] font-medium truncate min-w-0">{activeSession?.title || "New chat"}</span>
          {isAIConfigured() && <span className="text-[10px] text-[#10B981] bg-[#10B981]/10 px-2 py-0.5 rounded-full ml-2">AI Connected</span>}
        </header>

        <div className="flex-1 overflow-y-auto">
          {!activeSession || activeSession.messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-4 py-8">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-[#D97757]/20 to-[#D97757]/5 flex items-center justify-center mb-4 sm:mb-6">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-[#D97757]" />
              </div>
              <h2 className="text-[clamp(24px,5vw,42px)] text-[#F6F3EE] text-center mb-2" style={{ fontFamily: 'Georgia, "Times New Roman", Times, serif', fontWeight: 400 }}>
                {generateGreeting()}, <span className="text-[#BEB7AC]">User</span>
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#BEB7AC] text-center max-w-md mb-6 sm:mb-8">How can I help you today?</p>
              <div className="flex flex-wrap justify-center gap-2 max-w-lg w-full">
                {[
                  { label: "Compress PDF", query: "compress my pdf", icon: FileDown },
                  { label: "Remove Background", query: "remove background", icon: Eraser },
                  { label: "Create Invoice", query: "create an invoice", icon: FileText },
                  { label: "Convert Video", query: "convert video to mp4", icon: RefreshCw },
                  { label: "Generate QR Code", query: "generate a qr code", icon: Sparkles },
                  { label: "Translate Text", query: "translate this document", icon: Globe },
                ].map((item) => (
                  <button key={item.label} onClick={() => handleSend(item.query)} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-[rgba(255,255,255,0.06)] hover:border-[rgba(217,119,87,0.3)] hover:bg-[rgba(217,119,87,0.05)] transition-all text-left group">
                    <item.icon className="w-4 h-4 text-[#BEB7AC]/50 group-hover:text-[#D97757] shrink-0 transition-colors" />
                    <span className="text-[12px] text-[#BEB7AC] group-hover:text-[#F6F3EE] transition-colors">{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-3 sm:px-4 py-4 sm:py-6 space-y-4 sm:space-y-6">
              {activeSession.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[90%] sm:max-w-[85%] rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 ${msg.role === "user" ? "bg-[#D97757] text-white" : "bg-[rgba(255,255,255,0.03)] text-[#F6F3EE]"}`}>
                    {msg.role === "assistant" && (
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-3.5 h-3.5 text-[#D97757]" />
                        <span className="text-[11px] text-[#D97757] font-medium">PhoenixTools</span>
                        {msg.provider && msg.provider !== "local" && msg.provider !== "blocked" && (
                          <span className="text-[9px] text-[#BEB7AC]/40 bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 rounded">{msg.provider === "web-search" ? "web search" : msg.provider}</span>
                        )}
                      </div>
                    )}
                    <div className="text-[14px] leading-[1.7] whitespace-pre-wrap" style={{ fontFamily: '"Claude-Text", ui-sans-serif, system-ui, sans-serif' }}>
                      {msg.content.split("\n").map((line, i) => {
                        const bold = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                        if (bold !== line) return <div key={i} dangerouslySetInnerHTML={{ __html: bold }} />
                        return <div key={i}>{line}</div>
                      })}
                    </div>
                    {msg.tool && (
                      <Link href={msg.tool.href} className="mt-3 flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl bg-[rgba(255,255,255,0.04)] hover:bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.06)] transition-all group">
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-[#D97757]/10 flex items-center justify-center shrink-0">
                          {(() => { const I = getToolIcon(msg.tool.id); return <I className="w-4 h-4 sm:w-5 sm:h-5 text-[#D97757]" /> })()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] text-[#F6F3EE] font-medium truncate">{msg.tool.name}</p>
                          <p className="text-[11px] text-[#BEB7AC] truncate">{msg.tool.description}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#BEB7AC] group-hover:text-[#D97757] shrink-0 transition-colors" />
                      </Link>
                    )}
                    <div className="text-[10px] text-[#BEB7AC]/30 mt-2">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex justify-start">
                  <div className="max-w-[85%] rounded-2xl px-4 py-3 bg-[rgba(255,255,255,0.03)]">
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#D97757] animate-pulse" />
                      <span className="text-[11px] text-[#D97757] font-medium">{aiStatus || "Thinking..."}</span>
                    </div>
                    <div className="flex gap-1.5 py-1">
                      <span className="w-2 h-2 rounded-full bg-[#D97757] animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#D97757] animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-2 h-2 rounded-full bg-[#D97757] animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input */}
        <div className="border-t border-[rgba(255,255,255,0.06)] p-3 sm:p-4 shrink-0 pb-20 sm:pb-4">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end rounded-2xl border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] focus-within:border-[rgba(217,119,87,0.3)] transition-colors">
              <button className="m-1.5 sm:m-2 p-1.5 sm:p-2 rounded-lg hover:bg-[rgba(255,255,255,0.06)] transition-colors text-[#BEB7AC]/50 hover:text-[#BEB7AC] shrink-0" title="Attach file">
                <Plus className="w-4 h-4" />
              </button>
              <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
                placeholder="Ask me anything..." rows={1}
                className="flex-1 bg-transparent text-[14px] text-[#F6F3EE] placeholder:text-[#BEB7AC]/30 outline-none resize-none px-1.5 sm:px-2 py-3 max-h-[120px] min-w-0"
                style={{ minHeight: "48px", fontFamily: '"Claude-Text", ui-sans-serif, system-ui, sans-serif' }} />
              <div className="flex items-center gap-0.5 sm:gap-1 m-1.5 sm:m-2 shrink-0">
                <span className="text-[10px] sm:text-[11px] text-[#10B981]/70 mr-0.5 sm:mr-1 hidden sm:inline">{isAIConfigured() ? "AI" : "Local"}</span>
                <button onClick={toggleRecording} className={`p-2 rounded-lg transition-colors ${isRecording ? "bg-[#EF4444] text-white" : "hover:bg-[rgba(255,255,255,0.06)] text-[#BEB7AC]/50 hover:text-[#BEB7AC]"}`} title={isRecording ? "Stop recording" : "Voice input"}>
                  {isRecording ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>
                <button onClick={() => handleSend()} disabled={!input.trim() || isThinking} className="p-2 rounded-lg bg-[#D97757] text-white hover:bg-[#D97757]/90 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                  {isThinking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-2 gap-1">
              <div className="flex items-center gap-2">
                <Shield className="w-3 h-3 text-[#10B981]" />
                <p className="text-[10px] sm:text-[11px] text-[#BEB7AC]/30">Protected by PhoenixTools Security</p>
              </div>
              <div className="flex items-center gap-3">
                {!isPremium && (
                  <span className={`text-[10px] sm:text-[11px] ${chatUsage.remaining <= 3 ? "text-red-400" : "text-[#BEB7AC]/40"}`}>
                    {chatUsage.remaining}/{FREE_DAILY_LIMIT} messages left today
                    {chatUsage.remaining <= 0 && (
                      <Link href="/pricing" className="text-[#D97757] ml-1 hover:underline">Upgrade</Link>
                    )}
                  </span>
                )}
                {isPremium && (
                  <span className="text-[10px] sm:text-[11px] text-[#10B981]/60">Unlimited messages</span>
                )}
                {!isAIConfigured() && (
                  <button onClick={() => setShowSettings(true)} className="text-[11px] text-[#D97757] hover:underline">Add API key for better AI</button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setShowSettings(false)}>
          <div className="bg-[#171612] border border-[rgba(255,255,255,0.08)] rounded-2xl p-4 sm:p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[16px] text-[#F6F3EE] font-medium">AI Settings</h3>
              <button onClick={() => setShowSettings(false)} className="text-[#BEB7AC]/50 hover:text-[#BEB7AC]"><X className="w-5 h-5" /></button>
            </div>

            <div className="space-y-4">
              {/* Status */}
              <div className={`p-4 rounded-lg border ${isAIConfigured() ? "bg-[rgba(16,185,129,0.05)] border-[rgba(16,185,129,0.1)]" : "bg-[rgba(255,255,255,0.02)] border-[rgba(255,255,255,0.04)]"}`}>
                <div className="flex items-center gap-2 mb-2">
                  {isAIConfigured() ? <Check className="w-4 h-4 text-[#10B981]" /> : <Sparkles className="w-4 h-4 text-[#D97757]" />}
                  <span className={`text-[13px] font-medium ${isAIConfigured() ? "text-[#10B981]" : "text-[#D97757]"}`}>
                    {isAIConfigured() ? "AI Connected" : "Using Local AI"}
                  </span>
                </div>
                <p className="text-[12px] text-[#BEB7AC]/70">
                  {isAIConfigured()
                    ? `Connected to ${settingsProvider} — AI-powered responses active`
                    : "Chat works with built-in knowledge. Add an API key for smarter responses."}
                </p>
              </div>

              {/* Provider Selection */}
              <div>
                <label className="block text-[12px] text-[#BEB7AC] mb-2 font-medium">AI Provider</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {providerInfo.providers.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => { setSettingsProvider(p.id); setSettingsKey(""); setSettingsModel("auto"); }}
                      className={`p-3 rounded-lg border text-center transition-all ${settingsProvider === p.id ? "border-[#D97757] bg-[rgba(217,119,87,0.1)]" : "border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.12)]"}`}
                    >
                      <p className="text-[12px] text-[#F6F3EE] font-medium">{p.name}</p>
                      <p className="text-[10px] text-[#BEB7AC]/50 mt-0.5">Free tier</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* API Key Input */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[12px] text-[#BEB7AC] font-medium">API Key</label>
                  {selectedProviderInfo && (
                    <a href={selectedProviderInfo.url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-[#D97757] hover:underline flex items-center gap-1">
                      Get free key <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <input
                  type="password"
                  value={settingsKey}
                  onChange={(e) => setSettingsKey(e.target.value)}
                  placeholder={settingsProvider === "groq" ? "gsk_..." : settingsProvider === "openrouter" ? "sk-or-..." : "sk-..."}
                  className="w-full h-10 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[13px] text-[#F6F3EE] outline-none focus:border-[rgba(217,119,87,0.3)]"
                />
                <p className="text-[11px] text-[#BEB7AC]/40 mt-1">
                  {settingsProvider === "groq" && "Free at console.groq.com — no credit card needed"}
                  {settingsProvider === "openrouter" && "Free at openrouter.ai — 20+ free models available"}
                  {settingsProvider === "openai" && "Paid API at platform.openai.com — GPT-3.5/4 models"}
                </p>
              </div>

              {/* Model Selection */}
              {selectedProviderInfo && (
                <div>
                  <label className="block text-[12px] text-[#BEB7AC] mb-1.5 font-medium">Model</label>
                  <select
                    value={settingsModel}
                    onChange={(e) => setSettingsModel(e.target.value)}
                    className="w-full h-10 px-3 rounded-lg border border-[rgba(255,255,255,0.08)] bg-[rgba(255,255,255,0.02)] text-[13px] text-[#F6F3EE] outline-none focus:border-[rgba(217,119,87,0.3)]"
                  >
                    <option value="auto">Auto (Recommended)</option>
                    {selectedProviderInfo.models.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Security Info */}
              <div className="p-3 rounded-lg bg-[rgba(255,255,255,0.02)] border border-[rgba(255,255,255,0.04)]">
                <div className="flex items-center gap-2 mb-1">
                  <Shield className="w-3.5 h-3.5 text-[#10B981]" />
                  <span className="text-[11px] text-[#10B981] font-medium">Security</span>
                </div>
                <p className="text-[11px] text-[#BEB7AC]/60">Your API key is stored locally in your browser only. Never sent to our servers. All data stays private.</p>
              </div>

              {/* Save Button */}
              <button onClick={saveSettings} className={`w-full h-10 rounded-lg text-[13px] font-medium transition-colors ${settingsSaved ? "bg-[#10B981] text-white" : "bg-[#D97757] text-white hover:bg-[#D97757]/90"}`}>
                {settingsSaved ? "✓ Saved!" : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
