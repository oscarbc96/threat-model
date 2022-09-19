import type { NextPage } from 'next'
import ReactFlow, { Background, Controls } from 'react-flow-renderer'

const nodes = [
  {
    id: '1',
    type: 'input',
    data: { label: 'Input Node' },
    position: { x: 250, y: 25 },
  },

  {
    id: '2',
    // you can also pass a React component as a label
    data: { label: <div>Default Node</div> },
    position: { x: 100, y: 125 },
  },
  {
    id: '3',
    type: 'output',
    data: { label: 'Output Node' },
    position: { x: 250, y: 250 },
  },
]

const edges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3', animated: true },
]

const Home: NextPage = () => {
  return (
    <div className={'h-screen'}>
      <ReactFlow defaultNodes={nodes} defaultEdges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default Home
