<p align="center">
  <a href="https://truevote.sanketpadhyal.in">
    <img src="public/images/logo.png" alt="TrueVote logo" width="96" />
  </a>
</p>

<h1 align="center">TrueVote</h1>

<p align="center">
  An open-source, privacy-focused Web3 voting web application with cryptographic voter nullifiers, Cloudflare Turnstile anti-bot verification, and decentralized IPFS storage.
</p>

<p align="center">
  <a href="https://truevote.sanketpadhyal.in"><strong>truevote.sanketpadhyal.in</strong></a>
</p>

<p align="center">
  Open-Source Web3 Hackathon Project &middot; Free for anyone to use, self-host, and customize.
</p>

> [!IMPORTANT]
> TrueVote is an open-source Web3 hackathon project. Anyone can freely use this platform, run elections, clone the repository, or customize it for their own DAOs, universities, clubs, or community votes. No backend server setup is needed.

> [!IMPORTANT]
> Privacy First: Voter identities and wallet addresses are never linked to candidate choices. Every cast vote produces a deterministic cryptographic nullifier hash that prevents double voting while keeping the voter's ballot confidential.

## About TrueVote

TrueVote is an open-source Web3 hackathon project created to make electronic voting transparent, anonymous, and tamper-resistant without requiring heavy infrastructure or platform accounts.

Most conventional voting systems store votes in a central database where administrators can alter records, view who voted for whom, or suffer from database downtime. TrueVote solves this right in the browser using three core building blocks:

1. Cryptographic Voter Nullifiers: Instead of storing voter identities alongside ballot selections, TrueVote derives a deterministic SHA-256 nullifier for each voter. This guarantees one vote per person while keeping candidate selections private.
2. Anti-Bot & Proof of Humanity: Public voting links are protected by Cloudflare Turnstile, browser automation detection (`navigator.webdriver`), and human entropy tracking (requiring genuine mouse or touch movements before voting).
3. Decentralized IPFS Storage: When an election is created or a vote is submitted, the record is backed up in browser IndexedDB and pinned to IPFS through Pinata Dedicated Gateways, creating a decentralized and auditable trail.

## Who Can Use TrueVote?

TrueVote runs entirely in the browser and requires zero server configuration, making it accessible to anyone:

- DAOs & Web3 Communities: Run community sentiment polls, grant selections, and governance referendums.
- Student Councils & Universities: Host anonymous campus elections where students vote securely with zero data harvesting.
- Hackathons & Conferences: Allow attendees and judges to vote on project presentations in real time.
- Clubs & Organizations: Run leadership elections, committee votes, and straw polls.
- Developers & Students: Study how client-side Web3 authentication, IPFS pinning, and anti-bot verification work together in a modern React app.

## Core Features

### 1. Anonymous Voting (Wallet & Walletless)
- Voters can participate using MetaMask (EIP-1193 Web3 provider) or directly in walletless mode.
- No personal sign-up, email, or passwords required.
- Ballot choices are decoupled from voter identity to protect confidentiality.

### 2. Double-Voting Prevention (Cryptographic Nullifiers)
- Each voter session generates a unique deterministic SHA-256 nullifier hash (`truevote:nullifier:<eventId>:<voterId>:<timestamp>`).
- When a vote is cast, the nullifier receipt is permanently recorded in browser storage and IndexedDB.
- If the voter returns to the voting page, TrueVote detects the nullifier and replaces candidate selection with an immutable "Ballot Already Cast" confirmation state.

### 3. Real Anti-Bot Heuristics, Incognito Detection & Cloudflare Turnstile
- Incognito & Private Mode Detection: Automatically detects private browsing across Chromium, Safari, Firefox, and Edge via memory/storage heuristics. If detected, voting is blocked to prevent Sybil attacks and session isolation tampering.
- Cloudflare Turnstile Widget: Embedded proof-of-humanity challenge verifies legitimate traffic.
- Automated Test Runner Detection: Checks `navigator.webdriver` to immediately block headless browser drivers (Selenium, Puppeteer, Playwright).
- Human Entropy Verification: Requires genuine cursor movement (`mousemove`) or mobile touch taps (`touchstart`) before the challenge unlocks, blocking programmatic click scripts.

### 4. Decentralized IPFS Archival via Pinata
- When an organizer creates an election, its manifest (title, description, candidate options, end time) is pinned to IPFS using Pinata's REST API (V3 endpoints with legacy fallback).
- When votes are submitted, tallies are updated and re-pinned with high availability on Pinata Dedicated Gateways.
- Every election includes an IPFS Content Identifier (CID) for independent verification.

### 5. Offline Resiliency with IndexedDB
- Uses a local IndexedDB database (`truevote_persistence_db`) to store all election events, candidate tallies, and voter nullifiers.
- Data persists across browser refreshes, restarts, and temporary offline periods.

### 6. Real-Time Cross-Tab Synchronization
- Uses the HTML5 `BroadcastChannel` API (`truevote_events_channel`).
- When a vote is cast or an election status is toggled (paused/resumed) in one tab, all open organizer dashboards in other tabs update instantly without refreshing.

### 7. Live Leader Pill & Analytics Modal
- An optimized O(N) tally calculator continuously tracks the frontrunning option and displays a live "Leading" pill badge on active ballots and dashboard tables.
- The Realtime Analytics modal displays turnout percentages, vote share distribution bars, and candidate counts.

## How TrueVote Works

1. Create Election: The organizer opens the Dashboard (`/dashboard`) and clicks "Create Event". They define the title, description, category, expiration time, and candidates. TrueVote generates a unique 6-digit voting code, saves the event locally in IndexedDB, and pins it to Pinata IPFS.
2. Share Link or Code: The organizer shares the election link (`/vote/:id`) or the 6-digit voting code with participants.
3. Anti-Bot Verification: When the voter opens the ballot, TrueVote verifies human presence through mouse/touch entropy checks and Cloudflare Turnstile.
4. Cast Ballot: The voter selects a candidate and confirms.
5. Generate Nullifier & Seal: TrueVote computes the SHA-256 nullifier hash, increments the candidate's tally, updates the IPFS pin, and locks that voter session in IndexedDB and localStorage.
6. Real-Time Dashboard Sync: The organizer's dashboard receives an instant message via `BroadcastChannel`, updating live results and leader badges with zero latency.

## Main Pages & Views

| Page / Component | Route | Description |
| --- | --- | --- |
| Landing Page | `/` | Overview of TrueVote, quick 6-digit code voter entry, platform features, and FAQ |
| Organizer Dashboard | `/dashboard` | Election management table, KPI statistics cards, status filters, and IPFS status |
| New Event Modal | Modal in `/dashboard` | Form to configure candidates, dates, categories, and pin new elections to IPFS |
| Voting Page | `/vote/:id` | Voter ballot with candidate selection, live leader pill, and Turnstile challenge |
| Ballot Confirmation | In `/vote/:id` | Post-vote confirmation displaying nullifier hash, transaction receipt, and IPFS status |
| Realtime Analytics Modal | Modal in `/dashboard` | Detailed vote share percentages, rank badges, and total voter turnout |

## Technical Stack

| Category | Technology | Purpose |
| --- | --- | --- |
| UI Framework | React `19.3.0` | Component-based user interface |
| Programming Language | TypeScript `4.9.5` | Type-safe application logic |
| Routing | React Router DOM `7.18.3` | Client-side page navigation |
| Build Tool | Create React App / React Scripts `5.0.1` | Application bundler and build pipeline |
| Smooth Scrolling | Lenis `1.3.26` | Momentum smooth scroll behavior |
| Decentralized Storage | Pinata IPFS API | Permanent, decentralized file pinning (V3 & Legacy) |
| Local Database | IndexedDB (`truevote_persistence_db`) | Offline storage for elections and voter locks |
| Inter-Tab Sync | HTML5 BroadcastChannel API | Zero-latency real-time state sync across browser tabs |
| Anti-Bot Engine | Cloudflare Turnstile + Webdriver Heuristics | Proof-of-humanity challenge and bot blocking |
| Hashing & Cryptography | Web Crypto API (`crypto.subtle.digest`) | Deterministic SHA-256 voter nullifier generation |
| Web3 Connectivity | EIP-1193 (`window.ethereum`) | Optional MetaMask wallet integration |
| Testing Suite | Jest & React Testing Library | Unit and component integration testing |

## Project Structure

```text
.
|-- public/
|   |-- images/
|   |   |-- logo.png                        TrueVote official logo
|   |   |-- favicon.ico                     Website favicon
|   |   `-- stacks/                         Technology badges (Pinata, IPFS, Cloudflare, etc.)
|   |-- index.html                          HTML root document
|   `-- manifest.json                       Web application manifest
|-- src/
|   |-- components/
|   |   |-- auth/                           Wallet connection modal
|   |   |-- box/                            Generic confirmation dialogs
|   |   |-- navbar.tsx                      Header navigation with wallet connection status
|   |   |-- footer.tsx                      Platform footer and links
|   |   |-- faq.tsx                         Frequently asked questions accordion
|   |   `-- scrolltotop.tsx                 Scroll-to-top route watcher
|   |-- dashboard/
|   |   |-- Dashboard.tsx                   Main organizer dashboard coordinator
|   |   |-- EventsTable.tsx                 Searchable election table with live status
|   |   |-- NewEventModal.tsx               Multi-step election creation modal
|   |   |-- RealtimeAnalyticsModal.tsx      Live vote share percentages and turnout analytics
|   |   |-- HeroBanner.tsx                  Organizer summary and quick action banner
|   |   |-- StatsPanel.tsx                  Aggregated statistics cards
|   |   |-- ActionCards.tsx                 Election status quick filter cards
|   |   |-- Sidebar.tsx                     Dashboard navigation sidebar
|   |   `-- types.ts                        TypeScript interfaces for elections and votes
|   |-- pages/
|   |   |-- home.tsx                        Home landing page with voting code lookup
|   |   `-- dashboard.tsx                   Dashboard page wrapper
|   |-- services/
|   |   |-- pinata.ts                       Pinata IPFS pinning and gateway service
|   |   `-- storage.ts                      IndexedDB backup and recovery engine
|   |-- voting/
|   |   |-- VotingPage.tsx                  Ballot voting page with Turnstile and nullifier lock
|   |   `-- voting.css                      Voting page layout and receipt styles
|   |-- App.tsx                             Root route definitions and layout
|   |-- index.tsx                           React DOM render entry point
|   `-- setupTests.js                       Jest global test setup and mocks
|-- package.json                            Project configuration and dependencies
|-- tsconfig.json                           TypeScript compiler configuration
`-- README.md                               Project documentation
```

## Configuration & Environment Variables

To configure custom Pinata IPFS or Cloudflare Turnstile credentials, create a `.env` file in the root directory:

```bash
# Pinata IPFS Credentials
REACT_APP_PINATA_JWT=your_pinata_jwt_token_here
REACT_APP_PINATA_GATEWAY_URL=https://your-custom-gateway.mypinata.cloud/ipfs/
REACT_APP_PINATA_API_KEY=your_optional_pinata_api_key
REACT_APP_PINATA_SECRET_KEY=your_optional_pinata_secret_key

# Cloudflare Turnstile Site Key
REACT_APP_TURNSTILE_SITE_KEY=your_cloudflare_turnstile_site_key

# Build Optimization
GENERATE_SOURCEMAP=false
```

Note: If no custom environment variables are provided, TrueVote automatically runs with default production gateway fallbacks and client-side heuristic verification.

## Local Development Setup

Follow these steps to run TrueVote locally on your machine:

### 1. Prerequisites
- Node.js `18.0.0` or newer (Node `20.x` recommended).
- npm `9.0.0` or newer.
- A modern web browser (Google Chrome, Firefox, Brave, or Safari).

### 2. Clone the Repository
```bash
git clone https://github.com/sanketpadhyal/TrueVote.git
cd TrueVote/truevote
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start the Local Development Server
```bash
npm start
```
The app will open automatically at `http://localhost:3000`.

### 5. Run the Test Suite
```bash
npm test -- --watchAll=false
```

### 6. Build for Production
```bash
npm run build
```
The production bundle will be generated in the `build/` folder.

## Current Project Status

| Capability | Implementation Status |
| --- | --- |
| MetaMask Wallet Connection | Fully Operational |
| Walletless Voting Mode | Fully Operational |
| Client-Side SHA-256 Nullifiers | Fully Operational |
| Revote Prevention & Session Locking | Fully Operational |
| Incognito & Unsafe Browser Guard | Fully Operational |
| Cloudflare Turnstile Anti-Bot | Fully Operational |
| Headless Webdriver Bot Detection | Fully Operational |
| Human Cursor/Touch Entropy Checks | Fully Operational |
| Pinata IPFS Manifest Pinning | Fully Operational |
| IndexedDB Offline Storage | Fully Operational |
| BroadcastChannel Cross-Tab Sync | Fully Operational |
| Real-Time Leader Pill Calculation | Fully Operational |
| Turnout & Vote Analytics Modal | Fully Operational |

## License

This project is open source and available under the [MIT License](LICENSE). Anyone is free to use, modify, distribute, or incorporate this software into their own projects.

## Developer & Contact

- Developer: Sanket Padhyal
- Live Application: https://truevote.sanketpadhyal.in
- Portfolio: https://www.sanketpadhyal.in
- Support: sanketpadhyal3@gmail.com
- GitHub: https://github.com/sanketpadhyal

## Disclaimer

TrueVote is developed as an open-source decentralized Web3 software project. Organizers and voters are responsible for ensuring that their elections and usage comply with applicable local rules, organizational policies, and legal frameworks.
