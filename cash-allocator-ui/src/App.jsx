import { useState } from 'react'
import InvoicesPage from './pages/InvoicesPage'
import { ReviewChip } from './components/Primitives';
import ReviewPage from './pages/ReviewPage';

const TABS = [
  { id: "invoices", label: "Invoices" },
  { id: "review", label: "Needs review" },
];

export default function App() {
  const [tab, setTab] = useState("invoices");

  return (
    <div className="min-h-screen">
      <header className="border-b border-hair">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-baseline justify-between">
          <div className="flex items-baseline gap-3">
            <h1 className="text-base font-semibold tracking-tight">Cash Allocator</h1>
            <span className="text-xs text-graphite uppercase tracking-widest">v1.0</span>
          </div>
          <div className="text-xs text-graphite font-mono tabular">
            {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" })}
          </div>
        </div>

        <nav className="max-w-6xl mx-auto px-6 flex gap-6">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 -mb-px text-sm font-medium transition-colors ${
                tab === t.id
                  ? "text-ink border-b-2 border-ink"
                  : "text-graphite hover:text-ink"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab == "invoices" && <InvoicesPage />}
        {tab == "review" && <ReviewPage />}
      </main>

      <footer className="max-w-6xl mx-auto px-6 py-6 border-t border-hair mt-12 text-xs text-graphite">
        Internal AR reconciliation tooling. Built as a learning project.
      </footer>
    </div>
  );
}
