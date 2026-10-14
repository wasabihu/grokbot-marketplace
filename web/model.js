export const SECTIONS = { memories:'工作规则', skills:'技能', routines:'例行任务', integrations:'应用集成' };
export const CATEGORIES = {'all':'全部','From Grok Bot Team':'官方团队','Engineering':'工程','Sales':'销售','Marketing':'营销','Design':'设计','Personal':'个人','Recruiting & People':'招聘与人事','Product':'产品','Operations':'运营'};
export function escapeHtml(value='') {return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
export function renderText(value='') {
  // Escape first. Source templates are untrusted text; never render their HTML.
  return String(value).split(/(```[\s\S]*?```)/g).map(chunk=>{
    if(chunk.startsWith('```')) {const content=chunk.slice(3,-3).replace(/^[\w+-]*\n/,'');return `<pre><code>${escapeHtml(content)}</code></pre>`;}
    return escapeHtml(chunk).replace(/`([^`\n]+)`/g,'<code>$1</code>').replace(/\*\*([^*\n]+)\*\*/g,'<strong>$1</strong>');
  }).join('');
}
const normalized = value=>String(value).normalize('NFKC').toLocaleLowerCase();
export function searchBots(bots,query='',category='all') {
 const terms=normalized(query).trim().split(/\s+/).filter(Boolean);
 return bots.filter(bot=>{
  if(category!=='all'&&!bot.en.categories.includes(category)) return false;
  const text=bot.searchText ?? normalized(JSON.stringify([bot.zh,bot.en]));
  return terms.every(term=>text.includes(term));
 });
}
export function getEntries(template,section) {
 const entries=template?.[section]||[];
 return section==='memories'&&template?.instructions ? [{id:'instructions',name:'角色指令',description:template.instructions},...entries] : entries;
}
export function entryText(entry) {
 return entry?.content||entry?.description||entry?.summary||'';
}
export function toMarkdown(bot) {
 const z=bot.zh;const lines=[`# ${z.name}`,'',`原名：${bot.en.name}`,`作者：${bot.en.creatorName}`,`来源：https://x.ai/bot/marketplace/bots/${encodeURIComponent(bot.id)}`,'',z.description||z.summary||''];
 if(z.sourceNotes?.length) lines.push('','> 原文说明：'+z.sourceNotes.join('；'));
 for(const [key,label] of Object.entries(SECTIONS)) {
  lines.push('',`## ${label}`,'');const entries=getEntries(z,key);
  if(!entries.length) lines.push('原站未提供此部分内容。');
  for(const entry of entries) {lines.push(`### ${entry.name}`,'',entryText(entry),'');
   if(entry.content&&entry.description&&entry.content!==entry.description) lines.push('补充说明：',entry.description,'');
  }
 }
 lines.push('---','本文件为原站公开模板的非官方中文译本。运行或导入请前往原站；应用连接与运行环境需另行配置。','');
 return lines.join('\n');
}
export function readRoute(hash) {
 const params=new URLSearchParams(hash.replace(/^#/,''));
 const tab=params.get('tab');return {id:params.get('bot')||'pg',tab:Object.hasOwn(SECTIONS,tab)?tab:'memories',compare:params.get('view')==='compare'};
}
