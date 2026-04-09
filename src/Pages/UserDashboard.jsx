import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  BookOpen,
  Clock3,
  FileText,
  HeartHandshake,
  LayoutDashboard,
  ListChecks,
  LoaderCircle,
  MapPin,
  MessageCircle,
  Search,
  Shield,
  ThumbsUp,
  User,
  Wrench,
} from "lucide-react";
import { fetchIssues } from "../services/issueService";
import { useAuth } from "../context/AuthContext";

const serviceSections = [
  {
    title: "Core actions",
    items: [
      {
        title: "File a complaint",
        description: "Submit a new civic issue with location, priority, and attachment.",
        route: "/report-issue",
        icon: FileText,
      },
      {
        title: "My complaints",
        description: "Track the issues you have already submitted.",
        route: "/complaints",
        icon: ListChecks,
      },
      {
        title: "Community voting",
        description: "Support the local issues your area wants prioritized.",
        route: "/community-voting",
        icon: ThumbsUp,
      },
      {
        title: "Issue map",
        description: "Explore reported issues geographically across the city.",
        route: "/user-map",
        icon: MapPin,
      },
    ],
  },
  {
    title: "Useful services",
    items: [
      {
        title: "Nearby services",
        description: "Find hospitals, police stations, and fire services near you.",
        route: "/nearby-services",
        icon: Shield,
      },
      {
        title: "Lost & found",
        description: "Post or search for missing items in the community.",
        route: "/lost-found",
        icon: Search,
      },
      {
        title: "Community chat",
        description: "Coordinate local efforts and share updates with residents.",
        route: "/chatroom",
        icon: MessageCircle,
      },
      {
        title: "Resources",
        description: "Review complaint guidance, rights, and emergency contacts.",
        route: "/resources",
        icon: BookOpen,
      },
    ],
  },
  {
    title: "Account & help",
    items: [
      {
        title: "Profile",
        description: "Manage your account details and personal information.",
        route: "/profile",
        icon: User,
      },
      {
        title: "Contact support",
        description: "Send feedback, support requests, or feature suggestions.",
        route: "/contact",
        icon: HeartHandshake,
      },
      {
        title: "Civic education",
        description: "Understand how civic processes and public participation work.",
        route: "/civic-education",
        icon: LayoutDashboard,
      },
      {
        title: "Emergency SOS",
        description: "Quickly access emergency support flows and essential actions.",
        route: "/sos",
        icon: AlertTriangle,
      },
    ],
  },
];

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800",
  "In Progress": "bg-blue-100 text-blue-800",
  Resolved: "bg-emerald-100 text-emerald-800",
  Rejected: "bg-rose-100 text-rose-800",
};

const formatDate = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(dateValue));

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);

      try {
        const data = await fetchIssues({ mine: true, limit: 20 });
        setIssues(Array.isArray(data) ? data : []);
      } catch (error) {
        setIssues([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, []);

  const filteredSections = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return serviceSections;
    }

    return serviceSections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            item.title.toLowerCase().includes(normalizedSearch) ||
            item.description.toLowerCase().includes(normalizedSearch)
        ),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchTerm]);

  const stats = useMemo(
    () => ({
      total: issues.length,
      pending: issues.filter((issue) => issue.status === "Pending").length,
      inProgress: issues.filter((issue) => issue.status === "In Progress").length,
      resolved: issues.filter((issue) => issue.status === "Resolved").length,
    }),
    [issues]
  );

  const recentUpdates = useMemo(
    () => issues.slice(0, 3),
    [issues]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50/70 to-teal-50 px-4 py-10">
      <div className="mx-auto max-w-7xl space-y-8">
        <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Citizen Workspace
              </p>
              <h1 className="mt-2 text-4xl font-bold text-slate-900">
                Welcome back{user?.name ? `, ${user.name}` : ""}
              </h1>
              <p className="mt-3 max-w-3xl text-lg leading-8 text-slate-600">
                Use Doctor City to report problems, follow status updates, support
                community priorities, and discover nearby services.
              </p>
            </div>

            <button
              type="button"
              onClick={() => navigate("/report-issue")}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              <Wrench className="h-4 w-4" />
              Report an issue
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-4">
            <DashboardStat label="My reports" value={stats.total} />
            <DashboardStat label="Pending" value={stats.pending} tone="amber" />
            <DashboardStat
              label="In progress"
              value={stats.inProgress}
              tone="blue"
            />
            <DashboardStat
              label="Resolved"
              value={stats.resolved}
              tone="emerald"
            />
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  Recent issue activity
                </h2>
                <p className="mt-1 text-slate-500">
                  The latest updates from your complaint tracker
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate("/complaints")}
                className="rounded-2xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View all
              </button>
            </div>

            {isLoading ? (
              <div className="flex min-h-[220px] items-center justify-center">
                <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
              </div>
            ) : recentUpdates.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
                <FileText className="mx-auto h-10 w-10 text-slate-400" />
                <p className="mt-4 text-lg font-semibold text-slate-900">
                  No reports yet
                </p>
                <p className="mt-2 text-slate-500">
                  Start with your first issue report to see live activity here.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-4">
                {recentUpdates.map((issue) => (
                  <button
                    key={issue.id}
                    type="button"
                    onClick={() => navigate(`/issues/${issue.id}`)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-emerald-200 hover:bg-white"
                  >
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
                    </div>
                    <h3 className="mt-3 text-xl font-bold text-slate-900">
                      {issue.title}
                    </h3>
                    <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                      <span className="inline-flex items-center gap-2">
                        <MapPin className="h-4 w-4" />
                        {issue.location}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Clock3 className="h-4 w-4" />
                        {formatDate(issue.createdAt)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-3xl border border-white/80 bg-white/90 p-6 shadow-lg">
            <h2 className="text-2xl font-bold text-slate-900">
              Find a service
            </h2>
            <p className="mt-1 text-slate-500">
              Search the available prototype services
            </p>
            <div className="relative mt-5">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search dashboard features"
                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-12 pr-4 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
              />
            </div>
            <div className="mt-6 rounded-2xl border border-emerald-100 bg-emerald-50 p-5">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-700">
                How to use the prototype
              </p>
              <div className="mt-4 space-y-3 text-sm leading-6 text-emerald-800">
                <p>1. File an issue and attach a photo or detected location.</p>
                <p>2. Track it in My Complaints and open the detail timeline.</p>
                <p>3. View it on the map and support other issues through voting.</p>
              </div>
            </div>
          </div>
        </section>

        {filteredSections.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm">
            <Search className="mx-auto h-10 w-10 text-slate-400" />
            <h2 className="mt-4 text-2xl font-bold text-slate-900">
              No matching services
            </h2>
            <p className="mt-2 text-slate-600">
              Try a broader term to explore the available prototype flows.
            </p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <section key={section.title} className="space-y-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">
                  {section.title}
                </h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
                {section.items.map((item) => (
                  <ServiceCard
                    key={item.title}
                    {...item}
                    onClick={() => navigate(item.route)}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

function DashboardStat({ label, value, tone = "slate" }) {
  const toneClasses = {
    slate: "bg-slate-100 text-slate-800",
    amber: "bg-amber-100 text-amber-800",
    blue: "bg-blue-100 text-blue-800",
    emerald: "bg-emerald-100 text-emerald-800",
  };

  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5">
      <p className="text-sm text-slate-500">{label}</p>
      <div className={`mt-4 inline-flex rounded-full px-4 py-2 text-3xl font-bold ${toneClasses[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function ServiceCard({ title, description, icon: Icon, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group rounded-3xl border border-white/80 bg-white/95 p-6 text-left shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-lg transition group-hover:scale-105">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="mt-5 text-xl font-bold text-slate-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </button>
  );
}

