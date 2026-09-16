/* ============================= RULES TAB ============================= */
// The rules PDF is one fixed file, rules.pdf, sitting next to index.html on GitHub Pages —
// overwrite it with the latest version any time the rules change; the cache-busting query param on
// every fetch below is what guarantees a fresh copy instead of a stale CDN-cached one.
//
// Nothing here runs automatically. Opening this tab does no network activity at all — the PDF is
// only ever fetched when the player actually clicks the Download button.

const RULES_PDF_URL = './rules.pdf';

let rulesDownloadStatus = 'idle'; // 'idle' | 'downloading' | 'error'
let rulesDownloadError = null;

function renderRules(){
  rulesDownloadStatus = 'idle';
  rulesDownloadError = null;
  renderRulesContent();
}

// Fetches the actual PDF bytes and forces a real save via a blob URL, rather than just pointing an
// <a download> at the file directly — a direct link can end up opening in the browser's own PDF
// viewer instead of downloading in some cases, since the `download` attribute isn't always honored
// for a resource the browser recognizes it can preview. Going through fetch()+blob sidesteps that:
// the browser only ever sees an anonymous binary blob, with no PDF-preview behavior to kick in.
async function downloadRulesPdf(){
  rulesDownloadStatus = 'downloading';
  rulesDownloadError = null;
  renderRulesContent();
  try{
    const resp = await fetch(RULES_PDF_URL+'?t='+Date.now(), { cache:'reload' });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    const blob = await resp.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = 'rules.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
    rulesDownloadStatus = 'idle';
  }catch(err){
    rulesDownloadStatus = 'error';
    rulesDownloadError = 'Could not download rules.pdf ('+err.message+').';
  }
  renderRulesContent();
}

function renderRulesContent(){
  const el = document.getElementById('rulesContent');
  if(!el) return;
  const downloading = rulesDownloadStatus === 'downloading';
  let html = '<div class="step step-emphasis"><div class="step-head"><span class="step-title">Rules</span></div>'
    + '<div class="step-sub">Click below to download the current rules PDF.</div>'
    + '<button class="btn primary" onclick="downloadRulesPdf()" '+(downloading?'disabled':'')+'>'
      + (downloading ? 'Downloading\u2026' : '&#128190; Download Rules PDF')
    + '</button>';
  if(rulesDownloadStatus==='error'){
    html += '<p class="empty-note" style="margin-top:10px;">'+escapeHtml(rulesDownloadError)+' Make sure rules.pdf has been uploaded to the repo, next to index.html.</p>'
      + '<button class="btn ghost small" onclick="downloadRulesPdf()">Try Again</button>';
  }
  html += '</div>';
  el.innerHTML = html;
}
