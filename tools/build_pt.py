#!/usr/bin/env python3
"""Build the Portuguese mirror of MBS Academy (pt/…) from the English pages.

    python3 tools/build_pt.py            # (re)generate pt/ from the EN pages
    python3 tools/build_pt.py --missing  # list EN text that has no translation yet

Translations live in tools/i18n/pt.json, keyed by the English text of each
block (whitespace-normalised inner HTML). Edit an English page, run
--missing, add the new keys to pt.json, then run the build. Pages in pt/
are generated — edit the English page or pt.json, never pt/ directly.
Requires: Python 3 + beautifulsoup4.
"""
import json, re, sys
from pathlib import Path
from bs4 import BeautifulSoup, NavigableString, Tag, Comment

ROOT = Path(__file__).resolve().parents[1]
SITE = "https://marlonbsiqueira.github.io/mbs-academy/"
PAGES = ["index.html", "pages/about.html", "pages/courses.html", "pages/case-studies.html",
         "pages/contact.html", "courses/finance-transformation.html", "courses/lean-six-sigma.html",
         "courses/intelligent-automation.html", "courses/sap-finance.html", "courses/5s-methodology.html",
         "courses/fiscalidade.html", "courses/lean-thinking.html", "case-studies/stellantis.html",
         "lessons/finance-01-01.html"]
INLINE = {"a", "em", "strong", "b", "i", "br", "span", "small", "sup", "sub", "code", "abbr", "mark"}
SKIP = {"script", "style", "svg", "noscript", "template"}
ATTRS = ("alt", "placeholder", "aria-label", "title", "data-label")
DICT = ROOT / "tools/i18n/pt.json"

norm = lambda s: re.sub(r"\s+", " ", s).strip()
has_text = lambda s: bool(re.search(r"[A-Za-zÀ-ÿ]", s))

def units(soup):
    """Maximal blocks whose content is text + inline tags only."""
    out = []
    def inline_only(el):
        return all(isinstance(c, NavigableString) or (isinstance(c, Tag) and c.name in INLINE and inline_only(c))
                   for c in el.children if not isinstance(c, Comment))
    def walk(el):
        for c in list(el.children):
            if isinstance(c, Comment):
                continue
            if isinstance(c, NavigableString):
                # loose text next to block children, or inside a wrapper we descended into
                if el.name not in SKIP and has_text(str(c)):
                    out.append(c)
                continue
            if c.name in SKIP:
                continue
            if inline_only(c) and has_text(c.get_text()):
                loose = any(isinstance(n, NavigableString) and n.strip() for n in c.children)
                if not loose and any(isinstance(n, Tag) for n in c.children):
                    walk(c)          # only tags inside (nav link, buttons, meta spans): one unit each
                else:
                    out.append(c)
            else:
                walk(c)
    walk(soup.body)
    return out

def key_of(u):
    return norm(str(u)) if isinstance(u, NavigableString) else norm(u.decode_contents())

def head_strings(soup):
    items = []
    if soup.title and soup.title.string: items.append(("title", soup.title))
    for m in soup.find_all("meta"):
        n = m.get("name", "") or m.get("property", "")
        if n in ("description", "og:title", "og:description", "twitter:title", "twitter:description", "og:image:alt"):
            items.append(("meta", m))
    return items

def attr_targets(soup):
    for el in soup.body.find_all(True):
        if el.name in SKIP: continue
        for a in ATTRS:
            v = el.get(a)
            if isinstance(v, str) and has_text(v):
                yield el, a

def collect(path):
    soup = BeautifulSoup((ROOT / path).read_text(encoding="utf-8"), "html.parser")
    keys = [key_of(u) for u in units(soup)]
    keys += [norm(el.string if kind == "title" else el["content"]) for kind, el in head_strings(soup)]
    keys += [norm(el[a]) for el, a in attr_targets(soup)]
    return [k for k in keys if has_text(k)]

def is_asset(url):
    return not (url.startswith(("http:", "https:", "mailto:", "tel:", "#", "/", "data:")) or url.split("#")[0].split("?")[0].endswith(".html") or url == "")

def build():
    tr = json.loads(DICT.read_text(encoding="utf-8"))
    missing = set()
    t = lambda s: tr.get(norm(s)) if tr.get(norm(s)) is not None else (missing.add(norm(s)) or s)
    for path in PAGES:
        soup = BeautifulSoup((ROOT / path).read_text(encoding="utf-8"), "html.parser")
        soup.html["lang"] = "pt"
        for u in units(soup):
            k = key_of(u)
            if not has_text(k): continue
            v = t(k)
            if isinstance(u, NavigableString):
                lead, trail = re.match(r"^\s*", str(u)).group(), re.search(r"\s*$", str(u)).group()
                u.replace_with(lead + v + trail)
            else:
                u.clear(); u.append(BeautifulSoup(v, "html.parser"))
        for kind, el in head_strings(soup):
            if kind == "title": el.string = t(el.string)
            else: el["content"] = t(el["content"])
        for el, a in attr_targets(soup):
            el[a] = t(el[a])
        # one level deeper: assets need ../ ; links between pages stay relative
        for el in soup.find_all(True):
            for a in ("href", "src"):
                v = el.get(a)
                if isinstance(v, str) and is_asset(v) and not el.has_attr("data-lang-link"):
                    el[a] = "../" + v
        # canonical / og:url / locale / alternates
        for el in soup.find_all("link", rel="canonical") + soup.find_all("meta", property="og:url"):
            attr = "href" if el.name == "link" else "content"
            el[attr] = el[attr].replace(SITE, SITE + "pt/", 1)
        for el in soup.find_all("meta", property="og:locale"): el["content"] = "pt_PT"
        # language switch: PT active, EN points back to the English page
        depth = path.count("/")
        for a in soup.select("[data-lang-link]"):
            if a["data-lang-link"] == "en":
                a["href"] = "../" * (depth + 1) + path
                a.attrs.pop("aria-current", None)
            else:
                a["href"] = Path(path).name
                a["aria-current"] = "true"
        out = ROOT / "pt" / path
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(str(soup), encoding="utf-8")
    if missing:
        print(f"{len(missing)} strings without a translation (left in English):", file=sys.stderr)
        for m in sorted(missing): print("  " + m[:120], file=sys.stderr)
    print(f"built {len(PAGES)} pages into pt/")

if __name__ == "__main__":
    if "--missing" in sys.argv or "--extract" in sys.argv:
        tr = json.loads(DICT.read_text(encoding="utf-8")) if DICT.exists() else {}
        seen, todo = set(), []
        for p in PAGES:
            for k in collect(p):
                if k not in seen and k not in tr:
                    seen.add(k); todo.append(k)
        if "--extract" in sys.argv:
            print(json.dumps({k: "" for k in todo}, ensure_ascii=False, indent=1))
        else:
            print("\n".join(todo)); print(f"\n{len(todo)} missing", file=sys.stderr)
    else:
        build()
