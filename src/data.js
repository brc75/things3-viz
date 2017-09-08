const config = require('config')
const sqlite = require('sqlite')
const Promise = require('bluebird')


const areaRegex = new RegExp(config.get('data.areaRegex'))

const loadTasks = async (db, projectId) => Promise.all((await db
    .all(`SELECT * FROM TMTask WHERE project = "${projectId}" AND type = 0 and trashed = 0 ORDER BY \`status\`, \`index\``))
    .map(task => ({
        title: task.title,
        isCancelled: task.status === 2,
        isCompleted: task.status === 3
    })))

const loadSectionTasks = async (db, sectionId) => Promise.all((await db
    .all(`SELECT * FROM TMTask WHERE actionGroup = "${sectionId}" AND type = 0 and trashed = 0 ORDER BY \`index\``))
    .map(task => ({
        title: task.title
    })))

const loadSections = async (db, projectId) => Promise.all((await db
    .all(`SELECT * FROM TMTask WHERE project = "${projectId}" AND type = 2 and trashed = 0 ORDER BY \`index\``))
    .map(async section => ({
        title: section.title,
        tasks: await loadSectionTasks(db, section.uuid)
    })))

const loadProjects = async (db, areaId) => Promise.all((await db
    .all(`SELECT * FROM TMTask WHERE area = "${areaId}" AND type = 1 and trashed = 0 and status <> 3 ORDER BY \`index\``))
    .map(async project => ({
        title: project.title,
        sections: await loadSections(db, project.uuid),
        tasks: await loadTasks(db, project.uuid)
    })))

const loadAreas = async db => Promise.all((await db
    .all(`SELECT * FROM TMArea ORDER BY \`index\``))
    .filter(area => areaRegex.test(area.title))
    .map(async area => ({
        title: area.title,
        projects: await loadProjects(db, area.uuid)
    })))

const load = async () => {
    const db = await sqlite.open(config.get('data.path'))
    return await loadAreas(db)
}


module.exports = {
    load
}