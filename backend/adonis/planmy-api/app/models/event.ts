
import { belongsTo, hasMany } from '@adonisjs/lucid/orm'
import type { BelongsTo, HasMany } from '@adonisjs/lucid/types/relations'

import { EventSchema } from '#database/schema'
import User from '#models/user'
import Booking from '#models/booking'

export default class Event extends EventSchema {
  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  declare user: BelongsTo<typeof User>

  @hasMany(() => Booking, {
    foreignKey: 'eventId',
  })
  declare bookings: HasMany<typeof Booking>
}
