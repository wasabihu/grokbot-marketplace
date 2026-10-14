import { SECTIONS, CATEGORIES, escapeHtml as h, renderText, searchBots, getEntries, entryText, toMarkdown, readRoute } from './model.js';
const $=selector=>document.querySelector(selector);
let catalog, bots=[], current, category='all', route=readRoute(location.hash), observer, toastTimer;
const icons={copy:'<rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4"/>',download:'<path d="M12 3v12m-4-4 4 4 4-4M4 16v4h16v-4"/>'};
const icon=name=>`<svg aria-hidden="true" viewBox="0 0 24 24">${icons[name]}</svg>`;
function notify(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3200);}
function closeMenu(){ $('#sidebar').classList.remove('is-open');$('#menu-toggle').setAttribute('aria-expanded','false');$('#menu-toggle').setAttribute('aria-label','打开模板目录');$('#scrim').hidden=true;document.body.classList.remove('menu-open');setInert(false); }
function setInert(open){const mobile=matchMedia('(max-width: 640px)').matches;$('#main').inert=mobile&&open;$('#sidebar').inert=mobile&&!open;$('.wordmark').inert=mobile&&open;$('.source-link').inert=mobile&&open;}
function toggleMenu(){const open=!$('#sidebar').classList.contains('is-open');$('#sidebar').classList.toggle('is-open',open);$('#menu-toggle').setAttribute('aria-expanded',String(open));$('#menu-toggle').setAttribute('aria-label',open?'关闭模板目录':'打开模板目录');$('#scrim').hidden=!open;document.body.classList.toggle('menu-open',open);setInert(open);if(open)$('#search').focus();}
function navigate(values,{replace=false}={}){
 const next={...route,...values};const p=new URLSearchParams({bot:next.id});if(next.tab!=='memories')p.set('tab',next.tab);if(next.compare)p.set('view','compare');
 if(replace){history.replaceState(null,'','#'+p);onRoute();}else if(location.hash==='#'+p){onRoute();}else location.hash=p.toString();
}
function renderCategories(){ $('#categories').innerHTML=Object.entries(CATEGORIES).map(([key,label])=>`<button class="category" data-category="${h(key)}" aria-pressed="${key===category}">${h(label)}</button>`).join(''); }
function renderList(){
 const shown=searchBots(bots,$('#search').value,category);
 $('#result-count').textContent=`${shown.length} 个模板${shown.length===bots.length?'':` / 共 ${bots.length} 个`}`;
 $('#clear-filters').hidden=category==='all'&&!$('#search').value;
 $('#bot-list').innerHTML=shown.length?shown.map(bot=>`<a href="#bot=${encodeURIComponent(bot.id)}${route.compare?'&view=compare':''}" class="bot-item" data-bot="${h(bot.id)}" aria-current="${bot.id===route.id}"><span class="bot-item-name">${h(bot.zh.name)}</span><span class="bot-item-en">${h(bot.en.name)}</span>${bot.zh.translationStatus!=='complete'?'<span class="pending-note">翻译处理中</span>':''}</a>`).join(''):'<div class="list-empty">没有找到匹配的模板。<br>试试用途、英文名称或作者，或重置筛选。</div>';
}
function renderDetail(){
 current=bots.find(bot=>bot.id===route.id);
 if(!current){$('#main').innerHTML='<div class="error-state"><h1>未找到这个 Bot</h1><p>链接中的模板不在当前目录中。</p><a class="button" href="#bot=pg">返回中文模板库</a></div>';return;}
 const {zh:z,en:e}=current;document.title=`${z.name} · Bot 中文库`;
 const cats=e.categories.filter(x=>x!=='From Grok Bot Team');
 const categoryLabel=(cats.length?cats:e.categories).map(x=>CATEGORIES[x]||x).join(' / ');
 const notes=z.sourceNotes?.length?`<div class="source-note">${z.sourceNotes.map(h).join('<br>')}</div>`:'';
 $('#main').innerHTML=`<div class="detail-layout"><article class="article"><div class="breadcrumb"><span>模板库</span><span class="slash">/</span><span>${h(categoryLabel)}</span></div><h1>${h(z.name)}</h1><p class="subtitle"><span lang="en">${h(e.name)}</span><span class="dot">·</span>${h(e.creatorName)}</p><p class="description">${h(z.description||z.summary)}</p>${route.compare?`<p class="description english-summary" lang="en">${h(e.description||e.summary)}</p>`:''}${notes}<div class="toolbar"><div class="segmented" aria-label="阅读语言"><button data-view="zh" aria-pressed="${!route.compare}">中文</button><button data-view="compare" aria-pressed="${route.compare}">中英对照</button></div><div class="toolbar-actions"><button class="button primary" id="copy-template">${icon('copy')}复制中文模板</button><button class="button" id="download-template">${icon('download')}下载 Markdown</button></div></div><div class="tabs" role="tablist" aria-label="模板详情章节">${Object.entries(SECTIONS).map(([key,label])=>`<button class="tab" id="tab-${key}" role="tab" aria-controls="section-panel" aria-selected="${key===route.tab}" tabindex="${key===route.tab?0:-1}" data-tab="${key}">${label}<span>${getEntries(z,key).length}</span></button>`).join('')}</div><div id="section-panel" role="tabpanel" tabindex="0" aria-labelledby="tab-${route.tab}"></div><footer class="article-footer"><p>来源：<a href="https://x.ai/bot/marketplace/bots/${encodeURIComponent(current.id)}" target="_blank" rel="noopener noreferrer">Grok · ${h(e.creatorName)} ↗</a><br>公开模板的非官方中文译本；实际使用请前往原站。</p><p>采集于 ${h(catalog.fetchedAt.slice(0,10))}<br>保留原文，可逐条对照</p></footer></article><aside class="toc" aria-label="本页目录"><h2 class="toc-title">本页目录</h2><nav id="entry-toc"></nav><div class="toc-meta">模板 ID<code>${h(current.id)}</code><p>模板更新<br>${h((e.updatedAt||'').slice(0,10)||'原站未标注')}</p><a href="https://x.ai/bot/marketplace/bots/${encodeURIComponent(current.id)}" target="_blank" rel="noopener noreferrer">查看原始模板 ↗</a></div></aside></div>`;
 renderEntries();
}
function renderEntries(){
 const entries=getEntries(current.zh,route.tab),original=getEntries(current.en,route.tab);
 $('#section-panel').innerHTML=entries.length?entries.map((entry,i)=>{
  const en=original.find(item=>item.id===entry.id)||original[i];
  const originalContent=en?`<div class="original" lang="en"><div class="original-label">ORIGINAL</div><div class="original-name">${h(en.name)}</div><div class="prose">${renderText(entryText(en))}</div>${en.content&&en.description&&en.content!==en.description?`<div class="prose">${renderText(en.description)}</div>`:''}</div>`:'';
  const supplemental=entry.content&&entry.description&&entry.content!==entry.description?`<div class="prose">${renderText(entry.description)}</div>`:'';
  return `<section class="entry" id="entry-${i}"><div class="entry-heading"><span class="entry-number">${String(i+1).padStart(2,'0')}</span><h2>${h(entry.name)}</h2></div><div class="entry-body"><div class="prose">${renderText(entryText(entry))}</div>${supplemental}${route.compare?originalContent:''}</div></section>`;
 }).join(''):`<div class="empty-section"><h2>原站未提供${SECTIONS[route.tab]}内容</h2><p>此模板在公开页面中没有列出这一部分。<br>可以继续查看其他章节，或前往原站了解详情。</p></div>`;
 $('#entry-toc').innerHTML=entries.map((entry,i)=>`<a href="#entry-${i}" data-entry="${i}"${i===0?' class="active"':''}><span>${String(i+1).padStart(2,'0')}</span>${h(entry.name)}</a>`).join('')||'<p class="toc-meta">暂无条目</p>';
 observer?.disconnect();observer=new IntersectionObserver(items=>{for(const item of items){if(item.isIntersecting){document.querySelectorAll('#entry-toc a').forEach(a=>a.classList.toggle('active',a.dataset.entry===item.target.id.replace('entry-','')));break;}}},{rootMargin:'-90px 0px -55% 0px'});document.querySelectorAll('.entry').forEach(el=>observer.observe(el));
}
function onRoute(){
 const previous=route;route=readRoute(location.hash);if(!bots.length)return;
 const focusTab=document.activeElement?.dataset.tab;
 const focusView=document.activeElement?.dataset.view;
 renderList();renderDetail();
 if(previous.id!==route.id){window.scrollTo({top:0});closeMenu();$('#main').focus({preventScroll:true});}
 else if(previous.tab!==route.tab){$('.tabs')?.scrollIntoView({block:'start',behavior:'instant'});if(focusTab)$(`[data-tab="${route.tab}"]`)?.focus({preventScroll:true});}
 else if(focusView)$(`[data-view="${route.compare?'compare':'zh'}"]`)?.focus({preventScroll:true});
}
async function copyTemplate(){
 try{await navigator.clipboard.writeText(toMarkdown(current));notify('已复制完整中文模板，包含所有章节。');}
 catch{notify('浏览器未允许复制，请使用“下载 Markdown”保存模板。');}
}
function downloadTemplate(){const blob=new Blob([toMarkdown(current)],{type:'text/markdown;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${current.id}.zh-CN.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);notify('已开始下载中文 Markdown 模板。');}
document.addEventListener('click',event=>{
 if(event.target.closest('.skip-link')){event.preventDefault();$('#main').focus();return;}
 const cat=event.target.closest('[data-category]');if(cat){category=cat.dataset.category;renderCategories();renderList();[...document.querySelectorAll('[data-category]')].find(button=>button.dataset.category===category)?.focus({preventScroll:true});return;}
 const tab=event.target.closest('[data-tab]');if(tab){navigate({tab:tab.dataset.tab});return;}
 const view=event.target.closest('[data-view]');if(view){navigate({compare:view.dataset.view==='compare'});return;}
 const toc=event.target.closest('[data-entry]');if(toc){event.preventDefault();$(`#entry-${toc.dataset.entry}`)?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});return;}
 if(event.target.closest('#copy-template'))copyTemplate();
 if(event.target.closest('#download-template'))downloadTemplate();
 if(event.target.closest('[data-bot]'))closeMenu();
});
$('#search').addEventListener('input',renderList);
$('#clear-filters').addEventListener('click',()=>{category='all';$('#search').value='';renderCategories();renderList();$('#search').focus();});
$('#menu-toggle').addEventListener('click',toggleMenu);$('#scrim').addEventListener('click',closeMenu);
window.addEventListener('hashchange',onRoute);
window.addEventListener('resize',()=>{if(!matchMedia('(max-width:640px)').matches)closeMenu();else setInert($('#sidebar').classList.contains('is-open'));});
document.addEventListener('keydown',event=>{
 if(event.key==='Escape'&&$('#sidebar').classList.contains('is-open')){closeMenu();$('#menu-toggle').focus();}
 const editing=event.target.matches('input,textarea,[contenteditable=true]');
 if((event.key==='/'&&!editing)||((event.metaKey||event.ctrlKey)&&event.key==='k')){event.preventDefault();if(matchMedia('(max-width:640px)').matches&&!$('#sidebar').classList.contains('is-open'))toggleMenu();$('#search').focus();}
 if(event.target.matches('[role=tab]')&&['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
  event.preventDefault();const keys=Object.keys(SECTIONS),idx=keys.indexOf(route.tab);const next=event.key==='Home'?0:event.key==='End'?keys.length-1:(idx+(event.key==='ArrowRight'?1:-1)+keys.length)%keys.length;navigate({tab:keys[next]});
 }
 if(event.key==='Tab'&&document.body.classList.contains('menu-open')){
  const nodes=[$('#menu-toggle'),...$('#sidebar').querySelectorAll('button:not([hidden]),input,a')].filter(el=>el.getClientRects().length);const first=nodes[0],last=nodes.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
 }
});
async function boot(){
 try{
  const response=await fetch(new URL('../data/catalog.json',import.meta.url));if(!response.ok)throw new Error('catalog');catalog=await response.json();bots=catalog.bots;
  for(const bot of bots)bot.searchText=JSON.stringify([bot.zh,bot.en]).normalize('NFKC').toLocaleLowerCase();
  $('#snapshot-date').textContent=`${bots.length} 个公开模板 · ${catalog.fetchedAt.slice(0,10)}`;
  renderCategories();onRoute();closeMenu();
 }catch{$('#result-count').textContent='模板加载失败';$('#main').innerHTML='<div class="error-state"><h1>暂时无法载入模板</h1><p>请检查本地服务是否已启动，或刷新重试。</p><button class="button" id="retry">重新载入</button></div>';$('#retry').addEventListener('click',()=>location.reload());}
}
boot();
