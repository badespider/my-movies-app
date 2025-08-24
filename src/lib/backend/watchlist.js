import { Client, Databases, Query, Account, ID } from 'appwrite'

function env() {
  const trim = v => (typeof v === 'string' ? v.trim() : v)
  return {
    endpoint: trim(import.meta.env.VITE_APPWRITE_ENDPOINT) || 'https://cloud.appwrite.io/v1',
    projectId: trim(import.meta.env.VITE_APPWRITE_PROJECT_ID),
    databaseId: trim(import.meta.env.VITE_APPWRITE_DATABASE_ID),
    collectionId: trim(import.meta.env.VITE_APPWRITE_WATCHLIST_COLLECTION_ID),
  }
}

function hasConfig() {
  const { projectId, databaseId, collectionId } = env()
  return Boolean(projectId && databaseId && collectionId)
}

function makeCtx() {
  const { endpoint, projectId } = env()
  if (!projectId) return null
  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  return {
    client,
    db: new Databases(client),
    account: new Account(client),
    env: env(),
  }
}

async function ensureAnon(account) {
  if (!account) return
  try {
    await account.get()
  } catch {
    try { await account.createAnonymousSession() } catch {}
  }
}

async function getOwnerId(account) {
  await ensureAnon(account)
  try { const me = await account.get(); return me?.$id || null } catch { return null }
}

export async function isSavedBackend(movieId) {
  if (!hasConfig()) return false
  const ctx = makeCtx()
  if (!ctx) return false
  const { databaseId, collectionId } = ctx.env
  const ownerId = await getOwnerId(ctx.account)
  if (!ownerId) return false
  try {
    const res = await ctx.db.listDocuments(databaseId, collectionId, [
      Query.equal('owner', ownerId),
      Query.equal('movie_id', Number(movieId)),
      Query.limit(1),
    ])
    return res.total > 0
  } catch {
    return false
  }
}

export async function toggleWatchlistBackend(movie) {
  if (!hasConfig()) return null
  const ctx = makeCtx()
  if (!ctx) return null
  const { databaseId, collectionId } = ctx.env
  const ownerId = await getOwnerId(ctx.account)
  if (!ownerId) return null
  const id = Number(movie?.movie_id || movie?.id)
  if (!id) return null
  const title = String(movie?.title || '')
  const poster_url = movie?.poster_url ?? (movie?.poster_path ? `https://image.tmdb.org/t/p/w342/${movie.poster_path}` : null)
  try {
    const existing = await ctx.db.listDocuments(databaseId, collectionId, [
      Query.equal('owner', ownerId),
      Query.equal('movie_id', id),
      Query.limit(1),
    ])
    if (existing.total > 0) {
      await ctx.db.deleteDocument(databaseId, collectionId, existing.documents[0].$id)
      return false
    }
    await ctx.db.createDocument(databaseId, collectionId, ID.unique(), {
      owner: ownerId,
      movie_id: id,
      title,
      poster_url,
      added_at: new Date().toISOString(),
    })
    return true
  } catch {
    return null
  }
}

export async function getWatchlistBackend(limit = 50) {
  if (!hasConfig()) return []
  const ctx = makeCtx()
  if (!ctx) return []
  const { databaseId, collectionId } = ctx.env
  const ownerId = await getOwnerId(ctx.account)
  if (!ownerId) return []
  try {
    const res = await ctx.db.listDocuments(databaseId, collectionId, [
      Query.equal('owner', ownerId),
      Query.limit(limit),
    ])
    return res.documents.map(doc => ({
      movie_id: doc.movie_id,
      title: doc.title,
      poster_url: doc.poster_url,
      added_at: doc.added_at || doc.$createdAt,
    }))
  } catch {
    return []
  }
}

export function hasWatchlistBackend() {
  return hasConfig()
}

