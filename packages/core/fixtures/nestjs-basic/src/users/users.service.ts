import { Injectable, NotFoundException } from '@nestjs/common'

export interface User {
  id: string
  email: string
  name: string
  createdAt: Date
  updatedAt: Date
}

export interface UserPreferences {
  theme: string
  notifications: boolean
  language: string
}

@Injectable()
export class UsersService {
  private users: User[] = []

  findAll(options?: { limit?: string; offset?: string }): User[] {
    const limit = options?.limit ? parseInt(options.limit, 10) : 10
    const offset = options?.offset ? parseInt(options.offset, 10) : 0
    return this.users.slice(offset, offset + limit)
  }

  findOne(id: string): User {
    const user = this.users.find(u => u.id === id)
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    return user
  }

  create(data: Partial<User>): User {
    const user: User = {
      id: Math.random().toString(36).substring(7),
      email: data.email || '',
      name: data.name || '',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    this.users.push(user)
    return user
  }

  update(id: string, data: Partial<User>): User {
    const user = this.findOne(id)
    Object.assign(user, data, { updatedAt: new Date() })
    return user
  }

  remove(id: string): void {
    const index = this.users.findIndex(u => u.id === id)
    if (index === -1) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }
    this.users.splice(index, 1)
  }

  getPreferences(userId: string, theme?: string): UserPreferences {
    this.findOne(userId) // Validate user exists
    return {
      theme: theme || 'light',
      notifications: true,
      language: 'en',
    }
  }
}
