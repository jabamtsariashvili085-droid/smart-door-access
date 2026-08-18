import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DoorOpen,
  ChevronUp,
  Wifi,
  ShieldCheck,
  Loader2,
  Check,
  Building2,
  Languages,
  Trash2,
  Home,
  Clock,
  Settings as SettingsIcon,
  User,
  ChevronRight,
  Signal,
} from "lucide-react";
import { translations, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Access — ლიფტი და სადარბაზო" },
      {
        name: "description",
        content: "ლიფტისა და სადარბაზოს კარის დისტანციური მართვა — ერთ შეხებაზე.",
      },
      { name: "theme-color", content: "#1a2030" },
      { property: "og:title", content: "Smart Access" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:description", content: "Open your elevator and lobby door with one tap." },
    ],
  }),
  component: Index,
});

type ActionState = "idle" | "loading" | "success" | "error";
type HistoryItem = { id: number; type: "elevator" | "door"; ts: number; floor?: number };
type Tab = "home" | "activity" | "settings";
type Dict = (typeof translations)["en"];

function Index() {
  const [lang, setLang] = useState<Lang>("ka");
  const [tab, setTab] = useState<Tab>("home");
  const [elevator, setElevator] = useState<ActionState>("idle");
  const [door, setDoor] = useState<ActionState>("idle");
  const [floor, setFloor] = useState(4);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const t = translations[lang];

  useEffect(() => {
    const saved = localStorage.getItem("lang") as Lang | null;
    if (saved === "ka" || saved === "en") setLang(saved);
    try {
      const rawHistory = localStorage.getItem("history");
      if (rawHistory) {
        const parsed = JSON.parse(rawHistory);
        if (Array.isArray(parsed)) setHistory(parsed.slice(0, 8));
      }
    } catch {
      // ignore corrupted history
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    localStorage.setItem("history", JSON.stringify(history));
  }, [history]);

  const buzz = (ms = 12) => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate(ms);
  };

  const callElevator = async () => {
    if (elevator === "loading") return;
    buzz();
    setElevator("loading");
    await new Promise((r) => setTimeout(r, 1400));
    setElevator("success");
    buzz(20);
    setHistory((h) =>
      [{ id: Date.now(), type: "elevator" as const, ts: Date.now(), floor }, ...h].slice(0, 8),
    );
    setTimeout(() => setElevator("idle"), 2200);
  };

  const openDoor = async () => {
    if (door === "loading") return;
    buzz();
    setDoor("loading");
    await new Promise((r) => setTimeout(r, 1100));
    setDoor("success");
    buzz(20);
    setHistory((h) => [{ id: Date.now(), type: "door" as const, ts: Date.now() }, ...h].slice(0, 8));
    setTimeout(() => setDoor("idle"), 2600);
  };

  return (
    <div className="min-h-[100dvh] text-foreground sm:grid sm:min-h-[100dvh] sm:place-items-center sm:py-8">
      {/* Device shell — plain full-bleed on phones, framed handset on desktop */}
      <div
        className="relative mx-auto flex h-[100dvh] w-full max-w-[430px] flex-col overflow-hidden bg-transparent sm:h-[860px] sm:max-h-[calc(100dvh-4rem)] sm:rounded-[2.75rem] sm:border sm:border-white/10 sm:bg-background/40 sm:backdrop-blur-xl"
        style={{ boxShadow: "var(--shadow-device)" }}
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 hidden h-8 justify-center sm:flex">
          <div className="mt-2 h-6 w-32 rounded-full bg-background/80" />
        </div>

        <TopBar lang={lang} setLang={setLang} t={t} tab={tab} />

        <main className="no-scrollbar flex-1 overflow-y-auto px-5 pb-32 pt-2">
          {tab === "home" && (
            <div key="home" className="animate-rise space-y-5">
              <BuildingCard t={t} />
              <FloorSelector floor={floor} setFloor={setFloor} label={t.floor} />
              <div className="grid gap-4">
                <ActionCard
                  kind="elevator"
                  title={t.elevator}
                  subtitle={t.elevatorSub}
                  state={elevator}
                  onPress={callElevator}
                  labels={{ idle: t.open, loading: t.calling, success: t.called, error: t.failed }}
                />
                <ActionCard
                  kind="door"
                  title={t.door}
                  subtitle={t.doorSub}
                  state={door}
                  onPress={openDoor}
                  labels={{ idle: t.open, loading: t.opening, success: t.opened, error: t.failed }}
                />
              </div>
              <p className="flex items-center justify-center gap-2 pt-1 text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3.5 w-3.5" />
                {t.secured}
              </p>
            </div>
          )}

          {tab === "activity" && (
            <div key="activity" className="animate-rise">
              <HistoryList
                items={history}
                lang={lang}
                t={t}
                onClear={() => {
                  if (!window.confirm(t.clearConfirm)) return;
                  setHistory([]);
                }}
              />
            </div>
          )}

          {tab === "settings" && (
            <div key="settings" className="animate-rise">
              <SettingsPanel lang={lang} setLang={setLang} t={t} />
            </div>
          )}
        </main>

        <TabBar tab={tab} setTab={setTab} t={t} />
      </div>
    </div>
  );
}

function TopBar({
  lang,
  setLang,
  t,
  tab,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
  tab: Tab;
}) {
  const title = tab === "home" ? t.appName : tab === "activity" ? t.history : t.settings;
  return (
    <header className="sticky top-0 z-10 bg-background/60 px-5 pb-3 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-xl">
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/15"
            style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
          >
            <DoorOpen className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate font-display text-lg font-bold tracking-tight">{title}</h1>
            <p className="truncate text-[11px] text-muted-foreground">{t.tagline}</p>
          </div>
        </div>
        <button
          onClick={() => setLang(lang === "ka" ? "en" : "ka")}
          className="flex h-10 shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-card/60 px-3.5 text-xs font-semibold backdrop-blur transition active:scale-95 hover:border-primary/40 hover:text-primary"
          aria-label="Toggle language"
        >
          <Languages className="h-3.5 w-3.5" />
          {lang === "ka" ? "EN" : "ქარ"}
        </button>
      </div>
    </header>
  );
}

function BuildingCard({ t }: { t: Dict }) {
  return (
    <div className="surface relative overflow-hidden rounded-[1.75rem] p-5">
      <div
        className="pointer-events-none absolute -left-10 -top-14 h-40 w-40 rounded-full opacity-30 blur-3xl"
        style={{ background: "radial-gradient(circle, var(--primary), transparent 65%)" }}
      />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-secondary/80">
            <Building2 className="h-4.5 w-4.5 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
              {t.building}
            </p>
            <p className="truncate text-sm font-semibold">
              ვაჟა-ფშაველას 71 · {t.apartment} 24
            </p>
          </div>
        </div>
        <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-2.5 py-1 text-[11px] font-semibold text-success">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success" />
          </span>
          <Wifi className="h-3 w-3" />
          {t.online}
        </span>
      </div>
      <div className="relative mt-4 flex items-center gap-2 border-t border-white/5 pt-3 text-[11px] text-muted-foreground">
        <Signal className="h-3.5 w-3.5 text-primary" />
        {t.signalStrong}
      </div>
    </div>
  );
}

function FloorSelector({
  floor,
  setFloor,
  label,
}: {
  floor: number;
  setFloor: (n: number) => void;
  label: string;
}) {
  const floors = useMemo(() => [-1, 1, 2, 3, 4, 5, 6, 7, 8, 9], []);
  return (
    <div>
      <p className="mb-2 px-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </p>
      <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {floors.map((f) => {
          const active = f === floor;
          return (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={
                "grid h-12 min-w-[48px] shrink-0 place-items-center rounded-2xl border text-sm font-bold transition duration-200 active:scale-95 " +
                (active
                  ? "scale-105 border-primary/60 bg-primary/15 text-primary shadow-[0_0_24px_-6px_var(--primary)]"
                  : "border-white/10 bg-card/50 text-muted-foreground hover:text-foreground")
              }
            >
              {f === -1 ? "P" : f}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ActionCard({
  kind,
  title,
  subtitle,
  state,
  onPress,
  labels,
}: {
  kind: "elevator" | "door";
  title: string;
  subtitle: string;
  state: ActionState;
  onPress: () => void;
  labels: { idle: string; loading: string; success: string; error: string };
}) {
  const label = state === "loading" ? labels.loading : state === "success" ? labels.success : labels.idle;
  const Icon = kind === "elevator" ? ChevronUp : DoorOpen;

  return (
    <div className="surface relative overflow-hidden rounded-[1.75rem] p-5">
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl animate-soft-pulse"
        style={{
          background:
            kind === "elevator"
              ? "radial-gradient(circle, var(--primary), transparent 60%)"
              : "radial-gradient(circle, var(--accent), transparent 60%)",
        }}
      />
      <div className="relative flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-bold tracking-tight">{title}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
        </div>
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15"
          style={{
            background:
              kind === "elevator"
                ? "linear-gradient(135deg, var(--primary), var(--primary-glow))"
                : "linear-gradient(135deg, var(--accent), var(--primary-glow))",
          }}
        >
          <Icon className="h-5 w-5 text-primary-foreground" />
        </div>
      </div>

      <button
        onClick={onPress}
        disabled={state === "loading"}
        className={
          "group relative mt-5 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl font-display text-base font-semibold transition duration-200 active:scale-[0.97] " +
          (state === "success"
            ? "bg-success/15 text-success ring-1 ring-inset ring-success/40"
            : "text-primary-foreground")
        }
        style={
          state === "success"
            ? undefined
            : {
                background: "var(--gradient-primary)",
                boxShadow: state === "loading" ? undefined : "var(--shadow-glow)",
              }
        }
      >
        {state === "idle" && (
          <span className="pointer-events-none absolute inset-y-0 w-16 -skew-x-12 bg-white/20 blur-md animate-sheen" />
        )}
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "success" && <Check className="h-4 w-4" />}
        <span className="relative">{label}</span>
      </button>
    </div>
  );
}

function HistoryList({
  items,
  lang,
  t,
  onClear,
}: {
  items: HistoryItem[];
  lang: Lang;
  t: Dict;
  onClear: () => void;
}) {
  const [filter, setFilter] = useState<"all" | "elevator" | "door">("all");
  const filtered = items.filter((it) => filter === "all" || it.type === filter);
  const filters: { id: "all" | "elevator" | "door"; label: string }[] = [
    { id: "all", label: t.filterAll },
    { id: "elevator", label: t.filterElevator },
    { id: "door", label: t.filterDoor },
  ];
  const formatAbsolute = (ts: number) => {
    const d = new Date(ts);
    const locale = lang === "ka" ? "ka-GE" : "en-US";
    const date = d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" });
    const time = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });
    return `${date}, ${time}`;
  };
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        {items.length > 0 ? (
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {filters.map((f) => {
              const active = filter === f.id;
              return (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-[11px] font-semibold transition active:scale-95 " +
                    (active
                      ? "border-primary/60 bg-primary/15 text-primary"
                      : "border-white/10 bg-card/50 text-muted-foreground hover:text-foreground")
                  }
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        ) : (
          <span />
        )}
        {items.length > 0 && (
          <button
            onClick={onClear}
            className="flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-muted-foreground transition hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
            {t.clear}
          </button>
        )}
      </div>
      <div className="surface overflow-hidden rounded-[1.5rem]">
        {items.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">{t.noHistory}</p>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-10 text-center text-xs text-muted-foreground">{t.noResults}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {filtered.map((it) => {
              const Icon = it.type === "elevator" ? ChevronUp : DoorOpen;
              const title = it.type === "elevator" ? t.historyElevatorTitle : t.historyDoorTitle;
              return (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/80">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {it.floor !== undefined
                        ? `${t.floor} ${it.floor === -1 ? "P" : it.floor} · `
                        : ""}
                      {formatAbsolute(it.ts)}
                    </p>
                  </div>
                  <Check className="h-4 w-4 text-success" />
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}

function SettingsPanel({
  lang,
  setLang,
  t,
}: {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Dict;
}) {
  return (
    <div className="space-y-4">
      <div className="surface flex items-center gap-3 rounded-[1.75rem] p-5">
        <div
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/15"
          style={{ background: "var(--gradient-primary)" }}
        >
          <User className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{t.resident}</p>
          <p className="truncate text-[11px] text-muted-foreground">
            ვაჟა-ფშაველას 71 · {t.apartment} 24
          </p>
        </div>
      </div>

      <div className="surface overflow-hidden rounded-[1.5rem]">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <Languages className="h-4 w-4 shrink-0 text-primary" />
            <span className="truncate text-sm font-medium">{t.language}</span>
          </div>
          <div className="flex shrink-0 rounded-full border border-white/10 bg-background/40 p-0.5">
            {(["ka", "en"] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={
                  "rounded-full px-3 py-1 text-[11px] font-semibold transition " +
                  (lang === l ? "bg-primary/20 text-primary" : "text-muted-foreground")
                }
              >
                {l === "ka" ? "ქართული" : "English"}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between border-t border-white/5 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <ShieldCheck className="h-4 w-4 shrink-0 text-success" />
            <span className="truncate text-sm font-medium">{t.secured}</span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </div>
      </div>
      <p className="pt-2 text-center text-[11px] text-muted-foreground">Smart Access · v1.0</p>
    </div>
  );
}

function TabBar({ tab, setTab, t }: { tab: Tab; setTab: (v: Tab) => void; t: Dict }) {
  const tabs: { id: Tab; label: string; icon: typeof Home }[] = [
    { id: "home", label: t.tabHome, icon: Home },
    { id: "activity", label: t.tabActivity, icon: Clock },
    { id: "settings", label: t.tabSettings, icon: SettingsIcon },
  ];
  return (
    <nav className="absolute inset-x-0 bottom-0 z-20 px-5 pb-[max(0.9rem,env(safe-area-inset-bottom))]">
      <div className="surface flex items-center justify-around rounded-[1.5rem] p-1.5">
        {tabs.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={
                "relative flex flex-1 flex-col items-center gap-1 rounded-[1.15rem] py-2.5 text-[10px] font-semibold transition duration-200 active:scale-95 " +
                (active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground")
              }
              aria-current={active ? "page" : undefined}
            >
              <Icon className={"h-[18px] w-[18px] transition " + (active ? "scale-110" : "")} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
