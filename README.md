# MBS Academy

Static site (GitHub Pages): https://marlonbsiqueira.github.io/mbs-academy/

```
index.html            home
pages/                about, courses (catalog), case studies, contact
courses/              one page per programme
lessons/              individual lessons
case-studies/         one page per case study
pt/                   Portuguese version — GENERATED, do not edit by hand
tools/build_pt.py     builds pt/ from the English pages + tools/i18n/pt.json
styles/main.css       shared styles (pages add their own in a <style> block)
javascript/main.js    menu, scroll reveal, catalog filters, module accordion, contact form
```

## Adding a page that is still "Coming soon"
Links to pages that don't exist yet are shown as **Coming soon** (a card with
a badge, or greyed-out text) instead of leading to a 404. When you publish the
page, turn it back into a link — e.g. in `index.html` change
`<div class="course-card … is-soon" aria-disabled="true"><span class="soon-badge">Coming soon</span>`
back to `<a href="courses/kaizen.html" class="course-card …">` (and `</div>` → `</a>`).

Pending: courses `kaizen`, `budget-control`, `interview-prep`, `under-pressure`;
lessons `finance-01-02`, `finance-01-03`; case studies `ale`, `meridian`,
`renova`, `vale`.

## Catalog filters
On `pages/courses.html` each card has `data-cat` (e.g. `data-cat="sap finance"`)
matching the buttons' `data-filter` values: `finance`, `process`,
`automation`, `sap`.

## New pages
Copy the `<head>` of a page at the same folder depth (canonical URL,
favicon and share image are included) and add the page to `sitemap.xml`.
A GitHub Action checks every push for links to files that don't exist.

## Portuguese version (pt/)
Every English page has a Portuguese twin under `pt/` with the same path
(e.g. `pages/about.html` → `pt/pages/about.html`), linked by the **EN | PT**
switch in the header and by `hreflang` tags for search engines.

The English pages are the source. After changing an English page:

```
python3 tools/build_pt.py --missing   # lists new/changed English text
# add each listed string with its Portuguese translation to tools/i18n/pt.json
python3 tools/build_pt.py             # regenerates pt/
```

Translations are keyed by the English text of each block (inline tags such
as `<em>` or `<strong>` included), so the same sentence used on several
pages is translated once. Requires Python 3 and `beautifulsoup4`.
