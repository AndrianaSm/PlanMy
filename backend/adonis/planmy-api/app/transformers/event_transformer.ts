
import Event from '#models/event'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class EventTransformer extends BaseTransformer<Event> {
  toObject() {
    return {
      id: this.resource.id,
      userId: this.resource.userId,
      name: this.resource.name,
      eventType: this.resource.eventType,
      date: this.resource.date.toISODate(),
      time: this.resource.time,
      location: this.resource.location,
      guests: this.resource.guests,
      budget: this.resource.budget,
      status: this.resource.status,
      createdAt: this.resource.createdAt.toISO(),
    }
  }
}
