export const metadata = {
  title: 'Netflix QR Generator',
  description: 'Generate QR Aroshi',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body style={{ margin: 0, background: '#0f0c29' }}>{children}</body>
    </html>
  );
}
