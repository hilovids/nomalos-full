import './globals.css';
import NavBar from '../../components/navBar';
import RequireAuth from '../../components/requireAuth';
import Footer from '../../components/footer';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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