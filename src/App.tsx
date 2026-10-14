import { useEffect } from 'react';
import { HashRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { IconCompare, IconSearch, IconShield, IconSpark } from './components/icons';
import { ComparePage } from './pages/ComparePage';
import { HighlightsPage } from './pages/HighlightsPage';
import { PlayerPage } from './pages/PlayerPage';
import { SavePage } from './pages/SavePage';
import { SearchPage } from './pages/SearchPage';
import { useApp } from './store/app';
import { useData } from './store/data';

function BottomNav() {
  const compareCount = useApp((s) => s.compare.length);
  return (
    <nav className="bottom-nav">
      <NavLink to="/" end><IconSearch />Buscar</NavLink>
      <NavLink to="/destaques"><IconSpark />Destaques</NavLink>
      <NavLink to="/save"><IconShield />Meu save</NavLink>
      <NavLink to="/comparar">
        <IconCompare />Comparar
        {compareCount > 0 && <span className="nav-badge">{compareCount}</span>}
      </NavLink>
    </nav>
  );
}

export default function App() {
  const { status, error, load } = useData();
  useEffect(() => {
    load();
  }, [load]);

  if (status !== 'ready') {
    return (
      <div className="loading">
        <div>
          {status === 'error' ? (
            <>
              <p>Não foi possível carregar a base de jogadores.</p>
              <p className="small">{error}</p>
              <button className="btn primary" onClick={() => { useData.setState({ status: 'idle' }); load(); }}>Tentar de novo</button>
            </>
          ) : (
            <>
              <div className="spinner" />
              <p>Carregando ~20 mil jogadores do FC 27…</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <main className="app">
        <Routes>
          <Route path="/" element={<SearchPage />} />
          <Route path="/destaques" element={<HighlightsPage />} />
          <Route path="/jogador/:id" element={<PlayerPage />} />
          <Route path="/comparar" element={<ComparePage />} />
          <Route path="/save" element={<SavePage />} />
          <Route path="/save/:tab" element={<SavePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
    </HashRouter>
  );
}
