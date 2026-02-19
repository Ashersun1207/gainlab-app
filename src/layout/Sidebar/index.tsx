/**
 * Sidebar — Scene catalog model (Koyfin-style single column, dual state).
 * Matches preview-layout.html sidebar: hamburger toggle, logo, scene list, bottom add button.
 *
 * Collapsed: 42px, icon only with hover tooltip.
 * Expanded: 250px, icon + name + badge + arrow, click to expand child widgets.
 */

import { useState } from 'react';
import { SCENE_CONFIGS } from './sceneConfig';
import { SceneList } from './SceneList';
import { SidebarToggle } from './SidebarToggle';

interface SidebarProps {
  activeScene: string;
  onSceneSelect: (sceneId: string) => void;
  onToggleChat?: () => void;
}

export function Sidebar({
  activeScene,
  onSceneSelect,
  onToggleChat: _onToggleChat,
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

      {/* Bottom: add widget */}
      <div className="sb-bottom">
        <button className="sb-item" onClick={() => { /* placeholder */ }}>
          <span className="sb-ico">
            <svg viewBox="0 0 16 16" width="16" height="16" fill="currentColor">
              <path d="M7 2h2v5h5v2H9v5H7V9H2V7h5V2z" />
            </svg>
          </span>
          {expanded && <span className="sb-item-label">添加 Widget</span>}
          {!expanded && <span className="sb-tip">添加 Widget</span>}
        </button>
      </div>
    </nav>
  );
}
