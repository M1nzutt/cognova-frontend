export class TokenStorage {
  readonly key = 'cognova.access_token'

  read(): string | null {
    return localStorage.getItem(this.key)
  }

  save(token: string): void {
    localStorage.setItem(this.key, token)
  }

  clear(): void {
    localStorage.removeItem(this.key)
  }
}
