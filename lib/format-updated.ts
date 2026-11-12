/** "Last updated" date, as the page head prints it: 14 May 2026 style, US English. */
export function formatUpdated(timestamp: number | string | Date): { iso: string; text: string } | null {
  const d = new Date(timestamp)
  if (Number.isNaN(d.getTime())) return null
  return { iso: d.toISOString(), text: d.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }) }
}
