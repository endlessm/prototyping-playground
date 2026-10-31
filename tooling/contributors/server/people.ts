import { createError, defineEventHandler, getHeader, readBody } from 'h3'
import { useRuntimeConfig } from 'nitropack/runtime'
import { peopleSnapshot, savePerson, type PeopleOptions } from '../service.ts'
export default defineEventHandler(async (event) => {
  const site = getHeader(event, 'sec-fetch-site')
  const origin = getHeader(event, 'origin')
  if (
    (site && site !== 'same-origin') ||
    (origin && origin !== `http://${getHeader(event, 'host')}`)
  )
    throw createError({ statusCode: 403 })
  const options = useRuntimeConfig(event).studioPeople as PeopleOptions & {
    root: string
  }
  event.node.res.setHeader('Cache-Control', 'no-store')
  try {
    if (event.method === 'GET') return peopleSnapshot(options.root, options)
    if (event.method !== 'POST') throw new Error('Method refused.')
    const body = await readBody(event)
    return savePerson(
      options.root,
      options,
      undefined,
      body.key,
      body.changes,
      body.revision,
    )
  } catch (error) {
    const message = (error as Error).message
    event.node.res.statusCode = message.includes('permission')
      ? 403
      : message.includes('changed on disk')
        ? 409
        : 400
    return { error: message }
  }
})
