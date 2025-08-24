import { Client, Databases, ID, Query, Account } from 'appwrite'

function getEnv() {
  const trim = (v) => (typeof v === 'string' ? v.trim() : v)
  const endpoint = trim(import.meta.env.VITE_APPWRITE_ENDPOINT) || 'https://cloud.appwrite.io/v1'
  const projectId = trim(import.meta.env.VITE_APPWRITE_PROJECT_ID)
  const databaseId = trim(import.meta.env.VITE_APPWRITE_DATABASE_ID)
  const collectionId = trim(import.meta.env.VITE_APPWRITE_COLLECTION_ID)
  // Allow custom field names to match your collection schema
  const orderField = trim(import.meta.env.VITE_TRENDING_ORDER_FIELD) || 'count'
  const termField = trim(import.meta.env.VITE_TRENDING_TERM_FIELD) || 'search_term'
  const posterField = trim(import.meta.env.VITE_TRENDING_POSTER_FIELD) || 'poster_url'
  const movieIdField = trim(import.meta.env.VITE_TRENDING_MOVIE_ID_FIELD) || 'movie_id'
  return { endpoint, projectId, databaseId, collectionId, orderField, termField, posterField, movieIdField }
}

function makeClient() {
  const env = getEnv()
  const { endpoint, projectId } = env
  if (!projectId) return null
  const client = new Client().setEndpoint(endpoint).setProject(projectId)
  const db = new Databases(client)
  const account = new Account(client)
  return { client, db, account, env }
}

async function ensureAnonymousSession(account) {
  if (!account) return
  try {
    await account.get()
  } catch {
    try {
      await account.createAnonymousSession()
    } catch (e) {
      console.error('Appwrite anonymous session error', e)
    }
  }
}

async function debugContext(tag, ctx) {
  try {
    const me = await ctx.account.get()
    console.debug(`[Appwrite][${tag}] user`, me?.$id || 'unknown')
  } catch (e) {
    console.debug(`[Appwrite][${tag}] user`, 'none', e?.message)
  }
  console.debug(`[Appwrite][${tag}] env`, {
    endpoint: ctx?.env?.endpoint,
    projectId: ctx?.env?.projectId,
    databaseId: ctx?.env?.databaseId,
    collectionId: ctx?.env?.collectionId,
    orderField: ctx?.env?.orderField,
    termField: ctx?.env?.termField,
    posterField: ctx?.env?.posterField,
    movieIdField: ctx?.env?.movieIdField,
  })
}

export async function updateSearchCount(searchTerm, movie) {
  try {
    const { databaseId, collectionId, orderField, termField, posterField, movieIdField } = getEnv()
    const ctx = makeClient()
    if (!ctx || !databaseId || !collectionId || !searchTerm || !movie) return

    await ensureAnonymousSession(ctx.account)

    const { poster_path, id } = movie
    const poster_url = poster_path
      ? `https://image.tmdb.org/t/p/w500/${poster_path}`
      : '/no-movie.svg'

    const existing = await ctx.db.listDocuments(databaseId, collectionId, [
      Query.equal(termField, searchTerm),
      Query.limit(1),
    ])

    if (existing.total > 0) {
      const doc = existing.documents[0]
      await ctx.db.updateDocument(databaseId, collectionId, doc.$id, {
        [orderField]: ((doc[orderField] ?? 0) + 1),
        [posterField]: poster_url,
        [movieIdField]: id,
      })
    } else {
      await ctx.db.createDocument(databaseId, collectionId, ID.unique(), {
        [termField]: searchTerm,
        [orderField]: 1,
        [posterField]: poster_url,
        [movieIdField]: id,
      })
    }
  } catch (e) {
    // swallow errors in UI; log to console for dev
    console.error('Appwrite updateSearchCount error', e)
  }
}

export async function getTrendingMovies() {
  const { databaseId, collectionId, orderField, termField, posterField } = getEnv()
  const ctx = makeClient()
  if (!ctx || !databaseId || !collectionId) return []

  await ensureAnonymousSession(ctx.account)
  await debugContext('getTrendingMovies', ctx)

  const mapDoc = (doc) => ({
    poster_url: doc?.[posterField] || '/no-movie.svg',
    count: doc?.[orderField] ?? 0,
    search_term: doc?.[termField] || '(unknown)',
  })

  try {
    // Preferred: order by configured numeric field descending
    const res = await ctx.db.listDocuments(databaseId, collectionId, [
      Query.orderDesc(orderField),
      Query.limit(5),
    ])
    return res.documents.map(mapDoc)
  } catch (e) {
    // If 'count' attribute doesn't exist, fall back gracefully and log guidance
    console.warn(
      "Trending fallback: 'count' attribute not found or unsupported for ordering. Returning un-ordered results. Add an Integer attribute named 'count' to your collection, or update the code to use your attribute key.",
      e
    )
    try {
      const res = await ctx.db.listDocuments(databaseId, collectionId, [Query.limit(5)])
      return res.documents.map(mapDoc)
    } catch (e2) {
      console.error('Appwrite getTrendingMovies error (fallback also failed)', e2)
      return []
    }
  }
}

