#!/usr/bin/env node
// build.mjs: one source (src/*.md) -> index.html + slides.md + deck.json.
//
//   node slides/build.mjs            build, warn on unsourced commands
//   node slides/build.mjs --strict   build, exit 1 if any command is unsourced or any TODO chip remains
//   node slides/build.mjs --check    parse + validate only, write nothing
//
// Source format (src/NN-name.md, read in filename order). Each slide starts with a marker line:
//
//   === L2-s3 step                  <- id + kind (concept | step | checkpoint | lab)
//   # Make the cards float          <- title (h2 on the slide; the cover's becomes h1)
//   action: Ask Claude to ...       <- optional header lines, one per line, until the first blank line
//   img: ../assets/emulator/x.png | alt text
//   todo: what is missing
//   eyebrow: override the eyebrow
//   layout: cover | agenda | resources   (special layouts; default comes from kind)
//
//   Body markdown (paragraphs, - lists, 1. lists, `code`, **bold**, [links](url)).
//
//   ```cmd      -> <pre><code data-cmd>       one command per fence
//   ```prompt   -> <pre><code data-prompt>    one Claude Code prompt per fence
//   ```expect   -> <pre data-expect>          what you should see
//   ::: notes   -> <aside class="notes">      speaker notes, closed by :::
//
// Every command is checked against the course sources (curriculum/, labs/**/README.md, setup/,
// assets/emulator/WALKTHROUGH.md) and, for pico-cli, against src/pico-cli-help.txt (a dump of the
// real `pico-cli <family> <cmd> --help` tree). A command found in neither gets a visible TODO chip.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, "..");
const SRC = path.join(HERE, "src");
const args = new Set(process.argv.slice(2));
const STRICT = args.has("--strict");
const CHECK_ONLY = args.has("--check");

// lab = the folder attendees work in, readme = its instructions; both relative to the kit root.
const LEVELS = {
  0: { name: "Setup", lab: "setup", readme: "setup/SETUP.md" },
  1: { name: "Hello Spatial", lab: "labs/p1-hello-spatial", readme: "labs/p1-hello-spatial/README.md" },
  2: { name: "Spatialize a website", lab: "labs/p2-spatialize-site", readme: "labs/p2-spatialize-site/README.md" },
  3: { name: "3D + volumes", lab: "labs/p3-volume-model", readme: "labs/p3-volume-model/README.md" },
  4: { name: "Space Invaders in depth", lab: "labs/p4-space-invaders", readme: "labs/p4-space-invaders/README.md" },
  5: { name: "Agentic expert", lab: "labs/p5-capstone", readme: "labs/p5-capstone/README.md" },
};
const EMULATOR_FOOTER = "PICO OS 6 emulator, shown with PICO's clearance for this workshop";
const DESKTOP_FOOTER = "desktop Chrome";
// Media credit from where the file lives: emulator captures carry the clearance line, desktop captures say so.
const creditFor = (src) => /assets\/emulator\//.test(src) ? EMULATOR_FOOTER : /(labs\/_shots|assets\/media|examples)\//.test(src) ? DESKTOP_FOOTER : null;
const isVideo = (src) => /\.(webm|mp4)$/i.test(src || "");
// Serve the slide-sized WebP from slides/media/ (made by optimize_media.py) when it exists.
const served = (src) => {
  if (!src || src === "PENDING" || /^https?:/.test(src) || !/\.(png|jpe?g)$/i.test(src)) return src;
  const opt = `media/${path.basename(src).replace(/\.[^.]+$/, ".webp")}`;
  return fs.existsSync(path.join(HERE, opt)) ? opt : src;
};

// ---------------------------------------------------------------- parse

function parseFile(file) {
  const text = fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
  const slides = [];
  let cur = null;
  let mode = "head"; // head -> body
  let fence = null; // { type, lines }
  let notes = null;

  const push = () => { if (cur) slides.push(cur); };
  for (const raw of text.split("\n")) {
    const line = raw;
    const m = line.match(/^===\s+(\S+)\s+(concept|step|checkpoint|lab)\s*$/);
    if (m && !fence && notes === null) {
      push();
      cur = { id: m[1], kind: m[2], title: "", meta: {}, blocks: [], notes: "", todos: [], file: path.basename(file) };
      mode = "title";
      continue;
    }
    if (!cur) continue;
    if (fence) {
      if (/^```\s*$/.test(line)) { cur.blocks.push({ type: fence.type, text: fence.lines.join("\n").replace(/\s+$/, "") }); fence = null; }
      else fence.lines.push(line);
      continue;
    }
    if (notes !== null) {
      if (/^:::\s*$/.test(line)) { cur.notes = notes.join("\n").trim(); notes = null; }
      else notes.push(line);
      continue;
    }
    if (mode === "title") {
      if (!line.trim()) continue;
      const t = line.match(/^#\s+(.*)$/);
      if (!t) throw new Error(`${cur.id}: expected "# Title" after the marker, got: ${line}`);
      cur.title = t[1].trim();
      mode = "head";
      continue;
    }
    if (mode === "head") {
      const h = line.match(/^(action|img|video|todo|eyebrow|layout|lead|wifi|repo):\s*(.*)$/);
      if (h) {
        if (h[1] === "todo") cur.todos.push(h[2].trim());
        else if (h[1] === "img" || h[1] === "video") (cur.meta.imgs ||= []).push(h[2].trim());
        else cur.meta[h[1]] = h[2].trim();
        continue;
      }
      mode = "body";
    }
    const late = line.match(/^(todo|img|video):\s*(.*)$/);
    if (late) { if (late[1] === "todo") cur.todos.push(late[2].trim()); else (cur.meta.imgs ||= []).push(late[2].trim()); continue; }
    const f = line.match(/^```(cmd|prompt|expect|text|code|svg)\s*$/);
    if (f) { fence = { type: f[1], lines: [] }; continue; }
    if (/^:::\s*notes\s*$/.test(line)) { notes = []; continue; }
    const last = cur.blocks[cur.blocks.length - 1];
    if (last && last.type === "md") last.text += "\n" + line;
    else cur.blocks.push({ type: "md", text: line });
  }
  push();
  if (fence) throw new Error(`${path.basename(file)}: unclosed \`\`\` fence`);
  if (notes !== null) throw new Error(`${path.basename(file)}: unclosed ::: notes`);
  return slides;
}

// ---------------------------------------------------------------- markdown (small, enough for slides)

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function inline(s) {
  const parts = [];
  let out = esc(s).replace(/`([^`]+)`/g, (_, c) => { parts.push(`<code>${c}</code>`); return `\u0000${parts.length - 1}\u0000`; });
  out = out
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, t, u) => `<a href="${u}"${/^https?:/.test(u.replace(/&amp;/g, "&")) ? ' rel="noopener"' : ""}>${t}</a>`);
  return out.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[+i]);
}

function mdToHtml(md) {
  const lines = md.split("\n");
  const out = [];
  let para = [];
  let list = null; // { tag, items }
  let table = null; // rows of cells; the first row is the header
  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(" "))}</p>`); para = []; } };
  const flushList = () => { if (list) { out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i)}</li>`).join("")}</${list.tag}>`); list = null; } };
  const flushTable = () => {
    if (!table) return;
    const [head, ...rows] = table;
    out.push(`<div class="table-wrap"><table><thead><tr>${head.map((c) => `<th scope="col">${inline(c)}</th>`).join("")}</tr></thead>` +
      `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`);
    table = null;
  };
  let quote = null; // consecutive "> " lines, kept line for line (for verbatim quotes)
  const flushQuote = () => { if (quote) { out.push(`<blockquote>${quote.map((q) => `<p>${inline(q)}</p>`).join("")}</blockquote>`); quote = null; } };
  for (const l of lines) {
    const q = l.match(/^>\s?(.*)$/);
    if (q) { flushPara(); flushList(); flushTable(); (quote ||= []).push(q[1]); continue; }
    flushQuote();
    if (/^\s*\|.*\|\s*$/.test(l)) {
      flushPara(); flushList();
      if (/^\s*\|[\s:|-]+\|\s*$/.test(l)) continue; // the |---|---| separator row
      (table ||= []).push(l.trim().slice(1, -1).split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, "|")));
      continue;
    }
    flushTable();
    const ul = l.match(/^\s*[-*]\s+(.*)$/);
    const ol = l.match(/^\s*\d+\.\s+(.*)$/);
    const h = l.match(/^(#{2,4})\s+(.*)$/);
    if (h) { flushPara(); flushList(); const n = Math.min(h[1].length + 1, 4); out.push(`<h${n}>${inline(h[2])}</h${n}>`); continue; }
    if (ul || ol) {
      flushPara();
      const tag = ul ? "ul" : "ol";
      if (!list || list.tag !== tag) { flushList(); list = { tag, items: [] }; }
      list.items.push((ul || ol)[1]);
      continue;
    }
    if (!l.trim()) { flushPara(); flushList(); continue; }
    if (list && /^\s{2,}\S/.test(l)) { list.items[list.items.length - 1] += " " + l.trim(); continue; }
    flushList();
    para.push(l.trim());
  }
  flushPara(); flushList(); flushTable(); flushQuote();
  return out.join("\n");
}

const mdToText = (md) => md.replace(/\*\*([^*]+)\*\*/g, "$1").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").trim();

// ---------------------------------------------------------------- sources + command validation

function walk(dir, pred, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === "node_modules" || e.name.startsWith(".")) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, pred, acc);
    else if (pred(p)) acc.push(p);
  }
  return acc;
}

function loadCorpus() {
  const files = [
    path.join(ROOT, "curriculum", "outline.json"),
    ...walk(path.join(ROOT, "curriculum"), (p) => /\.md$/i.test(p)),
    ...walk(path.join(ROOT, "labs"), (p) => /(README|EMULATOR-RESULTS)\.md$/i.test(p)),
    ...walk(path.join(ROOT, "setup"), (p) => /\.(md|ps1|sh|mjs)$/i.test(p)),
    path.join(ROOT, "CLAUDE.md"),
    path.join(ROOT, "package.json"),
    path.join(ROOT, "assets", "emulator", "WALKTHROUGH.md"),
    ...walk(path.join(ROOT, "assets", "pico-docs"), (p) => /\.md$/i.test(p)),
    path.join(ROOT, "labs", "README.md"),
    path.join(ROOT, "labs", "VERSIONS.md"),
    path.join(ROOT, "examples", "README.md"),
    path.join(ROOT, "labs", "SPATIAL-CRACK.md"),
  ].filter((p) => fs.existsSync(p));
  // Markdown tables escape pipes as \|, so unescape before matching a command like `irm ... | iex`.
  const norm = (s) => s.replace(/\\"/g, '"').replace(/\\\|/g, "|").replace(/\s+/g, " ");
  const text = files.map((f) => norm(fs.readFileSync(f, "utf8"))).join("\n");
  // Documented templates such as `node setup/launch.mjs <lab number>` match any single value in the <slot>.
  const templates = [...new Set((text.match(/`[^`\n]*<[^`>\n]+>[^`\n]*`/g) || []).map((t) => t.slice(1, -1).trim()))]
    .map((t) => new RegExp("^" + t.split(/<[^>]+>/).map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("\\S+") + "$"));
  const matches = (cmd) => text.includes(norm(cmd)) || templates.some((re) => re.test(norm(cmd)));
  // package.json scripts are commands too: `npm run <name>` is sourced when the kit defines <name>.
  const scripts = new Set();
  for (const f of files.filter((f) => f.endsWith("package.json"))) Object.keys(JSON.parse(fs.readFileSync(f, "utf8")).scripts || {}).forEach((k) => scripts.add(k));
  for (const f of walk(path.join(ROOT, "labs"), (p) => /[\\/](start|template)[\\/]package\.json$/.test(p))) Object.keys(JSON.parse(fs.readFileSync(f, "utf8")).scripts || {}).forEach((k) => scripts.add(k));
  const isScript = (cmd) => { const m = cmd.match(/^npm run ([\w:-]+)$/); return !!(m && scripts.has(m[1])); };
  return { files: files.map((f) => path.relative(ROOT, f).replace(/\\/g, "/")), text, norm, matches: (c) => matches(c) || isScript(c) };
}

function loadHelp() {
  const p = path.join(SRC, "pico-cli-help.txt");
  const sections = new Map();
  if (!fs.existsSync(p)) return sections;
  let key = null;
  for (const line of fs.readFileSync(p, "utf8").split(/\r?\n/)) {
    const m = line.match(/^## (pico-cli(?: [a-z][\w-]*)*) --help/);
    if (m) { key = m[1]; sections.set(key, ""); continue; }
    if (key) sections.set(key, sections.get(key) + line + "\n");
  }
  return sections;
}

function checkPicoCli(cmd, help) {
  // Split into tokens, respecting quotes, and stop at shell operators.
  const toks = cmd.match(/"[^"]*"|'[^']*'|\S+/g) || [];
  if (toks[0] !== "pico-cli") return null;
  let key = "pico-cli";
  let i = 1;
  while (i < toks.length && !toks[i].startsWith("-") && help.has(`${key} ${toks[i]}`)) { key = `${key} ${toks[i]}`; i++; }
  if (key === "pico-cli" && toks.length > 1 && !toks[1].startsWith("-")) return `unknown pico-cli family "${toks[1]}"`;
  const section = help.get(key) || "";
  for (const t of toks.slice(i)) {
    if (/^[|&;>]/.test(t)) break;
    if (!t.startsWith("-")) continue;
    const flag = t.split("=")[0];
    if (!new RegExp(`(^|[\\s,])${flag.replace(/[-]/g, "\\-")}([\\s,]|$)`, "m").test(section)) return `flag ${flag} not in \`${key} --help\``;
  }
  return "ok";
}

function validate(slides) {
  const corpus = loadCorpus();
  const help = loadHelp();
  const report = [];
  for (const s of slides) {
    for (const b of s.blocks.filter((b) => b.type === "cmd")) {
      const cmd = b.text.trim().replace(/\s+#\s[^\n]*$/, "");
      const inSources = corpus.matches(cmd);
      const pc = checkPicoCli(cmd, help);
      let source = inSources ? "course sources" : pc === "ok" ? "pico-cli --help" : null;
      if (!source) {
        const why = pc && pc !== "ok" ? pc : "not found in course sources";
        s.todos.push(`unsourced command: ${cmd} (${why})`);
        report.push({ id: s.id, cmd, why });
      }
      b.source = source;
    }
    const lv = s.id.match(/^L(\d)-/);
    if (s.kind === "lab" && lv && !fs.existsSync(path.join(ROOT, LEVELS[+lv[1]].readme))) s.todos.push(`${LEVELS[+lv[1]].readme} has not landed yet`);
    for (const src of s.meta.imgs || []) {
      const [file, alt] = src.split("|").map((x) => x.trim());
      if (file === "PENDING") { s.todos.push(`emulator screenshot pending: ${alt}`); continue; }
      if (!/^https?:/.test(file) && !fs.existsSync(path.resolve(HERE, file))) s.todos.push(`image not found yet: ${file}`);
    }
  }
  return { report, corpusFiles: corpus.files, helpSections: help.size };
}

// ---------------------------------------------------------------- derive

function derive(s) {
  const m = s.id.match(/^L(\d)-s(\d+)$/);
  s.level = m ? +m[1] : s.id.startsWith("intro") ? "intro" : "close";
  s.step = m ? +m[2] : +(s.id.match(/s(\d+)$/) || [0, 0])[1];
  s.commands = s.blocks.filter((b) => b.type === "cmd").map((b) => b.text.trim());
  s.prompts = s.blocks.filter((b) => b.type === "prompt").map((b) => b.text.trim());
  s.code = s.blocks.filter((b) => b.type === "code").map((b) => b.text);
  s.text = s.blocks.filter((b) => b.type === "text").map((b) => b.text);   // copyable plain text, e.g. a line to paste into CLAUDE.md
  // A diagram is inline SVG; its <title> and <desc> are the text an agent (or a screen reader) gets.
  s.diagrams = s.blocks.filter((b) => b.type === "svg").map((b) => ({
    title: (b.text.match(/<title>([\s\S]*?)<\/title>/) || [0, ""])[1].trim(),
    description: (b.text.match(/<desc>([\s\S]*?)<\/desc>/) || [0, ""])[1].replace(/\s+/g, " ").trim(),
  }));
  s.expect = s.blocks.filter((b) => b.type === "expect").map((b) => b.text.trim()).join("\n\n") || null;
  s.body = mdToText(s.blocks.filter((b) => b.type === "md").map((b) => b.text).join("\n\n"));
  // img: src | alt        video: clip.webm | poster.png | alt
  s.images = (s.meta.imgs || []).map((x) => {
    const parts = x.split("|").map((y) => y.trim());
    const src = parts[0];
    const video = isVideo(src);
    const poster = video && parts.length > 2 ? parts[1] : null;
    const alt = parts.length > 1 ? parts[parts.length - 1] : "";
    return { type: video ? "video" : "image", src: src === "PENDING" ? null : served(src), original: src === "PENDING" ? null : src, poster: served(poster), alt, pending: src === "PENDING", credit: src === "PENDING" ? null : creditFor(src) };
  });
  return s;
}

// ---------------------------------------------------------------- render HTML

let codeSeq = 0;
function codeBlock(b) {
  const id = `c${++codeSeq}`;
  if (b.type === "expect") {
    return `<div class="expect"><h3 class="expect-h">You should see</h3><pre data-expect>${esc(b.text)}</pre></div>`;
  }
  const isCmd = b.type === "cmd";
  const label = { cmd: "Terminal", prompt: "Claude Code prompt", code: "Code", text: "Text" }[b.type];
  const attr = { cmd: "data-cmd", prompt: "data-prompt", code: "data-code", text: "data-text" }[b.type];
  const src = b.source ? ` data-source="${esc(b.source)}"` : "";
  return `<div class="code code--${b.type}"><div class="code-bar"><span class="code-label">${label}</span>` +
    `<button type="button" class="copy" data-copy="${id}" aria-label="Copy ${label.toLowerCase()}">Copy</button></div>` +
    `<pre><code id="${id}" ${attr}${src}>${esc(b.text)}</code></pre></div>`;
}

function todoChips(s) {
  return s.todos.length
    ? `<div class="todos">${s.todos.map((t) => `<span class="pico-chip pico-chip--warn" data-todo>TODO: ${esc(t)}</span>`).join("")}</div>`
    : "";
}

function figure(img) {
  if (img.src === null) img = { ...img, src: "PENDING" };
  const exists = img.src !== "PENDING" && (/^https?:/.test(img.src) || fs.existsSync(path.resolve(HERE, img.src)));
  if (!exists) return `<figure class="shot shot--missing"><div class="shot-ph" role="img" aria-label="${esc(img.alt)}"><span class="pico-eyebrow">Screenshot pending</span><span>${esc(img.alt)}</span></div><figcaption>${esc(img.alt)}</figcaption></figure>`;
  const credit = img.credit ? `<small class="shot-credit">${esc(img.credit)}</small>` : "";
  if (img.type === "video") {
    // Muted looping clip. The poster and the caption carry the content for anyone who can't play it.
    const poster = img.poster ? ` poster="${esc(img.poster)}"` : "";
    return `<figure class="shot shot--video"><video src="${esc(img.src)}"${poster} muted loop playsinline preload="none" data-autoplay aria-label="${esc(img.alt)}">${esc(img.alt)}</video><figcaption>${esc(img.alt)}${credit}</figcaption></figure>`;
  }
  return `<figure class="shot"><img src="${esc(img.src)}" alt="${esc(img.alt)}" loading="lazy"><figcaption>${esc(img.alt)}${credit}</figcaption></figure>`;
}

function eyebrow(s, stepCounts) {
  if (s.meta.eyebrow) return s.meta.eyebrow;
  if (typeof s.level !== "number") return "";
  const L = `Level ${s.level} · ${LEVELS[s.level].name}`;
  if (s.kind === "step") return `${L} · Step ${s.stepIndex} of ${stepCounts[s.level]}`;
  if (s.kind === "checkpoint") return `${L} · Checkpoint`;
  if (s.kind === "lab") return `${L} · Lab`;
  return L;
}

function renderSlide(s, ctx) {
  const md = (type) => s.blocks.filter((b) => b.type === type);
  const bodyHtml = s.blocks.map((b) => (b.type === "md" ? mdToHtml(b.text) : "")).join("\n");
  const codes = s.blocks.filter((b) => ["cmd", "prompt", "text", "code"].includes(b.type)).map(codeBlock).join("\n");
  const expects = md("expect").map(codeBlock).join("\n");
  const svgBlocks = s.blocks.filter((b) => b.type === "svg");
  const svgs = svgBlocks.map((b, i) => {
    const d = s.diagrams[i];
    return `<figure class="diagram">${b.text.replace("<svg", `<svg role="img" aria-label="${esc(d.title)}"`)}<figcaption>${esc(d.description)}</figcaption></figure>`;
  }).join("\n");
  const figs = svgs + s.images.map(figure).join("\n");
  const notes = s.notes ? `<aside class="notes" aria-label="Speaker notes"><h3>Speaker notes</h3>${mdToHtml(s.notes)}</aside>` : "";
  const hTag = s.meta.layout === "cover" ? "h1" : "h2";
  const eb = eyebrow(s, ctx.stepCounts);
  const title = `<${hTag} class="pico-display slide-title">${inline(s.title)}</${hTag}>`;
  const ebHtml = eb ? `<p class="pico-eyebrow">${esc(eb)}</p>` : "";
  const lead = s.meta.lead ? `<p class="lead">${inline(s.meta.lead)}</p>` : "";
  const action = s.meta.action ? `<p class="action"><span class="action-k">Do this</span> ${inline(s.meta.action)}</p>` : "";
  const layout = s.meta.layout || s.kind;
  const lv = typeof s.level === "number" ? s.level : s.level;
  let inner;

  if (layout === "cover") {
    const [net, pw] = (s.meta.wifi || "").split("|").map((x) => x.trim());
    const wifi = net ? `<p class="wifi" data-wifi><span class="pico-eyebrow">Wi-Fi</span> <strong>${esc(net)}</strong> <span class="wifi-k">password</span> <strong>${esc(pw || "")}</strong></p>` : "";
    const repo = s.meta.repo ? `<p class="wifi" data-repo><span class="pico-eyebrow">Kit</span> <a href="${esc(s.meta.repo)}" rel="noopener"><strong>${esc(s.meta.repo.replace(/^https:\/\//, ""))}</strong></a></p>` : "";
    inner = `<div class="cover">${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div><div class="logistics">${wifi}${repo}</div>${codes}${todoChips(s)}</div>`;
  } else if (layout === "pair") {
    // Two screenshots side by side (before / after), one shared caption line in the body.
    inner = `<div class="pair">${ebHtml}${title}${lead}<div class="pair-figs">${s.images.map(figure).join("")}</div><div class="body">${bodyHtml}</div>${codes}${todoChips(s)}</div>`;
  } else if (layout === "compare") {
    // Two panes side by side: the body's "## " headings split it. The second pane is the "after" state.
    const md = s.blocks.filter((b) => b.type === "md").map((b) => b.text).join("\n");
    const panes = md.split(/^(?=## )/m).filter((p) => p.trim().startsWith("## "));
    const paneHtml = panes.map((p, i) => {
      const [head, ...rest] = p.trim().split("\n");
      return `<div class="pane${i === panes.length - 1 ? " pane--on" : ""}"><h3 class="pane-h">${inline(head.replace(/^##\s+/, ""))}</h3>${mdToHtml(rest.join("\n"))}</div>`;
    }).join(`<div class="pane-arrow" aria-hidden="true">&rarr;</div>`);
    inner = `<div class="compare">${ebHtml}${title}${lead}<div class="panes">${paneHtml}</div>${codes}${expects}${todoChips(s)}</div>`;
  } else if (layout === "diagram") {
    inner = `<div class="diagram-slide">${ebHtml}${title}${svgs}<div class="body">${bodyHtml}</div>${todoChips(s)}</div>`;
  } else if (layout === "warning") {
    inner = `<div class="warning">${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div>${codes}${expects}${todoChips(s)}</div>`;
  } else if (layout === "agenda") {
    const cards = Object.entries(LEVELS).map(([n, L]) => {
      const lvSlide = ctx.slides.find((x) => x.level === +n && x.kind === "concept");
      const o = ctx.outline.find((x) => x.level === +n);
      const mins = o ? `${o.duration_min} min in the room · ${Math.round(o.duration_self_paced_min / 60 * 10) / 10} h self-paced` : "";
      return `<li class="lvl-card"><a href="#${lvSlide ? lvSlide.id : ""}"><span class="lvl-num" aria-hidden="true">L${n}</span>` +
        `<span class="lvl-body"><span class="lvl-name">L${n} · ${esc(L.name)}</span><span class="lvl-meta">${esc(mins)}</span></span></a></li>`;
    }).join("");
    inner = `<div class="center-head">${ebHtml}${title}${lead}</div><ol class="lvl-grid">${cards}</ol><div class="body body--center">${bodyHtml}</div>${todoChips(s)}`;
  } else if (layout === "concept" && figs) {
    inner = `<div class="step concept--split"><div class="step-l">${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div>${codes}${expects}${todoChips(s)}</div><div class="step-r">${figs}</div></div>`;
  } else if (layout === "concept") {
    inner = `<div class="concept">${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div>${codes}${figs}${expects}${todoChips(s)}</div>`;
  } else if (layout === "step") {
    // Without a screenshot, code snippets move to the right column so the left keeps the command and prompt.
    const leftTypes = figs ? ["cmd", "prompt", "text", "code"] : ["cmd", "prompt", "text"];
    let leftBlocks = s.blocks.filter((b) => leftTypes.includes(b.type));
    let overflowBlocks = [];
    // No screenshot and four or more blocks: continue the sequence at the top of the right column.
    if (!figs && leftBlocks.length >= 4) { overflowBlocks = leftBlocks.slice(2); leftBlocks = leftBlocks.slice(0, 2); }
    const leftCodes = leftBlocks.map(codeBlock).join("\n");
    const rightCodes = overflowBlocks.map(codeBlock).join("\n") + (figs ? "" : s.blocks.filter((b) => b.type === "code").map(codeBlock).join("\n"));
    const right = figs || expects || rightCodes ? `<div class="step-r">${figs}${rightCodes}${expects}</div>` : "";
    inner = `<div class="step${right ? "" : " step--solo"}"><div class="step-l">${ebHtml}${title}${action}<div class="body">${bodyHtml}</div>${leftCodes}${todoChips(s)}</div>${right}</div>`;
  } else if (layout === "checkpoint") {
    inner = `<div class="checkpoint">${ebHtml}${title}${lead}<div class="pico-panel check-panel">${bodyHtml}</div>${codes}${expects}${todoChips(s)}</div>`;
  } else if (layout === "lab") {
    const L = typeof lv === "number" ? LEVELS[lv] : null;
    const btn = L ? `<p class="cta"><a class="pico-btn" href="../${L.readme}">Open ${L.readme}</a> <a class="pico-link" href="#${ctx.nextLevelId(s)}">Next level</a></p>` : "";
    const labText = `${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div>${codes}${expects}${btn}${todoChips(s)}`;
    // A lab slide with a screenshot (proof the finished lab works) gets the two-column step grid.
    inner = figs ? `<div class="step lab lab--fig"><div class="step-l">${labText}</div><div class="step-r">${figs}</div></div>` : `<div class="lab">${labText}</div>`;
  } else {
    inner = `<div class="concept">${ebHtml}${title}${lead}<div class="body">${bodyHtml}</div>${codes}${figs}${expects}${todoChips(s)}</div>`;
  }
  const cls = ["slide", `slide--${layout}`, typeof lv === "number" && layout === "concept" && s.step === 1 ? "slide--level" : ""].filter(Boolean).join(" ");
  return `<section class="${cls}" id="${s.id}" data-level="${lv}" data-step="${s.step}" data-kind="${s.kind}" aria-labelledby="${s.id}-t">` +
    `<div class="slide-inner">${inner.replace(`<${hTag} class`, `<${hTag} id="${s.id}-t" class`)}${notes}</div></section>`;
}

// ---------------------------------------------------------------- outputs

function renderMarkdown(slides) {
  const out = [
    "# PICO WebSpatial Academy: slide deck",
    "",
    "Generated by `slides/build.mjs` from `slides/src/*.md`. Same slide ids as `index.html` and `deck.json`. Do not edit by hand.",
    "",
  ];
  for (const s of slides) {
    out.push(`## ${s.title} {#${s.id}}`, "", `*id: ${s.id} · level: ${s.level} · step: ${s.step} · kind: ${s.kind}*`, "");
    if (s.meta.lead) out.push(mdToText(s.meta.lead), "");
    if (s.meta.action) out.push(`**Do this:** ${s.meta.action}`, "");
    if (s.agendaText) out.push(s.agendaText, "");
    for (const b of s.blocks) {
      if (b.type === "md" && b.text.trim()) out.push(b.text.trim(), "");
      if (b.type === "cmd") out.push("```bash", b.text, "```", "");
      if (b.type === "prompt") out.push("Claude Code prompt:", "", "```text", b.text, "```", "");
      if (b.type === "text") out.push("```text", b.text, "```", "");
      if (b.type === "code") out.push("```tsx", b.text, "```", "");
      if (b.type === "svg") { const d = s.diagrams[s.blocks.filter((x) => x.type === "svg").indexOf(b)]; out.push(`**Diagram: ${d.title}.** ${d.description}`, ""); }
      if (b.type === "expect") out.push("You should see:", "", "```text", b.text, "```", "");
    }
    for (const i of s.images) {
      const credit = i.credit ? `\n*${i.credit}*` : "";
      if (i.pending) out.push(`*[Screenshot pending: ${i.alt}]*`, "");
      else if (i.type === "video") out.push(`Video: [${i.alt}](${i.src})${i.poster ? `\n\n![${i.alt} (poster)](${i.poster})` : ""}${credit}`, "");
      else out.push(`![${i.alt}](${i.src})${credit}`, "");
    }
    if (s.todos.length) out.push(...s.todos.map((t) => `> TODO: ${t}`), "");
    if (s.notes) out.push("> **Speaker notes:** " + s.notes.replace(/\n+/g, " "), "");
  }
  return out.join("\n");
}

function renderJson(slides, meta) {
  return JSON.stringify({
    title: "PICO WebSpatial Academy",
    generated_by: "slides/build.mjs",
    generated_at: new Date().toISOString(),
    html: "index.html",
    markdown: "slides.md",
    levels: Object.entries(LEVELS).map(([n, L]) => ({ level: +n, name: L.name, lab: L.lab, readme: L.readme, first_slide: (slides.find((s) => s.level === +n) || {}).id })),
    links: meta.links,
    logistics: (() => {
      const c = slides.find((x) => x.meta.wifi);
      if (!c) return null;
      const [network, password] = c.meta.wifi.split("|").map((x) => x.trim());
      return { wifi: { network, password }, repo: c.meta.repo || null };
    })(),
    command_sources: meta.corpusFiles.concat(["slides/src/pico-cli-help.txt"]),
    slides: slides.map((s) => ({
      id: s.id, level: s.level, step: s.step, kind: s.kind, title: s.title,
      action: s.meta.action || null,
      body: [s.meta.lead ? mdToText(s.meta.lead) : null, s.body].filter(Boolean).join("\n\n"),
      commands: s.commands, prompts: s.prompts, code: s.code, text: s.text, diagrams: s.diagrams, expect: s.expect,
      media: s.images.map(({ type, src, original, poster, alt, pending, credit }) => ({ type, src, original, poster, alt, caption: alt, credit, pending })),
      notes: s.notes || null, todos: s.todos,
    })),
  }, null, 2) + "\n";
}

// ---------------------------------------------------------------- main

const files = fs.readdirSync(SRC).filter((f) => /^\d\d.*\.md$/.test(f)).sort();
const slides = files.flatMap((f) => parseFile(path.join(SRC, f)));
const ids = new Set();
for (const s of slides) { if (ids.has(s.id)) throw new Error(`duplicate slide id ${s.id}`); ids.add(s.id); }
const meta = validate(slides);
slides.forEach(derive);

const outline = JSON.parse(fs.readFileSync(path.join(ROOT, "curriculum", "outline.json"), "utf8"));
// The agenda's level cards are generated in HTML; give markdown + JSON the same content as text.
for (const s of slides.filter((x) => x.meta.layout === "agenda")) {
  const list = Object.entries(LEVELS).map(([n, L]) => {
    const o = outline.find((x) => x.level === +n);
    return `- L${n} · ${L.name}${o ? `: ${o.duration_min} min in the room, ${Math.round(o.duration_self_paced_min / 6) / 10} h self-paced, lab ${L.lab}` : ""}`;
  }).join("\n");
  s.agendaText = list;
  s.body = [list, s.body].filter(Boolean).join("\n\n");
}
const stepCounts = {};
// Step numbers come from position among a level's step slides, so a warning or concept slide can sit between them.
for (const s of slides) if (s.kind === "step" && typeof s.level === "number") s.stepIndex = stepCounts[s.level] = (stepCounts[s.level] || 0) + 1;
const ctx = {
  slides, outline, stepCounts,
  nextLevelId: (s) => { const n = slides.find((x) => typeof x.level === "number" && x.level === s.level + 1); return n ? n.id : "close-s1"; },
};

const tpl = fs.readFileSync(path.join(SRC, "template.html"), "utf8");
const nav = Object.entries(LEVELS).map(([n, L]) => {
  const first = slides.find((s) => s.level === +n);
  return `<li><a href="#${first ? first.id : ""}" data-nav-level="${n}"><span class="pico-kbd">${n}</span> L${n} · ${esc(L.name)}</a></li>`;
}).join("");
const topNav = Object.entries(LEVELS).map(([n, L]) => {
  const first = slides.find((s) => s.level === +n);
  return `<li><a href="#${first ? first.id : ""}" data-nav-level="${n}" title="Level ${n}: ${esc(L.name)} (key ${n})">L${n}<span class="nm">${esc(L.name)}</span></a></li>`;
}).join("");
const html = tpl
  .split("{{TOP_NAV}}").join(topNav)
  .split("{{SLIDES}}").join(slides.map((s) => renderSlide(s, ctx)).join("\n"))
  .split("{{LEVEL_INDEX}}").join(nav)
  .split("{{COUNT}}").join(String(slides.length));

// Every link and asset the deck uses must be relative (the kit will be moved under a hub folder).
// Record each one and whether its target exists today.
const linkSet = new Set();
for (const m of html.matchAll(/\s(?:href|src)="([^"#][^"]*)"/g)) linkSet.add(m[1].replace(/&amp;/g, "&"));
meta.links = [...linkSet].sort().map((href) => {
  const external = /^[a-z]+:/i.test(href);
  const absolute = href.startsWith("/");
  return { href, kind: external ? "external" : absolute ? "ABSOLUTE" : "relative", exists: external ? null : fs.existsSync(path.resolve(HERE, decodeURI(href.split(/[?#]/)[0]))) };
});

const todoTotal = slides.reduce((n, s) => n + s.todos.length, 0);
if (!CHECK_ONLY) {
  fs.writeFileSync(path.join(HERE, "index.html"), html);
  fs.writeFileSync(path.join(HERE, "slides.md"), renderMarkdown(slides));
  fs.writeFileSync(path.join(HERE, "deck.json"), renderJson(slides, meta));
}
const perLevel = {};
for (const s of slides) perLevel[s.level] = (perLevel[s.level] || 0) + 1;
console.log(`slides: ${slides.length}  per level: ${JSON.stringify(perLevel)}`);
console.log(`commands: ${slides.reduce((n, s) => n + s.commands.length, 0)}  prompts: ${slides.reduce((n, s) => n + s.prompts.length, 0)}  pico-cli help sections: ${meta.helpSections}`);
console.log(`command sources: ${meta.corpusFiles.join(", ") || "(none)"}`);
for (const r of meta.report) console.log(`  UNSOURCED ${r.id}: ${r.cmd}  (${r.why})`);
const rel = meta.links.filter((l) => l.kind === "relative");
console.log(`links: ${rel.length} relative (${rel.filter((l) => !l.exists).length} missing today), ${meta.links.filter((l) => l.kind === "external").length} external, ${meta.links.filter((l) => l.kind === "ABSOLUTE").length} absolute`);
for (const l of meta.links.filter((l) => l.kind === "ABSOLUTE" || l.exists === false)) console.log(`  LINK ${l.kind === "ABSOLUTE" ? "ABSOLUTE" : "missing"}: ${l.href}`);
// Every concept/step/lab slide should carry media (an image, a clip or a diagram). Report the ones that don't.
const bare = slides.filter((s) => ["concept", "step", "lab"].includes(s.kind) && !s.images.some((m) => !m.pending) && !s.diagrams.length);
const mediaBytes = [...new Set(slides.flatMap((s) => s.images.flatMap((m) => [m.src, m.poster]).filter(Boolean)))]
  .map((p) => { try { return fs.statSync(path.resolve(HERE, p)).size; } catch { return 0; } }).reduce((a, b) => a + b, 0);
console.log(`media: ${(mediaBytes / 1048576).toFixed(1)} MB referenced; slides without media (${bare.length}): ${bare.map((s) => s.id).join(" ")}`);
console.log(`TODO chips: ${todoTotal}`);
for (const s of slides) for (const t of s.todos) console.log(`  TODO ${s.id}: ${t}`);
if (STRICT && (meta.report.length || todoTotal)) process.exit(1);
