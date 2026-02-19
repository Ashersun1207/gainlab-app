/**
 * Sidebar — Scene catalog model (Koyfin-style single column, dual state).
 * Matches preview-layout.html sidebar: hamburger toggle, logo, scene list, bottom settings button.
 *
 * Collapsed: 42px, icon only with hover tooltip.
 * Expanded: 250px, icon + name + badge + arrow, click to expand child widgets.
 */

import { useState } from 'react';
import { SCENE_CONFIGS } from './sceneConfig';
import { SceneList } from './SceneList';
import { SidebarToggle } from './SidebarToggle';
import { t } from '../../i18n';

interface SidebarProps {
  activeScene: string;
  onSceneSelect: (sceneId: string) => void;
  onToggleChat?: () => void;
  onOpenSettings?: () => void;
}

export function Sidebar({
  activeScene,
  onSceneSelect,
  onToggleChat: _onToggleChat,
  onOpenSettings,
}: SidebarProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <nav
      className={`sidebar ${expanded ? 'sidebar-expanded' : ''}`}
      data-testid="sidebar"
    >
      {/* Top: hamburger + logo */}
      <div className="sb-top">
        <span className="sb-logo-text">GainLab</span>
        <SidebarToggle
          expanded={expanded}
          onToggle={() => setExpanded(!expanded)}
        />
      </div>

      {/* Scene List */}
      <div className="sb-scroll">
        <SceneList
          scenes={SCENE_CONFIGS}
          activeScene={activeScene}
          expanded={expanded}
          onSceneSelect={onSceneSelect}
        />
      </div>

      {/* Bottom: settings gear */}
      <div className="sb-bottom">
        <button className="sb-item" onClick={onOpenSettings}>
          <span className="sb-ico">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M6.5.75a.75.75 0 0 1 .75-.75h1.5a.75.75 0 0 1 .75.75v.72a5.489 5.489 0 0 1 1.37.568l.51-.51a.75.75 0 0 1 1.06 0l1.06 1.06a.75.75 0 0 1 0 1.06l-.51.51c.24.43.43.89.568 1.37h.72a.75.75 0 0 1 .75.75v1.5a.75.75 0 0 1-.75.75h-.72a5.489 5.489 0 0 1-.568 1.37l.51.51a.75.75 0 0 1 0 1.06l-1.06 1.06a.75.75 0 0 1-1.06 0l-.51-.51a5.489 5.489 0 0 1-1.37.568v.72a.75.75 0 0 1-.75.75h-1.5a.75.75 0 0 1-.75-.75v-.72a5.489 5.489 0 0 1-1.37-.568l-.51.51a.75.75 0 0 1-1.06 0l-1.06-1.06a.75.75 0 0 1 0-1.06l.51-.51A5.489 5.489 0 0 1 2.53 8.72H1.81a.75.75 0 0 1-.75-.75v-1.5a.75.75 0 0 1 .75-.75h.72c.138-.48.328-.94.568-1.37l-.51-.51a.75.75 0 0 1 0-1.06l1.06-1.06a.75.75 0 0 1 1.06 0l.51.51A5.489 5.489 0 0 1 6.59 1.47V.75zM8 10a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
            </svg>
          </span>
          {expanded && <span className="sb-item-label">{t('settings_title')}</span>}
          {!expanded && <span className="sb-tip">{t('settings_title')}</span>}
        </button>
      </div>
    </nav>
  );
}
