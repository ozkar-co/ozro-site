import { useSearchParams } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import InfoSidebar from './InfoSidebar';
import InfoContent from './InfoContent';
import '../styles/Information.css';

export type InfoSection = {
  id: string;
  title: string;
  /** Static icon path under /public (fallback when iconItemId is unset). */
  icon: string;
  /** Optional item id → atlas icon in the sidebar. */
  iconItemId?: number;
  category: string;
};

const sections: InfoSection[] = [
  // Información del Servidor
  { id: 'features', title: 'Especificaciones', icon: '/icons/feature.png', category: 'Información del Servidor' },
  { id: 'exp-rates', title: 'Rates de Experiencia', icon: '/icons/exp.png', category: 'Información del Servidor' },
  { id: 'drop-rates', title: 'Tasa de Drop', icon: '/icons/drop.png', category: 'Información del Servidor' },
  { id: 'stats', title: 'Estadísticas', icon: '/icons/stats.png', category: 'Información del Servidor' },
  { id: 'download', title: 'Descargas', icon: '/icons/download.png', category: 'Información del Servidor' },

  // Sistemas Personalizados
  { id: 'unique-features', title: 'Mecanicas\nÚnicas', icon: '/icons/unique.png', category: 'Sistemas Personalizados' },
  { id: 'cash-shop', title: 'Cash Shop', icon: '/icons/cash.png', category: 'Sistemas Personalizados' },
  { id: 'restrictions', title: 'Restricciones y penalizaciones', icon: '/icons/restriction.png', category: 'Sistemas Personalizados' },

  // Técnico
  { id: 'tech-sheet', title: 'Ficha técnica', icon: '/icons/server.gif', category: 'Técnico' },
];

const Information = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  const selectedSection = sections.some((section) => section.id === tabParam)
    ? tabParam as string
    : sections[0].id;

  return (
    <div className="information">
      <Header />
      <div className="server-info-section">
        <div className="info-container">
          <InfoSidebar 
            sections={sections} 
            selectedSection={selectedSection} 
            onSectionChange={(sectionId) => setSearchParams({ tab: sectionId }, { replace: true })}
          />
          <InfoContent selectedSection={selectedSection} />
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Information; 