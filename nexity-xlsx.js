/* Read-only XLSX reader. Native ZIP decompression; never evaluates formulas.
   Supports OOXML .xlsx only. CSV / TSV / pasted Excel are alternatives. */
(function(){'use strict';
const decoder=new TextDecoder('utf-8');
const MAX_FILE=30*1024*1024,MAX_PART=60*1024*1024,MAX_TOTAL=160*1024*1024,MAX_ROWS=50000,MAX_CELLS=800000;
const fail=s=>{throw new Error(s);};
function xml(s){if(/<!DOCTYPE|<!ENTITY/i.test(s))fail('Declaration XML non autorisee.');const d=new DOMParser().parseFromString(s,'application/xml');if(d.getElementsByTagName('parsererror').length)fail('XML Excel invalide.');return d;}
const els=(n,k)=>Array.from(n.getElementsByTagNameNS('*',k));
function col(ref){let n=0;for(const c of (ref.match(/^[A-Z]+/i)?.[0]||'A').toUpperCase())n=n*26+c.charCodeAt(0)-64;return n-1;}
function pos(ref){return{r:Number(ref.match(/\d+$/)?.[0]||1)-1,c:col(ref)};}
function normalizePath(p){const out=[];p.split('/').forEach(x=>{if(x==='..')out.pop();else if(x&&x!=='.')out.push(x);});return out.join('/');}
async function open(file){
 if(file.size>MAX_FILE)fail('Fichier trop volumineux (maximum 30 Mo).');
 const bytes=new Uint8Array(await file.arrayBuffer()),v=new DataView(bytes.buffer);let end=-1;
 for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--){if(v.getUint32(i,true)===0x06054b50){end=i;break;}}
 if(end<0)fail('Ce fichier n\u2019est pas un XLSX lisible. Enregistrer au format .xlsx ou CSV.');
 if(v.getUint16(end+4,true)||v.getUint16(end+6,true))fail('Archives ZIP multi-volumes non prises en charge.');
 const count=v.getUint16(end+10,true);let at=v.getUint32(end+16,true);let total=0;const entries=new Map();
 if(count===65535||at===0xffffffff)fail('XLSX ZIP64 non pris en charge. Utiliser CSV.');
 for(let i=0;i<count;i++){
  if(at+46>bytes.length||v.getUint32(at,true)!==0x02014b50)fail('Archive Excel endommagee.');
  const flags=v.getUint16(at+8,true),method=v.getUint16(at+10,true),size=v.getUint32(at+20,true),expanded=v.getUint32(at+24,true),nl=v.getUint16(at+28,true),el=v.getUint16(at+30,true),cl=v.getUint16(at+32,true),offset=v.getUint32(at+42,true);
  const name=decoder.decode(bytes.subarray(at+46,at+46+nl));if(flags&1)fail('Fichier chiffre : fournir une copie non protegee.');
  total+=expanded;if(expanded>MAX_PART||total>MAX_TOTAL)fail('Classeur trop volumineux une fois decompresse.');
  entries.set(name,{method,size,expanded,offset});at+=46+nl+el+cl;
 }
 const cache=new Map();
 async function text(name,optional=false){
  if(cache.has(name))return cache.get(name);const e=entries.get(name);if(!e){if(optional)return'';fail('Composant XLSX introuvable : '+name);}
  const h=e.offset;if(h+30>bytes.length||v.getUint32(h,true)!==0x04034b50)fail('Entete ZIP invalide.');
  const start=h+30+v.getUint16(h+26,true)+v.getUint16(h+28,true);if(start+e.size>bytes.length)fail('Donnees ZIP tronquees.');
  let out;if(e.method===0)out=bytes.slice(start,start+e.size);else if(e.method===8){
   let ds;try{ds=new DecompressionStream('deflate-raw');}catch{fail('Lecture XLSX indisponible dans ce navigateur. Utiliser le collage Excel ou un CSV.');}
   const reader=new Blob([bytes.subarray(start,start+e.size)]).stream().pipeThrough(ds).getReader();const chunks=[];let size=0;
   try{while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>MAX_PART||size>e.expanded+1024){await reader.cancel();fail('Taille de decompression incoherente.');}chunks.push(r.value);}}finally{reader.releaseLock();}
   out=new Uint8Array(size);let p=0;for(const c of chunks){out.set(c,p);p+=c.length;}
  }else fail('Compression ZIP non prise en charge. Utiliser CSV.');
  if(out.length!==e.expanded)fail('Taille de composant Excel incoherente.');const s=decoder.decode(out);cache.set(name,s);return s;
 }
 const w=xml(await text('xl/workbook.xml')),rels=xml(await text('xl/_rels/workbook.xml.rels'));
 const relation=new Map(els(rels,'Relationship').filter(e=>e.getAttribute('TargetMode')!=='External').map(e=>[e.getAttribute('Id'),normalizePath((e.getAttribute('Target')||'').startsWith('/')?e.getAttribute('Target'):'xl/'+e.getAttribute('Target'))]));
 const sheets=els(w,'sheet').map(e=>({name:e.getAttribute('name')||'Feuille',path:relation.get(e.getAttribute('r:id')||e.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships','id'))})).filter(e=>e.path);
 const ss=await text('xl/sharedStrings.xml',true);const strings=ss?els(xml(ss),'si').map(e=>els(e,'t').map(t=>t.textContent).join('')):[];
 const st=await text('xl/styles.xml',true);let fmts=[],date1904=els(w,'workbookPr')[0]?.getAttribute('date1904')==='1';
 if(st){const d=xml(st);const formats=new Map(els(d,'numFmt').map(e=>[Number(e.getAttribute('numFmtId')),e.getAttribute('formatCode')||'']));const list=els(d,'cellXfs')[0];fmts=list?Array.from(list.children).map(e=>{const id=Number(e.getAttribute('numFmtId')),fmt=formats.get(id)||'';return{date:(id>=14&&id<=22)||/[yd]/i.test(fmt.replace(/"[^"]*"|\[[^\]]*\]/g,'')),zero:/^0{2,}$/.test(fmt)?fmt.length:0};}):[];}
 async function readSheet(index){const sh=sheets[index];if(!sh)fail('Feuille introuvable.');const d=xml(await text(sh.path));const matrix=[];let n=0,formulasWithoutValue=0;const merges=[];
  for(const row of els(d,'row')){const ri=Number(row.getAttribute('r')||matrix.length+1)-1;if(ri>=MAX_ROWS)fail('Plus de 50 000 lignes : reduire le perimetre avant import.');if(ri<0)continue;const rr=[];
   for(const c of Array.from(row.children).filter(e=>e.localName==='c')){if(++n>MAX_CELLS)fail('Trop de cellules : extraire les colonnes utiles dans un CSV.');const ci=col(c.getAttribute('r')||'A');if(ci>16383)fail('Colonne Excel invalide.');const type=c.getAttribute('t')||'',value=els(c,'v')[0]?.textContent??'',f=els(c,'f').length>0;let s=value;
    if(type==='s')s=strings[Number(value)]??'';else if(type==='inlineStr')s=els(c,'t').map(t=>t.textContent).join('');else if(type==='b')s=value==='1'?'TRUE':'FALSE';else if(type==='e')s='';else if(!type||type==='n'){const fmt=fmts[Number(c.getAttribute('s')||0)];if(value&&fmt?.date&&Number.isFinite(Number(value))){const epoch=Date.UTC(date1904?1904:1899,date1904?0:11,date1904?1:30);s=new Date(epoch+Number(value)*86400000).toISOString().slice(0,10);}else if(value&&fmt?.zero&&/^\d+$/.test(value))s=value.padStart(fmt.zero,'0');}
    if(f&&!value)formulasWithoutValue++;rr[ci]=s;
   }matrix[ri]=rr;
  }
  for(const e of els(d,'mergeCell')){const [a,b]=(e.getAttribute('ref')||'').split(':');if(a&&b)merges.push({a:pos(a),b:pos(b)});}
  return{matrix,merges,formulasWithoutValue};
 }
 return{sheets,readSheet};
}
window.OBSNexityXlsx={open};
})();
