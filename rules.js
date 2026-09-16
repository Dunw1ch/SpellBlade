/* ============================= RULES TAB ============================= */
// The rules PDF is just one fixed file, rules.pdf, sitting next to index.html on GitHub Pages —
// overwrite it with the latest version any time the rules change. No separate version file to
// remember to update; the cache-busting query param below is what guarantees a fresh copy instead.

const RULES_PDF_URL = './rules.pdf';

let rulesLoadError = null;
let rulesReady = false;
let rulesAutoDownloadedThisSession = false; // in-memory only — resets on reload, so a fresh visit always re-checks/re-downloads once, but re-opening the tab repeatedly in one sitting doesn't spam it

function renderRules(){
  const el = document.getElementById('rulesContent');
  if(!el) return;
  checkRulesAvailable().then(() => renderRulesContent());
  renderRulesContent(); // show a loading state immediately, filled in once the check above resolves
}

// A HEAD request just confirms rules.pdf actually exists and is reachable before doing anything
// else — cheap (no body downloaded), and means a missing/not-yet-uploaded file shows a clear
// in-app message instead of a download that silently fails with no explanation.
async function checkRulesAvailable(){
  rulesLoadError = null;
  try{
    const resp = await fetch(RULES_PDF_URL+'?t='+Date.now(), { method:'HEAD', cache:'reload' });
    if(!resp.ok) throw new Error('HTTP '+resp.status);
    rulesReady = true;
    if(!rulesAutoDownloadedThisSession){
      downloadRulesPdf();
      rulesAutoDownloadedThisSession = true;
    }
  }catch(err){
    rulesReady = false;
    rulesLoadError = 'Could not find rules.pdf ('+err.message+').';
  }
}

// The actual download trigger — a plain <a download> click, same mechanism browsers use for any
// normal file-download link. Also used by the manual "Download Rules PDF" button, so there's only
// one place that actually knows how to fetch/save the file. The cache-busting query param matters
// here too — without it, a browser that already cached an older rules.pdf could hand back stale
// content instead of re-fetching what's actually live now.
function downloadRulesPdf(){
  const a = document.createElement('a');
  a.href = RULES_PDF_URL+'?t='+Date.now();
  a.download = 'rules.pdf';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

function renderRulesContent(){
  const el = document.getElementById('rulesContent');
  if(!el) return;
  let html = '<div class="step step-emphasis"><div class="step-head"><span class="step-title">Rules</span></div>';
  if(!rulesReady && !rulesLoadError){
    html += '<p class="empty-note">Checking for the rules PDF&hellip;</p>';
  } else if(rulesLoadError){
    html += '<p class="empty-note">'+escapeHtml(rulesLoadError)+' Make sure rules.pdf has been uploaded to the repo, next to index.html.</p>'
      + '<button class="btn ghost small" onclick="renderRules()">Try Again</button>';
  } else if(rulesReady){
    html += '<div class="step-sub">The rules PDF downloads automatically the first time you open this tab each visit. Use the button below any time to grab it again.</div>'
      + '<button class="btn primary" onclick="downloadRulesPdf()">&#128190; Download Rules PDF</button>';
  }
  html += '</div>';
  el.innerHTML = html;
}
