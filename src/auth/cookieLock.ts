// Serialize cookie rotation and logout, including across tabs when Web Locks is available.
let queue: Promise<unknown> = Promise.resolve()

export function withCookieLock<T>(action: () => Promise<T>): Promise<T> {
  const task = queue.catch(() => undefined).then(() => {
    return navigator.locks ? navigator.locks.request('cognova.auth.cookies', action) : action()
  })
  queue = task
  return task
}
