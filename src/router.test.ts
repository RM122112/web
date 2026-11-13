import { describe, expect, it } from 'vitest'
import { routes } from './routes'

describe('navigation', () => {
  it('defines lazy-loaded cards, quiz, and PDF routes', () => {
    const paths = routes.map(({ path }) => path)
    expect(paths).toContain('/cards')
    expect(paths).toContain('/quiz')
    expect(paths).toContain('/pdf')
    expect(paths).toEqual(['/', '/cards', '/quiz', '/pdf', '/:pathMatch(.*)*'])
  })

  it('redirects the root and unknown paths to cards', () => {
    expect(routes.find(({ path }) => path === '/')?.redirect).toBe('/cards')
    expect(routes.find(({ path }) => path === '/:pathMatch(.*)*')?.redirect).toBe('/cards')
  })
})
