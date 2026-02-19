/**
 * Sidebar — Scene catalog model (Koyfin-style single column, dual state).
 *
 * Collapsed: 42px, icons only with hover tooltip.
 * Expanded: 250px, icon + name + badge, click to expand child widgets.
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
      {/* Logo + Toggle */}
      <div className="sb-header">
        <div className="sb-logo" data-testid="sidebar-logo">
          GL
        </div>
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
    </nav>
  );
}
