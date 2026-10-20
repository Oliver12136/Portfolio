#!/usr/bin/env python3
"""Remove only stale, unopened Git temporary packs and ignored OS metadata.

Dry run by default. No source, media, real Git packs or untracked work is removed.
"""
import argparse
import json
import pathlib
import subprocess
import time

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--apply', action='store_true')
parser.add_argument('--min-age-hours', type=float, default=0.5)
args = parser.parse_args()
root = pathlib.Path(__file__).resolve().parents[1]
tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root).decode().split('\0'))
pack_dir = root / '.git' / 'objects' / 'pack'
# Fail closed: without an open-file inventory, do not touch Git temporary files.
result = subprocess.run(['lsof', '-Fn', '+D', str(pack_dir)], capture_output=True, text=True)
if result.returncode not in (0, 1):
    raise SystemExit('Unable to verify open Git files; cleanup aborted. ' + result.stderr)
opened = {line[1:] for line in result.stdout.splitlines() if line.startswith('n')}
candidates = []
for file in pack_dir.glob('tmp_pack_*'):
    if file.is_symlink() or not file.is_file() or str(file) in opened:
        continue
    if time.time() - file.stat().st_mtime >= max(0, args.min_age_hours) * 3600:
        candidates.append(file)
# Metadata is disposable only when Git does not track it.
for folder in (root, root / 'web'):
    files = [folder / '.DS_Store', folder / 'Thumbs.db'] if folder == root else list(folder.rglob('.DS_Store')) + list(folder.rglob('Thumbs.db'))
    for file in files:
        if file.is_file() and not file.is_symlink() and file.relative_to(root).as_posix() not in tracked:
            candidates.append(file)
items = []
for file in candidates:
    size = file.stat().st_size
    if args.apply:
        file.unlink()
    items.append({'path': file.relative_to(root).as_posix(), 'bytes': size})
print(json.dumps({'applied': args.apply, 'files': len(items), 'bytes': sum(item['bytes'] for item in items), 'items': items}, indent=2))
