import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="border-t border-border bg-card/30 geometric-pattern">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg shadow-primary/20">
                <span className="font-display font-bold text-primary-foreground text-base">
                  CC
                </span>
              </div>
              <span className="font-display font-bold text-xl text-foreground">
                Coach<span className="gradient-text">Connect</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {t("footer.tagline")}
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-base">
              {t("navigation.platform")}
            </h4>
            <div className="flex flex-col gap-3">
              <Link
                to="/features"
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1"
              >
                {t("navigation.features")}
              </Link>
              <Link
                to="/pricing"
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1"
              >
                {t("navigation.pricing")}
              </Link>
              <Link
                to="/about"
                className="text-sm text-muted-foreground hover:text-primary transition-all duration-300 hover:translate-x-1"
              >
                {t("navigation.about")}
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-4 text-base">
              {t("navigation.resources")}
            </h4>
            <div className="flex flex-col gap-3">
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
            <h4 className="font-display font-semibold text-foreground mb-4 text-base">
              {t("navigation.legal")}
            </h4>
            <div className="flex flex-col gap-3">
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
        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Coach Connect. {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}
