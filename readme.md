# Multer-GCS

Google Storage engine for multer

## Installation

```
npm i --save multer-gcs
```

## Usage

```javascript
const storage = multerGCS({
  // required <object or gcs instance>
  // @see @google-cloud/storage options
  // could be a configuration object or a google storage
  // instance
  gcs: {
    projectId: 'my-google-project-id'
  },
  // required
  // google cloud storage bucket name
  bucket: 'my-bucket',
  // optional (req, file)
  // contains `contentType` = file.mimetype if `setContentType` is true
  // @return object
  metadata: (req, { originalFilename }) => ({
    originalFilename
  }),
  // optional (req, file)
  // (default: originalFilename)
  // @return string
  filepath: (req, file) => `${Date.now().toString()}/my_file`,
  // optional (default=true)
  setContentType: true,
  // optional (default=false)
  isPublic: true,
  // optional (default=false)
  isPrivate: true
})

const upload = multer({
  storage
})

storage.on('error', (error) => {
  console.error('something went wrong during upload', error)
})

app.post('/upload', upload.single('file'), (req, res) => {
  res.send('uploaded file')
})
```
