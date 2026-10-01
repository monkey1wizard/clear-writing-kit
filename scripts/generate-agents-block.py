#!/usr/bin/env python3
"""Generate the compact instruction block for agent instruction files."""
import argparse
import sys
from pathlib import Path

from artifacts import ROOT, render_agents_block

DEFAULT_OUTPUT = ROOT / "install" / "agents-block.md"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    output = args.output.expanduser().resolve()
    expected = render_agents_block()
    if args.check:
        if not output.is_file() or output.read_text(encoding="utf-8") != expected:
            print(f"missing or stale: {output}", file=sys.stderr)
            return 1
        print(f"checked {output}")
        return 0
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(expected, encoding="utf-8", newline="\n")
    print(f"wrote {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
