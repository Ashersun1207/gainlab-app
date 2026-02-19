/**
 * SceneList — Renders scene items grouped by section.
 * Supports expanded/collapsed display, active highlighting,
 * child widget expansion, and unimplemented scene graying.
 */

import { useState } from 'react';
import type { SceneConfig } from './sceneConfig';
import { SECTION_HEADERS } from './sceneConfig';
import { t } from '../../i18n';

interface SceneListProps {
  scenes: SceneConfig[];
  activeScene: string;
  expanded: boolean;
  onSceneSelect: (sceneId: string) => void;
}

// Sections to render in order
const SECTION_ORDER: Array<SceneConfig['section']> = [
  'top',
  'dashboards',
  'portfolio',
  'ai',
];

export function SceneList({
  scenes,
  activeScene,
  expanded,
  onSceneSelect,
}: SceneListProps) {
  const [expandedChild, setExpandedChild] = useState<string | null>(null);

  const handleClick = (scene: SceneConfig) => {
    if (!scene.implemented) return;
    onSceneSelect(scene.id);
    // Toggle child expansion
    setExpandedChild((prev) => (prev === scene.id ? null : scene.id));
  };

  return (
    <div className="sb-scene-list" data-testid="scene-list">
      {SECTION_ORDER.map((section) => {
        const sectionScenes = scenes.filter((s) => s.section === section);
        if (sectionScenes.length === 0) return null;

        const headerKey = SECTION_HEADERS[section];

        return (
          <div key={section} className="sb-section">
            {/* Section header (skip for 'top') */}
            {headerKey && expanded && (
              <div className="sb-section-header" data-testid={`section-${section}`}>
                {t(headerKey)}
              </div>
            )}
            {headerKey && !expanded && (
              <div className="sb-section-divider" />
            )}

            {sectionScenes.map((scene) => {
              const isActive = scene.id === activeScene;
              const isDisabled = !scene.implemented;
              const showChildren =
                expanded && expandedChild === scene.id && scene.children.length > 0;

              return (
                <div key={scene.id}>
                  <button
                    className={[
                      'sb-item',
                      isActive ? 'sb-item-active' : '',
                      isDisabled ? 'sb-item-disabled' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleClick(scene)}
                    title={expanded ? undefined : scene.badge}
                    data-testid={`scene-${scene.id}`}
                    disabled={isDisabled}
                  >
                    {/* Icon */}
                    <span
                      className="sb-item-icon"
                      dangerouslySetInnerHTML={{ __html: scene.svg }}
                    />

                    {/* Label + badge (expanded only) */}
                    {expanded && (
                      <>
                        <span className="sb-item-label">{t(scene.nameKey)}</span>
                        <span className="sb-item-badge">{scene.badge}</span>
                      </>
                    )}
                  </button>

                  {/* Children (expanded + clicked) */}
                  {showChildren && (
                    <div className="sb-children">
                      {scene.children.map((child) => (
                        <div key={child.id} className="sb-child-item">
                          <span className="sb-child-dot">·</span>
                          <span className="sb-child-label">{t(child.nameKey)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
