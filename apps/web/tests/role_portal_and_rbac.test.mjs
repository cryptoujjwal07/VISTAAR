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
  assert.ok(fs.existsSync(fullPath), `Expected file to exist: ${relPath}`);
  return fs.readFileSync(fullPath, 'utf-8');
}

const SERVER_URL = 'http://localhost:3000';

describe('VISTAAR Role-Based Portals, Minimal Navbar, and RBAC Verification Suite', () => {

  // ==========================================
  // 1. PUBLIC NAVBAR & HOME PAGE
  // ==========================================
  describe('1. Clean Public Navbar & Landing Search', () => {
    test('Navbar ONLY renders Logo, EN/हिंदी toggle, Search, and Sign In (no role/station links)', () => {
      const navbarContent = readFile('components/layout/navbar.tsx');

      // Must have the core elements
      assert.match(navbarContent, /VISTAAR/i, 'Navbar must include VISTAAR branding');
      assert.match(navbarContent, /EN\s*\/\s*हिंदी|BHASHINI/i, 'Navbar must include Bhashini EN / हिंदी language selector');
      assert.match(navbarContent, /Search|⌘K/i, 'Navbar must include Search trigger');
      assert.match(navbarContent, /Sign In|Login/i, 'Navbar must include Sign In entry point');

      // Must NOT have old public navbar items
      assert.doesNotMatch(navbarContent, /CORE_NAV_ITEMS/i, 'Navbar must not define multi-link public navigation');
      assert.doesNotMatch(navbarContent, /href="\/overview"/i, 'Navbar must not link to /overview');
      assert.doesNotMatch(navbarContent, /href="\/stations"/i, 'Navbar must not link to /stations');
      assert.doesNotMatch(navbarContent, /href="\/weather"/i, 'Navbar must not link to /weather');
      assert.doesNotMatch(navbarContent, /href="\/research"/i, 'Navbar must not link to /research in public nav');
      assert.doesNotMatch(navbarContent, /href="\/classroom"/i, 'Navbar must not link to /classroom in public nav');
      assert.doesNotMatch(navbarContent, /href="\/expeditions"/i, 'Navbar must not link to /expeditions in public nav');
      assert.doesNotMatch(navbarContent, /href="\/media"/i, 'Navbar must not link to /media in public nav');

      // Role names must NEVER appear in public navbar
      assert.doesNotMatch(navbarContent, />Scientist</, 'Scientist link must not appear in public navbar');
      assert.doesNotMatch(navbarContent, />Researcher</, 'Researcher link must not appear in public navbar');
      assert.doesNotMatch(navbarContent, />Teacher</, 'Teacher link must not appear in public navbar');
      assert.doesNotMatch(navbarContent, />Student</, 'Student link must not appear in public navbar');
      assert.doesNotMatch(navbarContent, />Admin</, 'Admin link must not appear in public navbar');
    });

    test('Home page central search has exact placeholder and 7 category filters', () => {
      const homeContent = readFile('app/page.tsx');

      // Exact placeholder requested
      assert.match(
        homeContent,
        /Search polar science, research, stations, expeditions, datasets and stories\.\.\./i,
        'Home page must contain the exact search placeholder'
      );

      // The 7 category filters
      const requiredFilters = ['Antarctica', 'Arctic', 'Himalayas', 'Station', 'Expedition', 'Year', 'Content type'];
      for (const filter of requiredFilters) {
        assert.ok(
          homeContent.includes(filter),
          `Home page must contain filter: "${filter}"`
        );
      }

      // Floating AI assistant present
      assert.match(homeContent, /Barfii/i, 'Home page must feature floating grounded AI');
    });
  });

  // ==========================================
  // 2. SCIENTIST PORTAL (/scientist)
  // ==========================================
  describe('2. 🔬 Scientist Portal Specification', () => {
    test('Scientist page contains all 12 specified tabs and CAN/CANNOT boundaries', () => {
      const content = readFile('app/scientist/page.tsx');

      const expectedTabs = [
        'dashboard',
        'my_research',
        'documents',
        'datasets',
        'photos',
        'videos',
        'notes',
        'expeditions',
        'stations',
        'weather',
        'submissions',
        'profile',
      ];

      for (const tab of expectedTabs) {
        assert.ok(
          content.includes(`'${tab}'`) || content.includes(`"${tab}"`),
          `Scientist page must implement tab: ${tab}`
        );
      }

      // Scientist CAN capabilities
      assert.match(content, /Scientist CAN/i, 'Must define Scientist CAN boundary card');
      assert.match(content, /Upload research/i, 'Scientist CAN upload research');
      assert.match(content, /Upload PDF\/CSV\/photos\/videos/i, 'Scientist CAN upload media and datasets');
      assert.match(content, /Add observations\/notes/i, 'Scientist CAN record field notes');

      // Scientist CANNOT limitations
      assert.match(content, /Scientist CANNOT/i, 'Must define Scientist CANNOT boundary card');
      assert.match(content, /Manage users/i, 'Scientist CANNOT manage users');
      assert.match(content, /Edit another scientist/i, 'Scientist CANNOT edit others private research');

      // Stations & Expeditions
      assert.match(content, /Maitri|Bharati|Himadri|Himansh/i, 'Scientist portal must reference India polar stations');
    });
  });

  // ==========================================
  // 3. RESEARCHER PORTAL (/researcher)
  // ==========================================
  describe('3. 🧪 Researcher Portal Specification', () => {
    test('Researcher page contains all 12 specified tabs and CAN/CANNOT boundaries', () => {
      const content = readFile('app/researcher/page.tsx');

      const expectedTabs = [
        'dashboard',
        'library',
        'search',
        'documents',
        'datasets',
        'data_explorer',
        'weather_analysis',
        'workspace',
        'my_research',
        'findings',
        'citations',
        'profile',
      ];

      for (const tab of expectedTabs) {
        assert.ok(
          content.includes(`'${tab}'`) || content.includes(`"${tab}"`),
          `Researcher page must implement tab: ${tab}`
        );
      }

      // Researcher CAN & CANNOT
      assert.match(content, /Researcher CAN/i, 'Must define Researcher CAN boundary card');
      assert.match(content, /Read authorized research/i, 'Researcher CAN read authorized research');
      assert.match(content, /Analyze datasets/i, 'Researcher CAN analyze datasets');
      assert.match(content, /Weather Analysis/i, 'Researcher CAN perform weather analysis');
      assert.match(content, /Use AI on authorized sources/i, 'Researcher CAN use AI on sources');

      assert.match(content, /Researcher CANNOT/i, 'Must define Researcher CANNOT boundary card');
      assert.match(content, /Modify original Scientist data/i, 'Researcher CANNOT modify original scientist data');
      assert.match(content, /Manage users/i, 'Researcher CANNOT manage users');
    });
  });

  // ==========================================
  // 4. TEACHER PORTAL (/teacher)
  // ==========================================
  describe('4. 👨‍🏫 Teacher Portal Specification', () => {
    test('Teacher page contains all 11 tabs, 9 AI content types, and CAN/CANNOT boundaries', () => {
      const content = readFile('app/teacher/page.tsx');

      const expectedTabs = [
        'dashboard',
        'library',
        'generator',
        'lessons',
        'quizzes',
        'activities',
        'classes',
        'assignments',
        'progress',
        'resources',
        'profile',
      ];

      for (const tab of expectedTabs) {
        assert.ok(
          content.includes(`'${tab}'`) || content.includes(`"${tab}"`),
          `Teacher page must implement tab: ${tab}`
        );
      }

      // 9 AI Content Types
      const contentTypes = [
        'Lesson',
        'Explanation',
        'Quiz',
        'Activity',
        'Worksheet',
        'Assignment',
        'Discussion questions',
        'Summary',
        'Article',
      ];

      for (const type of contentTypes) {
        assert.ok(
          content.toLowerCase().includes(type.toLowerCase()),
          `Teacher AI Generator must include content type: ${type}`
        );
      }

      // Teacher CAN / CANNOT
      assert.match(content, /Teacher CAN/i, 'Must define Teacher CAN boundary card');
      assert.match(content, /Generate educational content with AI/i, 'Teacher CAN generate educational content with AI');
      assert.match(content, /Manage own classes/i, 'Teacher CAN manage own classes');
      assert.match(content, /Teacher CANNOT/i, 'Must define Teacher CANNOT boundary card');
      assert.match(content, /Modify original scientific research/i, 'Teacher CANNOT modify original scientific research');
    });
  });

  // ==========================================
  // 5. STUDENT PORTAL (/student)
  // ==========================================
  describe('5. 🎓 Student Portal Specification', () => {
    test('Student page contains all 12 tabs and CAN/CANNOT boundaries', () => {
      const content = readFile('app/student/page.tsx');

      const expectedTabs = [
        'home',
        'explore',
        'lessons',
        'quizzes',
        'activities',
        'articles',
        'videos',
        'polar_explorer',
        'weather',
        'assignments',
        'progress',
        'profile',
      ];

      for (const tab of expectedTabs) {
        assert.ok(
          content.includes(`'${tab}'`) || content.includes(`"${tab}"`),
          `Student page must implement tab: ${tab}`
        );
      }

      // Student CAN / CANNOT
      assert.match(content, /Student CAN/i, 'Must define Student CAN boundary card');
      assert.match(content, /Read research summaries/i, 'Student CAN read summaries');
      assert.match(content, /Attempt quizzes/i, 'Student CAN attempt quizzes');
      assert.match(content, /Submit assignments/i, 'Student CAN submit assignments');

      assert.match(content, /Student CANNOT/i, 'Must define Student CANNOT boundary card');
      assert.match(content, /Upload scientific datasets/i, 'Student CANNOT upload scientific datasets');
      assert.match(content, /Access private\/restricted research/i, 'Student CANNOT access restricted research');
    });
  });

  // ==========================================
  // 6. ADMIN PORTAL (/admin)
  // ==========================================
  describe('6. 🛡️ Admin Portal Specification', () => {
    test('Admin page contains all 14 governance tabs and CAN capabilities', () => {
      const content = readFile('app/admin/page.tsx');

      const expectedTabs = [
        'overview',
        'users',
        'scientist_applications',
        'researcher_applications',
        'teacher_student',
        'roles',
        'datasets',
        'content_governance',
        'audit',
        'system_health',
        'storage',
        'ai_config',
        'security',
        'settings',
      ];

      for (const tab of expectedTabs) {
        assert.ok(
          content.includes(`'${tab}'`) || content.includes(`"${tab}"`),
          `Admin page must implement tab: ${tab}`
        );
      }

      // Admin verification & governance
      assert.match(content, /Scientist Applications/i, 'Admin must handle scientist applications');
      assert.match(content, /Researcher Applications/i, 'Admin must handle researcher applications');
      assert.match(content, /Audit Logs/i, 'Admin must have audit logs');
      assert.match(content, /System Health/i, 'Admin must have system health metrics');
    });
  });

  // ==========================================
  // 7. RBAC & 403 FORBIDDEN ENFORCEMENT
  // ==========================================
  describe('7. 🔐 Strict RBAC & 403 Forbidden Screen', () => {
    test('AuthGate defines 403 Forbidden UI with explicit role violation details', () => {
      const authGateContent = readFile('components/layout/AuthGate.tsx');

      assert.match(authGateContent, /403 Forbidden/i, 'AuthGate must render 403 Forbidden');
      assert.match(authGateContent, /Access Denied/i, 'AuthGate must render Access Denied');
      assert.match(authGateContent, /ROLE_PORTAL_MAP/i, 'AuthGate must define ROLE_PORTAL_MAP');
      assert.match(authGateContent, /isRouteAllowedForRole/i, 'AuthGate must enforce isRouteAllowedForRole');

      // Test permission matrix in code
      assert.match(authGateContent, /SCIENTIST:[\s\S]*?\/scientist/i, 'Scientist allowed on /scientist');
      assert.match(authGateContent, /STUDENT:[\s\S]*?\/student/i, 'Student allowed on /student');
      assert.match(authGateContent, /TEACHER:[\s\S]*?\/teacher/i, 'Teacher allowed on /teacher');
      assert.match(authGateContent, /RESEARCHER:[\s\S]*?\/researcher/i, 'Researcher allowed on /researcher');
      assert.match(authGateContent, /ADMIN:[\s\S]*?\/admin/i, 'Admin allowed on /admin');
    });

    test('Next.js Edge Middleware intercepts cross-role navigation and enforces 403 / redirect', () => {
      const middlewareContent = readFile('middleware.ts');

      assert.match(middlewareContent, /export const config/i, 'Middleware must export matcher config');
      assert.match(middlewareContent, /\/scientist/i, 'Matcher must guard /scientist');
      assert.match(middlewareContent, /\/researcher/i, 'Matcher must guard /researcher');
      assert.match(middlewareContent, /\/teacher/i, 'Matcher must guard /teacher');
      assert.match(middlewareContent, /\/student/i, 'Matcher must guard /student');
      assert.match(middlewareContent, /\/admin/i, 'Matcher must guard /admin');
      assert.match(middlewareContent, /status:\s*403/i, 'Middleware must return HTTP 403 for unauthorized cross-role requests');
    });
  });

  // ==========================================
  // 8. LIVE DEV SERVER HTTP CHECKS
  // ==========================================
  describe('8. Live Server HTTP Endpoint Validation (http://localhost:3000)', () => {
    test('GET / returns 200 OK with clean public landing page HTML', async () => {
      const res = await fetch(`${SERVER_URL}/`);
      assert.equal(res.status, 200, 'Home page must respond with 200 OK');
      const html = await res.text();
      assert.match(html, /VISTAAR/i, 'Home page HTML must contain VISTAAR');
      assert.match(html, /Search polar science/i, 'Home page HTML must contain search placeholder');
    });

    test('GET /scientist with Student role cookie returns 403 Forbidden from Edge Middleware', async () => {
      const res = await fetch(`${SERVER_URL}/scientist`, {
        headers: {
          'Cookie': 'vistaar_user_role=student; vistaar_auth_token=mock_student_token'
        }
      });
      assert.equal(res.status, 403, 'Navigating to /scientist with student cookie must return 403 Forbidden');
      const html = await res.text();
      assert.match(html, /403 Forbidden/i, 'Response must display 403 Forbidden error message');
      assert.match(html, /Student/i, 'Response must indicate current role was Student');
    });

    test('GET /admin with Scientist role cookie returns 403 Forbidden from Edge Middleware', async () => {
      const res = await fetch(`${SERVER_URL}/admin`, {
        headers: {
          'Cookie': 'vistaar_user_role=scientist; vistaar_auth_token=mock_scientist_token'
        }
      });
      assert.equal(res.status, 403, 'Navigating to /admin with scientist cookie must return 403 Forbidden');
      const html = await res.text();
      assert.match(html, /403 Forbidden/i, 'Response must display 403 Forbidden error message');
    });

    test('GET /admin with Researcher role cookie returns 403 Forbidden', async () => {
      const res = await fetch(`${SERVER_URL}/admin`, {
        headers: {
          'Cookie': 'vistaar_user_role=researcher; vistaar_auth_token=mock_researcher_token'
        }
      });
      assert.equal(res.status, 403, 'Navigating to /admin with researcher cookie must return 403 Forbidden');
    });

    test('GET /admin with Teacher role cookie returns 403 Forbidden', async () => {
      const res = await fetch(`${SERVER_URL}/admin`, {
        headers: {
          'Cookie': 'vistaar_user_role=teacher; vistaar_auth_token=mock_teacher_token'
        }
      });
      assert.equal(res.status, 403, 'Navigating to /admin with teacher cookie must return 403 Forbidden');
    });

    test('GET /scientist with authorized Scientist role cookie returns 200 OK', async () => {
      const res = await fetch(`${SERVER_URL}/scientist`, {
        headers: {
          'Cookie': 'vistaar_user_role=scientist; vistaar_auth_token=mock_scientist_token'
        }
      });
      assert.equal(res.status, 200, 'Scientist accessing /scientist must return 200 OK');
      const html = await res.text();
      assert.match(html, /Scientist/i, 'HTML must render Scientist portal content');
    });

    test('GET /student with authorized Student role cookie returns 200 OK', async () => {
      const res = await fetch(`${SERVER_URL}/student`, {
        headers: {
          'Cookie': 'vistaar_user_role=student; vistaar_auth_token=mock_student_token'
        }
      });
      assert.equal(res.status, 200, 'Student accessing /student must return 200 OK');
    });

    test('GET /teacher with authorized Teacher role cookie returns 200 OK', async () => {
      const res = await fetch(`${SERVER_URL}/teacher`, {
        headers: {
          'Cookie': 'vistaar_user_role=teacher; vistaar_auth_token=mock_teacher_token'
        }
      });
      assert.equal(res.status, 200, 'Teacher accessing /teacher must return 200 OK');
    });

    test('GET /researcher with authorized Researcher role cookie returns 200 OK', async () => {
      const res = await fetch(`${SERVER_URL}/researcher`, {
        headers: {
          'Cookie': 'vistaar_user_role=researcher; vistaar_auth_token=mock_researcher_token'
        }
      });
      assert.equal(res.status, 200, 'Researcher accessing /researcher must return 200 OK');
    });

    test('GET /admin with authorized Admin role cookie returns 200 OK', async () => {
      const res = await fetch(`${SERVER_URL}/admin`, {
        headers: {
          'Cookie': 'vistaar_user_role=admin; vistaar_auth_token=mock_admin_token'
        }
      });
      assert.equal(res.status, 200, 'Admin accessing /admin must return 200 OK');
    });
  });
});
