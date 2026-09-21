import { Link } from "react-router-dom";
import Layout from "../components/Layout.jsx";

export default function NotFound() {
  return (
    <Layout>
      <main className="mx-auto grid max-w-lg place-items-center px-5 py-24 text-center">
        <p className="display text-6xl text-navy">404</p>
        <p className="mt-3 text-lg text-slate-600">
          We couldn't find that page.
        </p>
        <Link to="/" className="btn-primary mt-8">
          Back to Duedoh home
        </Link>
      </main>
    </Layout>
  );
}
