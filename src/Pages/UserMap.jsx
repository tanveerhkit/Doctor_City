import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  ArrowLeft,
  Filter,
  Layers,
  LoaderCircle,
  MapPin,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchIssues } from "../services/issueService";

const markerIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/149/149060.png",
  iconSize: [34, 34],
  iconAnchor: [17, 34],
});

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

function FlyToLocation({ position }) {
  const map = useMap();

  useEffect(() => {
    if (position) {
      map.flyTo(position, 13, { duration: 1.2 });
    }
  }, [map, position]);

  return null;
}

export default function UserMap() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [mapView, setMapView] = useState("street");

  useEffect(() => {
    const loadIssues = async () => {
      setIsLoading(true);

      try {
        const data = await fetchIssues({ limit: 100 });
        const mappedIssues = (Array.isArray(data) ? data : []).filter(
          (issue) => issue.coordinates?.lat != null && issue.coordinates?.lng != null
        );
        setIssues(mappedIssues);
        if (mappedIssues[0]) {
          setSelectedIssue(mappedIssues[0]);
        }
      } catch (error) {
        toast.error(error.message || "Unable to load issue map");
        setIssues([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadIssues();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(issues.map((issue) => issue.category))],
    [issues]
  );

  const filteredIssues = useMemo(
    () =>
      issues.filter((issue) => {
        const matchesStatus =
          statusFilter === "All" || issue.status === statusFilter;
        const matchesCategory =
          categoryFilter === "All" || issue.category === categoryFilter;
        return matchesStatus && matchesCategory;
      }),
    [categoryFilter, issues, statusFilter]
  );

  useEffect(() => {
    if (!filteredIssues.length) {
      return;
    }

    if (!selectedIssue || !filteredIssues.some((issue) => issue.id === selectedIssue.id)) {
      setSelectedIssue(filteredIssues[0]);
    }
  }, [filteredIssues, selectedIssue]);

  const mapCenter = selectedIssue?.coordinates
    ? [selectedIssue.coordinates.lat, selectedIssue.coordinates.lng]
    : [12.9716, 77.5946];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-teal-50 px-4 py-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMapView("street")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mapView === "street"
                  ? "bg-emerald-600 text-white"
                  : "bg-white/90 text-slate-700"
              }`}
            >
              Street
            </button>
            <button
              type="button"
              onClick={() => setMapView("satellite")}
              className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                mapView === "satellite"
                  ? "bg-emerald-600 text-white"
                  : "bg-white/90 text-slate-700"
              }`}
            >
              Satellite
            </button>
          </div>
        </div>

        <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Public Issue Map
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Explore civic issues on the map
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            Review the live issue feed geographically. This helps users
            understand where complaints are concentrated and what the city team
            is currently handling.
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-3 shadow-xl">
            {isLoading ? (
              <div className="flex h-[620px] items-center justify-center rounded-[24px] bg-slate-50">
                <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : (
              <div className="h-[620px] overflow-hidden rounded-[24px]">
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    url={
                      mapView === "satellite"
                        ? "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    attribution={
                      mapView === "satellite"
                        ? '&copy; Esri & OpenStreetMap contributors'
                        : '&copy; OpenStreetMap contributors'
                    }
                  />

                  {filteredIssues.map((issue) => (
                    <Marker
                      key={issue.id}
                      position={[issue.coordinates.lat, issue.coordinates.lng]}
                      icon={markerIcon}
                      eventHandlers={{
                        click: () => setSelectedIssue(issue),
                      }}
                    >
                      <Popup>
                        <div className="space-y-2">
                          <p className="font-semibold">{issue.title}</p>
                          <p className="text-sm text-slate-600">{issue.location}</p>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full border px-2 py-1 text-xs font-semibold ${
                                statusStyles[issue.status] || "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {issue.status}
                            </span>
                            <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700">
                              {issue.category}
                            </span>
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                  {selectedIssue?.coordinates && (
                    <FlyToLocation
                      position={[
                        selectedIssue.coordinates.lat,
                        selectedIssue.coordinates.lng,
                      ]}
                    />
                  )}
                </MapContainer>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
              <div className="flex items-center gap-2 text-slate-700">
                <Filter className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">Map filters</span>
              </div>
              <div className="mt-4 grid gap-3">
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {["All", "Pending", "In Progress", "Resolved", "Rejected"].map(
                    (status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )
                  )}
                </select>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value)}
                  className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
              <div className="flex items-center gap-2 text-slate-700">
                <Layers className="h-5 w-5 text-emerald-600" />
                <span className="font-semibold">
                  Showing {filteredIssues.length} mapped issues
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {filteredIssues.slice(0, 6).map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => setSelectedIssue(issue)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedIssue?.id === issue.id
                        ? "border-emerald-300 bg-emerald-50"
                        : "border-slate-200 bg-slate-50 hover:border-emerald-200 hover:bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">
                          {issue.title}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {issue.location}
                        </p>
                      </div>
                      <MapPin className="h-5 w-5 shrink-0 text-emerald-600" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </section>
      </div>
    </div>
  );
}
