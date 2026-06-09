import type { AppInput } from '../types'

export function formToAppInput(data: FormData): AppInput {
  return {
    name: String(data.get('name') || ''),
    slug: String(data.get('slug') || ''),
    packageName: String(data.get('packageName') || ''),
    summary: String(data.get('summary') || ''),
    description: String(data.get('description') || ''),
    iconUrl: String(data.get('iconUrl') || ''),
    category: String(data.get('category') || 'General'),
    tags: String(data.get('tags') || '')
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean),
    listed: data.get('listed') === 'on',
  }
}
