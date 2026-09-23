import { BlobNotFoundError, head, put } from '@vercel/blob'
import { createInstallationHandler } from '../server/installation-handler.js'

async function exists(path: string): Promise<boolean> {
  try { await head(path, { abortSignal: AbortSignal.timeout(5000) }); return true }
  catch (error) { if (error instanceof BlobNotFoundError) return false; throw error }
}

const handler = createInstallationHandler(async (path, record) => {
  if (await exists(path)) return
  try {
    await put(path, JSON.stringify(record), {
      access: 'private', contentType: 'application/json', addRandomSuffix: false,
      allowOverwrite: false, abortSignal: AbortSignal.timeout(8000),
    })
  } catch (error) {
    // A concurrent retry can win the create race; confirm durable existence before acknowledging.
    if (!await exists(path)) throw error
  }
})

export default { fetch: handler }
