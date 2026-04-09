-- Roadmap: phases and items tracked by agents

create table if not exists public.roadmap_phases (
  id uuid primary key default gen_random_uuid(),
  phase_number integer not null unique,
  title text not null,
  description text,
  status text not null default 'pending' check (status in ('pending', 'active', 'completed')),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists public.roadmap_items (
  id uuid primary key default gen_random_uuid(),
  phase_id uuid references public.roadmap_phases(id) on delete cascade,
  title text not null,
  description text,
  category text not null default 'ui' check (category in ('ui', 'database', 'feature', 'performance')),
  target text not null default 'app' check (target in ('app', 'hub', 'both')),
  status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table public.roadmap_phases enable row level security;
alter table public.roadmap_items enable row level security;

create policy "Public read roadmap_phases" on public.roadmap_phases for select using (true);
create policy "Service role write roadmap_phases" on public.roadmap_phases for all using (auth.role() = 'service_role');

create policy "Public read roadmap_items" on public.roadmap_items for select using (true);
create policy "Service role write roadmap_items" on public.roadmap_items for all using (auth.role() = 'service_role');

-- Seed: Phase 1
insert into public.roadmap_phases (phase_number, title, description, status) values
(1, 'Foundation', 'Database schema finalization + Design system', 'active'),
(2, 'Core Flows', 'Onboarding, search, booking — the paths users take most', 'pending'),
(3, 'Coach Experience', 'Coach dashboard, profile, availability manager', 'pending'),
(4, 'User Experience', 'Home feed, profile, notifications, chat', 'pending'),
(5, 'Content Platform', 'Videos, reels, community, create flow', 'pending'),
(6, 'Scale & Performance', 'Caching, CDN, partitioning, indexes, bundle size', 'pending'),
(7, 'Revenue & Analytics', 'Payouts, packages, promo codes, admin analytics', 'pending');

-- Seed: Phase 1 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Full-text search on coaches', 'Add pg_trgm + GIN indexes on coach_name, sport, bio', 'database', 'app'),
  ('Media assets table', 'Centralize all uploads — url, type, size, cdn_url, status', 'database', 'app'),
  ('Push notification tokens table', 'Add push_notification_tokens for real push support', 'database', 'app'),
  ('Coach packages table', 'Bundle offerings — price, session_count, validity_days', 'database', 'app'),
  ('Message read receipts', 'Add read_at + message_type to messages table', 'database', 'app'),
  ('Audit log table', 'Log every sensitive action — role changes, payments, edits', 'database', 'app'),
  ('Composite indexes on hot paths', 'bookings(coach_id,date), messages(sender+receiver+created_at)', 'performance', 'app'),
  ('Design tokens', 'CSS variables for spacing, typography, color palette', 'ui', 'both'),
  ('Skeleton system', 'Matching skeleton for every data-fetching screen', 'ui', 'both'),
  ('Empty + error states', 'Every list/grid needs empty state with CTA and error with retry', 'ui', 'both')
) as i(title, description, category, target)
where p.phase_number = 1;

-- Seed: Phase 2 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Onboarding wizard', 'Multi-step: interests → location → role → follow 3 coaches', 'feature', 'app'),
  ('Coach onboarding path', 'Separate coach onboarding: profile → availability → first service', 'feature', 'app'),
  ('Discovery filters', 'Filter sidebar: sport, price, location, rating, availability', 'ui', 'app'),
  ('Coach map view', 'Toggle map view for coaches near me', 'feature', 'app'),
  ('Search with instant results', 'Real-time search using full-text search from Phase 1', 'feature', 'app'),
  ('3-step booking modal', 'Pick date → Pick time → Confirm + Pay', 'ui', 'app'),
  ('Package booking', 'Buy a package (bundle) during booking flow', 'feature', 'app'),
  ('Post-session review prompt', 'Auto-triggered 1h after session end time', 'feature', 'app'),
  ('Social login', 'Google + Apple sign-in working end-to-end', 'feature', 'app'),
  ('Magic link auth', 'Passwordless login option', 'feature', 'app')
) as i(title, description, category, target)
where p.phase_number = 2;

-- Seed: Phase 3 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Coach dashboard overview tab', 'Revenue, upcoming bookings, new followers, pending reviews at a glance', 'ui', 'app'),
  ('Coach calendar tab', 'Full week/month view, drag to block, click to see booking detail', 'feature', 'app'),
  ('Coach clients tab', 'All clients: last session, total sessions, total paid', 'feature', 'app'),
  ('Coach analytics tab', 'Revenue chart daily/weekly/monthly, booking conversion rate', 'ui', 'app'),
  ('BOB AI dedicated section', 'Coach can ask anything about their performance', 'feature', 'app'),
  ('Coach profile hero', 'Cover photo, avatar, sport tags, rating, price, quick book CTA', 'ui', 'app'),
  ('Video showcase on coach profile', '3-6 pinned videos autoplay muted on public profile', 'feature', 'app'),
  ('Coach packages section', 'Packages displayed on public profile with purchase flow', 'feature', 'app'),
  ('Visual availability manager', 'Click-to-toggle week grid, recurring schedule, vacation mode', 'ui', 'app'),
  ('Buffer time setting', 'Set buffer between sessions in availability manager', 'feature', 'app')
) as i(title, description, category, target)
where p.phase_number = 3;

-- Seed: Phase 4 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Personalized home feed', 'Algorithm: followed coaches + trending + recommended', 'feature', 'app'),
  ('Stories bar', 'TikTok-style horizontal scroll at top of feed', 'ui', 'app'),
  ('New posts pill', 'Pill that appears when new content arrives without full refresh', 'feature', 'app'),
  ('User profile stats bar', 'Sessions booked, coaches followed, XP', 'ui', 'app'),
  ('Activity tab on profile', 'Session history, challenges completed', 'feature', 'app'),
  ('Redesigned notifications', 'Grouped by type: bookings, social, system', 'ui', 'app'),
  ('Notification preferences', 'Screen to control what to get notified about', 'feature', 'app'),
  ('Chat message types', 'Text + image + booking request card in chat', 'feature', 'app'),
  ('Typing + online indicators', 'Real-time typing indicator and online status in chat', 'feature', 'app'),
  ('Unread count badge on nav', 'Chat badge showing unread message count', 'ui', 'app')
) as i(title, description, category, target)
where p.phase_number = 4;

-- Seed: Phase 5 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Custom video player controls', 'Progress, volume, fullscreen, playback speed, quality', 'ui', 'app'),
  ('Autoplay next video', 'Auto-play next in series on video end', 'feature', 'app'),
  ('Full-screen reels', 'TikTok-style vertical scroll with like/comment/share inline', 'ui', 'app'),
  ('Sound toggle on reels', 'Sound on/off toggle in reels feed', 'ui', 'app'),
  ('Community group feeds', 'Groups by sport/interest with their own feed', 'feature', 'app'),
  ('Coach AMAs', 'Q&A format sessions within community groups', 'feature', 'app'),
  ('Drag-and-drop video upload', 'Upload with progress bar and thumbnail auto-generation', 'ui', 'app'),
  ('Schedule post option', 'Set future publish date when creating content', 'feature', 'app'),
  ('Thumbnail selector', 'Auto-generate 3 thumbnail options from uploaded video', 'feature', 'app'),
  ('Hashtag suggestions', 'Auto-suggest hashtags in caption field', 'feature', 'app')
) as i(title, description, category, target)
where p.phase_number = 5;

-- Seed: Phase 6 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Coach stats materialized view', 'Pre-computed ratings, booking counts, follower counts', 'performance', 'app'),
  ('Feed query caching', 'Cache feed/discover/trending results with 5-min TTL', 'performance', 'app'),
  ('Messages table partitioning', 'Partition messages + notifications by created_at month', 'database', 'app'),
  ('Storage bucket organization', 'avatars/, coach-videos/, thumbnails/, stories/ with ACLs', 'performance', 'app'),
  ('CDN for all media', 'All media routed through CDN URL via media_assets table', 'performance', 'app'),
  ('Rate limiting', 'rate_limit_events table + edge function middleware', 'database', 'app'),
  ('Complete code splitting', 'Route-based code splitting on all remaining routes', 'performance', 'app'),
  ('Image lazy loading', 'Lazy load with blur-up placeholder across all images', 'ui', 'app'),
  ('Optimistic updates', 'Optimistic updates on all social actions: likes, follows, saves', 'feature', 'app'),
  ('Bundle size audit', 'Remove unused dependencies, target <500KB initial bundle', 'performance', 'app')
) as i(title, description, category, target)
where p.phase_number = 6;

-- Seed: Phase 7 items
insert into public.roadmap_items (phase_id, title, description, category, target)
select p.id, i.title, i.description, i.category, i.target
from public.roadmap_phases p,
(values
  ('Revenue events table', 'Every paid transaction with metadata for business analytics', 'database', 'app'),
  ('Referral codes table', 'Proper referral tracking: user_id, code, uses, total_earned', 'database', 'app'),
  ('Promo codes table', 'Discount codes with validity, max uses, percentage/fixed', 'database', 'app'),
  ('Coach payouts table', 'Track payout status, amount, Stripe payout ID', 'database', 'app'),
  ('Stripe Connect for coaches', 'Coaches set their own payout account', 'feature', 'app'),
  ('Auto payout on session complete', 'Trigger payout when session status = completed', 'feature', 'app'),
  ('Tipping after sessions', 'Allow athletes to tip coaches after completed sessions', 'feature', 'app'),
  ('Digital products', 'Coaches sell training plans, PDF playbooks', 'feature', 'app'),
  ('Admin revenue dashboard', 'Platform revenue, user growth, booking funnel in Hub', 'ui', 'hub'),
  ('Churn indicators in Hub', 'Flag users likely to churn in admin dashboard', 'feature', 'hub')
) as i(title, description, category, target)
where p.phase_number = 7;
