import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';

import { Footer } from './Footer';
import { Navbar } from './Navbar';
import { WhatsAppButton } from './WhatsAppButton';

export interface AppShellProps {
  children?: ReactNode;
}

/**
 * Shared page frame for every public route.
 *
 * The fixed navigation is paired with top padding on the main landmark, while
 * bottom padding keeps route content clear of the floating WhatsApp control.
 * The footer and floating control are mounted here so pages do not duplicate
 * shared chrome.
 */
export function AppShell({ children }: AppShellProps = {}): JSX.Element {
  return (
    <div
      id="app-shell"
      className="min-h-screen overflow-x-clip bg-brand-background text-brand-text-primary"
    >
      <Navbar />
      <main id="main-content" className="min-h-screen pt-20 pb-24">
        {children ?? <Outlet />}
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}
