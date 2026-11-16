/* V29.19 — Slides d'analyse : taux d'abandon, volume par client et famille de MOA, évolution des certifications,
   panier moyen, taille des opérations par centile, typologies BEE Tertiaire.
   Les données viennent des opérations connectées (Observatoire), sauf le panier moyen : les montants ne passent jamais
   par le pont public de l'Observatoire, ils sont lus dans un fichier importé localement. Seules des moyennes par année /
   référentiel sont gardées dans la présentation, jamais le montant d'une opération. */
(function(){'use strict';
const TYPES=[
  {type:'abandonRate',label:'Taux d’abandon',slug:'taux-abandon'},
  {type:'moaVolume',label:'Volume par client et famille de MOA',slug:'volume-clients-familles-moa'},
  {type:'certEvolution',label:'Évolution des certifications',slug:'evolution-certifications'},
  {type:'basket',label:'Panier moyen',slug:'panier-moyen'},
  {type:'opSize',label:'Taille des opérations (centiles)',slug:'taille-operations-centiles'},
  {type:'tertiaryTypes',label:'BEE Tertiaire — typologies',slug:'bee-tertiaire-typologies'}
];
const defaults={
  abandonRate:{title:'TAUX D’ABANDON',subtitle:'Opérations annulées ou abandonnées sur les opérations engagées',showYear:true,showReferential:true,years:[],referentials:[],total:0,cancelled:0},
  moaVolume:{title:'CLIENTS ET FAMILLES DE MOA',subtitle:'Volume d’opérations par client et par famille de maître d’ouvrage',metric:'operations',topN:12,families:[],clients:[],total:0},
  certEvolution:{title:'ÉVOLUTION DES CERTIFICATIONS',subtitle:'Nombre d’opérations par année',kind:'mention',display:'count',maxSeries:8,series:{mention:[],performance:[]},years:[],yearTotals:{}},
  basket:{title:'PANIER MOYEN',subtitle:'Montant HT moyen par opération',column:'',columns:[],source:'',stats:{},showYear:true,showReferential:true},
  opSize:{title:'TAILLE MOYENNE D’UNE OPÉRATION',subtitle:'Moyenne et répartition par centile',showBuildings:true,showDwellings:true,showSurface:true,surfaceColumn:'',surfaceColumns:[],stats:{}},
  tertiaryTypes:{title:'BEE TERTIAIRE — TYPOLOGIES DE BÂTIMENT',subtitle:'Répartition des opérations tertiaires par type de programme',items:[],total:0,undetermined:0}
};
// Typologies tertiaires de l'Observatoire (Code_Operations.gs NEWOSB_PROGRAM_TYPES), dans le même ordre.
const TERTIARY=['Bureaux','Commerces','Hôtelier','Scolaire et enseignement','Résidences gérées (étudiantes, seniors, tourisme)','Santé et médico-social (cliniques, EHPAD, centres médicaux)','Locaux d’activité et industrie','Logistique (entrepôts, plateformes de distribution)','Équipements publics (culturels, sportifs, administratifs)'];
const PALETTE=['#06402B','#22825a','#5fae84','#9fd0b2','#c9a227','#e07b39','#3b6ea8','#8e5ba8','#b0413e','#6b7b74','#2a9d8f','#d4a5a5'];

// ---------- calculs ----------
const norm=s=>String(s??'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function percentile(sorted,p){ if(!sorted.length) return null; const i=(sorted.length-1)*p, lo=Math.floor(i), hi=Math.ceil(i); return sorted[lo]+(sorted[hi]-sorted[lo])*(i-lo); }
const CENTILES=[.1,.2,.3,.4,.5,.6,.7,.8,.9];
function distribution(values){
  const v=values.filter(x=>Number.isFinite(x)&&x>0).sort((a,b)=>a-b); if(!v.length) return {n:0};
  return {n:v.length,mean:v.reduce((a,b)=>a+b,0)/v.length,min:v[0],max:v[v.length-1],centiles:CENTILES.map(p=>percentile(v,p))};
}
// Valeur d'une colonne brute (première ligne non vide de l'opération).
function rawValue(o,header){ for(const r of (o.rawRows||[o.raw]||[])){ const v=r?.[header]; if(v!==undefined&&String(v).trim()!=='') return v; } return ''; }
function rawNumber(o,header,h){ const v=rawValue(o,header); if(String(v).trim()==='') return null; const n=h.dataNumber(v); return Number.isFinite(n)&&n>0?n:null; }
function rawHeaders(ops){ const s=new Set(); ops.slice(0,400).forEach(o=>(o.rawRows||[o.raw]||[]).forEach(r=>Object.keys(r||{}).forEach(k=>s.add(k)))); return [...s]; }
const SURFACE_RE=/surface|\bshab\b|\bsdp\b|\bsrt\b|\bsu\b|\bsref\b|m²|m2\b/;
const typologyHeader=hs=>hs.find(x=>/^type de programme \(calcul/.test(norm(x)))||hs.find(x=>/type de programme$/.test(norm(x)))||'';
const refName=r=>String(r||'').trim()||'Référentiel non précisé';

function aggregate(type,ops,model,h){
  if(type==='abandonRate'){
    const by=(key)=>{ const m=new Map(); ops.forEach(o=>{ const k=key(o); if(k==null||k==='') return; const x=m.get(k)||{name:String(k),total:0,cancelled:0}; x.total++; if(o.status==='cancelled') x.cancelled++; m.set(k,x); }); return [...m.values()]; };
    model.years=by(o=>o.year?Number(o.year):null).sort((a,b)=>a.name.localeCompare(b.name));
    model.referentials=by(o=>refName(o.referential)).sort((a,b)=>b.total-a.total);
    model.total=ops.length; model.cancelled=ops.filter(o=>o.status==='cancelled').length;
  }
  else if(type==='moaVolume'){
    const fam=new Map(), cli=new Map();
    ops.forEach(o=>{ const f=String(o.moaType||'').trim()||'Famille non précisée', c=String(o.moa||'').trim()||'Client non précisé', d=Math.max(0,h.dataNumber(o.dwellings));
      const x=fam.get(f)||{name:f,operations:0,dwellings:0,clients:new Set()}; x.operations++; x.dwellings+=d; x.clients.add(c); fam.set(f,x);
      const k=norm(c), y=cli.get(k)||{name:c,family:f,operations:0,dwellings:0}; y.operations++; y.dwellings+=d; cli.set(k,y); });
    model.families=[...fam.values()].map(x=>({name:x.name,operations:x.operations,dwellings:x.dwellings,clients:x.clients.size})).sort((a,b)=>b.operations-a.operations);
    model.clients=[...cli.values()].sort((a,b)=>b.operations-a.operations); model.total=ops.length;
  }
  else if(type==='certEvolution'){
    const years=[...new Set(ops.map(o=>Number(o.year)).filter(Boolean))].sort((a,b)=>a-b);
    model.years=years; model.yearTotals=Object.fromEntries(years.map(y=>[y,ops.filter(o=>Number(o.year)===y).length]));
    for(const kind of ['mention','performance']){
      const prev=new Map((model.series?.[kind]||[]).map(s=>[norm(s.name),s.show]));
      const all=h.tags(ops,kind), out=all.map((t,i)=>({name:t.name,total:t.value,show:prev.has(norm(t.name))?prev.get(norm(t.name)):i<8,values:{}}));
      years.forEach(y=>{ const oy=ops.filter(o=>Number(o.year)===y); h.tags(oy,kind).forEach(t=>{ const s=out.find(x=>norm(x.name)===norm(t.name)); if(s) s.values[y]=t.value; }); });
      model.series=model.series||{}; model.series[kind]=out;
    }
  }
  else if(type==='opSize'){
    const hs=rawHeaders(ops), cols=hs.filter(x=>SURFACE_RE.test(norm(x))).filter(c=>ops.some(o=>rawNumber(o,c,h)!==null));
    model.surfaceColumns=cols; if(!cols.includes(model.surfaceColumn)) model.surfaceColumn=cols[0]||'';
    const stats={buildings:distribution(ops.map(o=>h.dataNumber(o.buildings))),dwellings:distribution(ops.map(o=>h.dataNumber(o.dwellings)))};
    for(const c of cols) stats['surface:'+c]=distribution(ops.map(o=>rawNumber(o,c,h)));
    model.stats=stats; model.total=ops.length;
  }
  else if(type==='tertiaryTypes'){
    const tert=ops.filter(o=>/tertiaire/.test(norm(o.referential))), col=typologyHeader(rawHeaders(tert));
    const m=new Map(TERTIARY.map(n=>[norm(n),{name:n,value:0,buildings:0}])); let und=0;
    tert.forEach(o=>{ const t=String(col?rawValue(o,col):'').trim(); if(!t||/non determine/.test(norm(t))){ und++; return; }
      const k=norm(t), x=m.get(k)||{name:t,value:0,buildings:0}; x.value++; x.buildings+=Math.max(0,h.dataNumber(o.buildings)); m.set(k,x); });
    model.items=[...m.values()]; model.total=tert.length; model.undetermined=und; model.typologyColumn=col;
  }
}

// ---------- panier moyen : fichier local ----------
async function readMatrix(file){
  const ext=file.name.split('.').pop().toLowerCase();
  if(ext==='xlsx'){ if(!window.OBSNexityXlsx?.open) throw new Error('Lecteur Excel indisponible : utilise un CSV.');
    const wb=await window.OBSNexityXlsx.open(file); let best=null;
    for(let i=0;i<wb.sheets.length;i++){ const m=(await wb.readSheet(i)).matrix||[]; const hr=headerRow(m); if(hr>=0&&(!best||m.length>best.m.length)) best={m,hr}; }
    if(!best) throw new Error('Aucune colonne « Montant » trouvée dans le classeur.'); return best; }
  const text=new TextDecoder('utf-8').decode(await file.arrayBuffer()), sep=(text.split('\n')[0].match(/;/g)||[]).length>=(text.split('\n')[0].match(/,/g)||[]).length?';':',';
  const m=text.split(/\r?\n/).filter(l=>l.trim()).map(l=>{ const out=[]; let f='',q=false; for(let i=0;i<l.length;i++){ const c=l[i]; if(c==='"'){ if(q&&l[i+1]==='"'){f+='"';i++;} else q=!q; } else if((c===sep||c==='\t')&&!q){ out.push(f); f=''; } else f+=c; } out.push(f); return out; });
  const hr=headerRow(m); if(hr<0) throw new Error('Aucune colonne « Montant » trouvée dans le fichier.'); return {m,hr};
}
// En-tête : une des 30 premières lignes, avec une colonne « Montant » et au moins 5 cellules remplies (export Salesforce brut : ligne 14).
function headerRow(m){ for(let i=0;i<Math.min(30,m.length);i++){ const r=(m[i]||[]).map(x=>String(x??'').trim()); if(r.filter(Boolean).length>=5&&r.some(x=>/montant/.test(norm(x)))) return i; } return -1; }
async function importBasket(file,model,h){
  const {m,hr}=await readMatrix(file), head=m[hr].map(x=>String(x??'').trim()), idx=re=>head.findIndex(x=>re.test(norm(x)));
  const iCode=idx(/code interne|numero du contrat|contrat: numero/), iRef=idx(/referentiel/), iYear=idx(/date de creation|^annee/);
  const money=head.map((x,i)=>({x,i})).filter(c=>/montant/.test(norm(c.x)));
  const rows=m.slice(hr+1).filter(r=>r&&r.some(v=>String(v??'').trim())&&!/^(total|somme|nombre|copyright)/i.test(String(r.find(v=>String(v??'').trim())||'').trim()));
  const amount=v=>{ const n=h.dataNumber(v); return Number.isFinite(n)&&n>0?n:null; };
  const stats={};
  for(const c of money){
    // Une opération = un code (ou une ligne si pas de code) ; montant = somme de ses lignes.
    const ops=new Map(); rows.forEach((r,i)=>{ const a=amount(r[c.i]); if(a===null) return; const k=iCode>=0&&String(r[iCode]??'').trim()?String(r[iCode]).trim():'ligne'+i;
      const x=ops.get(k)||{amount:0,ref:iRef>=0?refName(r[iRef]):'',year:iYear>=0?(String(r[iYear]??'').match(/\b(19|20)\d{2}\b/)||[''])[0]:''}; x.amount+=a; ops.set(k,x); });
    const list=[...ops.values()], g=key=>{ const mm=new Map(); list.forEach(x=>{ const k=key(x); if(!k) return; (mm.get(k)||mm.set(k,[]).get(k)).push(x.amount); });
      return [...mm.entries()].map(([name,v])=>{ const d=distribution(v); return {name,n:d.n,mean:d.mean,median:d.centiles?.[4]??null}; }); };
    const all=distribution(list.map(x=>x.amount));
    stats[c.x]={n:all.n,mean:all.mean??null,median:all.centiles?.[4]??null,years:g(x=>x.year).sort((a,b)=>a.name.localeCompare(b.name)),referentials:g(x=>x.ref).sort((a,b)=>b.n-a.n)};
  }
  model.columns=money.map(c=>c.x); model.stats=stats; model.source=file.name;
  if(!model.columns.includes(model.column)) model.column=model.columns.find(x=>/commande/.test(norm(x)))||model.columns[0]||'';
  return Object.values(stats).reduce((a,s)=>Math.max(a,s.n),0);
}

// ---------- rendu ----------
function bars(items,{value,label,max,fmt,color='#22825a',sub}={}){
  const mx=max||Math.max(1,...items.map(value));
  return `<div class="an-bars">${items.map((x,i)=>`<div class="an-bar-row"><span class="an-bar-label" title="${x._t||''}">${label(x)}</span><span class="an-bar-track"><i style="width:${(Math.max(0,value(x))/mx*100).toFixed(1)}%;background:${typeof color==='function'?color(x,i):color}"></i></span><b>${fmt(x)}</b>${sub?`<small>${sub(x)}</small>`:''}</div>`).join('')}</div>`;
}
const empty=msg=>`<div class="an-empty">${msg}</div>`, emptyPage=msg=>`<div class="an-empty an-empty-page">${msg}</div>`;
const NOT_CONNECTED='Aucune donnée : connecte les données de l’Observatoire (bouton Données).';
function lineChart(years,series,{pct=false,yearTotals={}}={}){
  const W=980,H=470,L=58,R=20,T=18,B=40, val=(s,y)=>{ const v=s.values[y]||0; return pct?(yearTotals[y]?v/yearTotals[y]*100:0):v; };
  const mx=Math.max(1,...series.flatMap(s=>years.map(y=>val(s,y)))), x=i=>L+(years.length<2?(W-L-R)/2:i*(W-L-R)/(years.length-1)), yy=v=>T+(H-T-B)*(1-v/mx);
  const ticks=[0,.25,.5,.75,1].map(t=>t*mx);
  return `<svg class="an-line" viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none">
    ${ticks.map(t=>`<line x1="${L}" x2="${W-R}" y1="${yy(t)}" y2="${yy(t)}" stroke="#dfe8e4"/><text x="${L-8}" y="${yy(t)+4}" text-anchor="end" font-size="13" fill="#5b6b65">${pct?Math.round(t)+' %':Math.round(t)}</text>`).join('')}
    ${years.map((y,i)=>`<text x="${x(i)}" y="${H-12}" text-anchor="middle" font-size="14" font-weight="700" fill="#0b5d43">${y}</text>`).join('')}
    ${series.map((s,si)=>{ const c=PALETTE[si%PALETTE.length]; return `<polyline fill="none" stroke="${c}" stroke-width="3.5" points="${years.map((y,i)=>`${x(i)},${yy(val(s,y))}`).join(' ')}"/>${years.map((y,i)=>`<circle cx="${x(i)}" cy="${yy(val(s,y))}" r="5" fill="${c}"/>`).join('')}`; }).join('')}
  </svg>`;
}
function html(type,model,h){
  const {esc,frSmart,fr,head}=h, pc=(a,b)=>b?fr(a/b*100,1)+' %':'—', eur=v=>v==null?'—':Math.round(v).toLocaleString('fr-FR')+' €';
  const kpi=(l,v,s)=>`<div class="an-kpi card"><span>${esc(l)}</span><b>${v}</b>${s?`<small>${esc(s)}</small>`:''}</div>`;
  if(type==='abandonRate'){
    if(!model.total) return head(model.title,model.subtitle)+emptyPage(NOT_CONNECTED);
    const rate=x=>x.total?x.cancelled/x.total*100:0, mx=Math.max(1,...[...model.years,...model.referentials].map(rate));
    const block=(t,items)=>`<div class="an-card card"><h3>${esc(t)}</h3>${items.length?bars(items,{value:rate,max:mx,label:x=>esc(x.name),fmt:x=>pc(x.cancelled,x.total),sub:x=>`${frSmart(x.cancelled)} / ${frSmart(x.total)}`,color:'#b0413e'}):empty('Aucune donnée.')}</div>`;
    const cols=[model.showYear!==false&&block('Par année',model.years),model.showReferential!==false&&block('Par référentiel',model.referentials)].filter(Boolean);
    return `${head(model.title,model.subtitle,'','Taux = opérations annulées ou abandonnées / opérations de la période ou du référentiel.')}
      <div class="an-kpis">${kpi('TAUX D’ABANDON',pc(model.cancelled,model.total),'sur l’ensemble des opérations')}${kpi('OPÉRATIONS ABANDONNÉES',frSmart(model.cancelled),'annulées ou abandonnées')}${kpi('OPÉRATIONS',frSmart(model.total),'au total')}</div>
      <div class="an-grid an-cols-${cols.length||1}">${cols.join('')}</div>`;
  }
  if(type==='moaVolume'){
    if(!model.total) return head(model.title,model.subtitle)+emptyPage(NOT_CONNECTED);
    const met=model.metric==='dwellings'?'dwellings':'operations', unit=met==='dwellings'?'de logements':'d’opérations', tot=model.families.reduce((a,x)=>a+x[met],0);
    const famColor=new Map(model.families.map((f,i)=>[f.name,PALETTE[i%PALETTE.length]])), top=model.clients.slice().sort((a,b)=>b[met]-a[met]).slice(0,Math.max(3,Math.min(25,Math.round(model.topN)||12)));
    return `${head(model.title,model.subtitle,'',`Classement par nombre ${unit}.`)}
      <div class="an-grid an-cols-2 an-moa">
        <div class="an-card card"><h3>Par famille de MOA</h3>${bars(model.families,{value:x=>x[met],label:x=>`<i class="an-dot" style="background:${famColor.get(x.name)}"></i>${esc(x.name)}`,fmt:x=>frSmart(x[met]),sub:x=>`${pc(x[met],tot)} · ${frSmart(x.clients)} client${x.clients>1?'s':''}`,color:x=>famColor.get(x.name)})}</div>
        <div class="an-card card"><h3>Principaux clients</h3>${bars(top,{value:x=>x[met],label:x=>`<i class="an-dot" style="background:${famColor.get(x.family)}"></i>${esc(x.name)}`,fmt:x=>frSmart(x[met]),sub:x=>esc(x.family),color:x=>famColor.get(x.family)})}</div>
      </div>`;
  }
  if(type==='certEvolution'){
    const kind=model.kind==='performance'?'performance':'mention', all=(model.series?.[kind]||[]), shown=all.filter(s=>s.show).slice(0,PALETTE.length), years=model.years||[];
    if(!years.length) return head(model.title,model.subtitle)+emptyPage(NOT_CONNECTED);
    const pctMode=model.display==='share';
    return `${head(model.title,model.subtitle,'',kind==='mention'?'Mentions et labels':'Performances et niveaux')}
      <div class="an-evo card"><div class="an-evo-chart">${shown.length?lineChart(years,shown,{pct:pctMode,yearTotals:model.yearTotals}):empty('Coche au moins une série dans le panneau de droite.')}</div>
      <div class="an-legend">${shown.map((s,i)=>`<span><i style="background:${PALETTE[i%PALETTE.length]}"></i>${esc(s.name)} <b>${frSmart(s.total)}</b></span>`).join('')}</div>
      <div class="an-evo-foot">${pctMode?'Part des opérations de l’année':'Nombre d’opérations'} · ${years.map(y=>`${y} : ${frSmart(model.yearTotals?.[y]||0)} op.`).join(' · ')}</div></div>`;
  }
  if(type==='basket'){
    const s=model.stats?.[model.column];
    if(!s) return head(model.title,model.subtitle)+emptyPage('Importe un export Salesforce contenant une colonne « Montant » (panneau de droite). Le fichier reste sur ton ordinateur.');
    const block=(t,items)=>`<div class="an-card card"><h3>${esc(t)}</h3>${items.length?bars(items,{value:x=>x.mean||0,label:x=>esc(x.name),fmt:x=>eur(x.mean),sub:x=>`médiane ${eur(x.median)} · ${frSmart(x.n)} op.`}):empty('Aucune donnée.')}</div>`;
    const cols=[model.showYear!==false&&block('Par année',s.years),model.showReferential!==false&&block('Par référentiel',s.referentials)].filter(Boolean);
    return `${head(model.title,model.subtitle,'',`Colonne : ${model.column}`)}
      <div class="an-kpis">${kpi('PANIER MOYEN',eur(s.mean),'montant HT moyen par opération')}${kpi('PANIER MÉDIAN',eur(s.median),'la moitié des opérations en dessous')}${kpi('OPÉRATIONS',frSmart(s.n),'avec un montant renseigné')}</div>
      <div class="an-grid an-cols-${cols.length||1}">${cols.join('')}</div>`;
  }
  if(type==='opSize'){
    if(!model.total) return head(model.title,model.subtitle)+emptyPage(NOT_CONNECTED);
    const metrics=[model.showBuildings!==false&&['buildings','Bâtiments','bâtiments'],model.showDwellings!==false&&['dwellings','Logements','logements'],model.showSurface!==false&&model.surfaceColumn&&['surface:'+model.surfaceColumn,`Surface — ${model.surfaceColumn}`,'m²']].filter(Boolean);
    if(!metrics.length) return head(model.title,model.subtitle)+emptyPage('Coche au moins une mesure dans le panneau de droite.');
    const card=([k,l,u])=>{ const d=model.stats?.[k]; if(!d||!d.n) return `<div class="an-card card"><h3>${esc(l)}</h3>${empty('Aucune valeur.')}</div>`;
      const mx=Math.max(1,d.centiles[8]);
      return `<div class="an-card card an-size"><h3>${esc(l)}</h3><div class="an-size-kpi"><span>Moyenne <b>${frSmart(Math.round(d.mean*10)/10)}</b> ${esc(u)}</span><span>Médiane <b>${frSmart(Math.round(d.centiles[4]*10)/10)}</b></span><small>${frSmart(d.n)} opérations</small></div>
        <div class="an-cent">${d.centiles.map((v,i)=>`<div class="an-cent-col"><b>${frSmart(Math.round(v))}</b><i style="height:${(v/mx*100).toFixed(1)}%"></i><span>P${(i+1)*10}</span></div>`).join('')}</div></div>`; };
    return `${head(model.title,model.subtitle,'','P10 : 10 % des opérations sont plus petites ; P50 = médiane ; P90 : 90 % sont plus petites.')}
      <div class="an-grid an-cols-${metrics.length}">${metrics.map(card).join('')}</div>`;
  }
  if(type==='tertiaryTypes'){
    if(!model.total) return head(model.title,model.subtitle)+emptyPage('Aucune opération BEE Tertiaire dans les données connectées.');
    const det=model.items.filter(x=>x.value>0).sort((a,b)=>b.value-a.value), known=model.total-model.undetermined;
    return `${head(model.title,model.subtitle,'',model.typologyColumn?'':'Colonne « Type de programme (calculé) » absente des données.')}
      <div class="an-kpis">${kpi('OPÉRATIONS TERTIAIRES',frSmart(model.total),'référentiels BEE Tertiaire')}${kpi('TYPOLOGIE DÉTERMINÉE',frSmart(known),pc(known,model.total)+' des opérations')}${kpi('1RE TYPOLOGIE',det[0]?frSmart(det[0].value):'—',det[0]?.name||'')}</div>
      <div class="an-card card an-wide">${det.length?bars(det,{value:x=>x.value,label:x=>esc(x.name),fmt:x=>frSmart(x.value),sub:x=>`${pc(x.value,known)} · ${frSmart(x.buildings)} bât.`}):empty('Aucune typologie déterminée.')}
      ${model.undetermined?`<div class="an-note">${frSmart(model.undetermined)} opération${model.undetermined>1?'s':''} sans typologie déterminée (non représentée${model.undetermined>1?'s':''}).</div>`:''}</div>`;
  }
  return '';
}
function controls(type,model,h){
  const {field,selectField,toggleField,esc,frSmart}=h, p=k=>`${type}.${k}`;
  const texts=`<div class="control-section"><h3>Textes</h3>${field('Titre',p('title'),'text')}${field('Sous-titre',p('subtitle'),'text')}</div>`;
  if(type==='abandonRate') return texts+`<div class="control-section"><h3>Affichage</h3>${toggleField('Par année',p('showYear'))}${toggleField('Par référentiel',p('showReferential'))}<p class="help">Statut « annulé » ou « abandonné » de l’évaluation. Année : colonne Année, sinon date de création.</p></div>`;
  if(type==='moaVolume') return texts+`<div class="control-section"><h3>Affichage</h3>${selectField('Mesure',p('metric'),[{value:'operations',label:'Nombre d’opérations'},{value:'dwellings',label:'Nombre de logements'}])}${field('Nombre de clients affichés (3 à 25)',p('topN'),'number',{step:'1',min:3,max:25})}<p class="help">Famille : colonne « Maître d’ouvrage : Hiérarchie » / « Type MOA ».</p></div>`;
  if(type==='certEvolution'){ const kind=model.kind==='performance'?'performance':'mention', list=model.series?.[kind]||[];
    return texts+`<div class="control-section"><h3>Données</h3>${selectField('Suivre',p('kind'),[{value:'mention',label:'Mentions et labels'},{value:'performance',label:'Performances et niveaux'}])}${selectField('Valeur',p('display'),[{value:'count',label:'Nombre d’opérations'},{value:'share',label:'Part des opérations de l’année'}])}</div>
      <div class="control-section"><h3>Séries affichées</h3>${list.length?list.map((s,i)=>toggleField(`${s.name} (${frSmart(s.total)})`,`${type}.series.${kind}.${i}.show`)).join(''):'<p class="help">Aucune série : connecte les données.</p>'}<p class="help">12 séries au plus sur le graphique.</p></div>`; }
  if(type==='basket') return texts+`<div class="control-section"><h3>Fichier des montants</h3><p class="help">Export Salesforce (.xlsx ou .csv) avec une colonne « Montant HT ». Le fichier est lu dans ton navigateur et n’est jamais envoyé ni publié : seules les moyennes par année et par référentiel sont gardées.</p>
      <div class="field"><input type="file" accept=".xlsx,.csv,.txt" data-analytics-file="basket"></div>${model.source?`<p class="help">Source : ${esc(model.source)}</p>`:''}
      ${model.columns?.length?selectField('Colonne de montant',p('column'),model.columns.map(c=>({value:c,label:c}))):''}</div>
      <div class="control-section"><h3>Affichage</h3>${toggleField('Par année',p('showYear'))}${toggleField('Par référentiel',p('showReferential'))}</div>`;
  if(type==='opSize') return texts+`<div class="control-section"><h3>Mesures affichées</h3>${toggleField('Nombre de bâtiments',p('showBuildings'))}${toggleField('Nombre de logements',p('showDwellings'))}${toggleField('Surface',p('showSurface'))}
      ${model.surfaceColumns?.length?selectField('Colonne de surface',p('surfaceColumn'),model.surfaceColumns.map(c=>({value:c,label:c}))):'<p class="help">Aucune colonne de surface chiffrée dans les données connectées.</p>'}</div>`;
  if(type==='tertiaryTypes') return texts+`<div class="control-section"><p class="help">Opérations dont le référentiel contient « Tertiaire ». Typologie : colonne « Type de programme (calculé) » de l’Observatoire.</p></div>`;
  return texts;
}
window.OBSAnalytics={TYPES,defaults,aggregate,html,controls,importBasket,_test:{percentile,distribution,headerRow}};
})();
