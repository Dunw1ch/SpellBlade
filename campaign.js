/* ============================= CAMPAIGN MODE ============================= */
// This is the foundation of a much larger planned system (Quests, Exploration Locations, Vendors,
// Camps, Roster, Barons — in that rough build order). Everything here is deliberately scoped to
// just: a Campaign Mode tab, a bare-bones Map (a linear Chapter track — a real explorable map
// arrives once Exploration Locations exist to put on it), a Party tab showing the three campaign
// currencies, and Chapter progression capped at 10.
//
// `campaign` is intentionally a SEPARATE top-level object from `list` — `list` is one battle's
// roster/loadout (Faction, Guild, equipped Heroes), built fresh per fight. `campaign` is ongoing
// meta-progress that persists ACROSS many battles. Every later phase (Roster, Quest progress,
// Vendor rep, Camp buildings, Exploration depth) will hang more fields off this same object rather
// than off `list`.
//
// Persistence works exactly like Ruleset/List today — manual Save/Load JSON, since there's no
// account/localStorage layer yet. "Save Campaign" downloads campaign.json; "Load Campaign" reads
// one back in. Nothing here talks to a server; it's the same zero-backend model as the rest of the app.

const CAMPAIGN_MAX_CHAPTER = 10;
let campaign = { chapter: 1, xp: 0, gold: 0, veilShards: 0 };
let campaignTab = 'map'; // 'map' | 'party'

function switchCampaignTab(t){ campaignTab = t; renderCampaign(); }

function renderCampaign(){
  const el = document.getElementById('campaignContent');
  if(!el) return; // defensive — shouldn't happen once index.html's panel/script wiring is in place
  el.innerHTML = '<div class="campaign-tabs">'
      + '<button class="'+(campaignTab==='map'?'active':'')+'" onclick="switchCampaignTab(\'map\')">Map</button>'
      + '<button class="'+(campaignTab==='party'?'active':'')+'" onclick="switchCampaignTab(\'party\')">Party</button>'
    + '</div>'
    + renderCampaignChapterBar()
    + (campaignTab==='party' ? renderCampaignParty() : renderCampaignMap());
}

// Shown above both sub-tabs, since Chapter is relevant regardless of which one you're looking at.
// Chapters run 1-10; advancing past 10 is blocked outright (button disabled) rather than wrapping
// or continuing further, since 10 is the defined end of a campaign for now.
function renderCampaignChapterBar(){
  const atMax = campaign.chapter >= CAMPAIGN_MAX_CHAPTER;
  return '<div class="step step-emphasis" style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">'
    + '<div><span class="step-title">Chapter '+campaign.chapter+'</span><span style="color:var(--muted);font-size:12.5px;margin-left:8px;">of '+CAMPAIGN_MAX_CHAPTER+'</span></div>'
    + '<button class="btn '+(atMax?'ghost':'primary')+' small" '+(atMax?'disabled':'')+' onclick="advanceChapter()" style="margin-left:auto;">'+(atMax?'Campaign Complete':'Advance to Chapter '+(campaign.chapter+1))+'</button>'
    + '</div>';
}
function advanceChapter(){
  if(campaign.chapter >= CAMPAIGN_MAX_CHAPTER) return;
  if(!confirm('Advance to Chapter '+(campaign.chapter+1)+'? This moves the whole campaign forward.')) return;
  campaign.chapter += 1;
  renderCampaign();
}

// A simple linear progress track for now — one node per Chapter, current one highlighted, earlier
// ones marked complete. This is explicitly the "bones" version; a real explorable map (with
// clickable locations) is planned once Exploration Locations exist to actually place on it.
function renderCampaignMap(){
  const nodes = [];
  for(let i=1;i<=CAMPAIGN_MAX_CHAPTER;i++){
    const state = i < campaign.chapter ? 'done' : (i === campaign.chapter ? 'current' : 'future');
    nodes.push('<div class="campaign-map-node campaign-map-node-'+state+'" title="Chapter '+i+'"><span>'+i+'</span></div>');
    if(i < CAMPAIGN_MAX_CHAPTER) nodes.push('<div class="campaign-map-connector"></div>');
  }
  return '<div class="step"><div class="step-head"><span class="step-title">Campaign Map</span></div>'
    + '<div class="step-sub">The full explorable map (locations, encounters, layered exploration) is coming in a later phase — for now, this tracks overall Chapter progress.</div>'
    + '<div class="campaign-map-track">'+nodes.join('')+'</div>'
    + '</div>';
}

function adjustCampaignCurrency(key, delta){
  campaign[key] = Math.max(0, (campaign[key]||0) + delta);
  renderCampaign();
}
function campaignCurrencyRow(label, key, step){
  return '<div class="campaign-currency">'
    + '<div class="campaign-currency-label">'+label+'</div>'
    + '<div class="campaign-currency-value">'+campaign[key]+'</div>'
    + '<div class="campaign-currency-btns">'
      + '<button class="btn ghost small" onclick="adjustCampaignCurrency(\''+key+'\',-'+step+')">\u2212'+step+'</button>'
      + '<button class="btn ghost small" onclick="adjustCampaignCurrency(\''+key+'\','+step+')">+'+step+'</button>'
    + '</div></div>';
}
// Shows the three campaign-wide currencies, plus a quick read-out of whatever List is currently
// being built in List Builder — a first, honest thread connecting Campaign Mode to the rest of the
// app. The deeper connection (pulling Heroes/Hirelings from a persistent camp Roster into a List)
// is explicitly a later phase, not built yet — this just surfaces what's already there today.
function renderCampaignParty(){
  const fac = (typeof getFaction==='function') ? getFaction() : null;
  const heroCount = (typeof list!=='undefined' && list.heroes) ? list.heroes.length : 0;
  const hirelingCount = (typeof list!=='undefined' && list.hirelings) ? list.hirelings.length : 0;
  return '<div class="step"><div class="step-head"><span class="step-title">Party</span></div>'
    + '<div class="step-sub">Campaign-wide currencies — these persist across battles, separate from any single List\u2019s Gold cap or Veil/Valor.</div>'
    + '<div class="campaign-currency-row">'
      + campaignCurrencyRow('XP', 'xp', 10)
      + campaignCurrencyRow('Gold', 'gold', 10)
      + campaignCurrencyRow('Veil Shards', 'veilShards', 1)
    + '</div></div>'
    + '<div class="step"><div class="step-head"><span class="step-title">Active List</span></div>'
    + '<div class="step-sub">The List currently open in List Builder. A proper camp Roster (pulling Heroes/Hirelings from a persistent pool between games) is planned for a later phase.</div>'
    + '<div class="opt-tags">'
      + '<span class="tag">Faction: '+(fac?escapeHtml(fac.name):'None')+'</span>'
      + '<span class="tag">Heroes: '+heroCount+'</span>'
      + '<span class="tag">Hirelings: '+hirelingCount+'</span>'
    + '</div></div>'
    + '<div class="step"><div class="step-head"><span class="step-title">Save / Load Campaign</span></div>'
    + '<div class="step-sub">Same idea as Save/Load Ruleset and Save/Load List — downloads or restores a campaign.json file, since there\u2019s no account system yet to keep this between visits automatically.</div>'
    + '<div class="admin-io">'
      + '<button class="btn primary" onclick="exportCampaign()">Save Campaign</button>'
      + '<label class="btn ghost">Load Campaign<input type="file" accept="application/json" style="display:none;" onchange="importCampaign(this.files[0]); this.value=\'\';"></label>'
    + '</div></div>';
}

function exportCampaign(){
  downloadJSON(campaign, 'campaign.json');
  alert('Saved \u2014 campaign.json downloaded.');
}
function importCampaign(file){
  if(!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try{
      const parsed = JSON.parse(reader.result);
      campaign = {
        chapter: (typeof parsed.chapter==='number' && parsed.chapter>=1 && parsed.chapter<=CAMPAIGN_MAX_CHAPTER) ? Math.round(parsed.chapter) : 1,
        xp: (typeof parsed.xp==='number' && parsed.xp>=0) ? parsed.xp : 0,
        gold: (typeof parsed.gold==='number' && parsed.gold>=0) ? parsed.gold : 0,
        veilShards: (typeof parsed.veilShards==='number' && parsed.veilShards>=0) ? parsed.veilShards : 0,
      };
      renderCampaign();
      alert('Loaded \u2014 campaign progress restored.');
    }catch(err){
      alert('Could not import campaign file: '+err.message);
    }
  };
  reader.readAsText(file);
}
