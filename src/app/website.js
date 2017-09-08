const compression = require('compression')
const config = require('config')
const ect = require('ect')
const express = require('express')

const data = require('../data')


const port = config.get('website.port')


let cache

const updateCache = async () => {
    cache = await data.load()
}

updateCache()
setInterval(updateCache, config.get('data.cacheIntervalMs'))


process.on('unhandledRejection', err => console.error(err))

express()
    .use(compression())

    .use('/', express.static('static'))

    .get('/', (req, res) => res.render('index'))
    .get('/data.json', (req, res) => res.json(cache))

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: `${__dirname}/../../views`
    }).render)

    .listen(port, () => console.info(`Website started at port ${port}`))