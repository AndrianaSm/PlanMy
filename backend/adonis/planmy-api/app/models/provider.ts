
import { hasMany } from '@adonisjs/lucid/orm'
import type { HasMany } from '@adonisjs/lucid/types/relations'

import { ProviderSchema } from '#database/schema'
import Booking from '#models/booking'

export default class Provider extends ProviderSchema {
  @hasMany(() => Booking, {
    foreignKey: 'providerId',
  })
  declare bookings: HasMany<typeof Booking>
}
