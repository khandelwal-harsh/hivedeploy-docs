export interface ObsidianTheme {
  name: string
  type: 'dark'
  colors: { 'editor.background': string; 'editor.foreground': string }
  tokenColors: { name?: string; scope: string[]; settings: { foreground?: string; fontStyle?: string } }[]
}
export const obsidian: ObsidianTheme
