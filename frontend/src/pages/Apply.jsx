import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileUp, Loader2, ShieldCheck } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { Field } from "../components/Field.jsx";
import { api } from "../api.js";

const STORAGE_KEY = "duedoh-info-registration";
const languages = ["English", "Hindi", "Telugu", "Tamil", "Kannada", "Urdu"];
const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const initialForm = {
  fullName: "", email: "", otp: "", phone: "", dob: "", cityId: "", qualification: "", bio: "", languages: [], experienceYears: 0,
  tier: "lite", vehicleType: "bike", brand: "", model: "", vehicleNumber: "", seatCount: "", licenceExpiry: "", rcExpiry: "", insuranceExpiry: "", insuranceNumber: "",
  weeklyDays: [0, 1, 2, 3, 4], start: "09:00", end: "18:00", instantConnect: true,
  idType: "pan", panNumber: "", aadhaarNumber: "", payoutType: "upi", upiId: "", bankAccountNo: "", bankIfsc: "", bankHolderName: "",
};

function persistedForm() {
  try { return { ...initialForm, ...JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}") }; }
  catch { return initialForm; }
}

function FileField({ label, value, onChange, required = true, hint }) {
  const ref = useRef(null);
  return <div>
    <span className="label">{label}{!required && <span className="ml-1 font-normal text-slate-400">(optional)</span>}</span>
    <button type="button" onClick={() => ref.current?.click()} className="flex min-h-20 w-full items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white p-3 text-left hover:border-orange">
      <span className="grid size-11 place-items-center rounded-lg bg-orange-soft text-orange"><FileUp size={20} /></span>
      <span className="min-w-0"><span className="block truncate text-sm font-semibold text-navy">{value?.name || "Choose a clear image or PDF"}</span><span className="mt-0.5 block text-xs text-slate-500">{hint || "JPG, PNG, or PDF up to 15 MB"}</span></span>
    </button>
    <input ref={ref} className="hidden" type="file" accept="image/*,application/pdf" onChange={(event) => onChange(event.target.files?.[0] || null)} />
  </div>;
}

function Toggle({ active, onClick, children }) {
  return <button type="button" onClick={onClick} className={`chip ${active ? "active" : ""}`}>{children}</button>;
}

export default function Apply() {
  const navigate = useNavigate();
  const [form, setForm] = useState(persistedForm);
  const [step, setStep] = useState(0);
  const [otpRequested, setOtpRequested] = useState(false);
  const [cities, setCities] = useState([]);
  const [tierOptions, setTierOptions] = useState([]);
  const [files, setFiles] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingLookups, setLoadingLookups] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  const needsVehicle = form.tier === "pro";
  const steps = useMemo(() => ["Account", "Personal", "Service", ...(needsVehicle ? ["Vehicle"] : []), "Availability", "Documents", "Payout"], [needsVehicle]);
  const currentLabel = steps[step];
  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(form)); }, [form]);
  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [step]);
  useEffect(() => {
    if (!api.hasSession()) return;
    loadLookups();
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

  function check() {
    if (currentLabel === "Account") {
      if (!form.fullName.trim()) return "Enter your full name.";
      if (!/^[^@\s]+@[^@\s]+\.[a-zA-Z]{2,}$/.test(form.email.trim())) return "Enter a valid email address.";
      if (!otpRequested) return "Request your verification code to continue.";
      if (!/^\d{6}$/.test(form.otp.trim())) return "Enter the 6-digit verification code.";
    }
    if (currentLabel === "Personal") {
      if (!form.dob || !form.phone.match(/^\d{10}$/) || !form.cityId) return "Add your date of birth, 10-digit mobile number, and home city.";
    }
    if (currentLabel === "Service" && !form.tier) return "Choose a service tier.";
    if (currentLabel === "Vehicle") {
      if (![form.brand, form.model, form.vehicleNumber, form.licenceExpiry, form.rcExpiry, form.insuranceExpiry].every((value) => String(value).trim())) return "Complete all required vehicle details.";
    }
    if (currentLabel === "Availability") {
      if (!form.weeklyDays.length || !form.start || !form.end || form.start >= form.end) return "Choose at least one day and a valid time range.";
    }
    if (currentLabel === "Documents") {
      const identityFiles = form.idType === "pan" ? [files.pan_front, files.pan_back] : [files.aadhaar_front, files.aadhaar_back];
      const identityNumber = form.idType === "pan" ? form.panNumber.match(/^[A-Za-z]{5}\d{4}[A-Za-z]$/) : form.aadhaarNumber.match(/^\d{12}$/);
      const proFiles = needsVehicle ? [files.licence_front, files.licence_back, files.rc, files.insurance] : [];
      if (!identityNumber || !files.selfie || identityFiles.some((file) => !file) || proFiles.some((file) => !file)) return "Add your ID number and all required verification files.";
    }
    if (currentLabel === "Payout") {
      const bankComplete = [form.bankAccountNo, form.bankIfsc, form.bankHolderName].every((value) => value.trim());
      if (!(form.payoutType === "upi" ? form.upiId.trim() : bankComplete)) return "Enter your UPI ID or complete bank details.";
    }
    return "";
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
        await api.verifyOtp({ email: form.email, otp: form.otp, fullName: form.fullName });
        await loadLookups();
      } else if (currentLabel === "Personal") {
        await api.saveProfile({ full_name: form.fullName.trim(), email: form.email.trim(), phone: form.phone, date_of_birth: form.dob, city_id: form.cityId, qualification: form.qualification.trim(), bio: form.bio.trim(), languages: form.languages, experience_years: Number(form.experienceYears || 0) });
      } else if (currentLabel === "Service") {
        await api.saveTier({ tier: form.tier, ...(needsVehicle ? { vehicle_type: form.vehicleType } : {}) });
      } else if (currentLabel === "Vehicle") {
        await api.saveVehicle({ vehicle_type: form.vehicleType, brand: form.brand, model: form.model, vehicle_number: form.vehicleNumber, seat_count: form.seatCount ? Number(form.seatCount) : undefined, licence_expiry: form.licenceExpiry, rc_expiry: form.rcExpiry, insurance_expiry: form.insuranceExpiry, insurance_number: form.insuranceNumber });
      } else if (currentLabel === "Availability") {
        await api.saveAvailability({ weekly: form.weeklyDays.map((day) => ({ day_of_week: day, start: form.start, end: form.end })), instant_connect: form.instantConnect });
      } else if (currentLabel === "Documents") {
        const body = new FormData();
        body.append(form.idType === "pan" ? "pan_number" : "aadhaar_number", form.idType === "pan" ? form.panNumber.toUpperCase() : form.aadhaarNumber);
        Object.entries(files).forEach(([key, file]) => { if (file) body.append(key, file); });
        const result = await api.uploadDocuments(body);
        if (result.missing?.length) throw new Error(`Please add: ${result.missing.map((item) => item.replaceAll("_", " ")).join(", ")}.`);
      } else if (currentLabel === "Payout") {
        await api.saveBank(form.payoutType === "upi" ? { upi_id: form.upiId.trim() } : { bank_account_no: form.bankAccountNo.trim(), bank_ifsc: form.bankIfsc.trim(), bank_holder_name: form.bankHolderName.trim() });
        localStorage.removeItem(STORAGE_KEY);
        navigate("/status", { replace: true });
        return;
      }
      setStep((value) => value + 1);
    } catch (requestError) {
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
        {currentLabel === "Account" && <div className="space-y-5"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><ShieldCheck className="mr-2 inline text-orange" size={18} />Use the email you will use to sign in to the Dude app after launch.</div><Field label="Full name"><input className="field" value={form.fullName} onChange={(e) => set("fullName", e.target.value)} placeholder="Your full name" /></Field><Field label="Email address"><input className="field" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="you@example.com" /></Field>{otpRequested && <Field label="Verification code" hint="We sent a 6-digit code to your email."><input className="field tracking-[.25em]" inputMode="numeric" maxLength="6" value={form.otp} onChange={(e) => set("otp", e.target.value.replace(/\D/g, ""))} placeholder="000000" /></Field>}<button type="button" className="btn-secondary w-full" onClick={requestOtp} disabled={loading}>{loading && !otpRequested ? <Loader2 className="animate-spin" size={18} /> : otpRequested ? "Send a new code" : "Send verification code"}</button></div>}

        {currentLabel === "Personal" && <div className="grid gap-5 sm:grid-cols-2"><Field label="Mobile number" hint="10 digits, without +91"><input className="field" inputMode="tel" maxLength="10" value={form.phone} onChange={(e) => set("phone", e.target.value.replace(/\D/g, ""))} placeholder="9876543210" /></Field><Field label="Date of birth"><input className="field" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} /></Field><Field label="Home city"><select className="field" value={form.cityId} disabled={loadingLookups} onChange={(e) => set("cityId", e.target.value)}><option value="">Select a Duedoh city</option>{cities.map((city) => <option key={city.id} value={city.id}>{city.name}{city.state ? `, ${city.state}` : ""}</option>)}</select></Field><Field label="Qualification" optional><input className="field" value={form.qualification} onChange={(e) => set("qualification", e.target.value)} placeholder="e.g. Graduate" /></Field><Field label="Hosting experience" optional><input className="field" type="number" min="0" max="60" value={form.experienceYears} onChange={(e) => set("experienceYears", e.target.value)} /></Field><div className="sm:col-span-2"><Field label="Languages you speak" optional><div className="flex flex-wrap gap-2">{languages.map((language) => <Toggle key={language} active={form.languages.includes(language)} onClick={() => set("languages", form.languages.includes(language) ? form.languages.filter((item) => item !== language) : [...form.languages, language])}>{language}</Toggle>)}</div></Field></div><div className="sm:col-span-2"><Field label="About you" optional><textarea className="field min-h-28" maxLength="300" value={form.bio} onChange={(e) => set("bio", e.target.value)} placeholder="Your local knowledge and how you like to help travellers." /></Field></div></div>}

        {currentLabel === "Service" && <div className="space-y-4">{tierOptions.length ? tierOptions.map((tier) => <div key={tier.code} role="button" tabIndex={0} onClick={() => set("tier", tier.code)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") set("tier", tier.code); }} className={`w-full cursor-pointer border p-5 text-left transition ${form.tier === tier.code ? "border-orange bg-orange-soft" : "border-slate-200 hover:border-slate-400"}`}><div className="flex items-start justify-between gap-3"><div><p className="text-lg font-black text-navy">{tier.title}</p><p className="mt-1 text-sm text-slate-600">{tier.description}</p></div>{tier.earnings_summary && <span className="text-right text-sm font-bold text-orange">{tier.earnings_summary}</span>}</div>{tier.code === "pro" && form.tier === "pro" && <div className="mt-5 border-t border-orange/20 pt-4"><span className="label">Your vehicle type</span><div className="flex flex-wrap gap-2">{(tier.vehicles || [{ code: "bike", title: "Bike" }, { code: "auto", title: "Auto" }, { code: "car", title: "Car" }]).map((vehicle) => <Toggle key={vehicle.code} active={form.vehicleType === vehicle.code} onClick={() => set("vehicleType", vehicle.code)}>{vehicle.title}</Toggle>)}</div></div>}</div>) : <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Loading the current Duedoh service options...</p>}</div>}

        {currentLabel === "Vehicle" && <div className="grid gap-5 sm:grid-cols-2"><div className="sm:col-span-2 rounded-xl bg-orange-soft p-4 text-sm text-slate-700">A clear, valid vehicle record is required for Pro applications.</div><Field label="Vehicle brand"><input className="field" value={form.brand} onChange={(e) => set("brand", e.target.value)} placeholder="e.g. Honda" /></Field><Field label="Vehicle model"><input className="field" value={form.model} onChange={(e) => set("model", e.target.value)} placeholder="e.g. Activa" /></Field><Field label="Vehicle registration number"><input className={`field ${fieldErrors.vehicle_number ? "border-red-500" : ""}`} value={form.vehicleNumber} onChange={(e) => set("vehicleNumber", e.target.value.toUpperCase())} placeholder="TS09AB1234" /></Field><Field label="Seats including driver" optional><input className="field" type="number" min={form.vehicleType === "bike" ? 2 : 3} max={form.vehicleType === "bike" ? 2 : 8} value={form.seatCount} onChange={(e) => set("seatCount", e.target.value)} placeholder={form.vehicleType === "bike" ? "2" : "5"} /></Field><Field label="Driving licence expiry"><input className="field" type="date" value={form.licenceExpiry} onChange={(e) => set("licenceExpiry", e.target.value)} /></Field><Field label="RC expiry"><input className="field" type="date" value={form.rcExpiry} onChange={(e) => set("rcExpiry", e.target.value)} /></Field><Field label="Insurance expiry"><input className="field" type="date" value={form.insuranceExpiry} onChange={(e) => set("insuranceExpiry", e.target.value)} /></Field><Field label="Insurance number" optional><input className="field" value={form.insuranceNumber} onChange={(e) => set("insuranceNumber", e.target.value)} placeholder="Policy number" /></Field></div>}

        {currentLabel === "Availability" && <div className="space-y-6"><Field label="Days you are usually available"><div className="flex flex-wrap gap-2">{days.map((day, index) => <Toggle key={day} active={form.weeklyDays.includes(index)} onClick={() => set("weeklyDays", form.weeklyDays.includes(index) ? form.weeklyDays.filter((item) => item !== index) : [...form.weeklyDays, index].sort())}>{day.slice(0, 3)}</Toggle>)}</div></Field><div className="grid gap-5 sm:grid-cols-2"><Field label="Start time"><input className="field" type="time" value={form.start} onChange={(e) => set("start", e.target.value)} /></Field><Field label="End time"><input className="field" type="time" value={form.end} onChange={(e) => set("end", e.target.value)} /></Field></div><button type="button" onClick={() => set("instantConnect", !form.instantConnect)} className={`flex w-full items-center justify-between border p-4 text-left ${form.instantConnect ? "border-orange bg-orange-soft" : "border-slate-200"}`}><span><span className="block font-bold text-navy">Instant Connect availability</span><span className="mt-1 block text-sm text-slate-600">Allow eligible travellers to find you for instant chat support.</span></span><span className={`relative h-7 w-12 rounded-full ${form.instantConnect ? "bg-orange" : "bg-slate-300"}`}><span className={`absolute top-1 size-5 rounded-full bg-white transition ${form.instantConnect ? "left-6" : "left-1"}`} /></span></button></div>}

        {currentLabel === "Documents" && <div className="space-y-6"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600"><Clock3 className="mr-2 inline text-orange" size={18} />These documents are reviewed by the Duedoh team before your account is approved.</div><Field label="Choose identity document"><div className="flex gap-2"><Toggle active={form.idType === "pan"} onClick={() => set("idType", "pan")}>PAN card</Toggle><Toggle active={form.idType === "aadhaar"} onClick={() => set("idType", "aadhaar")}>Aadhaar card</Toggle></div></Field><Field label={form.idType === "pan" ? "PAN number" : "Aadhaar number"}><input className="field" maxLength={form.idType === "pan" ? 10 : 12} value={form.idType === "pan" ? form.panNumber : form.aadhaarNumber} onChange={(e) => set(form.idType === "pan" ? "panNumber" : "aadhaarNumber", form.idType === "pan" ? e.target.value.toUpperCase() : e.target.value.replace(/\D/g, ""))} placeholder={form.idType === "pan" ? "AAAAA9999A" : "12-digit Aadhaar number"} /></Field><div className="grid gap-4 sm:grid-cols-2"><FileField label={`${form.idType === "pan" ? "PAN" : "Aadhaar"} front`} value={files[`${form.idType}_front`]} onChange={(file) => setFiles((current) => ({ ...current, [`${form.idType}_front`]: file }))} /><FileField label={`${form.idType === "pan" ? "PAN" : "Aadhaar"} back`} value={files[`${form.idType}_back`]} onChange={(file) => setFiles((current) => ({ ...current, [`${form.idType}_back`]: file }))} /><FileField label="Your selfie" value={files.selfie} onChange={(file) => setFiles((current) => ({ ...current, selfie: file }))} hint="A clear, recent face photo" /></div>{needsVehicle && <><p className="border-t border-slate-200 pt-6 text-sm font-bold text-navy">Vehicle documents</p><div className="grid gap-4 sm:grid-cols-2"><FileField label="Driving licence front" value={files.licence_front} onChange={(file) => setFiles((current) => ({ ...current, licence_front: file }))} /><FileField label="Driving licence back" value={files.licence_back} onChange={(file) => setFiles((current) => ({ ...current, licence_back: file }))} /><FileField label="RC document" value={files.rc} onChange={(file) => setFiles((current) => ({ ...current, rc: file }))} /><FileField label="Insurance document" value={files.insurance} onChange={(file) => setFiles((current) => ({ ...current, insurance: file }))} /></div></>}</div>}

        {currentLabel === "Payout" && <div className="space-y-6"><div className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">Choose one payout method. Your details are stored securely with your Dude application.</div><div className="flex gap-2"><Toggle active={form.payoutType === "upi"} onClick={() => set("payoutType", "upi")}>UPI</Toggle><Toggle active={form.payoutType === "bank"} onClick={() => set("payoutType", "bank")}>Bank account</Toggle></div>{form.payoutType === "upi" ? <Field label="UPI ID"><input className="field" value={form.upiId} onChange={(e) => set("upiId", e.target.value)} placeholder="name@bank" /></Field> : <div className="grid gap-5 sm:grid-cols-2"><Field label="Account holder name"><input className="field" value={form.bankHolderName} onChange={(e) => set("bankHolderName", e.target.value)} /></Field><Field label="Account number"><input className="field" inputMode="numeric" value={form.bankAccountNo} onChange={(e) => set("bankAccountNo", e.target.value)} /></Field><Field label="IFSC code"><input className="field" value={form.bankIfsc} onChange={(e) => set("bankIfsc", e.target.value.toUpperCase())} placeholder="SBIN0000000" /></Field></div>}</div>}

        {error && <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}
        <div className="mt-8 flex items-center justify-between gap-3 border-t border-slate-200 pt-5"><button type="button" onClick={() => { setError(""); setStep((value) => Math.max(0, value - 1)); }} disabled={step === 0 || loading} className="btn-secondary"><ArrowLeft size={18} /> Back</button><button type="button" onClick={next} disabled={loading || (currentLabel === "Service" && !selectedTier)} className="btn-primary">{loading ? <Loader2 className="animate-spin" size={18} /> : currentLabel === "Payout" ? <><CheckCircle2 size={18} /> Submit application</> : <>Save & continue <ArrowRight size={18} /></>}</button></div>
      </section>
      <p className="mt-6 text-center text-sm text-slate-500">Already registered? <Link to="/status" className="font-bold text-orange">Check your application</Link></p>
    </main>
  </Layout>;
}
