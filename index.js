const { EventEmitter } = require('events')
const {Storage} = require('@google-cloud/storage')

const defaultOptions = {
  bucket: null,
  gcs: null,
  filepath: (req, file) => file.originalname,
  metadata: (req, file) => null,
  isPublic: false,
  isPrivate: false,
  encryptionKey: null,
  setContentType: true
}

const isFunction = a => typeof a === 'function'
const isObject = a => typeof a === 'object' && a !== null
const isString = a => typeof a === 'string'

class MulterGCS extends EventEmitter {
  constructor (options) {
    super()
    this.options = Object.assign({}, defaultOptions, options)

    this.bucket = null

    if (this.options.gcs instanceof Storage) {
      this.storage = this.options.gcs
    } else if (isObject(this.options.gcs)) {
      this.storage = new Storage(this.options.gcs)
    } else if (isFunction(this.options.gcs)) {
      this.storage = null // should be defined during _handleFile
    } else {
      throw Error('missing required option `gcs`')
    }

    if (isFunction(this.options.bucket) || isString(this.options.bucket)) {
      this.bucket = this.options.bucket
    } else {
      throw Error('missing required option `bucket`')
    }
  }

  async _handleFile (req, file, done) {
    let bucket = this.bucket
    let storage = this.storage
    let metadata

    try {
      metadata = await this.options.metadata(req, file)

      if (isFunction(this.options.gcs)) {
        const gcsOptions = await this.options.gcs(req, file)
        storage = new Storage(gcsOptions)
      }

      if (isFunction(bucket)) {
        bucket = this.bucket(req, file)
      }

      if (this.options.setContentType === true) {
        metadata = Object.assign({
          contentType: file.mimetype
        }, metadata)
      }

      const distfileName = await this.options.filepath(req, file)
      const gcsbucket = storage.bucket(bucket)
      const gcsfile = gcsbucket.file(distfileName)
      const gcsstream = gcsfile.createWriteStream({
        metadata
      })

      gcsstream.on('error', (error) => {
        this.emit('error', error)
        done(error)
      })
      gcsstream.on('finish', async () => {
        const response = {
          file,
          gcsfile
        }

        try {
          if (this.options.isPublic === true) {
            await gcsfile.makePublic()
            response.publicUrl = `https://storage.googleapis.com/${bucket}/${distfileName}`
          }

          this.emit('file', { file, gcsfile })
          done(null, response)
        } catch (error) {
          this.emit('error', error)
          done(error)
        }
      })

      file.stream.pipe(gcsstream)
    } catch (error) {
      this.emit('error', error)
    }
  }

  _removeFile (req, file, cb) {

  }
}

module.exports = options => new MulterGCS(options)
