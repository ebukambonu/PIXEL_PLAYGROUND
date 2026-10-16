import React, { useEffect, useRef, useState } from "react";
import {
  RARITIES,
  eligiblePackItems,
  packOdds,
  packReady,
  DEFAULT_PACK_CHANCES,
  validPackChances,
} from "./avatarPacks.js";
import "./avatarMarket.css";
export default function AvatarMarket({
  items,
  user,
  act,
  onLogin,
  search = "",
}) {
  const [tab, setTab] = useState("packs"),
    [selected, select] = useState(null),
    [reveal, setReveal] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [rarity, setRarity] = useState("all"),
    [ownership, setOwnership] = useState("all");
  const lock = useRef(false),
    dialog = useRef(null),
    pending = useRef({});
  const avatars = items.filter((i) => i.packId && !i.hidden),
    packs = items.filter(
      (i) =>
        i.type === "pack" &&
        !i.hidden &&
        (
          i.name +
          " " +
          i.description +
          " " +
          avatars
            .filter((a) => a.packId === i.id)
            .map((a) => a.name)
            .join(" ")
        )
          .toLowerCase()
          .includes(search.toLowerCase()),
    );
  const owned = new Set(user?.inventory || []),
    collected = avatars.filter((a) => owned.has(a.id)).length,
    pack = items.find((i) => i.id === selected),
    contents = avatars.filter((a) => a.packId === selected),
    available = eligiblePackItems(selected, items),
    odds = packOdds(pack?.chances),
    ready = packReady(available, pack?.chances);
  useEffect(() => {
    if (!selected) return;
    const old = document.activeElement,
      overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog.current?.focus();
    return () => {
      document.body.style.overflow = overflow;
      old?.focus?.();
    };
  }, [selected]);
  function close() {
    if (lock.current) return;
    select(null);
    setReveal(null);
    setError("");
  }
  function requestId() {
    const key = `pixel-pack-pending:${user.id}:${pack.id}`;
    let id = pending.current[key];
    try {
      id ||= sessionStorage.getItem(key);
    } catch {}
    if (!/^[a-f0-9-]{36}$/.test(id || "")) id = crypto.randomUUID();
    pending.current[key] = id;
    try {
      sessionStorage.setItem(key, id);
    } catch {}
    return { key, id };
  }
  async function open() {
    if (!user) {
      onLogin();
      close();
      return;
    }
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError("");
    setReveal(null);
    const { key, id } = requestId();
    try {
      const result = await act("/packs/open", "POST", {
        pack: pack.id,
        requestId: id,
      });
      if (result) {
        setReveal({
          ...result.item,
          duplicate: result.duplicate,
          refund: result.refund,
        });
        delete pending.current[key];
        try {
          sessionStorage.removeItem(key);
        } catch {}
      } else
        setError(
          "Opening did not finish. You can retry safely; the same request will not charge twice.",
        );
    } catch {
      setError("Connection interrupted. Retry to recover this opening.");
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }
  const card = (a) => {
    const has = owned.has(a.id),
      meta = RARITIES[a.rarity];
    return (
      <article
        key={a.id}
        className={"collection-avatar " + (has ? "owned" : "locked")}
        style={{ "--rarity": meta.color }}
      >
        <span className="rarity-tag">{meta.label}</span>
        <span className="collection-character" aria-hidden="true">
          {a.value}
        </span>
        <h4>{a.name}</h4>
        <small>{items.find((p) => p.id === a.packId)?.name}</small>
        {has ? (
          <button
            className="btn secondary"
            disabled={user?.avatar === a.value}
            onClick={() =>
              act("/profile", "PATCH", { item: a.id }, "Avatar equipped!")
            }
          >
            {user?.avatar === a.value ? "Equipped" : "Equip"}
          </button>
        ) : (
          <span className="avatar-lock">Not collected</span>
        )}
      </article>
    );
  };
  return (
    <section className="avatar-market">
      <div className="market-title">
        <div>
          <span className="eyebrow">THE PIXEL MARKET</span>
          <h2>Small packs. Legendary personalities.</h2>
          <p>
            12 worlds to explore. 120 new avatars to collect. Choose your pack.
            Chase your favourites.
          </p>
        </div>
        <div className="collection-total">
          <strong>
            {collected}
            <small> / {avatars.length}</small>
          </strong>
          <span>AVATARS COLLECTED</span>
        </div>
      </div>
      <div className="market-tabs" role="tablist" aria-label="Avatar market">
        <button
          role="tab"
          aria-selected={tab === "packs"}
          onClick={() => setTab("packs")}
        >
          Explore packs
        </button>
        <button
          role="tab"
          aria-selected={tab === "collection"}
          onClick={() => setTab("collection")}
        >
          Your collection · {collected}
        </button>
      </div>
      {tab === "packs" ? (
        <>
          <div className="market-pack-grid">
            {packs.map((p) => {
              const all = avatars.filter((a) => a.packId === p.id),
                count = all.filter((a) => owned.has(a.id)).length;
              return (
                <button
                  className="market-pack"
                  key={p.id}
                  style={{ "--pack-color": p.color }}
                  onClick={() => {
                    select(p.id);
                    setReveal(null);
                    setError("");
                  }}
                  aria-label={`View ${p.name} pack`}
                >
                  <div className="pack-art">
                    <span className="pack-orbit orbit-one" />
                    <span className="pack-orbit orbit-two" />
                    <span className="pack-symbol">{p.value}</span>
                    <span className="pack-seal">
                      {count === all.length && all.length
                        ? "COMPLETE"
                        : `${all.length} AVATARS`}
                    </span>
                  </div>
                  <div className="pack-label">
                    <h3>{p.name}</h3>
                    <p>{p.description}</p>
                    <div>
                      <span className="pack-price">
                        ◉ {p.price.toLocaleString()}
                      </span>
                      <span>
                        {count}/{all.length} collected
                      </span>
                    </div>
                    <progress
                      value={count}
                      max={all.length || 10}
                      aria-label={p.name + " collection progress"}
                    />
                  </div>
                </button>
              );
            })}
          </div>
          {!packs.length && (
            <p className="market-empty">No packs match your search.</p>
          )}
          <p className="market-note">
            Spend play coins only. Inspect each pack for its contents and
            current odds. Each opening is independent. Duplicates return 25% of
            the pack price, rounded down.
          </p>
        </>
      ) : (
        <>
          <div className="collection-filters">
            <label>
              Rarity
              <select
                aria-label="Filter avatars by rarity"
                value={rarity}
                onChange={(e) => setRarity(e.target.value)}
              >
                <option value="all">Every rarity</option>
                {Object.entries(RARITIES).map(([id, m]) => (
                  <option key={id} value={id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Collection
              <select
                aria-label="Filter avatars by collection"
                value={ownership}
                onChange={(e) => setOwnership(e.target.value)}
              >
                <option value="all">All avatars</option>
                <option value="owned">Collected</option>
                <option value="missing">Still to find</option>
              </select>
            </label>
          </div>
          <div className="collection-grid">
            {avatars
              .filter(
                (a) =>
                  (rarity === "all" || a.rarity === rarity) &&
                  (ownership === "all" ||
                    (ownership === "owned"
                      ? owned.has(a.id)
                      : !owned.has(a.id))) &&
                  (a.name + " " + a.description)
                    .toLowerCase()
                    .includes(search.toLowerCase()),
              )
              .map(card)}
          </div>
        </>
      )}
      {pack && (
        <div
          className="pack-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <section
            ref={dialog}
            className="pack-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="pack-heading"
            tabIndex="-1"
            style={{ "--pack-color": pack.color }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.stopPropagation();
                close();
              }
              if (e.key === "Tab") {
                const buttons = dialog.current.querySelectorAll(
                  'button:not(:disabled),select,[tabindex="0"]',
                );
                const first = buttons[0],
                  last = buttons[buttons.length - 1];
                if (!buttons.length) {
                  e.preventDefault();
                  return;
                }
                if (
                  e.shiftKey &&
                  (document.activeElement === first ||
                    document.activeElement === dialog.current)
                ) {
                  e.preventDefault();
                  last.focus();
                } else if (
                  !e.shiftKey &&
                  (document.activeElement === last ||
                    document.activeElement === dialog.current)
                ) {
                  e.preventDefault();
                  first.focus();
                }
              }
            }}
          >
            <button
              className="pack-close"
              aria-label="Close pack"
              disabled={busy}
              onClick={close}
            >
              ×
            </button>
            <header>
              <span className="pack-heading-icon">{pack.value}</span>
              <div>
                <span className="eyebrow">
                  {contents.filter((a) => owned.has(a.id)).length}/
                  {contents.length} COLLECTED
                </span>
                <h2 id="pack-heading">{pack.name}</h2>
                <p>{pack.description}</p>
              </div>
            </header>
            {busy ? (
              <div className="pack-opening" role="status">
                <span>{pack.value}</span>
                <h3>Opening your pack…</h3>
                <p>Your new avatar is on its way.</p>
              </div>
            ) : reveal ? (
              <div
                className="pack-reveal"
                style={{ "--rarity": RARITIES[reveal.rarity].color }}
                role="status"
              >
                <span className="rarity-tag">
                  {RARITIES[reveal.rarity].label} ·{" "}
                  {reveal.duplicate ? "DUPLICATE" : "NEW AVATAR"}
                </span>
                <span className="revealed-character">{reveal.value}</span>
                <h3>{reveal.name}</h3>
                <p>
                  {reveal.duplicate
                    ? `Already collected. ${reveal.refund} coins refunded.`
                    : reveal.rarity === "op"
                      ? "OP avatar unlocked — the OP role is now yours!"
                      : "Added to your collection."}
                </p>
                <button
                  className="btn primary"
                  disabled={user?.avatar === reveal.value}
                  onClick={() =>
                    act(
                      "/profile",
                      "PATCH",
                      { item: reveal.id },
                      "Avatar equipped!",
                    )
                  }
                >
                  {user?.avatar === reveal.value ? "Equipped" : "Equip avatar"}
                </button>
              </div>
            ) : null}
            <div className="pack-buy">
              <div>
                <strong>◉ {pack.price.toLocaleString()} coins</strong>
                <small>
                  {user
                    ? `${user.coins.toLocaleString()} in your balance`
                    : "Sign in to start collecting"}
                </small>
              </div>
              <button
                className="btn primary"
                disabled={busy || !ready || (user && user.coins < pack.price)}
                onClick={open}
              >
                {!ready
                  ? "Pack unavailable"
                  : !user
                    ? "Sign in to open"
                    : user.coins < pack.price
                      ? "Not enough coins"
                      : reveal
                        ? "Open another"
                        : "Open pack"}
              </button>
            </div>
            {error && (
              <p className="market-error" role="alert">
                {error}
              </p>
            )}
            <div className="pack-odds">
              <h3>Opening chances</h3>
              <p>
                Fixed odds on every opening. Previous results and owned avatars
                never change your chances.
              </p>
              <div>
                {odds.map((o) => (
                  <span key={o.rarity} style={{ color: o.color }}>
                    {o.label}
                    <strong>
                      {o.chance === 0
                        ? "0"
                        : o.chance.toFixed(o.chance < 1 ? 2 : 1)}
                      %
                    </strong>
                  </span>
                ))}
              </div>
            </div>
            <h3 className="pack-contents-title">Inside this pack</h3>
            <div className="collection-grid pack-contents">
              {contents.map(card)}
            </div>
          </section>
        </div>
      )}
    </section>
  );
}

export function PackChanceEditor({ items, settings, setSettings, save, busy }) {
  const packs = items.filter((i) => i.type === "pack");
  const chances = (p) =>
    settings.itemOverrides?.[p.id]?.chances ||
    p.chances ||
    DEFAULT_PACK_CHANCES;
  const update = (p, rarity, value) =>
    setSettings((old) => ({
      ...old,
      itemOverrides: {
        ...old.itemOverrides,
        [p.id]: {
          ...old.itemOverrides?.[p.id],
          chances: { ...chances(p), [rarity]: Number(value) },
        },
      },
    }));
  const invalid = packs.some((p) => !validPackChances(chances(p)));
  return (
    <section className="admin-card">
      <h2>Pack opening chances</h2>
      <p>
        Every opening uses these fixed percentages. No pity meter, stacking or
        collection bonus. Each pack must total 100%. Up to two decimal places.
      </p>
      <div className="pack-chance-editor">
        {packs.map((p) => {
          const current = chances(p),
            valid = validPackChances(current);
          return (
            <fieldset key={p.id}>
              <legend>
                {p.value} {p.name}
              </legend>
              <div>
                {Object.entries(RARITIES).map(([rarity, meta]) => (
                  <label key={rarity} style={{ color: meta.color }}>
                    {meta.label}
                    <span>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={current[rarity]}
                        aria-label={p.name + " " + meta.label + " chance"}
                        onChange={(e) => update(p, rarity, e.target.value)}
                      />
                      %
                    </span>
                  </label>
                ))}
              </div>
              <small className={valid ? "" : "market-error"}>
                Total:{" "}
                {Object.values(current)
                  .reduce((sum, v) => sum + Number(v), 0)
                  .toFixed(2)}
                %{valid ? "" : " — must equal 100%"}
              </small>
            </fieldset>
          );
        })}
      </div>
      <button
        className="btn primary"
        disabled={busy || invalid}
        onClick={() => save({ itemOverrides: settings.itemOverrides || {} })}
      >
        Save pack chances
      </button>
    </section>
  );
}
