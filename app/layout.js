export const metadata = {
  title: 'Udhar Book — Salhotra Multi Store',
  description: 'Customer Credit Ledger (Udhar Book) — Salhotra Multi Store',
  manifest: '/manifest.json'
};
export const viewport = {
  themeColor: '#0f1420',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/app.css" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}
