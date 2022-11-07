import { useEffect, useRef } from 'react'
import { useReactFlow } from 'react-flow-renderer'
import createGraphLayout from '../../lib/createGraphLayout'

const ReactFlowLayout = () => {
  const { getNodes, getEdges, setNodes, setEdges, fitView, viewportInitialized } = useReactFlow()
  const isInitialized = useRef<boolean>(false)

  useEffect(() => {
    if (!isInitialized.current && viewportInitialized) {
      let allNodesInitialized = getNodes().every((n) => n.width)
      const activeWait = () => {
        allNodesInitialized = getNodes().every((n) => n.width)
        if (allNodesInitialized) {
          createGraphLayout(getNodes(), getEdges())
            .then((nodes) => {
              setNodes(nodes)

              fitView()
            })
            .catch((err) => console.error(err))
          isInitialized.current = true
        } else {
          setTimeout(activeWait, 1)
        }
      }
      activeWait()
    }
  }, [viewportInitialized])

  return <></>
}

export default ReactFlowLayout
