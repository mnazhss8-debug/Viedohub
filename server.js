const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;
const Datastore = require('nedb');
const db = new Datastore({ filename: 'videos.db', autoload: true });

// Endpoint do pobierania listy filmów
app.get('/list-videos', (req, res) => {
    db.find({}, (err, docs) => {
        res.send(docs);
    });
});

// Zmodyfikuj endpoint /upload, aby zapisywał dane do bazy:
app.post('/upload', upload.single('video'), (req, res) => {
    const videoData = {
        title: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        timestamp: Date.now()
    };
    
    db.insert(videoData, (err, newDoc) => {
        res.send(newDoc);
    });
});

// 1. Konfiguracja zapisu plików
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = './uploads';
        if (!fs.existsSync(dir)) fs.mkdirSync(dir); // Tworzy folder jeśli nie istnieje
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Unikalna nazwa pliku
    }
});

const upload = multer({ storage: storage });

// 2. Udostępnienie plików statycznych (Twój HTML i filmy)
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// 3. Endpoint do przesyłania wideo
app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('Nie wybrano pliku.');
    
    // W prawdziwym YouTube tutaj zapisalibyśmy dane w bazie danych
    console.log("Plik zapisany jako: " + req.file.filename);
    res.send({ fileName: req.file.filename });
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});