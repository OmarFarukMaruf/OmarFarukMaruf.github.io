# omarfarukmaruf.github.io

Personal portfolio of **Omar Faruk Maruf** — Software Engineer working across blockchain
protocols, web systems and computer vision.

**Live:** <https://omarfarukmaruf.github.io/>

A single static page. No build step, no framework, no dependencies to install — three
source files and a folder of assets, served straight from the repository root by
GitHub Pages.

---

## Design

The layout comes from a **Modernist** design system: flat, architectural and rule-driven.

| Principle | How it shows up |
| --- | --- |
| Zero corner radius | No element on the page is rounded — buttons, cards, chips and photo alike |
| Rules do the organising | 2px ink rules under section headers and the sidebar; 1px hairlines between rows |
| Modular grid | Cells sit in a grid with 1px gaps over a hairline ground, so the structure stays visible |
| Flush left | Headings, copy and button labels all start at the same left edge |
| Mono palette | Ink on white — no accent colour |
| Black-and-white photography | The portrait renders through `grayscale(1) contrast(1.06)` |

Everything is driven by custom properties at the top of `style.css`:

```css
--ink:   #141414;  /* headings, rules, primary buttons        */
--ink-2: #2a2a2a;  /* chip labels                             */
--body:  #4a4a4a;  /* paragraphs, bullets                     */
--muted: #6e6e6e;  /* secondary meta, section numerals        */
--faint: #767676;  /* de-emphasised suffixes and small dates  */
--fill:  #f7f7f7;  /* chip and callout fill                   */
--line:  #e4e4e4;  /* hairline                                */
```

Type is [Archivo](https://fonts.google.com/specimen/Archivo) (400–800), loaded from Google Fonts.

---

## Structure

```
.
├── index.html      # all content and markup
├── style.css       # tokens, layout, components, responsive + print
├── script.js       # scroll-spy, smooth scrolling, reveal-on-scroll, footer year
├── assets/
│   ├── md-omar-faruk.jpeg
│   └── CV_omar-faruk.pdf
└── README.md
```

### Sections

Nine sections, numbered `01`–`09` in the markup and mirrored in the sidebar nav:

`Overview` · `Experience` · `Education` · `Research` · `Projects` ·
`Achievements & Awards` · `Skills` · `Courses` · `Others`

Two layout patterns carry most of the page:

- **Timeline** (`.timeline` / `.tl-item`) — a left rule with square markers, title on the
  left and date right-aligned on the same baseline. Used by Experience and Education.
  Awards (`.award`) reuse the same `.tl-head` title/date header without the rule.
- **Label rows** (`.row` / `.row-label`) — a 150px label column beside its content.
  Used by Skills, Courses and Others.

### Icons

SVG `<symbol>` definitions live in a hidden `<svg>` at the top of `index.html` and are
referenced with `<use href="#i-name">`. No icon font, no image requests.

---

## Running it locally

Any static file server works. From the repository root:

```bash
python3 -m http.server 4173
```

Then open <http://localhost:4173>. Opening `index.html` directly over `file://` also works,
though relative asset paths behave more predictably over HTTP.

---

## Deploying

This is a GitHub Pages **user site**, so anything pushed to the root of `main` is published
automatically within a minute or so:

```bash
git add -A
git commit -m "Update portfolio"
git push
```

No workflow or build step is configured, and none is needed.

---

## Editing the content

All copy lives in `index.html` — there is no CMS or data file to keep in sync.

| To change | Edit |
| --- | --- |
| Name, role, availability line, location | The `.profile` block in `<aside class="sidebar">` |
| Section order | Move the `<section>` blocks, then update `.section-num` and the nav list to match |
| A job, degree or award | The relevant `<article class="tl-item">` or `<article class="award">` |
| A project | An `<article class="project-cell">` inside the Projects grid |
| A certificate | A `.course-row` — issuer, title, credential link |
| Skills, languages, hobbies | The `.chips` lists |
| CV | Replace `assets/CV_omar-faruk.pdf` |

Two lines are marked with HTML comments because they need a human decision — the
availability status in the sidebar, and the location, which is inferred rather than stated.
Update or delete them as they change.

---

## Accessibility

- Every text colour meets **WCAG 2.1 AA** (4.5:1 or better) against the white ground.
- A skip link jumps past the sidebar to the main content.
- Keyboard focus is a 2px ink outline with offset, never the browser default.
- Reveal animations are gated behind a `js` class set in `<head>` — with JavaScript
  disabled or broken, all content renders visible rather than stuck at zero opacity.
- `prefers-reduced-motion: reduce` disables smooth scrolling and every transition.
- The nav exposes `aria-current` on the active section.

## Printing

A print stylesheet drops the navigation, social links and action buttons, unpins the
sidebar into a document header, and avoids page breaks inside entries — so
<kbd>Cmd</kbd>+<kbd>P</kbd> produces a clean single document for applications.

---

## Notes

- `assets/gp-accelerator.jpg`, `assets/unicef-imagen.jpg` and `assets/png/` are left over
  from an earlier version and are not referenced by the current page. They can be deleted.
- `.DS_Store` files are tracked in git. Worth adding a `.gitignore` for them.

## License

Code is free to reference. The written content, CV and photography are personal to
Omar Faruk Maruf — please don't reuse them as your own.
