export const metadata = {
  title: 'Udhar Book — Salhotra Multi Store',
  description: 'Customer Credit Ledger (Udhar Book) — Salhotra Multi Store',
  manifest: '/manifest.json',
  appleWebApp: { capable: true, title: 'Udhar Book', statusBarStyle: 'default' }
};
export const viewport = {
  themeColor: '#12714a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/app.css" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="color-scheme" content="light dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
