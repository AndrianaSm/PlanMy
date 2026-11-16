
import { belongsTo } from '@adonisjs/lucid/orm'
import type { BelongsTo } from '@adonisjs/lucid/types/relations'

import { BookingSchema } from '#database/schema'
import Event from '#models/event'
import Provider from '#models/provider'

export default class Booking extends BookingSchema {
  @belongsTo(() => Event, {
    foreignKey: 'eventId',
  })
  declare event: BelongsTo<typeof Event>

  @belongsTo(() => Provider, {
    foreignKey: 'providerId',
  })
  declare provider: BelongsTo<typeof Provider>
}
