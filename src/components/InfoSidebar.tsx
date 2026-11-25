import { useEffect, useState } from 'react';
import type { InfoSection } from './Information';
import AtlasSprite from './AtlasSprite';
import { resolveSprite, type SpriteRect } from '../api/assets';
import { PLACEHOLDER_ITEM_ICON } from '../api/placeholders';
import '../styles/Information.css';

interface InfoSidebarProps {
  sections: InfoSection[];
  selectedSection: string;
  onSectionChange: (sectionId: string) => void;
}

function SidebarIcon({ section }: { section: InfoSection }) {
  const [sprite, setSprite] = useState<SpriteRect | string | null>(null);

  useEffect(() => {
    if (section.iconItemId == null) {
      setSprite(null);
      return;
    }
    let cancelled = false;
    resolveSprite(section.iconItemId, 'items/icons')
      .then((resolved) => {
        if (!cancelled) setSprite(resolved);
      })
      .catch(() => {
        if (!cancelled) setSprite(null);
      });
    return () => {
      cancelled = true;
    };
  }, [section.iconItemId]);

  if (section.iconItemId != null) {
    return (
      <AtlasSprite
        sprite={sprite}
        alt=""
        className="sidebar-icon"
        fallback={section.icon || PLACEHOLDER_ITEM_ICON}
        fit={{ maxWidth: 24, maxHeight: 24 }}
      />
    );
  }

  return <img src={section.icon} alt="" className="sidebar-icon" />;
}

const InfoSidebar = ({ sections, selectedSection, onSectionChange }: InfoSidebarProps) => {
  const categories = Array.from(new Set(sections.map((section) => section.category)));

  return (
    <div className="info-sidebar">
      <div className="scrollable-content">
        {categories.map((category) => (
          <div key={category} className="sidebar-category">
            <h3>{category}</h3>
            <ul>
              {sections
                .filter((section) => section.category === category)
                .map((section) => (
                  <li
                    key={section.id}
                    className={`sidebar-item ${selectedSection === section.id ? 'active' : ''}`}
                    onClick={() => onSectionChange(section.id)}
                  >
                    <SidebarIcon section={section} />
                    <span>{section.title}</span>
                  </li>
                ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
};

export default InfoSidebar;
