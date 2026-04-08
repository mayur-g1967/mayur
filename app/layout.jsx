import "./globals.css";
import Providers from "./components/shared/provider/providers";
import CustomCursor from "./components/shared/CustomCursor/CustomCursor";
import { LenisProvider } from "./components/landing/ui/LenisProvider";

export const metadata = {
  title: "PersonaAI",
  description: "Your AI-Powered Personal Growth Companion",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <Providers>
          <LenisProvider>
            <CustomCursor />
            {children}
          </LenisProvider>
        </Providers>
      </body>
    </html>
  );
}