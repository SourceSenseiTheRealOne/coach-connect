import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card/30">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <div className="col-span-2 md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="font-display font-bold text-primary-foreground text-sm">EC</span>
              </div>
              <span className="font-display font-bold text-lg text-foreground">
                Elite<span className="text-primary">Connect</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground">
              The technical heart of Portuguese football. Connect, learn, and grow.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">Platform</h4>
            <div className="flex flex-col gap-2">
              <Link to="/features" className="text-sm text-muted-foreground hover:text-primary transition-colors">Features</Link>
              <Link to="/pricing" className="text-sm text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
              <Link to="/about" className="text-sm text-muted-foreground hover:text-primary transition-colors">About</Link>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">Resources</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Drill Library</span>
              <span className="text-sm text-muted-foreground">Tactic Board</span>
              <span className="text-sm text-muted-foreground">Forum</span>
            </div>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground mb-3">Legal</h4>
            <div className="flex flex-col gap-2">
              <span className="text-sm text-muted-foreground">Privacy Policy</span>
              <span className="text-sm text-muted-foreground">Terms of Service</span>
              <span className="text-sm text-muted-foreground">GDPR</span>
            </div>
          </div>
        </div>
        <div className="border-t border-border mt-8 pt-8 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Elite-Connect. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
