import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeIndianRupee,
  MapPin,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Layout from "../components/Layout.jsx";
import { HOW_IT_WORKS, ELIGIBILITY, EARNINGS } from "../data.js";

export default function Landing() {
  return (
    <Layout>
      {/* Hero */}
      <section className="paper-grid relative overflow-hidden px-5 pb-14 pt-10 sm:pt-16">
        <div className="absolute -right-24 top-4 size-72 rounded-full bg-orange/10 blur-3xl" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.15fr_.85fr]">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-orange-soft px-3 py-1 text-xs font-black uppercase tracking-widest text-orange">
              <Sparkles size={14} /> Hyderabad · Visakhapatnam
            </span>
            <h1 className="display mt-5 text-4xl text-navy sm:text-6xl">
              Every city has a Dude.{" "}
              <span className="text-orange">Be the one.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-slate-600">
              Earn money by knowing your city. Host travellers visiting Hyderabad and
              Vizag — show them around, help with language and prices, make their day
              work.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link to="/apply" className="btn-primary w-full sm:w-auto">
                Apply Now <ArrowRight size={18} />
              </Link>
              <Link to="/status" className="btn-secondary w-full sm:w-auto">
                Check status
              </Link>
            </div>
            <p className="mt-6 text-sm font-bold text-slate-500">
              Local knowledge. Real hospitality. Flexible work.
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-navy/5">
            <p className="text-xs font-black uppercase tracking-[.2em] text-orange">
              Where we pay you
            </p>
            <p className="display mt-2 text-2xl text-navy">Your city can pay you back.</p>
            <div className="mt-6 space-y-3">
              {EARNINGS.map((e) => (
                <div
                  key={e.label}
                  className="flex items-center justify-between rounded-2xl bg-orange-soft p-4"
                >
                  <span className="text-sm font-bold text-orange">{e.label}</span>
                  <span className="text-xl font-black text-navy">
                    {e.amount}{" "}
                    <span className="text-sm font-bold text-slate-500">{e.note}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-slate-400">
              Earnings depend on how many days you work and whether you have a vehicle.
              Fuel is reimbursed separately.
            </p>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-6xl px-5 py-12">
        <p className="text-xs font-black uppercase tracking-[.2em] text-orange">
          How it works
        </p>
        <h2 className="display mt-3 text-3xl text-navy sm:text-4xl">
          Four straightforward steps.
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {HOW_IT_WORKS.map(([title, body], i) => (
            <div
              key={title}
              className="rounded-2xl border border-slate-200 bg-white p-5"
            >
              <span className="grid size-9 place-items-center rounded-xl bg-navy text-sm font-black text-white">
                {i + 1}
              </span>
              <p className="display mt-4 text-lg text-navy">{title}</p>
              <p className="mt-1 text-sm text-slate-500">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who can be a Dude */}
      <section className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-black uppercase tracking-[.2em] text-orange">
              Who can be a Dude
            </p>
            <h2 className="display mt-4 text-4xl text-navy sm:text-5xl">
              If people trust you, you're halfway there.
            </h2>
            <p className="mt-4 text-lg text-slate-600">
              No degree. No experience. No interview rounds.
            </p>
            <p className="mt-2 text-slate-600">
              What matters is your city, your languages, and how you treat people.
            </p>
          </div>
          <ul className="space-y-3">
            {ELIGIBILITY.map((item, i) => (
              <li
                key={i}
                className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
              >
                <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-green-100 text-green-700">
                  {i === 0 ? (
                    <MapPin size={16} />
                  ) : i === 1 ? (
                    <ShieldCheck size={16} />
                  ) : (
                    <BadgeIndianRupee size={16} />
                  )}
                </span>
                <span className="text-sm font-semibold text-slate-700">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Founding CTA */}
      <section className="mx-auto max-w-6xl px-5 pb-4">
        <div className="overflow-hidden rounded-3xl bg-navy px-6 py-14 text-white sm:px-12">
          <p className="text-xs font-black uppercase tracking-[.2em] text-orange-200">
            For our first verified Dudes.
          </p>
          <h2 className="display mt-3 text-3xl sm:text-4xl">Up to ₹25,000</h2>
          <p className="mt-3 max-w-lg text-white/80">
            Your city is already a skill. Join as a founding Dude and turn the places you
            know into flexible earnings.
          </p>
          <Link to="/apply" className="btn-primary mt-8 w-full sm:w-auto">
            Start earning <ArrowRight size={18} />
          </Link>
        </div>
      </section>
    </Layout>
  );
}
