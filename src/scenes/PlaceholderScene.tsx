/**
 * PlaceholderScene — "Coming Soon" page for unimplemented scenes.
 * Shows scene badge/icon and a brief message.
 */

import { SCENE_CONFIGS } from '../layout/Sidebar/sceneConfig';

interface PlaceholderSceneProps {
  sceneId: string;
}

export function PlaceholderScene({ sceneId }: PlaceholderSceneProps) {
  const config = SCENE_CONFIGS.find((sc) => sc.id === sceneId);

  return (
    <div className="placeholder-scene" data-testid="placeholder-scene">
      {config && (
        <>
          <div
            className="placeholder-icon"
            dangerouslySetInnerHTML={{ __html: config.svg }}
          />
          <div className="placeholder-badge">{config.badge}</div>
          <h2 className="placeholder-name">{config.nameKey}</h2>
        </>
      )}
      <p className="placeholder-text">即将上线 / Coming Soon</p>
    </div>
  );
}
