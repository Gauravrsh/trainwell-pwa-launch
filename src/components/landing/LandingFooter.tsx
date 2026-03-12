import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div>
          <span className="text-lg font-bold">train<span className="text-primary">well</span></span>
          <p className="mt-1 text-xs text-muted-foreground">© {new Date().getFullYear()} TrainWell. All rights reserved.</p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
        </div>
      </div>
    </footer>
  );
}
