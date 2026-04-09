import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  ExternalLink,
  LoaderCircle,
  MapPin,
  Search,
  ThumbsUp,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { fetchIssues } from "../services/issueService";

const statusStyles = {
  Pending:
    "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress":
    "bg-blue-100 text-blue-800 border-blue-200",
  Resolved:
    "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected:
    "bg-rose-100 text-rose-800 border-rose-200",
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

export default function MyComplaints() {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");

  const loadIssues = async () => {
    setIsLoading(true);
    try {
      const data = await fetchIssues({ mine: true });
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load complaints");
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const matchesStatus =
        statusFilter === "All" || issue.status === statusFilter;
      const normalizedSearch = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !normalizedSearch ||
        issue.title.toLowerCase().includes(normalizedSearch) ||
        issue.location.toLowerCase().includes(normalizedSearch) ||
        issue.referenceCode.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [issues, searchTerm, statusFilter]);

  const counts = useMemo(
    () => ({
      total: issues.length,
      pending: issues.filter((issue) => issue.status === "Pending").length,
      inProgress: issues.filter((issue) => issue.status === "In Progress").length,
      resolved: issues.filter((issue) => issue.status === "Resolved").length,
    }),
    [issues]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-teal-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-2xl border border-white bg-white/90 px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={loadIssues}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
            >
              Refresh
            </button>
            <Link
              to="/report-issue"
              className="rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Report another issue
            </Link>
          </div>
        </div>

        <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Complaint Tracker
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">
            My complaints
          </h1>
          <p className="mt-3 max-w-3xl text-slate-600">
            Track the reports you have submitted, monitor status changes, and
            open any complaint to view the full timeline and attachment.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <SummaryCard label="Total reports" value={counts.total} />
            <SummaryCard label="Pending" value={counts.pending} tone="amber" />
            <SummaryCard
              label="In progress"
              value={counts.inProgress}
              tone="blue"
            />
            <SummaryCard
              label="Resolved"
              value={counts.resolved}
              tone="emerald"
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="relative max-w-xl flex-1">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by title, location, or reference code"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {["All", "Pending", "In Progress", "Resolved", "Rejected"].map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => setStatusFilter(status)}
                    className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                      statusFilter === status
                        ? "bg-emerald-600 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {status}
                  </button>
                )
              )}
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/80 bg-white/80">
            <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-16 text-center shadow-sm">
            <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              No complaints found
            </h2>
            <p className="mt-2 text-slate-600">
              Adjust your filters or submit a new civic issue to start tracking
              it here.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredIssues.map((issue) => (
              <article
                key={issue.id}
                className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {issue.referenceCode}
                      </span>
                      <span
                        className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                          statusStyles[issue.status] || "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {issue.status}
                      </span>
                      <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        {issue.category}
                      </span>
                    </div>

                    <div>
                      <h2 className="text-2xl font-bold text-slate-900">
                        {issue.title}
                      </h2>
                      <p className="mt-2 max-w-3xl text-slate-600">
                        {issue.description}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {issue.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(issue.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <ThumbsUp className="h-4 w-4" />
                        {issue.upvotes} community votes
                      </span>
                    </div>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/issues/${issue.id}`)}
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                      View details
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`mt-3 inline-flex rounded-full px-3 py-1 text-2xl font-bold ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
}
