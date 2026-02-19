/**
 * MobileTabBar — 5 tabs (CK / NOW / HM / AI / More)
 * Shown at ≤768px. AI opens fullscreen chat overlay.
 * More opens bottom panel with remaining 10+ scenes.
 */

import { useState } from 'react';
import { SCENE_CONFIGS } from './Sidebar/sceneConfig';
import { t } from '../i18n';

export type MobileTab = 'stock_analysis' | 'snapshot' | 'market_heat' | 'ai' | 'more';

interface MobileTabBarProps {
  activeScene: string;
  onSceneSelect: (sceneId: string) => void;
  onToggleChat: () => void;
}

// 5 primary tabs
const TABS: Array<{
  key: MobileTab;
  sceneId?: string; // maps to SCENE_CONFIGS.id
  svg: string;
  labelKey: string; // i18n key
}> = [
  {
    key: 'stock_analysis',
    sceneId: 'stock_analysis',
    svg: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><rect x="1" y="9" width="3" height="6" rx=".5"/><rect x="5.5" y="5" width="3" height="10" rx=".5"/><rect x="10" y="1" width="3" height="14" rx=".5"/></svg>',
    labelKey: 'tab_ck',
  },
  {
    key: 'snapshot',
    sceneId: 'snapshot',
    svg: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M4 2l2.5 4H1.5L4 2z" opacity=".8"/><path d="M12 14l-2.5-4h5L12 14z" opacity=".5"/><rect x="7" y="6" width="2" height="4" rx=".5" opacity=".4"/></svg>',
    labelKey: 'tab_now',
  },
  {
    key: 'market_heat',
    sceneId: 'market_heat',
    svg: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><rect x="1" y="1" width="6.5" height="6.5" rx="1"/><rect x="8.5" y="1" width="6.5" height="6.5" rx="1" opacity=".5"/><rect x="1" y="8.5" width="6.5" height="6.5" rx="1" opacity=".5"/><rect x="8.5" y="8.5" width="6.5" height="6.5" rx="1" opacity=".3"/></svg>',
    labelKey: 'tab_hm',
  },
  {
    key: 'ai',
    svg: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><path d="M2 2h12a1 1 0 011 1v8a1 1 0 01-1 1H5l-3 3V3a1 1 0 011-1z"/></svg>',
    labelKey: 'tab_ai',
  },
  {
    key: 'more',
    svg: '<svg viewBox="0 0 16 16" width="18" height="18" fill="currentColor"><circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/></svg>',
    labelKey: 'tab_more',
  },
];

// Scenes shown in the "More" panel (exclude the 3 primary scene tabs + ai)
const MORE_SCENES = SCENE_CONFIGS.filter(
  (s) => !['stock_analysis', 'snapshot', 'market_heat', 'ai'].includes(s.id),
);

export function MobileTabBar({
  activeScene,
  onSceneSelect,
  onToggleChat,
}: MobileTabBarProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  const handleTabClick = (tab: (typeof TABS)[number]) => {
    if (tab.key === 'ai') {
      onToggleChat();
      setMoreOpen(false);
      return;
    }
    if (tab.key === 'more') {
      setMoreOpen((prev) => !prev);
      return;
    }
    if (tab.sceneId) {
      onSceneSelect(tab.sceneId);
      setMoreOpen(false);
    }
  };

  const handleMoreScene = (sceneId: string) => {
    onSceneSelect(sceneId);
    setMoreOpen(false);
  };

  // Determine active tab
  const activeTab: MobileTab =
    TABS.find((tab) => tab.sceneId === activeScene)?.key ?? 'more';

  return (
    <>
      {/* More panel overlay */}
      {moreOpen && (
        <>
          <div
            className="mobile-more-backdrop"
            onClick={() => setMoreOpen(false)}
          />
          <div className="mobile-more-panel" data-testid="mobile-more-panel">
            <div className="mobile-more-header">
              <span>{t('tab_more')}</span>
              <button
                className="mobile-more-close"
                onClick={() => setMoreOpen(false)}
              >
                ✕
              </button>
            </div>
            <div className="mobile-more-list">
              {MORE_SCENES.map((scene) => (
                <button
                  key={scene.id}
                  className={`btab-more-item ${!scene.implemented ? 'btab-more-disabled' : ''}`}
                  onClick={() => scene.implemented && handleMoreScene(scene.id)}
                  disabled={!scene.implemented}
                  data-testid={`more-scene-${scene.id}`}
                >
                  <span
                    className="btab-more-icon"
                    dangerouslySetInnerHTML={{ __html: scene.svg }}
                  />
                  <span className="btab-more-name">{t(scene.nameKey)}</span>
                  <span className="btab-more-badge">{scene.badge}</span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Tab bar */}
      <nav className="mobile-tab-bar" data-testid="mobile-tab-bar">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => handleTabClick(tab)}
            className={`mobile-tab ${activeTab === tab.key ? 'mobile-tab-active' : ''}`}
            data-testid={`mobile-tab-${tab.key}`}
          >
            <span
              className="mobile-tab-icon"
              dangerouslySetInnerHTML={{ __html: tab.svg }}
            />
            <span className="mobile-tab-label">{t(tab.labelKey)}</span>
          </button>
        ))}
      </nav>
    </>
  );
}
