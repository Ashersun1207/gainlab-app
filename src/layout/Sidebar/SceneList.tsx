/**
 * SceneList — Renders scene items grouped by section.
 * Matches preview-layout.html sidebar behavior:
 * - Active scene icon gets accent background
 * - Collapsed: hover shows tooltip
 * - Expanded: shows name + badge + arrow (› / ▾)
 * - Click: select scene + toggle child expansion
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
    if (scene.children.length > 0) {
      setExpandedChild((prev) => (prev === scene.id ? null : scene.id));
    } else {
      setExpandedChild(null);
    }
  };

  return (
    <div className="sb-scene-list" data-testid="scene-list">
      {SECTION_ORDER.map((section, sIdx) => {
        const sectionScenes = scenes.filter((s) => s.section === section);
        if (sectionScenes.length === 0) return null;

        const headerKey = SECTION_HEADERS[section];

        return (
          <div key={section} className="sb-section">
            {/* Separator before portfolio and ai sections */}
            {sIdx > 0 && (section === 'portfolio' || section === 'ai') && (
              <div className="sb-sep" />
            )}

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
              const isChildExpanded = expandedChild === scene.id;
              const showChildren =
                expanded && isChildExpanded && scene.children.length > 0;

              return (
                <div key={scene.id}>
                  <button
                    className={[
                      'sb-item',
                      isActive ? 'sb-item-active' : '',
                      isDisabled ? 'sb-item-disabled' : '',
                      isChildExpanded ? 'sb-item-expanded' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    onClick={() => handleClick(scene)}
                    data-testid={`scene-${scene.id}`}
                    disabled={isDisabled}
                  >
                    {/* Icon wrapper — active gets accent background */}
                    <span
                      className={`sb-ico ${isActive ? 'sb-ico-active' : ''}`}
                      dangerouslySetInnerHTML={{ __html: scene.svg }}
                    />

                    {/* Label + arrow + badge (expanded only) */}
                    {expanded && (
                      <>
                        <span className="sb-item-label">{t(scene.nameKey)}</span>
                        {scene.children.length > 0 && (
                          <span className="sb-arrow">{isChildExpanded ? '▾' : '›'}</span>
                        )}
                        <span className="sb-item-badge">{scene.badge}</span>
                      </>
                    )}

                    {/* Tooltip (collapsed only) */}
                    {!expanded && (
                      <span className="sb-tip">{t(scene.nameKey)}</span>
                    )}
                  </button>

                  {/* Children (expanded + clicked) */}
                  {showChildren && (
                    <div className="sb-children">
                      {scene.children.map((child) => (
                        <div key={child.id} className="sb-child">
                          {t(child.nameKey)}
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
