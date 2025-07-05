import './globals.css';
import NavBar from '../../components/navBar';
import RequireAuth from '../../components/requireAuth';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <NavBar />
        <RequireAuth>
          {children}
        </RequireAuth>
      </body>
    </html>
  );
}