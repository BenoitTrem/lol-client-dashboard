"use client";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import {
  LogOut,
  AlertTriangle,
  AlertCircle,
  X,
  RefreshCw,
  Check,
  ShieldOff,
  RotateCcw,
  Swords,
  Ban,
  UserCheck,
  Shuffle,
  HelpCircle,
} from "lucide-react";

import ChampSelectView from "./champ-select-view";
import InGameView from "./in-game-view";
import HelpPage from "./help-page";

declare global {
  interface Window {
    electronAPI: {
      reloadLCU: () => Promise<any>;
    };
  }
}
interface Friend {
  name: string;
  availability: string;
  gameStatus?: string;
  summonerId?: number;
  id?: number;
}

interface Summoner {
  displayName?: string;
  gameName?: string;
  tagLine?: string;
  summonerLevel: number;
  profileIconId: number;
  puuid: string;
  summonerId?: number;
  id?: number;
}
interface ChampionMastery {
  championId: number;
  championLevel: number;
  championPoints: number;
  championName?: string;
  championAlias?: string;
}
interface GameflowSession {
  phase: string;
  gameData?: { queue?: { id: number; name: string } };
}
interface ReadyCheck {
  state: string;
  playerResponse: string;
  timer: number;
}
interface ChampSelectSession {
  myTeam: Array<{
    assignedPosition: string;
    cellId: number;
    championId: number;
    championPickIntent: number;
    puuid: string;
    summonerId: number;
  }>;
  actions: Array<
    Array<{
      actorCellId: number;
      championId: number;
      completed: boolean;
      id: number;
      isAllyAction: boolean;
      isInProgress: boolean;
      type: "ban" | "pick" | "ten_bans_reveal";
    }>
  >;
  localPlayerCellId: number;
  timer: { adjustedTimeLeftInPhase: number; phase: string };
}
interface ChampionSummary {
  id: number;
  name: string;
  alias: string;
}
interface LogEntry {
  id: number;
  time: string;
  message: string;
  type: "info" | "success" | "error" | "warn";
}
interface QueueOption {
  id: number;
  name: string;
  shortName?: string;
  isAram?: boolean;
}

interface RankedQueue {
  tier: string;
  division: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  queueType?: string;
}

interface RankedStats {
  queues?: RankedQueue[];
  queueMap?: {
    RANKED_SOLO_5x5?: RankedQueue;
    RANKED_FLEX_SR?: RankedQueue;
    RANKED_TFT?: RankedQueue;
    RANKED_TFT_DOUBLE_UP?: RankedQueue;
  };
  tier?: string;
  division?: string;
  leaguePoints?: number;
  wins?: number;
  losses?: number;
}

const LANES = ["Top", "Jungle", "Mid", "Bot", "Support", "Fill"] as const;
type Lane = (typeof LANES)[number];
const LANE_TO_POSITION: Record<Lane, string> = {
  Top: "TOP",
  Jungle: "JUNGLE",
  Mid: "MIDDLE",
  Bot: "BOTTOM",
  Support: "UTILITY",
  Fill: "FILL",
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
};
const pickRandom = <T,>(arr: T[]): T =>
  arr[Math.floor(Math.random() * arr.length)];

const lcu = async (path: string, method = "GET", body?: unknown) => {
  const res = await (window as any).electronAPI.request(path, method, body);
  if (res?.__lcuError) {
    const err: any = new Error(res.message);
    err.httpStatus = res.httpStatus;
    err.errorCode = res.errorCode;
    throw err;
  }
  return res;
};

const timestamp = () =>
  new Date().toLocaleTimeString("en-US", { hour12: false });

function ChampionSearch({
  value,
  onChange,
  placeholder,
  champions,
  excludeIds,
}: {
  value: number | null;
  onChange: (id: number | null, name: string) => void;
  placeholder: string;
  champions: ChampionSummary[];
  excludeIds: number[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = champions.find((c) => c.id === value);
  const filtered =
    query.length < 1
      ? []
      : champions
          .filter(
            (c) =>
              !excludeIds.filter((id) => id !== -1).includes(c.id) &&
              c.name.toLowerCase().includes(query.toLowerCase()),
          )
          .slice(0, 8);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} style={{ position: "relative" }}>
      {(selected || value === -1) && !open ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background:
              value === -1 ? "rgba(200,155,60,0.08)" : "rgba(200,155,60,0.08)",
            border: `1px solid ${value === -1 ? "rgba(200,155,60,0.35)" : "rgba(200,155,60,0.35)"}`,
            color: value === -1 ? "var(--gold-light)" : "var(--gold-light)",
            borderRadius: 2,
            padding: "6px 10px",
            fontSize: 13,
            cursor: "pointer",
          }}
          onClick={() => {
            setOpen(true);
            setQuery("");
          }}
        >
          <span
            style={{
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {value === -1 ? (
              <>
                <Shuffle size={13} />
                Random
              </>
            ) : (
              selected?.name
            )}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onChange(null, "");
              setQuery("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "var(--text-muted)",
              cursor: "pointer",
              padding: "0 2px",
              fontSize: 14,
              lineHeight: 1,
              textTransform: "none",
              letterSpacing: 0,
            }}
          >
            ×
          </button>
        </div>
      ) : (
        <input
          autoFocus={open}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          style={{
            width: "100%",
            background: "var(--blue-mid)",
            color: "var(--text-primary)",
            border: "1px solid var(--blue-border)",
            borderRadius: 2,
            padding: "6px 10px",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
          }}
        />
      )}

      {open && filtered.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            background: "var(--blue-panel)",
            border: "1px solid var(--blue-border)",
            borderRadius: 2,
            zIndex: 100,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <div
            onMouseDown={() => {
              onChange(-1, "Random");
              setQuery("");
              setOpen(false);
            }}
            style={{
              padding: "6px 10px",
              fontSize: 13,
              cursor: "pointer",
              color: "var(--gold-light)",
              borderBottom: "1px solid rgba(30,58,95,0.4)",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.background = "rgba(200,155,60,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.background = "transparent")
            }
          >
            <Shuffle size={13} />
            Random
          </div>
          {filtered.map((c) => (
            <div
              key={c.id}
              onMouseDown={() => {
                onChange(c.id, c.name);
                setQuery("");
                setOpen(false);
              }}
              style={{
                padding: "6px 10px",
                fontSize: 13,
                cursor: "pointer",
                color: "var(--text-primary)",
                borderBottom: "1px solid rgba(30,58,95,0.4)",
              }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "rgba(200,155,60,0.1)")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLElement).style.background =
                  "transparent")
              }
            >
              {c.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
function FriendCard({
  friend,
  lobbyId,
  onInvite,
}: {
  friend: Friend;
  lobbyId: string | null;
  onInvite: (f: Friend) => void;
}) {
  const [hovered, setHovered] = useState(false);

  const statusLabel =
    friend.gameStatus === "inGame"
      ? "In Game"
      : friend.gameStatus === "inQueue"
        ? "In Queue"
        : friend.gameStatus === "championSelect"
          ? "Champ Select"
          : friend.gameStatus === "hosting"
            ? "In Lobby"
            : friend.availability === "dnd"
              ? "In Game"
              : friend.availability === "away"
                ? "Away"
                : "Online";

  const statusColor =
    friend.gameStatus === "inGame" || friend.availability === "dnd"
      ? "#e74c3c"
      : friend.gameStatus === "inQueue"
        ? "#3498db"
        : friend.gameStatus === "championSelect"
          ? "#9b59b6"
          : friend.gameStatus === "hosting"
            ? "#f39c12"
            : "#2ecc71";

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "relative",
        display: "inline-block",
        paddingBottom: 6,
      }}
    >
      {hovered && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + -3px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "var(--blue-panel)",
            border: "1px solid rgba(39,174,96,0.4)",
            borderRadius: 4,
            padding: "6px 10px",
            whiteSpace: "nowrap",
            zIndex: 200,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
          }}
        >
          <button
            onClick={() => onInvite(friend)}
            style={{
              background: "rgba(39,174,96,0.2)",
              border: "1px solid rgba(39,174,96,0.5)",
              borderRadius: 3,
              color: "#2ecc71",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
              padding: "4px 10px",
              cursor: "pointer",
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <UserCheck size={12} />
            Invite to Lobby
          </button>
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "5px solid transparent",
              borderRight: "5px solid transparent",
              borderTop: "5px solid rgba(39,174,96,0.4)",
            }}
          />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          background: "rgba(39,174,96,0.08)",
          border: `1px solid ${hovered ? "rgba(39,174,96,0.6)" : "rgba(39,174,96,0.25)"}`,
          borderRadius: 4,
          minWidth: 160,
          transition: "border-color 0.2s",
          cursor: "default",
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: statusColor,
            flexShrink: 0,
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              color: "var(--text-primary)",
              fontSize: 13,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {friend.name}
          </div>
          <div
            style={{
              fontSize: 11,
              color: statusColor,
              marginTop: 1,
              letterSpacing: "0.04em",
            }}
          >
            {statusLabel}
          </div>
        </div>
      </div>
    </div>
  );
}
export default function Dashboard() {
  const [connected, setConnected] = useState(false);
  const [summoner, setSummoner] = useState<Summoner | null>(null);
  const summonerIdRef = useRef<number | null>(null);
  const connectedRef = useRef(false);
  const [phase, setPhase] = useState<string>("None");
  const [readyCheck, setReadyCheck] = useState<ReadyCheck | null>(null);
  const [autoAccept, setAutoAccept] = useState(false);
  const [autoAcceptDelay, setAutoAcceptDelay] = useState(0);
  const [selectedQueue, setSelectedQueue] = useState<number>(420);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [lobbyId, setLobbyId] = useState<string | null>(null);
  const [champions, setChampions] = useState<ChampionSummary[]>([]);
  const [banPicks, setBanPicks] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);
  const [banNames, setBanNames] = useState<string[]>(["", "", ""]);
  const [champPicks, setChampPicks] = useState<(number | null)[]>([
    null,
    null,
    null,
  ]);

  const [champNames, setChampNames] = useState<string[]>(["", "", ""]);
  const [lane1, setLane1] = useState<Lane | null>(null);
  const [lane2, setLane2] = useState<Lane | null>(null);
  const [autoChampSelect, setAutoChampSelect] = useState(true);
  const [rankedStats, setRankedStats] = useState<RankedStats | null>(null);
  const [iconUrl, setIconUrl] = useState<string | null>(null);
  const [topMastery, setTopMastery] = useState<ChampionMastery[]>([]);
  const [allModesWins, setAllModesWins] = useState(0);
  const [allModesLosses, setAllModesLosses] = useState(0);
  const [lobbyMembers, setLobbyMembers] = useState<string[]>([]);

  const [toast, setToast] = useState<{
    message: string;
    type: "warn" | "error";
  } | null>(null);

  const [initializing, setInitializing] = useState(true);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logIdRef = useRef(0);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const autoAcceptRef = useRef(autoAccept);
  const autoAcceptDelayRef = useRef(autoAcceptDelay);
  const banPicksRef = useRef(banPicks);
  const champPicksRef = useRef(champPicks);
  const autoChampSelectRef = useRef(autoChampSelect);
  const championsRef = useRef(champions);
  const wasInQueueRef = useRef(false);
  const requeueTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const champSelectHandledRef = useRef<Set<number>>(new Set());
  const phaseRef = useRef(phase);
  const [showHelp, setShowHelp] = useState(false);
  autoAcceptRef.current = autoAccept;
  autoAcceptDelayRef.current = autoAcceptDelay;
  banPicksRef.current = banPicks;
  champPicksRef.current = champPicks;
  autoChampSelectRef.current = autoChampSelect;
  championsRef.current = champions;
  phaseRef.current = phase;

  const [availableQueues, setAvailableQueues] = useState<QueueOption[]>([]);
  const [unavailableQueues, setUnavailableQueues] = useState<QueueOption[]>([]);
  const [onlineFriends, setOnlineFriends] = useState<Friend[]>([]);

  const DRAFT_QUEUE_IDS = new Set([420, 440, 400, 480, 700, 1700, 1710]);

  const draftQueueIds = useMemo(
    () =>
      new Set(
        availableQueues
          .filter((q) => DRAFT_QUEUE_IDS.has(q.id))
          .map((q) => q.id),
      ),
    [availableQueues],
  );
  const aramQueueIds = useMemo(
    () => new Set(availableQueues.filter((q) => q.isAram).map((q) => q.id)),
    [availableQueues],
  );

  const inLobby =
    phase === "Lobby" ||
    phase === "Matchmaking" ||
    phase === "ChampSelect" ||
    phase === "ReadyCheck";
  const ARENA_QUEUE_IDS = new Set([1700, 1710]);
  const isAram =
    aramQueueIds.has(selectedQueue) ||
    !!availableQueues
      .find((q) => q.id === selectedQueue)
      ?.name?.toLowerCase()
      .includes("aram");

  const isArena =
    ARENA_QUEUE_IDS.has(selectedQueue) ||
    !!availableQueues
      .find((q) => q.id === selectedQueue)
      ?.name?.toLowerCase()
      .includes("arena");

  const isTft = !!availableQueues
    .find((q) => q.id === selectedQueue)
    ?.name?.toLowerCase()
    .includes("tft");

  const isSwiftplay = selectedQueue === 480;

  const FULL_CHAMP_SELECT_IDS = new Set([420, 440, 400, 700]);

  const PICKS_AND_LANES_ONLY_IDS = new Set([480]);

  const showBanPrefs =
    inLobby &&
    !isAram &&
    !isTft &&
    (FULL_CHAMP_SELECT_IDS.has(selectedQueue) || isArena);

  const showPickPrefs =
    inLobby &&
    !isAram &&
    !isTft &&
    (FULL_CHAMP_SELECT_IDS.has(selectedQueue) ||
      PICKS_AND_LANES_ONLY_IDS.has(selectedQueue) ||
      isArena);

  const showLanePrefs =
    inLobby &&
    !isAram &&
    !isArena &&
    !isTft &&
    (FULL_CHAMP_SELECT_IDS.has(selectedQueue) ||
      PICKS_AND_LANES_ONLY_IDS.has(selectedQueue));

  const supportsChampSelect = showBanPrefs || showPickPrefs || showLanePrefs;

  const handleReload = async () => {
    if (!window.electronAPI?.reloadLCU) {
      console.warn("Electron API not available");
      return;
    }
    const data = await window.electronAPI.reloadLCU();
    if (data) setSummoner(data);
  };

  const fetchOnlineFriends = useCallback(async () => {
    try {
      const friends = await lcu("/lol-chat/v1/friends");
      const online: Friend[] = friends
        .filter(
          (f: any) =>
            f.availability &&
            !["offline", "mobile"].includes(
              String(f.availability).toLowerCase(),
            ),
        )
        .map((f: any) => ({
          name: f.name || f.gameName || f.displayName || "Unknown",
          availability: String(f.availability).toLowerCase(),
          gameStatus: f.lol?.gameStatus ?? f.gameStatus ?? null,
          summonerId: f.summonerId ?? f.id,
          id: f.summonerId ?? f.id,
        }));
      setOnlineFriends(online);
    } catch {
      setOnlineFriends([]);
    }
  }, []);

  const showToast = useCallback(
    (message: string, type: "warn" | "error" = "warn") => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      setToast({ message, type });
      toastTimerRef.current = setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  const addLog = useCallback(
    (message: string, type: LogEntry["type"] = "info") => {
      logIdRef.current += 1;
      setLogs((prev) =>
        [
          { id: logIdRef.current, time: timestamp(), message, type },
          ...prev,
        ].slice(0, 80),
      );
    },
    [],
  );

  const setLoad = (key: string, val: boolean) =>
    setLoading((p) => ({ ...p, [key]: val }));

  const fetchChampions = useCallback(async (): Promise<ChampionSummary[]> => {
    try {
      const data: ChampionSummary[] = await lcu(
        "/lol-champions/v1/owned-champions-minimal",
      );
      if (Array.isArray(data) && data.length > 0) {
        const sorted = [...data].sort((a, b) => a.name.localeCompare(b.name));
        setChampions(sorted);
        championsRef.current = sorted;
        addLog(`Loaded ${sorted.length} champions`, "success");
        return sorted;
      }
    } catch {}
    return [];
  }, [addLog]);

  const checkConnection = useCallback(async () => {
    try {
      const res = await (window as any).electronAPI.request(
        "/lol-summoner/v1/current-summoner",
      );
      if (!res || res.__lcuError || res.errorCode || !res.puuid) {
        setConnected(false);
        connectedRef.current = false;
        return false;
      }
      setConnected((prev) => {
        if (!prev) {
          connectedRef.current = true;
          addLog("LCU connected!", "success");
        }
        return true;
      });
      return true;
    } catch {
      setConnected(false);
      connectedRef.current = false;
      return false;
    }
  }, [addLog]);

  const fetchProfileData = useCallback(
    async (
      summonerId: number,
      profileIconId: number,
      puuid: string,
      resolvedChampions: ChampionSummary[],
    ) => {
      setIconUrl(
        `https://ddragon.leagueoflegends.com/cdn/14.24.1/img/profileicon/${profileIconId}.png`,
      );

      try {
        const ranked: RankedStats = await lcu(
          "/lol-ranked/v1/current-ranked-stats",
        );
        setRankedStats(ranked);
      } catch {}

      try {
        const history = await lcu(
          `/lol-match-history/v1/products/lol/${puuid}/matches?begIndex=0&endIndex=99`,
        );
        const games: any[] = history?.games?.games ?? history?.matches ?? [];
        let w = 0,
          l = 0;
        for (const g of games) {
          const stats =
            g.participants?.[0]?.stats ??
            g.participantIdentities?.[0]?.stats ??
            null;
          if (stats?.win === true) w++;
          else if (stats?.win === false) l++;
        }
        setAllModesWins(w);
        setAllModesLosses(l);
      } catch (e) {
        console.log("match history failed:", e);
      }

      try {
        let masteryData: unknown = null;
        const masteryEndpoints = [
          `/lol-champion-mastery/v1/local-player/champion-mastery`,
        ];
        for (const endpoint of masteryEndpoints) {
          try {
            masteryData = await lcu(endpoint);
            break;
          } catch {}
        }
        if (
          Array.isArray(masteryData) &&
          masteryData.length > 0 &&
          !("errorCode" in (masteryData[0] ?? {}))
        ) {
          const sorted = masteryData
            .sort((a: any, b: any) => b.championPoints - a.championPoints)
            .slice(0, 5);
          const withNames = sorted.map((m: ChampionMastery) => {
            const champ = resolvedChampions.find((c) => c.id === m.championId);
            return {
              ...m,
              championName: champ?.name,
              championAlias: champ?.alias,
            };
          });
          setTopMastery(withNames);
        }
      } catch {}
    },
    [],
  );

  const fetchSummoner = useCallback(
    async (resolvedChampions: ChampionSummary[] = championsRef.current) => {
      try {
        const data = await lcu("/lol-summoner/v1/current-summoner");
        setSummoner(data as Summoner);
        const sid = (data.summonerId || data.id) as number;
        summonerIdRef.current = sid;
        addLog(
          `Logged in as: ${data.gameName} (Lvl ${data.summonerLevel})`,
          "success",
        );
        await fetchProfileData(
          sid,
          data.profileIconId,
          data.puuid,
          resolvedChampions,
        );
      } catch (e: unknown) {
        addLog(
          `Could not fetch summoner: ${e instanceof Error ? e.message : String(e)}`,
          "error",
        );
      }
    },
    [addLog, fetchProfileData],
  );

  const handleChampSelect = useCallback(
    async (session: ChampSelectSession) => {
      if (!autoChampSelectRef.current) return;
      const localCellId = session.localPlayerCellId;
      for (const actionGroup of session.actions) {
        for (const action of actionGroup) {
          if (
            action.actorCellId !== localCellId ||
            action.completed ||
            !action.isInProgress ||
            champSelectHandledRef.current.has(action.id)
          )
            continue;

          if (action.type === "ban") {
            const hasBanPrefs = banPicksRef.current.some((id) => id !== null);
            if (!hasBanPrefs) continue;
            champSelectHandledRef.current.add(action.id);
            const alreadyBanned = session.actions
              .flat()
              .filter((a) => a.type === "ban" && a.completed)
              .map((a) => a.championId);
            const bans = banPicksRef.current.filter(
              (id): id is number => id !== null && id !== -1,
            );
            let chosenId =
              bans.find((id) => !alreadyBanned.includes(id)) ?? null;
            let chosenName = chosenId
              ? (championsRef.current.find((c) => c.id === chosenId)?.name ??
                String(chosenId))
              : "Random";
            if (chosenId === null) {
              const available = championsRef.current.filter(
                (c) => !alreadyBanned.includes(c.id),
              );
              if (available.length > 0) {
                const rand = pickRandom(available);
                chosenId = rand.id;
                chosenName = rand.name;
              }
            }
            try {
              await lcu(
                `/lol-champ-select/v1/session/actions/${action.id}/complete`,
                "POST",
                { championId: chosenId ?? 0 },
              );
              addLog(`Auto-banned: ${chosenName}`, "warn");
            } catch (e) {
              addLog(
                `Ban failed: ${e instanceof Error ? e.message : String(e)}`,
                "error",
              );
            }
          }

          if (action.type === "pick") {
            const hasPickPrefs = champPicksRef.current.some(
              (id) => id !== null,
            );
            if (!hasPickPrefs) continue;
            champSelectHandledRef.current.add(action.id);
            const alreadyPicked = session.myTeam
              .map((m) => m.championId)
              .filter(Boolean);
            const picks = champPicksRef.current.filter(
              (id): id is number => id !== null && id !== -1,
            );
            let chosenId =
              picks.find((id) => !alreadyPicked.includes(id)) ?? null;
            let chosenName = chosenId
              ? (championsRef.current.find((c) => c.id === chosenId)?.name ??
                String(chosenId))
              : "Random";
            if (chosenId === null) {
              const available = championsRef.current.filter(
                (c) => !alreadyPicked.includes(c.id),
              );
              if (available.length > 0) {
                const rand = pickRandom(available);
                chosenId = rand.id;
                chosenName = `${rand.name} (random)`;
              }
            }
            try {
              await lcu(
                `/lol-champ-select/v1/session/actions/${action.id}/complete`,
                "POST",
                { championId: chosenId ?? 0 },
              );
              addLog(`Auto-picked: ${chosenName}`, "success");
            } catch (e) {
              addLog(
                `Pick failed: ${e instanceof Error ? e.message : String(e)}`,
                "error",
              );
            }
          }
        }
      }
    },
    [addLog],
  );

  const syncLobbyState = useCallback(async () => {
    try {
      const lobby = await lcu("/lol-lobby/v2/lobby");
      if (lobby?.gameConfig) {
        setLobbyId("active");
        const lobbyQueueId = lobby.gameConfig.queueId;
        if (lobbyQueueId && lobbyQueueId > 0) {
          setSelectedQueue(lobbyQueueId);
        }
        const members: string[] = await Promise.all(
          (lobby.members ?? []).map(async (m: any) => {
            if (m.summonerName) return m.summonerName;
            if (m.gameName)
              return `${m.gameName}#${m.gameTag ?? m.tagLine ?? ""}`;
            if (m.summonerId) {
              try {
                const s = await lcu(
                  `/lol-summoner/v1/summoners/${m.summonerId}`,
                );
                return (
                  s?.displayName || s?.gameName || `Player ${m.summonerId}`
                );
              } catch {
                return `Player ${m.summonerId}`;
              }
            }
            return "Unknown";
          }),
        );
        setLobbyMembers(members);
      } else {
        setLobbyId(null);
        setLobbyMembers([]);
      }
    } catch (e: any) {
      setLobbyId(null);
      setLobbyMembers([]);
    }
  }, []);

  const pollGameflow = useCallback(async () => {
    try {
      if (
        !["ChampSelect", "InProgress", "WaitingForStats"].includes(
          phaseRef.current,
        )
      )
        await syncLobbyState();

      const session: GameflowSession = await lcu("/lol-gameflow/v1/session");
      const newPhase = session?.phase ?? "None";

      setPhase((prev) => {
        if (prev !== newPhase) {
          addLog(`Gameflow phase → ${newPhase}`, "info");
          if (newPhase !== "ChampSelect") champSelectHandledRef.current.clear();

          if (prev === "ReadyCheck" && newPhase === "Lobby") {
            if (autoAcceptRef.current) {
              addLog("Match cancelled — requeuing in 3s…", "warn");
              if (requeueTimerRef.current)
                clearTimeout(requeueTimerRef.current);
              requeueTimerRef.current = setTimeout(async () => {
                try {
                  await lcu("/lol-lobby/v2/lobby/matchmaking/search", "POST");
                  addLog("Queue restarted automatically!", "success");
                } catch (e) {
                  addLog(
                    `Requeue failed: ${e instanceof Error ? e.message : String(e)}`,
                    "error",
                  );
                }
              }, 3000);
            }
          }
        }
        return newPhase;
      });

      if (newPhase === "ReadyCheck") {
        try {
          const rc: ReadyCheck = await lcu("/lol-matchmaking/v1/ready-check");
          setReadyCheck(rc);
          if (
            autoAcceptRef.current &&
            rc.playerResponse === "None" &&
            rc.state !== "StrangerAccepted"
          ) {
            const delay = autoAcceptDelayRef.current * 1000;
            setTimeout(async () => {
              try {
                await lcu("/lol-matchmaking/v1/ready-check/accept", "POST");
                addLog("Match auto-accepted!", "success");
              } catch (e) {
                addLog(
                  `Auto-accept failed: ${e instanceof Error ? e.message : String(e)}`,
                  "error",
                );
              }
            }, delay);
          }
        } catch {
          setReadyCheck(null);
        }
      } else {
        setReadyCheck(null);
      }

      if (newPhase === "ChampSelect") {
        try {
          const cs: ChampSelectSession = await lcu(
            "/lol-champ-select/v1/session",
          );
          await handleChampSelect(cs);

          const isPickPhase =
            cs.timer?.phase === "FINALIZATION" ||
            cs.timer?.phase === "BAN_PICK";
          if (isPickPhase) {
            const unpicked = cs.myTeam.filter(
              (m) => m.championId === 0 && m.championPickIntent === 0,
            );
            if (unpicked.length > 0) {
              const summonerIds = unpicked
                .map((u) => u.summonerId)
                .filter(Boolean);
              const names = await Promise.all(
                summonerIds.map(async (sid) => {
                  try {
                    const s = await lcu(`/lol-summoner/v1/summoners/${sid}`);
                    return s?.displayName || s?.gameName || `Player ${sid}`;
                  } catch {
                    return `Player ${sid}`;
                  }
                }),
              );
              showToast(`No champion selected: ${names.join(", ")}`, "warn");
            }
          }
        } catch {}
      }
    } catch {
      setPhase("None");
      setReadyCheck(null);
    }
  }, [addLog, handleChampSelect, syncLobbyState]);

  useEffect(() => {
    const interval = setInterval(async () => {
      if (!window.electronAPI?.reloadLCU) return;
      if (!connectedRef.current) return;
      const data = await window.electronAPI.reloadLCU();
      if (data && !summoner) {
        setSummoner(data);
        const sid = (data.summonerId || data.id) as number;
        summonerIdRef.current = sid;
        await fetchProfileData(
          sid,
          data.profileIconId,
          data.puuid,
          championsRef.current,
        );
      }
    }, 5000);
    return () => {
      clearInterval(interval);
      if (requeueTimerRef.current) clearTimeout(requeueTimerRef.current);
    };
  }, [summoner, fetchProfileData]);

  useEffect(() => {
    if (!draftQueueIds.has(selectedQueue)) setAutoChampSelect(false);
  }, [selectedQueue, draftQueueIds]);

  useEffect(() => {
    if (!lobbyId) return;
    syncLobbyState();
  }, [selectedQueue, lobbyId, syncLobbyState]);

  const applyLanes = async () => {
    if (aramQueueIds.has(selectedQueue) || (!lane1 && !lane2)) return;
    addLog(
      `Applying lane preferences: ${lane1 ?? "—"} / ${lane2 ?? "—"}`,
      "info",
    );
    try {
      await lcu(
        "/lol-lobby/v2/lobby/members/localMember/position-preferences",
        "PUT",
        {
          firstPreference: lane1 ? LANE_TO_POSITION[lane1] : "UNSELECTED",
          secondPreference: lane2 ? LANE_TO_POSITION[lane2] : "UNSELECTED",
        },
      );
      addLog(
        `Lane preferences saved: ${lane1 ?? "—"} / ${lane2 ?? "—"}`,
        "success",
      );
    } catch (e: unknown) {
      addLog(
        `Failed to save lane preferences: ${e instanceof Error ? e.message : String(e)}`,
        "warn",
      );
    }
  };

  const handleInviteFriend = async (friend: Friend) => {
    if (!lobbyId) {
      addLog("Invite failed — not in a lobby", "warn");
      showToast(
        "You need to create a lobby first before inviting friends.",
        "warn",
      );
      return;
    }
    const busyStatuses = ["inGame", "championSelect", "inQueue"];
    if (
      busyStatuses.includes(friend.gameStatus ?? "") ||
      friend.availability === "dnd"
    ) {
      const reason =
        friend.gameStatus === "championSelect"
          ? "in champion select"
          : "currently in a game";
      addLog(`Cannot invite ${friend.name} — they are ${reason}`, "warn");
      showToast(
        `${friend.name} is ${reason} and can't be invited right now.`,
        "warn",
      );
      return;
    }
    addLog(`Sending invite to ${friend.name}…`, "info");
    try {
      await lcu("/lol-lobby/v2/lobby/invitations", "POST", [
        { toSummonerId: friend.summonerId ?? friend.id },
      ]);
      addLog(`Invite sent to ${friend.name}`, "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to invite ${friend.name}: ${msg}`, "error");
      showToast(
        `Could not invite ${friend.name}. They may have invites disabled.`,
        "error",
      );
    }
  };

  const PREFERRED_QUEUE_ORDER = [420, 440, 400, 480, 450, 2400];

  const fetchAvailableQueues = useCallback(async () => {
    try {
      const queues = await lcu("/lol-game-queues/v1/queues");
      if (Array.isArray(queues)) {
        console.log(
          "[Queues] All queues:",
          queues.map((q: any) => ({
            id: q.id,
            name: q.name,
            availability: q.queueAvailability,
            gameMode: q.gameMode,
          })),
        );

        const ALWAYS_AVAILABLE_IDS = new Set([420, 440, 400, 450]);
        const FORCE_UNAVAILABLE_IDS = new Set([
          3270, 3140, 3200, 3220, 3210, 3230, 3120, 3100, 3110, 3130,
        ]);
        const seen = new Set<number>();
        const allQueues = queues
          .filter((q: any) => {
            if (!q.name || q.name.trim() === "" || q.id <= 0) return false;
            if (seen.has(q.id)) return false;
            seen.add(q.id);
            return true;
          })
          .map((q: any): QueueOption & { available: boolean } => {
            let name = q.name;
            let shortName = q.shortName ?? q.name;
            if (q.id === 400) {
              name = "Normal Draft Pick";
              shortName = "Normal Draft";
            }
            if (q.id === 430) {
              name = "Normal Blind Pick";
              shortName = "Normal Blind";
            }
            if (q.id === 2400) {
              name = "ARAM: Mayhem";
              shortName = "ARAM: Mayhem";
            }
            if (q.id === 480) {
              name = "Swiftplay";
              shortName = "Swiftplay";
            }

            return {
              id: q.id,
              name,
              shortName,
              isAram: q.gameMode === "ARAM",
              available:
                !FORCE_UNAVAILABLE_IDS.has(q.id) &&
                (ALWAYS_AVAILABLE_IDS.has(q.id) ||
                  q.queueAvailability === "Available" ||
                  q.queueAvailability === "PlatformAvailable"),
            };
          });

        const seenNames = new Set<string>();
        const available = allQueues
          .filter((q) => q.available)
          .sort((a, b) => {
            const ai = PREFERRED_QUEUE_ORDER.indexOf(a.id);
            const bi = PREFERRED_QUEUE_ORDER.indexOf(b.id);
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.name.localeCompare(b.name);
          })
          .filter((q) => {
            if (seenNames.has(q.name)) return false;
            seenNames.add(q.name);
            return true;
          });

        const unavailable = allQueues
          .filter((q) => !q.available)
          .sort((a, b) => a.name.localeCompare(b.name));

        setAvailableQueues(available);
        setSelectedQueue((prev) =>
          available.find((q) => q.id === prev)
            ? prev
            : (available[0]?.id ?? 420),
        );

        setUnavailableQueues(unavailable);
        addLog(`Loaded ${available.length} available queues`, "success");
      }
    } catch (e) {
      addLog("Could not fetch queues from client", "warn");
    }
  }, [addLog]);

  useEffect(() => {
    const startPolling = async () => {
      const ok = await checkConnection();
      setInitializing(false);
      if (ok) {
        const loadedChampions = await fetchChampions();
        await fetchSummoner(loadedChampions);
        await fetchOnlineFriends();
        await fetchAvailableQueues();
      }
      pollingRef.current = setInterval(async () => {
        const ok = await checkConnection();
        if (ok) {
          pollGameflow();
          fetchOnlineFriends();
        }
      }, 2500);
    };
    startPolling();
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [
    checkConnection,
    fetchSummoner,
    fetchChampions,
    pollGameflow,
    fetchAvailableQueues,
  ]);

  const handleCreateLobby = async () => {
    setLoad("lobby", true);
    if (!availableQueues.find((q) => q.id === selectedQueue)) {
      addLog("Cannot create lobby — queue not available", "warn");
      showToast("This game mode is not currently available.", "warn");
      setLoad("lobby", false);
      return;
    }
    const qName =
      availableQueues.find((q) => q.id === selectedQueue)?.shortName ??
      selectedQueue;
    addLog(`Creating lobby for ${qName}…`, "info");
    try {
      const data = await lcu("/lol-lobby/v2/lobby", "POST", {
        queueId: selectedQueue,
      });
      await new Promise((r) => setTimeout(r, 500));
      setLobbyId(data?.gameConfig?.queueId?.toString() ?? "created");
      addLog(`Lobby created: ${qName}`, "success");
    } catch (e: unknown) {
      const msg =
        e instanceof Error ? e.message : (JSON.stringify(e) ?? String(e));
      addLog(`Failed to create lobby: ${msg}`, "error");
      showToast(`Could not create lobby. Is the client ready?`, "error");
    } finally {
      setLoad("lobby", false);
    }
  };

  const handleChangeQueue = async (newQueueId: number) => {
    const qName =
      availableQueues.find((q) => q.id === newQueueId)?.shortName ?? newQueueId;
    addLog(`Switching queue to ${qName}…`, "info");
    try {
      await lcu("/lol-lobby/v2/lobby", "POST", { queueId: newQueueId });
      setSelectedQueue(newQueueId);
      addLog(`Queue changed to ${qName}`, "success");
      await new Promise((r) => setTimeout(r, 500));
      await syncLobbyState();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to switch queue: ${msg}`, "error");
      showToast(
        `Could not switch to ${qName}. Try leaving and recreating the lobby.`,
        "error",
      );
      setLobbyId(null);
      setLobbyMembers([]);
    }
  };

  const handleStartQueue = async () => {
    if (!isAram && draftQueueIds.has(selectedQueue)) {
      const hasNone = !lane1 && !lane2,
        hasBoth = lane1 && lane2,
        isFillOnly = lane1 === "Fill" && !lane2;
      if (!hasNone && !hasBoth && !isFillOnly) {
        addLog("Queue blocked — invalid lane selection", "warn");
        showToast(
          "Lane preference incomplete — pick Fill, both lanes, or leave both empty.",
          "warn",
        );
        return;
      }
    }
    setLoad("queue", true);
    addLog("Starting matchmaking search…", "info");
    try {
      await applyLanes();
      await lcu("/lol-lobby/v2/lobby/matchmaking/search", "POST");
      addLog("In queue — searching for a match", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to start queue: ${msg}`, "error");
      showToast("Could not start queue. Make sure you're in a lobby.", "error");
    } finally {
      setLoad("queue", false);
    }
  };

  const handleStopQueue = async () => {
    setLoad("stopqueue", true);
    addLog("Leaving queue…", "info");
    try {
      await lcu("/lol-lobby/v2/lobby/matchmaking/search", "DELETE");
      addLog("Left queue — back in lobby", "warn");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to leave queue: ${msg}`, "error");
      showToast("Could not leave queue. Try reloading.", "error");
    } finally {
      setLoad("stopqueue", false);
    }
  };

  const handleAcceptNow = async () => {
    setLoad("accept", true);
    try {
      await lcu("/lol-matchmaking/v1/ready-check/accept", "POST");
      addLog("Match accepted — entering champion select", "success");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to accept match: ${msg}`, "error");
      showToast(
        "Could not accept — the ready check may have expired.",
        "error",
      );
    } finally {
      setLoad("accept", false);
    }
  };

  const handleDecline = async () => {
    setLoad("decline", true);
    try {
      await lcu("/lol-matchmaking/v1/ready-check/decline", "POST");
      addLog("Match declined — returning to lobby", "warn");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to decline match: ${msg}`, "error");
      showToast(
        "Could not decline — the ready check may have already closed.",
        "error",
      );
    } finally {
      setLoad("decline", false);
    }
  };

  function extractRankedQueue(
    stats: RankedStats | null,
    queueType:
      | "RANKED_SOLO_5x5"
      | "RANKED_FLEX_SR"
      | "RANKED_TFT"
      | "RANKED_TFT_DOUBLE_UP",
  ): RankedQueue | null {
    if (!stats) return null;
    if (Array.isArray(stats.queues)) {
      const q =
        stats.queues.find(
          (q) => q.queueType === queueType || (q as any).queue === queueType,
        ) ??
        (queueType === "RANKED_SOLO_5x5" ? stats.queues[0] : stats.queues[1]);
      if (q?.tier && q.tier !== "NONE" && q.tier !== "") return q;
      return null;
    }
    if (stats.queueMap) {
      const q = stats.queueMap[queueType];
      if (q?.tier && q.tier !== "NONE" && q.tier !== "") return q;
    }
    const flat = stats as any;
    if (flat.tier && flat.tier !== "NONE" && flat.tier !== "") {
      return flat as RankedQueue;
    }
    return null;
  }

  const handleLeaveLobby = async () => {
    setLoad("leave", true);
    addLog("Leaving lobby…", "info");
    try {
      await lcu("/lol-lobby/v2/lobby", "DELETE");
      setLobbyId(null);
      addLog("Left lobby successfully", "warn");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`Failed to leave lobby: ${msg}`, "error");
      showToast("Could not leave lobby. Try reloading the client.", "error");
    } finally {
      setLoad("leave", false);
    }
  };

  const phaseColor =
    (
      {
        None: "#a09b8c",
        Lobby: "#f39c12",
        Matchmaking: "#3498db",
        ReadyCheck: "#e74c3c",
        ChampSelect: "#9b59b6",
        InProgress: "#27ae60",
        WaitingForStats: "#1abc9c",
        EndOfGame: "#95a5a6",
      } as Record<string, string>
    )[phase] ?? "#a09b8c";

  const allBanIds = banPicks.filter((id): id is number => id !== null);
  const allPickIds = champPicks.filter((id): id is number => id !== null);
  const soloQueue = extractRankedQueue(rankedStats, "RANKED_SOLO_5x5");
  const flexQueue = extractRankedQueue(rankedStats, "RANKED_FLEX_SR");
  const tftQueue = extractRankedQueue(rankedStats, "RANKED_TFT");
  const tftDoubleUpQueue = extractRankedQueue(
    rankedStats,
    "RANKED_TFT_DOUBLE_UP",
  );
  const allModesTotal = allModesWins + allModesLosses;
  const allModesWR =
    allModesTotal > 0 ? Math.round((allModesWins / allModesTotal) * 100) : 0;

  if (initializing) {
    if (showHelp) {
      return <HelpPage onBack={() => setShowHelp(false)} />;
    }
    return (
      <div
        style={{
          maxWidth: 1260,
          width: "100%",
          margin: "0 auto",
          padding: "42px 8px",
          textAlign: "center",
        }}
      >
        <span className="spinner" />
      </div>
    );
  }

  if (!connected) {
    if (showHelp) {
      return <HelpPage onBack={() => setShowHelp(false)} />;
    }
    return (
      <div
        style={{
          maxWidth: 1260,
          width: "100%",
          margin: "0 auto",
          padding: "42px 8px",
          opacity: 0,
          animation: "fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
        }}
      >
        <header style={{ marginBottom: 32, textAlign: "center" }}>
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
          <h1 style={{ fontSize: 32, color: "var(--gold)", marginBottom: 24 }}>
            LoL Client Dashboard
          </h1>
          <div
            className="panel"
            style={{
              padding: 40,
              maxWidth: 480,
              margin: "55px auto 0",
              textAlign: "center",
            }}
          >
            <div style={{ marginBottom: 16 }}>
              <span className="tag tag-offline" style={{ fontSize: 13 }}>
                <span
                  className="client-connected offline"
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: "#e74c3c",
                    display: "inline-block",
                  }}
                />
                Client Offline
              </span>
            </div>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 14,
                marginBottom: 8,
                lineHeight: 1.6,
              }}
            >
              League of Legends client not detected.
            </p>
            <p
              style={{
                color: "var(--text-muted)",
                fontSize: 14,
                marginBottom: 8,
                lineHeight: 1.6,
                paddingBottom: 22,
              }}
            >
              Please open the LoL client then click Retry.
            </p>
            <button
              className="btn-gold btn-icon"
              onClick={() => window.location.reload()}
              style={{
                width: "100%",
                maxWidth: "none",
                justifyContent: "center",
                padding: "12px 20px",
                fontSize: 14,
              }}
            >
              <RefreshCw size={15} />
              Retry
            </button>
          </div>
        </header>
      </div>
    );
  }
  if (showHelp) {
    return <HelpPage onBack={() => setShowHelp(false)} />;
  }
  return (
    <div
      style={{
        maxWidth: 1260,
        width: "100%",
        margin: "0 auto",
        padding: "42px 8px",
        opacity: 0,
        animation: "fadeIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) 0.3s both",
      }}
    >
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
          LoL Client Dashboard
        </h1>
      </header>

      <div
        className="panel"
        style={{
          padding: "12px 20px",
          marginBottom: 16,
          display: "grid",
          gridTemplateColumns: "1fr auto 1fr",
          alignItems: "center",
          gap: 12,
        }}
      >
        <span
          className={`tag ${connected ? "tag-online" : "tag-offline"}`}
          style={{ justifySelf: "start" }}
        >
          <span
            className={`client-connected ${connected ? "online" : "offline"}`}
            style={{
              width: 7,
              height: 7,
              borderRadius: "50%",
              background: connected ? "#2ecc71" : "#e74c3c",
              display: "inline-block",
            }}
          />
          {connected ? "Client Connected" : "Client Offline"}
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span
            style={{
              fontSize: 12,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Phase:
          </span>
          <span
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: phaseColor,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            {phase}
          </span>
        </div>

        <div
          style={{
            justifySelf: "end",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <button
            className="btn-clear"
            onClick={() => setShowHelp(true)}
            title="Help & Guide"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              fontSize: 12,
              padding: "4px 10px",
            }}
          >
            <HelpCircle size={15} />
          </button>
          <button
            className="btn-clear"
            onClick={() => window.location.reload()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontSize: 12,
              padding: "4px 10px",
            }}
          >
            <RefreshCw size={13} />
            Reload
          </button>
        </div>
      </div>

      {phase === "ChampSelect" ? (
        <ChampSelectView
          champions={champions}
          isAram={isAram}
          isDraft={draftQueueIds.has(selectedQueue)}
          queueName={
            availableQueues.find((q) => q.id === selectedQueue)?.name ??
            "Champion Select"
          }
          localSummonerId={summonerIdRef.current}
        />
      ) : phase === "InProgress" || phase === "WaitingForStats" ? (
        <InGameView
          champions={champions}
          localSummonerId={summonerIdRef.current}
        />
      ) : (
        <>
          {summoner && (
            <div className="panel" style={{ padding: 20, marginBottom: 16 }}>
              <div
                style={{
                  display: "flex",
                  gap: 20,
                  alignItems: "flex-start",
                  flexWrap: "nowrap",
                  overflow: "visible",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flexShrink: 0,
                    minWidth: 335,
                    gap: 10,
                    overflow: "visible",
                  }}
                >
                  {iconUrl ? (
                    <img
                      src={iconUrl}
                      alt="icon"
                      width={100}
                      height={100}
                      style={{
                        borderRadius: 4,
                        border: "2px solid var(--gold)",
                        flexShrink: 0,
                      }}
                      className="profile-icon"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 72,
                        height: 72,
                        borderRadius: 4,
                        border: "2px solid var(--blue-border)",
                        background: "rgba(255,255,255,0.04)",
                        flexShrink: 0,
                      }}
                    />
                  )}

                  <div style={{ width: "100%", textAlign: "left" }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 700,
                        color: "var(--gold)",
                        fontFamily: "Cinzel, serif",
                        marginBottom: 4,
                      }}
                    >
                      {summoner.displayName ||
                        (summoner.gameName
                          ? `${summoner.gameName} #${summoner.tagLine}`
                          : "Unknown")}
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginBottom: 6,
                      }}
                    >
                      Level{" "}
                      <strong style={{ color: "var(--text-primary)" }}>
                        {summoner.summonerLevel}
                      </strong>
                    </div>
                  </div>

                  {allModesTotal > 0 &&
                    (() => {
                      const radius = 22;
                      const circ = 2 * Math.PI * radius;
                      const winArc = (allModesWins / allModesTotal) * circ;
                      return (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            marginTop: 8,
                          }}
                        >
                          <svg width={52} height={52} style={{ flexShrink: 0 }}>
                            <circle
                              cx={26}
                              cy={26}
                              r={radius}
                              fill="none"
                              stroke="#e74c3c"
                              strokeWidth={6}
                              opacity={0.3}
                            />
                            <circle
                              cx={26}
                              cy={26}
                              r={radius}
                              fill="none"
                              stroke="#3498db"
                              strokeWidth={6}
                              strokeDasharray={`${winArc} ${circ}`}
                              strokeLinecap="round"
                              transform="rotate(-90 26 26)"
                            />
                            <text
                              x={26}
                              y={30}
                              textAnchor="middle"
                              fontSize={12}
                              fontWeight={700}
                              fill={allModesWR >= 50 ? "#3498db" : "#e74c3c"}
                              fontFamily="Rajdhani, sans-serif"
                            >
                              {allModesWR}%
                            </text>
                          </svg>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.08em",
                                marginBottom: 2,
                              }}
                            >
                              All Modes
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                color: "var(--text-muted)",
                              }}
                            >
                              <span
                                style={{ color: "#3498db", fontWeight: 600 }}
                              >
                                {allModesWins}W
                              </span>
                              {" · "}
                              <span
                                style={{ color: "#e74c3c", fontWeight: 600 }}
                              >
                                {allModesLosses}L
                              </span>
                              {" · "}
                              <span style={{ color: "var(--text-primary)" }}>
                                {allModesTotal} games
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                </div>

                <div
                  style={{
                    width: 1,
                    background: "var(--blue-border)",
                    alignSelf: "stretch",
                    flexShrink: 0,
                  }}
                />

                <div style={{ flex: "2 1 0", minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 14,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.1em",
                      marginBottom: 10,
                    }}
                  >
                    Ranked
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: 12,
                    }}
                  >
                    {(
                      [
                        ["Solo/Duo", soloQueue],
                        ["Flex", flexQueue],
                        ["TFT", tftQueue],
                        ["TFT Double Up", tftDoubleUpQueue],
                      ] as [string, RankedQueue | null][]
                    ).map(([label, q]) => {
                      const wins = q?.wins ?? 0;
                      const losses = q?.losses ?? 0;
                      const total = wins + losses;
                      const wr =
                        total > 0 ? Math.round((wins / total) * 100) : 0;
                      const radius = 23;
                      const circ = 2 * Math.PI * radius;
                      const winArc = total > 0 ? (wins / total) * circ : 0;
                      const tier =
                        q?.tier && q.tier !== "" ? q.tier : "UNRANKED";
                      const tierIconUrl = `https://raw.communitydragon.org/latest/plugins/rcp-fe-lol-shared-components/global/default/${tier.toLowerCase()}.png`;

                      return (
                        <div
                          key={label}
                          className="panel ranked-panel"
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                            padding: "12px 10px",
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid var(--blue-border)",
                            borderRadius: 3,
                          }}
                        >
                          <svg width={56} height={56} style={{ flexShrink: 0 }}>
                            <circle
                              cx={28}
                              cy={28}
                              r={radius}
                              fill="none"
                              stroke="#e74c3c"
                              strokeWidth={5}
                              opacity={0.35}
                            />
                            <circle
                              cx={28}
                              cy={28}
                              r={radius}
                              fill="none"
                              stroke="#3498db"
                              strokeWidth={5}
                              strokeDasharray={`${winArc} ${circ}`}
                              strokeLinecap="round"
                              transform="rotate(-90 22 22)"
                              opacity={total > 0 ? 1 : 0.2}
                            />
                            <text
                              x={28}
                              y={32}
                              textAnchor="middle"
                              fontSize={10}
                              fontWeight={700}
                              fill={wr >= 50 ? "#3498db" : "#e74c3c"}
                              fontFamily="Rajdhani, sans-serif"
                            >
                              {wr}%
                            </text>
                          </svg>

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: 12,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.06em",
                                marginBottom: 2,
                              }}
                            >
                              {label}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-muted)",
                              }}
                            >
                              <span
                                style={{ color: "#3498db", fontWeight: 600 }}
                              >
                                {wins}W
                              </span>
                              {" · "}
                              <span
                                style={{ color: "#e74c3c", fontWeight: 600 }}
                              >
                                {losses}L
                              </span>
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 3,
                              flexShrink: 0,
                            }}
                          >
                            <img
                              src={tierIconUrl}
                              alt={tier}
                              width={40}
                              height={40}
                              style={{ objectFit: "contain" }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display =
                                  "none";
                              }}
                            />
                            <span
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: TIER_COLOR[tier] ?? "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.05em",
                                textAlign: "center",
                              }}
                            >
                              {tier === "UNRANKED"
                                ? "Unranked"
                                : `${tier} ${q?.division ?? ""}`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <>
                  <div
                    style={{
                      width: 1,
                      background: "var(--blue-border)",
                      alignSelf: "stretch",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: "1 1 0", minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                        marginBottom: 10,
                      }}
                    >
                      Top Champions
                    </div>
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: 3,
                      }}
                    >
                      {topMastery.length === 0 ? (
                        <div
                          style={{
                            fontSize: 12,
                            color: "var(--text-muted)",
                            fontStyle: "italic",
                          }}
                        >
                          No mastery data available
                        </div>
                      ) : (
                        topMastery.map((m, i) => {
                          const champ = championsRef.current.find(
                            (c) => c.id === m.championId,
                          );
                          const pts =
                            m.championPoints >= 1000
                              ? `${(m.championPoints / 1000).toFixed(0)}k`
                              : String(m.championPoints);
                          return (
                            <div
                              key={m.championId}
                              className="panel mastery-panel"
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 8,
                                padding: "7px 10px",
                                background: "rgba(255,255,255,0.02)",
                                border: "1px solid var(--blue-border)",
                                borderRadius: 3,
                              }}
                            >
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "var(--text-muted)",
                                  width: 14,
                                  flexShrink: 0,
                                }}
                              >
                                #{i + 1}
                              </span>
                              <img
                                src={`https://ddragon.leagueoflegends.com/cdn/14.24.1/img/champion/${m.championAlias ?? champ?.alias ?? m.championId}.png`}
                                alt={champ?.name}
                                width={24}
                                height={24}
                                style={{ borderRadius: 2, flexShrink: 0 }}
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display =
                                    "none";
                                }}
                              />
                              <span
                                style={{
                                  fontSize: 12,
                                  color: "var(--text-primary)",
                                  fontWeight: 600,
                                  flex: 1,
                                }}
                              >
                                {m.championName ?? `Champion ${m.championId}`}
                              </span>
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "var(--text-muted)",
                                }}
                              >
                                Lvl {m.championLevel}
                              </span>
                              <span
                                style={{
                                  fontSize: 14,
                                  color: "var(--gold)",
                                  marginLeft: 4,
                                }}
                              >
                                {pts}
                              </span>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </>
              </div>
            </div>
          )}

          <div
            className="panel"
            style={{
              padding: "22px 20px",
              marginBottom: 16,
            }}
          >
            <div
              style={{
                fontSize: 14,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                marginBottom: 12,
              }}
            >
              Friends Online ({onlineFriends.length})
            </div>

            {onlineFriends.length > 0 ? (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {onlineFriends.map((friend) => (
                  <FriendCard
                    key={friend.name}
                    friend={friend}
                    lobbyId={lobbyId}
                    onInvite={handleInviteFriend}
                  />
                ))}
              </div>
            ) : (
              <div style={{ color: "var(--text-muted)", fontSize: 13 }}>
                No friends online
              </div>
            )}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 16,
              marginBottom: 16,
            }}
          >
            <div className="panel" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  color: "var(--gold)",
                  marginBottom: 16,
                  letterSpacing: "0.1em",
                }}
              >
                Queue Setup
              </h3>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Queue Type
              </label>
              <div className="select-wrapper">
                <select
                  value={selectedQueue}
                  onChange={(e) => {
                    const newId = Number(e.target.value);
                    if (phase === "Lobby" && lobbyId) {
                      handleChangeQueue(newId);
                    } else {
                      setSelectedQueue(newId);
                    }
                  }}
                >
                  <optgroup label="Available">
                    {availableQueues.map((q) => (
                      <option key={q.id} value={q.id}>
                        {q.name}
                      </option>
                    ))}
                  </optgroup>
                  {unavailableQueues.length > 0 && (
                    <optgroup label="Unavailable">
                      {unavailableQueues.map((q) => (
                        <option key={q.id} value={q.id} disabled>
                          {q.name}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </div>
              {lobbyMembers.length > 0 && (
                <div style={{ marginTop: 10 }}>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    Lobby ({lobbyMembers.length})
                  </div>
                  {lobbyMembers.map((name, i) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        padding: "4px 0",
                        fontSize: 12,
                        color: "var(--text-primary)",
                        borderBottom: "1px solid rgba(255,255,255,0.04)",
                      }}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: i === 0 ? "var(--gold)" : "#2ecc71",
                          flexShrink: 0,
                        }}
                      />
                      {name}
                      {i === 0 && (
                        <span
                          style={{
                            fontSize: 10,
                            color: "var(--gold-dark)",
                            marginLeft: 4,
                          }}
                        >
                          (you)
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: 8,
                  flexWrap: "wrap",
                  marginTop: 15,
                }}
              >
                {phase === "None" && (
                  <button
                    className="btn-gold btn-icon"
                    onClick={handleCreateLobby}
                    disabled={!connected || loading.lobby}
                    style={{ flex: 1 }}
                  >
                    {loading.lobby ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                        >
                          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="9" cy="7" r="4" />
                          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                        </svg>
                        Create Lobby
                      </>
                    )}
                  </button>
                )}
                {(phase === "Lobby" || phase === "Matchmaking") && (
                  <button
                    className="btn-leave btn-icon"
                    onClick={handleLeaveLobby}
                    disabled={loading.leave}
                    style={{ flex: 1 }}
                  >
                    {loading.leave ? (
                      <span className="spinner" />
                    ) : (
                      <>
                        <LogOut size={13} />
                        Leave Lobby
                      </>
                    )}
                  </button>
                )}
              </div>
              {(phase === "Lobby" || phase === "Matchmaking") && (
                <>
                  <div className="divider" />
                  {phase === "Matchmaking" ? (
                    <button
                      className="btn-danger btn-icon"
                      onClick={handleStopQueue}
                      disabled={!connected || loading.stopqueue}
                      style={{ width: "100%", maxWidth: "none" }}
                    >
                      {loading.stopqueue ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                          </svg>
                          Leave Queue
                        </>
                      )}
                    </button>
                  ) : (
                    <button
                      className="btn-blue btn-icon"
                      onClick={handleStartQueue}
                      disabled={!connected || loading.queue}
                      style={{ width: "100%", maxWidth: "none" }}
                    >
                      {loading.queue ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <svg
                            width="13"
                            height="13"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                          >
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          Start Queue
                        </>
                      )}
                    </button>
                  )}
                </>
              )}
            </div>

            <div className="panel" style={{ padding: 20 }}>
              <h3
                style={{
                  fontSize: 14,
                  color: "var(--gold)",
                  marginBottom: 16,
                  letterSpacing: "0.1em",
                }}
              >
                Auto-Accept Match
              </h3>
              <div
                style={{
                  fontSize: 14,
                  color: "var(--text-muted)",
                  marginTop: 12,
                  paddingBottom: 12,
                }}
              >
                Automatically accepts the match when a ready check appears, so
                you never miss a match.
              </div>
              <div
                className={`auto-accept-select ${autoAccept ? "enabled" : "disabled"}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 16px",
                  background: autoAccept
                    ? "rgba(39,174,96,0.08)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${autoAccept ? "rgba(39,174,96,0.3)" : "var(--blue-border)"}`,
                  borderRadius: 3,
                  marginBottom: 16,
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onClick={() =>
                  setAutoAccept((p) => {
                    addLog(
                      !p ? "Auto-accept ENABLED" : "Auto-accept DISABLED",
                      !p ? "success" : "warn",
                    );
                    return !p;
                  })
                }
              >
                <span
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                  }}
                >
                  Auto-Accept
                </span>
                <div
                  className="on-off-container"
                  style={{
                    width: 44,
                    height: 22,
                    borderRadius: 11,
                    background: autoAccept
                      ? "var(--green)"
                      : "rgba(255,255,255,0.1)",
                    border: "1px solid rgba(255,255,255,0.15)",
                    position: "relative",
                    transition: "all 0.2s",
                  }}
                >
                  <div
                    className="on-off-circle"
                    style={{
                      position: "absolute",
                      top: 3,
                      left: autoAccept ? 23 : 3,
                      width: 14,
                      height: 14,
                      borderRadius: "50%",
                      background: "white",
                      transition: "left 0.2s",
                    }}
                  />
                </div>
              </div>
              <label
                style={{
                  display: "block",
                  fontSize: 12,
                  color: "var(--text-muted)",
                  marginBottom: 6,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Accept Delay: {autoAcceptDelay}s
              </label>
              <input
                type="range"
                min={0}
                max={10}
                value={autoAcceptDelay}
                onChange={(e) => setAutoAcceptDelay(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "var(--gold)",
                  marginBottom: 16,
                }}
              />
              {readyCheck && (
                <>
                  <div className="divider" />
                  <div
                    style={{
                      padding: "10px 14px",
                      background: "rgba(231,76,60,0.1)",
                      border: "1px solid rgba(231,76,60,0.3)",
                      borderRadius: 3,
                      marginBottom: 12,
                      animation: "pulse-glow 1.5s ease-in-out infinite",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 13,
                        fontWeight: 600,
                        color: "#e74c3c",
                        marginBottom: 4,
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      <Swords size={13} />
                      Match Found!
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Timer: {Math.round(readyCheck.timer)}s · Response:{" "}
                      {readyCheck.playerResponse}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button
                      className="btn-gold btn-icon"
                      onClick={handleAcceptNow}
                      disabled={loading.accept}
                      style={{ flex: 1 }}
                    >
                      {loading.accept ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <Check size={14} strokeWidth={2.5} />
                          Accept
                        </>
                      )}
                    </button>
                    <button
                      className="btn-danger btn-icon"
                      onClick={handleDecline}
                      disabled={loading.decline}
                    >
                      {loading.decline ? (
                        <span className="spinner" />
                      ) : (
                        <>
                          <X size={14} strokeWidth={2.5} />
                          Decline
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
              {autoAccept && !readyCheck && (
                <div
                  style={{
                    fontSize: 12,
                    color: "var(--text-muted)",
                    textAlign: "center",
                    padding: "8px 0",
                  }}
                >
                  <span className="spinner" style={{ marginRight: 8 }} />
                  Watching for match popup…
                </div>
              )}
            </div>
          </div>

          {(showBanPrefs || showPickPrefs) && (
            <>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    showBanPrefs && showPickPrefs ? "1fr 1fr" : "1fr",
                  gap: 16,
                  marginBottom: 16,
                }}
              >
                {showBanPrefs && (
                  <div className="panel" style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          color: "var(--gold)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Ban Preferences
                      </h3>
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        In Order
                      </span>
                    </div>
                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background:
                                banPicks[i] !== null
                                  ? "rgba(192,57,43,0.3)"
                                  : "rgba(255,255,255,0.05)",
                              border: `1px solid ${banPicks[i] !== null ? "rgba(192,57,43,0.5)" : "var(--blue-border)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              color:
                                banPicks[i] !== null
                                  ? "#e74c3c"
                                  : "var(--text-muted)",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {i === 0
                              ? "First Ban"
                              : i === 1
                                ? "Second Ban"
                                : "Third Ban"}
                          </span>
                        </div>
                        <ChampionSearch
                          value={banPicks[i]}
                          onChange={(id, name) => {
                            setBanPicks((p) => {
                              const n = [...p];
                              n[i] = id;
                              return n;
                            });
                            setBanNames((p) => {
                              const n = [...p];
                              n[i] = name;
                              return n;
                            });
                          }}
                          placeholder={`Ban ${i + 1} — type champion name…`}
                          champions={champions}
                          excludeIds={allBanIds.filter(
                            (id, idx) => idx !== i && id !== -1,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                )}
                {showPickPrefs && (
                  <div className="panel" style={{ padding: 20 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        marginBottom: 16,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: 14,
                          color: "var(--gold)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Pick Preferences
                      </h3>
                      <span
                        style={{
                          fontSize: 14,
                          color: "var(--text-muted)",
                          textTransform: "uppercase",
                          letterSpacing: "0.08em",
                        }}
                      >
                        In Order
                      </span>
                    </div>

                    {[0, 1, 2].map((i) => (
                      <div key={i} style={{ marginBottom: 8 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            marginBottom: 8,
                          }}
                        >
                          <span
                            style={{
                              width: 20,
                              height: 20,
                              borderRadius: "50%",
                              background:
                                champPicks[i] !== null
                                  ? "rgba(39,174,96,0.2)"
                                  : "rgba(255,255,255,0.05)",
                              border: `1px solid ${champPicks[i] !== null ? "rgba(39,174,96,0.5)" : "var(--blue-border)"}`,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: 11,
                              color:
                                champPicks[i] !== null
                                  ? "#2ecc71"
                                  : "var(--text-muted)",
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            {i + 1}
                          </span>
                          <span
                            style={{
                              fontSize: 14,
                              color: "var(--text-muted)",
                              textTransform: "uppercase",
                              letterSpacing: "0.06em",
                            }}
                          >
                            {i === 0
                              ? "Main Pick"
                              : i === 1
                                ? "Second Pick"
                                : "Third Pick"}
                          </span>
                        </div>
                        <ChampionSearch
                          value={champPicks[i]}
                          onChange={(id, name) => {
                            setChampPicks((p) => {
                              const n = [...p];
                              n[i] = id;
                              return n;
                            });
                            setChampNames((p) => {
                              const n = [...p];
                              n[i] = name;
                              return n;
                            });
                          }}
                          placeholder={`Pick ${i + 1} — type champion name…`}
                          champions={champions}
                          excludeIds={allPickIds.filter(
                            (id, idx) => idx !== i && id !== -1,
                          )}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {showLanePrefs && (
                <div
                  className="panel"
                  style={{ padding: 20, marginBottom: 16 }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 16,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: 14,
                        color: "var(--gold)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      Lane Preferences
                    </h3>
                    <span
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      Primary · Secondary
                    </span>
                  </div>
                  <div
                    style={{
                      display: "flex",
                      gap: 12,
                      flexWrap: "wrap",
                      justifyContent: "center",
                      marginTop: 22,
                    }}
                  >
                    {LANES.map((lane) => {
                      const isPrimary = lane1 === lane,
                        isSecondary = lane2 === lane;
                      return (
                        <button
                          key={lane}
                          className={`btn-clear ${isSecondary ? "btn-secondary" : ""}`}
                          onClick={() => {
                            if (isPrimary) {
                              setLane1(null);
                              setLane2(null);
                            } else if (isSecondary) {
                              setLane2(null);
                            } else if (!lane1) {
                              setLane1(lane);
                            } else if (
                              !lane2 &&
                              lane !== lane1 &&
                              lane1 !== "Fill"
                            ) {
                              setLane2(lane);
                            }
                          }}
                          style={{
                            background: isPrimary
                              ? "linear-gradient(180deg,#c89b3c 0%,#785a28 100%)"
                              : isSecondary
                                ? "rgba(10,200,185,0.15)"
                                : "rgba(255,255,255,0.04)",
                            border: isPrimary
                              ? "1px solid var(--gold)"
                              : isSecondary
                                ? "1px solid rgba(10,200,185,0.5)"
                                : "1px solid var(--blue-border)",
                            borderRadius: 3,
                            padding: "10px 18px",
                            color: isPrimary
                              ? "var(--blue-dark)"
                              : isSecondary
                                ? "var(--blue-glow)"
                                : "var(--text-muted)",
                            fontSize: 13,
                            fontWeight: 600,
                            letterSpacing: "0.08em",
                            textTransform: "uppercase",
                            cursor: "pointer",
                            transition: "all 0.2s",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            maxWidth: 120,
                            width: "100%",
                            gap: 6,
                          }}
                        >
                          {lane}
                          {isPrimary && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "rgba(0,0,0,0.25)",
                                borderRadius: 2,
                                padding: "1px 5px",
                              }}
                            >
                              1st
                            </span>
                          )}
                          {isSecondary && (
                            <span
                              style={{
                                fontSize: 10,
                                background: "rgba(10,200,185,0.2)",
                                borderRadius: 2,
                                padding: "1px 5px",
                              }}
                            >
                              2nd
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {(lane1 || lane2) && (
                    <div
                      style={{
                        marginTop: 24,
                        fontSize: 12,
                        color: "var(--text-muted)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      {lane1 && (
                        <span
                          style={{
                            color: "var(--gold)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Primary: <strong>{lane1}</strong>
                        </span>
                      )}
                      {lane2 && (
                        <span
                          style={{
                            color: "var(--blue-glow)",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          Secondary: <strong>{lane2}</strong>
                        </span>
                      )}
                      <button
                        className="btn-clear"
                        onClick={() => {
                          setLane1(null);
                          setLane2(null);
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  )}
                  <p
                    style={{
                      fontSize: 14,
                      color: "var(--text-muted)",
                      marginTop: 22,
                      lineHeight: 1.5,
                    }}
                  >
                    Select{" "}
                    <strong style={{ color: "var(--text-primary)" }}>
                      Fill
                    </strong>{" "}
                    to queue for any lane, leave both empty to skip, or pick
                    both Primary and Secondary.
                  </p>
                </div>
              )}

              <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: 12,
                  }}
                >
                  <div>
                    <div>
                      <h3
                        style={{
                          fontSize: 14,
                          color: "var(--gold)",
                          letterSpacing: "0.1em",
                        }}
                      >
                        Auto Champion Select
                      </h3>
                    </div>
                    <div
                      style={{
                        fontSize: 14,
                        color: "var(--text-muted)",
                        marginTop: 12,
                      }}
                    >
                      Automatically bans &amp; picks when it&apos;s your turn
                      using the preferences above.
                    </div>
                  </div>
                  <div
                    className={`auto-accept-select ${autoChampSelect ? "enabled" : "disabled"}`}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      cursor: "pointer",
                      padding: "8px 14px",
                      background: autoChampSelect
                        ? "rgba(39,174,96,0.08)"
                        : "rgba(255,255,255,0.03)",
                      border: `1px solid ${autoChampSelect ? "rgba(39,174,96,0.3)" : "var(--blue-border)"}`,
                      borderRadius: 3,
                      transition: "all 0.2s",
                    }}
                    onClick={() =>
                      setAutoChampSelect((p) => {
                        addLog(
                          !p
                            ? "Auto champ-select ENABLED"
                            : "Auto champ-select DISABLED",
                          !p ? "success" : "warn",
                        );
                        return !p;
                      })
                    }
                  >
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: autoChampSelect
                          ? "#2ecc71"
                          : "var(--text-muted)",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                      }}
                    >
                      {autoChampSelect ? "Enabled" : "Disabled"}
                    </span>
                    <div
                      className="on-off-container"
                      style={{
                        width: 44,
                        height: 22,
                        borderRadius: 11,
                        background: autoChampSelect
                          ? "var(--green)"
                          : "rgba(255,255,255,0.1)",
                        border: "1px solid rgba(255,255,255,0.15)",
                        position: "relative",
                        transition: "all 0.2s",
                      }}
                    >
                      <div
                        style={{
                          position: "absolute",
                          top: 3,
                          left: autoChampSelect ? 23 : 3,
                          width: 14,
                          height: 14,
                          borderRadius: "50%",
                          background: "white",
                          transition: "left 0.2s",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="panel" style={{ padding: 16, marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Current State:
              </span>
              {[
                { label: "In Lobby", active: phase === "Lobby" },
                { label: "In Queue", active: phase === "Matchmaking" },
                { label: "Ready Check", active: phase === "ReadyCheck" },
                { label: "Champ Select", active: phase === "ChampSelect" },
                { label: "In Game", active: phase === "InProgress" },
              ].map(({ label, active }) => (
                <span
                  key={label}
                  className="state"
                  style={{
                    fontSize: 12,
                    padding: "3px 10px",
                    borderRadius: 2,
                    border: `1px solid ${active ? phaseColor : "var(--blue-border)"}`,
                    color: active ? phaseColor : "var(--text-muted)",
                    background: active ? `${phaseColor}18` : "transparent",
                    fontWeight: active ? 600 : 400,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    transition: "all 0.2s",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>

          <div className="panel" style={{ padding: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 12,
              }}
            >
              <h3
                style={{
                  fontSize: 13,
                  color: "var(--gold)",
                  letterSpacing: "0.1em",
                }}
              >
                Activity Log
              </h3>
              <button
                className="btn-clear"
                onClick={() => {
                  logIdRef.current = 0;
                  setLogs([]);
                }}
              >
                Clear
              </button>
            </div>
            <div
              className="activity-log-scroll"
              style={{
                maxHeight: 180,
                overflowY: "auto",
                overflowX: "hidden",
                display: "flex",
                flexDirection: "column",
                gap: 0,
              }}
            >
              {logs.length === 0 && (
                <div
                  style={{
                    color: "var(--text-muted)",
                    fontSize: 12,
                    padding: "8px 0",
                    fontStyle: "italic",
                  }}
                >
                  {connectedRef.current
                    ? "Log cleared."
                    : "No activity yet. Connect to the League client to begin."}
                </div>
              )}
              {logs.map((l) => (
                <div key={l.id} className={`log-entry ${l.type}`}>
                  <span style={{ color: "var(--text-muted)", marginLeft: 8 }}>
                    {l.time} -
                  </span>
                  {l.message}
                </div>
              ))}
            </div>
          </div>

          <footer className="footer">
            <div className="footer-wrapper">
              <a
                href="https://github.com/BenoitTrem/lol-client-dashboard.git"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 .5C5.37.5 0 5.87 0 12.5c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.05c-3.34.73-4.04-1.42-4.04-1.42-.54-1.39-1.33-1.76-1.33-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.8 1.31 3.49 1 .11-.78.42-1.31.76-1.61-2.67-.31-5.47-1.34-5.47-5.96 0-1.32.47-2.39 1.24-3.23-.13-.31-.54-1.56.12-3.25 0 0 1.01-.32 3.3 1.23a11.4 11.4 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.69.25 2.94.12 3.25.77.84 1.24 1.91 1.24 3.23 0 4.63-2.8 5.64-5.48 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57C20.57 22.3 24 17.8 24 12.5 24 5.87 18.63.5 12 .5z" />
                </svg>
                GitHub Repository
              </a>

              <div className="footer-link-text">
                This project is open-source. You are free to use, modify, and
                build on top of it.
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

          {toast && (
            <div
              style={{
                position: "sticky",
                bottom: 50,
                left: 0,
                right: 0,
                marginTop: 16,
                background:
                  toast.type === "error"
                    ? "rgba(192,57,43,0.95)"
                    : "rgba(180,130,20,0.95)",
                border: `1px solid ${toast.type === "error" ? "rgba(231,76,60,0.6)" : "rgba(200,155,60,0.6)"}`,
                borderRadius: 4,
                padding: "16px 24px",
                fontSize: 17,
                fontWeight: 600,
                color: "#fff",
                letterSpacing: "0.05em",
                display: "flex",
                alignItems: "center",
                gap: 10,
                boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
                zIndex: 999,
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {toast.type === "error" ? (
                <AlertCircle size={22} strokeWidth={2} />
              ) : (
                <AlertTriangle size={22} strokeWidth={2} />
              )}
              {toast.message}
              <button
                onClick={() => setToast(null)}
                style={{
                  background: "none",
                  border: "none",
                  color: "rgba(255,255,255,0.7)",
                  cursor: "pointer",
                  marginLeft: "auto",
                  padding: 0,
                  display: "flex",
                  alignItems: "center",
                  textTransform: "none",
                  letterSpacing: 0,
                }}
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
