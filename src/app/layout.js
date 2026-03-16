import "./globals.css";

export const metadata = {
  title: "Payout Management MVP",
  description: "Small but complete full-stack payout management feature",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
