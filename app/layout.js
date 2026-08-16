import "./globals.css";

export const metadata = {
  metadataBase: new URL("https://vette-nu.vercel.app"),
  title: "VETTE — the agent that vets agents",
  description:
    "VETTE audits any AI agent against its own promises, keeps a daily watch on your wallet, and kills dangerous approvals with one click. Every claim traces to a real transaction. Built for the Orion Builder Hackathon.",
  openGraph: {
    title: "VETTE — the agent that vets agents",
    description:
      "Every agent makes promises. Vette checks the chain, delivers a verdict, and kills the danger — one click. Every claim traces to a real transaction.",
    siteName: "VETTE",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "VETTE — the agent that vets agents",
    description:
      "Every agent makes promises. Vette checks the chain, delivers a verdict, and kills the danger — one click.",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-ink text-soft antialiased">{children}</body>
    </html>
  );
}
