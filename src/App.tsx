/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { BullionProvider, useBullion } from './context/BullionContext';
import { Header } from './components/Header';
import { HeroCarousel } from './components/HeroCarousel';
import { ProductCatalog } from './components/ProductCatalog';
import { SpotCharts } from './components/SpotCharts';
import { ShowroomAndNews } from './components/ShowroomAndNews';
import { ClientPortal } from './components/ClientPortal';
import { AdminPanel } from './components/AdminPanel';
import { CartDrawer } from './components/CartDrawer';
import { Footer } from './components/Footer';
import { ToastStack } from './components/ToastStack';
import { AuthModal } from './components/AuthModal';
import { ContactSection } from './components/ContactSection';

const BullionStarShell: React.FC = () => {
  const { view } = useBullion();
  const [selectedMetalChart, setSelectedMetalChart] = useState<'Gold' | 'Silver' | 'Platinum' | 'Palladium'>('Gold');

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip flex flex-col bg-[#F4F6F9] text-slate-900">
      <Header onSelectMetalChart={setSelectedMetalChart} />

      <main className="flex-1 w-full max-w-full">
        {view === 'home' && (
          <>
            <HeroCarousel />
            <ProductCatalog mode="homepage" />
            <SpotCharts selectedMetal={selectedMetalChart} onSelectMetal={setSelectedMetalChart} />
            <ShowroomAndNews />
            <ContactSection />
          </>
        )}

        {view === 'catalog' && <ProductCatalog mode="full" />}

        {view === 'charts' && (
          <div className="pb-10">
            <SpotCharts selectedMetal={selectedMetalChart} onSelectMetal={setSelectedMetalChart} />
            <ShowroomAndNews />
          </div>
        )}

        {view === 'vaults' && <ShowroomAndNews showVaultDetails />}

        {view === 'account' && <ClientPortal />}

        {view === 'admin' && <AdminPanel />}
      </main>

      <Footer />
      <CartDrawer />
      <AuthModal />
      <ToastStack />
    </div>
  );
};

export default function App() {
  return (
    <BullionProvider>
      <BullionStarShell />
    </BullionProvider>
  );
}
