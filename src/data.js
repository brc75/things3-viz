const config = require('config')
const fs = require('fs')
const moment = require('moment')
const sqlite = require('sqlite')
const Promise = require('bluebird')


const areaRegex = new RegExp(config.get('data.areaRegex'))
const irrelevantTasksTimestamp = (new Date().getTime() - config.get('data.irrelevantTasksIntervalMs')) / 1000
const recentTasksTimestamp = (new Date().getTime() - config.get('data.recentTasksIntervalMs')) / 1000

const loadProjectTasks = async (db, projectId) => Promise.all((await db
    .all(`SELECT * FROM TMTask ` + 
        `WHERE project = "${projectId}" AND type = 0 AND trashed = 0 ` +
        `AND (status <> 2 AND status <> 3 OR userModificationDate > ${irrelevantTasksTimestamp})` + 
        `ORDER BY \`status\`, \`index\``))
    .map(task => ({
        title: task.title,
        isCancelled: task.status === 2,
        isCompleted: task.status === 3,
        isRecent: task.userModificationDate > recentTasksTimestamp
    })))

const loadSectionTasks = async (db, sectionId) => Promise.all((await db
    .all(`SELECT * FROM TMTask ` + 
        `WHERE actionGroup = "${sectionId}" AND type = 0 AND trashed = 0 ` +
        `AND (status <> 2 AND status <> 3 OR userModificationDate > ${irrelevantTasksTimestamp})` + 
        `ORDER BY \`status\`, \`index\``))
    .map(task => ({
        title: task.title,
        isCancelled: task.status === 2,
        isCompleted: task.status === 3,
        isRecent: task.userModificationDate > recentTasksTimestamp
    })))

const loadAreaTasks = async (db, areaId) => Promise.all((await db
    .all(`SELECT * FROM TMTask `+
        `WHERE area = "${areaId}" AND type = 0 AND trashed = 0 ` +
        `AND (status <> 2 AND status <> 3 OR userModificationDate > ${irrelevantTasksTimestamp})` + 
        `ORDER BY \`status\`, \`index\``))
    .map(task => ({
        title: task.title,
        isCancelled: task.status === 2,
        isCompleted: task.status === 3,
        isRecent: task.userModificationDate > recentTasksTimestamp
    })))

const loadSections = async (db, projectId) => Promise.all((await db
    .all(`SELECT * FROM TMTask ` +
        `WHERE project = "${projectId}" AND type = 2 AND trashed = 0 ` +
        `AND (status <> 3 OR userModificationDate > ${irrelevantTasksTimestamp})` + 
        `ORDER BY \`index\``))
    .map(async section => ({
        title: section.title,
        tasks: await loadSectionTasks(db, section.uuid),
        isCompleted: section.status === 3
    })))

const loadProjects = async (db, areaId) => Promise.all((await db
    .all(`SELECT * FROM TMTask ` +
        `WHERE area = "${areaId}" AND type = 1 AND trashed = 0 AND status <> 3 ` +
        `ORDER BY \`index\``))
    .map(async project => ({
        title: project.title,
        sections: await loadSections(db, project.uuid),
        tasks: await loadProjectTasks(db, project.uuid)
    })))

const loadAreas = async db => Promise.all((await db
    .all(`SELECT * FROM TMArea ORDER BY \`index\``))
    .filter(area => areaRegex.test(area.title))
    .map(async area => ({
        title: area.title,
        projects: await loadProjects(db, area.uuid),
        tasks: await loadAreaTasks(db, area.uuid)
    })))

const load = async () => {
    const db = await sqlite.open(config.get('data.path'))
    const updateDate = moment(fs.statSync(config.get('data.path')).mtime).format('DD.MM.YYYY')
    
    return {
        areas: await loadAreas(db),
        updateDate
    }
}


module.exports = {
    load
}