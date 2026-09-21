import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Clock3, Loader2, RefreshCw, ShieldAlert } from "lucide-react";
import Layout from "../components/Layout.jsx";
import { api } from "../api.js";

const tone = { approved: "bg-green-100 text-green-800", pending: "bg-orange-soft text-orange", rejected: "bg-red-100 text-red-800" };

export default function Status() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  async function refresh() {
    if (!api.hasSession()) { setLoading(false); setError("Sign in with your registration email to view or continue your application."); return; }
    setLoading(true); setError("");
    try { setStatus(await api.applicationStatus()); }
    catch (requestError) { if (requestError.status === 401 || requestError.status === 422) api.clearSession(); setError(requestError.message); }
    finally { setLoading(false); }
  }
  useEffect(() => { refresh(); }, []);
  const state = (status?.status || "pending").toLowerCase();
  const Icon = state === "approved" ? CheckCircle2 : state === "rejected" ? ShieldAlert : Clock3;
  return <Layout><main className="mx-auto max-w-2xl px-5 py-12">
    <p className="text-xs font-black uppercase tracking-[.18em] text-orange">Dude application</p>
    <h1 className="display mt-2 text-3xl text-navy">Your application status</h1>
    <p className="mt-2 text-slate-500">Use the same account when the Dude app launches. There is nothing separate to create later.</p>
    {loading && <div className="mt-8 grid min-h-56 place-items-center border border-slate-200 bg-white"><Loader2 className="animate-spin text-orange" size={28} /></div>}
    {!loading && error && <div className="mt-8 border border-slate-200 bg-white p-7 text-center"><ShieldAlert className="mx-auto text-orange" size={32} /><p className="mt-4 text-sm font-semibold text-slate-700">{error}</p><Link className="btn-primary mt-6" to="/apply">Sign in or continue registration</Link></div>}
    {!loading && status && <section className="mt-8 border border-slate-200 bg-white p-6 sm:p-8"><div className="flex flex-wrap items-start justify-between gap-4"><div className="flex gap-3"><span className={`grid size-12 place-items-center rounded-full ${tone[state] || "bg-slate-100 text-slate-700"}`}><Icon size={24} /></span><div><p className="text-sm font-bold text-slate-500">{status.title || "Application status"}</p><h2 className="display mt-1 text-2xl capitalize text-navy">{state}</h2></div></div><span className={`status-badge ${tone[state] || "bg-slate-100 text-slate-700"}`}>{status.tier ? `Dude ${status.tier}` : "Dude application"}</span></div><p className="mt-6 rounded-xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">{status.message || "Your details are safely saved. Our team will review the application shortly."}</p>{status.blockers?.length > 0 && <div className="mt-5"><p className="text-sm font-bold text-navy">Still needed</p><ul className="mt-2 space-y-2">{status.blockers.map((blocker) => <li key={blocker} className="text-sm text-slate-600">• {blocker}</li>)}</ul><Link to="/apply" className="btn-primary mt-5">Continue registration</Link></div>}<button type="button" onClick={refresh} className="btn-secondary mt-6"><RefreshCw size={17} /> Check again</button></section>}
  </main></Layout>;
}
