/* Carbone table importer: robust pasted Excel/TSV/CSV/Markdown and XLSX tables.
   A source row is a building; the operation code identifies the project.
   Missing cells remain missing; never silently substituted with zero. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  root.OBSCarbonTableImport=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
'use strict';
const canonical={
 code:'Évaluation: Opération: Code interne',housing:'Évaluation: Opération: Total logements',
 comp:'IC composants bâtiment',site:'IC chantier',icDirect:'IC carbone',stock:'Stock C/m²',energy:'IC énergie bâtiment',
 egesEnergy:'Eges énergie',egesSite:'Eges chantier',eges:'Eges total'
};
for(let i=1;i<=13;i++)canonical['lot'+i]='IC lot '+i;
const aliases={
 code:['Code interne','Évaluation: Opération: Code interne','Evaluation Operation Code interne','Opération: Code interne','Code opération','Code de l’opération','ID opération','N° opération'],
 housing:['Évaluation: Opération: Total logements','Total logements','Nombre de logements','Nb logements','Total de logements'],
 comp:['IC composants bâtiment','Ic composants batiment','IC composant bâtiment','IC composants','Ic composant','IC composants bat','Ic_composants'],
 site:['IC chantier','Ic chantier bâtiment','Ic chantier batiment','IC Chantier'],
 icDirect:['IC carbone','IC construction bâtiment','IC construction batiment','IC construction','Ic construction bâtiment','IC Construction RE2020'],
 stock:['Stock C/m²','Stock C / m²','Stock C m2','Stock C','Stock carbone','Stock carbone biogénique','Carbone biogénique stocké','Stock C bâtiment'],
 energy:['IC énergie bâtiment','IC énergie','IC energie batiment','Ic energie','IC énergie bât.','Ic énergie bâtiment'],
 egesEnergy:['Eges énergie','EGES énergie','EGES energie'],
 egesSite:['Eges chantier','EGES chantier'],
 eges:['Eges total','EGES total','EGES','EGES bâtiment','Émissions GES total']
};
const norm=x=>String(x??'').replace(/^\ufeff/,'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/co₂/g,'co2').replace(/[^a-z0-9]+/g,' ').trim();
function findColumns(headers){
  const normalized=headers.map(norm),result={};
  Object.keys(canonical).forEach(k=>{
    const options=aliases[k]||[canonical[k]];
    result[k]=normalized.findIndex(h=>options.some(v=>h===norm(v)));
  });
  for(let i=1;i<=13;i++){
    const k='lot'+i;
    result[k]=normalized.findIndex(h=>{
      if(!h)return false;
      // Recognize "IC lot 1", "IC composants lot 1", "Lot 01 IC", "IC composants bâtiment - 01".
      const n=h.replace(/\b0+(\d+)\b/g,'$1');
      const explicit=/(?:^| )lot (\d{1,2})(?: |$)/.exec(n);
      if(explicit && Number(explicit[1])===i && /\bic\b/.test(n))return true;
      return n===norm(canonical[k]) || n===`ic composants batiment ${i}` || n===`ic composant batiment ${i}` || n===`ic composants ${i}` || n===`ic composant ${i}`;
    });
  }
  return result;
}
function headerCandidate(matrix){
  let best={index:-1,score:-1,mapping:{},headers:[]};
  matrix.slice(0,Math.min(30,matrix.length)).forEach((r,index)=>{
    const headers=(r||[]).map(x=>String(x??'').trim());
    if(headers.length<2)return;
    const mapping=findColumns(headers);
    const count=Object.keys(mapping).filter(k=>k!=='code'&&k!=='housing'&&mapping[k]>=0).length;
    const score=(mapping.code>=0?60:0)+(mapping.housing>=0?4:0)+count*7;
    if(score>best.score)best={index,score,mapping,headers};
  });
  return best;
}
function fieldValue(row,index){return index>=0?String(row?.[index]??'').trim():'';}
function numeric(x){
 const s=String(x??'').trim().replace(/[\s\u00a0\u202f]/g,'');
 if(!s)return null;
 let v=s.replace(/[−–]/g,'-');
 if(v.includes(',')&&v.includes('.')){v=v.lastIndexOf(',')>v.lastIndexOf('.')?v.replace(/\./g,'').replace(',','.'):v.replace(/,/g,'');}
 else if(v.includes(','))v=v.replace(',','.');
 if(!/^[+-]?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?$/i.test(v))return null;
 const n=Number(v);return Number.isFinite(n)?n:null;
}
function matrixToRows(matrix){
 const h=headerCandidate(matrix);
 if(h.index<0||h.mapping.code<0)return {rows:[],error:'Colonne « Code interne » introuvable. Importez une table avec les en-têtes, dont Évaluation: Opération: Code interne.',headers:h.headers||[],mapping:h.mapping||{},headerRow:h.index};
 const {mapping,headers}=h;
 const useful=Object.keys(mapping).filter(k=>k!=='code'&&k!=='housing'&&mapping[k]>=0);
 if(!useful.length)return {rows:[],error:'Aucune colonne carbone reconnue. Attendu : Stock C/m², IC composants bâtiment, IC chantier, IC carbone, IC énergie bâtiment, Eges total ou IC lot 1 à 13.',headers,mapping,headerRow:h.index};
 const rows=[];let ignored=0;
 for(let i=h.index+1;i<matrix.length;i++){
   const a=matrix[i]||[];
   const code=fieldValue(a,mapping.code);
   if(!code){if(a.some(v=>String(v??'').trim()))ignored++;continue;}
   if(norm(code)===norm(headers[mapping.code])||/^(total|totaux|sous total|total general)$/.test(norm(code))){ignored++;continue;}
   const val=k=>mapping[k]<0?null:numeric(fieldValue(a,mapping[k]));
   const comp=val('comp'),site=val('site'),direct=val('icDirect');
   rows.push({code,housing:val('housing'),stock:val('stock'),ic:comp!==null&&site!==null?comp+site:direct,
      comp,site,energy:val('energy'),eges:val('eges'),egesEnergy:val('egesEnergy'),egesSite:val('egesSite'),
      lots:Array.from({length:13},(_,j)=>val('lot'+(j+1))),row:i+1});
 }
 return {rows,error:rows.length?'':'Aucun bâtiment valide : toutes les lignes sont vides ou sans Code interne.',headers,mapping,headerRow:h.index,ignored};
}
function delimiterParse(text,delimiter){
 const rows=[];let row=[],cell='',quoted=false;
 for(let i=0;i<text.length;i++){
   const ch=text[i];
   if(ch==='"'){
     if(quoted&&text[i+1]==='"'){cell+='"';i++;}else quoted=!quoted;
   }else if(!quoted&&ch===delimiter){row.push(cell);cell='';}
   else if(!quoted&&(ch==='\n'||ch==='\r')){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);row=[];cell='';}
   else cell+=ch;
 }
 if(quoted)throw Error('Cellule avec guillemet non refermé dans le tableau.');
 if(cell||row.length){row.push(cell);if(row.some(v=>String(v).trim()))rows.push(row);}
 return rows;
}
function textMatrix(raw){
 const rawText=String(raw??'').replace(/^\ufeff/,'').trim();if(!rawText)return [];
 if(/^\s*\|/.test(rawText)&&/\|\s*:?-{3,}/.test(rawText)){
   return rawText.split(/\r?\n/).filter(s=>s.trim()&&!/^\s*\|?\s*:?-{3,}/.test(s))
    .map(s=>s.trim().replace(/^\||\|$/g,'').split('|').map(v=>v.trim()));
 }
 // Choose separator by most coherent columns / known business headers, not frequency
 // of commas (frequent French decimal commas could otherwise be confused with CSV delimiters).
 const candidates=['\t',';',','].map(d=>{
   try{
     const matrix=delimiterParse(rawText,d),h=headerCandidate(matrix);
     const expected=Object.values(h.mapping||{}).filter(v=>v>=0).length;
     const widths=matrix.slice(0,Math.min(15,matrix.length)).map(r=>r.length);
     const first=widths[0]||0,coherent=widths.filter(w=>w===first).length;
     return {delimiter:d,matrix,score:(h.mapping?.code>=0?100:0)+expected*10+Math.min(first,40)+coherent*2};
   }catch{return {delimiter:d,matrix:[],score:-1};}
 }).sort((a,b)=>b.score-a.score);
 if(candidates[0].score<0)throw Error('Impossible de lire le tableau. Vérifiez les séparateurs et les guillemets.');
 return candidates[0].matrix;
}
function parse(raw){try{return matrixToRows(textMatrix(raw));}catch(e){return {rows:[],error:e.message||'Tableau invalide.',headers:[],mapping:{},ignored:0};}}
function quoteCell(v,sep='\t'){
 const s=String(v??'');return /["\r\n]/.test(s)||s.includes(sep)?'"'+s.replace(/"/g,'""')+'"':s;
}
function normalizeMatrix(matrix){
 const parsed=matrixToRows(matrix);
 if(parsed.error)throw Error(parsed.error);
 const keys=Object.keys(canonical).filter(k=>parsed.mapping[k]>=0);
 const lines=[keys.map(k=>canonical[k]).join('\t')];
 for(let i=parsed.headerRow+1;i<matrix.length;i++){
  const cells=matrix[i]||[],code=fieldValue(cells,parsed.mapping.code);
  if(!code||norm(code)===norm(canonical.code)||/^(total|totaux|sous total|total general)$/.test(norm(code)))continue;
  lines.push(keys.map(k=>quoteCell(fieldValue(cells,parsed.mapping[k]))).join('\t'));
 }
 return {raw:lines.join('\n'),parsed,sourceColumns:keys,headers:parsed.headers};
}
function decodeText(bytes){
 const bytes8=new Uint8Array(bytes);
 if(bytes8[0]===0xff&&bytes8[1]===0xfe)return new TextDecoder('utf-16le').decode(bytes8);
 if(bytes8[0]===0xfe&&bytes8[1]===0xff)return new TextDecoder('utf-16be').decode(bytes8);
 const utf8=new TextDecoder('utf-8').decode(bytes8);
 // Older French Excel CSV exports may use Windows-1252 rather than UTF-8.
 return utf8.includes('\ufffd') ? new TextDecoder('windows-1252').decode(bytes8) : utf8;
}
async function readFile(file){
 if(!file||!file.name)throw Error('Aucun fichier sélectionné.');
 const ext=file.name.split('.').pop().toLowerCase();
 if(!['xlsx','csv','tsv','txt'].includes(ext))throw Error('Format non reconnu. Utilisez .xlsx, .csv ou .tsv (pas .xls).');
 if(file.size>30*1024*1024)throw Error('Fichier trop volumineux (30 Mo maximum).');
 if(ext==='xlsx'){
   if(!globalThis.OBSNexityXlsx?.open)throw Error('Lecteur de fichiers Excel indisponible. Utilisez un CSV.');
   const workbook=await globalThis.OBSNexityXlsx.open(file);let best=null;
   for(let i=0;i<workbook.sheets.length;i++){
     const sheet=await workbook.readSheet(i),matrix=sheet.matrix;
     const h=headerCandidate(matrix);const used=Object.values(h.mapping).filter(v=>v>=0).length;
     const score=(h.mapping.code>=0?100:0)+used*10;
     if(!best||score>best.score)best={score,matrix,name:workbook.sheets[i].name,formulasWithoutValue:sheet.formulasWithoutValue};
   }
   if(!best)throw Error('Le classeur est vide.');
   const result=normalizeMatrix(best.matrix);
   return {...result,source:`${file.name} · feuille ${best.name}`,formulaWarning:best.formulasWithoutValue>0?`${best.formulasWithoutValue} formule(s) sans valeur calculée (laisser manquant ou recalculer dans Excel).`:''};
 }
 const contents=decodeText(await file.arrayBuffer());
 return {...normalizeMatrix(textMatrix(contents)),source:file.name,formulaWarning:''};
}
function template(){
 const keys=Object.keys(canonical);return '\ufeff'+keys.map(k=>quoteCell(canonical[k],';')).join(';')+'\r\n';
}
return {canonical,findColumns,headerCandidate,parse,textMatrix,matrixToRows,normalizeMatrix,readFile,template,numeric};
});
