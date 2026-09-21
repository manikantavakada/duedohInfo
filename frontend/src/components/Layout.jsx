import { Link } from "react-router-dom";

function BrandMark({ compact = false }) {
  return <span className={`grid shrink-0 place-items-center bg-navy ${compact ? "size-8 rounded-lg" : "size-9 rounded-xl"}`}>
    <img src="/duedoh-mark.svg" alt="" className={compact ? "size-5" : "size-6"} />
  </span>;
}

export function Header() {
  return <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur">
    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
      <Link to="/" className="flex items-center gap-2" aria-label="Duedoh home">
        <BrandMark />
        <span className="display text-xl text-navy">Duedoh</span>
      </Link>
      <nav className="flex items-center gap-2 sm:gap-3">
        <Link to="/status" className="btn-secondary px-3 text-sm sm:px-4">My application</Link>
        <Link to="/apply" className="btn-primary px-3 text-sm sm:px-4">Become a Dude</Link>
      </nav>
    </div>
  </header>;
}

export function Footer() {
  return <footer className="mt-16 border-t border-slate-200 bg-white"><div className="mx-auto flex max-w-6xl flex-col justify-between gap-5 px-5 py-8 text-sm text-slate-500 sm:flex-row sm:items-center"><div className="flex items-center gap-2.5"><BrandMark compact /><p>© {new Date().getFullYear()} Duedoh. Local knowledge, real hospitality.</p></div><Link to="/status" className="font-semibold text-navy">Check application status</Link></div></footer>;
}

export default function Layout({ children }) {
  return <div className="flex min-h-screen flex-col"><Header /><div className="flex-1">{children}</div><Footer /></div>;
}
