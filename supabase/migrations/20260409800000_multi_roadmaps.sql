-- Add roadmap_type to separate product / UI / database / marketing roadmaps
ALTER TABLE roadmap_phases ADD COLUMN IF NOT EXISTS roadmap_type text NOT NULL DEFAULT 'product';
ALTER TABLE roadmap_items  ADD COLUMN IF NOT EXISTS roadmap_type text NOT NULL DEFAULT 'product';

-- Update existing rows
UPDATE roadmap_phases SET roadmap_type = 'product';
UPDATE roadmap_items  SET roadmap_type = 'product';

-- ─── UI ROADMAP ──────────────────────────────────────────────────────────────
INSERT INTO roadmap_phases (phase_number, title, description, status, roadmap_type) VALUES
(1, 'Design Tokens & System',     'Typography scale, color palette, spacing system, shadow tokens', 'active',  'ui'),
(2, 'Component Library',          'All reusable UI atoms and molecules standardised',               'pending', 'ui'),
(3, 'Page Polish & Animations',   'Micro-interactions, page transitions, skeleton states',          'pending', 'ui'),
(4, 'Dark Mode & Theming',        'Full dark mode, brand theme switcher, high-contrast mode',       'pending', 'ui'),
(5, 'Mobile & Accessibility',     'WCAG AA compliance, touch targets, font scaling',                'pending', 'ui');

-- UI Phase 1 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='ui' AND phase_number=1)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Define color palette tokens',
    'Create typography scale (h1–caption)',
    'Standardise spacing system (4px grid)',
    'Define shadow & elevation tokens',
    'Create border-radius token set',
    'Add CSS custom properties to globals.css',
    'Document design tokens in Storybook or README',
    'Audit existing Tailwind classes for consistency',
    'Create brand gradient utilities',
    'Define icon size standards'
  ]),
  unnest(ARRAY[
    'Add all brand colors as CSS vars and Tailwind config tokens',
    'Set h1–h6, body, caption, label sizes and weights in typography config',
    'Define spacing-1 through spacing-16 aligned to 4px grid',
    'Define sm/md/lg/xl shadow tokens for cards and modals',
    'Create rounded-sm/md/lg/xl/2xl/pill tokens used app-wide',
    'Centralise all design tokens as :root CSS variables in globals.css',
    'Write a DESIGN_TOKENS.md documenting all tokens with usage examples',
    'Run a codebase grep for hardcoded hex/px values and replace with tokens',
    'Add brand-gradient, brand-gradient-muted utilities to Tailwind config',
    'Define icon-sm/md/lg size constants used across all icon instances'
  ]),
  'pixel','app','pending','ui'
FROM p;

-- UI Phase 2 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='ui' AND phase_number=2)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Standardise Button variants',
    'Standardise Input & Textarea',
    'Build reusable Avatar component',
    'Build reusable Badge component',
    'Build reusable EmptyState component',
    'Build reusable LoadingSpinner',
    'Build ConfirmDialog component',
    'Standardise Card component',
    'Build PageHeader component',
    'Build BottomSheet component'
  ]),
  unnest(ARRAY[
    'Primary/secondary/ghost/destructive/outline variants with loading state',
    'Consistent height, border, focus ring, error state across all inputs',
    'Avatar with image, initials fallback, online indicator, size variants',
    'Badge with status colors: success/warning/error/info/default',
    'Empty state with icon, title, description, optional CTA button',
    'Spinner with sm/md/lg variants matching brand colors',
    'Reusable confirm/danger dialog with title, message, confirm/cancel',
    'Card with hover state, padding variants, border options',
    'PageHeader with back button, title, optional actions slot',
    'iOS-style bottom sheet with drag handle, snap points, backdrop'
  ]),
  'pixel','app','pending','ui'
FROM p;

-- UI Phase 3 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='ui' AND phase_number=3)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Page transition animations',
    'Button press micro-interaction',
    'Card hover lift effect',
    'Skeleton loading for feed',
    'Skeleton loading for coach cards',
    'Pull-to-refresh animation',
    'Toast notification animations',
    'Modal enter/exit animations',
    'Tab switch animations',
    'Like/reaction burst animation'
  ]),
  unnest(ARRAY[
    'Smooth slide/fade transitions between routes using Framer Motion',
    'Scale 0.97 + opacity on press, spring bounce on release',
    'translateY(-2px) + shadow increase on card hover',
    'Shimmer skeleton for feed posts matching real card dimensions',
    'Shimmer skeleton for coach cards in Discover grid',
    'Pull-to-refresh with spring physics and loading spinner',
    'Slide-in from bottom with stagger for multiple toasts',
    'Scale + fade for modal, slide-up for sheet',
    'Animated underline or slide indicator on tab change',
    'Heart burst with particle effect on like'
  ]),
  'pixel','app','pending','ui'
FROM p;

-- UI Phase 4 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='ui' AND phase_number=4)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Dark mode CSS variables',
    'Theme toggle component',
    'Dark mode coach card',
    'Dark mode feed post',
    'Dark mode navigation',
    'Dark mode modals & sheets',
    'Dark mode forms & inputs',
    'System preference detection',
    'Persist theme preference',
    'High-contrast accessibility mode'
  ]),
  unnest(ARRAY[
    'Define --background/--foreground/--card etc for dark theme in globals.css',
    'Sun/moon toggle with smooth transition, stored in localStorage',
    'Verify CoachCard looks correct in dark mode, fix any contrast issues',
    'Verify FeedPostCard and VideoCard look correct in dark mode',
    'Verify NavBar and BottomNav look correct in dark mode',
    'Verify all dialogs, sheets, drawers look correct in dark mode',
    'Verify all input, select, textarea elements look correct in dark mode',
    'Auto-detect prefers-color-scheme and apply on first load',
    'Save theme to localStorage and restore on page load',
    'Add high-contrast variant for visually impaired users'
  ]),
  'pixel','app','pending','ui'
FROM p;

-- UI Phase 5 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='ui' AND phase_number=5)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Touch target audit',
    'Font scaling support',
    'Screen reader labels',
    'Keyboard navigation',
    'Focus visible styles',
    'Color contrast audit',
    'Reduced motion support',
    'Responsive grid breakpoints',
    'Safe area insets (iPhone notch)',
    'Landscape mode layouts'
  ]),
  unnest(ARRAY[
    'All interactive elements minimum 44x44px per WCAG 2.5.5',
    'Support iOS/Android system font size scaling without layout breaks',
    'Add aria-label to all icon-only buttons and interactive elements',
    'Full keyboard navigation with visible focus for Tab/Enter/Escape',
    'focus-visible:ring-2 ring-primary on all interactive elements',
    'All text meets WCAG AA 4.5:1 contrast ratio',
    'Respect prefers-reduced-motion, disable animations',
    'Consistent sm/md/lg/xl breakpoints across all layouts',
    'env(safe-area-inset-*) padding on fixed elements',
    'Landscape-specific layouts for key pages'
  ]),
  'pixel','app','pending','ui'
FROM p;

-- ─── DATABASE ROADMAP ────────────────────────────────────────────────────────
INSERT INTO roadmap_phases (phase_number, title, description, status, roadmap_type) VALUES
(1, 'Schema Audit & Cleanup',    'Review all tables, remove redundancy, enforce constraints',   'active',  'database'),
(2, 'Performance & Indexes',     'Query optimisation, composite indexes, explain analysis',      'pending', 'database'),
(3, 'RLS Security Hardening',    'Full RLS audit, policy coverage, auth.uid() enforcement',     'pending', 'database'),
(4, 'Real-time & Subscriptions', 'Live presence, booking notifications, feed updates',          'pending', 'database'),
(5, 'Analytics & Reporting',     'Materialised views, aggregates, coach business metrics',      'pending', 'database');

-- DB Phase 1 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='database' AND phase_number=1)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Audit all table schemas',
    'Add missing NOT NULL constraints',
    'Add missing foreign key constraints',
    'Add check constraints on enums',
    'Normalise duplicate data',
    'Add updated_at triggers',
    'Audit column naming conventions',
    'Remove unused columns',
    'Add table-level comments',
    'Verify all primary keys are UUID'
  ]),
  unnest(ARRAY[
    'Review every table for missing constraints, redundant columns, poor naming',
    'Add NOT NULL to required fields that currently allow null',
    'Add FK constraints with ON DELETE CASCADE/SET NULL where appropriate',
    'Add CHECK constraints for status fields (only allow valid enum values)',
    'Identify and merge duplicate data patterns across tables',
    'Ensure all tables have updated_at TIMESTAMPTZ with auto-update trigger',
    'Rename snake_case inconsistencies, standardise plural table names',
    'Drop columns that have no references in codebase',
    'Add COMMENT ON TABLE and COMMENT ON COLUMN for documentation',
    'Ensure all id columns use gen_random_uuid() default'
  ]),
  'database','app','pending','database'
FROM p;

-- DB Phase 2 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='database' AND phase_number=2)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Index bookings on coach_id + date',
    'Index coach_videos on coach_id + created_at',
    'Index messages on conversation_id + created_at',
    'GIN index on coach profiles for full-text search',
    'Composite index on feed queries',
    'Partial index for active/pending records',
    'Analyse slow queries with EXPLAIN ANALYZE',
    'Add connection pooling config',
    'Optimise N+1 query patterns in hooks',
    'Add query result caching layer'
  ]),
  unnest(ARRAY[
    'CREATE INDEX ON bookings(coach_id, date DESC) for dashboard queries',
    'CREATE INDEX ON coach_videos(coach_id, created_at DESC)',
    'CREATE INDEX ON messages(conversation_id, created_at ASC)',
    'CREATE INDEX ON coach_profiles USING gin(to_tsvector(coach_name || sport))',
    'Composite index matching the smart-feed query pattern',
    'Partial index WHERE status != cancelled on bookings',
    'Run EXPLAIN ANALYZE on top 10 most frequent queries and fix slow ones',
    'Configure pgBouncer/Supavisor pool size for production load',
    'Audit React hooks for N+1 patterns, batch queries where possible',
    'Implement React Query or SWR caching for frequently accessed data'
  ]),
  'database','app','pending','database'
FROM p;

-- DB Phase 3 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='database' AND phase_number=3)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Audit all RLS policies',
    'Enforce auth.uid() on all user tables',
    'Coach-only write policies',
    'Admin bypass policies',
    'Storage bucket RLS',
    'Block direct table access for anon',
    'Rate limiting on edge functions',
    'Audit service role key usage',
    'Add row-level encryption for PII',
    'Security test suite'
  ]),
  unnest(ARRAY[
    'Review every table policy — ensure no gaps in coverage',
    'All SELECT/INSERT/UPDATE/DELETE on user data must check auth.uid() = user_id',
    'coach_videos, availability, coach_profiles: only coach can write their own rows',
    'Admin role can read/write all rows via role check',
    'Restrict storage uploads to authenticated users, reads to owner or public',
    'All tables should block anon reads on sensitive data',
    'Add per-IP and per-user rate limits to all Edge Functions',
    'Audit all places service role key is used — restrict to server-only',
    'Encrypt email, phone columns using pgcrypto',
    'Write pg_tap tests for all critical RLS policies'
  ]),
  'shield','app','pending','database'
FROM p;

-- DB Phase 4 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='database' AND phase_number=4)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Real-time booking notifications',
    'Live chat message delivery',
    'Online presence indicators',
    'Feed real-time new posts',
    'Notification bell live count',
    'Coach availability live updates',
    'Booking status push updates',
    'Real-time dashboard metrics',
    'Live session participant count',
    'Heartbeat for active coaches'
  ]),
  unnest(ARRAY[
    'Subscribe to bookings INSERT for coach — toast on new booking',
    'Subscribe to messages INSERT in open conversation',
    'Track last_seen in profiles, show green dot for < 5min',
    'Subscribe to feed_posts INSERT, show "New posts" pill',
    'Subscribe to notifications INSERT, update bell badge count live',
    'Broadcast availability slot changes in real time',
    'Push booking status changes (confirmed/cancelled) to athlete',
    'Real-time counters on coach dashboard overview tab',
    'Live participant count on live session cards',
    'Update coach_profiles.last_active every 60s while app is open'
  ]),
  'dev','app','pending','database'
FROM p;

-- DB Phase 5 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='database' AND phase_number=5)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Materialised view: coach_stats',
    'Materialised view: platform_metrics',
    'Revenue aggregation function',
    'Retention cohort analysis',
    'Search analytics table',
    'Booking conversion funnel',
    'Content performance metrics',
    'Geo distribution analytics',
    'Scheduled stats refresh',
    'Admin analytics dashboard data'
  ]),
  unnest(ARRAY[
    'CREATE MATERIALIZED VIEW coach_stats AS total bookings, revenue, rating per coach',
    'Platform-wide DAU/WAU/MAU, total coaches, total bookings materialized view',
    'Function to return daily/weekly/monthly/yearly revenue for a coach',
    'Cohort analysis: which signup cohorts have highest retention',
    'Log search queries + click-through for search quality analysis',
    'Track: discover view → profile view → booking started → booking completed',
    'Views, likes, comments, watch-time aggregates per video',
    'Group athletes/coaches by country/city for geo distribution reports',
    'pg_cron job to REFRESH MATERIALIZED VIEW CONCURRENTLY every hour',
    'Views and functions to power the admin analytics dashboard'
  ]),
  'dev','app','pending','database'
FROM p;

-- ─── MARKETING ROADMAP ───────────────────────────────────────────────────────
INSERT INTO roadmap_phases (phase_number, title, description, status, roadmap_type) VALUES
(1, 'Landing Page & SEO',     'Conversion-optimised landing page, meta tags, sitemap',       'active',  'marketing'),
(2, 'Social Proof & Content', 'Coach spotlights, testimonials, press, blog',                 'pending', 'marketing'),
(3, 'Email & Onboarding',     'Welcome sequences, re-engagement, booking reminders',         'pending', 'marketing'),
(4, 'Referral & Viral',       'Coach referral programme, athlete invite rewards',             'pending', 'marketing'),
(5, 'Paid & Growth',          'Ad-ready landing pages, UTM tracking, conversion pixels',     'pending', 'marketing');

-- Marketing Phase 1 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='marketing' AND phase_number=1)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Hero section redesign',
    'Value proposition blocks',
    'Coach showcase section',
    'Social proof counter bar',
    'How it works section',
    'Pricing / CTA section',
    'SEO meta tags',
    'Open Graph & Twitter cards',
    'XML sitemap',
    'Google Analytics 4 setup'
  ]),
  unnest(ARRAY[
    'Full-bleed hero with headline, sub-headline, dual CTA (coach/athlete), app store badges',
    '3 benefit blocks: Find your coach / Book in seconds / Train smarter',
    'Horizontal scroll of featured coaches with sport, rating, price',
    'Live animated counters: X coaches, X sessions booked, X sports',
    '3-step visual flow: Browse → Book → Train with illustration',
    'Free forever for athletes, coach pricing tiers with feature comparison',
    'Unique title/description/canonical for every page, structured data',
    'og:image 1200x630, twitter:card summary_large_image for all pages',
    'sitemap.xml with all public coach profile URLs, auto-updated',
    'GA4 + event tracking for CTA clicks, sign-ups, bookings'
  ]),
  'dev','app','pending','marketing'
FROM p;

-- Marketing Phase 2 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='marketing' AND phase_number=2)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Coach spotlight cards',
    'Athlete testimonials section',
    'Star rating aggregation display',
    'Press / media mentions bar',
    'Case study pages',
    'Blog infrastructure',
    'Sport category landing pages',
    'Coach success stories',
    'UGC integration',
    'Trust badges section'
  ]),
  unnest(ARRAY[
    'Featured coach cards with photo, sport, rating, short bio on landing page',
    'Rotating testimonial carousel with photo, name, sport, quote',
    'Display aggregate platform rating (e.g. 4.8★ from 1,200 sessions)',
    'Logo bar of press mentions or "As seen on" partnerships',
    'Deep-dive case studies: athlete before/after training with a coach',
    'Blog page with articles on training, sport tips, coach success',
    'Dedicated /sport/football, /sport/tennis etc SEO pages',
    'Coach success story format: background, challenge, results',
    'Pull athlete progress posts from feed into public testimonials',
    'Security badges, payment logos, ISO/GDPR compliance icons'
  ]),
  'dev','app','pending','marketing'
FROM p;

-- Marketing Phase 3 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='marketing' AND phase_number=3)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Welcome email sequence',
    'Coach onboarding email flow',
    'Booking confirmation email',
    'Session reminder email',
    'Post-session review prompt email',
    'Re-engagement email flow',
    'Newsletter signup',
    'Abandoned booking recovery',
    'Coach inactive nudge',
    'Birthday / milestone emails'
  ]),
  unnest(ARRAY[
    '3-email welcome series for athletes: account setup, find a coach, first booking',
    '5-email coach onboarding: profile setup, add availability, first client tips',
    'Transactional email on booking confirmed with date/time/coach details',
    'Reminder 24h and 1h before session with join link if online',
    'Email 2h after session asking athlete to leave review',
    '7-day and 30-day inactive user re-engagement with personalised coach suggestions',
    'Newsletter opt-in footer with weekly training tips digest',
    'If booking started but not completed, email 1h later with coach profile link',
    'Email coach if no new bookings in 14 days with tips to improve profile',
    'Personalized email on account anniversary or 10th booking milestone'
  ]),
  'dev','app','pending','marketing'
FROM p;

-- Marketing Phase 4 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='marketing' AND phase_number=4)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'Coach referral programme',
    'Athlete invite rewards',
    'Referral tracking table',
    'Share coach profile CTA',
    'Shareable session recap cards',
    'Affiliate link system',
    'Leaderboard for top referrers',
    'Viral loop: post-session share',
    'Coach embed widget',
    'WhatsApp / link share'
  ]),
  unnest(ARRAY[
    'Coaches earn credits when referred coaches join and complete 5 sessions',
    'Athletes get 1 free session credit for each friend they invite who books',
    'referrals table with referrer_id, referee_id, status, reward_issued',
    'Share button on coach profile with pre-filled message and tracking link',
    'Auto-generated image card after session: sport icon, coach name, stats',
    'Unique affiliate links for content creators to earn per sign-up',
    'Public leaderboard of top referring coaches by month',
    'After session completion, prompt athlete to share result on social',
    'Embeddable booking widget coaches can put on their own website',
    'One-tap share to WhatsApp with coach profile link and pre-filled intro'
  ]),
  'dev','app','pending','marketing'
FROM p;

-- Marketing Phase 5 items
WITH p AS (SELECT id FROM roadmap_phases WHERE roadmap_type='marketing' AND phase_number=5)
INSERT INTO roadmap_items (phase_id, title, description, category, target, status, roadmap_type) SELECT p.id,
  unnest(ARRAY[
    'UTM parameter tracking',
    'Facebook Pixel integration',
    'Google Ads conversion tracking',
    'TikTok Pixel integration',
    'Ad-specific landing pages',
    'A/B test infrastructure',
    'Retargeting audience setup',
    'Cost per acquisition tracking',
    'Attribution dashboard',
    'Lookalike audience export'
  ]),
  unnest(ARRAY[
    'Parse and store UTM params on sign-up, attribute to source/medium/campaign',
    'FB Pixel with PageView, CompleteRegistration, InitiateCheckout, Purchase events',
    'Google Ads conversion tag on booking completion',
    'TikTok Pixel with ViewContent, AddToCart, Purchase events',
    'Dedicated /join/coach and /join/athlete pages optimised per ad campaign',
    'Infrastructure to run 50/50 headline/CTA tests with statistical significance',
    'Build retargeting audiences: visited but not signed up, signed up but not booked',
    'Track CPA per channel: paid social, SEO, referral, email',
    'Admin dashboard view: signups/bookings/revenue by source',
    'Export high-LTV user cohort for lookalike campaigns on Facebook/TikTok'
  ]),
  'dev','app','pending','marketing'
FROM p;
