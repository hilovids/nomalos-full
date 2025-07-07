import './globals.css';
import NavBar from '../../components/navBar';
import RequireAuth from '../../components/requireAuth';
import Footer from '../../components/footer';
import ScrollToTopButton from '../../components/scrollButton';
import NotificationBanner from '../../components/notificationBanner';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" type="image/x-icon" />
      </head>
      <body>
        {/* Header section to reserve space for fixed navbar */}
        <header className="w-full h-12 sm:h-16 fixed top-0 left-0 z-50">
          <NavBar />
          <NotificationBanner />
        </header>
        {/* Main content, with padding to avoid overlap */}
        <main className="pt-20 sm:pt-24 min-h-screen">
          <RequireAuth>
            {children}
          </RequireAuth>
        </main>
        <ScrollToTopButton />
        <Footer />
      </body>
    </html>
  );
}