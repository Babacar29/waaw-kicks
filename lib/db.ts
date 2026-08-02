import { neon, type NeonQueryFunction } from '@neondatabase/serverless'

// `neon()`'s returned function only accepts tagged-template calls
// (sql`SELECT ...`) directly at the call site; a plain call with a query
// string and a params array (sql('SELECT $1', [id])) must go through its
// `.query()` method instead. `SqlFunction` documents both call forms so
// callers can use whichever is more convenient, and the `sql` export below
// forwards to the right one at runtime.
export interface SqlFunction {
  (strings: TemplateStringsArray, ...values: unknown[]): Promise<Record<string, unknown>[]>
  (queryText: string, params?: unknown[]): Promise<Record<string, unknown>[]>
}

// Lazy init: calling neon() at module load time throws at build time
// if DATABASE_URL isn't set yet (e.g. first deploy before provisioning).
// Deferring to first call keeps `next build` safe.
let _client: NeonQueryFunction<false, false> | null = null

function getClient(): NeonQueryFunction<false, false> {
  if (!_client) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is not set')
    }
    // disableWarningInBrowsers: this runs server-side (Next.js API routes,
    // Server Components) and in the jsdom test environment, which the
    // client otherwise mistakes for an actual browser.
    _client = neon(process.env.DATABASE_URL, { disableWarningInBrowsers: true })
  }
  return _client
}

function isTaggedTemplateCall(args: unknown[]): args is [TemplateStringsArray, ...unknown[]] {
  const [first] = args
  return Array.isArray(first) && 'raw' in first
}

export const sql: SqlFunction = ((...args: unknown[]) => {
  const client = getClient()
  if (isTaggedTemplateCall(args)) {
    const [strings, ...values] = args
    return client(strings, ...values)
  }
  const [text, params, opts] = args as [string, unknown[]?, object?]
  return client.query(text, params, opts)
}) as SqlFunction
