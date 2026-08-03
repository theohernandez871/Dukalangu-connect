import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { ROUTES } from '@/constants/routes';

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="text-7xl font-extrabold text-gradient">404</p>
      <h1 className="mt-4 text-xl font-bold text-slate-800 dark:text-slate-100">Ukurasa haukupatikana</h1>
      <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
        Ukurasa unaoutafuta haupo au umehamishwa.
      </p>
      <Link to={ROUTES.root} className="mt-6">
        <Button>Rudi mwanzo</Button>
      </Link>
    </div>
  );
}
