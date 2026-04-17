import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function LandingNav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-border safe-top">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center">
          <span className="text-xl font-bold tracking-tight"><span className="text-primary">V</span>ECTO</span>
        </Link>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <Link to="/auth">Login</Link>
          </Button>
          <Button asChild size="sm" className="font-bold">
            <Link to="/auth">Get Started Free</Link>
          </Button>
        </div>
      </div>
    </nav>
  );
}
