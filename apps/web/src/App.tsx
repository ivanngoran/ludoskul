import { Link, Route, Routes } from 'react-router-dom';
import { Button } from '@ludoskul/ui';

function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-center">
      <h1 className="text-4xl font-black">🌟 Ludoskul</h1>
      <p className="mt-2 text-lg">Maths ludiques 6-14 ans — 100% gratuit, zéro pub.</p>
      <div className="mt-6 flex justify-center gap-4">
        <Link to="/play?mode=TRAINING"><Button>🛠️ Entraînement</Button></Link>
        <Link to="/play?mode=ARCADE"><Button>🏆 Arcade</Button></Link>
      </div>
      <p className="mt-6 text-sm text-slate-600">Phase 0 : monorepo scaffoldé avec pnpm + Turborepo.</p>
    </main>
  );
}

function Play() {
  return (
    <main className="mx-auto max-w-3xl p-6 text-center">
      <h2 className="text-2xl font-bold">Que veux-tu faire ?</h2>
      <p className="mt-2">Sélecteur de mode (FE-3.1) — à implémenter en Phase 2/3.</p>
      <Link to="/" className="mt-4 inline-block underline">Accueil</Link>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/play" element={<Play />} />
      <Route path="*" element={<Home />} />
    </Routes>
  );
}
