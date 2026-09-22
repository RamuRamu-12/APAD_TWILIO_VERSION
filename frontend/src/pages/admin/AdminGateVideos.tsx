import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useToast } from "../../context/ToastContext";
import { api } from "../../lib/api";
import { extractYoutubeVideoId } from "../../lib/youtube";
import type { GateVideo, GateVideoCatalog, Location } from "../../types/api";

const DEFAULT_URL = "https://youtu.be/7gqCmeALTuk";
const NEW_LOCATION = "__new__";

type VideoForm = {
  youtube_url: string;
  title: string;
  min_watch_seconds: number;
  is_active: boolean;
};

function defaultGlobalForm(): VideoForm {
  return {
    youtube_url: DEFAULT_URL,
    title: "Mastercard — Priceless",
    min_watch_seconds: 5,
    is_active: true,
  };
}

function emptyVideoForm(): VideoForm {
  return {
    youtube_url: "",
    title: "Sponsored message",
    min_watch_seconds: 5,
    is_active: true,
  };
}

function rowToForm(row: GateVideo): VideoForm {
  return {
    youtube_url: row.youtube_url,
    title: row.title,
    min_watch_seconds: row.min_watch_seconds,
    is_active: row.is_active,
  };
}

export default function AdminGateVideos() {
  const { showToast } = useToast();
  const [catalog, setCatalog] = useState<GateVideoCatalog | null>(null);
  const [allLocations, setAllLocations] = useState<Location[]>([]);
  const [rows, setRows] = useState<GateVideo[]>([]);
  const [targetKey, setTargetKey] = useState<string>("*");
  const [newLocationName, setNewLocationName] = useState("");
  const [videoForm, setVideoForm] = useState<VideoForm>(defaultGlobalForm());
  const [saving, setSaving] = useState(false);

  const globalKey = catalog?.global_area_key ?? "*";

  const activeLocations = useMemo(
    () => catalog?.locations ?? [],
    [catalog]
  );

  const inactiveLocations = useMemo(
    () => allLocations.filter((l) => !l.is_active),
    [allLocations]
  );

  const load = useCallback(async () => {
    const [catRes, listRes, locRes] = await Promise.all([
      api.get<GateVideoCatalog>("/api/admin/gate-videos/catalog"),
      api.get<GateVideo[]>("/api/admin/gate-videos"),
      api.get<Location[]>("/api/admin/locations"),
    ]);
    setCatalog(catRes.data);
    setRows(listRes.data);
    setAllLocations(locRes.data);
    return { catalog: catRes.data, list: listRes.data };
  }, []);

  useEffect(() => {
    load().catch(() => showToast("Could not load gate videos", true));
  }, [load, showToast]);

  const applyTargetToForm = useCallback(
    (key: string, list: GateVideo[], gKey: string) => {
      if (key === NEW_LOCATION) {
        setVideoForm(emptyVideoForm());
        return;
      }
      const areaKey = key === gKey ? gKey : activeLocations.find((l) => String(l.id) === key)?.name;
      if (!areaKey) {
        setVideoForm(emptyVideoForm());
        return;
      }
      const row = list.find((r) => r.area.toLowerCase() === areaKey.toLowerCase());
      if (row?.youtube_url?.trim()) {
        setVideoForm(rowToForm(row));
      } else if (key === gKey) {
        setVideoForm(defaultGlobalForm());
      } else {
        setVideoForm(emptyVideoForm());
      }
    },
    [activeLocations]
  );

  useEffect(() => {
    if (!catalog) return;
    applyTargetToForm(targetKey, rows, globalKey);
  }, [targetKey, rows, catalog, globalKey, applyTargetToForm]);

  const saveGateVideo = async (e: FormEvent) => {
    e.preventDefault();
    if (!videoForm.youtube_url.trim()) {
      showToast("YouTube URL is required", true);
      return;
    }
    if (!extractYoutubeVideoId(videoForm.youtube_url)) {
      showToast("Enter a valid YouTube URL", true);
      return;
    }

    let area = globalKey;
    let locationId: number | undefined;

    if (targetKey === NEW_LOCATION) {
      const name = newLocationName.trim();
      if (!name) {
        showToast("Enter a name for the new location", true);
        return;
      }
      setSaving(true);
      try {
        const { data: loc } = await api.post<Location>("/api/admin/locations", { name });
        area = loc.name;
        locationId = loc.id;
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
          "Could not create location";
        showToast(String(msg), true);
        setSaving(false);
        return;
      }
    } else if (targetKey === globalKey) {
      area = globalKey;
    } else {
      const loc = activeLocations.find((l) => String(l.id) === targetKey);
      if (!loc) {
        showToast("Select a valid location", true);
        return;
      }
      area = loc.name;
      locationId = loc.id;
    }

    setSaving(true);
    try {
      await api.put(`/api/admin/gate-videos/${encodeURIComponent(area)}`, {
        ...videoForm,
        location_id: locationId ?? null,
      });
      const label =
        area === globalKey ? "Global default" : area;
      showToast(`Gate video saved for ${label}`);
      setNewLocationName("");
      if (targetKey === NEW_LOCATION && locationId) {
        setTargetKey(String(locationId));
      }
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Save failed";
      showToast(String(msg), true);
    } finally {
      setSaving(false);
    }
  };

  const editSaved = (row: GateVideo) => {
    if (row.area === globalKey) {
      setTargetKey(globalKey);
    } else {
      const loc = activeLocations.find((l) => l.name.toLowerCase() === row.area.toLowerCase());
      if (loc) setTargetKey(String(loc.id));
      else setTargetKey(NEW_LOCATION);
    }
    setVideoForm(rowToForm(row));
  };

  const deactivateLocation = async (location: Location) => {
    if (
      !window.confirm(
        `Deactivate "${location.name}"? It will be hidden from registration. Existing gate video config remains until removed.`
      )
    ) {
      return;
    }
    try {
      await api.patch(`/api/admin/locations/${location.id}`, { is_active: false });
      showToast(`Deactivated ${location.name}`);
      await load();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail ||
        "Could not deactivate";
      showToast(String(msg), true);
    }
  };

  const savedRows = useMemo(() => {
    return rows.filter((r) => r.youtube_url?.trim());
  }, [rows]);

  const targetLabel =
    targetKey === globalKey
      ? "Global default (all users)"
      : targetKey === NEW_LOCATION
        ? newLocationName.trim() || "New location"
        : activeLocations.find((l) => String(l.id) === targetKey)?.name ?? "Location";

  return (
    <div className="animate-fade-in">
      <div className="admin-header">
        <div>
          <h1 style={{ fontSize: "1.75rem", marginBottom: "0.25rem" }}>Gate videos</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem", maxWidth: "640px" }}>
            Choose which location should see a YouTube ad on login and OTP gates, then paste the
            link and save. Users in cities without a custom video get the global default.
          </p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Create or update gate video</h2>
        <form onSubmit={saveGateVideo} className="admin-form-grid">
          <label style={{ gridColumn: "1 / -1" }}>
            Location (audience)
            <select
              className="input-field form-select"
              value={targetKey}
              onChange={(e) => {
                setTargetKey(e.target.value);
                setNewLocationName("");
              }}
            >
              <option value={globalKey}>Global default — all users without a city video</option>
              {activeLocations.map((loc) => (
                <option key={loc.id} value={String(loc.id)}>
                  {loc.name}
                </option>
              ))}
              <option value={NEW_LOCATION}>+ Add new location…</option>
            </select>
          </label>

          {targetKey === NEW_LOCATION && (
            <label style={{ gridColumn: "1 / -1" }}>
              New location name
              <input
                className="input-field"
                placeholder="e.g. Austin"
                value={newLocationName}
                onChange={(e) => setNewLocationName(e.target.value)}
                required
              />
            </label>
          )}

          <label>
            YouTube URL
            <input
              className="input-field"
              value={videoForm.youtube_url}
              onChange={(e) => setVideoForm((f) => ({ ...f, youtube_url: e.target.value }))}
              placeholder={DEFAULT_URL}
              required
            />
          </label>
          <label>
            Title (shown on ad screen)
            <input
              className="input-field"
              value={videoForm.title}
              onChange={(e) => setVideoForm((f) => ({ ...f, title: e.target.value }))}
            />
          </label>
          <label>
            Min watch (seconds)
            <input
              type="number"
              min={1}
              max={600}
              className="input-field"
              value={videoForm.min_watch_seconds}
              onChange={(e) =>
                setVideoForm((f) => ({
                  ...f,
                  min_watch_seconds: Number(e.target.value),
                }))
              }
            />
          </label>
          <div style={{ gridColumn: "1 / -1", display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? "Saving…" : `Save for ${targetLabel}`}
            </button>
            <span className="text-muted" style={{ fontSize: "0.85rem" }}>
              This ad plays for users registered in the selected location.
            </span>
          </div>
        </form>

        {inactiveLocations.length > 0 && (
          <p className="text-muted" style={{ fontSize: "0.8rem", marginTop: "1rem" }}>
            Inactive locations: {inactiveLocations.map((l) => l.name).join(", ")}
          </p>
        )}
      </div>

      <div className="glass-panel" style={{ padding: "1.5rem" }}>
        <h2 style={{ fontSize: "1.1rem", marginBottom: "0.75rem" }}>Saved gate videos</h2>
        {savedRows.length === 0 ? (
          <p className="text-muted">No gate videos saved yet.</p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Location</th>
                  <th>Title</th>
                  <th>YouTube URL</th>
                  <th>Min (s)</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {savedRows.map((row) => {
                  const isGlobal = row.area === globalKey;
                  const loc = activeLocations.find(
                    (l) => l.name.toLowerCase() === row.area.toLowerCase()
                  );
                  return (
                    <tr key={row.id}>
                      <td style={{ fontWeight: 600, whiteSpace: "nowrap" }}>
                        {isGlobal ? "Global default" : row.area}
                        {loc && (
                          <button
                            type="button"
                            className="text-link"
                            style={{
                              display: "block",
                              background: "none",
                              border: "none",
                              fontSize: "0.75rem",
                              padding: 0,
                              cursor: "pointer",
                            }}
                            onClick={() => deactivateLocation(loc)}
                          >
                            Deactivate location
                          </button>
                        )}
                      </td>
                      <td>{row.title}</td>
                      <td style={{ maxWidth: "240px", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {row.youtube_url}
                      </td>
                      <td>{row.min_watch_seconds}</td>
                      <td>
                        <button
                          type="button"
                          className="nav-btn active"
                          style={{ padding: "0.4rem 0.9rem", color: "#000" }}
                          onClick={() => editSaved(row)}
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-muted" style={{ marginTop: "1.5rem", fontSize: "0.85rem" }}>
        Email campaign links still use the Ads Registry. For OTP login flow, gate videos apply.
      </p>
    </div>
  );
}
