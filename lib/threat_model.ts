import omit from 'lodash/omit'
import toPairs from 'lodash/toPairs'

type ExactlyOneKey<K extends keyof any, V, KK extends keyof any = K> = {
  [P in K]: { [Q in P]: V } & { [Q in Exclude<KK, P>]?: never } extends infer O ? { [Q in keyof O]: O[Q] } : never
}[K]

export type Edge = ExactlyOneKey<string, string> & { backwards: boolean }
export type Node = ExactlyOneKey<string, string> & { from: [Edge | string] }

type Mitigation = Node & { implemented?: boolean }

export const getNameAndLabel = (obj: Edge | Node): [string, string?] => {
  const cleanObj: ExactlyOneKey<string, string> = omit(obj, ['from', 'backwards', 'implemented'])
  const pairs: [string, string][] = toPairs(cleanObj)
  if (pairs.length != 1) {
    console.log(pairs)
    throw new Error('Something went wrong')
  }
  return pairs[0]
}

export interface ThreatModel {
  title: string
  goals: [Node]
  facts: [Node]
  attacks: [Node]
  mitigations: [Mitigation]
  boundaries: [Node]
}
