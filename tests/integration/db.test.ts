import { describe, it, expect, beforeAll } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'
import { sql } from '../../lib/db'

describe('database schema', () => {
  beforeAll(async () => {
    const ddl = fs.readFileSync(path.join(__dirname, '../../lib/schema.sql'), 'utf-8')
    for (const statement of ddl.split(';').map((s) => s.trim()).filter(Boolean)) {
      await sql(statement)
    }
  })

  it('creates products, variants, and orders tables', async () => {
    const rows = await sql(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`
    )
    const names = rows.map((r) => (r as { table_name: string }).table_name)
    expect(names).toEqual(expect.arrayContaining(['products', 'variants', 'orders']))
  })
})
