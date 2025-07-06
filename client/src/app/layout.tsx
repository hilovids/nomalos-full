import './globals.css';
import NavBar from '../../components/navBar';
import RequireAuth from '../../components/requireAuth';
import Footer from '../../components/footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        <NavBar />
        <RequireAuth>
          {children}
        </RequireAuth>
        <Footer />
      </body>
    </html>
  );
}