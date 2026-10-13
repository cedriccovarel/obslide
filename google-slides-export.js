/* Obslide V29.7.29 - Export haute fidelite Google Slides / PowerPoint.
 * Textes natifs editables; SVG natifs et objets simples PPTX conserves en vecteurs.
 * Logos connus retraces par contours; logos personnalises conserves intacts.
 * Google Slides peut rasteriser certains SVG lors de la conversion PPTX.
 */
(() => {
  'use strict';
  const SIZE = { width: 1600, height: 900, pptWidth: 13.3333333333, pptHeight: 7.5 };
  const SCALE = SIZE.pptWidth / SIZE.width;
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const COLORS = { bg:'FFFFFF', green:'06402B' };
  const VECTOR_LOGOS = {
    'prestaterre_logo_green.png':'assets/prestaterre_logo_green_traced.svg',
    'prestaterre_logo_black.png':'assets/prestaterre_logo_black_traced.svg',
    'cover_action_logement.png':'assets/cover_action_logement_traced.svg'
  };
  const svgCache = new Map();
  const px = n => Math.max(0,Number(n)||0) * SCALE;
  const normalizeText = t => String(t||'').replace(/\s+/g,' ').trim();
  const rgb = (value, fallback) => {
    const s=String(value||'').trim();
    if (s === 'transparent' || s === 'none' || /^rgba\([^)]*,\s*0(?:\.0+)?\)$/.test(s)) return null;
    if (/^#[a-f\d]{3,8}$/i.test(s)) {let h=s.slice(1);if(h.length===3)h=h.split('').map(x=>x+x).join('');return h.slice(0,6).toUpperCase();}
    const m=s.match(/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)(?:\s*[,/]\s*([\d.]+))?/i);
    if(m){if(m[4]!==undefined&&Number(m[4])<.03)return null;return [m[1],m[2],m[3]].map(x=>Math.max(0,Math.min(255,+x)).toString(16).padStart(2,'0')).join('').toUpperCase();}
    return fallback||null;
  };
  function relativeRect(element,origin) {
    const b=element.getBoundingClientRect();
    return {x:(b.left-origin.left)*1600/origin.width,y:(b.top-origin.top)*900/origin.height,w:b.width*1600/origin.width,h:b.height*900/origin.height};
  }
  const visible = node => {
    const s=getComputedStyle(node);return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>.015;
  };
  const inside = r => r.w>.2&&r.h>.2&&r.x<SIZE.width&&r.y<SIZE.height&&r.x+r.w>0&&r.y+r.h>0;
  function clip(r) {
    const x=Math.max(0,r.x),y=Math.max(0,r.y),x1=Math.min(1600,r.x+r.w),y1=Math.min(900,r.y+r.h);
    if(x1<=x||y1<=y)return null;return {x,y,w:x1-x,h:y1-y};
  }
  function shapeOptions(r){const c=clip(r);if(!c)return null;return {x:px(c.x),y:px(c.y),w:px(c.w),h:px(c.h)};}
  async function vectorLogo(name) {
    const url=VECTOR_LOGOS[name];if(!url)return null;
    if(svgCache.has(url))return svgCache.get(url);
    try{const result=await fetch(url).then(r=>{if(!r.ok)throw Error('SVG inaccessible');return r.text()});svgCache.set(url,result);return result;}catch(e){console.warn('Logo SVG:',url,e);return null;}
  }
  function dataUri(svg){return 'data:image/svg+xml;base64,'+btoa(unescape(encodeURIComponent(svg)));}
  async function loadToDataUrl(url){
    if(!url)return null;if(url.startsWith('data:'))return url;
    try{const blob=await fetch(url).then(r=>{if(!r.ok)throw Error('Image inaccessible');return r.blob()});return await new Promise((resolve,reject)=>{const fr=new FileReader();fr.onload=()=>resolve(fr.result);fr.onerror=reject;fr.readAsDataURL(blob);});}catch(e){console.warn('Image omise dans PPTX :',url,e);return null;}
  }
  function imageName(url){try{return new URL(url,document.baseURI).pathname.split('/').pop()}catch(e){return String(url||'').split('/').pop().split('?')[0]}}
  // Never convert a custom logo into a mosaic of colour tiles. Keep the original
  // pixels (lossless PNG) or original SVG rather than invent a low-quality trace.
  const isSvgData = value => /^data:image\/svg\+xml/i.test(String(value||''));
  async function svgAsset(url) {
    if (!url) return null;
    if (isSvgData(url)) return url;
    if (!/\.svg(?:[?#]|$)/i.test(String(url))) return null;
    try {
      const svg=await fetch(url).then(r=>{if(!r.ok)throw Error('Source SVG indisponible');return r.text()});
      if (!/<svg\b/i.test(svg) || /<script\b|<foreignObject\b/i.test(svg)) return null;
      return dataUri(svg);
    } catch(e) { console.warn('SVG original inaccessible:',url,e); return null; }
  }
  function fittedImageBox(box,el) {
    if (!el || !el.naturalWidth || !el.naturalHeight) return box;
    const fit=getComputedStyle(el).objectFit;
    if (fit!=='contain' && fit!=='scale-down') return box;
    const ir=el.naturalWidth/el.naturalHeight, br=box.w/box.h;
    if(ir>br){ const h=box.w/ir;return {...box,y:box.y+(box.h-h)/2,h}; }
    const w=box.h*ir; return {...box,x:box.x+(box.w-w)/2,w};
  }
  async function addImage(slide,url,r,name,knownLogo,element) {
    let box=shapeOptions(r);if(!box||box.w<.01||box.h<.01)return;
    box=fittedImageBox(box,element);
    const logoName=name||imageName(url);
    // The three official logos use clean contour SVGs; they contain no bitmap pixels.
    if(VECTOR_LOGOS[logoName]){
      const vector=await vectorLogo(logoName);
      if(vector){slide.addImage({data:dataUri(vector),...box});return;}
    }
    // SVG supplied by a user is the reference master; never rasterize it.
    const svg=await svgAsset(url);
    if(svg){try{slide.addImage({data:svg,...box});return;}catch(e){console.warn('SVG original invalide:',e)}}
    // Unknown/custom logo: preserve original high-resolution bytes as-is.
    const data=await loadToDataUrl(url);
    if(data)try{slide.addImage({data,...box})}catch(err){console.warn('Image PPTX omise:',err)}
  }
  function addRectangle(slide,r,cs,fullSlide) {
    if(!inside(r))return;
    const bg=rgb(cs.backgroundColor),lineColor=rgb(cs.borderTopColor);
    const border=Number.parseFloat(cs.borderTopWidth)||0;
    if(!bg && !(border>.4&&cs.borderTopStyle!=='none'&&lineColor))return;
    if(r.w<3||r.h<3)return;
    if(fullSlide && !bg)return;
    const box=shapeOptions(r);if(!box)return;
    const corner=parseFloat(cs.borderTopLeftRadius)||0;
    let shp = corner>=5?'roundRect':'rect';
    // Shadow and CSS gradients are deliberately skipped rather than rasterized.
    slide.addShape(shp,{
      ...box,
      rectRadius:px(Math.min(corner,Math.min(r.w,r.h)/2)),
      line: {color:lineColor||bg||'FFFFFF',width:border>0?Math.min(2,border*.55):0,transparency:border?0:100},
      fill: {color:bg||'FFFFFF',transparency:bg?0:100},
      rotate:0
    });
  }
  function splitCssComma(s){
    const chunks=[];let depth=0,start=0;
    for(let i=0;i<s.length;i++){
      if(s[i]==='(')depth++;else if(s[i]===')')depth--;
      else if(s[i]===',' && depth===0){chunks.push(s.slice(start,i).trim());start=i+1;}
    }
    chunks.push(s.slice(start).trim());return chunks;
  }
  function addCssGradient(slide,r,cs){
    const bg=cs.backgroundImage||'';
    if(!/^linear-gradient\(/i.test(bg)||!bg.endsWith(')'))return false;
    const args=splitCssComma(bg.slice(bg.indexOf('(')+1,-1));
    if(args.length<2)return false;
    let deg=180;
    const first=args[0].match(/^(-?[\d.]+)deg$/);
    if(first){deg=Number(first[1]);args.shift();}
    else if(/^to\s+/i.test(args[0])){
      const dir=args.shift().toLowerCase();deg=dir.includes('right')?90:dir.includes('left')?270:dir.includes('top')?0:180;
    }
    if(args.length<2)return false;
    const stops=[];
    for(const token of args){
      const m=token.match(/^(#[0-9a-f]{3,8}|rgba?\([^)]*\))\s*(?:([\d.]+)%)?$/i);
      if(!m)return false;
      const col=rgb(m[1]);if(!col)return false;
      stops.push({col,offset:m[2]===undefined?null:Number(m[2])});
    }
    if(stops.length>30)return false;
    for(let i=0;i<stops.length;i++){
      if(stops[i].offset!==null)continue;
      let prev=i-1;while(prev>=0&&stops[prev].offset===null)prev--;
      let next=i+1;while(next<stops.length&&stops[next].offset===null)next++;
      const start=prev>=0?stops[prev].offset:0;
      const end=next<stops.length?stops[next].offset:100;
      stops[i].offset=start+(end-start)*(i-prev)/(next-prev);
    }
    // CSS angles: 90deg from left to right, 180deg from top to bottom.
    const theta=deg*Math.PI/180,sn=Math.sin(theta),co=Math.cos(theta);
    const xy=[50-50*sn,50+50*co,50+50*sn,50-50*co].map(v=>`${v.toFixed(3)}%`);
    const rx=Math.max(0,Math.min(parseFloat(cs.borderTopLeftRadius)||0,Math.min(r.w,r.h)/2));
    const stopsSvg=stops.map(s=>`<stop offset="${Math.max(0,Math.min(100,s.offset))}%" stop-color="#${s.col}"/>`).join('');
    const content=`<svg xmlns="${SVG_NS}" viewBox="0 0 ${r.w} ${r.h}" width="${r.w}" height="${r.h}"><defs><linearGradient id="bg" x1="${xy[0]}" y1="${xy[1]}" x2="${xy[2]}" y2="${xy[3]}">${stopsSvg}</linearGradient></defs><rect width="100%" height="100%" rx="${rx}" fill="url(#bg)"/></svg>`;
    const box=shapeOptions(r);if(!box)return false;
    try{slide.addImage({data:dataUri(content),...box});return true;}
    catch(e){console.warn('Degrade CSS omis:',e);return false;}
  }
  function addText(slide,text,r,style,{svgText=false,anchor=null}={}) {
    const clean=normalizeText(text);if(!clean||!inside(r))return;
    // Ignore single separators and text nodes too narrow to remain useful.
    if(r.w<1||r.h<1)return;
    const box=shapeOptions({x:r.x-1,y:r.y-1,w:r.w+2,h:r.h+2});if(!box)return;
    const fontCSS = Number.parseFloat(style.fontSize)||15;
    const fontPt = Math.max(5,Math.min(62,fontCSS*.6));
    const align = (anchor==='middle'||style.textAlign==='center')?'center':(anchor==='end'||style.textAlign==='right'?'right':'left');
    const c=rgb(svgText?(style.fill||style.color):(style.color||style.fill),'173B3F')||'173B3F';
    const ff=(style.fontFamily||'Arial').split(',')[0].replace(/['"]/g,'').trim()||'Arial';
    const weight=Number(style.fontWeight)|| (/(bold)/i.test(style.fontWeight||'')?700:400);
    try{
      slide.addText(clean,{
        ...box,
        color:c,fontFace:ff,fontSize:fontPt,bold:weight>=600,
        breakLine:false,margin:0,align,vertAlign:'mid',
        transparency:0,isTextBox:true,
        lineSpacingMultiple:1,
        fit:'shrink'
      });
    }catch(err){console.warn('Texte PPTX omis:',clean.slice(0,40),err)}
  }
  function cssTextNodes(el) {
    const found=[];
    for(const node of el.childNodes){
      if(node.nodeType!==Node.TEXT_NODE||!normalizeText(node.textContent))continue;
      const rg=document.createRange();rg.selectNodeContents(node);
      const rects=[...rg.getClientRects()].filter(r=>r.width>.2&&r.height>.2);
      if(rects.length){
        // Multi-line DOM text is kept in a single edit box. Bounding rectangle follows actual layout.
        let l=Math.min(...rects.map(x=>x.left)),t=Math.min(...rects.map(x=>x.top)),r=Math.max(...rects.map(x=>x.right)),b=Math.max(...rects.map(x=>x.bottom));
        found.push({value:node.textContent,bounds:{left:l,top:t,width:r-l,height:b-t}});
      }
    }
    return found;
  }
  const absoluteRect=(b,o)=>({x:(b.left-o.left)*1600/o.width,y:(b.top-o.top)*900/o.height,w:b.width*1600/o.width,h:b.height*900/o.height});
  function classifySvgContent(svg) {
    const clone=svg.cloneNode(true);
    clone.setAttribute('xmlns',SVG_NS);
    clone.setAttribute('xmlns:xlink','http://www.w3.org/1999/xlink');
    const vb=svg.viewBox&&svg.viewBox.baseVal;
    if(!clone.hasAttribute('viewBox') && vb && vb.width>0&&vb.height>0)
      clone.setAttribute('viewBox',`${vb.x} ${vb.y} ${vb.width} ${vb.height}`);
    if (!clone.getAttribute('width') && vb?.width) clone.setAttribute('width',vb.width);
    if (!clone.getAttribute('height') && vb?.height) clone.setAttribute('height',vb.height);
    const originals=[svg,...svg.querySelectorAll('*')];
    const copies=[clone,...clone.querySelectorAll('*')];
    const presentationProps=['fill','stroke','strokeWidth','strokeLinecap','strokeLinejoin',
      'strokeDasharray','strokeDashoffset','strokeMiterlimit','opacity','fillOpacity',
      'strokeOpacity','fillRule','clipRule','paintOrder','vectorEffect','shapeRendering',
      'stopColor','stopOpacity','color','display','visibility'];
    originals.forEach((node,i)=>{
      const dest=copies[i];if(!dest)return;
      if(!['svg','path','rect','circle','ellipse','polygon','polyline','line','g','use',
        'stop','linearGradient','radialGradient','pattern'].includes(node.localName))return;
      const cs=getComputedStyle(node);
      presentationProps.forEach(prop=>{
        const attr=prop.replace(/[A-Z]/g,c=>'-'+c.toLowerCase());
        let value=cs[prop];
        if(!value||value==='initial'||value==='normal'||value==='auto')return;
        // Styles from the live page are made explicit so external CSS is not needed.
        // Existing SVG paint servers (url(#gradient)) and clipping references remain intact.
        dest.setAttribute(attr,value);
      });
    });
    // Labels are rebuilt as editable PowerPoint text, independently of the vector geometry.
    clone.querySelectorAll('script,foreignObject,text,tspan,title,desc').forEach(x=>x.remove());
    return clone;
  }
  function cleanSvg(svg){
    return new XMLSerializer().serializeToString(svg)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
      .replace(/\s+on\w+="[^"]*"/gi,'');
  }
  function getSvgTextLayers(svg,origin){
    const out=[];
    const texts=Array.from(svg.querySelectorAll('text'));
    for(const element of texts){
      const children=[...element.querySelectorAll('tspan')];
      const targets=children.length?children:[element];
      for(const t of targets){
        const content=normalizeText(t.textContent);if(!content)continue;
        let r=relativeRect(t,origin);
        if(r.w<.2||r.h<.2)continue;
        const cs=getComputedStyle(t);
        out.push({text:content,rect:r,font:{fontSize:cs.fontSize,fontWeight:cs.fontWeight,fontFamily:cs.fontFamily,fill:cs.fill!=='none'?cs.fill:cs.color},anchor:t.getAttribute('text-anchor')||element.getAttribute('text-anchor')||cs.textAnchor});
      }
    }
    return out;
  }
  function svgEmbeddedImageElements(svg,origin,logoData) {
    return Array.from(svg.querySelectorAll('image')).map(el=>({el,url:el.getAttribute('href')||el.getAttribute('xlink:href')||'',r:relativeRect(el,origin),knownLogo:!!logoData&& (el.getAttribute('href')===logoData||el.getAttribute('xlink:href')===logoData)}));
  }
  async function inlineSvgImages(svg,geometry,logoData) {
    const originalImages=Array.from(svg.querySelectorAll('image'));
    const clonedImages=Array.from(geometry.querySelectorAll('image'));
    const out=[];
    for(let i=0;i<originalImages.length;i++){
      const orig=originalImages[i], cloned=clonedImages[i]; if(!cloned)continue;
      const href=orig.getAttribute('href')||orig.getAttribute('xlink:href')||'';
      if (logoData && href===logoData){
        out.push({el:orig,url:href,knownLogo:true});cloned.remove();continue;
      }
      if(!href.startsWith('data:')){
        const embedded=await loadToDataUrl(href);
        if(embedded)cloned.setAttribute('href',embedded);
        else {out.push({el:orig,url:href,knownLogo:false});cloned.remove();}
      }
    }
    return out;
  }
  function simpleNativeSvg(slide,svg,origin){
    const children=[...svg.querySelectorAll('*')];
    const tags=new Set(['g','rect','circle','ellipse','line','text','tspan','title','desc']);
    if(children.length>300 || children.some(e=>!tags.has(e.localName) ||
      (e.localName==='g' && getComputedStyle(e).opacity!=='1') ||
      e.hasAttribute('transform') || e.hasAttribute('clip-path') || e.hasAttribute('mask') ||
      /url\(/.test(getComputedStyle(e).fill||'')))return false;
    const geometries=children.filter(e=>['rect','circle','ellipse','line'].includes(e.localName));
    if(!geometries.length)return false;
    // Native PowerPoint primitives remain resolution-independent and can be
    // individually selected/recoloured after importing the PPTX into Google Slides.
    for(const e of geometries){
      const cs=getComputedStyle(e); const rect=relativeRect(e,origin);
      if(rect.x<-2||rect.y<-2||rect.x+rect.w>1602||rect.y+rect.h>902) return false;
      const c=rgb(cs.fill),stroke=rgb(cs.stroke), sw=parseFloat(cs.strokeWidth)||0;
      let kind=e.localName==='rect' ? ((parseFloat(e.getAttribute('rx'))||parseFloat(e.getAttribute('ry'))||0)>0?'roundRect':'rect') : e.localName==='line'?'line':'ellipse';
      const op=Math.min(1,Math.max(0,parseFloat(cs.opacity)||1));
      const fillTransparency=c ? Math.round((1-(parseFloat(cs.fillOpacity)||1)*op)*100) : 100;
      const lineTransparency=stroke ? Math.round((1-(parseFloat(cs.strokeOpacity)||1)*op)*100) : 100;
      const sizing=shapeOptions({x:rect.x,y:rect.y,w:Math.max(.02,rect.w),h:Math.max(.02,rect.h)});
      if(!sizing)continue;
      try{
        slide.addShape(kind,{...sizing,
          line:{color:stroke||'FFFFFF',width:sw*.6,transparency:lineTransparency},
          fill:{color:c||'FFFFFF',transparency:fillTransparency},
          radius:parseFloat(e.getAttribute('rx'))||0
        });
      } catch(err){console.warn('Objet natif PPTX:',err);return false;}
    }
    return true;
  }
  async function addSvg(slide,svg,origin,logoData){
    const r=relativeRect(svg,origin);if(!inside(r))return;
    const geometry=classifySvgContent(svg);
    const rasterElements=await inlineSvgImages(svg,geometry,logoData);
    // For simple geometry export PPTX-native editable rectangles/ellipses/lines.
    // For complex graphs preserve full source path precision, gradients, clipPaths
    // and stroke styles as an untouched scalable SVG instead of screenshotting it.
    const nativeDone=rasterElements.length===0 && simpleNativeSvg(slide,svg,origin);
    if(!nativeDone){
      const content=cleanSvg(geometry);
      if(/<(?:path|rect|circle|line|polygon|polyline|ellipse|use|image|g)\b/i.test(content)){
        const box=shapeOptions(r);
        if(box)try{slide.addImage({data:dataUri(content),...box});}catch(err){console.warn('Graphe vectoriel non insere',err)}
      }
    }
    for(const l of rasterElements){
      await addImage(slide,l.url,relativeRect(l.el,origin),l.knownLogo?'logo-personnalise.png':null,l.knownLogo);
    }
    for(const txt of getSvgTextLayers(svg,origin))addText(slide,txt.text,txt.rect,txt.font,{svgText:true,anchor:txt.anchor});
  }
  async function addHtmlSlide(pptxSlide,root,options={}){
    const origin=root.getBoundingClientRect();
    if(origin.width<5||origin.height<5)throw Error('Slide non visible. Vérifie le mode présentation et réessaie.');
    pptxSlide.background={color:'FFFFFF'};
    let nodes=0;
    async function visit(el){
      if(++nodes>5500)return;
      if(!visible(el))return;
      const tag=el.tagName.toLowerCase();
      const r=relativeRect(el,origin);
      if(tag==='svg'){await addSvg(pptxSlide,el,origin,options.logoData);return;}
      if(tag==='img'){
        const src=el.currentSrc||el.src||el.getAttribute('src');
        const name=imageName(el.getAttribute('src')||src);
        const logoLikely=/logo|marque/i.test(String(el.alt||'')+' '+String(el.className||'')+' '+String(el.parentElement?.className||''));
        await addImage(pptxSlide,src,r,VECTOR_LOGOS[name]?name:(logoLikely?'logo-personnalise.png':name),!!options.logoData&&src===options.logoData,el);
        return;
      }
      if(tag==='canvas'){
        if(inside(r))try{await addImage(pptxSlide,el.toDataURL('image/png'),r,null,false)}catch(e){console.warn('Canvas non exporte',e)}
        return;
      }
      const cs=getComputedStyle(el);
      if(!['script','style','defs','clipPath','template','input','button','select','textarea'].includes(tag)){
        addRectangle(pptxSlide,r,cs,el===root);
        if(cs.backgroundImage && /^linear-gradient\(/i.test(cs.backgroundImage))addCssGradient(pptxSlide,r,cs);
        if(cs.backgroundImage&&cs.backgroundImage!=='none'){
          const match=cs.backgroundImage.match(/^url\(["']?(.*?)["']?\)$/);
          if(match)await addImage(pptxSlide,match[1],r);
        }
        for(const info of cssTextNodes(el)){
          addText(pptxSlide,info.value,absoluteRect(info.bounds,origin),cs);
        }
      }
      for(const child of el.children){if(['svg','img','canvas'].includes(child.tagName.toLowerCase())||!['script','style','defs'].includes(child.tagName.toLowerCase()))await visit(child);}
    }
    await visit(root);
  }
  async function exportPptxLegacy(pages,options={}){
    if(!(window.PptxGenJS||window.pptxgen))throw Error('Le moteur PowerPoint ne s’est pas chargé. Recharge la page puis réessaie.');
    if(!Array.isArray(pages)||!pages.length)throw Error('Aucune slide à exporter.');
    const pptx=new (window.PptxGenJS||window.pptxgen)();pptx.layout='LAYOUT_WIDE';pptx.author='Prestaterre Certification';pptx.subject='Export Obslide compatible Google Slides';pptx.title=options.title||'Observatoire du bâtiment durable';pptx.lang='fr-FR';
    pptx.defineSlideMaster({title:'OBSLIDE',background:{color:'FFFFFF'},objects:[]});
    for(let i=0;i<pages.length;i++){
      const page=pages[i];
      if(options.renderPage) await options.renderPage(page,i);
      const slide=pptx.addSlide('OBSLIDE');
      slide.background={color:'FFFFFF'};
      await addHtmlSlide(slide,options.root||page.root,{logoData:options.logoData});
      if(options.onProgress)options.onProgress(i+1,pages.length);
    }
    await pptx.writeFile({fileName:options.filename||'Obslide_Google_Slides_editable.pptx'});
    return pages.length;
  }
  // V29.8 : export fidèle à l'écran (obslide-pptx.js). Chaque slide affichée est convertie en objets
  // PowerPoint natifs à partir des positions mesurées par le navigateur : textes modifiables aux mêmes
  // coupures de lignes, formes et dégradés natifs, images d'origine, SVG + PNG HD de secours (Google
  // Slides), textes des graphiques et cartes modifiables. Logos Prestaterre / Action Logement : SVG retracés.
  // L'ancien moteur reste disponible : OBSGoogleSlidesExporter.exportPptxLegacy().
  async function exportPptx(pages,options={}){
    const engine=window.ObslidePptx;
    if(!engine)return exportPptxLegacy(pages,options);
    if(!Array.isArray(pages)||!pages.length)throw Error('Aucune slide à exporter.');
    const pptx=engine.createPresentation({title:options.title||'Observatoire du bâtiment durable — Prestaterre',subject:'Export Obslide fidèle à l’écran (PowerPoint / Google Slides)'});
    for(let i=0;i<pages.length;i++){
      const page=pages[i];
      if(options.renderPage)await options.renderPage(page,i);
      const root=options.root||page.root;
      const r=root.getBoundingClientRect();
      if(r.width<5||r.height<5)throw Error('Slide non visible. Vérifie le mode présentation et réessaie.');
      await engine.addSlideFromElement(pptx,root,{imageOverrides:VECTOR_LOGOS,ignoreSelector:'.cover-logo-placeholder,[data-cover-placeholder]'});
      if(options.onProgress)options.onProgress(i+1,pages.length);
    }
    await engine.save(pptx,options.filename||'Obslide_Google_Slides_editable.pptx');
    return pages.length;
  }
  window.OBSGoogleSlidesExporter={exportPptx,exportPptxLegacy,addHtmlSlide,vectorLogo,version:'29.8.0'};
})();
