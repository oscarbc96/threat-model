import type { NextPage } from 'next'
import ReactFlow, { Background, Controls } from 'react-flow-renderer'
import { getNameAndLabel, ThreatModel, Node, Edge } from '../lib/threat_model'
import { parse } from 'yaml'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import dagre from 'dagre'

const fileContent = `title: (Example) Attack Tree for S3 Bucket with Video Recordings

facts:
  - wayback: API cache (e.g. Wayback Machine)
    from:
      - reality: '#yolosec'
  - public_bucket: S3 bucket set to public
    from:
      - bucket_search: '#yolosec'
  - subsystem_with_access: Subsystem with access to bucket data
    from:
      - compromise_user_creds

attacks:
  - bucket_search: AWS public buckets search
    from:
      - disallow_crawling
  - brute_force: patata
    from:
      - private_bucket
  - phishing:
    from:
      - private_bucket
      - internal_only_bucket:
        backwards: true
      - access_control_server_side:
        backwards: true
  - ef: Compromise user credentials
    from:
      - brute_force
      - phishing
  - analyze_web_client: Manually analyze web client for access control misconfig
    from:
      - lock_down_acls
  - compromise_admin_creds: Compromise admin creds
    from:
      - phishing
  - compromise_aws_creds: Compromise AWS admin creds
    from:
      - phishing
  - intercept_2fa: Intercept 2FA
    from:
      - 2fa
  - ssh_to_public_machine: SSH to an accessible machine
    from:
      - compromise_admin_creds: '#yolosec'
      - compromise_aws_creds:
      - intercept_2fa
  - lateral_movement_to_machine_with_access: Lateral movement to machine with access to target bucket
    from:
      - ip_allowlist_for_ssh
  - compromise_presigned: Compromise presigned URLs
    from:
      - phishing
  - compromise_quickly: Compromise URL within N time period
    from:
      - short_lived_presigning
  - recon_on_s3: Recon on S3 buckets
    from:
      - private_bucket
      - disallow_bucket_urls:
        backwards: true
      - 2fa:
        backwards: true
  - find_systems_with_access: Find systems with R/W access to target bucket
    from:
      - recon_on_s3: '#yolosec'
  - exploit_known_vulns: Exploit known 3rd party library vulns
    from:
      - find_systems_with_access
  - buy_0day:
    from:
      - vuln_scanning
  - discover_0day: Manual discovery of 0day
    from:
      - vuln_scanning
  - exploit_vulns: Exploit vulns
    from:
      - buy_0day
      - discover_0day
  - aws_0day: 0day in AWS multitenant systems
    from:
      - ips
  - supply_chain_backdoor: Supply chain compromise (backdoor)
    from:
      - single_tenant_hsm

mitigations:
  - disallow_crawling: Disallow crawling on site maps
    from:
      - reality
  - private_bucket: Auth required / ACLs (private bucket)
    from:
      - reality
  - lock_down_acls: Lock down web client with creds / ACLs
    from:
      - subsystem_with_access
  - access_control_server_side: Perform all access control server side
    from:
      - analyze_web_client
  - 2fa: 2FA
    from:
      - compromise_admin_creds: '#yolosec'
      - compromise_aws_creds
  - ip_allowlist_for_ssh: IP allowlist for SSH
    from:
      - ssh_to_public_machine
  - short_lived_presigning: Make URL short lived
    from:
      - compromise_presigned
  - disallow_bucket_urls: Disallow the use of URLs to access buckets
    from:
      - compromise_quickly
  - vuln_scanning: 3rd party library checking / vuln scanning
    from:
      - exploit_known_vulns
  - ips: Exploit prevention / detection
    from:
      - exploit_vulns
  - single_tenant_hsm: Use single tenant AWS HSM
    from:
      - aws_0day:
        implemented: false
  - internal_only_bucket: No public system has R/W access (internal only)
    from:
      - find_systems_with_access

goals:
  - patata: alsndfl
    from:
      - public_bucket
  - s3_asset: Access video recordings in S3 bucket (attackers win)
    from:
      - wayback: '#yolosec'
      - public_bucket
      - subsystem_with_access
      - analyze_web_client
      - lateral_movement_to_machine_with_access
      - compromise_presigned
      - compromise_quickly
      - exploit_vulns
      - aws_0day
      - supply_chain_backdoor
`
const position = { x: 0, y: 0 }

const dagreGraph = new dagre.graphlib.Graph()
dagreGraph.setDefaultEdgeLabel(() => ({}))

const nodeWidth = 172
const nodeHeight = 36

const getLayoutedElements = (nodes, edges, direction = 'TB') => {
  const isHorizontal = direction === 'LR'
  dagreGraph.setGraph({ rankdir: direction })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    node.targetPosition = isHorizontal ? 'left' : 'top'
    node.sourcePosition = isHorizontal ? 'right' : 'bottom'

    // We are shifting the dagre node position (anchor=center center) to the top left
    // so it matches the React Flow node anchor point (top left).
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    }

    return node
  })

  return { nodes, edges }
}

const Home: NextPage = () => {
  const parsedYml = parse(fileContent) as ThreatModel
  const allNodes = [
    ...parsedYml.facts,
    ...parsedYml.attacks,
    ...parsedYml.mitigations,
    ...parsedYml.goals,
  ]
  const initialNodes = map(allNodes, (n: Node) => {
    const [name, label] = getNameAndLabel(n)
    return {
      id: name,
      type: 'default',
      data: { label },
      position,
    }
  })
  const initialEdges = []

  forEach(allNodes, (destinationNode: Node) => {
    const [destinationName] = getNameAndLabel(destinationNode)
    forEach(destinationNode.from, (sourceNode: Edge | string) => {
      if (typeof sourceNode === 'string' || sourceNode instanceof String) {
        initialEdges.push({
          id: `${sourceNode}-${destinationName}`,
          source: sourceNode,
          target: destinationName,
          type: 'simplebezier',
        })
      } else {
        const [sourceName, sourceLabel] = getNameAndLabel(sourceNode)
        if (sourceNode.backwards) {
          initialEdges.push({
            id: `${destinationName}-${sourceName}`,
            source: destinationName,
            target: sourceName,
            type: 'simplebezier',
            label: sourceLabel,
          })
        } else {
          initialEdges.push({
            id: `${sourceName}-${destinationName}`,
            source: sourceName,
            target: destinationName,
            type: 'simplebezier',
            label: sourceLabel,
          })
        }
      }
    })
  })

  const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(initialNodes, initialEdges)

  return (
    <div className={'h-screen'}>
      <ReactFlow nodes={layoutedNodes} edges={layoutedEdges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  )
}

export default Home
