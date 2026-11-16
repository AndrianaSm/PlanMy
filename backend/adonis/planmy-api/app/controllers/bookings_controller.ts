
import type { HttpContext } from '@adonisjs/core/http'
import { DateTime } from 'luxon'
import db from '@adonisjs/lucid/services/db'

import Event from '#models/event'
import Provider from '#models/provider'
import Booking from '#models/booking'

export default class BookingsController {
  async store({ params, request, auth, response }: HttpContext) {
    const { providerId, serviceDate, price } = request.body()

    // Validate event ID
    if (!/^\d+$/.test(params.id)) {
      return response.status(404).json({
        error: 'Evento non trovato',
      })
    }

    // Validate providerId
    const numericProviderId = Number(providerId)

    if (
      providerId === undefined ||
      providerId === null ||
      !Number.isInteger(numericProviderId) ||
      numericProviderId < 1
    ) {
      return response.status(400).json({
        error: 'providerId non valido',
      })
    }

    // Validate price
    const numericPrice = Number(price)

    if (
      price === undefined ||
      !Number.isFinite(numericPrice) ||
      numericPrice < 0
    ) {
      return response.status(400).json({
        error: 'Prezzo non valido',
      })
    }

    // Validate optional serviceDate
    let parsedServiceDate: DateTime | undefined

    if (serviceDate !== undefined && serviceDate !== null && serviceDate !== '') {
      if (typeof serviceDate !== 'string') {
        return response.status(400).json({
          error: 'Data del servizio non valida',
        })
      }

      const parsed = DateTime.fromISO(serviceDate)

      if (!parsed.isValid) {
        return response.status(400).json({
          error: 'Data del servizio non valida',
        })
      }

      parsedServiceDate = parsed
    }

    const user = auth.getUserOrFail()

    try {
      const result = await db.transaction(async (trx) => {
        // Lock the event and verify ownership
        const event = await Event.query()
          .useTransaction(trx)
          .where('id', params.id)
          .where('userId', String(user.id))
          .forUpdate()
          .first()

        if (!event) {
          return { type: 'NOT_FOUND' as const }
        }

        if (event.status === 'CANCELLED') {
          return { type: 'CANCELLED' as const }
        }

        // Verify provider
        const provider = await Provider.query()
          .useTransaction(trx)
          .where('id', numericProviderId)
          .first()

        if (!provider) {
          return { type: 'PROVIDER_NOT_FOUND' as const }
        }

        // Create booking
        const booking = await Booking.create(
          {
            eventId: event.id,
            providerId: provider.id,
            ...(parsedServiceDate
              ? { serviceDate: parsedServiceDate }
              : {}),
            price: String(numericPrice),
            status: 'CONFIRMED',
          },
          { client: trx }
        )

        return {
          type: 'CREATED' as const,
          booking,
        }
      })

      if (result.type === 'NOT_FOUND') {
        return response.status(404).json({
          error: 'Evento non trovato',
        })
      }

      if (result.type === 'CANCELLED') {
        return response.status(409).json({
          error: 'Non puoi prenotare servizi per un evento annullato',
        })
      }

      if (result.type === 'PROVIDER_NOT_FOUND') {
        return response.status(404).json({
          error: 'Provider non trovato',
        })
      }

      const booking = result.booking

      return response.status(201).json({
        id: booking.id,
        eventId: booking.eventId,
        providerId: booking.providerId,
        serviceDate: booking.serviceDate?.toISODate() ?? null,
        price: booking.price,
        status: booking.status,
        createdAt: booking.createdAt?.toISO() ?? null,
      })
    } catch (error) {
      const errorCode =
        typeof error === 'object' && error !== null && 'code' in error
          ? error.code
          : undefined

      if (errorCode === '23505') {
        return response.status(409).json({
          error: 'Questo provider è già prenotato per l’evento',
        })
      }

      if (errorCode === '23503') {
        return response.status(400).json({
          error: 'Evento o provider non valido',
        })
      }

      throw error
    }
  }
}
