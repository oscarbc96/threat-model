import type { NextPage } from 'next'
import ReactFlow, { Background, Controls, MarkerType } from 'react-flow-renderer'
import { getNameAndLabel, ThreatModel, Node, Edge } from '../lib/threat_model'
import { parse } from 'yaml'
import forEach from 'lodash/forEach'
import map from 'lodash/map'
import ReactFlowLayout from '../components/ReactFlowLayout'

const fileContent = `title: Uber hack walkthrough

facts:
- aws_admin: AWS admin access 
  from:
   - thycotic_access:
     backwards: true
   - change_mfa
- vpn_access: (T1133, T1595.001) VPN access
  from:
  - mfa_mitm
  - mfa_fatigue
- network_share: (T1552.01) Network share containing scripts with hardcoded credentials
  from:
  - network_scan
- thycotic_access: Creds with admin access to Thycotic (PAM)
  from:
  - network_share
- onelogin_access: OneLogin account access
  from:
   - thycotic_access:
     backwards: true
   - change_mfa
- get_pass: (T15089.01) How did he get user's password?
  from:
  - pass_protected
- hacker_one_access: Access to HackerOne bug bounty reports
  from:
  - use_secrets
- duo_access: Administrative acces to Duo 2FA management
  from:
  - mfa2
  - thycotic_access:
    backwards: true
mitigations:
- mfa: Employee's account is MFA protected
  from: 
  - social_engineer
- mfa2: Further privelege access might still need MFA
  from:
  - use_credentials
- pass_protected: Employee account is password protected
  from:
  - mfa

attacks:
- social_engineer: (T1566) Social engineer an Uber employee
  from:
  - reality
- mfa_fatigue: (T1621) MFA-prompt fatigue/exhaustion attack and whatsapp message
  from:
  - get_pass
- mfa_mitm: (T1621) MFA MiTM
  from:
  - pass_protected
- network_scan: (T1135) Pivot to internal network and network scan
  from:
  - vpn_access
- use_credentials: (T1078) Re-use found vault credentials
  from:
  - thycotic_access
- use_secrets: Re-use found vault API tokens
  from:
  - thycotic_access
- change_mfa: Change MFA settings
  from:
  - duo_access

goals:
- hack_uber: Uber fully compromised
  from:
  - aws_admin
  - onelogin_access
  - hacker_one_access`

const position = { x: 0, y: 0 }

const toFlowNode = (n: Node, style: any) => {
  const [name, label] = getNameAndLabel(n)
  return {
    id: name,
    type: 'default',
    data: { label },
    position,
    style,
  }
}

const Home: NextPage = () => {
  const parsedYml = parse(fileContent) as ThreatModel

  const allNodes = [...parsedYml.facts, ...parsedYml.attacks, ...parsedYml.mitigations, ...parsedYml.goals]

  const initialNodes = [
    {
      id: 'reality',
      type: 'default',
      data: { label: 'reality' },
      position,
    },
    ...map(parsedYml.facts, (n: Node) => toFlowNode(n, { background: '#d2d5dd', border: 0 })),
    ...map(parsedYml.attacks, (n: Node) => toFlowNode(n, { background: '#ff92cc', border: 0 })),
    ...map(parsedYml.mitigations, (n: Node) => toFlowNode(n, { background: '#b9d6f2', border: 0 })),
    ...map(parsedYml.goals, (n: Node) => toFlowNode(n, { background: '#5f00c2', color: '#ffffff', border: 0 })),
  ]
  const initialEdges = []

  forEach(allNodes, (destinationNode: Node) => {
    const [destinationName] = getNameAndLabel(destinationNode)
    forEach(destinationNode.from, (sourceNode: Edge | string) => {
      if (typeof sourceNode === 'string' || sourceNode instanceof String) {
        initialEdges.push({
          id: `${sourceNode}-${destinationName}`,
          source: sourceNode,
          target: destinationName,
          type: 'default',
          style: { stroke: 'black' },
          markerEnd: { type: MarkerType.Arrow, color: 'black' },
          labelBgPadding: [8, 4],
          labelBgBorderRadius: 4,
          labelBgStyle: { fill: '#FFCC00', color: '#fff', opacity: '0.7' },
        })
      } else {
        const [sourceName, sourceLabel] = getNameAndLabel(sourceNode)
        if (sourceNode.backwards) {
          initialEdges.push({
            id: `${destinationName}-${sourceName}`,
            source: destinationName,
            target: sourceName,
            type: 'default',
            label: sourceLabel,
            style: { stroke: 'blue', strokeDasharray: '4' },
            markerEnd: { type: MarkerType.Arrow, color: 'blue' },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: '#FFCC00', color: '#fff', opacity: '0.7' },
          })
        } else {
          initialEdges.push({
            id: `${sourceName}-${destinationName}`,
            source: sourceName,
            target: destinationName,
            type: 'default',
            style: { stroke: 'black' },
            label: sourceLabel,
            markerEnd: { type: MarkerType.Arrow, color: 'black' },
            labelBgPadding: [8, 4],
            labelBgBorderRadius: 4,
            labelBgStyle: { fill: '#FFCC00', color: '#fff', opacity: '0.7' },
          })
        }
      }
    })
  })

  return (
    <div className={'h-screen'}>
      <ReactFlow defaultNodes={initialNodes} defaultEdges={initialEdges}>
        <Background />
        <Controls />
        <ReactFlowLayout />
      </ReactFlow>
    </div>
  )
}

export default Home
