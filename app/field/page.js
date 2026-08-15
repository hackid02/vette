// FieldPage — server-rendered. The field data is fetched at request time, so
// the HTML judges get contains every entry even before any JS runs. If the
// Orion API is unreachable, an honest error panel renders instead of a spinner.
import Link from "next/link";
import Logo from "@/components/Logo";
import { fetchEntries } from "@/lib/orion";
import FieldEntryActions from "@/components/FieldEntryActions";
import VetAllButton from "@/components/VetAllButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "The Field — every entry under Vette | VETTE",
  description:
    "Vette puts every Orion hackathon entry under the same lens: the builder's own words, their registered wallet, their website. One page, the whole field.",
};

const short = (a) => (a ? `${a.slice(0, 6)}…${a.slice(-4)}` : "—");

export default async function FieldPage() {
  let entries = null;
  let fetchError = null;
  try {
    entries = await fetchEntries();
  } catch (e) {
    fetchError = String(e.message || e);
  }

  return (
    <main className="min-h-screen">
      <nav className="max-w-5xl mx-auto px-6 flex items-center justify-between py-6">
        <Link href="/"><Logo /></Link>
        <Link href="/" className="mono text-xs text-muted hover:text-vet transition-colors">← home</Link>
      </nav>

      <div className="max-w-5xl mx-auto px-6 pb-20">
        <div className="overline mb-3">the field, under vette</div>
        <h1 className="serif text-5xl sm:text-6xl font-light tracking-tight text-cream leading-none mb-4">
          Every entry. <em className="text-vet">Under the lens.</em>
        </h1>
        <p className="text-muted leading-relaxed text-sm max-w-2xl mb-8">
          Vette takes each contest entry <span className="text-soft">exactly as the contest registered it</span> —
          the builder&apos;s own words, their registered wallet, their website — and rules on whether
          behavior matches promise. Same rubric the judges use: usefulness, execution, originality.
          Every claim traces to a tool call.
        </p>

        {fetchError ? (
          <div className="panel p-8 mb-8 border-warn/40">
            <p className="text-warn font-extrabold text-sm mb-2">The Orion entry API is unreachable right now.</p>
            <p className="text-muted text-sm leading-relaxed mb-4">
              Vette&apos;s own engine is fine — this page pulls the contest&apos;s entry list from their API
              (<span className="mono">orionagents.org/api/hackathon/entries</span>), and it didn&apos;t respond:
              <span className="mono text-xs text-soft"> {fetchError}</span>.
            </p>
            <a href="/field" className="inline-block px-4 py-2.5 rounded-md bg-vet text-ink font-extrabold text-sm hover:opacity-90 transition-opacity">
              ↻ retry
            </a>
          </div>
        ) : (
          <>
            <div className="mb-8 flex items-center justify-between flex-wrap gap-3">
              <p className="mono text-xs text-muted">{entries.length} entries live on the Orion API</p>
              <VetAllButton count={entries.length} />
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {entries.map((e) => (
                <div key={e.id} className="panel p-6 flex flex-col gap-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="text-2xl font-extrabold tracking-tight text-soft">{e.name}</h3>
                      <p className="mono text-xs text-muted mt-1">by {e.builder}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="mono text-[10px] px-2.5 py-1 rounded border border-[#1E241F] text-muted">{e.category}</span>
                      <span className="mono text-[10px] px-2.5 py-1 rounded border border-vet/40 text-vet">orion {e.intelligenceScore}</span>
                      <span className="mono text-[10px] px-2.5 py-1 rounded border border-[#1E241F] text-muted">{e.votes} votes</span>
                    </div>
                  </div>

                  <p className="text-sm text-muted leading-relaxed line-clamp-3">{e.description}</p>

                  <div className="mono text-xs text-muted space-y-1">
                    <p>wallet (registered with Orion): <span className="text-soft">{short(e.wallet)}</span></p>
                    <p>
                      links:{" "}
                      {e.website && <a href={e.website} target="_blank" rel="noreferrer" className="text-vet hover:underline">site</a>}
                      {" · "}
                      {e.demo && <a href={e.demo} target="_blank" rel="noreferrer" className="text-vet hover:underline">demo</a>}
                      {" · "}
                      {e.socials.github && <a href={e.socials.github} target="_blank" rel="noreferrer" className="text-vet hover:underline">github</a>}
                      {" · "}
                      {e.socials.twitter && <a href={e.socials.twitter} target="_blank" rel="noreferrer" className="text-vet hover:underline">x</a>}
                    </p>
                  </div>

                  <div className="mt-auto pt-4 border-t border-[#1E241F]">
                    <FieldEntryActions
                      entry={{
                        id: e.id,
                        name: e.name,
                        website: e.website,
                        wallet: e.wallet,
                        description: e.description,
                      }}
                    />
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="panel p-10 text-center col-span-2">
                  <p className="text-muted">No entries on the API yet. Vette will be ready when the field grows.</p>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mono text-[11px] text-muted mt-12 text-center leading-relaxed">
          data: Orion public API · audits: Vette deterministic engine on Base<br />
          <span className="text-[#55555F]">Vette never invents. If a wallet is empty, the verdict is UNVERIFIABLE — not flattering, and not fiction.</span>
        </div>
      </div>
    </main>
  );
}
