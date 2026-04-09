import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  LoaderCircle,
  Mail,
  MapPin,
  MessageSquare,
  Phone,
  ShieldCheck,
  Upload,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { useAuth } from "../context/AuthContext";
import { createIssue } from "../services/issueService";

const categories = [
  "Roads",
  "Lighting",
  "Water",
  "Waste",
  "Safety",
  "Public Spaces",
  "Transport",
  "Other",
];

const priorities = ["Low", "Medium", "High"];

const initialFormState = {
  title: "",
  description: "",
  phone: "",
  email: "",
  location: "",
  reporterName: "",
  category: "Roads",
  priority: "Medium",
  notifyByEmail: true,
};

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phonePattern = /^\+?[0-9\s-]{7,20}$/;

const reverseGeocode = async (latitude, longitude) => {
  const response = await fetch(
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`
  );
  const data = await response.json();
  return data.display_name || `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
};

const getErrorMessage = (field, value) => {
  const normalizedValue =
    typeof value === "string" ? value.trim() : value;

  if (field === "title" && !normalizedValue) {
    return "Issue title is required.";
  }

  if (field === "description") {
    if (!normalizedValue) {
      return "Description is required.";
    }
    if (normalizedValue.length < 20) {
      return "Description must be at least 20 characters.";
    }
  }

  if (field === "location" && !normalizedValue) {
    return "Location is required.";
  }

  if (field === "email") {
    if (!normalizedValue) {
      return "Email is required.";
    }
    if (!emailPattern.test(normalizedValue)) {
      return "Enter a valid email address.";
    }
  }

  if (field === "phone" && normalizedValue && !phonePattern.test(normalizedValue)) {
    return "Enter a valid phone number.";
  }

  return null;
};

export default function ReportIssue() {
  const navigate = useNavigate();
  const { user, isSignedIn } = useAuth();
  const [formData, setFormData] = useState(initialFormState);
  const [coordinates, setCoordinates] = useState({ lat: null, lng: null });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDetectingLocation, setIsDetectingLocation] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submittedIssue, setSubmittedIssue] = useState(null);

  useEffect(() => {
    if (!user) {
      return;
    }

    setFormData((currentState) => ({
      ...currentState,
      email: currentState.email || user.email || "",
      reporterName: currentState.reporterName || user.name || "",
    }));
  }, [user]);

  const summaryItems = useMemo(
    () => [
      {
        label: "Assigned department",
        value:
          formData.category === "Roads"
            ? "Road Maintenance"
            : formData.category === "Lighting"
            ? "Electrical Services"
            : formData.category === "Water"
            ? "Water Board"
            : formData.category === "Waste"
            ? "Sanitation"
            : formData.category === "Safety"
            ? "Public Safety"
            : formData.category === "Public Spaces"
            ? "Parks & Recreation"
            : formData.category === "Transport"
            ? "Traffic Management"
            : "Civic Operations",
      },
      { label: "Priority", value: formData.priority },
      {
        label: "Notifications",
        value: formData.notifyByEmail ? "Email updates enabled" : "Dashboard only",
      },
    ],
    [formData.category, formData.notifyByEmail, formData.priority]
  );

  const updateField = (field, value) => {
    setFormData((currentState) => ({
      ...currentState,
      [field]: value,
    }));

    setErrors((currentErrors) => ({
      ...currentErrors,
      [field]: getErrorMessage(field, value),
    }));
  };

  const detectLocation = async () => {
    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }

    setIsDetectingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = await reverseGeocode(latitude, longitude);
          setCoordinates({ lat: latitude, lng: longitude });
          updateField("location", location);
          toast.success("Location detected");
        } catch (error) {
          const fallbackLocation = `${position.coords.latitude.toFixed(
            5
          )}, ${position.coords.longitude.toFixed(5)}`;
          setCoordinates({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          updateField("location", fallbackLocation);
          toast.success("Using raw coordinates for location");
        } finally {
          setIsDetectingLocation(false);
        }
      },
      () => {
        setIsDetectingLocation(false);
        toast.error("We couldn't detect your location.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  const validateForm = () => {
    const nextErrors = {
      title: getErrorMessage("title", formData.title),
      description: getErrorMessage("description", formData.description),
      location: getErrorMessage("location", formData.location),
      email: getErrorMessage("email", formData.email),
      phone: getErrorMessage("phone", formData.phone),
    };

    setErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }

    const payload = new FormData();
    payload.append("title", formData.title.trim());
    payload.append("description", formData.description.trim());
    payload.append("phone", formData.phone.trim());
    payload.append("email", formData.email.trim());
    payload.append("location", formData.location.trim());
    payload.append("reporterName", formData.reporterName.trim());
    payload.append("category", formData.category);
    payload.append("priority", formData.priority);
    payload.append("notifyByEmail", String(formData.notifyByEmail));

    if (coordinates.lat != null && coordinates.lng != null) {
      payload.append("lat", String(coordinates.lat));
      payload.append("lng", String(coordinates.lng));
    }

    if (selectedFile) {
      payload.append("file", selectedFile);
    }

    setIsSubmitting(true);

    try {
      const data = await createIssue(payload);
      setSubmittedIssue(data.issue);
      setSelectedFile(null);
      setFormData({
        ...initialFormState,
        email: user?.email || "",
        reporterName: user?.name || "",
      });
      setCoordinates({ lat: null, lng: null });
      setErrors({});
      toast.success("Issue submitted successfully");
    } catch (error) {
      toast.error(error.message || "Failed to submit issue");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 px-6 py-20">
        <div className="mx-auto max-w-3xl rounded-3xl border border-emerald-100 bg-white/90 p-10 shadow-xl">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100">
            <ShieldCheck className="h-7 w-7 text-emerald-700" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">
            Sign in to report a civic issue
          </h1>
          <p className="mt-3 text-lg text-slate-600">
            Reporting is tied to your dashboard so you can track updates, status
            history, and community support in one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-4">
            <Link
              to="/login"
              className="rounded-xl bg-emerald-600 px-5 py-3 font-semibold text-white transition hover:bg-emerald-700"
            >
              Login
            </Link>
            <Link
              to="/signup"
              className="rounded-xl border border-emerald-200 px-5 py-3 font-semibold text-emerald-700 transition hover:bg-emerald-50"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50/60 to-teal-50 px-4 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-white/80 bg-white/90 p-8 shadow-xl shadow-emerald-100/50 backdrop-blur-sm">
          <div className="mb-8 flex items-start justify-between gap-4">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                Civic Reporting
              </p>
              <h1 className="text-3xl font-bold text-slate-900">
                Report a local issue
              </h1>
              <p className="mt-3 max-w-2xl text-slate-600">
                Submit a city problem with location, priority, and supporting
                context. The report will appear in your complaint tracker,
                admin queue, and community voting feed.
              </p>
            </div>
            <button
              type="button"
              onClick={detectLocation}
              disabled={isDetectingLocation}
              className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isDetectingLocation ? "Detecting..." : "Use My Location"}
            </button>
          </div>

          {submittedIssue && (
            <div className="mb-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-6 w-6 text-emerald-600" />
                <div className="flex-1">
                  <p className="font-semibold text-emerald-800">
                    Issue submitted
                  </p>
                  <p className="mt-1 text-sm text-emerald-700">
                    Reference code:{" "}
                    <span className="font-mono font-semibold">
                      {submittedIssue.referenceCode}
                    </span>
                  </p>
                  <div className="mt-4 flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => navigate(`/issues/${submittedIssue.id}`)}
                      className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      View report
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/complaints")}
                      className="rounded-xl border border-emerald-200 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-white"
                    >
                      Open my complaints
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              <Field
                id="reporterName"
                label="Reporter name"
                icon={FileText}
                value={formData.reporterName}
                onChange={(value) => updateField("reporterName", value)}
              />
              <Field
                id="email"
                label="Email address"
                icon={Mail}
                type="email"
                value={formData.email}
                error={errors.email}
                onChange={(value) => updateField("email", value)}
              />
              <Field
                id="phone"
                label="Phone number"
                icon={Phone}
                type="tel"
                value={formData.phone}
                error={errors.phone}
                onChange={(value) => updateField("phone", value)}
              />
              <SelectField
                id="category"
                label="Issue category"
                value={formData.category}
                options={categories}
                onChange={(value) => updateField("category", value)}
              />
              <SelectField
                id="priority"
                label="Priority"
                value={formData.priority}
                options={priorities}
                onChange={(value) => updateField("priority", value)}
              />
              <label className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={formData.notifyByEmail}
                  onChange={(event) =>
                    updateField("notifyByEmail", event.target.checked)
                  }
                  className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                Email me when the status changes
              </label>
            </div>

            <Field
              id="title"
              label="Issue title"
              icon={FileText}
              value={formData.title}
              error={errors.title}
              placeholder="Example: Streetlight out near school gate"
              onChange={(value) => updateField("title", value)}
            />

            <TextAreaField
              id="description"
              label="Detailed description"
              icon={MessageSquare}
              value={formData.description}
              error={errors.description}
              placeholder="Describe what is happening, when it started, and anything that makes it urgent."
              onChange={(value) => updateField("description", value)}
            />

            <Field
              id="location"
              label="Location"
              icon={MapPin}
              value={formData.location}
              error={errors.location}
              placeholder="Auto-detect or enter a precise landmark"
              onChange={(value) => updateField("location", value)}
            />

            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5">
              <label className="block text-sm font-semibold text-slate-800">
                Attachment
              </label>
              <p className="mt-1 text-sm text-slate-500">
                Upload a photo or screenshot if it helps describe the issue.
              </p>
              <label className="mt-4 flex cursor-pointer items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-4 transition hover:border-emerald-300">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                    <Upload className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {selectedFile ? selectedFile.name : "Choose a file"}
                    </p>
                    <p className="text-xs text-slate-500">
                      JPG, PNG, PDF or screenshot
                    </p>
                  </div>
                </div>
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) =>
                    setSelectedFile(event.target.files?.[0] || null)
                  }
                />
              </label>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting && <LoaderCircle className="h-4 w-4 animate-spin" />}
                Submit issue
              </button>
              <button
                type="button"
                onClick={() => navigate("/complaints")}
                className="rounded-2xl border border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                View my complaints
              </button>
            </div>
          </form>
        </section>

        <aside className="space-y-6">
          <div className="rounded-3xl border border-white/70 bg-slate-900 p-7 text-white shadow-xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
              Submission Summary
            </p>
            <div className="mt-6 space-y-4">
              {summaryItems.map((item) => (
                <div
                  key={item.label}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <p className="text-sm text-slate-300">{item.label}</p>
                  <p className="mt-1 font-semibold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-emerald-100 bg-white/90 p-7 shadow-lg">
            <h2 className="text-xl font-bold text-slate-900">What happens next</h2>
            <div className="mt-5 space-y-4">
              {[
                "Your issue enters the admin review queue immediately.",
                "Open issues can receive community support in the voting section.",
                "Every status change is logged in your complaint timeline.",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3">
                  <div className="mt-1 rounded-full bg-emerald-100 p-1 text-emerald-700">
                    <CheckCircle2 className="h-4 w-4" />
                  </div>
                  <p className="text-sm leading-6 text-slate-600">{item}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5 text-amber-700" />
              <div>
                <p className="font-semibold text-amber-900">Prototype note</p>
                <p className="mt-1 text-sm leading-6 text-amber-800">
                  Reports are fully trackable in this prototype. If you add a
                  photo without cloud storage configured, the app stores it on
                  the local backend so the flow still works end to end.
                </p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Field({
  id,
  label,
  icon: Icon,
  type = "text",
  value,
  error,
  placeholder,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      <div
        className={`flex items-center gap-3 rounded-2xl border bg-white px-4 py-3 transition ${
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100"
        }`}
      >
        <Icon className="h-5 w-5 text-slate-400" />
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          className="w-full bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function TextAreaField({
  id,
  label,
  icon: Icon,
  value,
  error,
  placeholder,
  onChange,
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      <div
        className={`rounded-2xl border bg-white px-4 py-3 transition ${
          error
            ? "border-red-300 ring-2 ring-red-100"
            : "border-slate-200 focus-within:border-emerald-300 focus-within:ring-2 focus-within:ring-emerald-100"
        }`}
      >
        <div className="mb-2 flex items-center gap-3">
          <Icon className="h-5 w-5 text-slate-400" />
          <span className="text-sm text-slate-500">Provide enough detail for the city team to act</span>
        </div>
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          rows={5}
          className="w-full resize-none bg-transparent text-slate-900 outline-none placeholder:text-slate-400"
        />
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </label>
  );
}

function SelectField({ id, label, value, options, onChange }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-slate-800">
        {label}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 outline-none transition focus:border-emerald-300 focus:ring-2 focus:ring-emerald-100"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
