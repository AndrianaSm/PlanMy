import { UserSchema } from '#database/schema'
import hash from '@adonisjs/core/services/hash'
import { compose } from '@adonisjs/core/helpers'
import { withAuthFinder } from '@adonisjs/auth/mixins/lucid'
import {
  type AccessToken,
  DbAccessTokensProvider,
} from '@adonisjs/auth/access_tokens'

export default class User extends compose(UserSchema, withAuthFinder(hash)) {
  static accessTokens = DbAccessTokensProvider.forModel(User)

  declare currentAccessToken?: AccessToken

  get initials() {
    const parts = this.name.trim().split(/\s+/)
    const first = parts[0]

    if (parts.length > 1) {
      return `${first.charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase()
    }

    return first.slice(0, 2).toUpperCase()
  }
}