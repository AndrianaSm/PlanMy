import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

import Event from '#models/event'
import Booking from '#models/booking'

import {
  createEventValidator,
  updateEventValidator,
} from '#validators/events'

import EventTransformer from '#transformers/event_transformer'
import BookingTransformer from '#transformers/booking_transformer'

const allowedStatuses = ['PLANNING', 'CONFIRMED', 'CANCELLED']

function isValidDateAndTime(date: string, time: string) {
  const parsedDate = DateTime.fromISO(date)

  const validTime = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(time)

  return parsedDate.isValid && validTime
}

export default class EventsController {
  /**
   * POST /api/v1/events
   * Create a new event
   */
  async store({ request, auth, response }: HttpContext) {
    const payload = await request.validateUsing(createEventValidator)

    if (!isValidDateAndTime(payload.date, payload.time)) {
      return response.status(400).json({
        error: 'Data o ora non valida',
      })
    }

    const user = auth.getUserOrFail()

    const event = await Event.create({
      userId: user.id,
      name: payload.name,
      eventType: payload.eventType,
      date: DateTime.fromISO(payload.date),
      time: payload.time,
      location: payload.location,
      guests: payload.guests,
      budget: String(payload.budget),
    })

    return response.status(201).json(EventTransformer.transform(event))
  }

  /**
   * GET /api/v1/events
   * Retrieve the authenticated user's events
   */
  async index({ request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const status = request.qs().status

    if (status && !allowedStatuses.includes(status)) {
      return response.status(400).json({
        error: 'Stato non valido',
      })
    }

    const query = Event.query()
      .where('userId', String(user.id))
      .withCount('bookings', (bookingQuery) => {
        bookingQuery.where('status', 'CONFIRMED')
      })
      .orderBy('date', 'asc')

    if (status) {
      query.where('status', status)
    }

    const events = await query

    return response.json(
      events.map((event) => ({
        ...EventTransformer.transform(event),
        bookedServicesCount: Number(event.$extras.bookings_count ?? 0),
      }))
    )
  }

  /**
   * GET /api/v1/events/:id
   * Retrieve event details and its bookings
   */
  async show({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const event = await Event.query()
      .where('id', params.id)
      .where('userId', String(user.id))
      .preload('bookings', (bookingQuery) => {
        bookingQuery
          .preload('provider')
          .orderBy('createdAt', 'desc')
      })
      .first()

    if (!event) {
      return response.status(404).json({
        error: 'Evento non trovato',
      })
    }

    return response.json({
      ...EventTransformer.transform(event),
      bookings: event.bookings.map((booking) =>
        BookingTransformer.transform(booking)
      ),
    })
  }

  /**
   * PUT /api/v1/events/:id
   * Update an existing event
   */
  async update({ params, request, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()
    const payload = await request.validateUsing(updateEventValidator)

    const entries = Object.entries(payload).filter(
      ([, value]) => value !== undefined
    )

    if (entries.length === 0) {
      return response.status(400).json({
        error: 'Nessun campo valido da aggiornare',
      })
    }

    if (
      payload.date !== undefined ||
      payload.time !== undefined
    ) {
      const event = await Event.query()
        .where('id', params.id)
        .where('userId', String(user.id))
        .first()

      if (!event) {
        return response.status(404).json({
          error: 'Evento non trovato',
        })
      }

      const date = payload.date ?? event.date.toISODate()!
      const time = payload.time ?? event.time

      if (!isValidDateAndTime(date, time)) {
        return response.status(400).json({
          error: 'Data o ora non valida',
        })
      }

      if (payload.date !== undefined) {
        event.date = DateTime.fromISO(payload.date)
      }

      if (payload.time !== undefined) {
        event.time = payload.time
      }

      if (payload.name !== undefined) event.name = payload.name
      if (payload.eventType !== undefined) event.eventType = payload.eventType
      if (payload.location !== undefined) event.location = payload.location
      if (payload.guests !== undefined) event.guests = payload.guests
      if (payload.budget !== undefined) event.budget = String(payload.budget)
      if (payload.status !== undefined) event.status = payload.status

      await event.save()

      return response.json(EventTransformer.transform(event))
    }

    const event = await Event.query()
      .where('id', params.id)
      .where('userId', String(user.id))
      .first()

    if (!event) {
      return response.status(404).json({
        error: 'Evento non trovato',
      })
    }

    if (payload.name !== undefined) event.name = payload.name
    if (payload.eventType !== undefined) event.eventType = payload.eventType
    if (payload.location !== undefined) event.location = payload.location
    if (payload.guests !== undefined) event.guests = payload.guests
    if (payload.budget !== undefined) event.budget = String(payload.budget)
    if (payload.status !== undefined) event.status = payload.status

    await event.save()

    return response.json(EventTransformer.transform(event))
  }

  /**
   * DELETE /api/v1/events/:id
   * Delete an event only if it has no bookings
   */
  async destroy({ params, auth, response }: HttpContext) {
    const user = auth.getUserOrFail()

    const result = await db.transaction(async (trx) => {
      const event = await Event.query()
        .useTransaction(trx)
        .where('id', params.id)
        .where('userId', String(user.id))
        .forUpdate()
        .first()

      if (!event) {
        return 'NOT_FOUND'
      }

      const booking = await Booking.query()
        .useTransaction(trx)
        .where('eventId', String(event.id))
        .first()

      if (booking) {
        return 'HAS_BOOKINGS'
      }

      await Event.query()
        .useTransaction(trx)
        .where('id', String(event.id))
        .delete()

      return 'DELETED'
    })

    if (result === 'NOT_FOUND') {
      return response.status(404).json({
        error: 'Evento non trovato',
      })
    }

    if (result === 'HAS_BOOKINGS') {
      return response.status(409).json({
        error: 'Impossibile eliminare un evento con prenotazioni. Annullale prima.',
      })
    }

    return response.status(204).send('')
  }
}