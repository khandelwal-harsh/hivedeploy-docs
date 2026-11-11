export interface HastNode {
  type: string
  tagName?: string
  value?: string
  properties?: Record<string, unknown>
  children?: HastNode[]
}
export interface HastRoot {
  type: 'root'
  children: HastNode[]
}
export function wrapSteps(tree: HastRoot): HastRoot
export function markQuotes(tree: HastRoot): HastRoot
export function wrapChangelog(tree: HastRoot, file?: unknown): HastRoot
export function rehypeDocs(): (tree: HastRoot, file: unknown) => void
