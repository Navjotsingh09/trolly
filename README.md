# TrolleyScout

**One list. Shop smarter.**

TrolleyScout is a UK-first grocery basket comparison product. This repository contains an Expo-based **iPhone and iPad app**, a Next.js landing page and a reusable comparison engine.

> **Early-stage demo:** All product prices are fictional. There is no licensed supermarket feed, no location-specific pricing, no authenticated accounts and no working subscription/payments. Do not use demonstration prices for real purchases.

## Run the iPhone/iPad app

Requirements: Node.js 22+, npm, Xcode / iOS Simulator (Mac) or Expo Go on a supported iOS device.

```bash
git clone https://github.com/Navjotsingh09/trolly.git
cd trolly
npm install
npm run start -w @trolleyscout/mobile
```

Scan the Expo QR code using an appropriate Expo Go build or press **i** to use iOS Simulator. For an iPad, use Expo Go or an iPad simulator. **This does not install a TestFlight or App Store release.**

### Available interactive flows

- First-open welcome screen
- Grocery search and category filters
- Item quantities, favourites and list editing
- Save list, favourites, postcode and preferred appearance on-device
- Eight fictional supermarket basket totals
- Complete/incomplete basket warnings and per-store line-item breakdowns
- Individual item price comparisons
- Adaptive layouts for iPhone and iPad
- Glass-effect bottom/side navigation and light/dark appearance

A real price feed and backend are deliberately not connected.

## Website

```bash
npm run dev -w @trolleyscout/web
```

The website has a separate interactive basket demonstration.

## Quality checks

```bash
npm test
npm run typecheck -w @trolleyscout/mobile
npm run build -w @trolleyscout/web
```

GitHub Actions attempts to run the first two checks after source changes. A native-device smoke test is still required.

## Next development milestones

1. QA with an iPhone and iPad, accessibility and VoiceOver, true landscape layouts
2. Backend schema, authentication and synchronisation
3. Licensed grocery catalogues, unit-price matching, retailer coverage and freshness indicators
4. More exhaustive automated QA and device testing
5. Privacy/legal policy, payment strategy and TestFlight distribution

The project is separate from charity projects. The repository is currently public.
