#!/usr/bin/env python3
"""Reject a browser HAR that calls ACP/MCP or a non-Atlas/WebAPI origin."""
from __future__ import annotations

import argparse
import json
from pathlib import Path
from urllib.parse import urlsplit


def origin(url: str) -> str:
    parts = urlsplit(url)
    return f"{parts.scheme}://{parts.netloc}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("har", type=Path, help="HAR exported from the meeting browser session")
    parser.add_argument("--atlas-origin", required=True)
    parser.add_argument("--webapi-origin", required=True)
    parser.add_argument("--acp-origin", default="http://127.0.0.1:8765")
    parser.add_argument("--mcp-origin", default="http://127.0.0.1:8000")
    args = parser.parse_args()
    data = json.loads(args.har.read_text())
    urls = [entry["request"]["url"] for entry in data.get("log", {}).get("entries", [])]
    forbidden = [url for url in urls if origin(url) in {args.acp_origin, args.mcp_origin}]
    webapi = [url for url in urls if "/WebAPI/" in url or url.endswith("/WebAPI")]
    wrong = [url for url in webapi if origin(url) not in {args.atlas_origin, args.webapi_origin}]
    if forbidden or wrong:
        for url in forbidden:
            print(f"FAIL browser called internal ACP/MCP origin: {url}")
        for url in wrong:
            print(f"FAIL WebAPI request used unexpected origin: {url}")
        return 1
    if not webapi:
        print("FAIL HAR has no WebAPI request; export the network log after exercising /ohdsi")
        return 1
    print(f"PASS {len(webapi)} WebAPI request(s); no direct ACP/MCP browser request")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
