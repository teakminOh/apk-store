import { describe, expect, it } from 'vitest'
import { formToAppInput } from './forms'

describe('form utilities', () => {
  it('converts admin app metadata form values', () => {
    const data = new FormData()
    data.set('name', 'Demo App')
    data.set('slug', 'demo-app')
    data.set('packageName', 'com.example.demo')
    data.set('summary', 'Short summary')
    data.set('description', 'Long description')
    data.set('iconUrl', 'https://example.com/icon.png')
    data.set('category', 'Tools')
    data.set('tags', 'react-native, beta, react-native')
    data.set('listed', 'on')

    expect(formToAppInput(data)).toEqual({
      category: 'Tools',
      description: 'Long description',
      iconUrl: 'https://example.com/icon.png',
      listed: true,
      name: 'Demo App',
      packageName: 'com.example.demo',
      slug: 'demo-app',
      summary: 'Short summary',
      tags: ['react-native', 'beta', 'react-native'],
    })
  })
})
