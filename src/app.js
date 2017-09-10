const compression = require('compression')
const config = require('config')
const ect = require('ect')
const express = require('express')
const fs = require('fs')
const multer = require('multer')

const data = require('./data')


const port = config.get('website.port')


const upload = multer()


process.on('unhandledRejection', err => console.error(err))

express()
    .use(compression())

    .use('/', express.static('static'))

    .get('/', (req, res) => res.render('index'))
    .get('/data.json', async (req, res) => {
        res.json(await data.load())
    })

    .post('/data', upload.single('data'), (req, res, next) => {
        try {
            if (req.get('X-Key') !== config.get('website.key')) {
                throw 'Wrong key';
            }

            fs.writeFileSync(config.get('data.path'), req.file.buffer)
            res.sendStatus(200)
        }
        catch (e) {
            res.sendStatus(400)
        }
    })

    .set('view engine', 'ect')
    .engine('ect', ect({
        watch: true,
        root: `${__dirname}/../../views`
    }).render)

    .listen(port, () => console.info(`Website started at port ${port}`))