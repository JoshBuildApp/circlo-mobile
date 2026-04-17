# Circlo Mobile — Store Submission Checklist

Tracks everything still needed between the current build and first public
release on the App Store + Google Play.

**Bundle id:** `club.circlo.app` (iOS + Android — do NOT change)
**Version:** `1.0` — **build number:** `1`

---

## 1. One-time developer account setup

- [ ] Apple Developer Program — $99/yr — https://developer.apple.com/programs/
- [ ] Google Play Console — $25 one-time — https://play.google.com/console
- [ ] Apple: create App ID `club.circlo.app` in the developer portal
- [ ] Apple: create App Store Connect record (name "Circlo", primary language)
- [ ] Google Play: create app record with package name `club.circlo.app`

---

## 2. Supabase dashboard (required before auth works on device)

Auth → URL Configuration → Redirect URLs → **add all of these:**

```
circlo://home
circlo://login
circlo://reset-password
circlo://payment/return
https://circloclub.com/home
https://circloclub.com/login
https://circloclub.com/reset-password
https://circloclub.com/payment/return
```

Otherwise Supabase will reject `redirectTo` values coming from the mobile
app and email links will 404.

---

## 3. Local build prerequisites

- [ ] macOS with Xcode 15+ installed (required for iOS)
- [ ] CocoaPods: `sudo gem install cocoapods` (one-time)
- [ ] First iOS pod install: `cd ios/App && pod install`
- [ ] Android Studio Hedgehog+ with JDK 17 and Android SDK 34
- [ ] Accept all Android SDK licenses: `sdkmanager --licenses`

---

## 4. App assets to produce (native-side, not in code)

### App icon
Needed in many sizes for each platform. Produce from a **1024×1024 PNG** master
of the Circlo icon.

- [ ] iOS — drop the master into `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
      and let Xcode generate all sizes, OR use a generator like
      https://www.appicon.co/
- [ ] Android — run `npx capacitor-assets generate --iconBackgroundColor "#1A1A2E" --iconBackgroundColorDark "#1A1A2E"`
      after placing `resources/icon.png` (1024×1024) at the repo root

### Splash screen
- [ ] 2732×2732 PNG, centered logo on `#1A1A2E` background
- [ ] Place as `resources/splash.png`, then
      `npx capacitor-assets generate --splashBackgroundColor "#1A1A2E"`
- [ ] Already wired in `capacitor.config.ts` — no code changes needed

### Store listing assets
- [ ] 1024×1024 app icon (store listing, no rounded corners on Apple)
- [ ] iOS screenshots: 6.7" (iPhone 15 Pro Max) and 6.5" (iPhone 11 Pro Max),
      minimum 3 per device, PNG or JPEG
- [ ] Android screenshots: phone (min 320px, 2–8), 7" tablet (optional),
      10" tablet (optional)
- [ ] Feature graphic (Google Play only): 1024×500 JPG/PNG
- [ ] Short description (Google Play, 80 chars max)
- [ ] Full description (4000 chars) — English + Hebrew
- [ ] Promo text (App Store, 170 chars)
- [ ] Keywords (App Store, 100 chars, comma-separated)

---

## 5. Legal (required for both stores)

Publicly accessible URLs — serve from circloclub.com or the in-app pages:

- [ ] Privacy Policy URL — in-app at `/legal/privacy`, publish at
      https://circloclub.com/legal/privacy
- [ ] Terms of Service URL — in-app at `/legal/terms`
- [ ] Support URL / email — `support@circloclub.com` or similar
- [ ] App Store Connect → App Privacy — fill in the data types collected
      (email, name, photos, location if used, analytics)
- [ ] Google Play → Data safety form — same information

---

## 6. iOS-specific submission steps

- [ ] `npm run cap:ios` → Xcode opens the workspace
- [ ] Signing & Capabilities tab → Team: select your Apple Developer team
- [ ] (Optional) Enable Push Notifications capability if sending push
- [ ] (Optional) Enable Associated Domains for universal links
      (applinks:circloclub.com)
- [ ] Product → Archive (with "Any iOS Device" selected as target)
- [ ] Organizer → Distribute App → App Store Connect → Upload
- [ ] App Store Connect → TestFlight → add internal testers, test first
- [ ] App Store Connect → App Store tab → fill in all metadata, attach build,
      submit for review

Apple review typically takes 24–48 hours. Rejections most commonly cite:
missing privacy policy, incomplete data-safety info, crashes on iPad if you
haven't tested at that size, or in-app payments that don't use Apple IAP
(see §8 below).

---

## 7. Android-specific submission steps

- [ ] Generate upload keystore (one-time):
      ```
      keytool -genkey -v -keystore circlo-release.keystore -alias circlo \
        -keyalg RSA -keysize 2048 -validity 10000
      ```
      Store this file + password somewhere safe — **losing it means you can
      never update the app on Play again**.
- [ ] Configure signing in `android/app/build.gradle` (signingConfigs +
      buildTypes.release.signingConfig)
- [ ] `npm run cap:android` → Android Studio opens
- [ ] Build → Generate Signed Bundle / APK → Android App Bundle (.aab)
- [ ] Play Console → Production → Create release → upload the .aab
- [ ] Fill in store listing, screenshots, content rating, target audience
- [ ] Data safety form (see §5)
- [ ] Submit for review — typically 3–7 days for first release

---

## 8. ⚠ Payment policy — read before submitting

Apple and Google require apps that sell "digital goods" (subscriptions,
in-app content) to use **their** in-app purchase systems (Apple IAP,
Google Billing), with a 15–30% fee.

Circlo's coaching sessions are **real-world services** (a human coach
training a human client) — those are explicitly exempt and can use
Stripe / Bit / PayBox / whatever. But:

- [ ] If you ever sell digital content (Circlo Pro subscription, video
      courses, premium features), Apple will require IAP and will reject
      Stripe-based flows on iOS
- [ ] Google is slightly more lenient but still requires Billing for digital
      goods
- [ ] Current StripeConnectSetup + PaymentReturn flow should be fine for
      coach bookings — document this clearly in review notes:
      "In-app payments are for real-world in-person coaching services only;
      per Apple guideline 3.1.3(e)/3.1.5, these are out of scope for IAP."

---

## 9. Push notifications (optional for v1)

- [ ] iOS: enable Push Notifications capability in Xcode
- [ ] iOS: create APNs key in Apple Developer Portal, upload to Supabase
      (or whichever backend service sends pushes)
- [ ] Android: create Firebase project, download `google-services.json`,
      drop into `android/app/google-services.json`
- [ ] Android: add Firebase plugin to `android/build.gradle` +
      `android/app/build.gradle`
- [ ] Test by calling `subscribe()` from `usePushNotifications` and sending
      a test push from the backend

---

## 10. Pre-submission QA checklist

Test on **real devices** (not just simulators) before every submission.

- [ ] Login + signup work end-to-end on iOS and Android
- [ ] Password reset email's link opens the app back at /reset-password
      (deep link works)
- [ ] OAuth providers (if enabled) return correctly to the app
- [ ] Safe areas: nothing hidden by notch/home indicator on iPhone 15 Pro Max,
      iPhone SE, Pixel 8
- [ ] Hardware back button on Android: navigates correctly from every screen,
      exits only from root
- [ ] Offline: OfflineBanner appears when airplane mode on; disappears when off
- [ ] Keyboard: doesn't cover text inputs on any form
- [ ] External links (Stripe, Google Maps, WhatsApp) open in in-app browser
      and return cleanly
- [ ] Rotation: locked to portrait or behaves correctly on landscape
- [ ] Hebrew (RTL) layout works if i18n language switched to `he`
- [ ] No console errors or warnings in Safari Web Inspector (iOS) /
      `chrome://inspect` (Android)
- [ ] App icon + splash render correctly (not stretched/pixelated)
- [ ] Dark mode (ocean/sunset themes) render correctly

---

## 11. Deferred polish (ship without; upgrade in later versions)

These work today but could be better:

- [ ] `<input type="file">` still used in 13 places — works via Capacitor's
      webview OS picker, but would feel more native via `useFilePicker`
      hook that's already available in `src/native/useFilePicker.ts`.
      Swap per-page when polishing:
      EditProfile, CoachOnboarding/ProfileSetup, VerificationWizard,
      NewContentCreator, VideoUploadModal, ContentUploadFlow, ProductManager,
      DigitalProductsSection, PaymentSettings, ChatInput, PlayerProfile,
      UserProfile, PublicCoachProfile
- [ ] `navigator.share()` still called directly in ~10 places — works in
      Capacitor's webview but would be more polished via `useShare()` from
      `src/native/useNative.ts`
- [ ] Universal links (apple-app-site-association + Android Asset Links)
      to make https://circloclub.com/... open the app instead of the browser
- [ ] Biometric auth (`@capacitor-community/biometric-auth`) for
      "Remember me" login
- [ ] In-app update prompts (`@capacitor/app-launcher` or similar)
      when a newer version is available

---

## Quick reference — commands

```bash
npm run build         # rebuild web assets → dist/
npm run cap:sync      # build + copy to iOS + Android, refresh plugins
npm run cap:ios       # build + sync + open Xcode
npm run cap:android   # build + sync + open Android Studio
npm run cap:run:ios   # build + run on attached simulator/device
npm run cap:run:android

# iOS: regenerate CocoaPods after adding a plugin
cd ios/App && pod install

# Version bump before each release:
# 1) package.json version
# 2) ios: Xcode project → General → Version + Build
# 3) android: android/app/build.gradle → versionCode++ versionName
```

---

## Timeline estimate

- Week 1: accounts, legal URLs, app icon + splash
- Week 2: Supabase redirect config, push notifications setup, QA on devices
- Week 3: TestFlight + Internal Testing (Play)
- Week 4: public submission — Apple typically approves in 1–2 days,
          Google 3–7 days for first release
