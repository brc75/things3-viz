const r = require('rethinkdb');

const setup = require('./setup');
const result = require('./result');


const connection = setup.getConnection({
    // table: [{
    //     name: 'index',
    //     predicate: r.row('field'),
    //     options: { multi: true }
    // }]
});

const upsert = (table, entities) => connection.then(c => r.table(table)
    .insert(entities, { conflict: 'update' })
    .run(c)
    .then(result.check));

const getAll = (table, value, index) => connection.then(c => r.table(table)
    .getAll(value, { index })
    .run(c)
    .then(result.toArray));


module.exports = {};