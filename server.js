const express = require('express');
const multer = require('multer');
const path = require('path');
const Datastore = require('nedb');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const app = express();
const PORT = process.env.PORT || 3000;

// 1. Baza danych
const db = new Datastore({ filename: 'videos.db', autoload: true });

// 2. Konfiguracja Cloudinary
cloudinary.config({
  cloud_name: 'dbke0tcby',
  api_key: '747844565182417',
  api_secret: '_JBcGTuq86slpu5f2q6gROjZshY'
});

// Tworzymy TYLKO JEDEN storage (dla Cloudinary)
const cloudStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    resource_type: 'video',
    folder: 'moje_tube',
    format: 'mp4' // Wymuszamy format mp4 dla lepszej kompatybilności
  },
});

const upload = multer({ storage: cloudStorage });

// 3. Udostępnianie plików statycznych
app.use(express.static('.'));

// 4. Endpointy
app.get('/list-videos', (req, res) => {
    db.find({}).sort({ timestamp: -1 }).exec((err, docs) => res.send(docs));
});

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('Brak pliku');
    
    // Ważna zmiana: Cloudinary zwraca link w req.file.path
    const videoData = {
        title: req.file.originalname || "Bez tytułu",
        path: req.file.path, // To będzie teraz link https://res.cloudinary.com/...
        timestamp: Date.now()
    };
    
    db.insert(videoData, (err, newDoc) => {
        if (err) return res.status(500).send(err);
        res.send(newDoc);
    });
});

app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));