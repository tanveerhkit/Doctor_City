import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  Filter,
  Home,
  LoaderCircle,
  LogOut,
  MessageSquare,
  RefreshCw,
  Search,
  Settings,
  Shield,
  Users,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { fetchIssues, updateIssueStatus } from "../services/issueService";

const sidebarMenu = [
  { key: "dashboard", label: "Dashboard", icon: Home, route: "/admin/dashboard" },
  { key: "analytics", label: "Analytics", icon: BarChart3, route: "/admin/analytics" },
  { key: "users", label: "Users", icon: Users, route: "/admin/users" },
  { key: "documents", label: "Documents", icon: FileText, route: "/admin/documents" },
  { key: "notifications", label: "Notifications", icon: Bell, route: "/admin/notifications" },
  { key: "settings", label: "Settings", icon: Settings, route: "/admin/settings" },
];

const statusConfig = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const priorityConfig = {
  High: "bg-rose-100 text-rose-700 border-rose-200",
  Medium: "bg-orange-100 text-orange-700 border-orange-200",
  Low: "bg-slate-100 text-slate-700 border-slate-200",
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { signOut, user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [updatingIssueId, setUpdatingIssueId] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadIssues = async () => {
    setIsRefreshing(true);

    try {
      const data = await fetchIssues({ limit: 100 });
      setIssues(Array.isArray(data) ? data : []);
    } catch (error) {
      toast.error(error.message || "Failed to load issues");
      setIssues([]);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadIssues();
  }, []);

  const filteredIssues = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return issues.filter((issue) => {
      const matchesStatus =
        statusFilter === "All" || issue.status === statusFilter;
      const matchesSearch =
        !normalizedSearch ||
        issue.title.toLowerCase().includes(normalizedSearch) ||
        issue.location.toLowerCase().includes(normalizedSearch) ||
        issue.referenceCode.toLowerCase().includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });
  }, [issues, searchTerm, statusFilter]);

  const stats = useMemo(
    () => ({
      total: issues.length,
      pending: issues.filter((issue) => issue.status === "Pending").length,
      inProgress: issues.filter((issue) => issue.status === "In Progress").length,
      resolved: issues.filter((issue) => issue.status === "Resolved").length,
      rejected: issues.filter((issue) => issue.status === "Rejected").length,
    }),
    [issues]
  );

  const handleStatusChange = async (issueId, nextStatus) => {
    setUpdatingIssueId(issueId);

    try {
      const data = await updateIssueStatus(issueId, nextStatus);
      setIssues((currentIssues) =>
        currentIssues.map((issue) =>
          issue.id === issueId ? data.issue : issue
        )
      );
      toast.success(`Issue marked as ${nextStatus}`);
    } catch (error) {
      toast.error(error.message || "Could not update issue status");
    } finally {
      setUpdatingIssueId(null);
    }
  };

  const handleLogout = () => {
    signOut();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <button
        type="button"
        aria-label="Open sidebar"
        onClick={() => setIsSidebarOpen(true)}
        className="fixed left-4 top-4 z-50 rounded-lg bg-white p-2 text-emerald-600 shadow-lg hover:bg-gray-50 lg:hidden"
        style={{ display: isSidebarOpen ? "none" : "block" }}
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col border-r border-gray-200/50 bg-white/95 shadow-xl backdrop-blur-xl transition-all duration-300 ${
          isSidebarOpen ? "w-64 translate-x-0" : "w-16 -translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center justify-between border-b border-gray-200/50 p-4">
          <div
            className={`flex items-center transition-all duration-300 ${
              isSidebarOpen ? "opacity-100" : "w-0 opacity-0"
            }`}
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg">
              <Shield className="h-4 w-4 text-white" />
            </div>
            {isSidebarOpen && (
              <span className="ml-3 text-xl font-bold text-slate-900">
                Doctor City Admin
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((currentValue) => !currentValue)}
            className={`rounded-lg p-2 transition hover:bg-gray-100 ${
              !isSidebarOpen ? "mx-auto" : ""
            }`}
          >
            {isSidebarOpen ? (
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-600" />
            )}
          </button>
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          {sidebarMenu.map((item) => {
            const Icon = item.icon;
            const isActive = item.route === "/admin/dashboard";

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.route)}
                className={`flex w-full items-center rounded-xl px-3 py-3 text-sm font-medium transition ${
                  isSidebarOpen ? "" : "justify-center"
                } ${
                  isActive && item.key === "dashboard"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-lg"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <Icon
                  className={`h-5 w-5 ${isSidebarOpen ? "mr-3" : ""}`}
                />
                {isSidebarOpen && item.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div className={`transition-all duration-300 ${isSidebarOpen ? "lg:ml-64" : "lg:ml-16"}`}>
        <header className="sticky top-0 z-30 border-b border-green-100 bg-white/70 shadow-sm backdrop-blur-md">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Civic operations dashboard
              </h1>
              <p className="text-sm text-slate-500">
                Signed in as {user?.name || user?.email || "Administrator"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={loadIssues}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-70"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </button>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Total issues" value={stats.total} tone="slate" />
            <MetricCard label="Pending" value={stats.pending} tone="amber" />
            <MetricCard label="In progress" value={stats.inProgress} tone="blue" />
            <MetricCard label="Resolved" value={stats.resolved} tone="emerald" />
            <MetricCard label="Rejected" value={stats.rejected} tone="rose" />
          </section>

          <section className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex flex-col gap-4 sm:flex-row">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Search title, location, reference"
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100 sm:w-72"
                  />
                </div>

                <div className="relative">
                  <Filter className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(event) => setStatusFilter(event.target.value)}
                    className="rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-8 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
                  >
                    {["All", "Pending", "In Progress", "Resolved", "Rejected"].map(
                      (status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      )
                    )}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => toast("Export is not wired in this prototype yet.")}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
            </div>
          </section>

          <section className="overflow-hidden rounded-3xl border border-white/80 bg-white/95 shadow-xl">
            <div className="border-b border-slate-100 px-6 py-5">
              <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-900">
                <MessageSquare className="h-5 w-5 text-emerald-600" />
                Reported issues ({filteredIssues.length})
              </h2>
            </div>

            {isRefreshing && issues.length === 0 ? (
              <div className="flex min-h-[280px] items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredIssues.length === 0 ? (
              <div className="p-12 text-center">
                <MessageSquare className="mx-auto h-10 w-10 text-slate-300" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  No issues found
                </p>
                <p className="mt-1 text-slate-500">
                  Adjust your filters or refresh the queue.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px]">
                  <thead className="bg-slate-50">
                    <tr className="text-left text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                      <th className="px-6 py-4">Issue</th>
                      <th className="px-6 py-4">Location</th>
                      <th className="px-6 py-4">Category</th>
                      <th className="px-6 py-4">Priority</th>
                      <th className="px-6 py-4">Reporter</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredIssues.map((issue) => (
                      <tr key={issue.id} className="align-top hover:bg-slate-50/70">
                        <td className="px-6 py-5">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {issue.title}
                            </p>
                            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-slate-400">
                              {issue.referenceCode}
                            </p>
                            <p className="mt-2 max-w-sm text-sm text-slate-500 line-clamp-2">
                              {issue.description}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          {issue.location}
                        </td>
                        <td className="px-6 py-5">
                          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                            {issue.category}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              priorityConfig[issue.priority] ||
                              "bg-slate-100 text-slate-700 border-slate-200"
                            }`}
                          >
                            {issue.priority}
                          </span>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-600">
                          <p>{issue.reporterName || "Citizen"}</p>
                          {issue.email && (
                            <p className="mt-1 text-xs text-slate-400">{issue.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-5">
                          <select
                            value={issue.status}
                            disabled={updatingIssueId === issue.id}
                            onChange={(event) =>
                              handleStatusChange(issue.id, event.target.value)
                            }
                            className={`rounded-xl border px-3 py-2 text-sm font-semibold outline-none transition ${
                              statusConfig[issue.status] ||
                              "bg-slate-100 text-slate-700 border-slate-200"
                            } disabled:opacity-70`}
                          >
                            {["Pending", "In Progress", "Resolved", "Rejected"].map(
                              (status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              )
                            )}
                          </select>
                        </td>
                        <td className="px-6 py-5 text-sm text-slate-500">
                          {formatDate(issue.createdAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}

function MetricCard({ label, value, tone }) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
    rose: "bg-rose-100 text-rose-800",
  };

  return (
    <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`mt-4 inline-flex rounded-full px-4 py-2 text-3xl font-bold ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
}

