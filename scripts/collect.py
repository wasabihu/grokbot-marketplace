"""Fetch public marketplace templates; Python standard library only."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import re
import subprocess
import time
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / 'data' / 'source'
BASE = 'https://x.ai/bot/marketplace'


def flight(html):
    chunks = []
    for raw in re.findall(r'self\.__next_f\.push\((\[.*?\])\)</script>', html):
        item = json.loads(raw)
        if len(item) > 1 and isinstance(item[1], str):
            chunks.append(item[1])
    return ''.join(chunks)


def resolve(data, stream):
    raw = stream.encode('utf-8')
    refs = {}
    cursor = 0
    while cursor < len(raw):
        match = re.match(rb'([0-9a-f]+):T([0-9a-f]+),', raw[cursor:])
        if match:
            start = cursor + match.end()
            cursor = start + int(match[2], 16)
            refs[match[1].decode()] = raw[start:cursor].decode('utf-8')
        else:
            newline = raw.find(b'\n', cursor)
            cursor = newline + 1 if newline >= 0 else len(raw)
    def walk(value):
        if isinstance(value, dict):
            return {k: walk(v) for k, v in value.items()}
        if isinstance(value, list):
            return [walk(v) for v in value]
        if isinstance(value, str) and re.fullmatch(r'\$[0-9a-f]+', value):
            if value[1:] not in refs:
                raise ValueError(f'Unresolved Flight reference: {value}')
            return refs[value[1:]]
        return value
    return walk(data)


def fetch(url):
    for attempt in range(3):
        try:
            with urllib.request.urlopen(url, timeout=40) as response:
                return response.read().decode('utf-8')
        except Exception:
            if attempt == 2:
                return subprocess.check_output(['curl', '--fail', '--location', '--silent', '--show-error', '--retry', '2', '--max-time', '40', url], text=True)
            time.sleep(attempt + 1)


def detail(slug):
    cache = SOURCE / f'{slug}.html'
    html = cache.read_text() if cache.exists() else fetch(f'{BASE}/bots/{slug}')
    cache.write_text(html)
    stream = flight(html)
    for match in re.finditer(r'"template":', stream):
        value = json.JSONDecoder().raw_decode(stream[match.end():])[0]
        if isinstance(value, dict) and value.get('id') == slug:
            template = resolve(value, stream)
            (SOURCE / f'{slug}.json').write_text(json.dumps(template, ensure_ascii=False, indent=2))
            return template
    raise ValueError(f'No template found: {slug}')


def main():
    SOURCE.mkdir(parents=True, exist_ok=True)
    cache = SOURCE / 'marketplace.html'
    html = cache.read_text() if cache.exists() else fetch(BASE)
    cache.write_text(html)
    stream = flight(html)
    match = re.search(r'"templates":', stream)
    catalog = resolve(json.JSONDecoder().raw_decode(stream[match.end():])[0], stream)
    ids = [item['id'] for item in catalog]
    results, errors = {}, []
    with concurrent.futures.ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(detail, slug): slug for slug in ids}
        for future in concurrent.futures.as_completed(futures):
            slug = futures[future]
            try:
                results[slug] = future.result()
            except Exception as error:
                errors.append(f'{slug}: {error}')
    if errors:
        raise RuntimeError('\n'.join(errors))
    templates = [results[slug] for slug in ids]
    payload = {'source': BASE, 'fetchedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'bots': templates}
    (ROOT / 'data' / 'bots.en.json').write_text(json.dumps(payload, ensure_ascii=False, indent=2))
    batches = [[], [], []]
    totals = [0, 0, 0]
    for template in sorted(templates, key=lambda b: len(json.dumps(b)), reverse=True):
        index = totals.index(min(totals))
        batches[index].append(template['id'])
        totals[index] += len(json.dumps(template))
    manifest = ROOT / 'data' / 'translation-batches.json'
    if not manifest.exists():
        manifest.write_text(json.dumps(batches, indent=2))
    print(json.dumps({'bots': len(templates), 'charsByBatch': totals, 'items': {key: sum(len(b[key]) for b in templates) for key in ['memories', 'skills', 'routines', 'integrations']}}, indent=2))


if __name__ == '__main__':
    main()
