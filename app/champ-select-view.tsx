"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Swords, Shield, User, ChevronDown, ChevronUp } from "lucide-react";

interface ChampionSummary {
  id: number;
  name: string;
  alias: string;
}

interface BanAction {
  championId: number;
  completed: boolean;
  team: "ally" | "enemy";
  slot: number;
}

interface PlayerSlot {
  cellId: number;
  summonerId: number;
  championId: number;
  championPickIntent: number;
  assignedPosition: string;
  isLocalPlayer: boolean;
  summonerName: string;
  puuid: string;

  soloTier: string;
  soloDivision: string;
  soloWins: number;
  soloLosses: number;
  flexTier: string;
  flexDivision: string;
  flexWins: number;
  flexLosses: number;
  tftTier: string;
  tftDivision: string;
  tftWins: number;
  tftLosses: number;
  tftDuoTier: string;
  tftDuoDivision: string;
  tftDuoWins: number;
  tftDuoLosses: number;
  allWins: number;
  allLosses: number;
  statsLoaded: boolean;
}

interface ChampSelectData {
  allyTeam: PlayerSlot[];
  enemyTeam: PlayerSlot[];
  allyBans: BanAction[];
  enemyBans: BanAction[];
  phase: string;
  isAram: boolean;
  isDraft: boolean;
  queueName: string;
}

const lcu = async (path: string, method = "GET", body?: unknown) => {
  const res = await (window as any).electronAPI.request(path, method, body);
  if (res?.__lcuError) {
    const err: any = new Error(res.message);
    err.httpStatus = res.httpStatus;
    throw err;
  }
  return res;
};

const POSITION_LABEL: Record<string, string> = {
  TOP: "Top",
  JUNGLE: "Jungle",
  MIDDLE: "Mid",
  BOTTOM: "Bot",
  UTILITY: "Support",
  FILL: "Fill",
  "": "—",
};

const TIER_COLOR: Record<string, string> = {
  IRON: "#6b6b6b",
  BRONZE: "#a0522d",
  SILVER: "#9aa4af",
  GOLD: "#c89b3c",
  PLATINUM: "#4fc3b0",
  EMERALD: "#2ecc71",
  DIAMOND: "#7eb4e2",
  MASTER: "#9b59b6",
  GRANDMASTER: "#e74c3c",
  CHALLENGER: "#f0c050",
  UNRANKED: "#555",
};

const TIER_SHORT: Record<string, string> = {
  IRON: "I",
  BRONZE: "B",
  SILVER: "S",
  GOLD: "G",
  PLATINUM: "P",
  EMERALD: "E",
  DIAMOND: "D",
  MASTER: "M",
  GRANDMASTER: "GM",
  CHALLENGER: "C",
  UNRANKED: "—",
};

function extractRankedQueue(stats: any, queueType: string) {
  if (!stats) return null;
  if (Array.isArray(stats.queues)) {
    const q = stats.queues.find(
      (q: any) => q.queueType === queueType || q.queue === queueType,
    );
    if (q?.tier && q.tier !== "NONE" && q.tier !== "") return q;
    return null;
  }
  if (stats.queueMap) {
    const q = stats.queueMap[queueType];
    if (q?.tier && q.tier !== "NONE" && q.tier !== "") return q;
  }
  return null;
}

const EMPTY_STATS: Omit<
  PlayerSlot,
  | "cellId"
  | "summonerId"
  | "championId"
  | "championPickIntent"
  | "assignedPosition"
  | "isLocalPlayer"
  | "summonerName"
  | "puuid"
> = {
  soloTier: "UNRANKED",
  soloDivision: "",
  soloWins: 0,
  soloLosses: 0,
  flexTier: "UNRANKED",
  flexDivision: "",
  flexWins: 0,
  flexLosses: 0,
  tftTier: "UNRANKED",
  tftDivision: "",
  tftWins: 0,
  tftLosses: 0,
  tftDuoTier: "UNRANKED",
  tftDuoDivision: "",
  tftDuoWins: 0,
  tftDuoLosses: 0,
  allWins: 0,
  allLosses: 0,
  statsLoaded: false,
};

function ChampIcon({
  championId,
  alias,
  size = 48,
  pending = false,
}: {
  championId: number;
  alias?: string;
  size?: number;
  pending?: boolean;
}) {
  const [err, setErr] = useState(false);
  if (!championId || err || pending) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: 3,
          background: pending
            ? "rgba(200,155,60,0.12)"
            : "rgba(255,255,255,0.05)",
          border: `1px solid ${pending ? "rgba(200,155,60,0.3)" : "rgba(255,255,255,0.08)"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {pending ? (
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              border: "2px solid rgba(200,155,60,0.5)",
              borderTopColor: "var(--gold)",
              animation: "spin 1s linear infinite",
              display: "inline-block",
            }}
          />
        ) : (
          <User size={size * 0.45} color="rgba(255,255,255,0.15)" />
        )}
      </div>
    );
  }
  return (
    <img
      src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${alias ?? championId}.png`}
      className="ingame-icon"
      alt=""
      width={size}
      height={size}
      style={{ borderRadius: 3, flexShrink: 0, objectFit: "cover" }}
      onError={() => setErr(true)}
    />
  );
}

function BanSlot({
  ban,
  champions,
  label,
}: {
  ban: BanAction | null;
  champions: ChampionSummary[];
  label: string;
}) {
  const champ = ban?.championId
    ? champions.find((c) => c.id === ban.championId)
    : null;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: 3,
          border: "1px solid rgba(231,76,60,0.3)",
          background: ban?.completed
            ? "rgba(231,76,60,0.12)"
            : "rgba(255,255,255,0.03)",
          overflow: "hidden",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {champ && ban?.completed ? (
          <>
            <img
              src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${champ.alias}.png`}
              alt={champ.name}
              width={36}
              height={36}
              style={{ objectFit: "cover", filter: "grayscale(0.5)" }}
              onError={(e) =>
                ((e.target as HTMLImageElement).style.display = "none")
              }
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(192,57,43,0.45)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg width={16} height={16} viewBox="0 0 16 16">
                <line
                  x1={3}
                  y1={3}
                  x2={13}
                  y2={13}
                  stroke="#e74c3c"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
                <line
                  x1={13}
                  y1={3}
                  x2={3}
                  y2={13}
                  stroke="#e74c3c"
                  strokeWidth={2.5}
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </>
        ) : (
          <Shield size={14} color="rgba(231,76,60,0.3)" />
        )}
      </div>
      <span
        style={{
          fontSize: 10,
          color: "var(--text-muted)",
          textAlign: "center",
          maxWidth: 40,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {champ?.name ?? label}
      </span>
    </div>
  );
}

function WRCircle({
  wins,
  losses,
  size = 32,
}: {
  wins: number;
  losses: number;
  size?: number;
}) {
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
  const r = (size - 4) / 2;
  const circ = 2 * Math.PI * r;
  const arc = total > 0 ? (wins / total) * circ : 0;
  return (
    <svg width={size} height={size} style={{ flexShrink: 0 }}>
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#e74c3c"
        strokeWidth={3}
        opacity={0.3}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="#3498db"
        strokeWidth={3}
        strokeDasharray={`${arc} ${circ}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        opacity={total > 0 ? 1 : 0.2}
      />
      <text
        x={size / 2}
        y={size / 2 + 4}
        textAnchor="middle"
        fontSize={9}
        fontWeight={700}
        fill={wr >= 50 ? "#3498db" : "#e74c3c"}
        fontFamily="Rajdhani, sans-serif"
      >
        {total > 0 ? `${wr}%` : "—"}
      </text>
    </svg>
  );
}

function RankedRow({
  label,
  tier,
  division,
  wins,
  losses,
}: {
  label: string;
  tier: string;
  division?: string;
  wins: number;
  losses: number;
}) {
  const color = TIER_COLOR[tier] ?? TIER_COLOR.UNRANKED;
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
  const r = 10,
    circ = 2 * Math.PI * r;
  const arc = total > 0 ? (wins / total) * circ : 0;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "5px 0",
        borderBottom: "1px solid rgba(255,255,255,0.04)",
      }}
    >
      <svg width={24} height={24} style={{ flexShrink: 0 }}>
        <circle
          cx={12}
          cy={12}
          r={r}
          fill="none"
          stroke="#e74c3c"
          strokeWidth={2.5}
          opacity={0.3}
        />
        <circle
          cx={12}
          cy={12}
          r={r}
          fill="none"
          stroke="#3498db"
          strokeWidth={2.5}
          strokeDasharray={`${arc} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 12 12)"
          opacity={total > 0 ? 1 : 0.2}
        />
      </svg>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          width: 64,
          flexShrink: 0,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color,
          width: 54,
          flexShrink: 0,
        }}
      >
        {tier === "UNRANKED" ? "Unranked" : `${tier} ${division ?? ""}`}
      </span>
      <span
        style={{
          fontSize: 11,
          color: "var(--text-muted)",
          flex: 1,
          textAlign: "right",
        }}
      >
        <span style={{ color: "#3498db", fontWeight: 600 }}>{wins}W</span>
        {" · "}
        <span style={{ color: "#e74c3c", fontWeight: 600 }}>{losses}L</span>
        {total > 0 && (
          <span
            style={{ color: wr >= 50 ? "#3498db" : "#e74c3c", marginLeft: 4 }}
          >
            {wr}%
          </span>
        )}
      </span>
    </div>
  );
}

function PlayerRow({
  player,
  champions,
  reversed = false,
  showPosition = true,
}: {
  player: PlayerSlot;
  champions: ChampionSummary[];
  reversed?: boolean;
  showPosition?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const champ = player.championId
    ? champions.find((c) => c.id === player.championId)
    : null;
  const intent = player.championPickIntent
    ? champions.find((c) => c.id === player.championPickIntent)
    : null;
  const displayChamp = champ || intent;
  const isPending = !champ && !!intent;
  const pos = POSITION_LABEL[player.assignedPosition] ?? "";

  const allTotal = player.allWins + player.allLosses;
  const allWR =
    allTotal > 0 ? Math.round((player.allWins / allTotal) * 100) : 0;

  const champIcon = (
    <ChampIcon
      championId={displayChamp?.id ?? 0}
      alias={displayChamp?.alias}
      size={44}
      pending={isPending && !champ}
    />
  );

  const nameBlock = (
    <div style={{ flex: 1, minWidth: 0 }}>
      <div
        style={{
          fontSize: 13,
          fontWeight: player.isLocalPlayer ? 600 : 400,
          color: player.isLocalPlayer ? "var(--gold)" : "var(--text-primary)",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          textAlign: reversed ? "right" : "left",
        }}
      >
        {player.summonerName || `Player ${player.cellId + 1}`}
        {player.isLocalPlayer && (
          <span
            style={{
              fontSize: 10,
              color: "var(--gold-dark)",
              marginLeft: 6,
              fontWeight: 400,
            }}
          >
            you
          </span>
        )}
      </div>
      {showPosition && pos && pos !== "—" && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 2,
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            textAlign: reversed ? "right" : "left",
          }}
        >
          {pos}
        </div>
      )}
      {displayChamp && (
        <div
          style={{
            fontSize: 11,
            color: isPending ? "rgba(200,155,60,0.6)" : "var(--text-muted)",
            marginTop: 1,
            fontStyle: isPending ? "italic" : "normal",
            textAlign: reversed ? "right" : "left",
          }}
        >
          {isPending ? `Hovering: ${displayChamp.name}` : displayChamp.name}
        </div>
      )}
    </div>
  );

  const inlineStats = (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 6,
        flexShrink: 0,
        flexDirection: "row",
      }}
    >
      <WRCircle wins={player.soloWins} losses={player.soloLosses} size={32} />
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          minWidth: 40,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Solo
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TIER_COLOR[player.soloTier] ?? "#555",
          }}
        >
          {player.soloTier === "UNRANKED"
            ? "—"
            : `${TIER_SHORT[player.soloTier]}${player.soloDivision ? ` ${player.soloDivision}` : ""}`}
        </span>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 1,
          minWidth: 36,
        }}
      >
        <span
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
          }}
        >
          Flex
        </span>
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: TIER_COLOR[player.flexTier] ?? "#555",
          }}
        >
          {player.flexTier === "UNRANKED"
            ? "—"
            : `${TIER_SHORT[player.flexTier]}${player.flexDivision ? ` ${player.flexDivision}` : ""}`}
        </span>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((p) => !p);
        }}
        style={{
          background: "none",
          border: "1px solid var(--blue-border)",
          borderRadius: 2,
          color: "var(--text-muted)",
          padding: "2px 4px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          transition: "border-color 0.15s ease",
          textTransform: "none",
          letterSpacing: 0,
        }}
        title="Show all ranked stats"
      >
        {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Main row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
          background: hovered
            ? player.isLocalPlayer
              ? "rgba(200,155,60,0.1)"
              : "rgba(255,255,255,0.05)"
            : player.isLocalPlayer
              ? "rgba(200,155,60,0.05)"
              : "rgba(255,255,255,0.02)",
          borderBottom: expanded ? "none" : "1px solid rgba(255,255,255,0.04)",
          borderLeft: reversed
            ? "none"
            : `2px solid ${hovered ? (player.isLocalPlayer ? "rgba(200,155,60,0.5)" : "rgba(10,200,185,0.35)") : "transparent"}`,
          borderRight: reversed
            ? `2px solid ${hovered ? (player.isLocalPlayer ? "rgba(200,155,60,0.5)" : "rgba(231,76,60,0.35)") : "transparent"}`
            : "none",
          flexDirection: reversed ? "row-reverse" : "row",
          transition: "background 0.15s ease, border-color 0.15s ease",
          cursor: "default",
        }}
      >
        <>
          {champIcon}
          {nameBlock}
          {inlineStats}
        </>
      </div>

      {/* Expanded ranked panel */}
      {expanded && (
        <div
          style={{
            padding: "10px 14px 12px",
            background: player.isLocalPlayer
              ? "rgba(200,155,60,0.04)"
              : "rgba(255,255,255,0.02)",
            borderBottom: "1px solid rgba(255,255,255,0.04)",
            borderLeft: reversed
              ? "none"
              : `2px solid ${player.isLocalPlayer ? "rgba(200,155,60,0.3)" : "rgba(10,200,185,0.2)"}`,
            borderRight: reversed
              ? `2px solid ${player.isLocalPlayer ? "rgba(200,155,60,0.3)" : "rgba(231,76,60,0.2)"}`
              : "none",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              marginBottom: 6,
            }}
          >
            Ranked
          </div>
          <RankedRow
            label="Solo/Duo"
            tier={player.soloTier}
            division={player.soloDivision}
            wins={player.soloWins}
            losses={player.soloLosses}
          />
          <RankedRow
            label="Flex"
            tier={player.flexTier}
            division={player.flexDivision}
            wins={player.flexWins}
            losses={player.flexLosses}
          />
          <RankedRow
            label="TFT"
            tier={player.tftTier}
            division={player.tftDivision}
            wins={player.tftWins}
            losses={player.tftLosses}
          />
          <RankedRow
            label="TFT 2v2"
            tier={player.tftDuoTier}
            division={player.tftDuoDivision}
            wins={player.tftDuoWins}
            losses={player.tftDuoLosses}
          />

          {allTotal > 0 && (
            <>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  marginTop: 10,
                  marginBottom: 6,
                }}
              >
                All Modes (last 100)
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <svg width={44} height={44} style={{ flexShrink: 0 }}>
                  {(() => {
                    const r2 = 18,
                      c2 = 2 * Math.PI * r2;
                    const a2 = (player.allWins / allTotal) * c2;
                    return (
                      <>
                        <circle
                          cx={22}
                          cy={22}
                          r={r2}
                          fill="none"
                          stroke="#e74c3c"
                          strokeWidth={4}
                          opacity={0.3}
                        />
                        <circle
                          cx={22}
                          cy={22}
                          r={r2}
                          fill="none"
                          stroke="#3498db"
                          strokeWidth={4}
                          strokeDasharray={`${a2} ${c2}`}
                          strokeLinecap="round"
                          transform="rotate(-90 22 22)"
                        />
                        <text
                          x={22}
                          y={26}
                          textAnchor="middle"
                          fontSize={10}
                          fontWeight={700}
                          fill={allWR >= 50 ? "#3498db" : "#e74c3c"}
                          fontFamily="Rajdhani, sans-serif"
                        >
                          {allWR}%
                        </text>
                      </>
                    );
                  })()}
                </svg>
                <div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 2,
                    }}
                  >
                    Win Rate
                  </div>
                  <div style={{ fontSize: 12 }}>
                    <span style={{ color: "#3498db", fontWeight: 600 }}>
                      {player.allWins}W
                    </span>
                    {" · "}
                    <span style={{ color: "#e74c3c", fontWeight: 600 }}>
                      {player.allLosses}L
                    </span>
                    {" · "}
                    <span style={{ color: "var(--text-primary)" }}>
                      {allTotal} games
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default function ChampSelectView({
  champions,
  isAram,
  isDraft,
  queueName,
  localSummonerId,
}: {
  champions: ChampionSummary[];
  isAram: boolean;
  isDraft: boolean;
  queueName: string;
  localSummonerId: number | null;
}) {
  const [data, setData] = useState<ChampSelectData | null>(null);
  const [loading, setLoading] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statsFetchedRef = useRef<Set<number>>(new Set());

  const resolveName = useCallback(
    async (summonerId: number): Promise<string> => {
      try {
        const s = await lcu(`/lol-summoner/v1/summoners/${summonerId}`);
        return s?.displayName || s?.gameName || `Summoner`;
      } catch {
        return `Player`;
      }
    },
    [],
  );

  const fetchStats = useCallback(
    async (summonerId: number, puuid: string): Promise<Partial<PlayerSlot>> => {
      let soloTier = "UNRANKED",
        soloDivision = "",
        soloWins = 0,
        soloLosses = 0;
      let flexTier = "UNRANKED",
        flexDivision = "",
        flexWins = 0,
        flexLosses = 0;
      let tftTier = "UNRANKED",
        tftDivision = "",
        tftWins = 0,
        tftLosses = 0;
      let tftDuoTier = "UNRANKED",
        tftDuoDivision = "",
        tftDuoWins = 0,
        tftDuoLosses = 0;
      let allWins = 0,
        allLosses = 0;

      if (summonerId) {
        try {
          const ranked = await lcu(`/lol-ranked/v1/ranked-stats/${summonerId}`);
          const solo = extractRankedQueue(ranked, "RANKED_SOLO_5x5");
          const flex = extractRankedQueue(ranked, "RANKED_FLEX_SR");
          const tft = extractRankedQueue(ranked, "RANKED_TFT");
          const tftDuo = extractRankedQueue(ranked, "RANKED_TFT_DOUBLE_UP");
          if (solo) {
            soloTier = solo.tier;
            soloDivision = solo.division ?? "";
            soloWins = solo.wins ?? 0;
            soloLosses = solo.losses ?? 0;
          }
          if (flex) {
            flexTier = flex.tier;
            flexDivision = flex.division ?? "";
            flexWins = flex.wins ?? 0;
            flexLosses = flex.losses ?? 0;
          }
          if (tft) {
            tftTier = tft.tier;
            tftDivision = tft.division ?? "";
            tftWins = tft.wins ?? 0;
            tftLosses = tft.losses ?? 0;
          }
          if (tftDuo) {
            tftDuoTier = tftDuo.tier;
            tftDuoDivision = tftDuo.division ?? "";
            tftDuoWins = tftDuo.wins ?? 0;
            tftDuoLosses = tftDuo.losses ?? 0;
          }
        } catch {}
      }

      if (puuid) {
        try {
          const history = await lcu(
            `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=99`,
          );
          const games: any[] = history?.games?.games ?? history?.matches ?? [];
          for (const g of games) {
            const stats =
              g.participants?.[0]?.stats ??
              g.participantIdentities?.[0]?.stats ??
              null;
            if (stats?.win === true) allWins++;
            else if (stats?.win === false) allLosses++;
          }
        } catch {}
      }

      return {
        soloTier,
        soloDivision,
        soloWins,
        soloLosses,
        flexTier,
        flexDivision,
        flexWins,
        flexLosses,
        tftTier,
        tftDivision,
        tftWins,
        tftLosses,
        tftDuoTier,
        tftDuoDivision,
        tftDuoWins,
        tftDuoLosses,
        allWins,
        allLosses,
        statsLoaded: true,
      };
    },
    [],
  );

  const fetchSession = useCallback(async () => {
    try {
      const session = await lcu("/lol-champ-select/v1/session");
      if (!session || session.__lcuError) {
        setData(null);
        return;
      }

      const localCellId = session.localPlayerCellId ?? 0;

      const allyBans: BanAction[] = [];
      const enemyBans: BanAction[] = [];
      let allyBanSlot = 0,
        enemyBanSlot = 0;
      for (const group of session.actions ?? []) {
        for (const action of group) {
          if (action.type !== "ban") continue;
          const isAlly = action.isAllyAction;
          const entry: BanAction = {
            championId: action.championId ?? 0,
            completed: action.completed ?? false,
            team: isAlly ? "ally" : "enemy",
            slot: isAlly ? allyBanSlot++ : enemyBanSlot++,
          };
          if (isAlly) allyBans.push(entry);
          else enemyBans.push(entry);
        }
      }

      const resolveTeam = async (
        members: any[],
        localCell: number,
      ): Promise<PlayerSlot[]> => {
        return Promise.all(
          members.map(async (m: any) => {
            const name = m.summonerId
              ? await resolveName(m.summonerId)
              : (m.botName ?? (m.isBot ? "Bot" : `Player ${m.cellId + 1}`));
            return {
              cellId: m.cellId,
              summonerId: m.summonerId,
              championId: m.championId ?? 0,
              championPickIntent: m.championPickIntent ?? 0,
              assignedPosition: m.assignedPosition ?? "",
              isLocalPlayer: m.cellId === localCell,
              summonerName: name,
              puuid: m.puuid ?? "",
              ...EMPTY_STATS,
            } as PlayerSlot;
          }),
        );
      };

      const [allyTeam, enemyTeam] = await Promise.all([
        resolveTeam(session.myTeam ?? [], localCellId),
        resolveTeam(session.theirTeam ?? [], -1),
      ]);

      setData((prev) => {
        const mergeStats = (
          newTeam: PlayerSlot[],
          prevTeam: PlayerSlot[] | undefined,
        ) =>
          newTeam.map((p) => {
            const existing = prevTeam?.find(
              (pp) => pp.summonerId === p.summonerId,
            );
            return existing?.statsLoaded
              ? {
                  ...p,
                  ...existing,
                  championId: p.championId,
                  championPickIntent: p.championPickIntent,
                }
              : p;
          });

        return {
          allyTeam: mergeStats(allyTeam, prev?.allyTeam),
          enemyTeam: mergeStats(enemyTeam, prev?.enemyTeam),
          allyBans,
          enemyBans,
          phase: session.timer?.phase ?? "",
          isAram,
          isDraft,
          queueName,
        };
      });

      const allPlayers = [...allyTeam, ...enemyTeam];
      for (const player of allPlayers) {
        if (
          player.summonerId &&
          !statsFetchedRef.current.has(player.summonerId)
        ) {
          statsFetchedRef.current.add(player.summonerId);
          fetchStats(player.summonerId, player.puuid).then((stats) => {
            setData((prev) => {
              if (!prev) return prev;
              const patch = (team: PlayerSlot[]) =>
                team.map((p) =>
                  p.summonerId === player.summonerId ? { ...p, ...stats } : p,
                );
              return {
                ...prev,
                allyTeam: patch(prev.allyTeam),
                enemyTeam: patch(prev.enemyTeam),
              };
            });
          });
        }
      }
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [isAram, isDraft, queueName, resolveName, fetchStats]);

  useEffect(() => {
    statsFetchedRef.current = new Set();
    fetchSession();
    timerRef.current = setInterval(fetchSession, 2000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [fetchSession]);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
          color: "var(--text-muted)",
          fontSize: 14,
        }}
      >
        <span className="spinner" style={{ marginRight: 10 }} />
        Loading champion select…
      </div>
    );
  }

  if (!data) return null;

  const BAN_SLOTS = 5;
  const allyBanSlots = Array.from(
    { length: BAN_SLOTS },
    (_, i) => data.allyBans.find((b) => b.slot === i) ?? null,
  );
  const enemyBanSlots = Array.from(
    { length: BAN_SLOTS },
    (_, i) => data.enemyBans.find((b) => b.slot === i) ?? null,
  );

  return (
    <div>
      {/* Header */}
      <div
        className="panel"
        style={{
          padding: "10px 16px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Swords size={15} color="var(--gold)" />
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--gold)",
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            Champion Select
          </span>
          <span
            style={{ fontSize: 12, color: "var(--text-muted)", marginLeft: 4 }}
          >
            {data.queueName}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span
            style={{ fontSize: 11, color: "var(--text-muted)", marginRight: 4 }}
          >
            Click{" "}
            <ChevronDown
              size={11}
              style={{ display: "inline", verticalAlign: "middle" }}
            />{" "}
            to expand ranked details
          </span>
          {data.phase && (
            <span
              style={{
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                color: "var(--text-muted)",
              }}
            >
              {data.phase.replace("_", " ")}
            </span>
          )}
        </div>
      </div>

      {/* Bans row (draft modes only) */}
      {!data.isAram && data.isDraft && (
        <div
          className="panel"
          style={{
            padding: "12px 16px",
            marginBottom: 12,
            display: "grid",
            gridTemplateColumns: "1fr auto 1fr",
            alignItems: "center",
            gap: 8,
          }}
        >
          <div
            style={{ display: "flex", gap: 8, justifyContent: "flex-start" }}
          >
            {allyBanSlots.map((ban, i) => (
              <BanSlot
                key={i}
                ban={ban}
                champions={champions}
                label={`Ban ${i + 1}`}
              />
            ))}
          </div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textAlign: "center",
              padding: "0 12px",
              whiteSpace: "nowrap",
            }}
          >
            Bans
          </div>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            {enemyBanSlots.map((ban, i) => (
              <BanSlot
                key={i}
                ban={ban}
                champions={champions}
                label={`Ban ${i + 1}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Teams */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Your Team */}
        <div className="panel" style={{ overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(39,174,96,0.2)",
              background: "rgba(39,174,96,0.05)",
              fontSize: 12,
              fontWeight: 600,
              color: "#2ecc71",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Your Team
          </div>
          {data.allyTeam.map((player) => (
            <PlayerRow
              key={player.cellId}
              player={player}
              champions={champions}
              showPosition={data.isDraft && !data.isAram}
            />
          ))}
        </div>

        {/* Enemy Team */}
        <div className="panel" style={{ overflow: "hidden", padding: 0 }}>
          <div
            style={{
              padding: "10px 12px",
              borderBottom: "1px solid rgba(231,76,60,0.2)",
              background: "rgba(231,76,60,0.05)",
              fontSize: 12,
              fontWeight: 600,
              color: "#e74c3c",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              textAlign: "right",
            }}
          >
            Enemy Team
          </div>
          {data.enemyTeam.map((player) => (
            <PlayerRow
              key={player.cellId}
              player={player}
              champions={champions}
              reversed={true}
              showPosition={data.isDraft && !data.isAram}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
