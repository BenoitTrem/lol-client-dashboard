# LCU Dashboard

A fan-made open-source desktop application for interacting with the League of Legends client via the LCU API. Built with **Next.js** and **Electron**.

> Not affiliated with or endorsed by Riot Games. League of Legends is a trademark of Riot Games, Inc.

---

## Features

- Detects the running League client automatically via the lockfile
- Create and manage lobbies
- Start and stop matchmaking queues
- Auto-accept match ready checks (with optional delay)
- Auto ban/pick champions in champion select
- Lane preference selection
- Friends list with lobby invite support
- Real-time activity log

---

## Getting Started

### Prerequisites

- Node.js
- League of Legends client installed and running

### Install dependencies

```bash
npm install
```

### Run in development

```bash
npm run dev:electron   # Full desktop app (Electron + Next.js)
npm run dev            # Next.js only
```

### Build

```bash
npm run build   # Build Next.js
npm run dist    # Package as desktop app
```

---

## Project Structure

```
app/        Next.js UI
electron/   Electron main process
lib/        LCU API logic
public/     Static assets
out/        Exported Next.js build
dist/       Packaged desktop app
```

---

## How It Works

1. Electron opens the desktop window
2. Next.js renders the UI
3. The app reads the League client lockfile to find the local API
4. Requests are sent locally to the LCU API
5. All communication stays on your machine — no data is sent externally

---

## Notes

- Uses the unofficial LCU (League Client Update) API
- Requires the League of Legends client to be open
- All processing is local; nothing leaves your machine
- Use responsibly and in accordance with Riot Games' terms of service

---

## License

Open source — free to use, modify, and build upon.
