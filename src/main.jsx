import React, { useState, useEffect, useRef } from "react";
import { createRoot } from "react-dom/client";
import {
  Compass,
  Gamepad2,
  LayoutGrid,
  MessageCircle,
  Trophy,
  ShoppingBag,
  Search,
  ChevronRight,
  ArrowUpRight,
  ArrowRight,
  Plus,
  Coins,
  Bell,
  X,
  Play,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
  Settings,
  Check,
  CheckCircle2,
  Star,
  Hash,
  Send,
  Trash2,
  Menu,
  Heart,
  Flame,
  Clock3,
  Volume2,
  Flag,
  Users,
  Activity,
  Terminal,
  Edit3,
  Sparkles,
  Mail,
  LockKeyhole,
  ExternalLink,
  Gift,
  Sun,
  ChevronDown,
} from "lucide-react";
import { GAME_CATALOG, GamePlayer } from "./games";
import { APP_CATALOG, AppPlayer } from "./apps";
import "./styles.css";
async function api(path, method = "GET", body) {
  const res = await fetch("/api" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Please try again.");
  return data;
}
function PixelLogo() {
  return (
    <span className="pixel-logo">
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  );
}
function Verified() {
  return (
    <ShieldCheck
      size={15}
      className="verified"
      aria-label="Verified administrator"
    />
  );
}
function GameArt({ game, mini = false }) {
  return (
    <div
      className={
        "game-art illustration-" +
        game.icon +
        " " +
        game.color +
        (mini ? " mini-art" : "")
      }
      aria-hidden="true"
    >
      {game.icon === "wordle" ? (
        <div className="art-word">
          <div>
            {["P", "L", "A", "Y"].map((l, i) => (
              <span
                key={l}
                className={i === 1 ? "yellow" : i === 3 ? "gray" : ""}
              >
                {l}
              </span>
            ))}
          </div>
          <div>
            {["D", "A", "I", "L", "Y"].map((l, i) => (
              <span key={i} className={i === 0 || i === 4 ? "gray" : "green"}>
                {l}
              </span>
            ))}
          </div>
        </div>
      ) : game.icon === "tetris" ? (
        <div className="art-tetris">
          {Array.from({ length: 35 }, (_, i) => (
            <span
              key={i}
              className={
                "block block-" +
                ({
                  2: "purple",
                  3: "purple",
                  4: "purple",
                  9: "purple",
                  17: "green",
                  18: "green",
                  23: "green",
                  24: "green",
                  28: "orange",
                  29: "orange",
                  30: "orange",
                  31: "pink",
                  32: "pink",
                  33: "blue",
                  34: "blue",
                }[i] || "empty")
              }
            />
          ))}
        </div>
      ) : game.icon === "snake" ? (
        <div className="art-snake">
          <div className="snake-path" />
          <span className="art-snake-head">••</span>
          <span className="art-food" />
        </div>
      ) : game.icon === "2048" ? (
        <div className="art-numbers">
          <span>2</span>
          <span>4</span>
          <span>8</span>
          <span>2048</span>
        </div>
      ) : game.icon === "memory" ? (
        <div className="art-pairs">
          <span>✦</span>
          <span>🍒</span>
          <span>🍒</span>
          <span>✦</span>
        </div>
      ) : game.icon === "ttt" ? (
        <div className="art-ttt">
          {["×", "", "○", "", "×", "", "○", "", "×"].map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      ) : game.icon === "connect" ? (
        <div className="art-connect">
          {Array.from({ length: 20 }, (_, i) => (
            <span
              key={i}
              className={
                i > 8 ? (i % 3 === 0 ? "filled-purple" : "filled-gold") : ""
              }
            />
          ))}
        </div>
      ) : game.icon === "pong" ? (
        <div className="art-pong">
          <i />
          <span />
          <i />
        </div>
      ) : game.icon === "breakout" ? (
        <div className="art-bricks">
          {Array.from({ length: 15 }, (_, i) => (
            <i key={i} />
          ))}
          <span />
        </div>
      ) : game.icon === "sudoku" ? (
        <div className="art-sudoku">
          {["1", "", "6", "", "9", "", "3", "", "7"].map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      ) : game.icon === "mine" ? (
        <div className="art-mine">
          {["1", "2", "", "", "⚑", "1", "", "2", "💣"].map((v, i) => (
            <span key={i}>{v}</span>
          ))}
        </div>
      ) : game.icon === "reaction" ? (
        <span className="art-large">ϟ</span>
      ) : (
        <span className="art-large">?</span>
      )}
    </div>
  );
}
function App() {
  const [boot, setBoot] = useState(null),
    [page, setPage] = useState("discover"),
    [modal, setModal] = useState(null),
    [auth, setAuth] = useState(null),
    [search, setSearch] = useState(""),
    [filter, setFilter] = useState("All games"),
    [toast, setToast] = useState(null),
    [sidebar, setSidebar] = useState(false),
    [accountMenu, setAccountMenu] = useState(false),
    [favorites, setFavorites] = useState(() => {
      try {
        return JSON.parse(localStorage.getItem("pixel-favorites")) || [];
      } catch {
        return [];
      }
    }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  const toastTimer = useRef();
  const user = boot?.user,
    settings = boot?.settings || {},
    games = GAME_CATALOG.map((g) => ({
      ...g,
      ...settings.gameOverrides?.[g.id],
    })).filter((g) => !settings.disabledGames?.includes(g.id)),
    items = boot?.items || [];
  const notify = (message, type = "success") => {
    setToast({ message, type });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4500);
  };
  async function refresh() {
    try {
      const next = await api("/bootstrap");
      setBoot((previous) =>
        JSON.stringify(previous) === JSON.stringify(next) ? previous : next,
      );
      setError("");
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 15000);
    return () => {
      clearInterval(interval);
      clearTimeout(toastTimer.current);
    };
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = user?.theme || "midnight";
  }, [user?.theme]);
  useEffect(() => {
    if (settings.siteName)
      document.title = settings.siteName + " — " + settings.heroTitle;
  }, [settings.siteName, settings.heroTitle]);
  useEffect(() => {
    localStorage.setItem("pixel-favorites", JSON.stringify(favorites));
  }, [favorites]);
  useEffect(() => {
    const f = (e) => {
      if (e.key === "Escape") {
        setModal(null);
        setAuth(null);
        setAccountMenu(false);
        setSidebar(false);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        document.getElementById("global-search")?.focus();
      }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
  useEffect(() => {
    document.body.style.overflow = modal || auth ? "hidden" : "";
    return () => (document.body.style.overflow = "");
  }, [modal, auth]);
  async function act(path, method, body, success) {
    try {
      const data = await api(path, method, body);
      if (
        data.user &&
        (!path.startsWith("/admin/") || data.user.id === user?.id)
      )
        setBoot((b) => ({ ...b, user: data.user }));
      if (data.settings || data.rooms) await refresh();
      if (success || data.message) notify(success || data.message);
      return data;
    } catch (e) {
      notify(e.message, "error");
      return null;
    }
  }
  function navigate(next) {
    setPage(next);
    setSearch("");
    setFilter("All games");
    setSidebar(false);
  }
  function openGame(game) {
    if (settings.maintenance && !user?.admin) {
      notify("The playground is taking a short maintenance break.", "error");
      return;
    }
    setModal({ type: "game", value: game });
  }
  function favorite(e, id) {
    e.stopPropagation();
    setFavorites((f) =>
      f.includes(id) ? f.filter((x) => x !== id) : [...f, id],
    );
  }
  const visible = games.filter(
    (g) =>
      (filter === "All games" ||
        (filter === "Favorites" && favorites.includes(g.id)) ||
        g.category === filter) &&
      (g.name + " " + g.description)
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const menu = [
    ["discover", "Discover", Compass],
    ["games", "All games", Gamepad2],
    ["apps", "Apps & tools", LayoutGrid],
    ["community", "Community", MessageCircle],
    ["leaderboard", "Leaderboard", Trophy],
    ["shop", "Pixel shop", ShoppingBag],
  ];
  if (loading)
    return (
      <div className="loading-screen">
        <PixelLogo />
        <h2>Loading your playground…</h2>
      </div>
    );
  if (!boot)
    return (
      <div className="loading-screen">
        <h2>Couldn’t reach the playground</h2>
        <p>{error}</p>
        <button className="btn primary" onClick={refresh}>
          Try again
        </button>
      </div>
    );
  return (
    <div className="app-shell">
      {sidebar && (
        <div className="sidebar-scrim" onClick={() => setSidebar(false)} />
      )}
      <aside className={"sidebar " + (sidebar ? "open" : "")}>
        <a
          href="/"
          className="brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("discover");
          }}
        >
          <PixelLogo />
          <span>
            {settings.siteName === "Pixel Playground"
              ? "pixel"
              : settings.siteName?.split(" ")[0]}
            <span className="brand-light">
              {settings.siteName === "Pixel Playground"
                ? "playground"
                : settings.siteName?.split(" ").slice(1).join(" ")}
            </span>
          </span>
        </a>
        <div className="nav-label">YOUR PLAYGROUND</div>
        <nav>
          {menu.map(([id, label, Icon]) => (
            <button
              key={id}
              aria-label={label}
              className={page === id ? "active" : ""}
              onClick={() => navigate(id)}
            >
              <Icon size={19} />
              <span>{label}</span>
              {id === "games" && <small>{games.length}</small>}
              {id === "community" && <i className="nav-dot" />}
            </button>
          ))}
        </nav>
        <div className="sidebar-divider" />
        <div className="nav-label">MADE FOR YOU</div>
        <nav>
          <button
            onClick={() => {
              navigate("games");
              setFilter("Favorites");
            }}
            className={
              page === "games" && filter === "Favorites" ? "active" : ""
            }
          >
            <Heart size={19} />
            <span>Your favorites</span>
            <small>{favorites.length}</small>
          </button>
          <button
            onClick={() =>
              user ? setModal({ type: "profile" }) : setAuth("register")
            }
          >
            <User size={19} />
            <span>Your profile</span>
          </button>
          {user?.admin && (
            <button
              className={page === "admin" ? "active" : ""}
              onClick={() => navigate("admin")}
            >
              <ShieldCheck size={19} />
              <span>Admin panel</span>
            </button>
          )}
        </nav>
        <div className="sidebar-bottom">
          <div className="daily-reward">
            <div className="reward-coin">✦</div>
            <h3>A little daily bonus</h3>
            <p>Your next adventure is on us.</p>
            <button
              onClick={() =>
                user ? act("/daily-reward", "POST", {}) : setAuth("register")
              }
            >
              Collect 100 coins <ArrowRight size={14} />
            </button>
          </div>
          <div className="sidebar-footer">
            <span className="status-dot" /> All systems ready <span>v1.0</span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="Open menu"
            onClick={() => setSidebar(true)}
          >
            <Menu />
          </button>
          <div className="breadcrumb">
            <span>Playground</span>
            <ChevronRight size={13} />
            <strong>
              {page === "admin"
                ? "Admin panel"
                : menu.find((m) => m[0] === page)?.[1] || "Discover"}
            </strong>
          </div>
          <div className="search-box">
            <Search size={17} />
            <input
              id="global-search"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                if (!["discover", "games", "apps", "shop"].includes(page))
                  setPage("games");
              }}
              placeholder="Find your next favorite…"
            />
            <kbd>⌘ K</kbd>
            {search && (
              <button aria-label="Clear search" onClick={() => setSearch("")}>
                <X size={14} />
              </button>
            )}
          </div>
          <div className="top-actions">
            <button className="coin-balance" onClick={() => navigate("shop")}>
              <Coins size={17} />
              <strong>{user?.coins || 0}</strong>
              <Plus size={13} />
            </button>
            <button
              className="notification-button icon-button"
              aria-label="View announcement"
              onClick={() =>
                notify(settings.announcement || "You’re all caught up.")
              }
            >
              <Bell size={18} />
              {settings.announcementEnabled && <i />}
            </button>
            {user ? (
              <div className="account-wrap">
                <button
                  className="avatar-button"
                  aria-label="Account menu"
                  onClick={() => setAccountMenu(!accountMenu)}
                >
                  {user.avatar}
                </button>
                {accountMenu && (
                  <div className="account-menu">
                    <strong>
                      {user.username} {user.admin && <Verified />}
                    </strong>
                    <small>{user.email}</small>
                    <button
                      onClick={() => {
                        setModal({ type: "profile" });
                        setAccountMenu(false);
                      }}
                    >
                      <User size={15} />
                      My profile
                    </button>
                    {user.admin && (
                      <button
                        onClick={() => {
                          navigate("admin");
                          setAccountMenu(false);
                        }}
                      >
                        <ShieldCheck size={15} />
                        Admin panel
                      </button>
                    )}
                    <button
                      onClick={async () => {
                        await act("/logout", "POST", {});
                        await refresh();
                        setAccountMenu(false);
                        navigate("discover");
                      }}
                    >
                      <LogOut size={15} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button className="btn sign-in" onClick={() => setAuth("login")}>
                Sign in <ArrowUpRight size={14} />
              </button>
            )}
          </div>
        </header>
        <main className="main-content">
          {page !== "discover" &&
            settings.announcementEnabled &&
            settings.announcement && (
              <div className="announcement global-announcement">
                <span className="announcement-icon">
                  <Volume2 size={16} />
                </span>
                <span>
                  <strong>PLAYGROUND NEWS</strong>
                  {settings.announcement}
                </span>
              </div>
            )}
          {settings.maintenance && !user?.admin ? (
            <div className="maintenance">
              <span>🛠️</span>
              <h1>A quick pit stop.</h1>
              <p>
                The admins are giving the playground a little care. Come back
                soon.
              </p>
            </div>
          ) : (
            <>
              {page === "discover" && (
                <>
                  <div className="page-heading">
                    <div>
                      <div className="eyebrow">
                        <span className="status-dot" /> YOUR GOOD TIME STARTS
                        HERE
                      </div>
                      <h1>
                        {user ? "Hey, " + user.username + "." : "Hey, player."}{" "}
                        <span className="wave">✌️</span>
                      </h1>
                      <p>{settings.tagline}</p>
                    </div>
                    <div className="today">
                      <Sun size={16} />
                      {new Date().toLocaleDateString("en-GB", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                  </div>
                  <div className="hero-grid">
                    <section className="hero-card">
                      <div className="hero-noise" />
                      <div className="hero-copy">
                        <div className="hero-pill">
                          <Sparkles size={12} /> A WORLD OF PLAY, ALL IN ONE
                          PLACE
                        </div>
                        <h2>
                          {settings.heroTitle.split(" ").slice(0, -1).join(" ")}
                          <br />
                          <em>{settings.heroTitle.split(" ").slice(-1)}</em>
                        </h2>
                        <p>{settings.heroSubtitle}</p>
                        <button
                          className="btn hero-button"
                          onClick={() => navigate("games")}
                        >
                          <Gamepad2 size={18} />
                          Let’s play
                          <ArrowUpRight size={17} />
                        </button>
                        <div className="hero-caption">
                          <span className="tiny-avatars">👾 🦊 🤖</span>
                          <span>No downloads. Just good times.</span>
                        </div>
                      </div>
                      <div className="hero-illustration" aria-hidden="true">
                        <div className="orbit orbit-one" />
                        <div className="orbit orbit-two" />
                        <span className="hero-star star-one">✦</span>
                        <span className="hero-star star-two">✧</span>
                        <span className="hero-star star-three">✦</span>
                        <span className="float-label">+100 XP</span>
                        <div className="arcade-machine">
                          <div className="arcade-marquee">
                            LET’S PLAY <span>✦</span>
                          </div>
                          <div className="arcade-screen">
                            <div className="screen-inner">
                              <div className="pixel-alien">
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                                <i />
                              </div>
                              <span>INSERT GOOD VIBES</span>
                              <small>PRESS START_</small>
                            </div>
                          </div>
                          <div className="arcade-controls">
                            <div className="joystick">
                              <i />
                            </div>
                            <div className="arcade-buttons">
                              <i />
                              <i />
                              <i />
                            </div>
                          </div>
                          <div className="arcade-base">
                            <div />
                          </div>
                        </div>
                        <span className="floating-block block-lime" />
                        <span className="floating-block block-purple" />
                      </div>
                    </section>
                    <section className="daily-card">
                      <div className="daily-label">
                        <span>
                          <Flame size={15} />
                          THE DAILY DROP
                        </span>
                        <small>NEW EVERY DAY</small>
                      </div>
                      <GameArt
                        game={
                          games.find((g) => g.id === "wordle") ||
                          GAME_CATALOG[0]
                        }
                        mini
                      />
                      <h2>
                        One word. One chance
                        <br />
                        to make your day.
                      </h2>
                      <p>
                        Your daily Wordle is waiting.
                        <br />
                        Keep the streak alive.
                      </p>
                      <button
                        className="btn daily-button"
                        disabled={!games.find((g) => g.id === "wordle")}
                        onClick={() =>
                          openGame(games.find((g) => g.id === "wordle"))
                        }
                      >
                        Play today’s Wordle <ArrowRight size={16} />
                      </button>
                      <div className="daily-foot">
                        <Clock3 size={12} /> A fresh puzzle at midnight UTC
                      </div>
                    </section>
                  </div>
                  {settings.announcementEnabled && settings.announcement && (
                    <div className="announcement">
                      <span className="announcement-icon">
                        <Volume2 size={16} />
                      </span>
                      <span>
                        <strong>PLAYGROUND NEWS</strong>
                        {settings.announcement}
                      </span>
                      <button
                        className="icon-button"
                        aria-label="View community"
                        onClick={() => navigate("community")}
                      >
                        <ArrowUpRight size={18} />
                      </button>
                    </div>
                  )}
                  <div className="section-heading">
                    <div>
                      <h2>
                        Pick up & play <span>✦</span>
                      </h2>
                      <p>Your next “just one more game” starts here.</p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => navigate("games")}
                    >
                      Explore all games
                      <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="category-tabs">
                    {[
                      "All games",
                      "Arcade",
                      "Puzzle",
                      "Word",
                      "Strategy",
                      "Quick play",
                    ].map((c) => (
                      <button
                        key={c}
                        onClick={() => setFilter(c)}
                        className={filter === c ? "active" : ""}
                      >
                        {c === "All games" && <LayoutGrid size={14} />} {c}
                      </button>
                    ))}
                  </div>
                  <div className="game-grid">
                    {visible.slice(0, 4).map((g) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        onPlay={openGame}
                        favorite={favorites.includes(g.id)}
                        onFavorite={favorite}
                      />
                    ))}
                  </div>
                  {!visible.length && (
                    <Empty text="No games found. Try another search." />
                  )}
                  <div className="dashboard-lower">
                    <section>
                      <div className="section-heading">
                        <div>
                          <h2>A little useful, too.</h2>
                          <p>Everyday tools. Playground energy.</p>
                        </div>
                        <button
                          className="text-button"
                          onClick={() => navigate("apps")}
                        >
                          All apps
                          <ArrowRight size={15} />
                        </button>
                      </div>
                      <div className="mini-app-grid">
                        {APP_CATALOG.slice(0, 4).map((a) => (
                          <button
                            className="mini-app"
                            key={a.id}
                            onClick={() => setModal({ type: "app", value: a })}
                          >
                            <span className={"app-icon " + a.color}>
                              <a.Icon size={22} />
                            </span>
                            <strong>{a.name}</strong>
                            <ArrowUpRight size={15} />
                          </button>
                        ))}
                      </div>
                    </section>
                    <section className="community-promo">
                      <div className="community-promo-top">
                        <span className="app-icon purple">
                          <MessageCircle size={22} />
                        </span>
                        <span className="community-badge">
                          <i /> YOUR PEOPLE ARE HERE
                        </span>
                      </div>
                      <h2>Games are better together.</h2>
                      <p>Share a win. Find your people. Just hang out.</p>
                      <button
                        className="text-button"
                        onClick={() => navigate("community")}
                      >
                        Meet the community
                        <ArrowUpRight size={16} />
                      </button>
                      <div className="promo-spark">✳</div>
                    </section>
                  </div>
                </>
              )}
              {page === "games" && (
                <>
                  <PageTitle
                    eyebrow="A LITTLE COMPETITION. A LOT OF FUN."
                    title="Let the games begin."
                    text="Find your next favorite. Every game is ready when you are."
                  />
                  <div className="category-tabs">
                    {[
                      "All games",
                      "Arcade",
                      "Puzzle",
                      "Word",
                      "Strategy",
                      "Quick play",
                      "Favorites",
                    ].map((c) => (
                      <button
                        key={c}
                        className={filter === c ? "active" : ""}
                        onClick={() => setFilter(c)}
                      >
                        {c === "Favorites" && <Heart size={14} />} {c}
                      </button>
                    ))}
                  </div>
                  <div className="game-grid full-grid">
                    {visible.map((g) => (
                      <GameCard
                        key={g.id}
                        game={g}
                        onPlay={openGame}
                        favorite={favorites.includes(g.id)}
                        onFavorite={favorite}
                      />
                    ))}
                  </div>
                  {!visible.length && (
                    <Empty
                      text={
                        filter === "Favorites"
                          ? "Tap a heart on any game to save it here."
                          : "No games match your search."
                      }
                    />
                  )}
                </>
              )}
              {page === "apps" && (
                <>
                  <PageTitle
                    eyebrow="LITTLE TOOLS. BIG POSSIBILITIES."
                    title="Your everyday toolkit."
                    text="For the moments between games. Useful things, beautifully simple."
                  />
                  <div className="apps-grid">
                    {APP_CATALOG.filter((a) =>
                      a.name.toLowerCase().includes(search.toLowerCase()),
                    ).map((a) => (
                      <button
                        className="app-card"
                        key={a.id}
                        onClick={() => setModal({ type: "app", value: a })}
                      >
                        <span className={"app-icon " + a.color}>
                          <a.Icon size={29} />
                        </span>
                        <ArrowUpRight size={20} />
                        <h2>{a.name}</h2>
                        <p>{a.description}</p>
                        <small>
                          OPEN APP <ArrowRight size={13} />
                        </small>
                      </button>
                    ))}
                  </div>
                  <p className="page-note">
                    <LockKeyhole size={14} />
                    Your notes and tool preferences stay in your browser.
                  </p>
                </>
              )}
              {page === "community" && (
                <Chat
                  boot={boot}
                  api={api}
                  act={act}
                  onLogin={() => setAuth("login")}
                  notify={notify}
                />
              )}
              {page === "leaderboard" && <Leaderboard api={api} />}
              {page === "shop" && (
                <>
                  <PageTitle
                    eyebrow="MAKE THIS LITTLE WORLD YOURS."
                    title="A little pixel personality."
                    text="New colors. New characters. Same you. Spend play coins, never real money."
                  />
                  <div className="shop-banner">
                    <div>
                      <Gift size={25} />
                      <span>
                        <strong>Your next look starts here.</strong>
                        <p>Start with 500 coins. Collect 100 more every day.</p>
                      </span>
                    </div>
                    <button
                      className="btn primary"
                      onClick={() =>
                        user
                          ? act("/daily-reward", "POST", {})
                          : setAuth("register")
                      }
                    >
                      Collect daily coins
                      <Coins size={16} />
                    </button>
                  </div>
                  {!settings.shopEnabled && !user?.admin ? (
                    <Empty text="The shop is taking a short break. Check back soon." />
                  ) : (
                    ["theme", "avatar"].map((type) => (
                      <section key={type} className="shop-section">
                        <div className="section-heading">
                          <h2>
                            {type === "theme"
                              ? "Set the mood"
                              : "Meet your new alter ego"}
                          </h2>
                          <span>{type === "theme" ? "THEMES" : "AVATARS"}</span>
                        </div>
                        <div className="shop-grid">
                          {items
                            .filter(
                              (i) =>
                                i.type === type &&
                                !i.hidden &&
                                (i.name + " " + i.description)
                                  .toLowerCase()
                                  .includes(search.toLowerCase()),
                            )
                            .map((item) => {
                              const owned = user?.inventory.includes(item.id),
                                equipped = user?.[item.type] === item.value;
                              return (
                                <div className="shop-item" key={item.id}>
                                  <div
                                    className={
                                      "shop-preview " +
                                      (type === "theme"
                                        ? "theme-preview"
                                        : "avatar-preview")
                                    }
                                    style={{
                                      "--item-color": item.color || "#c6a5fa",
                                    }}
                                  >
                                    {type === "theme" ? (
                                      <div className="theme-window">
                                        <div>
                                          <i />
                                          <i />
                                          <i />
                                        </div>
                                        <section>
                                          <aside />
                                          <article>
                                            <span />
                                            <div>
                                              <i />
                                              <i />
                                              <i />
                                            </div>
                                          </article>
                                        </section>
                                      </div>
                                    ) : (
                                      <span>{item.value}</span>
                                    )}
                                    {equipped && (
                                      <small>
                                        <Check size={12} />
                                        EQUIPPED
                                      </small>
                                    )}
                                  </div>
                                  <h3>{item.name}</h3>
                                  <p>{item.description}</p>
                                  <div className="shop-item-bottom">
                                    <span>
                                      <Coins size={16} />
                                      {owned ? "Owned" : item.price}
                                    </span>
                                    <button
                                      className={
                                        "btn " +
                                        (equipped ? "secondary" : "primary")
                                      }
                                      disabled={equipped}
                                      onClick={() => {
                                        if (!user) {
                                          setAuth("register");
                                          return;
                                        }
                                        act(
                                          owned ? "/profile" : "/purchase",
                                          owned ? "PATCH" : "POST",
                                          { item: item.id },
                                          owned
                                            ? "Your new look is on!"
                                            : "Added to your collection!",
                                        );
                                      }}
                                    >
                                      {equipped
                                        ? "Equipped"
                                        : owned
                                          ? "Equip"
                                          : "Get it"}
                                      {!equipped && <ArrowUpRight size={13} />}
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </section>
                    ))
                  )}
                </>
              )}
              {page === "admin" &&
                (user?.admin ? (
                  <AdminPanel
                    boot={boot}
                    refresh={refresh}
                    act={act}
                    notify={notify}
                  />
                ) : (
                  <Empty text="Verified administrator access required." />
                ))}
            </>
          )}
          <footer className="main-footer">
            <span>
              <PixelLogo />
              {settings.siteName} <span>·</span> Made for a little more play.
            </span>
            <span>
              Play kind. Stay curious. <Heart size={12} />
            </span>
          </footer>
        </main>
      </div>
      {modal && (
        <Modal
          onClose={() => setModal(null)}
          title={
            modal.type === "profile" ? "Your little corner" : modal.value.name
          }
          subtitle={
            modal.type === "game"
              ? modal.value.category + " · " + modal.value.description
              : modal.type === "app"
                ? modal.value.description
                : "Make yourself at home."
          }
        >
          {modal.type === "game" ? (
            <GamePlayer
              game={modal.value}
              onScore={(score) => {
                if (user)
                  act(
                    "/scores",
                    "POST",
                    { game: modal.value.id, score },
                    "Score saved: " + score + " points",
                  );
                else notify("Nice play! Sign in to save your scores.");
              }}
            />
          ) : modal.type === "app" ? (
            <AppPlayer app={modal.value} />
          ) : (
            <Profile
              user={user}
              emailAvailable={boot.emailAvailable}
              act={act}
              items={items}
              onLogin={() => setAuth("login")}
            />
          )}
        </Modal>
      )}
      {auth && (
        <Modal
          onClose={() => setAuth(null)}
          title={
            auth === "login"
              ? "Welcome back, player."
              : "Your next adventure starts here."
          }
          subtitle="A whole world of play. One little account."
          narrow
        >
          <Auth
            mode={auth}
            setMode={setAuth}
            onSuccess={async (data) => {
              setBoot((b) => ({ ...b, user: data.user }));
              setAuth(null);
              notify(data.message || "Welcome back!");
            }}
          />
        </Modal>
      )}
      {toast && (
        <div role="status" className={"toast " + toast.type}>
          {toast.type === "error" ? (
            <Flag size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
function PageTitle({ eyebrow, title, text }) {
  return (
    <div className="page-heading">
      <div>
        <div className="eyebrow">{eyebrow}</div>
        <h1>{title}</h1>
        <p>{text}</p>
      </div>
    </div>
  );
}
function Empty({ text }) {
  return (
    <div className="empty-state">
      <Gamepad2 size={35} />
      <p>{text}</p>
    </div>
  );
}
function GameCard({ game, onPlay, favorite, onFavorite }) {
  return (
    <article className="game-card">
      <button
        className="game-card-play"
        onClick={() => onPlay(game)}
        aria-label={"Play " + game.name}
      >
        <GameArt game={game} />
        <span className="game-hover">
          <Play size={24} fill="currentColor" />
        </span>
      </button>
      <button
        className={"favorite-button " + (favorite ? "saved" : "")}
        aria-label={(favorite ? "Remove " : "Favorite ") + game.name}
        onClick={(e) => onFavorite(e, game.id)}
      >
        <Heart size={16} fill={favorite ? "currentColor" : "none"} />
      </button>
      <div className="game-card-info">
        <div>
          <span className={"game-tag " + game.color}>{game.tag}</span>
          <span className="game-category">{game.category}</span>
        </div>
        <button onClick={() => onPlay(game)}>
          <h3>{game.name}</h3>
          <ArrowUpRight size={17} />
        </button>
        <p>{game.description}</p>
      </div>
    </article>
  );
}
function Modal({ children, onClose, title, subtitle, narrow = false }) {
  const ref = useRef(),
    previous = useRef();
  useEffect(() => {
    previous.current = document.activeElement;
    ref.current?.focus();
    const f = (e) => {
      if (e.key !== "Tab") return;
      const els = ref.current?.querySelectorAll(
        "button:not(:disabled),input:not(:disabled),textarea,select,a[href]",
      );
      if (!els?.length) return;
      const first = els[0],
        last = els[els.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", f);
    return () => {
      document.removeEventListener("keydown", f);
      previous.current?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        ref={ref}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={"modal " + (narrow ? "narrow" : "")}
      >
        <div className="modal-header">
          <div>
            <h2>{title}</h2>
            <p>{subtitle}</p>
          </div>
          <button
            className="icon-button"
            aria-label="Close dialog"
            onClick={onClose}
          >
            <X size={21} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}
function Auth({ mode, setMode, onSuccess }) {
  const [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [username, setUsername] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const data = await api(
        mode === "login" ? "/login" : "/register",
        "POST",
        { email, password, username },
      );
      onSuccess(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <form className="auth-form" onSubmit={submit}>
      <div className="auth-illustration">
        <PixelLogo />
        <span>Find your people. Find your play.</span>
      </div>
      {mode === "register" && (
        <label>
          Username
          <div className="form-input">
            <User size={17} />
            <input
              required
              minLength={3}
              maxLength={20}
              pattern="[a-zA-Z0-9_]+"
              autoComplete="username"
              placeholder="Your player name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
        </label>
      )}
      <label>
        Email address
        <div className="form-input">
          <Mail size={17} />
          <input
            required
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </label>
      <label>
        Password
        <div className="form-input">
          <LockKeyhole size={17} />
          <input
            required
            type="password"
            minLength={mode === "register" ? 10 : 1}
            maxLength={128}
            autoComplete={
              mode === "login" ? "current-password" : "new-password"
            }
            placeholder={
              mode === "register" ? "At least 10 characters" : "Your password"
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </label>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
      <button className="btn primary full-width" disabled={busy}>
        {busy
          ? "One moment…"
          : mode === "login"
            ? "Let’s play"
            : "Create your account"}
        <ArrowRight size={16} />
      </button>
      {mode === "register" && (
        <p className="auth-note">
          <Coins size={14} />
          500 welcome coins. Yours to make it yours.
        </p>
      )}
      <p className="auth-switch">
        {mode === "login"
          ? "New to the playground?"
          : "Already part of the crew?"}{" "}
        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError("");
          }}
        >
          {mode === "login" ? "Join us" : "Sign in"}
        </button>
      </p>
    </form>
  );
}
function Profile({ user, emailAvailable, act, items, onLogin }) {
  const [name, setName] = useState(user?.username || "");
  if (!user)
    return (
      <div className="empty-state">
        <User size={35} />
        <p>Sign in to make the playground yours.</p>
        <button className="btn primary" onClick={onLogin}>
          Sign in
        </button>
      </div>
    );
  return (
    <div className="profile">
      <div className="profile-hero">
        <span>{user.avatar}</span>
        <h2>
          {user.username} {user.admin && <Verified />}
        </h2>
        <p>{user.email}</p>
        <small>
          {user.admin
            ? "Verified administrator"
            : user.verified
              ? "Email verified"
              : "Email awaiting verification"}
        </small>
      </div>
      <div className="profile-coins">
        <Coins size={22} />
        <strong>{user.coins}</strong>
        <span>play coins</span>
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          act("/profile", "PATCH", { username: name }, "Player name updated.");
        }}
      >
        <label>
          Player name
          <input
            value={name}
            minLength={3}
            maxLength={20}
            onChange={(e) => setName(e.target.value)}
          />
        </label>
        <button className="btn secondary">
          Save name
          <Check size={14} />
        </button>
      </form>
      {!user.verified && (
        <div className="verification-notice">
          <Mail size={20} />
          <div>
            <strong>Verify your email</strong>
            <p>
              {emailAvailable
                ? "Check your inbox, or send another verification link."
                : "Email delivery needs to be configured by the site owner. Owner admin access stays locked until verification."}
            </p>
            <button
              className="text-button"
              onClick={() => act("/resend-verification", "POST", {})}
            >
              Resend verification
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}
      <h3>Your collection</h3>
      <div className="inventory-grid">
        {items
          .filter((i) => user.inventory.includes(i.id))
          .map((i) => (
            <button
              key={i.id}
              onClick={() =>
                act("/profile", "PATCH", { item: i.id }, "New look equipped!")
              }
            >
              <span style={{ color: i.color }}>
                {i.type === "avatar" ? i.value : "✦"}
              </span>
              {i.name}
              {user[i.type] === i.value && <Check size={13} />}
            </button>
          ))}
      </div>
      {!user.inventory.length && (
        <p className="muted">
          The shop has your next look. Your welcome coins are ready.
        </p>
      )}
      <button
        className="text-button"
        onClick={() =>
          act(
            "/profile",
            "PATCH",
            { resetTheme: true },
            "Classic theme restored.",
          )
        }
      >
        Restore midnight theme
      </button>
    </div>
  );
}
function Chat({ boot, api, act, onLogin, notify }) {
  const [room, setRoom] = useState(boot.rooms[0]?.id || 1),
    [messages, setMessages] = useState([]),
    [input, setInput] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const end = useRef(),
    scroller = useRef(),
    first = useRef(true),
    last = useRef(0);
  const current = boot.rooms.find((r) => r.id === room) || boot.rooms[0];
  useEffect(() => {
    if (!boot.rooms.some((r) => r.id === room)) setRoom(boot.rooms[0]?.id || 1);
  }, [boot.rooms]);
  useEffect(() => {
    let alive = true;
    first.current = true;
    last.current = 0;
    setMessages([]);
    async function load() {
      try {
        const data = await api("/messages?room=" + room);
        if (!alive) return;
        const nearBottom =
          !scroller.current ||
          scroller.current.scrollHeight -
            scroller.current.scrollTop -
            scroller.current.clientHeight <
            90;
        setMessages(data.messages);
        setError("");
        const newest = data.messages.at(-1)?.id;
        if (first.current || (newest !== last.current && nearBottom))
          setTimeout(
            () => end.current?.scrollIntoView({ block: "nearest" }),
            40,
          );
        first.current = false;
        last.current = newest;
      } catch (e) {
        if (alive) setError(e.message);
      }
    }
    load();
    const t = setInterval(load, 2500);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, [room, boot.settings.chatEnabled]);
  async function send(e) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    setBusy(true);
    const data = await act("/messages", "POST", { room, content: input });
    if (data) {
      setInput("");
      try {
        const data = await api("/messages?room=" + room);
        setMessages(data.messages);
        setTimeout(
          () =>
            end.current?.scrollIntoView({
              block: "nearest",
              behavior: "smooth",
            }),
          40,
        );
      } catch (e) {
        setError(e.message);
      }
    }
    setBusy(false);
  }
  return (
    <>
      <PageTitle
        eyebrow="FIND YOUR PEOPLE."
        title="Pull up a chair."
        text="Share the wins, swap a strategy, or just say hello. This is your space."
      />
      <div className="chat-layout">
        <aside className="room-list">
          <div>
            <span>CHAT ROOMS</span>
            {boot.user?.admin && <ShieldCheck size={15} />}
          </div>
          {boot.rooms.map((r) => (
            <button
              key={r.id}
              className={room === r.id ? "active" : ""}
              onClick={() => setRoom(r.id)}
            >
              <Hash size={17} />
              {r.name}
              {room === r.id && <span className="status-dot" />}
            </button>
          ))}
          <div className="chat-guidelines">
            <Heart size={20} />
            <strong>A good place for good people.</strong>
            <p>
              Be kind. Keep private info private. Make everyone feel welcome.
            </p>
          </div>
        </aside>
        <section className="chat-panel">
          <header>
            <Hash size={23} />
            <div>
              <h2>{current?.name}</h2>
              <p>{current?.description}</p>
            </div>
            <span className="live-label">
              <i /> LIVE CHAT
            </span>
          </header>
          <div className="messages" ref={scroller}>
            {error ? (
              <Empty text={error} />
            ) : messages.length ? (
              messages.map((m) => (
                <div className="chat-message" key={m.id}>
                  <span className="message-avatar">{m.avatar}</span>
                  <div>
                    <div className="message-meta">
                      <strong>{m.username}</strong>
                      {m.admin && <Verified />}
                      <time>
                        {new Date(m.created + "Z").toLocaleTimeString("en-GB", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </time>
                      {boot.user?.admin && (
                        <button
                          className="icon-button"
                          aria-label="Delete message"
                          onClick={async () => {
                            const result = await act(
                              "/admin/messages",
                              "DELETE",
                              { id: m.id },
                              "Message removed.",
                            );
                            if (result)
                              setMessages((p) =>
                                p.filter((x) => x.id !== m.id),
                              );
                          }}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                    <p>{m.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="chat-welcome">
                <span className="app-icon purple">
                  <Hash size={32} />
                </span>
                <h2>The start of something good.</h2>
                <p>Welcome to #{current?.name}. Be the first to say hello.</p>
              </div>
            )}
            <div ref={end} />
          </div>
          {boot.user ? (
            <form className="chat-compose" onSubmit={send}>
              <input
                maxLength={500}
                aria-label="Chat message"
                placeholder={"Message #" + current?.name}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!boot.settings.chatEnabled && !boot.user.admin}
              />
              <span>{input.length}/500</span>
              <button
                className="btn primary"
                disabled={
                  busy ||
                  !input.trim() ||
                  (!boot.settings.chatEnabled && !boot.user.admin)
                }
                aria-label="Send message"
              >
                <Send size={17} />
              </button>
            </form>
          ) : (
            <div className="chat-login">
              <p>Your voice belongs here.</p>
              <button className="btn primary" onClick={onLogin}>
                Sign in to chat
                <ArrowRight size={15} />
              </button>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
function Leaderboard({ api }) {
  const [players, setPlayers] = useState([]),
    [error, setError] = useState(""),
    [game, setGame] = useState("all");
  useEffect(() => {
    api("/leaderboard")
      .then((d) => setPlayers(d.players))
      .catch((e) => setError(e.message));
  }, []);
  const filtered = players.filter((p) => game === "all" || p.game === game);
  return (
    <>
      <PageTitle
        eyebrow="A LITTLE FRIENDLY COMPETITION."
        title="Big plays. Good company."
        text="Personal bests worth celebrating. Can you make the board?"
      />
      <div className="leaderboard-panel">
        <div className="leaderboard-heading">
          <h2>
            <Trophy size={23} />
            The leaderboard
          </h2>
          <select
            aria-label="Filter leaderboard by game"
            value={game}
            onChange={(e) => setGame(e.target.value)}
          >
            <option value="all">All games</option>
            {GAME_CATALOG.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </select>
        </div>
        <div className="leaderboard-table">
          <div className="leaderboard-row table-head">
            <span>RANK</span>
            <span>PLAYER</span>
            <span>GAME</span>
            <span>PERSONAL BEST</span>
          </div>
          {filtered.map((p, i) => (
            <div className="leaderboard-row" key={p.id + "-" + p.game}>
              <span className={"rank rank-" + i}>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : String(i + 1).padStart(2, "0")}
              </span>
              <span className="leaderboard-player">
                <i>{p.avatar}</i>
                <strong>{p.username}</strong>
              </span>
              <span>{GAME_CATALOG.find((g) => g.id === p.game)?.name}</span>
              <strong>
                {p.score.toLocaleString()} <small>pts</small>
              </strong>
            </div>
          ))}
        </div>
        {!filtered.length && (
          <Empty
            text={
              error ||
              "A fresh leaderboard. Sign in, play a game, and set the first score."
            }
          />
        )}
      </div>
      <p className="page-note">
        <Activity size={14} />
        Scores are player-reported for friendly competition. Different games use
        different scoring scales.
      </p>
    </>
  );
}
function AdminPanel({ boot, refresh, act, notify }) {
  const [tab, setTab] = useState("overview"),
    [data, setData] = useState(null),
    [settings, setSettings] = useState(boot.settings),
    [roomName, setRoomName] = useState(""),
    [roomDescription, setRoomDescription] = useState(""),
    [command, setCommand] = useState(""),
    [query, setQuery] = useState(""),
    [busy, setBusy] = useState(false),
    [editUser, setEditUser] = useState(null),
    [editRoom, setEditRoom] = useState(null),
    [error, setError] = useState("");
  async function load() {
    try {
      setData(await api("/admin"));
      setError("");
    } catch (e) {
      setError(e.message);
    }
  }
  useEffect(() => {
    load();
  }, []);
  useEffect(() => setSettings(boot.settings), [boot.settings]);
  async function save(payload) {
    setBusy(true);
    const result = await act(
      "/admin/settings",
      "PATCH",
      payload,
      "Playground settings saved.",
    );
    if (result) {
      await refresh();
      await load();
    }
    setBusy(false);
    return result;
  }
  async function userAction(payload) {
    setBusy(true);
    const result = await act(
      "/admin/users",
      "PATCH",
      payload,
      "Player updated.",
    );
    if (result) {
      await load();
      await refresh();
      setEditUser(null);
    }
    setBusy(false);
  }
  async function execute(e) {
    e.preventDefault();
    const [cmd, ...args] = command.trim().split(/\s+/);
    const target = data?.users.find(
      (u) => u.username.toLowerCase() === args[0]?.toLowerCase(),
    );
    let result;
    if (cmd === "/announce")
      result = await save({
        announcement: args.join(" "),
        announcementEnabled: true,
      });
    else if (cmd === "/maintenance" && ["on", "off"].includes(args[0]))
      result = await save({ maintenance: args[0] === "on" });
    else if (["/ban", "/unban"].includes(cmd) && target)
      result = await act(
        "/admin/users",
        "PATCH",
        { id: target.id, banned: cmd === "/ban" },
        "Player moderation updated.",
      );
    else if (cmd === "/coins" && target && /^\d+$/.test(args[1]))
      result = await act(
        "/admin/users",
        "PATCH",
        { id: target.id, coins: Number(args[1]) },
        "Coin balance updated.",
      );
    else if (cmd === "/clearchat") {
      const room = boot.rooms.find((r) => r.name === args[0]);
      if (room && window.confirm("Delete all messages in #" + room.name + "?"))
        result = await act(
          "/admin/messages",
          "DELETE",
          { room: room.id },
          "Room messages cleared.",
        );
    } else if (cmd === "/help") {
      notify(
        "Commands: /announce text, /ban player, /unban player, /coins player amount, /maintenance on|off, /clearchat room",
      );
      return;
    } else {
      notify(
        "Unknown command or player. Use /help for supported commands.",
        "error",
      );
      return;
    }
    if (result) {
      setCommand("");
      await load();
      await refresh();
    }
  }
  const tabs = [
    ["overview", "Overview", Activity],
    ["players", "Players", Users],
    ["site", "Site editor", Edit3],
    ["games", "Games & shop", Gamepad2],
    ["rooms", "Chat rooms", MessageCircle],
    ["audit", "Activity log", Clock3],
  ];
  return (
    <>
      <PageTitle
        eyebrow="YOUR PLAYGROUND. YOUR CONTROL."
        title="Behind the pixels."
        text="Manage the site, your community, and every little detail. Owner access is verified on the server."
      />
      <div className="admin-identity">
        <ShieldCheck size={22} />
        <div>
          <strong>Verified owner access</strong>
          <p>
            somkene.ebukambonu@millburnacademy.org.uk ·
            kamneto.ebukambonu@millburnacademy.org.uk
          </p>
        </div>
      </div>
      <div className="admin-tabs">
        {tabs.map(([id, name, Icon]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={tab === id ? "active" : ""}
          >
            <Icon size={16} />
            {name}
          </button>
        ))}
      </div>
      {error && <p className="form-error">{error}</p>}
      {tab === "overview" && (
        <>
          <div className="admin-stats">
            {[
              [Users, "Registered players", data?.stats.users],
              [MessageCircle, "Chat messages", data?.stats.messages],
              [ShoppingBag, "Shop purchases", data?.stats.purchases],
              [
                Gamepad2,
                "Active games",
                GAME_CATALOG.length -
                  (boot.settings.disabledGames?.length || 0),
              ],
            ].map(([Icon, label, n]) => (
              <div key={label}>
                <Icon size={22} />
                <span>{label}</span>
                <strong>{n ?? "…"}</strong>
              </div>
            ))}
          </div>
          <section className="admin-card">
            <h2>
              <Terminal size={20} />
              Owner command center
            </h2>
            <p>
              Quick commands for everyday moderation. All actions are recorded.
            </p>
            <form className="command-input" onSubmit={execute}>
              <span>❯</span>
              <input
                aria-label="Admin command"
                placeholder="/help"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
              />
              <button
                className="btn primary"
                disabled={busy || !command.trim()}
              >
                Run
                <ArrowRight size={14} />
              </button>
            </form>
            <div className="command-help">
              {[
                "/announce Your message",
                "/ban username",
                "/unban username",
                "/coins username 1000",
                "/maintenance on",
                "/clearchat general",
              ].map((c) => (
                <button key={c} onClick={() => setCommand(c)}>
                  {c}
                </button>
              ))}
            </div>
          </section>
          <section className="admin-card">
            <h2>Quick switches</h2>
            <div className="admin-toggles">
              {[
                [
                  "maintenance",
                  "Maintenance mode",
                  "Pause access for regular players",
                ],
                ["chatEnabled", "Community chat", "Let players send messages"],
                [
                  "shopEnabled",
                  "Pixel shop",
                  "Let players buy themes and avatars",
                ],
                [
                  "announcementEnabled",
                  "Global announcement",
                  "Show the news banner on the home page",
                ],
              ].map(([key, name, description]) => (
                <label className="switch-row" key={key}>
                  <div>
                    <strong>{name}</strong>
                    <p>{description}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={boot.settings[key]}
                    disabled={busy}
                    onChange={(e) => save({ [key]: e.target.checked })}
                  />
                </label>
              ))}
            </div>
          </section>
        </>
      )}
      {tab === "site" && (
        <form
          className="admin-card admin-form"
          onSubmit={(e) => {
            e.preventDefault();
            save(
              Object.fromEntries(
                [
                  "siteName",
                  "tagline",
                  "heroTitle",
                  "heroSubtitle",
                  "announcement",
                  "announcementEnabled",
                ].map((k) => [k, settings[k]]),
              ),
            );
          }}
        >
          <h2>Edit your playground</h2>
          <div className="form-grid">
            {[
              ["siteName", "Site name", 40],
              ["tagline", "Welcome tagline", 140],
              ["heroTitle", "Hero headline", 80],
              ["heroSubtitle", "Hero description", 180],
            ].map(([key, label, max]) => (
              <label key={key}>
                {label}
                <input
                  value={settings[key]}
                  maxLength={max}
                  onChange={(e) =>
                    setSettings({ ...settings, [key]: e.target.value })
                  }
                />
              </label>
            ))}
          </div>
          <label>
            Global announcement
            <textarea
              maxLength={500}
              rows={3}
              value={settings.announcement}
              onChange={(e) =>
                setSettings({ ...settings, announcement: e.target.value })
              }
            />
          </label>
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={settings.announcementEnabled}
              onChange={(e) =>
                setSettings({
                  ...settings,
                  announcementEnabled: e.target.checked,
                })
              }
            />
            Show announcement globally
          </label>
          <button className="btn primary" disabled={busy}>
            Save site content
            <Check size={15} />
          </button>
        </form>
      )}
      {tab === "players" && (
        <section className="admin-card">
          <div className="section-heading">
            <h2>Manage players</h2>
            <div className="form-input">
              <Search size={16} />
              <input
                aria-label="Search players"
                placeholder="Find a player…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="admin-table">
            {data?.users
              .filter((u) =>
                (u.username + " " + u.email)
                  .toLowerCase()
                  .includes(query.toLowerCase()),
              )
              .map((u) => (
                <div className="admin-user" key={u.id}>
                  <span>{u.avatar}</span>
                  <div>
                    <strong>
                      {u.username} {u.admin && <Verified />}
                    </strong>
                    <small>{u.email}</small>
                  </div>
                  <span className={"user-status " + (u.banned ? "banned" : "")}>
                    {u.banned
                      ? "Banned"
                      : u.admin
                        ? "Owner"
                        : u.verified
                          ? "Verified"
                          : "Player"}
                  </span>
                  <span>
                    <Coins size={13} />
                    {u.coins}
                  </span>
                  <button
                    className="btn secondary"
                    onClick={() => setEditUser({ ...u })}
                  >
                    <Edit3 size={13} />
                    Edit
                  </button>
                  <button
                    className={"btn " + (u.banned ? "secondary" : "danger")}
                    disabled={
                      busy ||
                      u.email === "somkene.ebukambonu@millburnacademy.org.uk" ||
                      u.email === "kamneto.ebukambonu@millburnacademy.org.uk"
                    }
                    onClick={() => {
                      if (
                        window.confirm(
                          (u.banned ? "Unban " : "Ban ") + u.username + "?",
                        )
                      )
                        userAction({ id: u.id, banned: !u.banned });
                    }}
                  >
                    {u.banned ? "Unban" : "Ban"}
                  </button>
                </div>
              ))}
          </div>
          {editUser && (
            <form
              className="edit-user-form"
              onSubmit={(e) => {
                e.preventDefault();
                userAction({
                  id: editUser.id,
                  username: editUser.username,
                  coins: Number(editUser.coins),
                });
              }}
            >
              <h3>Edit player #{editUser.id}</h3>
              <label>
                Username
                <input
                  required
                  value={editUser.username}
                  onChange={(e) =>
                    setEditUser({ ...editUser, username: e.target.value })
                  }
                />
              </label>
              <label>
                Coin balance
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  required
                  value={editUser.coins}
                  onChange={(e) =>
                    setEditUser({ ...editUser, coins: e.target.value })
                  }
                />
              </label>
              <button className="btn primary" disabled={busy}>
                Save player
              </button>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </button>
            </form>
          )}
        </section>
      )}
      {tab === "games" && (
        <>
          <section className="admin-card">
            <h2>Game library</h2>
            <p>
              Edit display names and descriptions, or temporarily hide games.
            </p>
            <div className="catalog-editor">
              {GAME_CATALOG.map((g) => {
                const override = settings.gameOverrides?.[g.id] || {},
                  disabled = settings.disabledGames?.includes(g.id);
                return (
                  <div key={g.id}>
                    <span className={"catalog-dot " + g.color} />
                    <div>
                      <input
                        aria-label={g.name + " display name"}
                        value={override.name ?? g.name}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            gameOverrides: {
                              ...settings.gameOverrides,
                              [g.id]: { ...override, name: e.target.value },
                            },
                          })
                        }
                      />
                      <input
                        aria-label={g.name + " description"}
                        value={override.description ?? g.description}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            gameOverrides: {
                              ...settings.gameOverrides,
                              [g.id]: {
                                ...override,
                                description: e.target.value,
                              },
                            },
                          })
                        }
                      />
                    </div>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!disabled}
                        disabled={busy}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            disabledGames: e.target.checked
                              ? (settings.disabledGames || []).filter(
                                  (id) => id !== g.id,
                                )
                              : [...(settings.disabledGames || []), g.id],
                          })
                        }
                      />
                      Active
                    </label>
                  </div>
                );
              })}
            </div>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() =>
                save({
                  gameOverrides: settings.gameOverrides || {},
                  disabledGames: settings.disabledGames || [],
                })
              }
            >
              Save game content
              <Check size={14} />
            </button>
          </section>
          <section className="admin-card">
            <h2>Shop catalog</h2>
            <p>
              Edit item names, descriptions, coin prices, and availability.
              Purchases always use server pricing.
            </p>
            <div className="catalog-editor">
              {boot.items.map((item) => {
                const override = settings.itemOverrides?.[item.id] || {},
                  set = (field, value) =>
                    setSettings({
                      ...settings,
                      itemOverrides: {
                        ...settings.itemOverrides,
                        [item.id]: { ...override, [field]: value },
                      },
                    });
                return (
                  <div key={item.id}>
                    <span className="catalog-avatar">
                      {item.type === "avatar" ? item.value : "✦"}
                    </span>
                    <div>
                      <input
                        aria-label={item.name + " name"}
                        value={override.name ?? item.name}
                        onChange={(e) => set("name", e.target.value)}
                      />
                      <input
                        aria-label={item.name + " description"}
                        value={override.description ?? item.description}
                        onChange={(e) => set("description", e.target.value)}
                      />
                    </div>
                    <label className="shop-price-input">
                      Coins
                      <input
                        type="number"
                        min="0"
                        max="100000"
                        aria-label={item.name + " price"}
                        value={override.price ?? item.price}
                        onChange={(e) => set("price", Number(e.target.value))}
                      />
                    </label>
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={!(override.hidden ?? item.hidden)}
                        onChange={(e) => set("hidden", !e.target.checked)}
                      />
                      Visible
                    </label>
                  </div>
                );
              })}
            </div>
            <button
              className="btn primary"
              disabled={busy}
              onClick={() =>
                save({ itemOverrides: settings.itemOverrides || {} })
              }
            >
              Save shop catalog
              <Check size={14} />
            </button>
          </section>
        </>
      )}
      {tab === "rooms" && (
        <>
          <section className="admin-card">
            <h2>Chat rooms</h2>
            <div className="admin-room-list">
              {boot.rooms.map((r) => (
                <div key={r.id}>
                  <Hash size={21} />
                  <div>
                    <strong>{r.name}</strong>
                    <p>{r.description}</p>
                  </div>
                  <button
                    className="btn secondary"
                    onClick={() => setEditRoom({ ...r })}
                  >
                    <Edit3 size={14} />
                    Edit
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => {
                      if (
                        window.confirm("Clear all messages in #" + r.name + "?")
                      )
                        act(
                          "/admin/messages",
                          "DELETE",
                          { room: r.id },
                          "Messages cleared.",
                        ).then(load);
                    }}
                  >
                    Clear chat
                  </button>
                  <button
                    className="icon-button danger"
                    aria-label={"Delete " + r.name}
                    disabled={r.id === 1}
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete #" + r.name + " and its messages?",
                        )
                      )
                        act(
                          "/admin/rooms",
                          "DELETE",
                          { id: r.id },
                          "Room deleted.",
                        ).then(load);
                    }}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ))}
            </div>
            {editRoom && (
              <form
                className="admin-form"
                onSubmit={async (e) => {
                  e.preventDefault();
                  const result = await act(
                    "/admin/rooms",
                    "PATCH",
                    editRoom,
                    "Room updated.",
                  );
                  if (result) {
                    setEditRoom(null);
                    load();
                  }
                }}
              >
                <label>
                  Name
                  <input
                    required
                    value={editRoom.name}
                    onChange={(e) =>
                      setEditRoom({ ...editRoom, name: e.target.value })
                    }
                  />
                </label>
                <label>
                  Description
                  <input
                    required
                    value={editRoom.description}
                    onChange={(e) =>
                      setEditRoom({ ...editRoom, description: e.target.value })
                    }
                  />
                </label>
                <div className="button-row">
                  <button className="btn primary">Save room</button>
                  <button
                    type="button"
                    className="btn secondary"
                    onClick={() => setEditRoom(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </section>
          <form
            className="admin-card admin-form"
            onSubmit={async (e) => {
              e.preventDefault();
              const data = await act(
                "/admin/rooms",
                "POST",
                { name: roomName, description: roomDescription },
                "Room created.",
              );
              if (data) {
                setRoomName("");
                setRoomDescription("");
                load();
              }
            }}
          >
            <h2>Make room for something new.</h2>
            <div className="form-grid">
              <label>
                Room name
                <input
                  required
                  minLength={2}
                  maxLength={30}
                  pattern="[a-z0-9-]+"
                  placeholder="e.g. tournament-talk"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value.toLowerCase())}
                />
              </label>
              <label>
                Description
                <input
                  required
                  maxLength={140}
                  placeholder="What is this space for?"
                  value={roomDescription}
                  onChange={(e) => setRoomDescription(e.target.value)}
                />
              </label>
            </div>
            <button className="btn primary">
              <Plus size={16} />
              Create room
            </button>
          </form>
        </>
      )}
      {tab === "audit" && (
        <section className="admin-card">
          <h2>Every change has a story.</h2>
          <p>The 50 most recent admin actions.</p>
          <div className="audit-list">
            {data?.audit.map((a) => (
              <div key={a.id}>
                <span className="app-icon purple">
                  <Activity size={16} />
                </span>
                <div>
                  <strong>
                    {a.username} · {a.action}
                  </strong>
                  <pre>{a.details}</pre>
                </div>
                <time>{new Date(a.created + "Z").toLocaleString("en-GB")}</time>
              </div>
            ))}
            {!data?.audit.length && (
              <Empty text="Your admin actions will appear here." />
            )}
          </div>
        </section>
      )}
    </>
  );
}
createRoot(document.getElementById("root")).render(<App />);
