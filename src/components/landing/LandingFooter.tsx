import { Link } from 'react-router-dom';

export default function LandingFooter() {
  return (
    <footer className="border-t border-border px-4 py-8">
      <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
        <div className="flex items-center">
          <div>
            <span className="text-lg font-bold tracking-tight"><span className="text-primary">V</span>ECTO</span>
            <p className="mt-1 text-xs text-muted-foreground">© {new Date().getFullYear()} Vecto. All rights reserved.</p>
          </div>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          <Link to="/terms" className="hover:text-foreground transition-colors">Terms</Link>
          <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
          <Link to="/auth" className="hover:text-foreground transition-colors">Sign In</Link>
          <a href="mailto:contact@vecto.fit" className="hover:text-foreground transition-colors">Contact</a>
        </div>
      </div>
      <p className="text-center text-xs text-muted-foreground mt-4">vecto.fit</p>
    </footer>
  );
}
