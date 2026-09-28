#!/usr/bin/env python3
"""Generate Web-only files. Default output is a new temporary directory."""
from __future__ import annotations

import argparse
import sys
import tempfile
import zipfile
from pathlib import Path

from artifacts import PROJECT_NAME, ROOT, WEB_SKILL, render_web


def check(root: Path, outputs: dict[Path, str]) -> bool:
    failures = []
    for relative, expected in outputs.items():
        target = root / relative
        if not target.is_file() or target.read_text(encoding="utf-8") != expected:
            failures.append(str(relative))
    for folder in (WEB_SKILL, Path("web-instructions")):
        if (root / folder).exists():
            failures.extend(str(p.relative_to(root)) for p in (root / folder).rglob("*") if p.is_file() and p.relative_to(root) not in outputs)
    for failure in failures:
        print("missing, stale, or unexpected: " + failure, file=sys.stderr)
    return not failures


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true")
    mode.add_argument("--update", action="store_true")
    mode.add_argument("--output-dir", type=Path)
    parser.add_argument("--archive-dir", type=Path)
    args = parser.parse_args()
    if args.check and args.archive_dir:
        parser.error("--check is read-only and cannot create archives")
    outputs = render_web()
    if args.check:
        if not check(ROOT, outputs):
            return 1
        print(f"checked {len(outputs)} Web artifacts")
        return 0
    destination = ROOT if args.update else args.output_dir or Path(tempfile.mkdtemp(prefix=PROJECT_NAME + "-web-"))
    for relative, content in outputs.items():
        target = destination / relative
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(content, encoding="utf-8", newline="\n")
    if args.archive_dir:
        args.archive_dir.mkdir(parents=True, exist_ok=True)
        archive_path = args.archive_dir / "web-answer-writing.zip"
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for relative, content in sorted(outputs.items()):
                if relative.is_relative_to(WEB_SKILL):
                    archive.writestr(relative.relative_to(WEB_SKILL).as_posix(), content)
        print(f"wrote {archive_path}")
    print(f"wrote {len(outputs)} Web artifacts under {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
