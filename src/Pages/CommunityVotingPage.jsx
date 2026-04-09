import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Filter,
  LoaderCircle,
  MapPin,
  TrendingUp,
  Vote,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchIssues, toggleIssueVote } from "../services/issueService";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
};

export default function CommunityVotingPage() {
  const navigate = useNavigate();
  const { isSignedIn } = useAuth();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("Active");
  const [sortBy, setSortBy] = useState("Most Votes");
  const [pendingVoteId, setPendingVoteId] = useState(null);

  const loadIssues = async () => {
    setIsLoading(true);

    try {
      const data = await fetchIssues({ sort: "popular", limit: 50 });
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load community issues");
      setIssues([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const categories = useMemo(
    () => ["All", ...new Set(issues.map((issue) => issue.category))],
    [issues]
  );

  const filteredIssues = useMemo(() => {
    return [...issues]
      .filter((issue) =>
        categoryFilter === "All" ? true : issue.category === categoryFilter
      )
      .filter((issue) => {
        if (statusFilter === "All") {
          return true;
        }
        if (statusFilter === "Active") {
          return issue.status === "Pending" || issue.status === "In Progress";
        }
        return issue.status === statusFilter;
      })
      .sort((a, b) => {
        if (sortBy === "Most Votes") {
          return b.upvotes - a.upvotes;
        }
        if (sortBy === "Newest") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        if (sortBy === "Highest Priority") {
          const rank = { High: 3, Medium: 2, Low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        return 0;
      });
  }, [categoryFilter, issues, sortBy, statusFilter]);

  const stats = useMemo(
    () => ({
      totalIssues: issues.length,
      totalVotes: issues.reduce((sum, issue) => sum + (issue.upvotes || 0), 0),
      activeIssues: issues.filter(
        (issue) => issue.status === "Pending" || issue.status === "In Progress"
      ).length,
    }),
    [issues]
  );

  const handleVote = async (issueId) => {
    if (!isSignedIn) {
      toast.error("Login to vote on community issues");
      navigate("/login");
      return;
    }

    setPendingVoteId(issueId);

    try {
      const data = await toggleIssueVote(issueId);
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === issueId ? data.issue : issue
        )
      );
    } catch (error) {
      toast.error(error.message || "Vote could not be recorded");
    } finally {
      setPendingVoteId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-8">
        <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
            Community Prioritization
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Vote on local issues
          </h1>
          <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
            See what other residents are raising, support the issues that matter
            most, and understand which requests are already moving through the
            city workflow.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatCard
              icon={AlertTriangle}
              label="Issues in the feed"
              value={stats.totalIssues}
            />
            <StatCard
              icon={TrendingUp}
              label="Community votes"
              value={stats.totalVotes}
            />
            <StatCard
              icon={CheckCircle2}
              label="Active issues"
              value={stats.activeIssues}
            />
          </div>
        </section>

        <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3 text-slate-700">
              <Filter className="h-5 w-5 text-emerald-600" />
              <span className="font-semibold">Filter community issues</span>
            </div>
            <div className="grid gap-3 md:grid-cols-3">
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

              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {["Active", "All", "Pending", "In Progress", "Resolved", "Rejected"].map(
                  (status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  )
                )}
              </select>

              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value)}
                className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              >
                {["Most Votes", "Newest", "Highest Priority"].map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex min-h-[280px] items-center justify-center rounded-3xl border border-white/80 bg-white/80">
            <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-16 text-center shadow-sm">
            <Vote className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              No issues match these filters
            </h2>
            <p className="mt-2 text-slate-600">
              Try a broader filter or submit a new issue to add it to the
              community queue.
            </p>
          </div>
        ) : (
          <div className="grid gap-5">
            {filteredIssues.map((issue) => (
              <article
                key={issue.id}
                className="rounded-3xl border border-white/80 bg-white/95 p-6 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                        {issue.referenceCode}
                      </span>
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          statusStyles[issue.status] || "bg-slate-100 text-slate-700"
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
                      <span className="rounded-full bg-slate-100 px-3 py-1 font-semibold text-slate-700">
                        {issue.department}
                      </span>
                      <span className="rounded-full bg-orange-100 px-3 py-1 font-semibold text-orange-700">
                        {issue.priority} priority
                      </span>
                    </div>
                  </div>

                  <div className="w-full max-w-[220px] shrink-0 rounded-3xl border border-emerald-100 bg-emerald-50 p-5">
                    <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                      Community support
                    </p>
                    <p className="mt-3 text-4xl font-bold text-emerald-900">
                      {issue.upvotes}
                    </p>
                    <p className="mt-1 text-sm text-emerald-700">votes recorded</p>
                    <button
                      type="button"
                      onClick={() => handleVote(issue.id)}
                      disabled={pendingVoteId === issue.id}
                      className={`mt-5 inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                        issue.hasVoted
                          ? "bg-slate-900 text-white hover:bg-slate-800"
                          : "bg-emerald-600 text-white hover:bg-emerald-700"
                      } disabled:cursor-not-allowed disabled:opacity-70`}
                    >
                      {pendingVoteId === issue.id && (
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                      )}
                      {issue.hasVoted ? "Remove vote" : "Vote for this issue"}
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

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
        </div>
        <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
