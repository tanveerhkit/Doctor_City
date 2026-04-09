import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  AlertCircle,
  ArrowLeft,
  Clock3,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Tag,
  ThumbsUp,
} from "lucide-react";
import CopyLinkButton from "../components/ui/CopyLinkButton";
import { fetchIssueById } from "../services/issueService";

const statusStyles = {
  Pending: "bg-amber-100 text-amber-800 border-amber-200",
  "In Progress": "bg-blue-100 text-blue-800 border-blue-200",
  Resolved: "bg-emerald-100 text-emerald-800 border-emerald-200",
  Rejected: "bg-rose-100 text-rose-800 border-rose-200",
};

const priorityStyles = {
  Low: "bg-slate-100 text-slate-700",
  Medium: "bg-orange-100 text-orange-700",
  High: "bg-rose-100 text-rose-700",
};

const formatDateTime = (dateValue) =>
  new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(dateValue));

export default function IssueDetail() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [issue, setIssue] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadIssue = async () => {
      setIsLoading(true);
      setError("");

      try {
        const data = await fetchIssueById(id);
        setIssue(data);
      } catch (loadError) {
        setError(loadError.message || "Unable to load issue");
      } finally {
        setIsLoading(false);
      }
    };

    loadIssue();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-emerald-50/60 to-teal-50">
        <LoaderCircle className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-teal-50 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl">
          <AlertCircle className="h-8 w-8 text-rose-600" />
          <h1 className="mt-4 text-3xl font-bold text-slate-900">
            Issue not available
          </h1>
          <p className="mt-2 text-slate-600">
            {error || "This issue could not be found."}
          </p>
          <button
            type="button"
            onClick={() => navigate("/complaints")}
            className="mt-6 rounded-2xl bg-slate-900 px-5 py-3 font-semibold text-white transition hover:bg-slate-800"
          >
            Back to complaints
          </button>
        </div>
      </div>
    );
  }

  const isImageAttachment = Boolean(
    issue.fileUrl && issue.fileUrl.match(/\.(png|jpe?g|gif|webp|svg)(\?|$)/i)
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
          <CopyLinkButton />
        </div>

        <section className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-white/80 bg-white/95 p-8 shadow-xl">
            <div className="flex flex-wrap items-center gap-3">
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
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  priorityStyles[issue.priority] || "bg-slate-100 text-slate-700"
                }`}
              >
                {issue.priority} priority
              </span>
            </div>

            <h1 className="mt-5 text-4xl font-bold text-slate-900">
              {issue.title}
            </h1>
            <p className="mt-4 text-lg leading-8 text-slate-600">
              {issue.description}
            </p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <MetaCard
                icon={MapPin}
                label="Location"
                value={issue.location}
              />
              <MetaCard
                icon={Tag}
                label="Department"
                value={issue.department}
              />
              <MetaCard
                icon={Clock3}
                label="Created"
                value={formatDateTime(issue.createdAt)}
              />
              <MetaCard
                icon={ThumbsUp}
                label="Community support"
                value={`${issue.upvotes} votes`}
              />
            </div>

            {issue.fileUrl && (
              <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                  Attachment
                </p>
                {isImageAttachment ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white">
                    <img
                      src={issue.fileUrl}
                      alt={issue.title}
                      className="max-h-[420px] w-full object-cover"
                    />
                  </div>
                ) : (
                  <a
                    href={issue.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Open attachment
                  </a>
                )}
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="rounded-3xl border border-white/80 bg-white/95 p-7 shadow-lg">
              <h2 className="text-xl font-bold text-slate-900">
                Status timeline
              </h2>
              <div className="mt-6 space-y-5">
                {issue.statusHistory?.map((entry, index) => (
                  <div key={`${entry.status}-${index}`} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="h-3 w-3 rounded-full bg-emerald-500" />
                      {index < issue.statusHistory.length - 1 && (
                        <div className="mt-2 h-full w-px bg-slate-200" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="font-semibold text-slate-900">
                        {entry.status}
                      </p>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {entry.note || "Status updated"}
                      </p>
                      <p className="mt-2 text-xs uppercase tracking-[0.16em] text-slate-400">
                        {entry.changedByRole} • {formatDateTime(entry.changedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {(issue.email || issue.phone || issue.reporterName) && (
              <div className="rounded-3xl border border-white/80 bg-white/95 p-7 shadow-lg">
                <h2 className="text-xl font-bold text-slate-900">
                  Reporter details
                </h2>
                <div className="mt-5 space-y-4 text-sm text-slate-600">
                  {issue.reporterName && (
                    <MetaLine label="Name" value={issue.reporterName} />
                  )}
                  {issue.email && (
                    <MetaLine icon={Mail} label="Email" value={issue.email} />
                  )}
                  {issue.phone && (
                    <MetaLine icon={Phone} label="Phone" value={issue.phone} />
                  )}
                </div>
              </div>
            )}
          </aside>
        </section>
      </div>
    </div>
  );
}

function MetaCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-white p-2 text-emerald-700 shadow-sm">
          <Icon className="h-4 w-4" />
        </div>
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="font-semibold text-slate-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function MetaLine({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3">
      {Icon ? (
        <div className="mt-0.5 rounded-lg bg-slate-100 p-2 text-slate-600">
          <Icon className="h-4 w-4" />
        </div>
      ) : null}
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-slate-400">
          {label}
        </p>
        <p className="font-semibold text-slate-800">{value}</p>
      </div>
    </div>
  );
}
