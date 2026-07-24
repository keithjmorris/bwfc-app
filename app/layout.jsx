'use client';

import { Inter, Bebas_Neue } from 'next/font/google';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { FavouritesProvider, useFavourites } from '@/lib/FavouritesContext';
import TeamPicker from '@/components/TeamPicker';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-body' });
const bebas = Bebas_Neue({ weight: '400', subsets: ['latin'], variable: '--font-display' });

function AppShell({ children }) {
  const { favourites, updateFavourites } = useFavourites();
  const [showPicker, setShowPicker] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fc_favourites');
    if (!saved || JSON.parse(saved).length === 0) {
      setShowPicker(true);
    }
    setReady(true);
  }, []);

  function handleSave(teams) {
    updateFavourites(teams);
    setShowPicker(false);
  }

  if (!ready) return null;

  return (
    <>
      {showPicker && <TeamPicker onSave={handleSave} />}
      <nav className="main-nav">
        <Link href="/" className="nav-link">Fixtures</Link>
        <Link href="/results" className="nav-link">Results</Link>
        <Link href="/standings" className="nav-link">Tables</Link>
        <Link href="/stats" className="nav-link">Stats</Link>
        <button
          className="nav-link nav-edit-teams"
          onClick={() => setShowPicker(true)}
        >
          My Teams
        </button>
      </nav>
      {children}
    </>
  );
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${bebas.variable}`}>
      <body>
        <FavouritesProvider>
          <AppShell>{children}</AppShell>
        </FavouritesProvider>
      </body>
    </html>
  );
}