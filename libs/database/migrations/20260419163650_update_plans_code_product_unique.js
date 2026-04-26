/**
 * Alter unique index on plans: remove unique(code), add unique(code, product_id)
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  await knex.schema.alterTable('plans', function(table) {
    // Remove índice único antigo em code
    table.dropUnique(['code']);

    // Cria índice único composto em code + product_id
    table.unique(['code', 'product_id'], 'uq_plans_code_product');
  });
};

/**
 * Rollback: remove índice composto e recria índice único em code
 *
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.alterTable('plans', function(table) {
    // Remove índice composto
    table.dropUnique(['code', 'product_id'], 'uq_plans_code_product');

    // Recria índice único em code
    table.unique(['code']);
  });
};
