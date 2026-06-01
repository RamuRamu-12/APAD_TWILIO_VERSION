import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PhoneInput from "../../components/ui/PhoneInput";
import {
  IconArrowRight,
  IconCalendar,
  IconCheck,
  IconCheckCircle,
  IconGender,
  IconLocation,
  IconMail,
  IconPhone,
  IconStepCheck,
  IconUser,
} from "../../components/ui/FormIcons";
import { useToast } from "../../context/ToastContext";
import { apiPublic } from "../../lib/api";
import { config } from "../../lib/config";
import {
  INTEREST_CATEGORIES,
  LOCATION_OPTIONS,
  saveInterests,
} from "../../lib/uiPrefs";

export default function Register() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    email: "",
    age: "",
    gender: "male",
    area: LOCATION_OPTIONS[0],
  });
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const isNameValid = form.name.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim());
  const isMobileValid = form.mobile.trim().length >= 8;
  const isAgeValid = () => {
    const n = parseInt(form.age, 10);
    return !isNaN(n) && n >= 1 && n <= 120;
  };
  const step1Valid = isNameValid && isEmailValid && isMobileValid && isAgeValid();

  const handleNextStep = () => {
    if (!isNameValid) {
      showToast("Please enter a valid full name (minimum 2 characters)", true);
      return;
    }
    if (!isEmailValid) {
      showToast("Please enter a valid email address", true);
      return;
    }
    if (!isMobileValid) {
      showToast("Please enter a valid mobile number", true);
      return;
    }
    if (!isAgeValid()) {
      showToast("Please enter a valid age (between 1 and 120)", true);
      return;
    }
    setStep(2);
  };

  const togglePref = (name: string) => {
    setSelectedPrefs((prev) =>
      prev.includes(name) ? prev.filter((c) => c !== name) : [...prev, name]
    );
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!step1Valid) {
      setStep(1);
      showToast("Please correct your details on Step 1", true);
      return;
    }
    setLoading(true);
    try {
      saveInterests(selectedPrefs);
      await apiPublic.post("/api/register", {
        name: form.name.trim(),
        mobile: form.mobile,
        email: form.email.trim(),
        age: Number(form.age),
        gender: form.gender,
        area: form.area,
      });
      showToast("Registration successful! Please sign in.", false);
      navigate("/login", { state: { mobile: form.mobile } });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail || "Registration failed";
      showToast(String(msg), true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="glass-panel animate-fade-in"
      style={{ maxWidth: "520px", margin: "2rem auto", position: "relative" }}
    >
      <h1
        className="form-title"
        style={{
          background: "var(--gradient-neon)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          display: "inline-block",
          width: "100%",
        }}
      >
        {config.appName}
      </h1>
      <p className="form-subtitle">
        Create your account to access secure sign-in and offers matched to your profile
      </p>

      <div className="stepper-container">
        <div className="stepper-line">
          <div className="stepper-line-fill" style={{ width: step === 1 ? "0%" : "100%" }} />
        </div>
        <div
          className={`step-item ${step === 1 ? "active" : "completed"}`}
          onClick={() => setStep(1)}
          onKeyDown={() => {}}
          role="button"
          tabIndex={0}
        >
          <div className="step-circle">
            {step > 1 ? <IconStepCheck /> : "1"}
          </div>
          <span className="step-label">Profile</span>
        </div>
        <div
          className={`step-item ${step === 2 ? "active" : ""}`}
          onClick={() => {
            if (step1Valid) setStep(2);
          }}
          onKeyDown={() => {}}
          role="button"
          tabIndex={0}
        >
          <div className="step-circle">2</div>
          <span className="step-label">Interests</span>
        </div>
      </div>

      <form onSubmit={submit} noValidate>
        {step === 1 && (
          <div className="step-slide">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name
              </label>
              <div className="input-with-icon">
                <input
                  id="name"
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
                <span className="input-icon-left">
                  <IconUser />
                </span>
                {isNameValid && (
                  <span className="input-icon-right-validation">
                    <IconCheck />
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Mobile</label>
              <div className="input-with-icon">
                <PhoneInput
                  value={form.mobile}
                  onChange={(mobile) => setForm({ ...form, mobile })}
                  required
                />
                <span className="input-icon-left" style={{ top: "50%", transform: "translateY(-50%)" }}>
                  <IconPhone />
                </span>
                {isMobileValid && (
                  <span className="input-icon-right-validation">
                    <IconCheck />
                  </span>
                )}
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email
              </label>
              <div className="input-with-icon">
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
                <span className="input-icon-left">
                  <IconMail />
                </span>
                {isEmailValid && (
                  <span className="input-icon-right-validation">
                    <IconCheck />
                  </span>
                )}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "1rem" }}>
              <div className="form-group">
                <label htmlFor="age" className="form-label">
                  Age
                </label>
                <div className="input-with-icon">
                  <input
                    id="age"
                    type="number"
                    className="form-input"
                    placeholder="e.g. 25"
                    min={1}
                    max={120}
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    required
                  />
                  <span className="input-icon-left">
                    <IconCalendar />
                  </span>
                  {isAgeValid() && (
                    <span className="input-icon-right-validation">
                      <IconCheck />
                    </span>
                  )}
                </div>
              </div>
              <div className="form-group">
                <label htmlFor="gender" className="form-label">
                  Gender
                </label>
                <div className="input-with-icon">
                  <select
                    id="gender"
                    className="form-input form-select"
                    value={form.gender}
                    onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                  <span className="input-icon-left">
                    <IconGender />
                  </span>
                </div>
              </div>
            </div>

            <button type="button" className="submit-btn" onClick={handleNextStep} style={{ width: "100%" }}>
              Continue to Interests
              <IconArrowRight />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="step-slide">
            <div className="form-group">
              <label htmlFor="location" className="form-label">
                Location
              </label>
              <div className="input-with-icon">
                <select
                  id="location"
                  className="form-input form-select"
                  value={form.area}
                  onChange={(e) => setForm({ ...form, area: e.target.value })}
                >
                  {LOCATION_OPTIONS.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
                <span className="input-icon-left">
                  <IconLocation />
                </span>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: "1.75rem" }}>
              <label className="form-label">Interests & Preferences (Optional)</label>
              <p className="text-muted" style={{ fontSize: "0.825rem", marginBottom: "0.75rem" }}>
                Select the topics you care about so we can tailor your experience.
              </p>
              <div className="interests-grid">
                {INTEREST_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => togglePref(cat.name)}
                    className={`interest-pill ${selectedPrefs.includes(cat.name) ? "selected" : ""}`}
                    style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}
                  >
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="step-action-row">
              <button type="button" className="back-btn" onClick={() => setStep(1)}>
                Back
              </button>
              <button type="submit" className="submit-btn" style={{ marginTop: 0 }} disabled={loading}>
                {loading ? "Creating account…" : "Create account"}
                <IconCheckCircle />
              </button>
            </div>
          </div>
        )}
      </form>

      <div
        style={{
          marginTop: "1.5rem",
          textAlign: "center",
          borderTop: "1px solid var(--glass-border)",
          paddingTop: "1.25rem",
        }}
      >
        <Link to="/admin/login" className="text-link" style={{ fontSize: "0.875rem", fontWeight: 600 }}>
          Go to Admin Console
        </Link>
      </div>
    </div>
  );
}
