const bodyParser = require('body-parser');
const cors = require("cors");
const crypto = require('crypto');
const express = require('express');
const Grid = require('gridfs-stream');
const {GridFsStorage} = require('multer-gridfs-storage');
const methodOverride = require('method-override');
const mongoose = require('mongoose');
const multer = require('multer');
const path = require('path');

// Look into using Koa instead if I finish without using much
const app = express();
const corsOptions ={
  origin:'*', 
  credentials:true,            //access-control-allow-credentials:true
  optionSuccessStatus:200,
}

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// App Constants

const APP_PORT = process.env.APP_PORT || 3000;
const mongoURI = process.env.APP_DB_URI;

// DB Initialization
const conn = mongoose.createConnection(mongoURI);

let gfs, gridfsBucket;

conn.once('open', async () => {
  // Stream Initialization
  gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
    bucketName: 'uploads'
  });
  gfs = Grid(conn.db, mongoose.mongo);
  gfs.collection('uploads');

  // Get collection stats
  conn.db.stats(function(err, stats) {
    console.log(stats);
  });
});

const storage = new GridFsStorage({
  url: process.env.APP_DB_URI,
  file: (req, file) => {
    return new Promise((resolve, reject) =>{
      crypto.randomBytes(16, (err, buff) => {
        if (err) {
          return reject(err);
        }
        const filename = buff.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads',
        };
        resolve(fileInfo);
      });
    });
  }
});
const upload = multer({
  fileFilter: (req, file, callback) => {
    const acceptableExtensions = ['.png', '.jpg', '.mp4', '.gif', '.jpeg'];
    if (!(acceptableExtensions.includes(path.extname(file.originalname)))) {
      req.fileValidationError = 'File format not accepted.';
      callback(new Error('File format not accepted.'), false);
    }
    
    const fileSize = parseInt(req.headers['content-length']);
    conn.db.stats((err, stats) => {
      if (stats.storageSize + fileSize > process.env.MAX_COLLECTION_SIZE) {
        console.log('File size exceeds capacity');
        req.fileValidationError = 'File size exceeds database capacity.';
        callback(new Error('File size exceeds database capacity.'), false);
      }
    });

    callback(null, true);
  },
  storage 
});

// Middleware Initialization
app.use(bodyParser.json());
app.use(cors(corsOptions));
app.use(methodOverride('_method'));

// Routes
app.get('/', (req, res) => {
  return res.status(200).send({
    message: 'Hello, world!',
  });
});

const uploadMiddleware = (req, res, next) => {
  const middlewareObj = upload.single(process.env.FILE_UPLOAD_ARGNAME);
  middlewareObj(req, res, function(err) {
    if (req.fileValidationError) {
      next(new Error(req.fileValidationError));
    } else {
      next();
    }
  });
}

app.post('/upload', uploadMiddleware, (req, res) => {
  res.send(200).json();
});

app.get('/files', (req, res) => {
  gfs.files.find().toArray((err, files) => {
    if (!files || files.length === 0) {
      return res.status(404).json({
        error: 'No files exist',
      });
    }
    return res.json(files);
  });
});

app.get('/files/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if(!file) {
      return res.status(404).json({
        err: 'Requested file does not exist',
      });
    }
    return res.json(file);
  });
});

app.post('/media/delete/:fileid', (req, res) => {
  const obj_id = new mongoose.Types.ObjectId(req.params.fileid);
  gridfsBucket.delete(obj_id).catch(err => {
    console.log(err);
  });
  return res.redirect('/');
});

app.get('/media/:filename', (req, res) => {
  gfs.files.findOne({filename: req.params.filename}, (err, file) => {
    if(!file) {
      return res.status(404).json({
        err: 'Requested file does not exist',
      });
    }

    if (file.contentType === 'image/jpeg' || file.contentType === 'image/png') {
      const readstream = gridfsBucket.openDownloadStream(file._id);
      
      readstream.pipe(res);
    } else if (file.contentType === 'video/mp4') {
      if (!req.headers['range']) {
        return res.status(400).send('Requires Range header');
      }
      const parts = req.headers['range'].replace(/bytes=/, "").split("-");
      const partialstart = parts[0];
      const partialend = parts[1];

      const start = parseInt(partialstart, 10);
      const end = partialend ? parseInt(partialend, 10) : file.length - 1;
      const chunksize = (end - start) + 1;

      res.writeHead(206, {
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize,
          'Content-Range': 'bytes ' + start + '-' + end + '/' + file.length,
          'Content-Type': file.contentType,
      });

      const downloadStream = gridfsBucket.openDownloadStream(file._id, {
        start: start,
        end: end+1,
      });

      downloadStream.pipe(res);
    } else {
      return res.status(404).json({
        err: 'Requested file cannot be displayed.'
      });
    }
  });
});

app.listen(APP_PORT, () => console.log(`App is listening on port: ${APP_PORT}`));
