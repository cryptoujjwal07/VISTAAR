# VISTAAR Production UI/UX Audit Report (Prompt 33)

**System:** VISTAAR (विस्तार) — Integrated Polar Science Outreach, Knowledge Repository and Media Dissemination Portal  
**Institution:** National Centre for Polar and Ocean Research (NCPOR), Ministry of Earth Sciences (MoES), Government of India  
**Audit Scope:** Complete production UI/UX audit across all 13 Next.js App Router views, shared layout components, and design tokens without modifying business logic.

---

## 1. Mandatory Visual Identity & Design Token Verification

| Design Requirement | Token / Specification | Verification Status |
| :--- | :--- | :--- |
| **Warm Beige / Ivory Canvas** | `--background: #FAF7F0` (`bg-vistaar-bg`) | **VERIFIED** (`globals.css`, `tailwind.config.ts`, all 13 pages) |
| **Clean White Surfaces** | `--surface: #FFFFFF` (`bg-white`) | **VERIFIED** (Cards, tables, PDF inspector, review workspace panels) |
| **Primary Scientific Blue** | `--primary: #2563EB` (`text-vistaar-primary`, `bg-vistaar-primary`) | **VERIFIED** (Primary actions, active tabs, focus rings) |
| **Subtle Polar Cyan Accent** | `--scientific: #0E7490` (`text-vistaar-scientific`) | **VERIFIED** (Station telemetry badges, provenance labels) |
| **Deep Charcoal Typography** | `--text: #17202A` / `--muted: #5F6B76` | **VERIFIED** (High-contrast editorial readability, WCAG AAA body contrast) |
| **Warm Sand Borders** | `--border: #E7E0D5` (`border-vistaar-border`) | **VERIFIED** (1px warm structural hairlines across all cards & tables) |
| **Prohibited Styles** | Zero dark mode, black cards (`bg-black`, `bg-slate-900`), neon, glassmorphism | **VERIFIED** (Automated scan in `apps/web/tests/frontend_suite.test.mjs`) |

---

## 2. Route-by-Route UI/UX & Content Integrity Audit

1. **Public Portal (`/` — [`apps/web/src/app/page.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/page.tsx))**:
   - **Visual Hierarchy**: Editorial serif headlines paired with live station coordinates (`Maitri`, `Bharati`, `Himadri`, `Himansh`), persona switcher (`Student`, `Teacher`, `Journalist`, `Scientist`), and bilingual (`EN`/`HI`) toggle.
   - **Real Scientific Content**: Pulls live published research (`/api/v1/publications/published`), verified station catalog (`/api/v1/stations`), and real station telemetry (`/api/v1/weather/summary`). Zero placeholder or synthetic statistics.
2. **Editorial & Claim Review Workspace (`/workspace` — [`apps/web/src/app/workspace/page.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/workspace/page.tsx))**:
   - **3-Column Scientific Inspection Layout**: Left column for 4-track generation & revision history (`PIB`, `Social`, `Education`, `Vernacular`), center column for side-by-side claim-level verification badges (`VERIFIED`, `APPROXIMATE`, `CONFLICTING`, `UNSUPPORTED`, `NEEDS_REVIEW`), and right column for deterministic source provenance (`dataset_id`, `record_id`, `sha256`, `page_number`, `bbox`) and human approval controls.
3. **PDF Intelligence & BBox Source Inspector (`/documents` — [`apps/web/src/app/documents/page.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/documents/page.tsx))**:
   - Renders extracted pages, tables, figures, and chunks with normalized `[x0, y0, x1, y1]` bounding-box coordinates and direct source-jump deep links.
4. **Weather & Cryosphere Telemetry (`/weather` — [`apps/web/src/app/weather/page.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/weather/page.tsx))**:
   - Displays calibrated time-series charts, Min/Max/Mean/Anomaly KPIs, quality-control badges (`VALID`, `SUSPICIOUS`, `OUT_OF_RANGE`, `MISSING`), and SHA-256 dataset provenance.
5. **Station & Expedition Explorer (`/stations`, `/expeditions`), Datasets (`/datasets`), Unified Search (`/explore`), Polar Classroom (`/education`), Media & Press Kit (`/media`), Research (`/research`), About (`/about`), and Admin Console (`/admin`)**:
   - Explicit loading skeletons, informative empty states, structured error recovery states, and tabular numeric alignment (`font-variant-numeric: tabular-nums`).

---

## 3. Accessibility (WCAG 2.1 AA & GIGW 3.0 Compliance)

- **Keyboard Navigation & Skip Link**: Root layout ([`apps/web/src/app/layout.tsx`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/layout.tsx)) provides a keyboard-accessible `Skip to main scientific content` link targeting `<main id="main-content" tabIndex={-1}>`.
- **Focus Visibility**: Explicit `:focus-visible` 2px primary blue outline (`#2563EB`) with 2px offset in [`apps/web/src/app/globals.css`](file:///c:/Users/ayush/OneDrive/Desktop/SIH%20Project%202/apps/web/src/app/globals.css).
- **Reduced Motion**: `@media (prefers-reduced-motion: reduce)` disables non-essential transitions for vestibular accessibility.
- **ARIA & Semantic Landmarks**: `<header>`, `<nav>`, `<main>`, `<footer>`, `role="tablist"`, `role="tab"`, `aria-selected`, and `aria-pressed` states verified across interactive controls.
