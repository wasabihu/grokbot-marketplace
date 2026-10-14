"""Download a fresh snapshot without overwriting reviewed source/translation files."""
import datetime
import json
from pathlib import Path
import collect

if __name__ == '__main__':
    project = Path(__file__).resolve().parents[1]
    stamp = datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
    destination = project / 'data' / 'snapshots' / stamp
    collect.ROOT = destination
    collect.SOURCE = destination / 'data' / 'source'
    collect.main()
    previous = {b['id']: b for b in json.loads((project/'data/bots.en.json').read_text())['bots']}
    current = {b['id']: b for b in json.loads((destination/'data/bots.en.json').read_text())['bots']}
    diff = {
        'added': sorted(current.keys() - previous.keys()),
        'removed': sorted(previous.keys() - current.keys()),
        'changed': sorted(k for k in previous.keys() & current.keys() if previous[k] != current[k])
    }
    (destination/'diff.json').write_text(json.dumps(diff,ensure_ascii=False,indent=2))
    print(f'新快照已保存：{destination}\n原有译文与网页数据未被覆盖。')
    print(json.dumps(diff,ensure_ascii=False,indent=2))
