import './globals.css';
import { AuthProvider } from '../components/AuthProvider';

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
      <body className="bg-gray-50 font-sans antialiased h-full w-full flex flex-col">
        <AuthProvider>
          <div className="flex-1 min-h-0">
            {children}
          </div>
          <footer className="flex-shrink-0 w-full bg-white/80 backdrop-blur-sm text-center py-3 border-t border-gray-200/50">
            <div className="text-gray-700 text-sm font-medium">FRIAXIS - Gestão de Dispositivos © 2025.</div>
            <div className="text-xs text-gray-500 mt-1">Powered by <span className="text-green-600 font-semibold">Coruzen.</span></div>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}