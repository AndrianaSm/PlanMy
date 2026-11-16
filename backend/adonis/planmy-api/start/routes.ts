/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import { middleware } from '#start/kernel'
import router from '@adonisjs/core/services/router'
import { controllers } from '#generated/controllers'

router.get('/', () => {
  return { hello: 'world' }
})

router
  .group(() => {
    router
      .group(() => {
        router.post('signup', [controllers.NewAccount, 'store'])
        router.post('login', [controllers.AccessTokens, 'store'])
      })
      .prefix('auth')
      .as('auth')

    router
      .group(() => {
        router.get('profile', [controllers.Profile, 'show'])
        router.post('logout', [controllers.AccessTokens, 'destroy'])
      })
      .prefix('account')
      .as('profile')
      .use(middleware.auth())

    router
      .group(() => {
          router.post('/', [controllers.Events, 'store'])
          router.get('/', [controllers.Events, 'index'])
          router.get('/:id', [controllers.Events, 'show'])
          router.put('/:id', [controllers.Events, 'update'])
          router.delete('/:id', [controllers.Events, 'destroy'])
          router.post('/:id/bookings', [controllers.Bookings, 'store'])
        })
        .prefix('events')
        .use(middleware.auth())

    router
      .group(() => {
        router.get('/', [controllers.Providers, 'index'])
        router.get('/:id', [controllers.Providers, 'show'])
      })
      .prefix('providers')


    router
      .group(() => {
        router.get('/', [controllers.Conversations, 'index'])
      })
      .prefix('conversations')
      .use(middleware.auth())

      
  })
  .prefix('/api/v1')
