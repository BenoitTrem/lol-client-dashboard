"use client";
import {
  ArrowLeft,
  Zap,
  Shield,
  Users,
  Swords,
  BarChart2,
  Shuffle,
  CheckCircle,
  Info,
} from "lucide-react";

interface HelpPageProps {
  onBack: () => void;
}

const features = [
  {
    icon: <BarChart2 size={20} />,
    title: "Profile & Stats",
    color: "#c89b3c",
    description:
      "Your summoner profile is loaded automatically when the League client is detected. It displays your level, profile icon, all-modes win rate from your last 100 games, ranked standings for Solo/Duo, Flex, TFT and TFT Double-Up, and your top 5 champions by mastery points.",
  },
  {
    icon: <Users size={20} />,
    title: "Friends Online",
    color: "#2ecc71",
    description:
      "See all your friends who are currently online in one glance. Each card shows their status (Online, Away, In Queue, In Game, etc.). Hover a card to reveal an Invite to Lobby button — you can send an invite directly from the dashboard without opening the full client.",
  },
  {
    icon: <Shield size={20} />,
    title: "Queue Setup",
    color: "#3498db",
    description:
      "Pick from any queue currently available on your server — Ranked Solo/Duo, Flex, Normal Draft, ARAM, Swiftplay, Arena and more. Create a lobby with one click. If you're already in a lobby you can switch the queue without leaving. Lobby members are listed in real time.",
  },
  {
    icon: <Zap size={20} />,
    title: "Auto-Accept",
    color: "#e74c3c",
    description:
      "Toggle Auto-Accept so every ready-check popup is accepted for you automatically. Set an optional delay (0–10 s) if you want a small window to cancel. When a match is found a live panel appears showing the timer and your response state, plus manual Accept / Decline buttons.",
  },
  {
    icon: <Swords size={20} />,
    title: "Ban & Pick Preferences",
    color: "#9b59b6",
    description:
      "For Draft queues (Ranked, Normal Draft, Clash, Arena) you can pre-set up to 3 ban targets and 3 champion picks in priority order. The Auto Champion Select feature will ban and lock-in for you the moment your turn begins. Type a champion name to search, or choose Random to let the tool pick for you.",
  },
  {
    icon: <Shuffle size={20} />,
    title: "Lane Preferences",
    color: "#1abc9c",
    description:
      "Select a Primary and Secondary lane before hitting Start Queue — the preferences are pushed to the client automatically. Choose Fill to accept any role, or leave both blank to skip lane selection entirely.",
  },
];

const faqs = [
  {
    q: "Does the dashboard work without the League client running?",
    a: "No. The app communicates with the League Client Update (LCU) API which is only available while the client is open. You'll see a 'Client Offline' screen until a connection is detected.",
  },
  {
    q: "Is this safe to use? Will I get banned?",
    a: "The dashboard only uses Riot's official local LCU API — the same interface the client itself uses internally. It does not modify game files, inject code into the game process, or interact with the game server. That said, use any third-party tool at your own risk and in line with Riot's Terms of Service.",
  },
  {
    q: "Why isn't my ranked data showing up?",
    a: "Ranked data is fetched from the LCU at launch. If it appears empty, try clicking Reload at the top of the dashboard. If you've just finished your placement matches the client may need a moment to update.",
  },
  {
    q: "Auto champion select didn't fire — why?",
    a: "Auto Champion Select only activates for Draft queues (Ranked Solo/Duo, Flex, Normal Draft, Clash, Arena). Make sure you have at least one pick preference set and that the toggle is enabled before entering champion select.",
  },
  {
    q: "Can I invite friends who are already in a game?",
    a: "No — the invite button is blocked for friends currently In Game or in Champion Select. The dashboard will show a toast notification explaining why the invite couldn't be sent.",
  },
];

export default function HelpPage({ onBack }: HelpPageProps) {
  return (
    <div
      style={{
        maxWidth: 1000,
        width: "100%",
        margin: "0 auto",
        padding: "42px 8px",
        opacity: 0,
        animation: "fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
      }}
    >
      {/* Header */}
      <header style={{ marginBottom: 24, textAlign: "center" }}>
        <div
          className="header-tag"
          style={{
            fontSize: 15,
            letterSpacing: "0.3em",
            color: "var(--gold-dark)",
            marginBottom: 8,
            textTransform: "uppercase",
          }}
        >
          League of Legends
        </div>
        <h1 style={{ fontSize: 32, color: "var(--gold)", marginBottom: 8 }}>
          Dashboard Guide
        </h1>
        <p
          style={{
            fontSize: 16,
            color: "var(--text-muted)",
            maxWidth: 720,
            margin: "0 auto",
            marginTop: 12,
            lineHeight: 1.7,
          }}
        >
          A lightweight companion app that sits alongside your League of Legends
          client, letting you manage queues, automate ready-checks, configure
          champion select preferences and keep an eye on your friends — all from
          one panel.
        </p>
      </header>

      {/* Features grid */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          Features
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              className="panel feature-card"
              style={
                {
                  padding: "18px 20px",
                  borderRadius: 4,
                  borderLeft: `3px solid ${f.color}`,
                  background: "rgba(255,255,255,0.02)",
                  "--accent": f.color,
                } as React.CSSProperties
              }
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 10,
                  color: f.color,
                }}
              >
                {f.icon}
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {f.title}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        className="panel hover-panel"
        style={{ padding: "22px 24px", marginBottom: 32 }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 16,
            color: "var(--gold)",
          }}
        >
          <Info size={16} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            How It Works
          </span>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 16,
          }}
        >
          {[
            {
              step: "01",
              text: "Open the League of Legends client and log in.",
            },
            {
              step: "02",
              text: "Launch the Dashboard — it auto-detects the LCU connection.",
            },
            {
              step: "03",
              text: "Set your queue, lanes, ban and pick preferences.",
            },
            {
              step: "04",
              text: "Enable Auto-Accept and let the dashboard handle ready checks.",
            },
          ].map(({ step, text }) => (
            <div
              key={step}
              style={{ display: "flex", gap: 12, alignItems: "flex-start" }}
            >
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "rgba(200,155,60,0.25)",
                  fontFamily: "Cinzel, serif",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                {step}
              </span>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                  margin: 0,
                }}
              >
                {text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section style={{ marginBottom: 40 }}>
        <div
          style={{
            fontSize: 11,
            letterSpacing: "0.2em",
            color: "var(--text-muted)",
            textTransform: "uppercase",
            marginBottom: 16,
          }}
        >
          FAQ
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {faqs.map((item) => (
            <div
              key={item.q}
              className="panel faq-card"
              style={{
                padding: "16px 20px",
                background: "rgba(255,255,255,0.02)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 10,
                  marginBottom: 8,
                }}
              >
                <CheckCircle
                  size={14}
                  style={{ color: "var(--gold)", flexShrink: 0, marginTop: 2 }}
                />
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                >
                  {item.q}
                </span>
              </div>
              <p
                style={{
                  fontSize: 13,
                  color: "var(--text-muted)",
                  lineHeight: 1.65,
                  margin: "0 0 0 24px",
                }}
              >
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Back button */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <button
          className="btn-gold btn-icon"
          onClick={onBack}
          style={{
            padding: "11px 28px",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginTop: 35,
          }}
        >
          <ArrowLeft size={15} />
          Back to Dashboard
        </button>
      </div>
      <footer className="footer">
        <div className="footer-wrapper">
          <a
            href="https://github.com/BenoitTrem/lol-client-dashboard.git"
            target="_blank"
            rel="noopener noreferrer"
            className="footer-link"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.31-.54-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.69.25 2.94.12 3.25.77.84 1.24 1.91 1.24 3.23 0 4.63-2.8 5.64-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57C20.57 22.3 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
            </svg>
            GitHub Repository
          </a>

          <div className="footer-link-text">
            This project is open-source. You are free to use, modify, and build
            on top of it.
          </div>
        </div>

        <div style={{ maxWidth: 900, margin: "42px auto 0" }}>
          © {new Date().getFullYear()} LoL Client Dashboard.
        </div>

        <div style={{ maxWidth: 900, margin: "8px auto 0" }}>
          LoL Client Dashboard is an independent fan project and is not
          affiliated with or endorsed by Riot Games. League of Legends is a
          trademark of Riot Games, Inc.
        </div>
      </footer>
    </div>
  );
}
