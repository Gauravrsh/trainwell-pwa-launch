import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="text-lg font-bold">
          train<span className="text-primary">well</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href="#pricing">Pricing</a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link to="/auth">Sign In</Link>
          </Button>
          <Button asChild size="sm" className="hidden sm:inline-flex font-bold">
            <Link to="/auth">Start Discipline Trial</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
