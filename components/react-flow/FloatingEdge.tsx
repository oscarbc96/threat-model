import { useCallback } from 'react';
import { useStore, getSmoothStepPath } from 'react-flow-renderer';

import { getEdgeParams } from './utils';

function FloatingEdge({ id, source, target, markerEnd, style }) {
  const sourceNode = useStore(useCallback((store) => store.nodeInternals.get(source), [source]));
  const targetNode = useStore(useCallback((store) => store.nodeInternals.get(target), [target]));

  if (!sourceNode || !targetNode) {
    return null;
  }

  const { sx, sy, tx, ty, sourcePos, targetPos } = getEdgeParams(sourceNode, targetNode);

  const path = `M ${sx},${sy}L ${tx},${ty}`;


  return (
    <path id={id} className="react-flow__edge-path" d={path} markerEnd={markerEnd} style={style} />
  );
}

export default FloatingEdge;
