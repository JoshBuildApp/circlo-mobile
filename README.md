# Circlo Mobile

Native iOS + Android app for [Circlo](https://circloclub.com) — the sports coaching
marketplace. Built with Capacitor 6 wrapping the same React + Supabase codebase that
powers the website, so every feature shipped on the web flows automatically into the
app shell.

---

## Quick start

```bash
# 1. install
npm install

# 2. run the web target (fastest iteration, same code)
npm run dev                 # → http://localhost:8080

# 3. production build → dist/
npm run build

# 4. open the native projects
npm run cap:ios             # builds + opens Xcode
npm run cap:android         # builds + opens Android Studio
```

**Live-reload onto a physical device** (dev server on your LAN):

```bash
CAP_SERVER_URL=http://<your-lan-ip>:8080 npm run cap:sync
npm run dev                 # keep running while you debug on device
```

---

## Layout

```
circlo-mobile/
├── src/                    # React app — shared with the website (copy of
│                           #   supabase-starter-kit/src at scaffold time)
│   ├── native/
│   │   ├── capacitor.ts    # Native bootstrap — initializes plugins once
│   │   └── useNative.ts    # Hooks: haptics, share, storage, network
│   ├── styles/native.css   # Safe areas + iOS/Android shell polish
│   └── main.tsx            # Boots initNative() before React mounts
├── capacitor.config.ts     # App id: club.circlo.app
├── ios/                    # Xcode project (committed)
├── android/                # Android Studio project (committed)
└── dist/                   # Vite build output → fed into the native shells
```

---

## App identity

| Field | Value |
|---|---|
| App name | Circlo |
| Bundle / App ID | `club.circlo.app` |
| iOS scheme | `Circlo` |
| Android package | `club.circlo.app` |
| Backend | Shared Supabase (`rsevfeogormnorvcvxio`) |

---

## What's wired up

- **Capacitor 6** + 9 plugins: `app`, `status-bar`, `splash-screen`, `keyboard`,
  `haptics`, `preferences`, `share`, `network`, `push-notifications`.
- **Native bootstrap** (`src/native/capacitor.ts`) — status bar style, splash hide,
  keyboard resize, Android back button → router history, network event relay.
- **React hooks** (`src/native/useNative.ts`) — `useHaptics`, `useShare`,
  `nativeStorage`, `useNetworkStatus`. All degrade to no-ops on web.
- **Safe-area CSS** — top header and bottom nav in `AppShell` auto-pad for the notch
  and home indicator via the `app-top-nav` / `app-bottom-nav` class hooks.
- **Shared Supabase backend** — auth, coaches, bookings, messaging all come from the
  same project as the website. No DB fork.

---

## Prereqs for native builds

- **iOS:** Xcode 15+, CocoaPods (`sudo gem install cocoapods` — required the first
  time you open `ios/`).
- **Android:** Android Studio Hedgehog+, JDK 17, Android SDK 34.

`cap add ios` / `cap add android` have already been run — the native projects are
committed to the repo. On a fresh clone, `npm install && npm run cap:sync` is enough.

---

See [CLAUDE.md](./CLAUDE.md) for the full agent onboarding guide.
