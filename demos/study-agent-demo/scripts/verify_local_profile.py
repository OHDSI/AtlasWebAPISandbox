#!/usr/bin/env python3
"""Check that this local demo still resolves to its recorded source boundary."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "demo-manifest.local.json"


def git(worktree: Path, *args: str) -> str:
    return subprocess.check_output(["git", "-C", str(worktree), *args], text=True).strip()


def main() -> int:
    data = json.loads(MANIFEST.read_text())
    if data["demo"]["status"] != "source-built-local":
        raise SystemExit("expected a source-built-local manifest")
    failures: list[str] = []
    for name, component in data["components"].items():
        worktree = (ROOT / component["worktree"]).resolve()
        if not worktree.is_dir():
            failures.append(f"{name}: missing worktree {worktree}")
            continue
        try:
            tag_commit = git(worktree, "rev-list", "-n", "1", component["tag"])
            head = git(worktree, "rev-parse", "HEAD")
        except subprocess.CalledProcessError as exc:
            failures.append(f"{name}: cannot inspect checkpoint ({exc})")
            continue
        if tag_commit != component["commit"]:
            failures.append(f"{name}: tag {component['tag']} is {tag_commit}, expected {component['commit']}")
        if head != component["commit"]:
            failures.append(f"{name}: HEAD is {head}, expected pinned {component['commit']}")
        else:
            print(f"PASS {name}: {component['tag']} ({head[:12]})")
    documentation = data["source_boundary"]
    docs_worktree = (ROOT / "../../../StudyAgent").resolve()
    try:
        docs_tag_commit = git(docs_worktree, "rev-list", "-n", "1", documentation["documentation_tag"])
    except subprocess.CalledProcessError as exc:
        failures.append(f"documentation: cannot inspect checkpoint ({exc})")
    else:
        if docs_tag_commit != documentation["documentation_commit"]:
            failures.append(
                f"documentation: tag {documentation['documentation_tag']} is {docs_tag_commit}, "
                f"expected {documentation['documentation_commit']}"
            )
        else:
            print(f"PASS documentation: {documentation['documentation_tag']} ({docs_tag_commit[:12]})")
    template = ROOT / "config" / "webapi-study-agent-demo.yaml.example"
    required = ("study-agent:", "concept-set-search:", "cohort-definition:", "base-url:", "security:", "origin:")
    contents = template.read_text()
    for value in required:
        if value not in contents:
            failures.append(f"WebAPI template is missing {value!r}")
    if failures:
        print("FAILED local profile verification:", *failures, sep="\n- ", file=sys.stderr)
        return 1
    print("PASS configuration template declares WebAPI flags, server-side ACP endpoint, DB, and Atlas origin")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
