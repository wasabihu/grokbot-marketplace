"""Validate translation coverage against captured source data; no network required."""
import json
from pathlib import Path
import re
import sys
ROOT = Path(__file__).resolve().parents[1]
SECTIONS = ['memories', 'skills', 'routines', 'integrations']
FIELDS = ['name', 'description', 'summary', 'content', 'instructions']
TECH = ['id','creatorName','handle','categories','addHref','updatedAt','imageUrl','color','shape','installCount']

def validate(source, translated):
    issues = []
    for key in TECH:
        if key in source and source[key] != translated.get(key):
            issues.append(f'{key}: 技术字段不一致')
    if translated.get('translationStatus') != 'complete':
        issues.append('翻译状态未完成')
    def content(a, b, prefix):
        for key in FIELDS:
            if key not in a:
                continue
            if key not in b:
                issues.append(f'{prefix}.{key}: 缺少字段'); continue
            text = b[key]
            if a[key] and not text:
                issues.append(f'{prefix}.{key}: 译文为空')
            if isinstance(text,str) and re.fullmatch(r'\$[0-9a-f]+',text):
                issues.append(f'{prefix}.{key}: 残留 Flight 引用')
            if a[key] and key != 'name' and re.search(r'[A-Za-z]{3,}',a[key]) and not re.search(r'[\u3400-\u9fff]',text):
                issues.append(f'{prefix}.{key}: 疑似未翻译')
            if not a[key] and text:
                issues.append(f'{prefix}.{key}: 原文字段为空但新增内容')
    content(source,translated,'bot')
    for section in SECTIONS:
        a,b=source.get(section,[]),translated.get(section,[])
        if len(a)!=len(b):
            issues.append(f'{section}: 条目数 {len(b)} != 原文 {len(a)}'); continue
        for index,(original,zh) in enumerate(zip(a,b)):
            if original['id'] != zh.get('id'):
                issues.append(f'{section}[{index}]: ID不一致')
            content(original,zh,f'{section}[{index}]')
    return issues

def main():
    source=json.loads((ROOT/'data/bots.en.json').read_text())
    errors=[]
    for bot in source['bots']:
        path=ROOT/'data/zh'/f"{bot['id']}.json"
        if not path.exists():errors.append(f"{bot['id']}: 未翻译");continue
        for issue in validate(bot,json.loads(path.read_text())):errors.append(f"{bot['id']}: {issue}")
    if errors:
        print('\n'.join(errors));return 1
    counts={section:sum(len(bot[section]) for bot in source['bots']) for section in SECTIONS}
    print(json.dumps({'validated':len(source['bots']),'sections':counts,'result':'pass'},ensure_ascii=False,indent=2))
    return 0
if __name__=='__main__':sys.exit(main())
