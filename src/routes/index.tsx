import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  DoorOpen,
  ChevronUp,
  Wifi,
  ShieldCheck,
  Settings as SettingsIcon,
  Loader2,
  Check,
  History,
  Building2,
  Languages,
  Trash2,
} from "lucide-react";
import { translations, type Lang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Smart Access — ლიფტი და სადარბაზო" },
      { name: "description", content: "ლიფტისა და სადარბაზოს კარის დისტანციური მართვა — ერთ შეხებაზე." },
      { name: "theme-color", content: "#1a2030" },
      { property: "og:title", content: "Smart Access" },
      { property: "og:description", content: "Open your elevator and lobby door with one tap." },
    ],
  }),
  component: Index,
});

type ActionState = "idle" | "loading" | "success" | "error";
type HistoryItem = { id: number; type: "elevator" | "door"; ts: number; floor?: number };

function Index() {
  const [lang, setLang] = useState<Lang>("ka");
  const [elevator, setElevator] = useState<ActionState>("idle");
  const [door, setDoor] = useState<ActionState>("idle");
  const [floor, setFloor] = useState(4);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const t = translations[lang];

  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (saved === "ka" || saved === "en") setLang(saved);
    if (typeof window !== "undefined") {
      try {
        const rawHistory = localStorage.getItem("history");
        if (rawHistory) {
          const parsed = JSON.parse(rawHistory);
          if (Array.isArray(parsed)) setHistory(parsed.slice(0, 8));
        }
      } catch {
        // ignore corrupted history
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem("lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("history", JSON.stringify(history));
    }
  }, [history]);

  const callElevator = async () => {
    if (elevator === "loading") return;
    setElevator("loading");
    await new Promise((r) => setTimeout(r, 1400));
    setElevator("success");
    setHistory((h) => [{ id: Date.now(), type: "elevator" as const, ts: Date.now(), floor }, ...h].slice(0, 8));
    setTimeout(() => setElevator("idle"), 2200);
  };

  const openDoor = async () => {
    if (door === "loading") return;
    setDoor("loading");
    await new Promise((r) => setTimeout(r, 1100));
    setDoor("success");
    setHistory((h) => [{ id: Date.now(), type: "door" as const, ts: Date.now() }, ...h].slice(0, 8));
    setTimeout(() => setDoor("idle"), 2600);
  };

  return (
    <div className="min-h-screen text-foreground">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 pb-10 pt-6 sm:max-w-lg">
        <Header lang={lang} setLang={setLang} t={t} />
        <BuildingCard t={t} />
        <FloorSelector floor={floor} setFloor={setFloor} label={t.floor} />

        <div className="mt-5 grid gap-4">
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

        <HistoryList items={history} lang={lang} t={t} />

        <footer className="mt-auto flex items-center justify-center gap-2 pt-8 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5" />
          <span>{t.secured}</span>
        </footer>
      </div>
    </div>
  );
}

function Header({ lang, setLang, t }: { lang: Lang; setLang: (l: Lang) => void; t: ReturnType<typeof getT> }) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-white/10"
          style={{ background: "var(--gradient-primary)", boxShadow: "var(--shadow-glow)" }}
        >
          <DoorOpen className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="min-w-0">
          <h1 className="truncate font-display text-lg font-bold tracking-tight">{t.appName}</h1>
          <p className="truncate text-xs text-muted-foreground">{t.tagline}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => setLang(lang === "ka" ? "en" : "ka")}
          className="flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-card/60 px-3 text-xs font-semibold backdrop-blur transition hover:border-primary/40 hover:text-primary"
          aria-label="Toggle language"
        >
          <Languages className="h-3.5 w-3.5" />
          {lang === "ka" ? "EN" : "ქარ"}
        </button>
        <button
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-card/60 backdrop-blur transition hover:text-primary"
          aria-label="Settings"
        >
          <SettingsIcon className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}

function getT(lang: Lang) {
  return translations[lang];
}

function BuildingCard({ t }: { t: ReturnType<typeof getT> }) {
  return (
    <div
      className="mt-6 rounded-3xl border border-white/10 bg-card/70 p-5 backdrop-blur"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div className="flex items-center justify-between">
        <div className="flex min-w-0 items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary">
            <Building2 className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{t.building}</p>
            <p className="truncate text-sm font-semibold">ვაჟა-ფშაველას 71 · {t.apartment} 24</p>
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
    </div>
  );
}

function FloorSelector({ floor, setFloor, label }: { floor: number; setFloor: (n: number) => void; label: string }) {
  const floors = useMemo(() => [-1, 1, 2, 3, 4, 5, 6, 7, 8, 9], []);
  return (
    <div className="mt-5">
      <p className="mb-2 px-1 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {floors.map((f) => {
          const active = f === floor;
          return (
            <button
              key={f}
              onClick={() => setFloor(f)}
              className={
                "grid h-11 min-w-[44px] shrink-0 place-items-center rounded-xl border text-sm font-semibold transition " +
                (active
                  ? "border-primary/60 bg-primary/15 text-primary shadow-[0_0_20px_-4px_var(--primary)]"
                  : "border-white/10 bg-card/60 text-muted-foreground hover:text-foreground")
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
    <div
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-card/70 p-5 backdrop-blur"
      style={{ boxShadow: "var(--shadow-soft)" }}
    >
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full opacity-40 blur-3xl transition"
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
          className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10"
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
          "group relative mt-5 flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl font-display text-base font-semibold transition active:scale-[0.98] " +
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
        {state === "loading" && <Loader2 className="h-4 w-4 animate-spin" />}
        {state === "success" && <Check className="h-4 w-4" />}
        <span>{label}</span>
      </button>
    </div>
  );
}

function HistoryList({
  items,
  lang,
  t,
}: {
  items: HistoryItem[];
  lang: Lang;
  t: ReturnType<typeof getT>;
}) {
  return (
    <section className="mt-7">
      <div className="mb-2 flex items-center gap-2 px-1">
        <History className="h-3.5 w-3.5 text-muted-foreground" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{t.history}</h3>
      </div>
      <div className="rounded-2xl border border-white/10 bg-card/50 backdrop-blur">
        {items.length === 0 ? (
          <p className="px-4 py-5 text-center text-xs text-muted-foreground">{t.noHistory}</p>
        ) : (
          <ul className="divide-y divide-white/5">
            {items.map((it) => {
              const Icon = it.type === "elevator" ? ChevronUp : DoorOpen;
              const title = it.type === "elevator" ? t.elevator : t.door;
              const time = new Date(it.ts).toLocaleTimeString(lang === "ka" ? "ka-GE" : "en-US", {
                hour: "2-digit",
                minute: "2-digit",
              });
              return (
                <li key={it.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {it.floor !== undefined ? `${t.floor} ${it.floor === -1 ? "P" : it.floor} · ` : ""}
                      {time}
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
