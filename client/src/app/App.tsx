import {
  BrowserRouter,
  Route,
  Routes,
} from 'react-router-dom';

import { AppShell } from '../components/layout/AppShell';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { FaqPage } from '../pages/FaqPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ServicesPage } from '../pages/ServicesPage';

/**
 * The single client-side route tree. AppShell owns the shared chrome while
 * the outlet receives exactly one page for the current public pathname.
 */
export function App(): JSX.Element {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/nosotros" element={<AboutPage />} />
          <Route path="/servicios" element={<ServicesPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contacto" element={<ContactPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
