import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import ScrollToTop from './components/ScrollToTop';
import './App.css';

const Main = lazy(() => import('./components/Main'));
const Information = lazy(() => import('./components/Information'));
const Database = lazy(() => import('./components/Database'));
const Encyclopedia = lazy(() => import('./components/Encyclopedia'));
const Rankings = lazy(() => import('./components/Rankings'));
const CardBook = lazy(() => import('./components/CardBook'));
const Donate = lazy(() => import('./components/Donate'));
const Thanks = lazy(() => import('./components/Thanks'));
const NotFound = lazy(() => import('./components/NotFound'));

const MapRedirect = () => {
  const { map } = useParams<{ map: string }>();
  return <Navigate to={`/database?tab=maps&map=${encodeURIComponent(map ?? '')}`} replace />;
};

const App = () => {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Suspense fallback={
        <div className="loading-screen">
          <img src="/logo.png" alt="Cargando..." className="loading-logo" />
        </div>
      }>
        <Routes>
          <Route path="/" element={<Main />} />
          <Route path="/information" element={<Information />} />
          <Route path="/database" element={<Database />} />
          <Route path="/encyclopedia" element={<Encyclopedia />} />
          <Route path="/maps" element={<Navigate to="/database?tab=maps" replace />} />
          <Route path="/maps/:map" element={<MapRedirect />} />
          <Route path="/mvps" element={<Navigate to="/database?tab=mvps" replace />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/cards" element={<Navigate to="/rankings?tab=cards" replace />} />
          <Route path="/cards/:accountId" element={<CardBook />} />
          <Route path="/donate" element={<Donate />} />
          <Route path="/thanks" element={<Thanks />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;
