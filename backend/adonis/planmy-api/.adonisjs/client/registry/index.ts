/* eslint-disable prettier/prettier */
import type { AdonisEndpoint } from '@tuyau/core/types'
import type { Registry } from './schema.d.ts'
import type { ApiDefinition } from './tree.d.ts'

export type { Route, Path } from './schema.d.ts'

const placeholder: any = {}

const routes = {
  'auth.new_account.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/signup',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"signup"]],
    types: placeholder as Registry['auth.new_account.store']['types'],
  },
  'auth.access_tokens.store': {
    methods: ["POST"],
    pattern: '/api/v1/auth/login',
    tokens: [[0,"api"],[0,"v1"],[0,"auth"],[0,"login"]],
    types: placeholder as Registry['auth.access_tokens.store']['types'],
  },
  'profile.profile.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/account/profile',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"profile"]],
    types: placeholder as Registry['profile.profile.show']['types'],
  },
  'profile.access_tokens.destroy': {
    methods: ["POST"],
    pattern: '/api/v1/account/logout',
    tokens: [[0,"api"],[0,"v1"],[0,"account"],[0,"logout"]],
    types: placeholder as Registry['profile.access_tokens.destroy']['types'],
  },
  'events.store': {
    methods: ["POST"],
    pattern: '/api/v1/events',
    tokens: [[0,"api"],[0,"v1"],[0,"events"]],
    types: placeholder as Registry['events.store']['types'],
  },
  'events.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/events',
    tokens: [[0,"api"],[0,"v1"],[0,"events"]],
    types: placeholder as Registry['events.index']['types'],
  },
  'events.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['events.show']['types'],
  },
  'events.update': {
    methods: ["PUT"],
    pattern: '/api/v1/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['events.update']['types'],
  },
  'events.destroy': {
    methods: ["DELETE"],
    pattern: '/api/v1/events/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"events"],[1,"id"]],
    types: placeholder as Registry['events.destroy']['types'],
  },
  'bookings.store': {
    methods: ["POST"],
    pattern: '/api/v1/events/:id/bookings',
    tokens: [[0,"api"],[0,"v1"],[0,"events"],[1,"id"],[0,"bookings"]],
    types: placeholder as Registry['bookings.store']['types'],
  },
  'providers.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/providers',
    tokens: [[0,"api"],[0,"v1"],[0,"providers"]],
    types: placeholder as Registry['providers.index']['types'],
  },
  'providers.show': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/providers/:id',
    tokens: [[0,"api"],[0,"v1"],[0,"providers"],[1,"id"]],
    types: placeholder as Registry['providers.show']['types'],
  },
  'conversations.index': {
    methods: ["GET","HEAD"],
    pattern: '/api/v1/conversations',
    tokens: [[0,"api"],[0,"v1"],[0,"conversations"]],
    types: placeholder as Registry['conversations.index']['types'],
  },
} as const satisfies Record<string, AdonisEndpoint>

export { routes }

export const registry = {
  routes,
  $tree: {} as ApiDefinition,
}

declare module '@tuyau/core/types' {
  export interface UserRegistry {
    routes: typeof routes
    $tree: ApiDefinition
  }
}
