"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { Swords, ChevronDown, ChevronUp } from "lucide-react";

interface ChampionSummary {
  id: number;
  name: string;
  alias: string;
}

interface RankedQueue {
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  queueType?: string;
}

interface InGamePlayer {
  summonerName: string;
  championId: number;
  championAlias?: string;
  championName?: string;
  team: "ORDER" | "CHAOS" | "ally" | "enemy";
  isLocalPlayer: boolean;

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
}

const lcu = async (path: string, method = "GET", body?: unknown) => {
  const res = await (window as any).electronAPI.request(path, method, body);
  if (res?.__lcuError) throw new Error(res.message);
  return res;
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

function extractRankedQueue(stats: any, queueType: string): RankedQueue | null {
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
  const short = TIER_SHORT[tier] ?? "—";
  const total = wins + losses;
  const wr = total > 0 ? Math.round((wins / total) * 100) : 0;
  const r = 10;
  const circ = 2 * Math.PI * r;
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
      {/* donut */}
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
      {/* label */}
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
      {/* tier */}
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
      {/* W/L */}
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

function PlayerCard({
  player,
  reversed = false,
}: {
  player: InGamePlayer;
  reversed?: boolean;
}) {
  const [imgErr, setImgErr] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);

  const allTotal = player.allWins + player.allLosses;
  const allWR =
    allTotal > 0 ? Math.round((player.allWins / allTotal) * 100) : 0;

  const champIcon = (
    <div
      className="ingame-icon"
      style={{ position: "relative", flexShrink: 0 }}
    >
      {!imgErr && player.championAlias ? (
        <img
          src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${player.championAlias}.png`}
          alt=""
          width={48}
          height={48}
          style={{ borderRadius: 3 }}
          onError={() => setImgErr(true)}
        />
      ) : (
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 3,
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        />
      )}
    </div>
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
        {player.summonerName}
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
      {player.championName && (
        <div
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginTop: 2,
            textAlign: reversed ? "right" : "left",
          }}
        >
          {player.championName}
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
      {/* expand toggle */}
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
          {/* Section: Ranked */}
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

          {/* Section: All modes */}
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
                {/* big donut */}
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

export default function InGameView({
  champions,
  localSummonerId,
}: {
  champions: ChampionSummary[];
  localSummonerId: number | null;
}) {
  const [players, setPlayers] = useState<InGamePlayer[]>([]);
  const [loading, setLoading] = useState(true);
  const [queueName, setQueueName] = useState("");
  const fetchedRef = useRef(false);

  const fetchInGameData = useCallback(async () => {
    if (fetchedRef.current) return;
    try {
      const session = await lcu("/lol-gameflow/v1/session");
      if (!session?.gameData) return;

      setQueueName(
        session.gameData?.queue?.name ??
          session.gameData?.queue?.shortName ??
          "In Game",
      );

      const allPlayers: any[] = [
        ...(session.gameData.teamOne ?? []),
        ...(session.gameData.teamTwo ?? []),
      ];

      const playerChampMap: Record<number, number> = {};
      for (const sel of session.gameData.playerChampionSelections ?? []) {
        playerChampMap[sel.summonerId] = sel.championId;
      }

      const resolved: InGamePlayer[] = await Promise.all(
        allPlayers.map(async (p: any) => {
          const sid = p.summonerId ?? p.accountId ?? 0;
          let summonerName =
            p.summonerName ??
            p.displayName ??
            p.botName ??
            (p.isBot ? "Bot" : "");
          let puuid = p.puuid ?? "";

          if (!summonerName && sid) {
            try {
              const s = await lcu(`/lol-summoner/v1/summoners/${sid}`);
              summonerName = s?.displayName || s?.gameName || "Player";
              puuid = puuid || s?.puuid || "";
            } catch {
              summonerName = "Player";
            }
          }

          const champId = playerChampMap[sid] ?? p.championId ?? 0;
          const champObj = champions.find((c) => c.id === champId);

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

          if (sid) {
            try {
              const ranked = await lcu(`/lol-ranked/v1/ranked-stats/${sid}`);
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

          let allWins = 0,
            allLosses = 0;
          if (puuid) {
            try {
              const history = await lcu(
                `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=99`,
              );
              const games: any[] =
                history?.games?.games ?? history?.matches ?? [];
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
            summonerName,
            championId: champId,
            championAlias: champObj?.alias,
            championName: champObj?.name,
            team: p.team ?? (allPlayers.indexOf(p) < 5 ? "ORDER" : "CHAOS"),
            isLocalPlayer: sid === localSummonerId,
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
          } as InGamePlayer;
        }),
      );

      setPlayers(resolved);
      fetchedRef.current = true;
    } catch {
    } finally {
      setLoading(false);
    }
  }, [champions, localSummonerId]);

  useEffect(() => {
    fetchedRef.current = false;
    fetchInGameData();
  }, [fetchInGameData]);

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
        Loading game data…
      </div>
    );
  }

  const localTeam = players.find((p) => p.isLocalPlayer)?.team;
  const allyTeam = players.filter((p) => p.team === localTeam);
  const enemyTeam = players.filter((p) => p.team !== localTeam);
  const teamOne = players.filter((_, i) => i < 5);
  const teamTwo = players.filter((_, i) => i >= 5);
  const displayAlly = allyTeam.length > 0 ? allyTeam : teamOne;
  const displayEnemy = enemyTeam.length > 0 ? enemyTeam : teamTwo;

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
          gap: 8,
        }}
      >
        <Swords size={15} color="#27ae60" />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#27ae60",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          In Game
        </span>
        {queueName && (
          <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
            {queueName}
          </span>
        )}
        <span
          style={{
            fontSize: 11,
            color: "var(--text-muted)",
            marginLeft: "auto",
          }}
        >
          Click{" "}
          <ChevronDown
            size={11}
            style={{ display: "inline", verticalAlign: "middle" }}
          />{" "}
          to expand ranked details
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 16,
        }}
      >
        {/* Ally */}
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
          {displayAlly.length === 0 ? (
            <div
              style={{
                padding: "16px 12px",
                fontSize: 13,
                color: "var(--text-muted)",
                fontStyle: "italic",
              }}
            >
              No data available
            </div>
          ) : (
            displayAlly.map((p, i) => (
              <PlayerCard key={i} player={p} reversed={false} />
            ))
          )}
        </div>

        {/* Enemy */}
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
          {displayEnemy.length === 0 ? (
            <div
              style={{
                padding: "16px 12px",
                fontSize: 13,
                color: "var(--text-muted)",
                fontStyle: "italic",
                textAlign: "right",
              }}
            >
              No data available
            </div>
          ) : (
            displayEnemy.map((p, i) => (
              <PlayerCard key={i} player={p} reversed={true} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
