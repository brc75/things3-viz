const compression = require('compression');
const config = require('config');
const ect = require('ect');
const express = require('express');

const db = require('../db');


const port = config.get('website.port');


process.on('unhandledRejection', err => console.error(err));


express()
    .use(compression())

    .use('/', express.static('static'))

    .get('/', (req, res) => res.render('index'))

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: `${__dirname}/../../views`
    }).render)

    .listen(port, () => console.info(`Website started at port ${port}`));