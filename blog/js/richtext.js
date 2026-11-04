// richtext.js — satu-satunya tempat format isi artikel diurus. Dipakai oleh:
//   • blog/js/main.js          (tampilan artikel + pratinjau di dialog "Tempel artikel")
//   • tools/build-artikel.mjs  (halaman statis /a/…, dimuat lewat Node)
//   • blog/js/quality.js       (hitung kata tanpa simbol markdown)
//
// Isi artikel DISIMPAN sebagai Markdown (teks biasa di kolom body). Artikel lama (teks polos,
// bullet "• ") tetap tampil sama. Semua keluaran di-escape: HTML mentah dari teks TIDAK pernah lolos.
//
// Didukung: judul (#), tebal, miring, coret, kode, blok kode, kutipan, daftar bernomor/butir (bersarang),
// tabel (| a | b |), garis pemisah, tautan, gambar https.
// Saat ditempel (attachSmartPaste): HTML dari Word / Google Docs / Excel / web / chat AI, HTML mentah,
// dan tabel Excel/TSV otomatis diubah jadi Markdown.
//
// Modul ini murni (tanpa import) agar bisa dimuat browser dan Node. htmlToMd/attachSmartPaste hanya jalan di browser.

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

// ---------- inline ----------
const okLink = (u) => /^(https?:\/\/|mailto:|\/(?!\/)|#)/i.test(u);

function inline(raw) {
  const stash = [];
  const keep = (h) => `\u0000${stash.push(h) - 1}\u0000`;
  let s = esc(raw).replace(/&lt;br\s*\/?&gt;/gi, '\n');

  s = s.replace(/`([^`\n]+)`/g, (_, c) => keep(`<code>${c}</code>`));
  s = s.replace(/!\[([^\]]*)\]\((\S+?)\)/g, (_, alt, url) =>
    /^https:\/\//i.test(url) ? keep(`<img src="${url}" alt="${alt}" loading="lazy" decoding="async">`) : alt);
  s = s.replace(/\[([^\]\n]+)\]\((\S+?)(?:\s+&quot;[^)]*?&quot;)?\)/g, (m, t, url) => {
    if (!okLink(url)) return t;
    const ext = /^https?:\/\//i.test(url);
    return keep(`<a href="${url}"${ext ? ' target="_blank" rel="noopener nofollow"' : ''}>`) + t + keep('</a>');
  });
  s = s.replace(/(^|[\s(])(https?:\/\/[^\s<]*[^\s<.,;:!?)\]])/g, (m, pre, url) =>
    pre + keep(`<a href="${url}" target="_blank" rel="noopener nofollow">`) + url + keep('</a>'));

  s = s.replace(/\*\*(?=\S)([\s\S]+?)(?<=\S)\*\*/g, '<strong>$1</strong>')
       .replace(/(^|[^\w])__(?=\S)([\s\S]+?)(?<=\S)__(?!\w)/g, '$1<strong>$2</strong>')
       .replace(/~~(?=\S)([\s\S]+?)(?<=\S)~~/g, '<del>$1</del>')
       .replace(/(^|[^*\w])\*(?=[^\s*])([^*\n]+?)(?<=[^\s*])\*(?!\*)/g, '$1<em>$2</em>')
       .replace(/(^|[^\w])_(?=[^\s_])([^_\n]+?)(?<=[^\s_])_(?!\w)/g, '$1<em>$2</em>');

  return s.replace(/\n/g, '<br>').replace(/\u0000(\d+)\u0000/g, (_, i) => stash[i]);
}

// ---------- blok ----------
const RE = {
  fence: /^\s*(```|~~~)\s*[\w+-]*\s*$/,
  heading: /^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/,
  hr: /^\s{0,3}([-*_])(\s*\1){2,}\s*$/,
  ul: /^(\s*)([-*+•])\s+(.*)$/,
  ol: /^(\s*)(\d{1,3})[.)]\s+(.*)$/,
  quote: /^\s{0,3}>\s?(.*)$/,
  tblSep: /^\s*\|?\s*:?-{2,}:?\s*(\|\s*:?-{2,}:?\s*)*\|?\s*$/
};

function splitRow(line) {
  let t = line.trim();
  if (t.startsWith('|')) t = t.slice(1);
  if (t.endsWith('|') && !t.endsWith('\\|')) t = t.slice(0, -1);
  return t.split(/(?<!\\)\|/).map((c) => c.trim().replace(/\\\|/g, '|'));
}

export function mdToHtml(src) {
  const lines = String(src ?? '').replace(/\r\n?/g, '\n').replace(/\u0000/g, '').split('\n');
  const out = [];
  let i = 0;
  const blank = (l) => !l.trim();
  const isTable = (k) => k + 1 < lines.length && lines[k].includes('|') && lines[k + 1].includes('|')
    && RE.tblSep.test(lines[k + 1]) && splitRow(lines[k]).length === splitRow(lines[k + 1]).length;
  const listStart = (l, interrupt) => {
    if (RE.hr.test(l)) return false;
    if (RE.ul.test(l)) return true;
    const m = RE.ol.exec(l);
    return !!m && (!interrupt || m[2] === '1');
  };
  const startsBlock = (k) => RE.fence.test(lines[k]) || RE.heading.test(lines[k]) || RE.hr.test(lines[k])
    || RE.quote.test(lines[k]) || listStart(lines[k], true) || isTable(k);

  while (i < lines.length) {
    const l = lines[i];
    if (blank(l)) { i++; continue; }

    if (RE.fence.test(l)) {
      const code = []; i++;
      while (i < lines.length && !RE.fence.test(lines[i])) code.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(code.join('\n'))}</code></pre>`);
      continue;
    }

    let m = RE.heading.exec(l);
    if (m) {
      const lv = m[1].length, tag = lv <= 2 ? 'h2' : lv === 3 ? 'h3' : 'h4';
      out.push(`<${tag}>${inline(m[2])}</${tag}>`); i++;
      continue;
    }

    if (RE.hr.test(l)) { out.push('<hr>'); i++; continue; }

    if (isTable(i)) {
      const head = splitRow(l), n = head.length;
      const align = splitRow(lines[i + 1]).map((c) => (/^:-+:$/.test(c) ? 'center' : /-:$/.test(c) ? 'right' : /^:-/.test(c) ? 'left' : ''));
      const cell = (tag, c, k) => `<${tag}${align[k] ? ` style="text-align:${align[k]}"` : ''}>${inline(c)}</${tag}>`;
      let html = '<div class="tbl-wrap"><table><thead><tr>' + head.map((c, k) => cell('th', c, k)).join('') + '</tr></thead><tbody>';
      i += 2;
      while (i < lines.length && !blank(lines[i]) && lines[i].includes('|')) {
        const r = splitRow(lines[i++]);
        while (r.length < n) r.push('');
        html += '<tr>' + r.slice(0, n).map((c, k) => cell('td', c, k)).join('') + '</tr>';
      }
      out.push(html + '</tbody></table></div>');
      continue;
    }

    if (RE.quote.test(l)) {
      const q = [];
      while (i < lines.length && RE.quote.test(lines[i])) q.push(RE.quote.exec(lines[i++])[1]);
      out.push(`<blockquote>${mdToHtml(q.join('\n'))}</blockquote>`);
      continue;
    }

    if (listStart(l, false)) {
      const items = [];
      while (i < lines.length) {
        const ln = lines[i].replace(/\t/g, '    ');
        const u = !RE.hr.test(ln) && RE.ul.exec(ln), o = !u && RE.ol.exec(ln);
        if (u || o) {
          items.push({ indent: (u || o)[1].length, ordered: !!o, start: o ? +o[2] : 1, text: (u || o)[3] });
          i++;
        } else if (!blank(ln) && /^\s{2,}\S/.test(ln) && items.length && !startsBlock(i)) {
          items[items.length - 1].text += '\n' + ln.trim(); i++;
        } else if (blank(ln) && i + 1 < lines.length && listStart(lines[i + 1], false)) {
          i++;
        } else break;
      }
      let html = '';
      const stack = [];
      for (const it of items) {
        const tag = it.ordered ? 'ol' : 'ul';
        while (stack.length && it.indent < stack[stack.length - 1].indent) html += `</li></${stack.pop().tag}>`;
        const top = stack[stack.length - 1];
        const open = () => `<${tag}${tag === 'ol' && it.start !== 1 && !stack.length ? ` start="${it.start}"` : ''}>`;
        if (!top || it.indent > top.indent) { html += open() + '<li>' + inline(it.text); stack.push({ indent: it.indent, tag }); }
        else if (top.tag !== tag) { html += `</li></${top.tag}>` + open() + '<li>' + inline(it.text); top.tag = tag; }
        else html += '</li><li>' + inline(it.text);
      }
      while (stack.length) html += `</li></${stack.pop().tag}>`;
      out.push(html);
      continue;
    }

    const para = [l.trim()]; i++;
    while (i < lines.length && !blank(lines[i]) && !startsBlock(i)) para.push(lines[i++].trim());
    out.push(`<p>${inline(para.join('\n'))}</p>`);
  }
  return out.join('\n');
}

// ---------- teks polos (ringkasan, hitung kata, meta description) ----------
export function mdToText(md) {
  return String(md ?? '').replace(/\r\n?/g, '\n').split('\n').map((l) => {
    if (RE.fence.test(l) || RE.hr.test(l)) return '';
    if (l.includes('|') && RE.tblSep.test(l)) return '';
    return l.replace(/^\s{0,3}#{1,6}\s+/, '').replace(/^\s*>\s?/, '').replace(/^\s*([-*+•]|\d{1,3}[.)])\s+/, '')
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
      .replace(/`([^`]*)`/g, '$1').replace(/(\*\*|__|~~)(.+?)\1/g, '$2')
      .replace(/(^|[^*\w])\*([^\s*](?:[^*]*?[^\s*])?)\*(?!\*)/g, '$1$2')
      .replace(/(^|\W)_([^\s_](?:[^_]*?[^\s_])?)_(?!\w)/g, '$1$2')
      .replace(/\\\|/g, '\u0001').replace(/\s*\|\s*/g, ' ').replace(/\u0001/g, '|').trim();
  }).join('\n').replace(/\n{3,}/g, '\n\n').trim();
}

// Paragraf prosa pertama (lewati judul, tabel, daftar, kode, kutipan) sebagai teks polos satu baris.
export function firstProse(md) {
  const pars = String(md ?? '').replace(/\r\n?/g, '\n').split(/\n\s*\n/);
  for (const p of pars) {
    const t = p.trim();
    if (!t || /^(#{1,6}\s|\||```|~~~|>|[-*+•]\s|\d{1,3}[.)]\s|!\[)/.test(t) || RE.hr.test(t)) continue;
    const s = mdToText(t).replace(/\s+/g, ' ').trim();
    if (s) return s;
  }
  return '';
}

// ---------- TSV (tempel dari Excel/Sheets) -> tabel markdown ----------
const mdCell = (s) => String(s ?? '').replace(/\s*\n\s*/g, ' ').replace(/\|/g, '\\|').trim();
function rowsToMd(rows) {
  const n = Math.max(...rows.map((r) => r.length));
  const pad = (r) => { const a = r.map(mdCell); while (a.length < n) a.push(''); return '| ' + a.join(' | ') + ' |'; };
  return [pad(rows[0]), '| ' + Array(n).fill('---').join(' | ') + ' |', ...rows.slice(1).map(pad)].join('\n');
}
export function looksTsv(text) {
  const ls = String(text ?? '').replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim());
  if (ls.length < 2 || !ls.every((l) => l.includes('\t'))) return false;
  const c = ls[0].split('\t').length;
  return c >= 2 && ls.every((l) => l.split('\t').length === c);
}
export function tsvToMd(text) {
  const rows = String(text).replace(/\r\n?/g, '\n').split('\n').filter((l) => l.trim()).map((l) => l.split('\t'));
  return rows.length ? rowsToMd(rows) : '';
}

// ---------- HTML (clipboard Word / Docs / Excel / web / chat AI) -> markdown. Hanya browser. ----------
export function htmlToMd(html) {
  const doc = new DOMParser().parseFromString(String(html), 'text/html');
  doc.querySelectorAll('script,style,meta,link,title,noscript,template,svg,button,input,select,textarea,iframe').forEach((n) => n.remove());

  const wrap = (t, m) => {
    const x = /^(\s*)([\s\S]*?)(\s*)$/.exec(t);
    return x[2] ? x[1] + m + x[2] + m + x[3] : t;
  };
  const hasMark = (n) => ['STRONG', 'B', 'EM', 'I', 'DEL', 'S'].includes(n.parentElement?.tagName);
  const safeHref = (h) => (/^(https?:\/\/|mailto:)/i.test(h || '') ? h.replace(/\)/g, '%29').replace(/\s/g, '%20') : '');

  function conv(n, pre = false) {
    if (n.nodeType === 3) return pre ? n.nodeValue : n.nodeValue.replace(/\s+/g, ' ');
    if (n.nodeType !== 1) return '';
    const tag = n.tagName;
    const kids = (p = pre) => Array.from(n.childNodes).map((c) => conv(c, p)).join('');
    const fw = n.style?.fontWeight, plainW = fw === 'normal' || fw === '400';
    const heavy = fw === 'bold' || +fw >= 600, slant = n.style?.fontStyle === 'italic';

    switch (tag) {
      case 'BR': return '\n';
      case 'HR': return '\n\n---\n\n';
      case 'H1': case 'H2': case 'H3': case 'H4': case 'H5': case 'H6':
        return `\n\n${'#'.repeat(+tag[1])} ${kids().replace(/\*\*/g, '').replace(/\s+/g, ' ').trim()}\n\n`;
      case 'P': case 'DIV': case 'SECTION': case 'ARTICLE': case 'FIGURE': case 'FIGCAPTION': case 'MAIN': case 'HEADER': case 'FOOTER':
        return `\n\n${kids().trim()}\n\n`;
      case 'STRONG': case 'B': return plainW || hasMark(n) && n.parentElement.tagName === tag ? kids() : wrap(kids(), '**');
      case 'EM': case 'I': return hasMark(n) && n.parentElement.tagName === tag ? kids() : wrap(kids(), '*');
      case 'DEL': case 'S': case 'STRIKE': return wrap(kids(), '~~');
      case 'CODE': return n.parentElement?.tagName === 'PRE' ? kids(true) : wrap(kids().replace(/`/g, "'"), '`');
      case 'PRE': return '\n\n```\n' + n.textContent.replace(/\n+$/, '') + '\n```\n\n';
      case 'SPAN': { let t = kids(); if (heavy && !hasMark(n)) t = wrap(t, '**'); if (slant) t = wrap(t, '*'); return t; }
      case 'A': { const t = kids(), h = safeHref(n.getAttribute('href')); return h && t.trim() ? `[${t.trim()}](${h})` : t; }
      case 'IMG': { const s = n.getAttribute('src') || ''; return /^https:\/\//i.test(s) ? `![${(n.getAttribute('alt') || '').replace(/[\[\]]/g, '')}](${s.replace(/\)/g, '%29')})` : ''; }
      case 'BLOCKQUOTE': return '\n\n' + kids().trim().split('\n').map((x) => '> ' + x).join('\n').replace(/^> $/gm, '>') + '\n\n';
      case 'UL': case 'OL': {
        let k = +(n.getAttribute('start') || 1);
        const rows = [];
        for (const li of n.children) {
          if (li.tagName !== 'LI') continue;
          const inner = conv(li).trim().replace(/\n{2,}/g, '\n');
          const [first, ...rest] = inner.split('\n');
          rows.push((tag === 'OL' ? `${k++}. ` : '- ') + first + (rest.length ? '\n' + rest.map((r) => '  ' + r).join('\n') : ''));
        }
        return `\n\n${rows.join('\n')}\n\n`;
      }
      case 'TABLE': {
        const rows = Array.from(n.querySelectorAll('tr')).filter((tr) => tr.closest('table') === n).map((tr) => {
          const cells = [];
          Array.from(tr.children).filter((c) => c.tagName === 'TD' || c.tagName === 'TH').forEach((c) => {
            cells.push(conv(c).replace(/\s*\n+\s*/g, ' ').replace(/\s+/g, ' ').trim());
            for (let s = 1; s < Math.min(+c.getAttribute('colspan') || 1, 12); s++) cells.push('');
          });
          return cells;
        }).filter((r) => r.length);
        return rows.length ? `\n\n${rowsToMd(rows)}\n\n` : '';
      }
      default: return kids();
    }
  }

  return conv(doc.body).replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+(?=\n)/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

// ---------- tempel pintar ----------
// Pasang di <textarea>. Saat clipboard berisi HTML terstruktur / HTML mentah / tabel Excel, ubah jadi Markdown.
// Teks biasa tetap ditempel seperti biasa. Ctrl/Cmd+Shift+V = selalu teks polos (bawaan browser).
export function attachSmartPaste(ta, notify = () => {}) {
  ta.addEventListener('paste', (e) => {
    const cd = e.clipboardData;
    if (!cd) return;
    const html = cd.getData('text/html'), text = cd.getData('text/plain');
    let md = '', kind = '';
    try {
      if (html && /<(table|h[1-6]|ul|ol|pre|blockquote|a\s|strong|b[\s>]|em[\s>]|i[\s>]|img)/i.test(html)) { md = htmlToMd(html); kind = 'HTML'; }
      else if (/^\s*<(table|h[1-6]|p|div|ul|ol|blockquote)[\s>]/i.test(text) && /<\/(table|h[1-6]|p|div|ul|ol|blockquote)>/i.test(text)) { md = htmlToMd(text); kind = 'kode HTML'; }
      else if (looksTsv(text)) { md = tsvToMd(text); kind = 'tabel (Excel/Sheets)'; }
    } catch (err) { return; }
    const alnum = (s) => s.replace(/[^\p{L}\p{N}]/gu, '').length;
    const ref = kind === 'kode HTML' ? text.replace(/<[^>]*>/g, '') : text;
    if (!md.trim() || alnum(md) < alnum(ref) * 0.6) return;   // jangan kehilangan teks
    e.preventDefault();
    ta.setRangeText(md, ta.selectionStart, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
    notify(kind);
  });
}
