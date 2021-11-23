const bucket = process.env.GCS_BUCKET || 'bucket-test'

const gcs = {
  projectId: process.env.GCS_PROJECT_ID || 'multer-gstore-test'
}

module.exports = {
  bucket,
  gcs
}
