const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Datastore = require('nedb');

const app = express();
const PORT = process.env.PORT || 3000; // Ważne dla Rendera!

// 1. Baza danych
const db = new Datastore({ filename: 'videos.db', autoload: true });

// 2. Konfiguracja zapisu (Folder musi istnieć)
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});

// TO MUSI BYĆ PRZED app.post!
const upload = multer({ storage: storage });

// 3. Udostępnianie plików
// Jeśli index.html jest obok server.js (tak jak na Twoim GitHubie), używamy '.'
app.use(express.static('.')); 
app.use('/uploads', express.static('uploads'));

// 4. Endpointy
app.get('/list-videos', (req, res) => {
    db.find({}, (err, docs) => res.send(docs));
});

app.post('/upload', upload.single('video'), (req, res) => {
    if (!req.file) return res.status(400).send('Brak pliku');
    const videoData = {
        title: req.file.originalname,
        path: `/uploads/${req.file.filename}`,
        timestamp: Date.now()
    };
    db.insert(videoData, (err, newDoc) => res.send(newDoc));
});

app.listen(PORT, () => console.log(`Serwer działa na porcie ${PORT}`));