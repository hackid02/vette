"use client";

// VetAllButton — dispatches the global vet-all event; each entry card picks it
// up and runs its own audit. No shared state, no popup storms.
export default function VetAllButton({ count = 0 }) {
  function vetAll() {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("vette:vet-all"));
    }
  }

  return (
    <button
      onClick={vetAll}
      disabled={!count}
      className="px-5 py-2.5 rounded-md border border-vet/40 text-vet font-bold text-sm hover:bg-vet hover:text-ink transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
    >
      VET THE WHOLE FIELD ({count}) →
    </button>
  );
}
