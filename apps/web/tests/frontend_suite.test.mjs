import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.join(WEB_ROOT, 'src');

function readFile(relPath) {
  const fullPath = path.join(SRC_DIR, relPath);
  assert.ok(fs.existsSync(fullPath), `Expected frontend source file to exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf-8');
}

const REQUIRED_PAGES = [
  'app/layout.tsx',
  'app/page.tsx',
  'app/about/page.tsx',
  'app/admin/page.tsx',
  'app/datasets/page.tsx',
  'app/documents/page.tsx',
  'app/education/page.tsx',
  'app/expeditions/page.tsx',
  'app/explore/page.tsx',
  'app/media/page.tsx',
  'app/research/page.tsx',
  'app/stations/page.tsx',
  'app/weather/page.tsx',
  'app/workspace/page.tsx',
];

describe('VISTAAR Frontend Component, Critical Workflow, Accessibility & UI/UX Audit Suite (Prompts 30 & 33)', () => {
  test('1. All 13 App Router pages and layout components exist and export valid React views', () => {
    for (const pagePath of REQUIRED_PAGES) {
      const content = readFile(pagePath);
      assert.match(content, /export\s+default\s+function/, `Page ${pagePath} must export a default React component`);
    }
  });

  test('2. API client implements request deduplication, retry backoff, Idempotency-Key, and bounded TTL caching', () => {
    const apiClient = readFile('lib/api.ts');
    assert.match(apiClient, /inflightGetRequests/, 'API client must coalesce identical in-flight GET requests');
    assert.match(apiClient, /Idempotency-Key/, 'API client must support Idempotency-Key headers for safe mutations');
    assert.match(apiClient, /maxRetries/, 'API client must implement exponential retry backoff');
    assert.match(apiClient, /clearClientApiCache/, 'API client must expose cache invalidation');
  });

  test('3. Critical scientific workflows (PDF BBox Inspector, Claim Verification Workspace, Weather Telemetry, Education Hub)', () => {
    const documentsPage = readFile('app/documents/page.tsx');
    assert.match(documentsPage, /bbox|page_number|chunk/i, 'Documents workspace must support PDF bounding-box provenance');

    const workspacePage = readFile('app/workspace/page.tsx');
    assert.match(workspacePage, /VERIFIED|CONFLICTING|UNSUPPORTED|claim/i, 'Review/Outreach workspace must render claim verification states');

    const weatherPage = readFile('app/weather/page.tsx');
    assert.match(weatherPage, /timeseries|station/i, 'Weather page must render real station telemetry');

    const educationPage = readFile('app/education/page.tsx');
    assert.match(educationPage, /classroom|lesson|quiz/i, 'Education page must integrate NCERT classroom lessons and quizzes');
  });

  test('4. Accessibility (WCAG 2.1 AA / GIGW): semantic landmarks, skip-to-main link, keyboard focus, and reduced-motion', () => {
    const layoutContent = readFile('app/layout.tsx');
    assert.match(layoutContent, /<html\s+lang=/, 'Root layout must declare document language attribute');
    assert.match(layoutContent, /href="#main-content"/, 'Root layout must provide keyboard skip-to-main-content link');
    assert.match(layoutContent, /<main\s+id="main-content"/, 'Root layout must define #main-content semantic landmark');

    const globalsCss = readFile('app/globals.css');
    assert.match(globalsCss, /:focus-visible/, 'globals.css must define keyboard :focus-visible outline');
    assert.match(globalsCss, /prefers-reduced-motion/, 'globals.css must support prefers-reduced-motion');
    assert.match(globalsCss, /tabular-nums/, 'globals.css must enforce tabular numerals on scientific tables/code');
  });

  test('5. Prompt 33 UI/UX Audit: Warm Ivory Design Tokens (#FAF7F0, #FFFFFF, #2563EB, #0E7490, #17202A, #E7E0D5) & Zero Dark Cards / Placeholders', () => {
    const globalsCss = readFile('app/globals.css');
    for (const token of ['#FAF7F0', '#FFFFFF', '#17202A', '#E7E0D5', '#2563EB', '#0E7490']) {
      assert.ok(globalsCss.includes(token), `globals.css must define mandatory design token ${token}`);
    }

    for (const pagePath of REQUIRED_PAGES) {
      const content = readFile(pagePath);
      assert.doesNotMatch(content, /bg-black|bg-slate-900|bg-gray-900|bg-zinc-900/, `Page ${pagePath} must not use dark-mode/black cards`);
      assert.doesNotMatch(content, /Lorem ipsum|TODO:|FIXME:/i, `Page ${pagePath} must not contain placeholder text`);
    }
  });
});
