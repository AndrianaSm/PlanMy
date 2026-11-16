import type { HttpContext } from '@adonisjs/core/http'
import Provider from '#models/provider'

export default class ProvidersController {
  /**
   * GET /api/v1/providers
   * Filtri: category, location, guests, maxPrice
   */
  async index({ request, response }: HttpContext) {
    const filters = request.qs()

    const conditions: {
      category?: string
      location?: string
      guests?: number
      maxPrice?: number
    } = {}

    // Category
    if (filters.category) {
      if (typeof filters.category !== 'string') {
        return response.status(400).json({
          error: 'Categoria non valida',
        })
      }

      conditions.category = filters.category
    }

    // Location
    if (filters.location) {
      if (typeof filters.location !== 'string') {
        return response.status(400).json({
          error: 'Località non valida',
        })
      }

      conditions.location = filters.location
    }

    // Guests
    if (filters.guests) {
      const guests = Number(filters.guests)

      if (!Number.isInteger(guests) || guests < 1) {
        return response.status(400).json({
          error: 'Numero invitati non valido',
        })
      }

      conditions.guests = guests
    }

    // Max price
    if (filters.maxPrice !== undefined) {
      const maxPrice = Number(filters.maxPrice)

      if (!Number.isFinite(maxPrice) || maxPrice < 0) {
        return response.status(400).json({
          error: 'Prezzo massimo non valido',
        })
      }

      conditions.maxPrice = maxPrice
    }

    const query = Provider.query()

    if (conditions.category) {
      query.where('category', conditions.category)
    }

    if (conditions.location) {
      query.whereILike('location', `%${conditions.location}%`)
    }

    if (conditions.guests !== undefined) {
      query.where((builder) => {
        builder
          .whereNull('maxGuests')
          .orWhere('maxGuests', '>=', conditions.guests!)
      })
    }

    if (conditions.maxPrice !== undefined) {
      query.where('price', '<=', conditions.maxPrice)
    }

    const providers = await query
      .orderByRaw('rating DESC NULLS LAST')
      .orderBy('name', 'asc')

    return response.json(providers)
  }

  /**
   * GET /api/v1/providers/:id
   * Dettaglio provider
   */
  async show({ params, response }: HttpContext) {
    if (!/^\d+$/.test(params.id)) {
      return response.status(404).json({
        error: 'Provider non trovato',
      })
    }

    const provider = await Provider.find(params.id)

    if (!provider) {
      return response.status(404).json({
        error: 'Provider non trovato',
      })
    }

    return response.json(provider)
  }
}