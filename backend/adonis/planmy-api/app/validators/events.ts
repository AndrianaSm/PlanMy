
import vine from '@vinejs/vine'

const allowedStatuses = ['PLANNING', 'CONFIRMED', 'CANCELLED'] as const

const eventFields = {
  name: vine.string().trim().minLength(1).maxLength(120),
  eventType: vine.string().trim().minLength(1),
  date: vine.string().trim(),
  time: vine.string().trim(),
  location: vine.string().trim().minLength(1),
  guests: vine.number().min(1).withoutDecimals(),
  budget: vine.number().min(0),
}

export const createEventValidator = vine.create({
  name: eventFields.name,
  eventType: eventFields.eventType,
  date: eventFields.date,
  time: eventFields.time,
  location: eventFields.location,
  guests: eventFields.guests,
  budget: eventFields.budget,
})

export const updateEventValidator = vine.create({
  name: eventFields.name.optional(),
  eventType: eventFields.eventType.optional(),
  date: eventFields.date.optional(),
  time: eventFields.time.optional(),
  location: eventFields.location.optional(),
  guests: eventFields.guests.optional(),
  budget: eventFields.budget.optional(),
  status: vine.enum(allowedStatuses).optional(),
})

export const eventStatusValidator = vine.create({
  status: vine.enum(allowedStatuses),
})
