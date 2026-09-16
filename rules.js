/* ============================= RULES TAB ============================= */
// The rules PDF is one fixed file, rules.pdf, sitting next to index.html on GitHub Pages —
// overwrite it with the latest version any time the rules change.
//
// This deliberately does NOT use fetch()/JS to grab the file — it's a plain native
// <a href="..." download> link, the same mechanism any ordinary file-download link on the web
// uses. The browser handles the actual request itself; there's no JS step that could be the point
// of failure. The cache-busting query param still guarantees a fresh copy instead of a stale one.

const RULES_PDF_URL = './rules.pdf';

function renderRules(){
  renderRulesContent();
}

function renderRulesContent(){
  const el = document.getElementById('rulesContent');
  if(!el) return;
  const url = RULES_PDF_URL+'?t='+Date.now();
  el.innerHTML = '<div class="step step-emphasis"><div class="step-head"><span class="step-title">Rules</span></div>'
    + '<div class="step-sub">Click below to download the current rules PDF.</div>'
    + '<a class="btn primary" href="'+url+'" download="rules.pdf">&#128190; Download Rules PDF</a>'
    + '<p class="empty-note" style="margin-top:10px;">Having trouble? <a href="'+url+'" target="_blank" style="color:var(--cyan-bright);">Open the PDF directly</a> instead \u2014 this should open <code>'+escapeHtml(url)+'</code> in a new tab. If that also fails to load, rules.pdf either isn\u2019t in the repo yet or isn\u2019t sitting next to index.html.</p>'
    + '</div>';
}
