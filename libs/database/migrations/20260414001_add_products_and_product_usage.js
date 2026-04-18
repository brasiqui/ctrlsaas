const { randomUUID } = require('crypto');

/**
 * Add products and product usage tables, and link plans to products.
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  const legacyProductId = randomUUID();

  return knex.schema
    .createTable('products', function(table) {
      table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
      table.string('code', 50).unique().notNullable();
      table.string('name', 255).notNullable();
      table.text('description');
      table.string('type', 50).notNullable();
      table.boolean('is_active').notNullable().defaultTo(true);
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.comment('Products represent high-level offerings that group plans and usage metrics');
    })
    .then(() =>
      knex('products').insert({
        id: legacyProductId,
        code: 'legacy',
        name: 'Legacy Product',
        description: 'Legacy plans migrated into the product registry',
        type: 'service',
        is_active: true,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
    )
    .then(() =>
      knex.schema.alterTable('plans', function(table) {
        table
          .uuid('product_id')
          .notNullable()
          .defaultTo(legacyProductId)
          .references('id')
          .inTable('products')
          .onDelete('CASCADE');
      })
    )
    .then(() =>
      knex.schema.createTable('product_usage', function(table) {
        table.uuid('id').primary().defaultTo(knex.raw('uuid_generate_v4()'));
        table.uuid('subscription_id').notNullable().references('id').inTable('subscriptions').onDelete('CASCADE');
        table.uuid('product_id').notNullable().references('id').inTable('products').onDelete('CASCADE');
        table.string('metric', 50).notNullable();
        table.bigInteger('used_value').notNullable().defaultTo(0);
        table.bigInteger('limit_value').nullable();
        table.timestamp('last_updated', { useTz: true }).notNullable().defaultTo(knex.fn.now());
        table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

        table.unique(['subscription_id', 'product_id', 'metric'], 'uq_product_usage_subscription_product_metric');
        table.comment('Product usage records for subscriptions and product metrics');
      })
    );
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('product_usage')
    .alterTable('plans', function(table) {
      table.dropColumn('product_id');
    })
    .dropTableIfExists('products');
};
