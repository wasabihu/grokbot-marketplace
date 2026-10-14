import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeHtml, renderText, searchBots, getEntries, toMarkdown, readRoute } from '../web/model.js';
const bot = {id:'demo',en:{name:'Demo Bot',creatorName:'Alice',categories:['Engineering'],memories:[{id:'m1',name:'Memory 1',description:'Never send without approval.'}],skills:[],routines:[],integrations:[]},zh:{name:'开发助手',description:'处理代码审查',instructions:'先确认目标',memories:[{id:'m1',name:'工作边界',description:'未经明确确认，绝不发送。'}],skills:[],routines:[],integrations:[]}};
test('模板文本以文本呈现，不能注入 HTML 或执行代码',()=>{
 assert.equal(escapeHtml('<img onerror="x">'), '&lt;img onerror=&quot;x&quot;&gt;');
 assert.ok(!renderText('<script>alert(1)</script>').includes('<script>'));
 assert.ok(renderText('`status=sent`').includes('<code>status=sent</code>'));
 assert.ok(renderText('```js\n<script>\n```').includes('&lt;script&gt;'));
});
test('中文全文、英文名、作者和分类过滤可组合',()=>{
 assert.equal(searchBots([bot],'明确确认','Engineering').length,1);
 assert.equal(searchBots([bot],'demo alice','Engineering').length,1);
 assert.equal(searchBots([bot],'代码','Sales').length,0);
 assert.equal(searchBots([bot],'不存在','all').length,0);
});
test('工作规则同时保留 instructions 和 memories',()=>{
 const entries=getEntries(bot.zh,'memories');assert.equal(entries.length,2);
 assert.equal(entries[0].description,'先确认目标');assert.equal(entries[1].id,'m1');
});
test('Markdown 导出覆盖全部章节与原文归属',()=>{
 const output=toMarkdown(bot);
 assert.match(output,/开发助手/);assert.match(output,/Alice/);assert.match(output,/未经明确确认，绝不发送/);
 assert.match(output,/先确认目标/);assert.match(output,/## 技能/);assert.match(output,/## 例行任务/);assert.match(output,/## 应用集成/);
 assert.match(output,/原站未提供/);assert.match(output,/https:\/\/x.ai\/bot\/marketplace\/bots\/demo/);
});
test('深链接还原模板、页签和中英对照，非法页签回退',()=>{
 assert.deepEqual(readRoute('#bot=demo&tab=skills&view=compare'),{id:'demo',tab:'skills',compare:true});
 assert.equal(readRoute('#bot=demo&tab=bad').tab,'memories');
 assert.equal(readRoute('').id,'pg');
});
