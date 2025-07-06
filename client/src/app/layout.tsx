import './globals.css';
import NavBar from '../../components/navBar';
import RequireAuth from '../../components/requireAuth';
import Footer from '../../components/footer';
import ScrollToTopButton from '../../components/scrollButton';
import MobileBanner from '../../components/mobileBanner';

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
        <ScrollToTopButton />
        <Footer />
        <MobileBanner />
      </body>
    </html>
  );
}