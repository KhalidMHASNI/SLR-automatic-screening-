import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, History } from 'lucide-react';
import { useScreeningStore } from '../../store/useScreeningStore';
import { formatDistanceToNow } from 'date-fns';

export const Navbar = () => {
  const store = useScreeningStore();
  const navigate = useNavigate();

  const handleLoadHistory = (id: string) => {
    store.loadFromHistory(id);
    navigate('/results');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-14 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-bold text-slate-900">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <span>LitScreen</span>
        </Link>
        <nav className="flex items-center gap-4">
          <Link to="/results" className="text-sm font-medium text-slate-600 hover:text-slate-900">
            Results
          </Link>
          <div className="relative group">
            <button className="flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-slate-900">
              <History className="h-4 w-4" />
              History
            </button>
            <div className="absolute right-0 top-full mt-1 hidden w-80 flex-col rounded-md border bg-white shadow-lg group-hover:flex">
              {store.history.length === 0 ? (
                <div className="p-4 text-sm text-slate-500 text-center">No past sessions</div>
              ) : (
                store.history.map(h => (
                  <button 
                    key={h.id} 
                    onClick={() => handleLoadHistory(h.id)}
                    className="flex flex-col items-start border-b p-3 text-left hover:bg-slate-50 last:border-0"
                  >
                    <div className="text-xs font-medium text-slate-500 mb-1">
                      {formatDistanceToNow(new Date(h.date), { addSuffix: true })}
                    </div>
                    <div className="text-sm font-semibold text-slate-900 line-clamp-1 mb-1">
                      {h.thesis}
                    </div>
                    <div className="flex gap-2 text-xs">
                      <span className="text-green-600">{h.stats.included} In</span>
                      <span className="text-amber-600">{h.stats.maybe} Maybe</span>
                      <span className="text-red-600">{h.stats.excluded} Ex</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </nav>
      </div>
    </header>
  );
};
