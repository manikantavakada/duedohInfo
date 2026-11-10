import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileUp, Loader2, MapPin, ShieldCheck } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { Field } from "../components/Field.jsx";
import { api } from "../api.js";

const STORAGE_KEY = "duedoh-info-registration";
const languages = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Urdu"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const vehiclePhotoTypes = ["vehicle_front", "vehicle_side", "vehicle_rear", "vehicle_interior"];
const initialForm = {
  fullName: "", email: "", otp: "", phone: "", dob: "", cityId: "", qualification: "", bio: "", languages: [], experienceYears: "",
  tier: "lite", vehicleType: "bike", brand: "", model: "", vehicleNumber: "", seatCount: "", licenceExpiry: "", rcExpiry: "",
  weeklyDays: [0, 1, 2, 3, 4], serviceLatitude: null, serviceLongitude: null,
  idType: "pan", panNumber: "", aadhaarNumber: "", payoutType: "upi", upiId: "", bankAccountNo: "", bankIfsc: "", bankHolderName: "",
};

function persistedForm() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
    // Drop retired time slots from applications saved by the old website.
    return Object.fromEntries(Object.entries(initialForm).map(([key, value]) => [key, saved?.[key] ?? value]));
  }
  catch { return initialForm; }
}

function FileField({ label, value, onChange, hint, accept = "image/*,application/pdf", existing }) {
  const ref = useRef(null);
  const locked = existing && existing.verification_status !== "rejected";
  const previousReason = existing?.rejection_reason;
  return <div>
    <span className="label">{label}</span>
    <button type="button" disabled={locked} onClick={() => ref.current?.click()} className={`flex min-h-20 w-full overflow-hidden gap-3 rounded-xl border border-dashed p-3 text-left ${existing?.verification_status === "rejected" ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"} ${locked ? "cursor-default" : "hover:border-orange"}`}>
      <span className="grid size-11 place-items-center rounded-lg bg-orange-soft text-orange"><FileUp size={20} /></span>
      <span className="min-w-0 flex-1"><span className="block break-words text-sm font-semibold text-navy">{value?.name || (existing ? `${existing.label} already uploaded` : "Choose a clear image or PDF")}</span><span className="mt-0.5 block text-xs text-slate-500">{existing?.verification_status === "approved" ? "Approved — no action needed" : locked ? (previousReason ? "Replacement uploaded — awaiting review" : "Uploaded — awaiting review") : hint || "JPG, PNG, or PDF up to 15 MB"}</span></span>
    </button>
    <input ref={ref} className="hidden" type="file" accept={accept} onChange={(event) => onChange(event.target.files?.[0] || null)} />
    {previousReason && <p className={`mt-2 rounded-lg px-3 py-2 text-xs font-semibold ${existing.verification_status === "rejected" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-800"}`}>{existing.verification_status === "rejected" ? "Rejected" : "Previous rejection"}: {previousReason}{existing.verification_status === "pending" ? " — your replacement is awaiting review." : " — upload only this item again."}</p>}
  </div>;
}

function Toggle({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`chip ${active ? "active" : ""}`}>{children}</button>;
}

export default function Apply() {
  const navigate = useNavigate();
  const [form, setForm] = useState(persistedForm);
  const [step, setStep] = useState(() => api.hasSession(form.email) ? 1 : 0);
  const [authenticated, setAuthenticated] = useState(() => api.hasSession(form.email));
  const [otpRequested, setOtpRequested] = useState(false);
  const [cities, setCities] = useState([]);
  const [tierOptions, setTierOptions] = useState([]);
  const [files, setFiles] = useState({});
  const [existingDocuments, setExistingDocuments] = useState({});
  const [correctionMode, setCorrectionMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [locating, setLocating] = useState(false);

  const needsVehicle = form.tier === "pro";
  const steps = useMemo(() => ["Account", "Personal", "Service", ...(needsVehicle ? ["Vehicle"] : []), "Availability", "Documents", "Payout"], [needsVehicle]);
  const currentLabel = steps[step];
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const setEmail = (value) => {
    const normalized = value.trim().toLowerCase();
    const verifiedEmail = api.sessionEmail() || form.email.trim().toLowerCase();
    set("email", value);
    if (authenticated && normalized !== verifiedEmail) setAuthenticated(false);
    setOtpRequested(false);
    set("otp", "");
  };

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  useEffect(() => {
    if (!api.hasSession()) return;
    loadSavedApplication();
  }, []);

  async function loadLookups() {
    setLoadingLookups(true);
    try {
      const [savedCities, options] = await Promise.all([api.cities(), api.tierOptions()]);
      setCities(savedCities);
      setTierOptions(options.tiers || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally { setLoadingLookups(false); }
  }

  async function loadSavedApplication({ openCorrections = true } = {}) {
    setLoadingLookups(true);
    try {
      const [savedCities, options, saved] = await Promise.all([api.cities(), api.tierOptions(), api.resumeApplication()]);
      setCities(savedCities);
      setTierOptions(options.tiers || []);
      const profile = saved.profile || {};
      const vehicle = saved.vehicle || {};
      const payout = saved.payout || {};
      setForm((current) => ({
        ...current,
        fullName: profile.full_name || current.fullName,
        email: profile.email || current.email,
        phone: profile.phone || "",
        dob: profile.date_of_birth || "",
        cityId: profile.city_id || "",
        qualification: profile.qualification || "",
        bio: profile.bio || "",
        languages: profile.languages || [],
        experienceYears: profile.experience_years ?? "",
        tier: saved.tier || current.tier,
        vehicleType: vehicle.vehicle_type || current.vehicleType,
        brand: vehicle.brand || "",
        model: vehicle.model || "",
        vehicleNumber: vehicle.vehicle_number || "",
        seatCount: vehicle.seat_count?.toString() || "",
        licenceExpiry: vehicle.licence_expiry || "",
        rcExpiry: vehicle.rc_expiry || "",
        weeklyDays: saved.weekly_days?.length ? saved.weekly_days : current.weeklyDays,
        serviceLatitude: saved.service_location?.latitude ?? current.serviceLatitude,
        serviceLongitude: saved.service_location?.longitude ?? current.serviceLongitude,
        idType: saved.id_type || current.idType,
        panNumber: saved.pan_number || "",
        aadhaarNumber: saved.aadhaar_number || "",
        payoutType: payout.upi_id ? "upi" : "bank",
        upiId: payout.upi_id || "",
        bankAccountNo: payout.bank_account_no || "",
        bankIfsc: payout.bank_ifsc || "",
        bankHolderName: payout.bank_holder_name || "",
      }));
      const byType = Object.fromEntries((saved.documents || []).map((item) => [item.document_type, item]));
      setExistingDocuments(byType);
      const hasCorrections = Object.values(byType).some((item) => item.verification_status === "rejected");
      if (openCorrections && hasCorrections) {
        setCorrectionMode(true);
        const savedNeedsVehicle = (saved.tier || form.tier) === "pro";
        const savedSteps = ["Account", "Personal", "Service", ...(savedNeedsVehicle ? ["Vehicle"] : []), "Availability", "Documents", "Payout"];
        setStep(savedSteps.indexOf("Documents"));
      }
      return hasCorrections;
    } catch (requestError) {
      setError(requestError.message);
      return false;
    } finally { setLoadingLookups(false); }
  }

  const documentSatisfied = (type) => Boolean(files[type] || (existingDocuments[type] && existingDocuments[type].verification_status !== "rejected"));

  function check() {
    if (currentLabel === "Account") {
      if (!form.fullName.trim()) return "Enter your full name.";
      if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) return "Enter a valid email address.";
      if (authenticated && api.hasSession(form.email)) return "";
      if (!otpRequested) return "Request your verification code to continue.";
      if (!/^\d{6}$/.test(form.otp.trim())) return "Enter the 6-digit verification code.";
    }
    if (currentLabel === "Personal") {
      if (!form.dob || !form.phone.match(/^\d{10}$/) || !form.cityId || !form.qualification.trim() || !form.bio.trim() || !form.languages.length) return "Complete every personal detail, including qualification, languages, and your city introduction.";
    }
    if (currentLabel === "Service" && !form.tier) return "Choose a service tier.";
    if (currentLabel === "Vehicle") {
      const errors = {};
      if (!form.brand.trim()) errors.brand = "Enter the vehicle brand.";
      if (!form.model.trim()) errors.model = "Enter the vehicle model.";
      if (!form.vehicleNumber.trim()) errors.vehicle_number = "Enter the registration number.";
      const seatCount = Number(form.seatCount);
      const seatLimits = form.vehicleType === "bike" ? [2, 2] : form.vehicleType === "auto" ? [3, 5] : [4, 8];
      if (!form.seatCount || !Number.isInteger(seatCount) || seatCount < seatLimits[0] || seatCount > seatLimits[1]) errors.seat_count = `Enter ${seatLimits[0]}${seatLimits[0] === seatLimits[1] ? "" : `–${seatLimits[1]}`} seats including the driver.`;
      if (!form.licenceExpiry) errors.licence_expiry = "Select the driving licence expiry date.";
      if (!form.rcExpiry) errors.rc_expiry = "Select the RC expiry date.";
      if (vehiclePhotoTypes.filter(documentSatisfied).length < 2) errors.vehicle_photos = "Add at least two clear vehicle photos.";
      setFieldErrors(errors);
      if (Object.keys(errors).length) return "Please correct the highlighted vehicle fields.";
    }
    if (currentLabel === "Availability") {
      if (!form.weeklyDays.length) return "Choose at least one available day.";
    }
    if (currentLabel === "Documents") {
      const identityTypes = form.idType === "pan" ? ["pan_front", "pan_back"] : ["aadhaar_front", "aadhaar_back"];
      const identityNumber = form.idType === "pan" ? form.panNumber.match(/^[A-Za-z]{5}\d{4}[A-Za-z]$/) : form.aadhaarNumber.match(/^\d{12}$/);
      const proTypes = needsVehicle ? ["licence_front", "licence_back", "rc"] : [];
      if (!identityNumber || !documentSatisfied("selfie") || identityTypes.some((type) => !documentSatisfied(type)) || proTypes.some((type) => !documentSatisfied(type))) return "Add your ID number and only the missing or rejected verification files.";
    }
    if (currentLabel === "Payout") {
      const bankComplete = [form.bankAccountNo, form.bankIfsc, form.bankHolderName].every((value) => value.trim());
      if (!(form.payoutType === "upi" ? form.upiId.trim() : bankComplete)) return "Enter your UPI ID or complete bank details.";
    }
    return "";
  }

  function captureServiceLocation() {
    if (!navigator.geolocation) {
      setError("Location is not supported by this browser. Please use a modern browser or complete registration in the Dude app.");
      return;
    }
    setLocating(true); setError("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setForm((current) => ({ ...current, serviceLatitude: coords.latitude, serviceLongitude: coords.longitude }));
        setLocating(false);
      },
      (locationError) => {
        setError(locationError.code === 1 ? "Allow location access in your browser to set your service location." : "We could not get your location. Move to an open area and try again.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 30000 },
    );
  }

  async function requestOtp() {
    const accountError = !form.fullName.trim() ? "Enter your full name." : !/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(form.email.trim()) ? "Enter a valid email address." : "";
    if (accountError) return setError(accountError);
    setLoading(true); setError("");
    try { await api.requestOtp(form.email); setOtpRequested(true); }
    catch (requestError) { setError(requestError.message); }
    finally { setLoading(false); }
  }

  async function next() {
    const invalid = check();
    if (invalid) return setError(invalid);
    setLoading(true); setError(""); setFieldErrors({});
    try {
      if (currentLabel === "Account") {
        if (!authenticated || !api.hasSession(form.email)) {
          await api.verifyOtp({ email: form.email, otp: form.otp, fullName: form.fullName });
          setAuthenticated(true);
        }
        const hasCorrections = await loadSavedApplication();
        if (hasCorrections) return;
      } else if (currentLabel === "Personal") {
        await api.saveProfile({ full_name: form.fullName.trim(), email: form.email.trim(), phone: form.phone, date_of_birth: form.dob, city_id: form.cityId, qualification: form.qualification.trim(), bio: form.bio.trim(), languages: form.languages });
      } else if (currentLabel === "Service") {
        await api.saveTier({ tier: form.tier, ...(needsVehicle ? { vehicle_type: form.vehicleType } : {}) });
      } else if (currentLabel === "Vehicle") {
        await api.saveVehicle({ vehicle_type: form.vehicleType, brand: form.brand, model: form.model, vehicle_number: form.vehicleNumber, seat_count: Number(form.seatCount), licence_expiry: form.licenceExpiry, rc_expiry: form.rcExpiry });
        const vehiclePhotos = new FormData();
        vehiclePhotoTypes.forEach((type) => { if (files[type]) vehiclePhotos.append(type, files[type]); });
        await api.uploadDocuments(vehiclePhotos);
      } else if (currentLabel === "Availability") {
        await api.saveAvailability({ weekly: form.weeklyDays.map((day) => ({ day_of_week: day })), service_latitude: form.serviceLatitude, service_longitude: form.serviceLongitude });
      } else if (currentLabel === "Documents") {
        const body = new FormData();
        body.append(form.idType === "pan" ? "pan_number" : "aadhaar_number", form.idType === "pan" ? form.panNumber.toUpperCase() : form.aadhaarNumber);
        const documentTypes = [
          `${form.idType}_front`, `${form.idType}_back`, "selfie",
          ...(needsVehicle ? ["licence_front", "licence_back", "rc"] : []),
        ];
        documentTypes.forEach((type) => { if (files[type]) body.append(type, files[type]); });
        const result = await api.uploadDocuments(body);
        if (result.missing?.length) throw new Error(`Please add: ${result.missing.map((item) => item.replaceAll("_", " ")).join(", ")}.`);
        await loadSavedApplication({ openCorrections: false });
        setFiles({});
        if (correctionMode) {
          navigate("/status", { replace: true });
          return;
        }
      } else if (currentLabel === "Payout") {
        await api.saveBank(form.payoutType === "upi" ? { upi_id: form.upiId.trim() } : { bank_account_no: form.bankAccountNo.trim(), bank_ifsc: form.bankIfsc.trim(), bank_holder_name: form.bankHolderName.trim() });
        localStorage.removeItem(STORAGE_KEY);
        navigate("/status", { replace: true });
        return;
      }
      setStep((value) => value + 1);
    } catch (requestError) {
      if (requestError.status === 401) {
        setAuthenticated(false);
        setOtpRequested(false);
        setStep(0);
      }
      setError(requestError.message || "Unable to save this step.");
      setFieldErrors(requestError.fields || {});
    } finally { setLoading(false); }
  }

  const selectedTier = tierOptions.find((tier) => tier.code === form.tier);
  return <Layout>
    <main className="mx-auto max-w-3xl px-5 py-8 sm:py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div><p className="text-xs font-black uppercase tracking-[.18em] text-orange">Dude registration</p><h1 className="display mt-2 text-3xl text-navy sm:text-4xl">{currentLabel === "Account" ? "Start your Duedoh journey." : `${currentLabel} details`}</h1><p className="mt-2 text-slate-500">Your application is saved to your Duedoh account as you go.</p></div>
        <span className="hidden shrink-0 rounded-full bg-orange-soft px-3 py-2 text-xs font-bold text-orange sm:block">{step + 1} of {steps.length}</span>
      </div>
      <div className="mb-8 grid grid-cols-4 gap-1 sm:grid-cols-7">{steps.map((item, index) => <div key={item}><div className={`h-1.5 rounded-full ${index <= step ? "bg-orange" : "bg-slate-200"}`} /><span className={`mt-2 hidden text-[11px] font-semibold sm:block ${index === step ? "text-navy" : "text-slate-400"}`}>{item}</span></div>)}</div>

      <section className="border border-slate-200 bg-white p-5 shadow-sm sm:p-8">
        {currentLabel === "Account" && <div className="space-y-5"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><ShieldCheck className="mr-2 inline text-orange" size={18} />Use the email you will use to sign in to the Dude app after launch.</div><Field label="Full name"><input className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" /></Field><Field label="Email address"><input className="field" type="email" value={form.email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" /></Field>{authenticated && api.hasSession(form.email) ? <p className="rounded-xl border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-800">Email verified. Your secure session will continue automatically.</p> : <>{otpRequested && <Field label="Verification code" hint="We sent a 6-digit code to your email."><input className="field tracking-[.25em]" inputMode="numeric" maxLength="6" value={form.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} placeholder="000000" /></Field>}<button type="button" className="btn-secondary w-full" onClick={requestOtp} disabled={loading}>{loading && !otpRequested ? <Loader2 className="animate-spin" size={18} /> : otpRequested ? "Send a new code" : "Send verification code"}</button></>}<p className="text-xs leading-5 text-slate-500">By continuing, you confirm you are 18+ and accept the <a className="font-bold text-orange" href="https://duedoh.com/partner-agreement.html" target="_blank" rel="noreferrer">Dude Partner Agreement</a> and <a className="font-bold text-orange" href="https://duedoh.com/privacy.html" target="_blank" rel="noreferrer">Privacy Policy</a>. Dates and times use India Standard Time.</p></div>}

        {currentLabel === "Personal" && <div className="grid gap-5 sm:grid-cols-2"><Field label="Mobile number" hint="10 digits, without +91"><input className="field" inputMode="tel" maxLength="10" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} placeholder="9876543210" /></Field><Field label="Date of birth"><input className="field" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field><Field label="Home city"><select className="field" value={form.cityId} disabled={loadingLookups} onChange={(e) => set("cityId", e.target.value)}><option value="">Select a Duedoh city</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}{city.state ? `, ${city.state}` : ""}</option>)}</select></Field><Field label="Qualification"><input className="field" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. Graduate" /></Field><div className="sm:col-span-2"><Field label="Languages you speak"><div className="flex flex-wrap gap-2">{languages.map((language) => <Toggle key={language} active={form.languages.includes(language)} onClick={() => set("languages", form.languages.includes(language) ? form.languages.filter((item) => item !== language) : [...form.languages, language])}>{language}</Toggle>)}</div></Field></div><div className="sm:col-span-2"><Field label="What can you show in your city?"><textarea className="field min-h-28" maxLength="300" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Share the places, experiences, and local highlights you can show travellers." /></Field></div></div>}

        {currentLabel === "Service" && <div className="space-y-4">{tierOptions.length ? tierOptions.map((tier) => <div key={tier.code} role="button" tabIndex={0} onClick={() => set("tier", tier.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") set("tier", tier.code); }} className={`w-full cursor-pointer border p-5 text-left transition ${form.tier === tier.code ? "border-orange bg-orange-soft" : "border-slate-200 hover:border-slate-400"}`}><div><p className="text-lg font-black text-navy">{tier.title}</p><p className="mt-1 text-sm text-slate-600">{tier.description}</p></div>{tier.code === "pro" && form.tier === "pro" && <div className="mt-5 border-t border-orange/20 pt-4"><span className="label">Your vehicle type</span><div className="flex flex-wrap gap-2">{(tier.vehicles || [{ code: "bike", title: "Bike" }, { code: "auto", title: "Auto" }, { code: "car", title: "Car" }]).map((vehicle) => <Toggle key={vehicle.code} active={form.vehicleType === vehicle.code} onClick={() => set("vehicleType", vehicle.code)}>{vehicle.title}</Toggle>)}</div></div>}</div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Loading the current Duedoh service options...</p>}</div>}

        {currentLabel === "Vehicle" && <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2 rounded-xl bg-orange-soft p-4 text-sm text-slate-700">Complete the vehicle record and add any two clear vehicle photos. Additional angles are optional.</div>
          <Field label="Vehicle brand" error={fieldErrors.brand}><input className={`field ${fieldErrors.brand ? "border-red-500" : ""}`} value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Honda" /></Field>
          <Field label="Vehicle model" error={fieldErrors.model}><input className={`field ${fieldErrors.model ? "border-red-500" : ""}`} value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Activa" /></Field>
          <Field label="Vehicle registration number" error={fieldErrors.vehicle_number}><input className={`field ${fieldErrors.vehicle_number ? "border-red-500" : ""}`} value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value.toUpperCase())} placeholder="TS09AB1234" /></Field>
          <Field label="Seats including driver" error={fieldErrors.seat_count}><input className={`field ${fieldErrors.seat_count ? "border-red-500" : ""}`} type="number" min={form.vehicleType === "bike" ? 2 : form.vehicleType === "auto" ? 3 : 4} max={form.vehicleType === "bike" ? 2 : form.vehicleType === "auto" ? 5 : 8} value={form.seatCount} onChange={(e) => set("seatCount", e.target.value)} placeholder={form.vehicleType === "bike" ? "2" : "5"} /></Field>
          <Field label="Driving licence expiry" error={fieldErrors.licence_expiry}><input className={`field ${fieldErrors.licence_expiry ? "border-red-500" : ""}`} type="date" value={form.licenceExpiry} onChange={(e) => set("licenceExpiry", e.target.value)} /></Field>
          <Field label="RC expiry" error={fieldErrors.rc_expiry}><input className={`field ${fieldErrors.rc_expiry ? "border-red-500" : ""}`} type="date" value={form.rcExpiry} onChange={(e) => set("rcExpiry", e.target.value)} /></Field>
          <div className="sm:col-span-2 border-t border-slate-200 pt-6">
            <p className="text-sm font-bold text-navy">Vehicle photos <span className="font-normal text-slate-400">(minimum 2)</span></p>
            <p className="mt-1 text-sm text-slate-500">Choose any two or more clear angles. Front, side, rear, and interior are all accepted.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">{[["vehicle_front", "Front view"], ["vehicle_side", "Side view"], ["vehicle_rear", "Rear view"], ["vehicle_interior", "Interior view"]].map(([type, label]) => <FileField key={type} label={label} value={files[type]} existing={existingDocuments[type]} accept="image/*" hint="A clear photo of your vehicle" onChange={(file) => setFiles((current) => ({ ...current, [type]: file }))} />)}</div>
            {fieldErrors.vehicle_photos && <p className="mt-2 text-xs font-semibold text-red-600">{fieldErrors.vehicle_photos}</p>}
          </div>
        </div>}

        {currentLabel === "Availability" && <div className="space-y-6">
          <div className={`rounded-xl border p-4 ${form.serviceLatitude == null ? "border-orange/40 bg-orange-soft" : "border-green-200 bg-green-50"}`}>
            <div className="flex items-start gap-3"><MapPin className={form.serviceLatitude == null ? "text-orange" : "text-green-700"} size={22} /><div className="min-w-0 flex-1"><p className="font-bold text-navy">{form.serviceLatitude == null ? "Add service location (optional)" : "Service location saved"}</p><p className="mt-1 text-sm text-slate-600">Add it to appear higher in nearby searches. You can skip this and add or change it later in the Dude app Profile. Travellers never see your exact saved location.</p><button type="button" onClick={captureServiceLocation} disabled={locating} className="btn-secondary mt-4">{locating ? <Loader2 className="animate-spin" size={18} /> : <MapPin size={18} />}{form.serviceLatitude == null ? "Use my current location" : "Update current location"}</button></div></div>
          </div>
          <fieldset>
            <legend className="label">Days you are usually available</legend>
            <div className="flex flex-wrap gap-2">{days.map((day, index) => <Toggle key={day} active={form.weeklyDays.includes(index)} onClick={() => set("weeklyDays", form.weeklyDays.includes(index) ? form.weeklyDays.filter((item) => item !== index) : [...form.weeklyDays, index].sort())}>{day.slice(0, 3)}</Toggle>)}</div>
            <p className="mt-2 text-xs text-slate-500">Select your available days. There are no fixed start or end time slots.</p>
          </fieldset>
          <div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
            Travellers choose their trip times when booking on your available dates. After approval, you can manage specific available dates and go online for eligible chat sessions in the Dude app.
          </div>
        </div>}

        {currentLabel === "Documents" && <div className="space-y-6"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><Clock3 className="mr-2 inline text-orange" size={18} />Your saved documents remain here. Upload only an item marked rejected or missing.</div><Field label="Choose identity document"><div className="flex gap-2"><Toggle active={form.idType === "pan"} onClick={() => set("idType", "pan")}>PAN card</Toggle><Toggle active={form.idType === "aadhaar"} onClick={() => set("idType", "aadhaar")}>Aadhaar card</Toggle></div></Field><Field label={form.idType === "pan" ? "PAN number" : "Aadhaar number"}><input className="field" maxLength={form.idType === "pan" ? 10 : 12} value={form.idType === "pan" ? form.panNumber : form.aadhaarNumber} onChange={(e) => set(form.idType === "pan" ? "panNumber" : "aadhaarNumber", form.idType === "pan" ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ""))} placeholder={form.idType === "pan" ? "AAAAA9999A" : "12-digit Aadhaar number"} /></Field><div className="grid gap-4 sm:grid-cols-2"><FileField label={`${form.idType === "pan" ? "PAN" : "Aadhaar"} front`} value={files[`${form.idType}_front`]} existing={existingDocuments[`${form.idType}_front`]} onChange={(file) => setFiles((current) => ({ ...current, [`${form.idType}_front`]: file }))} /><FileField label={`${form.idType === "pan" ? "PAN" : "Aadhaar"} back`} value={files[`${form.idType}_back`]} existing={existingDocuments[`${form.idType}_back`]} onChange={(file) => setFiles((current) => ({ ...current, [`${form.idType}_back`]: file }))} /><FileField label="Your selfie" value={files.selfie} existing={existingDocuments.selfie} onChange={(file) => setFiles((current) => ({ ...current, selfie: file }))} hint="A clear, recent face photo" /></div>{needsVehicle && <><p className="border-t border-slate-200 pt-6 text-sm font-bold text-navy">Vehicle documents</p><div className="grid gap-4 sm:grid-cols-2"><FileField label="Driving licence front" value={files.licence_front} existing={existingDocuments.licence_front} onChange={(file) => setFiles((current) => ({ ...current, licence_front: file }))} /><FileField label="Driving licence back" value={files.licence_back} existing={existingDocuments.licence_back} onChange={(file) => setFiles((current) => ({ ...current, licence_back: file }))} /><FileField label="RC document" value={files.rc} existing={existingDocuments.rc} onChange={(file) => setFiles((current) => ({ ...current, rc: file }))} /></div></>}</div>}

        {currentLabel === "Payout" && <div className="space-y-6"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Choose one payout method. Your details are stored securely with your Dude application.</div><div className="flex gap-2"><Toggle active={form.payoutType === "upi"} onClick={() => set("payoutType", "upi")}>UPI</Toggle><Toggle active={form.payoutType === "bank"} onClick={() => set("payoutType", "bank")}>Bank account</Toggle></div>{form.payoutType === "upi" ? <Field label="UPI ID"><input className="field" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} placeholder="name@bank" /></Field> : <div className="grid gap-5 sm:grid-cols-2"><Field label="Account holder name"><input className="field" value={form.bankHolderName} onChange={(e) => set("bankHolderName", e.target.value)} /></Field><Field label="Account number"><input className="field" inputMode="numeric" value={form.bankAccountNo} onChange={(e) => set("bankAccountNo", e.target.value)} /></Field><Field label="IFSC code"><input className="field" value={form.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value.toUpperCase())} placeholder="SBIN0000000" /></Field></div>}</div>}

        {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => { setError(""); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0 || loading || correctionMode} className="btn-secondary"><ArrowLeft size={18} /> Back</button><button type="button" onClick={next} disabled={loading || (currentLabel === "Service" && !selectedTier)} className="btn-primary">{loading ? <Loader2 className="animate-spin" size={18} /> : correctionMode && currentLabel === "Documents" ? <><CheckCircle2 size={18} /> Submit corrections</> : currentLabel === "Payout" ? <><CheckCircle2 size={18} /> Submit application</> : <>Save & continue <ArrowRight size={18} /></>}</button></div>
      </section>
      <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link to="/status" className="font-bold text-orange">Check your application</Link></p>
    </main>
  </Layout>;
}
