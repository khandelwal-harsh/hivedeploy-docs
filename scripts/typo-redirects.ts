export const TYPO_MAP: Record<string, string> = {
  kuberntes: 'kubernetes',
  tarraform: 'terraform',
  postgress: 'postgres',
  wiff: 'wif',
  orchestator: 'orchestrator',
  specilist: 'specialist',
  deployement: 'deployment',
  enviroment: 'environment',
  crednetials: 'credentials',
  autentication: 'authentication',
}

export function correctTypos(query: string): { corrected: string; wasCorrected: boolean } {
  let wasCorrected = false
  const corrected = query
    .split(/\s+/)
    .map((word) => {
      const lower = word.toLowerCase()
      const replacement = TYPO_MAP[lower]
      if (replacement) {
        wasCorrected = true
        return replacement
      }
      return word
    })
    .join(' ')
  return { corrected, wasCorrected }
}
