import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import ConditionalFooter from '../components/ConditionalFooter';
import Footer from '../components/Footer';

export const metadata = {
  title: "FRIAXIS - Gestão de Dispositivos - Powered by Coruzen",
  description: "Mobile Device Management para Android corporativo",
  icons: {
    icon: '/icon.png',
    shortcut: '/favicon-32x32.png',
    apple: '/apple-touch-icon.png',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className="bg-gray-50 font-sans antialiased min-h-full flex flex-col">
        <AuthProvider>
          <div className="flex-1">
            {children}
          </div>
          <ConditionalFooter>
            <Footer />
          </ConditionalFooter>
        </AuthProvider>
      </body>
    </html>
  );
}