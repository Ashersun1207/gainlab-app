import 'react-mosaic-component/react-mosaic-component.css'
import { Mosaic, MosaicWindow } from 'react-mosaic-component'
import type { MosaicBranch, MosaicNode } from 'react-mosaic-component'

interface MosaicDashboardProps {
  initialLayout: MosaicNode<string>
  renderWidget: (id: string, path: MosaicBranch[]) => React.ReactNode
}

export function MosaicDashboard({ initialLayout, renderWidget }: MosaicDashboardProps) {
  return (
    <Mosaic<string>
      renderTile={(id, path) => (
        <MosaicWindow<string>
          path={path}
          title={id}
          createNode={() => id}
        >
          {renderWidget(id, path)}
        </MosaicWindow>
      )}
      initialValue={initialLayout}
      className="mosaic-dark"
    />
  )
}
