import './globals.css';
import { AuthProvider } from '../components/AuthProvider';
import ConditionalFooter from '../components/ConditionalFooter';
import Footer from '../components/Footer';

export const metadata = {
  title: "FRIAXIS - Gestão de Dispositivos - Powered by Coruzen",
  description: "Mobile Device Management para Android corporativo",
  icons: {
    icon: '/icon.svg',
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className="h-full">
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