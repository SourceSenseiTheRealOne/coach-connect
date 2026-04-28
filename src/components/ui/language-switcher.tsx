import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLanguage, type LanguageCode } from "@/lib/language-context";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSwitcherProps {
  variant?: "default" | "minimal" | "button";
}

export function LanguageSwitcher({ variant = "default" }: LanguageSwitcherProps) {
  const { t } = useTranslation();
  const { language, setLanguage, languages } = useLanguage();

  const handleLanguageChange = (value: string) => {
    setLanguage(value as LanguageCode);
  };

  const currentLanguage = languages.find(l => l.code === language);

  if (variant === "minimal") {
    return (
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px] h-8 bg-secondary border-border text-foreground">
          <SelectValue placeholder={t("settings.language.selectPlaceholder")}>
            <span className="flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              <span className="text-sm">{currentLanguage?.code.toUpperCase()}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  if (variant === "button") {
    return (
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[180px] bg-secondary border-border text-foreground hover:bg-secondary/80 transition-colors">
          <Globe className="w-4 h-4 mr-2 text-primary" />
          <SelectValue placeholder={t("settings.language.selectPlaceholder")}>
            <span className="flex items-center gap-2">
              <span>{currentLanguage?.flag}</span>
              <span>{currentLanguage?.name}</span>
            </span>
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
            >
              <span className="flex items-center gap-2">
                <span>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }

  // Default variant with full styling
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">
            {t("settings.language.title")}
          </span>
        </div>
        <Select value={language} onValueChange={handleLanguageChange}>
          <SelectTrigger className="w-[200px] bg-secondary border-border text-foreground">
            <SelectValue placeholder={t("settings.language.selectPlaceholder")}>
              <span className="flex items-center gap-2">
                <span>{currentLanguage?.flag}</span>
                <span>{currentLanguage?.name}</span>
              </span>
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-popover border-border">
            {languages.map((lang) => (
              <SelectItem
                key={lang.code}
                value={lang.code}
                className="text-foreground focus:bg-accent focus:text-accent-foreground cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <span>{lang.flag}</span>
                  <span>{lang.name}</span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {t("settings.language.description")}
      </p>
    </div>
  );
}
