
import Booking from '#models/booking'
import { BaseTransformer } from '@adonisjs/core/transformers'

export default class BookingTransformer extends BaseTransformer<Booking> {
  toObject() {
    return {
      id: this.resource.id,
      providerId: this.resource.providerId,
      providerName: this.resource.provider.name,
      category: this.resource.provider.category,
      imageUrl: this.resource.provider.imageUrl,
      serviceDate: this.resource.serviceDate.toISODate(),
      price: this.resource.price,
      paidAmount: this.resource.paidAmount,
      status: this.resource.status,
    }
  }
}
