import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">
                  EC
                </span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Elite<span className="text-primary">Connect</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              {t("navigation.platform")}
            </h4>
            <div className="flex flex-col gap-2">
              <Link
                to="/features"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("navigation.features")}
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("navigation.pricing")}
              </Link>
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                {t("navigation.about")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              {t("navigation.resources")}
            </h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                {t("footer.drillLibrary")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("navigation.tacticBoard")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("navigation.forum")}
              </span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">
              {t("navigation.legal")}
            </h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">
                {t("footer.privacyPolicy")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("footer.termsOfService")}
              </span>
              <span className="text-sm text-muted-foreground">
                {t("footer.gdpr")}
              </span>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Coach Connect. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
