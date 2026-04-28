"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import i18n, { supportedLanguages, type LanguageCode } from "./i18n";

export type { LanguageCode };

interface LanguageContextType {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  languages: typeof supportedLanguages;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined,
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    // Get from i18n's detected language or localStorage
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("i18nextLng") as LanguageCode;
      if (stored && supportedLanguages.some((l) => l.code === stored)) {
        return stored;
      }
    }
    return "en";
  });

  // Sync with i18n when it changes
  useEffect(() => {
    const handleLanguageChanged = (lng: string) => {
      if (supportedLanguages.some((l) => l.code === lng)) {
        setLanguageState(lng as LanguageCode);
      }
    };

    i18n.on("languageChanged", handleLanguageChanged);
    return () => {
      i18n.off("languageChanged", handleLanguageChanged);
    };
  }, []);

  const setLanguage = useCallback((newLanguage: LanguageCode) => {
    i18n.changeLanguage(newLanguage);
    setLanguageState(newLanguage);
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage, languages: supportedLanguages }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
