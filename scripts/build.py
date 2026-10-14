"""Bundle paired source/Chinese data and export Markdown using only stdlib."""
import argparse
import json
from pathlib import Path
import sys
from validate import validate
ROOT=Path(__file__).resolve().parents[1]
LABELS={'memories':'工作规则','skills':'技能','routines':'例行任务','integrations':'应用集成'}

def markdown(en,zh):
    rows=[f"# {zh['name']}",'',f"原名：{en['name']}",f"作者：{en['creatorName']}",f"来源：https://x.ai/bot/marketplace/bots/{en['id']}",'',zh.get('description') or zh.get('summary','')]
    if zh.get('sourceNotes'):rows+=['','> 原文说明：'+'；'.join(zh['sourceNotes'])]
    for key,label in LABELS.items():
        rows+=['',f'## {label}','']
        entries=zh.get(key,[])
        if key=='memories' and zh.get('instructions'):entries=[{'name':'角色指令','description':zh['instructions']}]+entries
        if not entries:rows+=['原站未提供此部分内容。']
        for entry in entries:
            rows+=[f"### {entry['name']}",'',entry.get('content') or entry.get('description') or entry.get('summary',''),'']
            if entry.get('content') and entry.get('description') and entry['content']!=entry['description']:rows+=['补充说明：',entry['description'],'']
    rows+=['---','本文件为原站公开模板的非官方中文译本。运行或导入请前往原站；应用连接与运行环境需另行配置。','']
    return '\n'.join(rows)

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--preview',action='store_true');args=parser.parse_args()
    source=json.loads((ROOT/'data/bots.en.json').read_text())
    bots=[];missing=[];errors=[]
    for en in source['bots']:
        path=ROOT/'data/zh'/f"{en['id']}.json"
        if path.exists():
            zh=json.loads(path.read_text())
            for issue in validate(en,zh):errors.append(f"{en['id']}: {issue}")
        else:
            missing.append(en['id']);zh={**en,'translationStatus':'pending'}
        bots.append({'id':en['id'],'en':en,'zh':zh})
    if errors or (missing and not args.preview):
        print('\n'.join(errors+[f'缺少译文：{slug}' for slug in missing]));return 1
    payload={'source':source['source'],'fetchedAt':source['fetchedAt'],'complete':not missing,'translatedCount':len(bots)-len(missing),'bots':bots}
    (ROOT/'data/catalog.json').write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':')))
    out=ROOT/'templates';out.mkdir(exist_ok=True)
    index=['# Bot 中文模板目录','',f"来源：[Grok Bot Marketplace]({source['source']})",f"采集日期：{source['fetchedAt'][:10]}",'']
    for bot in bots:
        if bot['zh']['translationStatus']!='complete':continue
        name=bot['id']+'.zh-CN.md';(out/name).write_text(markdown(bot['en'],bot['zh']))
        index.append(f"- [{bot['zh']['name']}]({name}) · {bot['en']['name']} · {bot['en']['creatorName']}")
    (out/'README.md').write_text('\n'.join(index)+'\n')
    entry=(ROOT/'web/index.html').read_text()
    entry=entry.replace('href="./styles.css"','href="./web/styles.css"').replace('src="./app.js"','src="./web/app.js"')
    (ROOT/'index.html').write_text(entry)
    print(f"已构建 {len(bots)} 个模板，中文完成 {len(bots)-len(missing)}，Markdown 已保存。")
    return 0
if __name__=='__main__':sys.exit(main())
