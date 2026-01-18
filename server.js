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
// ... (początek bez zmian)

// Endpoint listy filmów (teraz z sortowaniem od najnowszych)
app.get('/list-videos', (req, res) => {
    db.find({}).sort({ timestamp: -1 }).exec((err, docs) => res.send(docs));
});

// Endpoint wysyłania (dodajemy views: 0)
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('Brak pliku');
    
    // Cloudinary automatycznie generuje miniaturkę JPG dla każdego wideo pod tym samym linkiem, zmieniając tylko rozszerzenie
    const thumbnailPath = req.file.path.replace(/\.[^/.]+$/, ".jpg");

    const videoData = {
        title: req.file.originalname || "Bez tytułu",
        path: req.file.path,
        thumbnail: thumbnailPath,
        views: 0, // Nowa funkcja: licznik
        timestamp: Date.now(),
        public_id: req.file.filename // Potrzebne do usuwania z Cloudinary
    };
    
    db.insert(videoData, (err, newDoc) => {
        if (err) return res.status(500).send(err);
        res.send(newDoc);
    });
});

// Nowy endpoint: Zliczanie wyświetleń
app.post('/view/:id', (req, res) => {
    db.update({ _id: req.params.id }, { $inc: { views: 1 } }, {}, () => {
        res.sendStatus(200);
    });
});

// Nowy endpoint: Usuwanie filmu
app.delete('/video/:id', (req, res) => {
    // Najpierw pobieramy dane o filmie, żeby znać public_id w Cloudinary
    db.findOne({ _id: req.params.id }, (err, video) => {
        if (video) {
            // Usuwamy z Cloudinary
            cloudinary.uploader.destroy(video.public_id, { resource_type: 'video' });
            // Usuwamy z bazy danych
            db.remove({ _id: req.params.id }, {}, () => res.sendStatus(200));
        }
    });
});

// ... (reszta kodu)

app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));