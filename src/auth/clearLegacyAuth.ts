// One-way migration: delete the obsolete credential without reading or reusing it.
export function clearLegacyAuth(): void {
  localStorage.removeItem('cognova.access_token')
  sessionStorage.removeItem('cognova.access_token')
}
