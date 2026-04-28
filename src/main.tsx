import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "@/lib/i18n";
import { LanguageProvider } from "@/lib/language-context";
import { TRPCProvider } from "@/lib/trpc-provider";

createRoot(document.getElementById("root")!).render(
  <LanguageProvider>
    <TRPCProvider>
      <App />
    </TRPCProvider>
  </LanguageProvider>,
);
