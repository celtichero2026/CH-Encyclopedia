(() => {
  const data=window.LOOT_DATA, mobs=data.mobs, items=data.items;
  const mobStats=Array.isArray(window.MOB_STATS)?window.MOB_STATS:[];
  const mobById=new Map(mobs.map(x=>[x.id,x])), itemById=new Map(items.map(x=>[x.id,x]));
  const mobStatsById=new Map(mobStats.map(x=>[x.id,x]));
  const $=id=>document.getElementById(id);
  let selected=null,currentResults=[],currentMode="browse";
  const FAVORITES_KEY="celticHeroesLootExplorerFavoritesV1";
  let favorites=new Set();
  try{
    const saved=JSON.parse(localStorage.getItem(FAVORITES_KEY)||"[]");
    if(Array.isArray(saved)) favorites=new Set(saved.map(String));
  }catch(_){ favorites=new Set(); }

  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));
  const norm=s=>String(s||"").toLowerCase().trim();
  const cleanZoneName=z=>{
    const s=String(z||"").trim().replace(/~\d+$/,"").trim();
    return /^unknown$/i.test(s)?"":s;
  };
  const cleanZones=arr=>[...new Set((arr||[]).map(cleanZoneName).filter(Boolean))];
  const zoneText=m=>{const z=cleanZones(m.zones);return z.length?z.join(", "):"Unknown zone";};
  const favKey=(kind,id)=>`${kind}:${id}`;
  const isFavorite=(kind,id)=>favorites.has(favKey(kind,id));
  function saveFavorites(){
    try{localStorage.setItem(FAVORITES_KEY,JSON.stringify([...favorites]));}catch(_){}

    updateFavoriteCount();
  }
  function updateFavoriteCount(){
    if($("favoriteCount")) $("favoriteCount").textContent=favorites.size;
  }
  function toggleFavorite(kind,id){
    const key=favKey(kind,id);
    favorites.has(key)?favorites.delete(key):favorites.add(key);
    saveFavorites();
    if(currentMode==="browse") renderResults(currentFilters().q);
    if(currentMode==="favorites") renderFavorites();
    refreshFavoriteButtons(kind,id);
  }
  function refreshFavoriteButtons(kind,id){
    const active=isFavorite(kind,id);
    document.querySelectorAll(`[data-favorite-kind="${kind}"][data-favorite-id="${id}"]`).forEach(b=>{
      b.classList.toggle("active",active);
      b.setAttribute("aria-pressed",active?"true":"false");
      const text=b.querySelector(".favorite-text");
      if(text) text.textContent=active?"Saved":"Save";
      const star=b.querySelector(".favorite-star");
      if(star) star.textContent=active?"★":"☆";
    });
  }
  function favoriteButton(kind,id,compact=false){
    const active=isFavorite(kind,id);
    return `<button type="button" class="favorite-btn ${compact?"compact":""} ${active?"active":""}" data-favorite-kind="${kind}" data-favorite-id="${id}" aria-pressed="${active?"true":"false"}" title="${active?"Remove from favorites":"Add to favorites"}">
      <span class="favorite-star">${active?"★":"☆"}</span>${compact?"":` <span class="favorite-text">${active?"Saved":"Save"}</span>`}
    </button>`;
  }

  $("datasetStat").textContent=`${items.length.toLocaleString()} items • ${mobs.length.toLocaleString()} loot mobs • ${mobStats.length.toLocaleString()} stat records`;

  const zones=cleanZones(mobs.flatMap(m=>m.zones||[])).sort((a,b)=>a.localeCompare(b));
  $("zoneFilter").insertAdjacentHTML("beforeend",zones.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join(""));
  const slots=[...new Set(items.map(i=>i.stats?.slot).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  $("slotFilter").insertAdjacentHTML("beforeend",slots.map(s=>`<option>${esc(s)}</option>`).join(""));

  const featured=["Bloodthorn","Mordris","Necromancer","Dhiothu","Gelebron"];
  $("featuredChips").innerHTML=featured.map(x=>`<button class="chip" type="button">${x}</button>`).join("");
  $("featuredChips").addEventListener("click",e=>{
    if(!e.target.matches(".chip"))return;
    $("searchInput").value=e.target.textContent;runSearch();
  });
  $("clearBtn").addEventListener("click",()=>{["searchInput","sourceFilter","classFilter","slotFilter","levelFilter","zoneFilter"].forEach(id=>$(id).value="");$("typeFilter").value="all";selected=null;runSearch();resetDetail()});


  const guideDefs=[
    {id:"warden",icon:"🛡️",title:"Warden",sub:"Stonevale discs • Lv 50–75 • 5 class sets"},
    {id:"meteoric",icon:"☄️",title:"Meteoric",sub:"Remnants & tablets • Lv 80–105 • 5 class sets"},
    {id:"frozen",icon:"❄️",title:"Frozen Meteoric",sub:"Crests & Frostweaving • Lv 110–135 • 5 upgraded sets"},
    {id:"dragonlord",icon:"🐉",title:"Dragonlord",sub:"Class-coloured quest items • Lv 150–175 • armour + main/offhand"},
    {id:"edl",icon:"✨",title:"Exalted Dragonlord",sub:"EDL upgrades • armour + mainhand + offhand + set bonus"},
    {id:"dochgul",icon:"🜂",title:"Doch Gul",sub:"Two paths • Pure + class Confluxes OR Daily Shards • 5-piece sets"}
  ];

  function setMode(mode){
    currentMode=mode;
    const browse=mode==="browse", mobstats=mode==="mobstats", guides=mode==="guides", favs=mode==="favorites";
    $("browseTab").classList.toggle("active",browse);
    $("mobStatsTab").classList.toggle("active",mobstats);
    $("guidesTab").classList.toggle("active",guides);
    $("favoritesTab").classList.toggle("active",favs);
    $("searchPanel").hidden=!browse;
    $("browseLayout").hidden=!browse;
    $("mobStatsLayout").hidden=!mobstats;
    $("guidesLayout").hidden=!guides;
    $("favoritesLayout").hidden=!favs;
    if(mobstats)renderMobStatsResults();
    if(guides)renderGuideList();
    if(favs)renderFavorites();
  }

  function renderGuideList(){
    $("guideCount").textContent=`${guideDefs.length} guides`;
    $("guideList").innerHTML=guideDefs.map(g=>`
      <button type="button" class="guide-card" data-guide="${g.id}">
        <div class="guide-card-title"><span class="guide-icon">${g.icon}</span>${esc(g.title)}</div>
        <div class="guide-card-sub">${esc(g.sub)}</div>
      </button>`).join("");
  }

  let activeGuideId=null;
  function openGuide(id){
    activeGuideId=id;
    document.querySelectorAll(".guide-card").forEach(b=>b.classList.toggle("active",b.dataset.guide===id));
    if(id==="warden")renderWardenGuide("guideDetail");
    if(id==="meteoric")renderMeteoricGuide("guideDetail");
    if(id==="frozen")renderFrozenGuide("guideDetail");
    if(id==="dragonlord")renderDragonlordGuide("guideDetail");
    if(id==="edl")renderEDLGuide("guideDetail");
    if(id==="dochgul")renderDochGulGuide("guideDetail");
  }

  $("browseTab").addEventListener("click",()=>setMode("browse"));
  $("mobStatsTab").addEventListener("click",()=>setMode("mobstats"));
  $("guidesTab").addEventListener("click",()=>setMode("guides"));
  $("favoritesTab").addEventListener("click",()=>setMode("favorites"));
  $("guideList").addEventListener("click",e=>{
    const b=e.target.closest(".guide-card");
    if(b)openGuide(b.dataset.guide);
  });

  $("guideDetail").addEventListener("click",e=>{
    const back=e.target.closest(".back-guide-btn");
    if(back){
      openGuide(back.dataset.guide||activeGuideId);
      return;
    }

    const link=e.target.closest(".entity-link");
    if(!link)return;
    const kind=link.dataset.kind;
    const id=Number(link.dataset.id);
    if(!kind||!Number.isFinite(id))return;

    // Keep guide navigation inside the Quest Guides detail panel so
    // "View set", individual set pieces, and related guide items work
    // without kicking the user over to the main Items & Loot page.
    openEntity(kind,id,"guideDetail");
  });

  function currentFilters(){
    return {q:norm($("searchInput").value),type:$("typeFilter").value,source:$("sourceFilter").value,cls:$("classFilter").value,slot:$("slotFilter").value,level:Number($("levelFilter").value||0),zone:$("zoneFilter").value};
  }
  function isSetBonusItem(i){
    return !!(i?.wardenSetBonus||i?.meteoricSetBonus||i?.frozenSetBonus||i?.dragonlordSetBonus||i?.edlSetBonus||i?.dochgulSetBonus);
  }

  function itemMatches(i,f){
    if(isSetBonusItem(i))return false;
    if(f.q && !norm(i.name).includes(f.q))return false;
    if(f.source && i.sourceType!==f.source)return false;
    if(f.cls && i.stats?.classReq && i.stats.classReq!==f.cls)return false; // unrestricted items remain
    if(f.slot && i.stats?.slot!==f.slot)return false;
    if(f.level && (i.stats?.levelReq||0)<f.level)return false;
    if(f.zone && !i.mobs.some(mid=>cleanZones(mobById.get(mid)?.zones||[]).includes(f.zone)))return false;
    return true;
  }
  function mobHasMatchingDrop(m,f){
    if(f.zone && !cleanZones(m.zones||[]).includes(f.zone))return false;

    // Do not require a loot-table match just to make a mob visible.
    // This keeps the full mob database searchable/browsable, including mobs
    // with no mapped drops. Only item-specific filters should constrain mobs
    // by their loot.
    const hasItemFilters=!!(f.cls || f.slot || f.level);
    if(!hasItemFilters)return true;

    return (m.drops||[]).some(d=>{
      const i=itemById.get(d.itemId);
      if(!i)return false;
      const ff={...f,q:"",zone:"",source:""};
      return itemMatches(i,ff);
    });
  }

  function runSearch(){
    const f=currentFilters();let out=[];
    if(f.type!=="mobs"){
      for(const i of items){
        if(!itemMatches(i,f))continue;
        const sourceLabel=i.sourceType==="mob"?`Dropped by ${i.mobs.length}`:(i.sourceType==="questline"?"Curated questline":"Non-mob item");
        out.push({kind:"item",id:i.id,name:i.name,sub:[i.stats?.slot,i.stats?.classReq,i.stats?.levelReq?`Lv ${i.stats.levelReq}`:null,sourceLabel].filter(Boolean).join(" • "),rarity:i.rarity});
        if(out.length>=180)break;
      }
    }
    if(f.type!=="items"&&(!f.source||f.source==="mob")){
      const room=Math.max(0,180-out.length);
      if(room>0){
        let added=0;
        for(const m of mobs){
          if(f.q && !norm(m.name).includes(f.q) && String(m.id)!==f.q)continue;
          if(!mobHasMatchingDrop(m,f))continue;
          const ms=mobStatsById.get(m.id);
          const level=ms?.level ?? m.level ?? "?";
          const stars=(ms?.stars>=1 && ms?.stars<=6)?` • ${ms.stars}★`:"";
          const dropCount=(m.drops||[]).length;
          out.push({kind:"mob",id:m.id,name:m.name,sub:`Level ${level}${stars} • ${dropCount} drop${dropCount===1?"":"s"} • ${zoneText(m)}`});
          added++;
          if(added>=room)break;
        }
      }
    }
    out.sort((a,b)=>{const aq=norm(a.name),bq=norm(b.name),ap=f.q&&aq.startsWith(f.q)?0:1,bp=f.q&&bq.startsWith(f.q)?0:1;return ap-bp||aq.localeCompare(bq)});
    currentResults=out;renderResults(f.q);
  }

  function renderResults(q){
    $("resultsTitle").textContent=q?"Search results":"Browse";
    const f=currentFilters();
    if(f.type==="mobs" && !f.q && !f.cls && !f.slot && !f.level && !f.zone && (!f.source||f.source==="mob")){
      $("resultCount").textContent=`${mobs.length.toLocaleString()} mobs • first ${currentResults.length.toLocaleString()} shown`;
    }else{
      $("resultCount").textContent=`${currentResults.length}${currentResults.length===180?"+":""} shown`;
    }
    if(!currentResults.length){$("results").innerHTML=`<div class="empty-detail" style="padding:55px 15px"><h2>No matches</h2><p>Try clearing a filter or shortening the search.</p></div>`;return}
    $("results").innerHTML=currentResults.map(r=>`<div class="result-wrap ${selected&&selected.kind===r.kind&&selected.id===r.id?"active":""}">
      <button class="result" type="button" data-kind="${r.kind}" data-id="${r.id}">
        <div class="result-top"><span class="result-name">${esc(r.name)}</span><span>${r.rarity?`<span class="badge rarity">${esc(r.rarity)}</span> `:""}<span class="badge ${r.kind}">${r.kind==="item"?"ITEM":"MOB"}</span></span></div>
        <div class="result-sub">${esc(r.sub)}</div>
      </button>
      ${favoriteButton(r.kind,r.id,true)}
    </div>`).join("");
  }
  $("results").addEventListener("click",e=>{
    const fav=e.target.closest(".favorite-btn");
    if(fav){e.stopPropagation();toggleFavorite(fav.dataset.favoriteKind,Number(fav.dataset.favoriteId));return;}
    const b=e.target.closest(".result");if(b)openEntity(b.dataset.kind,Number(b.dataset.id));
  });






  function renderDochGulGuide(targetId="guideDetail"){
    const q=data.questlines?.dochgul;if(!q)return;

    const setRows=Object.entries(q.setGroups||{}).map(([cls,g])=>{
      const first=(g.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
      return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
        <div class="link-main"><span>${esc(cls)} • ${esc(g.name||"Doch Gul")}</span><span>View set</span></div>
        <div class="link-sub">${esc(g.conflux)} • 5 armour pieces • set bonus</div>
      </button>`:"";
    }).join("") + (q.variants||[]).map(v=>{
      const first=(v.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
      return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
        <div class="link-main"><span>${esc(v.class)} • ${esc(v.name)}</span><span>View set</span></div>
        <div class="link-sub">${esc(v.conflux)} • alternate Warrior set • same acquisition limits</div>
      </button>`:"";
    }).join("");

    const reqRows=Object.entries(q.pieces).map(([slot,p])=>
      `<div class="quest-req"><strong>${esc(p.label)}</strong><br>
        <span class="method-label">Conflux method:</span> ${p.pure} Pure Conflux + ${p.conflux} class Conflux${p.conflux===1?"":"es"}<br>
        <span class="method-label">Daily Shards:</span> ${p.shards} Shards
      </div>`).join("");

    const confluxTotals=Object.entries(q.totals?.confluxMethod||{}).map(([name,val])=>
      `<div class="stat-row"><span>${esc(name)}</span><strong>${val}</strong></div>`).join("");
    const shardTotals=Object.entries(q.totals?.dailyShardMethod||{}).map(([name,val])=>
      `<div class="stat-row"><span>${esc(name)}</span><strong>${val}</strong></div>`).join("");

    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">🜂 Doch Gul</h2>
      <p class="description">${esc(q.summary)}</p>

      <div class="section-title">Class Confluxes</div>
      <div class="link-list">${setRows}</div>

      <div class="section-title">Two ways to obtain each piece</div>
      <div class="quest-summary">${reqRows}</div>

      <div class="section-title">Full armour total — Conflux method</div>
      <div class="stat-grid">${confluxTotals}</div>
      <div class="notice">Pure Conflux is shared by every class. The 19 class Confluxes must be the type for your class.</div>

      <div class="section-title">Daily Shards</div>
      <div class="stat-grid">${shardTotals}</div>
      <div class="notice"><strong>Shard cap: 200.</strong> A full Doch Gul armor set would cost 305 Shards, so the set cannot be completed through Daily Shards alone. Shards can cover only part of the set; the remaining pieces must come through the Conflux method.</div>
      <div class="notice">Both methods lead to the same Doch Gul armour pieces; they are alternative acquisition paths, not different versions of the armour.</div>`;
  }

  function renderEDLGuide(targetId="guideDetail"){
    const q=data.questlines?.edl;if(!q)return;

    const setRows=Object.entries(q.setGroups||{}).map(([cls,g])=>{
      const first=(g.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
      return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
        <div class="link-main"><span>${esc(cls)}</span><span>View set</span></div>
        <div class="link-sub">${esc(q.classColors?.[cls]||"Class-colour")} materials • Set bonus • 5 armour • mainhand • offhand</div>
      </button>`:"";
    }).join("");

    const reqRows=Object.entries(q.pieces).map(([key,p])=>
      `<div class="quest-req"><strong>${esc(p.label)}</strong><br>
      ${p.req.map(([mat,n])=>`${n} class-colour ${esc(mat)}`).join("<br>")}</div>`).join("");

    const colorRows=Object.entries(q.classColors||{}).map(([cls,color])=>
      `<div class="stat-row class-colour-row"><span>${esc(cls)}</span><strong class="class-colour class-colour-${norm(color)}">${esc(color)}</strong></div>`).join("");

    const totalRows=obj=>Object.entries(obj||{}).map(([name,val])=>
      `<div class="stat-row"><span>${esc(name)}</span><strong>${val}</strong></div>`).join("");

    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">✨ Exalted Dragonlord</h2>
      <p class="description">${esc(q.summary)}</p>

      <div class="section-title">Class sets</div>
      <div class="link-list">${setRows}</div>

      <div class="section-title">Class material colours</div>
      <div class="stat-grid">${colorRows}</div>

      <div class="section-title">Piece requirements</div>
      <div class="quest-summary">${reqRows}</div>

      <div class="section-title">Armor material totals</div>
      <div class="stat-grid">${totalRows(q.totals?.armor)}</div>

      <div class="section-title">Weapon material totals</div>
      <div class="stat-grid">${totalRows(q.totals?.weapons)}</div>

      <div class="section-title">Full EDL totals</div>
      <div class="stat-grid">${totalRows(q.totals?.all)}</div>`;
  }

  function renderDragonlordGuide(targetId="guideDetail"){
    const q=data.questlines?.dragonlord;if(!q)return;

    const setRows=Object.entries(q.setGroups||{}).map(([cls,g])=>{
      const first=(g.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
      return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
        <div class="link-main"><span>${esc(cls)}</span><span>View set</span></div>
        <div class="link-sub">${esc(g.color)} quest items • 5 armour + mainhand + offhand</div>
      </button>`:"";
    }).join("");

    const reqRows=Object.entries(q.pieces).map(([key,p])=>
      `<div class="quest-req"><strong>${esc(p.label)} • Lv ${p.level}</strong><br>
      ${p.req.map(([mat,n])=>`${n} class-colour ${esc(mat)}`).join("<br>")}
      ${p.note?`<br><span class="muted">${esc(p.note)}</span>`:""}</div>`).join("");

    const bossRows=q.bosses.map(([boss,lvl,drops])=>
      `<div class="quest-req"><strong>${esc(boss)} • Lv ${lvl}</strong><br>${drops.map(x=>esc(x)).join(" • ")}</div>`).join("");

    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">🐉 Dragonlord</h2>
      <p class="description">${esc(q.summary)}</p>

      <div class="section-title">Class sets</div>
      <div class="link-list">${setRows}</div>

      <div class="section-title">Piece requirements</div>
      <div class="quest-summary">${reqRows}</div>

      <div class="section-title">Bosses that drop Dragonlord items</div>
      <div class="quest-summary">${bossRows}</div>

      <div class="notice">Class colours: Warrior red, Druid green, Mage blue, Ranger yellow, Rogue purple.</div>`;
  }

  function renderFrozenGuide(targetId="guideDetail"){
    const q=data.questlines?.frozen;if(!q)return;
    const setRows=Object.entries(q.setGroups||{}).map(([cls,g])=>{
      const first=(g.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
      return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
        <div class="link-main"><span>${esc(cls)} • ${esc(g.name)}</span><span>View set</span></div>
        <div class="link-sub">${esc(g.color)} crests • set bonus + 6 upgraded pieces</div>
      </button>`:"";
    }).join("");

    const reqRows=Object.entries(q.pieces).map(([slot,p])=>
      `<div class="quest-req"><strong>${esc(p.label)} • Lv ${p.level}</strong><br>
      2 class-colour ${esc(p.crest)} Crests<br>${p.orbs} Orbs of Frostweaving</div>`).join("");

    const bossRows=q.bosses.map(([boss,lvl,crests])=>
      `<div class="quest-req"><strong>${esc(boss)} • Lv ${lvl}</strong><br>${crests.map(x=>`${esc(x)} Crest`).join(" • ")}</div>`).join("");

    const totals=Object.entries(q.totals).map(([n,v])=>`<div class="stat-row"><span>${esc(n)}</span><strong>${v}</strong></div>`).join("");

    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">❄️ Frozen Meteoric Upgrade</h2>
      <p class="description">${esc(q.summary)}</p>

      <div class="section-title">Class sets</div>
      <div class="link-list">${setRows}</div>

      <div class="section-title">Upgrade requirements</div>
      <div class="quest-summary">${reqRows}</div>

      <div class="section-title">Crest bosses</div>
      <div class="quest-summary">${bossRows}</div>

      <div class="section-title">Total for full set + weapon</div>
      <div class="stat-grid">${totals}</div>

      <div class="notice">Crest type is shared by slot, while crest colour is class-specific: Warrior red, Druid green, Mage blue, Ranger yellow, Rogue purple.</div>`;
  }

  function renderWardenGuide(targetId="detailPanel"){
    if(targetId==="detailPanel"){selected=null;renderResults(norm($("searchInput").value));}
    const q=data.questlines?.warden;if(!q)return;
    const setRows=Object.entries(q.setGroups||{}).map(([cls,g])=>{
      const bonus=itemById.get(g.bonusItemId);
      return `<button type="button" class="link-btn entity-link" data-kind="item" data-id="${g.bonusItemId}">
        <div class="link-main"><span>${esc(cls)} • ${esc(g.name)}</span><span>View set</span></div>
        <div class="link-sub">${bonus?esc(bonus.name):"Warden set bonus"}</div>
      </button>`;
    }).join("");
    const pieceRows=Object.entries(q.pieces).map(([slot,p])=>
      `<div class="quest-req"><strong>${esc(slot)} • Lv ${p.level}</strong><br>${
        p.req.map(([disc,n])=>`${n} ${esc(disc)} Disc${n===1?"":"s"}`).join("<br>")
      }</div>`).join("");
    const bossRows=q.bosses.map(([boss,discs])=>
      `<div class="quest-req"><strong>${esc(boss)}</strong><br>${discs.map(x=>`${esc(x)} Disc`).join(" • ")}</div>`).join("");

    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">🛡️ Warden Armour & Weapon Guide</h2>
      <p class="description">${esc(q.note)}</p>
      <div class="section-title">Class armour sets</div>
      <div class="link-list">${setRows}</div>
      <div class="section-title">Disc requirements</div>
      <div class="quest-summary">${pieceRows}</div>
      <div class="section-title">Stonevale bosses</div>
      <div class="quest-summary">${bossRows}</div>`;
  }

  function renderMeteoricGuide(targetId="detailPanel"){
    if(targetId==="detailPanel"){selected=null;renderResults(norm($("searchInput").value));}
    const q=data.questlines?.meteoric;if(!q)return;
    const armorRows=Object.entries(q.armorPieces).map(([slot,p])=>`
      <div class="quest-req"><strong>${esc(slot)} • Lv ${p.level}</strong><br>
      3 class-color Remnants of ${esc(p.remnant)}<br>
      3 ${esc(p.tablet)} Tablets of class material<br>
      ${esc(p.crystal)} Meteoric Crystal</div>`).join("");
    const classes=Object.entries(q.classMaterials).map(([cls,c])=>`
      <div class="stat-row"><span>${esc(cls)}</span><strong>${esc(c.color)} • ${esc(c.tablet)}</strong></div>`).join("");
    const bossSections=Object.entries(q.armorBosses).map(([title,rows])=>`
      <div class="stat-group-title">${esc(title)}</div>
      <div class="link-list">${rows.map(r=>`<div class="quest-req"><strong>${esc(r[0])} • Lv ${r[1]}</strong><br>${esc(r[2])}</div>`).join("")}</div>`).join("");
    $(targetId).innerHTML=`
      <div class="detail-kicker">Curated Questline</div>
      <h2 class="detail-title">☄️ Meteoric Crafting Guide</h2>
      <p class="description">This is the first manually curated questline layer. It sits alongside the raw item and mob-drop database.</p>
      <div class="section-title">Class sets</div>
      <div class="link-list">${Object.entries(q.setGroups||{}).map(([cls,g])=>{
        const first=(g.pieceItemIds||[]).map(id=>itemById.get(id)).find(Boolean);
        return first?`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${first.id}">
          <div class="link-main"><span>${esc(cls)} • ${esc(g.name)}</span><span>View set</span></div>
          <div class="link-sub">${g.bonusItemId?"Set bonus + ":""}${g.pieceItemIds.length} pieces</div>
        </button>`:"";
      }).join("")}</div>
      <div class="section-title">Class materials</div><div class="stat-grid">${classes}</div>
      <div class="section-title">Armor requirements</div><div class="quest-summary">${armorRows}</div>
      <div class="section-title">Where materials drop</div>${bossSections}
      <div class="section-title">Meteoric weapon quest</div>
      <div class="source-card"><div class="source-title">Lv ${q.weapon.level} • Requires ${esc(q.weapon.requirement)}</div>
        <ol class="quest-steps">${q.weapon.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
      </div>
      <div class="notice">The supplied guide is linked only to the five base Meteoric weapons. Later upgrades such as Frozen Meteoric are separate quest stages and are intentionally not assigned this source. Until those item IDs are mapped with confidence, the armor recipe stays in this questline guide rather than being attached to the wrong equipment records.</div>`;
  }

  function openEntity(kind,id,targetId="detailPanel"){
    selected={kind,id};
    if(targetId==="detailPanel") renderResults(norm($("searchInput").value));
    kind==="item" ? renderItem(itemById.get(id),targetId) : renderMob(mobById.get(id),targetId);
  }

  function renderStatGroup(title,rows,skill=false){
    if(!rows||!rows.length)return "";
    return `<div class="stat-group-title">${esc(title)}</div><div class="stat-grid">${rows.map(([n,v])=>`<div class="stat-row ${skill?"skill":""}"><span>${esc(n)}</span><strong>+${Number(v).toLocaleString()}</strong></div>`).join("")}</div>`;
  }
  function renderStats(s){
    if(!s)return "";
    let h=`<div class="section-title">Stats</div>`;
    const core=[];if(s.armour)core.push(["Armour",s.armour]);
    h+=renderStatGroup("Attributes",[...(s.attributes||[]),...core]);
    h+=renderStatGroup("Abilities",s.abilities||[]);
    h+=renderStatGroup("Resistances",(s.resists||[]).map(x=>[`Resist ${x[0]}`,x[1]]));
    h+=renderStatGroup("Evasions",s.evasions||[]);
    h+=renderStatGroup("Skill bonuses",(s.skillBonuses||[]).map(x=>[x[0],x[1]]),true);
    if(s.weight)h+=renderStatGroup("Other",[["Weight",s.weight]]);
    return h;
  }

  function relatedItems(item){
    if(!item.familyKey)return[];
    return items.filter(x=>x.id!==item.id&&x.familyKey===item.familyKey).sort((a,b)=>(a.stats?.levelReq||0)-(b.stats?.levelReq||0)).slice(0,12);
  }


  function renderWardenSetPanel(cls, selectedId){
    const q=data.questlines?.warden;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=itemById.get(g.bonusItemId);
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const armor=pieces.filter(x=>x.stats?.slot!=="Weapon");
    const weapons=pieces.filter(x=>x.stats?.slot==="Weapon");
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Warden set</div>
      <div class="source-card">
        <div class="source-title">${esc(g.name)} • ${esc(cls)}</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${armor.map(row).join("")}</div>
        ${weapons.length?`<div class="stat-group-title">Weapon</div><div class="link-list">${weapons.map(row).join("")}</div>`:""}
      </div>`;
  }


  function renderMeteoricSetPanel(cls, selectedId){
    const q=data.questlines?.meteoric;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=g.bonusItemId?itemById.get(g.bonusItemId):null;
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const armor=pieces.filter(x=>x.stats?.slot!=="Weapon");
    const weapons=pieces.filter(x=>x.stats?.slot==="Weapon");
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Meteoric set</div>
      <div class="source-card">
        <div class="source-title">${esc(g.name)} • ${esc(cls)}</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${armor.map(row).join("")}</div>
        ${weapons.length?`<div class="stat-group-title">Weapon</div><div class="link-list">${weapons.map(row).join("")}</div>`:""}
      </div>`;
  }


  function renderFrozenSetPanel(cls, selectedId){
    const q=data.questlines?.frozen;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=itemById.get(g.bonusItemId);
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const armor=pieces.filter(x=>x.stats?.slot!=="Weapon");
    const weapons=pieces.filter(x=>x.stats?.slot==="Weapon");
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Frozen set</div>
      <div class="source-card">
        <div class="source-title">${esc(g.name)} • ${esc(cls)}</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${armor.map(row).join("")}</div>
        ${weapons.length?`<div class="stat-group-title">Weapon</div><div class="link-list">${weapons.map(row).join("")}</div>`:""}
      </div>`;
  }






  function renderFortitudeSetBonusInfo(){
    const edl=data.setBonusInfo?.edl;
    const fort=data.setBonusInfo?.dochgul?.fortitudeAura;
    if(!edl||!fort)return "";

    const inheritedStats=(edl.stats||[]).map(([name,val])=>
      `<div class="stat-row"><span>${esc(name)}</span><strong>+${val}</strong></div>`).join("");

    const blessing=(edl.effects||[]).map(e=>
      `<div class="effect-block"><div class="effect-name">${esc(e.name)}</div><div class="muted">${esc(e.description)}</div></div>`).join("");

    const fortRows=(fort.stats||[]).map(([skill,val,type])=>
      `<div class="stat-row"><span>${esc(skill)}</span><strong>+${val}${type==="healing"?" healing":""}</strong></div>`).join("");

    return `<div class="set-effect-box">
      <div class="set-effect-title">Doch Gul of Fortitude Set Effects</div>

      <div class="set-effect-sub">Keeps the Exalted Dragonlord set effects:</div>
      <div class="effect-block inherited-effect-block">
        <div class="effect-name">Exalted Aura</div>
        <div class="stat-grid">${inheritedStats}</div>
      </div>

      ${blessing}

      <div class="set-effect-sub" style="margin-top:12px">Adds:</div>
      <div class="effect-block dochgul-class-aura">
        <div class="effect-name">${esc(fort.title)}</div>
        <div class="stat-grid">${fortRows}</div>
      </div>
    </div>`;
  }

  function renderSetBonusInfo(type, cls){
    const info=data.setBonusInfo?.[type];
    if(!info)return "";

    if(type==="dochgul"){
      const edl=data.setBonusInfo?.edl;
      const inheritedStats=(edl?.stats||[]).map(([name,val])=>
        `<div class="stat-row"><span>${esc(name)}</span><strong>+${val}</strong></div>`).join("");
      const blessing=(edl?.effects||[]).map(e=>
        `<div class="effect-block"><div class="effect-name">${esc(e.name)}</div><div class="muted">${esc(e.description)}</div></div>`).join("");

      return `<div class="set-effect-box">
        <div class="set-effect-title">${esc(info.title)}</div>

        <div class="set-effect-sub">Keeps the Exalted Dragonlord set effects:</div>

        <div class="effect-block inherited-effect-block">
          <div class="effect-name">Exalted Aura</div>
          <div class="stat-grid">${inheritedStats}</div>
        </div>

        ${blessing}

        <div class="set-effect-sub" style="margin-top:12px">Adds:</div>
        <div class="effect-block dochgul-class-aura">
          <div class="effect-name">Doch Gul ${esc(cls||"Class")} Aura</div>
          <div class="stat-grid">${
            (info.classAuras?.[cls]||[]).map(([skill,val,type])=>
              `<div class="stat-row"><span>${esc(skill)}</span><strong>+${val} ${esc(type)}</strong></div>`
            ).join("")
          }</div>
        </div>
      </div>`;
    }

    const stats=(info.stats||[]).map(([name,val])=>
      `<div class="stat-row"><span>${esc(name)}</span><strong>+${val}</strong></div>`).join("");
    const effects=(info.effects||[]).map(e=>
      `<div class="effect-block"><div class="effect-name">${esc(e.name)}</div><div class="muted">${esc(e.description)}</div></div>`).join("");

    return `<div class="set-effect-box">
      <div class="set-effect-title">${esc(info.title)}</div>
      <div class="stat-grid">${stats}</div>
      ${effects}
    </div>`;
  }


  function renderDochGulVariantPanel(variantId, selectedId){
    const q=data.questlines?.dochgul;
    const v=(q?.variants||[]).find(x=>x.id===variantId);
    if(!v)return "";
    const pieces=(v.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.id===selectedId?"Viewing":"View stats"}</div>
    </button>`;
    return `<div class="section-title">Doch Gul of Fortitude</div>
      <div class="source-card">
        <div class="source-title">Warrior • ${esc(v.conflux)}</div>
        <div class="muted" style="margin:0 0 10px">Alternate Warrior Doch Gul set. Uses the same Pure Conflux + Conflux of Legends requirements and the same Daily Shard costs and 200-shard cap.</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${pieces.map(row).join("")}</div>
      </div>`;
  }

  function renderDochGulSetPanel(cls, selectedId){
    const q=data.questlines?.dochgul;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=g.bonusItemId?itemById.get(g.bonusItemId):null;
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Doch Gul set</div>
      <div class="source-card">
        <div class="source-title">${esc(cls)} • ${esc(g.conflux)}</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${pieces.map(row).join("")}</div>
      </div>`;
  }

  function renderEDLSetPanel(cls, selectedId){
    const q=data.questlines?.edl;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=g.bonusItemId?itemById.get(g.bonusItemId):null;
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const armor=pieces.filter(x=>![g.mainhandItemId,g.offhandItemId].includes(x.id));
    const main=pieces.filter(x=>x.id===g.mainhandItemId);
    const off=pieces.filter(x=>x.id===g.offhandItemId);
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Exalted Dragonlord set</div>
      <div class="source-card">
        <div class="source-title">${esc(cls)}</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${armor.map(row).join("")}</div>
        <div class="stat-group-title">Mainhand</div>
        <div class="link-list">${main.map(row).join("")}</div>
        <div class="stat-group-title">Offhand</div>
        <div class="link-list">${off.map(row).join("")}</div>
      </div>`;
  }

  function renderDragonlordSetPanel(cls, selectedId){
    const q=data.questlines?.dragonlord;
    const g=q?.setGroups?.[cls];
    if(!g)return "";
    const bonus=g.bonusItemId?itemById.get(g.bonusItemId):null;
    const pieces=(g.pieceItemIds||[]).map(id=>itemById.get(id)).filter(Boolean);
    const armor=pieces.filter(x=>![g.mainhandItemId,g.offhandItemId].includes(x.id));
    const main=pieces.filter(x=>x.id===g.mainhandItemId);
    const off=pieces.filter(x=>x.id===g.offhandItemId);
    const row=x=>`<button type="button" class="link-btn entity-link ${x.id===selectedId?"active":""}" data-kind="item" data-id="${x.id}">
      <div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.stats?.slot||"")}</span></div>
      <div class="link-sub">${x.stats?.levelReq?`Lv ${x.stats.levelReq}`:""}${x.id===selectedId?" • Viewing":""}</div>
    </button>`;
    return `<div class="section-title">Dragonlord set</div>
      <div class="source-card">
        <div class="source-title">${esc(cls)} • ${esc(g.color)} quest items</div>
        <div class="stat-group-title">Armour pieces</div>
        <div class="link-list">${armor.map(row).join("")}</div>
        <div class="stat-group-title">Mainhand</div>
        <div class="link-list">${main.map(row).join("")}</div>
        <div class="stat-group-title">Offhand</div>
        <div class="link-list">${off.map(row).join("")}</div>
        <div class="muted" style="margin-top:8px">The Dragonlord mainhand must be obtained before the offhand.</div>
      </div>`;
  }

  function renderSource(item){
    if(item.questline==="dochgul"){
      const q=data.questlines?.dochgul;
      const cls=item.dochgulClass;
      const p=q?.pieces?.[item.dochgulPiece];
      if(item.dochgulSetBonus){
        return `<div class="source-card"><div class="source-title">Doch Gul Set Bonus • ${esc(cls||"")}</div>
          <div class="quest-req"><strong>Activated by wearing the full Doch Gul armour set</strong></div>
          ${renderSetBonusInfo("dochgul",cls)}
        </div>`;
      }
      return `<div class="source-card">
        <div class="source-title">${item.dochgulVariant==="Fortitude"?"Doch Gul of Fortitude":"Doch Gul"} • ${esc(cls||"")}</div>
        ${p?`<div class="acquisition-methods">
          <div class="quest-req"><strong>Conflux method</strong><br>
            ${p.pure} Pure Conflux<br>${p.conflux} ${esc(item.dochgulConflux||"class Conflux")}${p.conflux===1?"":"es"}
          </div>
          <div class="quest-req"><strong>Daily Shards method</strong><br>
            ${p.shards} Shards
          </div>
        </div>`:""}
        <div class="muted" style="margin-top:8px">Either method awards the same armour piece. Daily Shards are capped at 200, so shards alone cannot complete the full set.</div>
      </div>`;
    }
    if(item.questline==="edl"){
      const q=data.questlines?.edl;
      const cls=item.edlClass;
      const color=q?.classColors?.[cls] || "class-colour";
      const p=q?.pieces?.[item.edlPiece];
      if(item.edlSetBonus){
        return `<div class="source-card"><div class="source-title">Exalted Dragonlord Set Bonus • ${esc(cls||"")}</div>
          <div class="quest-req"><strong>Activated by wearing the full Exalted Dragonlord armour set</strong></div>
          ${renderSetBonusInfo("edl",cls)}
          <div class="muted" style="margin-top:8px">Set effects shown here use the curated set-bonus data.</div>
        </div>`;
      }
      return `<div class="source-card"><div class="source-title">Exalted Dragonlord Questline • ${esc(cls||"")}</div>
        ${p?`<div class="quest-req"><strong>${esc(p.label)}</strong><br>
          ${p.req.map(([mat,n])=>`${n} ${esc(color)} ${esc(mat)}`).join("<br>")}
        </div>`:""}
      </div>`;
    }
    if(item.questline==="dragonlord"){
      const q=data.questlines?.dragonlord;
      const cls=item.dragonlordClass;
      const key=item.dragonlordPiece;
      const p=q?.pieces?.[key];
      return `<div class="source-card"><div class="source-title">Dragonlord Questline • ${esc(cls||"")}</div>
        ${p?`<div class="quest-req"><strong>${esc(p.label)} • Level ${p.level}</strong><br>
          ${p.req.map(([mat,n])=>`${n} ${esc(item.dragonlordColor||"class-colour")} ${esc(mat)}`).join("<br>")}
          ${p.note?`<br><span class="muted">${esc(p.note)}</span>`:""}
        </div>`:""}
      </div>`;
    }
    if(item.questline==="frozen"){
      const q=data.questlines?.frozen;
      const cls=item.frozenClass;
      const g=q?.setGroups?.[cls];
      if(item.frozenSetBonus){
        return `<div class="source-card"><div class="source-title">${esc(item.frozenSet||"Frozen")} Set Bonus</div>
          <div class="quest-req"><strong>Activated by wearing the full Frozen armour set</strong><br>
          These are the extra stats your character gains while all five ${esc(item.frozenSet||"Frozen")} armour pieces are equipped at the same time.</div>
          <div class="muted" style="margin-top:8px">This bonus is separate from the normal stats on each individual armour piece.</div>
        </div>`;
      }
      const slot=item.stats?.slot;
      const p=q?.pieces?.[slot];
      return `<div class="source-card"><div class="source-title">Frozen Meteoric Upgrade • ${esc(item.frozenSet||"")}</div>
        ${p?`<div class="quest-req"><strong>${esc(p.label)} • Level ${p.level}</strong><br>
          2 ${esc(g?.color||"class-colour")} ${esc(p.crest)} Crests<br>${p.orbs} Orbs of Frostweaving
        </div>`:""}
        <div class="muted" style="margin-top:8px">This is the Frozen upgrade of the corresponding Meteoric set piece.</div>
      </div>`;
    }
    if(item.questline==="warden"){
      const q=data.questlines?.warden;
      const piece=q?.pieces?.[item.wardenPiece || item.stats?.slot];
      if(item.wardenSetBonus){
        return `<div class="source-card"><div class="source-title">${esc(item.wardenSet||"Warden")} Set Bonus</div>
          <div class="quest-req">
            <strong>Activated by wearing the full armour set</strong><br>
            These are the extra stats your character gains while all five ${esc(item.wardenSet||"Warden")} armour pieces are equipped at the same time.
          </div>
          <div class="muted" style="margin-top:8px">The individual armour pieces and their normal stats are listed together in the set section below.</div>
        </div>`;
      }
      return `<div class="source-card"><div class="source-title">Warden Questline • ${esc(item.wardenSet||"Warden")}</div>
        ${piece?`<div class="quest-summary"><div class="quest-req">
          <strong>${esc(item.wardenPiece||item.stats?.slot)} • Level ${piece.level}</strong><br>
          ${piece.req.map(([disc,n])=>`${n} ${esc(disc)} Disc${n===1?"":"s"}`).join("<br>")}
        </div></div>`:""}
        <div class="muted" style="margin-top:8px">Discs are shared across classes; there are no class-specific disc colors.</div>
      </div>`;
    }
    if(item.questline==="meteoric"){
      const q=data.questlines?.meteoric;
      const s=item.stats||{};
      const piece=q?.armorPieces?.[s.slot];
      let body=`<div class="source-card"><div class="source-title">Meteoric Questline${item.meteoricSet?` • ${esc(item.meteoricSet)}`:""}</div>`;
      if(s.slot==="Weapon" || s.slot==="Offhand"){
        const cls=s.classReq||"Class";
        body+=`<div class="quest-summary">
          <div class="quest-req"><strong>Weapon quest</strong><br>Level ${q.weapon.level} • Requires ${esc(q.weapon.requirement)}${q.weapon.classItems?.[cls]?`<br>Class item: ${esc(q.weapon.classItems[cls])}`:""}</div>
          <ol class="quest-steps">${q.weapon.steps.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
        </div>`;
      } else if(piece){
        const cm=q.classMaterials?.[s.classReq];
        body+=`<div class="quest-summary"><div class="quest-req">
          <strong>${esc(s.slot)} • Level ${piece.level}</strong><br>
          ${cm?`3 ${esc(cm.color)} Remnants of ${esc(piece.remnant)}<br>3 ${esc(piece.tablet)} Tablets of ${esc(cm.tablet)}<br>`:""}
          ${esc(piece.crystal)} Meteoric Crystal
        </div></div>`;
      } else {
        body+=`<div class="muted">Curated as part of the Meteoric questline.</div>`;
      }
      return body+`</div>`;
    }
    if(item.mobs?.length) return `<div class="source-card"><div class="source-title">Mob drop</div><div class="muted">Drop sources are listed below.</div></div>`;
    return `<div class="source-card"><div class="source-title">Other / undocumented source</div><div class="muted">This item exists in the game data, but its exact vendor, quest, or crafting source is not currently documented in the explorer.</div></div>`;
  }


  function renderCuratedSetBonusItem(item,targetId){
    const back=targetId==="guideDetail"&&activeGuideId
      ? `<button type="button" class="clear-btn back-guide-btn" data-guide="${activeGuideId}">← Back to guide</button>`
      : "";

    let type=null, cls=null, setNav="";
    if(item.edlSetBonus){
      type="edl"; cls=item.edlClass;
      setNav=renderEDLSetPanel(cls,item.id);
    } else if(item.dragonlordSetBonus){
      type="dragonlord"; cls=item.dragonlordClass;
      setNav=renderDragonlordSetPanel(cls,item.id);
    } else if(item.dochgulSetBonus){
      type="dochgul"; cls=item.dochgulClass;
      setNav=renderDochGulSetPanel(cls,item.id);
    }

    if(!type)return false;

    const label=type==="edl" ? "Exalted Dragonlord Set Bonus"
      : type==="dragonlord" ? "Dragonlord Set Bonus"
      : "Doch Gul Set Bonus";

    $(targetId).innerHTML=`${back}
      <div class="detail-kicker">Set Bonus</div>
      <h2 class="detail-title">${esc(label)} • ${esc(cls||"")}</h2>
      <div class="meta"><span>Item ID ${item.id}</span></div>

      <div class="section-title">Set effect</div>
      <div class="source-card set-bonus-primary">
        <div class="quest-req"><strong>Activated by wearing the full matching armour set</strong></div>
        ${renderSetBonusInfo(type,cls)}
      </div>

      ${setNav}`;
    return true;
  }


  function renderInlineArmorSetBonus(item){
    const slot=item.stats?.slot;
    if(!["Head","Torso","Hands","Legs","Feet"].includes(slot))return "";

    let title="Full-set bonus";
    let body="";

    if(item.questline==="dragonlord" && item.dragonlordClass){
      body=renderSetBonusInfo("dragonlord",item.dragonlordClass);
    } else if(item.questline==="edl" && item.edlClass){
      body=renderSetBonusInfo("edl",item.edlClass);
    } else if(item.questline==="dochgul" && item.dochgulVariant==="Fortitude"){
      body=renderFortitudeSetBonusInfo();
    } else if(item.questline==="dochgul" && item.dochgulClass){
      body=renderSetBonusInfo("dochgul",item.dochgulClass);
    } else if(item.questline==="warden" && item.wardenClass){
      const g=data.questlines?.warden?.setGroups?.[item.wardenClass];
      const bonus=g?.bonusItemId?itemById.get(g.bonusItemId):null;
      if(bonus?.stats){
        body=`<div class="set-effect-box">
          <div class="set-effect-title">${esc(bonus.name)}</div>
          <div class="muted" style="margin-bottom:8px">Extra stats active while all five matching Warden armour pieces are equipped.</div>
          ${renderStats(bonus.stats).replace('<div class="section-title">Stats</div>','')}
        </div>`;
      }
    } else if(item.questline==="frozen" && item.frozenClass){
      const g=data.questlines?.frozen?.setGroups?.[item.frozenClass];
      const bonus=g?.bonusItemId?itemById.get(g.bonusItemId):null;
      if(bonus?.stats){
        body=`<div class="set-effect-box">
          <div class="set-effect-title">${esc(bonus.name)}</div>
          <div class="muted" style="margin-bottom:8px">Extra stats active while all five matching Frozen armour pieces are equipped.</div>
          ${renderStats(bonus.stats).replace('<div class="section-title">Stats</div>','')}
        </div>`;
      }
    } else if(item.questline==="meteoric" && item.meteoricClass){
      const g=data.questlines?.meteoric?.setGroups?.[item.meteoricClass];
      const bonus=g?.bonusItemId?itemById.get(g.bonusItemId):null;
      if(bonus?.stats){
        body=`<div class="set-effect-box">
          <div class="set-effect-title">${esc(bonus.name)}</div>
          ${renderStats(bonus.stats).replace('<div class="section-title">Stats</div>','')}
        </div>`;
      }
    }

    if(!body)return "";
    return `<div class="section-title">${title}</div>
      <div class="inline-set-bonus">${body}</div>`;
  }

  function renderItem(item,targetId="detailPanel"){
    if(!item)return;
    if(renderCuratedSetBonusItem(item,targetId))return;
    const droppers=item.mobs.map(mid=>mobById.get(mid)).filter(Boolean), rel=relatedItems(item);
    const provenance=item.id>=900000?"Current-game manual data":item.sourceType==="questline"?"Curated questline mapping":"Extracted game data";
    $(targetId).innerHTML=`${targetId==="guideDetail"&&activeGuideId?`<button type="button" class="clear-btn back-guide-btn" data-guide="${activeGuideId}">← Back to guide</button>`:""}
      <div class="detail-heading-row">
        <div><div class="detail-kicker">Item</div><h2 class="detail-title">${esc(item.name)}</h2></div>
        ${favoriteButton("item",item.id)}
      </div>
      ${item.description?`<p class="description">${esc(item.description)}</p>`:""}
      <div class="meta">${item.rarity?`<span>${esc(item.rarity)}</span>`:""}${item.stats?.slot?`<span>${esc(item.stats.slot)}</span>`:""}${item.stats?.classReq?`<span>${esc(item.stats.classReq)}</span>`:""}${item.stats?.levelReq?`<span>Lv ${item.stats.levelReq} required</span>`:""}<span>Item ID ${item.id}</span><span class="provenance">${esc(provenance)}</span></div>
      ${item.wardenSetBonus||item.meteoricSetBonus||item.frozenSetBonus||item.dragonlordSetBonus||item.edlSetBonus||item.dochgulSetBonus ? "" : renderStats(item.stats)}
      <div class="section-title">${item.wardenSetBonus||item.meteoricSetBonus||item.frozenSetBonus||item.dragonlordSetBonus||item.edlSetBonus||item.dochgulSetBonus?"Set bonus":"Source"}</div>${renderSource(item)}
      ${renderInlineArmorSetBonus(item)}
      ${item.questline==="warden"&&item.wardenClass?renderWardenSetPanel(item.wardenClass,item.id):""}
      ${item.questline==="meteoric"&&item.meteoricClass?renderMeteoricSetPanel(item.meteoricClass,item.id):""}
      ${item.questline==="frozen"&&item.frozenClass?renderFrozenSetPanel(item.frozenClass,item.id):""}
      ${item.questline==="dragonlord"&&item.dragonlordClass?renderDragonlordSetPanel(item.dragonlordClass,item.id):""}
      ${item.questline==="edl"&&item.edlClass?renderEDLSetPanel(item.edlClass,item.id):""}
      ${item.questline==="dochgul"&&item.dochgulVariant==="Fortitude"
        ? renderDochGulVariantPanel("warrior-fortitude",item.id)
        : item.questline==="dochgul"&&item.dochgulClass
          ? renderDochGulSetPanel(item.dochgulClass,item.id)
          : ""}
      ${rel.length?`<div class="section-title">Related items</div><div class="related">${rel.map(x=>`<button type="button" class="link-btn entity-link" data-kind="item" data-id="${x.id}"><div class="link-main"><span>${esc(x.name)}</span><span>${esc(x.rarity||"")}</span></div><div class="link-sub">${[x.stats?.slot,x.stats?.levelReq?`Lv ${x.stats.levelReq}`:null].filter(Boolean).join(" • ")}</div></button>`).join("")}</div>`:""}
      ${droppers.length?`<div class="section-title">Dropped by</div><div class="link-list">${droppers.map(m=>`<button type="button" class="link-btn entity-link dropper-mob-stat-link" data-kind="mob" data-id="${m.id}"><div class="link-main"><span>${esc(m.name)}</span><span>Lv ${mobStatsById.get(m.id)?.level ?? m.level ?? "?"}</span></div><div class="link-sub">${esc(zoneText(m))}</div></button>`).join("")}</div>`:""}`;
  }

  const slotOrder=["Head","Torso","Hands","Legs","Feet","Weapon","Quiver","Necklace","Charm","Bracelet","Ring","Other"];


  const bossTierNames=new Set([
    "mordris",
    "gelebron",
    "dhiothu",
    "bloodthorn the ravenous",
    "bloodthorn"
  ]);

  function getBossTierForItem(mob,item){
    if(!mob||!item)return null;
    const boss=norm(mob.name);
    if(!bossTierNames.has(boss))return null;

    const slot=norm(item.stats?.slot||"");
    const itemName=norm(item.name);

    // Only apply the special raid-boss tier system to helms and weapons.
    const isHelm=slot.includes("head")||slot.includes("helm");
    const isWeapon=["weapon","main hand","mainhand","off hand","offhand"].some(x=>slot.includes(x));
    if(!isHelm&&!isWeapon)return null;

    // Dhiothu's unique named weapons sit above Void.
    if(boss==="dhiothu"){
      const namedPrefixes=["goibniu's","lugh's","nuada's","brigid's","dagda's","morrigan's","aed's","manannan's"];
      if(namedPrefixes.some(x=>itemName.startsWith(x)))return "Named";
    }

    if(itemName.includes("void"))return "Void";
    if(itemName.includes("shadow"))return "Shadow";
    if(itemName.includes("dark"))return "Dark";
    return null;
  }

  function bossTierRank(tier){
    return ({Named:0,Void:1,Shadow:2,Dark:3})[tier] ?? 99;
  }

  function buildHierarchicalLoot(groups, ordered, dropCard, mob=null){
    return ordered.map(slot=>{
      const arr=groups.get(slot)||[];

      // Special handling for raid-boss helms/weapons: organize by class, then
      // player-facing boss tier (Named/Void/Shadow/Dark) instead of generic rarity.
      const tiered=arr.filter(d=>getBossTierForItem(mob,d.item));
      const useBossTiering=!!mob && tiered.length>0 && tiered.length===arr.length;

      if(useBossTiering){
        const classGroups=new Map();
        for(const d of arr){
          const cls=d.item.stats?.classReq||"All Classes";
          if(!classGroups.has(cls))classGroups.set(cls,[]);
          classGroups.get(cls).push(d);
        }

        const classOrder=[...classGroups.keys()].sort((a,b)=>{
          if(a==="All Classes")return 1;
          if(b==="All Classes")return -1;
          return a.localeCompare(b);
        });

        return `
          <details class="boss-loot-group boss-loot-slot-group" data-loot-slot="${esc(norm(slot))}">
            <summary>
              <span>${esc(slot)}</span>
              <span class="boss-loot-group-count">${arr.length}</span>
            </summary>
            <div class="boss-loot-subgroups">
              ${classOrder.map(cls=>{
                const classItems=classGroups.get(cls);
                const tierGroups=new Map();
                for(const d of classItems){
                  const tier=getBossTierForItem(mob,d.item)||"Other";
                  if(!tierGroups.has(tier))tierGroups.set(tier,[]);
                  tierGroups.get(tier).push(d);
                }
                const tierOrder=[...tierGroups.keys()].sort((a,b)=>bossTierRank(a)-bossTierRank(b)||a.localeCompare(b));
                return `
                  <details class="boss-loot-class-group">
                    <summary>
                      <span>${esc(cls)}</span>
                      <span class="boss-loot-group-count">${classItems.length}</span>
                    </summary>
                    <div class="boss-loot-rarity-groups">
                      ${tierOrder.map(tier=>`
                        <details class="boss-loot-rarity-group boss-loot-tier-group">
                          <summary>
                            <span>${esc(tier)}</span>
                            <span class="boss-loot-group-count">${tierGroups.get(tier).length}</span>
                          </summary>
                          <div class="boss-loot-grid">${tierGroups.get(tier).map(dropCard).join("")}</div>
                        </details>`).join("")}
                    </div>
                  </details>`;
              }).join("")}
            </div>
          </details>`;
      }

      // Generic large-slot handling for everything else.
      if(arr.length>30){
        const classGroups=new Map();
        for(const d of arr){
          const cls=d.item.stats?.classReq||"All Classes";
          if(!classGroups.has(cls))classGroups.set(cls,[]);
          classGroups.get(cls).push(d);
        }

        const classOrder=[...classGroups.keys()].sort((a,b)=>{
          if(a==="All Classes")return 1;
          if(b==="All Classes")return -1;
          return a.localeCompare(b);
        });

        return `
          <details class="boss-loot-group boss-loot-slot-group" data-loot-slot="${esc(norm(slot))}">
            <summary>
              <span>${esc(slot)}</span>
              <span class="boss-loot-group-count">${arr.length}</span>
            </summary>
            <div class="boss-loot-subgroups">
              ${classOrder.map(cls=>{
                const classItems=classGroups.get(cls);
                const rarityGroups=new Map();
                for(const d of classItems){
                  const rarity=d.item.rarity||"Unspecified";
                  if(!rarityGroups.has(rarity))rarityGroups.set(rarity,[]);
                  rarityGroups.get(rarity).push(d);
                }
                const rarityOrder=[...rarityGroups.keys()].sort((a,b)=>a.localeCompare(b));
                return `
                  <details class="boss-loot-class-group">
                    <summary>
                      <span>${esc(cls)}</span>
                      <span class="boss-loot-group-count">${classItems.length}</span>
                    </summary>
                    <div class="boss-loot-rarity-groups">
                      ${rarityOrder.map(rarity=>`
                        <details class="boss-loot-rarity-group">
                          <summary>
                            <span>${esc(rarity)}</span>
                            <span class="boss-loot-group-count">${rarityGroups.get(rarity).length}</span>
                          </summary>
                          <div class="boss-loot-grid">${rarityGroups.get(rarity).map(dropCard).join("")}</div>
                        </details>`).join("")}
                    </div>
                  </details>`;
              }).join("")}
            </div>
          </details>`;
      }

      return `
        <details class="boss-loot-group" data-loot-slot="${esc(norm(slot))}">
          <summary>
            <span>${esc(slot)}</span>
            <span class="boss-loot-group-count">${arr.length}</span>
          </summary>
          <div class="boss-loot-grid">${arr.map(dropCard).join("")}</div>
        </details>`;
    }).join("");
  }

  function renderMob(mob,targetId="detailPanel"){
    if(!mob)return;
    const f=currentFilters();
    const ms=mobStatsById.get(mob.id);

    let drops=mob.drops.map(d=>({...d,item:itemById.get(d.itemId)})).filter(d=>d.item);
    drops=drops.filter(d=>itemMatches(d.item,{...f,q:"",zone:""}));

    const groups=new Map();
    for(const d of drops){
      const slot=d.item.stats?.slot||"Other";
      if(!groups.has(slot))groups.set(slot,[]);
      groups.get(slot).push(d);
    }
    for(const arr of groups.values()){
      arr.sort((a,b)=>((a.item.rarity||"").localeCompare(b.item.rarity||""))||a.item.name.localeCompare(b.item.name));
    }
    const ordered=[...groups.keys()].sort((a,b)=>
      (slotOrder.indexOf(a)<0?99:slotOrder.indexOf(a))-(slotOrder.indexOf(b)<0?99:slotOrder.indexOf(b))||a.localeCompare(b)
    );

    const level=ms?.level ?? mob.level;
    const stars=(ms?.stars>=1 && ms?.stars<=6)?ms.stars:null;
    const zones=cleanZones([...(mob.zones||[]),...((ms?.spawns||[]).map(s=>s.zone))]);

    const correctedStats=ms?`
      <div class="section-title">Mob Stats</div>
      <div class="stat-grid">
        <div class="stat-row"><span>Level</span><strong>${fmtMobNum(ms.level)}</strong></div>
        <div class="stat-row"><span>Stars</span><strong>${stars?`${stars}★`:"—"}</strong></div>
        <div class="stat-row"><span>HP</span><strong>${fmtMobNum(ms.health)}</strong></div>
        <div class="stat-row"><span>Energy</span><strong>${fmtMobNum(ms.energy)}</strong></div>
        <div class="stat-row"><span>Attack</span><strong>${fmtMobNum(ms.attack)}</strong></div>
        <div class="stat-row"><span>Defence</span><strong>${fmtMobNum(ms.defence)}</strong></div>
        <div class="stat-row"><span>Attack Speed</span><strong>${fmtMobNum(ms.attackSpeed)}</strong></div>
        <div class="stat-row"><span>XP</span><strong>${fmtMobNum(ms.xp)}</strong></div>
      </div>
      <div style="margin-top:10px">
        <button type="button" class="clear-btn view-full-mob-stats" data-mob-stat-id="${mob.id}">View full Mob Stats</button>
      </div>
    `:"";

    const dropCard=d=>`
      <button type="button"
        class="link-btn entity-link boss-loot-item"
        data-kind="item"
        data-id="${d.item.id}"
        data-target="${esc(targetId)}"
        data-loot-name="${esc(norm(d.item.name))}"
        data-loot-class="${esc(norm(d.item.stats?.classReq||""))}"
        data-loot-rarity="${esc(norm(d.item.rarity||""))}">
        <div class="link-main"><span>${esc(d.item.name)}</span><span>${esc(d.item.rarity||"")}</span></div>
        <div class="link-sub">${[
          d.item.stats?.classReq,
          d.item.stats?.levelReq?`Lv ${d.item.stats.levelReq}`:null,
          d.chance?`${d.chance}%`:null
        ].filter(Boolean).join(" • ")}</div>
      </button>`;

    const useCompactLoot=drops.length>20;
    let lootHtml="";

    if(!ordered.length){
      lootHtml=`<div class="notice">No drops match the current filters.</div>`;
    }else if(!useCompactLoot){
      lootHtml=ordered.map(slot=>`
        <div class="drop-group">
          <div class="drop-group-title">${esc(slot)} <span>${groups.get(slot).length}</span></div>
          <div class="link-list">${groups.get(slot).map(dropCard).join("")}</div>
        </div>`).join("");
    }else{
      const classes=[...new Set(drops.map(d=>d.item.stats?.classReq).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const rarities=[...new Set(drops.map(d=>d.item.rarity).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
      const filterId=`bossLoot-${mob.id}-${targetId}`;
      lootHtml=`
        <div class="boss-loot-browser" id="${esc(filterId)}">
          <div class="boss-loot-summary">
            <strong>${drops.length.toLocaleString()} known drops</strong>
            <span class="muted">Large loot table — filter or expand only the slots you need.</span>
          </div>

          <div class="boss-loot-controls">
            <label class="boss-loot-search">
              <span>Find loot</span>
              <input type="search" class="boss-loot-query" placeholder="Search this boss's drops..." autocomplete="off">
            </label>
            ${classes.length?`<label><span>Class</span><select class="boss-loot-class">
              <option value="">All classes</option>
              ${classes.map(x=>`<option value="${esc(norm(x))}">${esc(x)}</option>`).join("")}
            </select></label>`:""}
            ${rarities.length>1?`<label><span>Rarity</span><select class="boss-loot-rarity">
              <option value="">All rarities</option>
              ${rarities.map(x=>`<option value="${esc(norm(x))}">${esc(x)}</option>`).join("")}
            </select></label>`:""}
          </div>

          <div class="boss-loot-actions">
            <span class="muted boss-loot-match-count">${drops.length.toLocaleString()} shown</span>
            <div>
              <button type="button" class="clear-btn boss-loot-expand">Expand all</button>
              <button type="button" class="clear-btn boss-loot-collapse">Collapse all</button>
            </div>
          </div>

          <div class="boss-loot-groups">
            ${buildHierarchicalLoot(groups,ordered,dropCard,mob)}
          </div>
          <div class="notice boss-loot-empty" hidden>No loot matches those filters.</div>
        </div>`;
    }

    $(targetId).innerHTML=`
      ${targetId==="guideDetail"&&activeGuideId?`<button type="button" class="clear-btn back-guide-btn" data-guide="${activeGuideId}">← Back to guide</button>`:""}
      <div class="detail-heading-row">
        <div>
          <div class="detail-kicker">Mob</div>
          <h2 class="detail-title">${esc(mob.name)}</h2>
        </div>
        ${favoriteButton("mob",mob.id)}
      </div>
      <div class="meta">
        ${level!==null&&level!==undefined?`<span>Lv ${fmtMobNum(level)}</span>`:""}
        ${stars?`<span>${stars}★</span>`:""}
        ${zones.map(z=>`<span>${esc(z)}</span>`).join("")}
        <span>Mob ID ${mob.id}</span>
        <span class="provenance">${ms?"Corrected game-data stats":"Extracted loot data"}</span>
      </div>
      ${correctedStats}
      <div class="section-title">Known Loot</div>
      ${lootHtml}`;
  }


  function renderFavorites(){
    updateFavoriteCount();
    const rows=[];
    for(const key of favorites){
      const [kind,idRaw]=key.split(":");
      const id=Number(idRaw);
      if(kind==="item"){
        const i=itemById.get(id);
        if(i && !isSetBonusItem(i)) rows.push({kind,id,name:i.name,sub:[i.stats?.slot,i.stats?.classReq,i.stats?.levelReq?`Lv ${i.stats.levelReq}`:null].filter(Boolean).join(" • "),rarity:i.rarity});
      }else if(kind==="mob"){
        const m=mobById.get(id);
        const ms=mobStatsById.get(id);
        if(m){
          const level=ms?.level ?? m.level ?? "?";
          const stars=(ms?.stars>=1 && ms?.stars<=6)?` • ${ms.stars}★`:"";
          const zones=cleanZones([...(m.zones||[]),...((ms?.spawns||[]).map(s=>s.zone))]);
          rows.push({kind,id,name:m.name,sub:`Level ${level}${stars} • ${zones.length?zones.join(", "):"Unknown zone"}`});
        }
      }
    }
    rows.sort((a,b)=>a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name));
    if(!rows.length){
      $("favoritesResults").innerHTML=`<div class="empty-detail compact-empty"><div class="empty-icon">☆</div><h2>No favorites yet</h2><p>Use the star beside an item or mob to save it here.</p></div>`;
      $("clearFavoritesBtn").disabled=true;
      return;
    }
    $("clearFavoritesBtn").disabled=false;
    $("favoritesResults").innerHTML=rows.map(r=>`<div class="result-wrap">
      <button class="result favorite-result" type="button" data-kind="${r.kind}" data-id="${r.id}">
        <div class="result-top"><span class="result-name">${esc(r.name)}</span><span>${r.rarity?`<span class="badge rarity">${esc(r.rarity)}</span> `:""}<span class="badge ${r.kind}">${r.kind==="item"?"ITEM":"MOB"}</span></span></div>
        <div class="result-sub">${esc(r.sub)}</div>
      </button>
      ${favoriteButton(r.kind,r.id,true)}
    </div>`).join("");
  }

  $("favoritesResults").addEventListener("click",e=>{
    const fav=e.target.closest(".favorite-btn");
    if(fav){e.stopPropagation();toggleFavorite(fav.dataset.favoriteKind,Number(fav.dataset.favoriteId));return;}
    const b=e.target.closest(".favorite-result");
    if(!b)return;
    const kind=b.dataset.kind,id=Number(b.dataset.id);
    kind==="item"?renderItem(itemById.get(id),"favoritesDetail"):renderMob(mobById.get(id),"favoritesDetail");
  });

  let clearFavoritesConfirmUntil=0;
  $("clearFavoritesBtn").addEventListener("click",()=>{
    if(!favorites.size)return;

    const btn=$("clearFavoritesBtn");
    const now=Date.now();

    // Avoid window.confirm(), which can be unreliable/blocked inside
    // embedded Discord Activities. Use a simple two-click confirmation.
    if(now>clearFavoritesConfirmUntil){
      clearFavoritesConfirmUntil=now+5000;
      btn.textContent="Click again to confirm";
      btn.classList.add("confirming");
      setTimeout(()=>{
        if(Date.now()>=clearFavoritesConfirmUntil){
          btn.textContent="Clear favorites";
          btn.classList.remove("confirming");
        }
      },5100);
      return;
    }

    clearFavoritesConfirmUntil=0;
    favorites.clear();
    saveFavorites();
    renderFavorites();
    btn.textContent="Clear favorites";
    btn.classList.remove("confirming");
    $("favoritesDetail").innerHTML=`<div class="empty-detail"><div class="empty-icon">★</div><h2>Your saved gear</h2><p>Star items or mobs while browsing to keep them here.</p></div>`;
  });


  // ---------- Mob Stats ----------
  const mobStatZones=cleanZones(mobStats.flatMap(m=>(m.spawns||[]).map(s=>s.zone))).sort((a,b)=>a.localeCompare(b));
  $("mobStatsZone").insertAdjacentHTML("beforeend",mobStatZones.map(z=>`<option value="${esc(z)}">${esc(z)}</option>`).join(""));

  function fmtMobNum(v){
    if(v===null||v===undefined||v==="")return "—";
    const n=Number(v);
    return Number.isFinite(n)?n.toLocaleString():esc(v);
  }
  function fmtMobResist(v){
    return Number(v)===-1?"Immune":fmtMobNum(v);
  }
  function fmtMobSeconds(v){
    if(v===null||v===undefined)return "—";
    let s=Math.max(0,Number(v)||0);
    if(s>=86400){
      const d=Math.floor(s/86400),h=Math.floor((s%86400)/3600);
      return h?`${d}d ${h}h`:`${d}d`;
    }
    if(s>=3600){
      const h=Math.floor(s/3600),m=Math.floor((s%3600)/60);
      return m?`${h}h ${m}m`:`${h}h`;
    }
    if(s>=60){
      const m=Math.floor(s/60),r=Math.floor(s%60);
      return r?`${m}m ${r}s`:`${m}m`;
    }
    return `${Math.floor(s)}s`;
  }
  function mobStatsFilters(){
    return {
      q:norm($("mobStatsSearch").value),
      level:Number($("mobStatsLevel").value||0),
      stars:Number($("mobStatsStars").value||0),
      opinion:norm($("mobStatsOpinion").value),
      zone:$("mobStatsZone").value
    };
  }
  function renderMobStatsResults(){
    const f=mobStatsFilters();
    let out=mobStats.filter(m=>{
      if(f.q && !norm(m.name).includes(f.q) && String(m.id)!==f.q)return false;
      if(f.level && Number(m.level||0)<f.level)return false;
      if(f.stars && Number(m.stars||0)!==f.stars)return false;
      if(f.opinion && norm(m.opinion)!==f.opinion)return false;
      if(f.zone && !(m.spawns||[]).some(s=>cleanZoneName(s.zone)===f.zone))return false;
      return true;
    });
    out.sort((a,b)=>{
      const aq=norm(a.name),bq=norm(b.name);
      const ap=f.q&&(aq.startsWith(f.q)||String(a.id)===f.q)?0:1;
      const bp=f.q&&(bq.startsWith(f.q)||String(b.id)===f.q)?0:1;
      return ap-bp || (Number(b.level||0)-Number(a.level||0)) || aq.localeCompare(bq);
    });
    const total=out.length;
    out=out.slice(0,250);
    $("mobStatsCount").textContent=`${total.toLocaleString()} match${total===1?"":"es"}${total>250?" • first 250 shown":""}`;
    if(!out.length){
      $("mobStatsResults").innerHTML=`<div class="empty-detail" style="padding:55px 15px"><h2>No matches</h2><p>Try clearing a filter or shortening the search.</p></div>`;
      return;
    }
    $("mobStatsResults").innerHTML=out.map(m=>{
      const zones=cleanZones((m.spawns||[]).map(s=>s.zone));
      const sub=[
        m.level!==null&&m.level!==undefined?`Lv ${m.level}`:null,
        m.stars?`${m.stars}★`:null,
        m.opinion?String(m.opinion).replace(/^./,c=>c.toUpperCase()):null,
        zones.length?zones.slice(0,2).join(", "):null
      ].filter(Boolean).join(" • ");
      return `<button class="result mob-stat-result" type="button" data-mob-stat-id="${m.id}">
        <div class="result-top"><span class="result-name">${esc(m.name)}</span><span class="badge mob">MOB</span></div>
        <div class="result-sub">${esc(sub)}</div>
      </button>`;
    }).join("");
  }

  function mobStatRows(rows, valueFormatter=fmtMobNum){
    return `<div class="stat-grid">${rows.map(([label,value])=>
      `<div class="stat-row"><span>${esc(label)}</span><strong>${valueFormatter(value)}</strong></div>`
    ).join("")}</div>`;
  }

  function damageResistRows(m){
    const labels=[
      ["Pierce","pierce"],["Slash","slash"],["Crush","crush"],["Heat","heat"],["Cold","cold"],
      ["Magic","magic"],["Poison","poison"],["Divine","divine"],["Chaos","chaos"],["True","true"]
    ];
    return `<div class="damage-resist-grid">${labels.map(([label,key])=>
      `<div class="damage-resist-row">
        <span>${label}</span>
        <strong>${fmtMobNum(m.damage?.[key])}</strong>
        <strong>${fmtMobResist(m.resist?.[key])}</strong>
      </div>`
    ).join("")}</div>`;
  }


  function renderMobStatsLoot(drops,targetId="mobStatsDetail",mob=null){
    if(!drops.length)return `<div class="notice">No loot entries are currently linked to this mob in the Items & Loot dataset.</div>`;

    const mapped=drops.map(d=>({...d,item:itemById.get(d.itemId)})).filter(d=>d.item);
    if(!mapped.length)return `<div class="notice">No loot entries are currently linked to this mob in the Items & Loot dataset.</div>`;

    const groups=new Map();
    for(const d of mapped){
      const slot=d.item.stats?.slot||"Other";
      if(!groups.has(slot))groups.set(slot,[]);
      groups.get(slot).push(d);
    }
    for(const arr of groups.values()){
      arr.sort((a,b)=>((a.item.rarity||"").localeCompare(b.item.rarity||""))||a.item.name.localeCompare(b.item.name));
    }
    const ordered=[...groups.keys()].sort((a,b)=>
      (slotOrder.indexOf(a)<0?99:slotOrder.indexOf(a))-(slotOrder.indexOf(b)<0?99:slotOrder.indexOf(b))||a.localeCompare(b)
    );

    const card=d=>`
      <button type="button"
        class="link-btn entity-link boss-loot-item mob-stat-item-link"
        data-kind="item"
        data-id="${d.item.id}"
        data-target="${esc(targetId)}"
        data-loot-name="${esc(norm(d.item.name))}"
        data-loot-class="${esc(norm(d.item.stats?.classReq||""))}"
        data-loot-rarity="${esc(norm(d.item.rarity||""))}">
        <div class="link-main"><span>${esc(d.item.name)}</span><span>${esc(d.item.rarity||"")}</span></div>
        <div class="link-sub">${[
          d.item.stats?.classReq,
          d.item.stats?.levelReq?`Lv ${d.item.stats.levelReq}`:null
        ].filter(Boolean).join(" • ")}</div>
      </button>`;

    if(mapped.length<=20){
      return ordered.map(slot=>`
        <div class="drop-group">
          <div class="drop-group-title">${esc(slot)} <span>${groups.get(slot).length}</span></div>
          <div class="link-list">${groups.get(slot).map(card).join("")}</div>
        </div>`).join("");
    }

    const classes=[...new Set(mapped.map(d=>d.item.stats?.classReq).filter(Boolean))].sort((a,b)=>a.localeCompare(b));
    const rarities=[...new Set(mapped.map(d=>d.item.rarity).filter(Boolean))].sort((a,b)=>a.localeCompare(b));

    return `
      <div class="boss-loot-browser">
        <div class="boss-loot-summary">
          <strong>${mapped.length.toLocaleString()} known drops</strong>
          <span class="muted">Large loot table — filter or expand only the slots you need.</span>
        </div>

        <div class="boss-loot-controls">
          <label class="boss-loot-search">
            <span>Find loot</span>
            <input type="search" class="boss-loot-query" placeholder="Search this mob's drops..." autocomplete="off">
          </label>
          ${classes.length?`<label><span>Class</span><select class="boss-loot-class">
            <option value="">All classes</option>
            ${classes.map(x=>`<option value="${esc(norm(x))}">${esc(x)}</option>`).join("")}
          </select></label>`:""}
          ${rarities.length>1?`<label><span>Rarity</span><select class="boss-loot-rarity">
            <option value="">All rarities</option>
            ${rarities.map(x=>`<option value="${esc(norm(x))}">${esc(x)}</option>`).join("")}
          </select></label>`:""}
        </div>

        <div class="boss-loot-actions">
          <span class="muted boss-loot-match-count">${mapped.length.toLocaleString()} shown</span>
          <div>
            <button type="button" class="clear-btn boss-loot-expand">Expand all</button>
            <button type="button" class="clear-btn boss-loot-collapse">Collapse all</button>
          </div>
        </div>

        <div class="boss-loot-groups">
          ${buildHierarchicalLoot(groups,ordered,card,mob)}
        </div>
        <div class="notice boss-loot-empty" hidden>No loot matches those filters.</div>
      </div>`;
  }

  function renderMobStatsDetail(id){
    const m=mobStatsById.get(Number(id)); if(!m)return;
    const lootMob=mobById.get(Number(id));
    const zones=cleanZones((m.spawns||[]).map(s=>s.zone));
    const spawnRows=(m.spawns||[]).map((s,i)=>{
      const coords=(s.x!==undefined&&s.z!==undefined)?`<div class="muted">Coords: ${fmtMobNum(s.x)}, ${fmtMobNum(s.y)}, ${fmtMobNum(s.z)}</div>`:"";
      const zone=cleanZoneName(s.zone);
      return `<div class="quest-req"><strong>${esc(zone||`Spawn ${i+1}`)}</strong>${coords}</div>`;
    }).join("");

    const ev=m.evasions||{};
    const drops=lootMob?.drops||[];
    const mobStatsLootHtml=renderMobStatsLoot(drops,"mobStatsDetail",m);

    $("mobStatsDetail").innerHTML=`
      <div class="detail-kicker">Mob Stats</div>
      <h2 class="detail-title">${esc(m.name)}</h2>
      <div class="meta">
        <span>Mob ID ${m.id}</span>
        ${m.level!==null&&m.level!==undefined?`<span>Lv ${fmtMobNum(m.level)}</span>`:""}
        ${m.stars?`<span>${fmtMobNum(m.stars)}★</span>`:""}
        ${m.opinion?`<span>${esc(String(m.opinion).replace(/^./,c=>c.toUpperCase()))}</span>`:""}
        ${zones.map(z=>`<span>${esc(z)}</span>`).join("")}
      </div>

      <div class="section-title">General Stats</div>
      ${mobStatRows([
        ["Level",m.level],["Stars",m.stars],["HP",m.health],["Energy",m.energy],
        ["Attack",m.attack],["Defence",m.defence],["Attack Speed",m.attackSpeed],
        ["XP",m.xp],["Gold Min",m.goldMin],["Gold Max",m.goldMax]
      ])}

      <div class="section-title">Combat & Behaviour</div>
      ${mobStatRows([
        ["Radius",m.radius??m.range],["Attack Range",m.attackRange],["Missile Speed",m.missileSpeed],
        ["Follow Range",m.followRange],["Fishing Damage",m.fishingDamage]
      ])}

      <div class="section-title">Damage / Resistance</div>
      <div class="damage-resist-head"><span>Type</span><strong>Damage</strong><strong>Resist</strong></div>
      ${damageResistRows(m)}
      <div class="muted mob-stat-note">“Immune” represents a resistance value of -1 in the game data.</div>

      <div class="section-title">Evasions</div>
      ${mobStatRows([
        ["Physical",ev.physical],["Spell",ev.spell],["Movement",ev.movement],
        ["Wounding",ev.wounding],["Weakening",ev.weakening],["Mental",ev.mental]
      ])}

      <div class="section-title">Spawn Information</div>
      ${spawnRows?`<div class="quest-summary">${spawnRows}</div>`:`<div class="notice">No spawn records are currently mapped for this mob.</div>`}

      <div class="section-title">Known Loot</div>
      ${mobStatsLootHtml}
    `;
  }

  $("mobStatsResults").addEventListener("click",e=>{
    const b=e.target.closest("[data-mob-stat-id]");
    if(b)renderMobStatsDetail(Number(b.dataset.mobStatId));
  });
  $("mobStatsDetail").addEventListener("click",e=>{
    const b=e.target.closest(".mob-stat-item-link");
    if(!b)return;
    e.stopPropagation();
    setMode("browse");
    openEntity("item",Number(b.dataset.id));
  });
  ["mobStatsSearch","mobStatsLevel","mobStatsStars","mobStatsOpinion","mobStatsZone"].forEach(id=>{
    $(id).addEventListener(id==="mobStatsSearch"?"input":"change",renderMobStatsResults);
  });
  $("clearMobStatsBtn").addEventListener("click",()=>{
    ["mobStatsSearch","mobStatsLevel","mobStatsStars","mobStatsOpinion","mobStatsZone"].forEach(id=>$(id).value="");
    renderMobStatsResults();
  });
  $("mobStatsSearch").addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}
  });
  $("mobStatsSearch").addEventListener("search",e=>e.currentTarget.blur());


  function filterBossLoot(browser){
    if(!browser)return;
    const q=norm(browser.querySelector(".boss-loot-query")?.value);
    const cls=norm(browser.querySelector(".boss-loot-class")?.value);
    const rarity=norm(browser.querySelector(".boss-loot-rarity")?.value);
    let visibleTotal=0;

    browser.querySelectorAll(".boss-loot-group").forEach(group=>{
      let groupVisible=0;
      group.querySelectorAll(".boss-loot-item").forEach(card=>{
        const okQ=!q || (card.dataset.lootName||"").includes(q);
        const okClass=!cls || (card.dataset.lootClass||"")===cls;
        const okRarity=!rarity || (card.dataset.lootRarity||"")===rarity;
        const show=okQ&&okClass&&okRarity;
        card.hidden=!show;
        if(show){groupVisible++;visibleTotal++;}
      });

      group.hidden=groupVisible===0;
      const topCount=group.querySelector(":scope > summary .boss-loot-group-count");
      if(topCount)topCount.textContent=groupVisible;

      group.querySelectorAll(".boss-loot-class-group").forEach(classGroup=>{
        const classVisible=[...classGroup.querySelectorAll(".boss-loot-item")].filter(card=>!card.hidden).length;
        classGroup.hidden=classVisible===0;
        const count=classGroup.querySelector(":scope > summary .boss-loot-group-count");
        if(count)count.textContent=classVisible;
        if((q||cls||rarity) && classVisible)classGroup.open=true;
      });

      group.querySelectorAll(".boss-loot-rarity-group").forEach(rarityGroup=>{
        const rarityVisible=[...rarityGroup.querySelectorAll(".boss-loot-item")].filter(card=>!card.hidden).length;
        rarityGroup.hidden=rarityVisible===0;
        const count=rarityGroup.querySelector(":scope > summary .boss-loot-group-count");
        if(count)count.textContent=rarityVisible;
        if((q||cls||rarity) && rarityVisible)rarityGroup.open=true;
      });

      if((q||cls||rarity) && groupVisible)group.open=true;
    });

    const count=browser.querySelector(".boss-loot-match-count");
    if(count)count.textContent=`${visibleTotal.toLocaleString()} shown`;
    const empty=browser.querySelector(".boss-loot-empty");
    if(empty)empty.hidden=visibleTotal!==0;
  }

  document.addEventListener("input",e=>{
    if(e.target.matches(".boss-loot-query"))filterBossLoot(e.target.closest(".boss-loot-browser"));
  });
  document.addEventListener("change",e=>{
    if(e.target.matches(".boss-loot-class,.boss-loot-rarity"))filterBossLoot(e.target.closest(".boss-loot-browser"));
  });
  document.addEventListener("click",e=>{
    // Save/Favorite buttons can appear in multiple detail panels
    // (Items & Loot, Mob Stats, Quest Guides, and Favorites).
    // Handle them globally so dynamically-rendered detail views all work.
    const favorite=e.target.closest(".favorite-btn");
    if(favorite){
      e.preventDefault();
      e.stopPropagation();
      toggleFavorite(
        favorite.dataset.favoriteKind,
        Number(favorite.dataset.favoriteId)
      );
      return;
    }

    const dropper=e.target.closest(".dropper-mob-stat-link");
    if(dropper){
      const id=Number(dropper.dataset.id);
      if(mobStatsById.has(id)){
        // Make the Mob Stats list and detail panel agree on the selected mob.
        $("mobStatsSearch").value=String(id);
        ["mobStatsLevel","mobStatsStars","mobStatsOpinion","mobStatsZone"].forEach(fid=>$(fid).value="");
        setMode("mobstats");
        renderMobStatsResults();
        renderMobStatsDetail(id);
        const resultButton=document.querySelector(`#mobStatsResults [data-mob-stat-id="${id}"]`);
        if(resultButton)resultButton.scrollIntoView({block:"nearest"});
      }
      return;
    }

    const expand=e.target.closest(".boss-loot-expand");
    if(expand){
      expand.closest(".boss-loot-browser")?.querySelectorAll(".boss-loot-group:not([hidden])").forEach(x=>x.open=true);
      return;
    }
    const collapse=e.target.closest(".boss-loot-collapse");
    if(collapse){
      collapse.closest(".boss-loot-browser")?.querySelectorAll(".boss-loot-group").forEach(x=>x.open=false);
      return;
    }
    const loot=e.target.closest(".boss-loot-item");
    if(loot){
      openEntity("item",Number(loot.dataset.id),loot.dataset.target||"detailPanel");
      return;
    }
    const full=e.target.closest(".view-full-mob-stats");
    if(full){
      const id=Number(full.dataset.mobStatId);
      if(!mobStatsById.has(id))return;
      setMode("mobstats");
      renderMobStatsDetail(id);
      const resultButton=document.querySelector(`#mobStatsResults [data-mob-stat-id="${id}"]`);
      if(resultButton)resultButton.scrollIntoView({block:"nearest"});
    }
  });

  function resetDetail(){$("detailPanel").innerHTML=`<div class="empty-detail"><div class="empty-icon">⌕</div><h2>Pick an item or mob</h2><p>Items show drop sources and stats.<br>Mobs show grouped loot.</p></div>`}
  ["searchInput","typeFilter","sourceFilter","classFilter","slotFilter","levelFilter","zoneFilter"].forEach(id=>$(id).addEventListener(id==="searchInput"?"input":"change",()=>{runSearch();if(selected?.kind==="mob")renderMob(mobById.get(selected.id))}));
  // Close the mobile keyboard when Search/Enter is pressed.
  $("searchInput").addEventListener("keydown",e=>{
    if(e.key==="Enter"){e.preventDefault();e.currentTarget.blur();}
  });
  $("searchInput").addEventListener("search",e=>e.currentTarget.blur());

  updateFavoriteCount();
  runSearch();
  setMode("browse");
})();