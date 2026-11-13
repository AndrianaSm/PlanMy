// not used as the table already exists in the db

import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

async up() {
  // The PlanMy users table already exists.
  // Its schema is managed separately.
}

  async down() {
    //this.schema.dropTable(this.tableName)
    // Do not drop the existing PlanMy users table.
  }
}
