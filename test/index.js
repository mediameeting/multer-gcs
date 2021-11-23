/* eslint-env mocha */

const express = require('express')
const chai = require('chai')
const request = require('supertest')
const multer = require('multer')
const GStorage = require('@google-cloud/storage')

const MGCSStorage = require('../index')

const config = require('./config')
const getTestFile = require('./utils/file')

const { expect } = chai

chai.use(require('chai-interface'))

if (!config.bucket) {
  throw Error('missing required env var GCS_BUCKET')
}

if (!config.gcs.projectId) {
  throw Error('missing required env var GCS_PROJECT_ID')
}

const simpleTest = (route, app, storage) => {
  const upload = multer({ storage })
  let result = null

  app.post(route, upload.single('file'), (req, res) => {
    result = {
      body: req.body,
      header: req.header,
      file: req.file
    }
    res.end()
  })

  return new Promise((resolve) => {
    request(app)
      .post(route)
      .attach('file', getTestFile('logo-mediameeting.jpg'))
      .end(() => resolve(result))
  })
}

const simpleTestMissingFile = (route, app, storage) => {
  const upload = multer({ storage })
  let result = null

  app.post(route, upload.single('file'), (req, res) => {
    result = req.file
    res.end()
  })

  return new Promise((resolve) => {
    request(app)
      .post(route)
      .end(() => resolve(result))
  })
}

describe('Storage', () => {
  let app
  let result
  let storage

  before(() => {
    app = express()
  })

  describe('with standard options', () => {
    before(async () => {
      storage = MGCSStorage({
        bucket: config.bucket,
        gcs: config.gcs
      })

      storage.on('error', (error) => {
        console.error('error', error)
      })

      result = await simpleTest('/upload1', app, storage)
    })

    it('should store the file on upload', () => {
      expect(result.file).to.be.an('object')
    })
  })

  describe('with an existing google storage instance', () => {
    before(async () => {
      const gstorage = new GStorage(config.gcs)

      storage = MGCSStorage({
        bucket: config.bucket,
        gcs: gstorage,
        filepath: () => 'test2.jpg'
      })

      storage.on('error', (error) => {
        console.error('error', error)
      })

      result = await simpleTest('/upload2', app, storage)
    })

    it('should store the file on upload', () => {
      expect(result.file).to.be.an('object')
    })
  })

  describe('with options', () => {
    before((done) => {
      storage = MGCSStorage({
        bucket: () => config.bucket,
        gcs: () => config.gcs,
        filepath: () => `test/${Date.now().toString()}`,
        isPublic: true
      })

      const upload = multer({ storage })

      app.post('/uploads', upload.array('logos', 2), (req, res) => {
        result = {
          body: req.body,
          header: req.header,
          files: req.files
        }
        res.end()
      })

      request(app)
        .post('/uploads')
        .attach('logos', getTestFile('logo-mediameeting.jpg'))
        .attach('logos', getTestFile('logo-github.jpg'))
        .end(() => {
          done()
        })
    })

    it('should store the files on upload', () => {
      expect(result.files).to.be.an('array')
    })
  })

  describe('without a file', () => {
    before(async () => {
      storage = MGCSStorage({
        bucket: config.bucket,
        gcs: config.gcs
      })

      storage.on('error', (error) => {
        console.error('error', error)
      })

      result = await simpleTestMissingFile('/upload1', app, storage)
    })

    it('should contain an undefined req.file', () => {
      expect(result).to.be.a('undefined')
    })
  })
})
