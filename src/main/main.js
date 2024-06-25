const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const express = require('express');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const serverApp = express();
const port = 3000;

// Setup SQLite database
const db = new sqlite3.Database(path.join(__dirname, '../database/chat.db'), (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQLite database.');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        password TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS messages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        room TEXT,
        username TEXT,
        message TEXT,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

// Express API
serverApp.use(express.json());

serverApp.post('/register', (req, res) => {
    const { username, password } = req.body;
    const hashedPassword = bcrypt.hashSync(password, 8);

    db.run(`INSERT INTO users (username, password) VALUES (?, ?)`, [username, hashedPassword], function(err) {
        if (err) {
            return res.status(500).send('Error registering user');
        }
        res.status(200).send('User registered');
    });
});

serverApp.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(`SELECT * FROM users WHERE username = ?`, [username], (err, row) => {
        if (err || !row) {
            return res.status(400).send('Invalid username or password');
        }
        
        const passwordIsValid = bcrypt.compareSync(password, row.password);
        if (!passwordIsValid) {
            return res.status(401).send('Invalid username or password');
        }
        
        res.status(200).send('Login successful');
    });
});

serverApp.get('/messages', (req, res) => {
    const { room } = req.query;

    db.all(`SELECT * FROM messages WHERE room = ? ORDER BY timestamp`, [room], (err, rows) => {
        if (err) {
            return res.status(500).send('Error retrieving messages');
        }
        res.status(200).json(rows);
    });
});

serverApp.post('/messages', (req, res) => {
    const { room, username, message } = req.body;

    db.run(`INSERT INTO messages (room, username, message) VALUES (?, ?, ?)`, [room, username, message], function(err) {
        if (err) {
            return res.status(500).send('Error saving message');
        }
        res.status(200).send('Message sent');
    });
});

serverApp.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});

// Electron Main Process
function createWindow() {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: true,
            contextIsolation: false,
        }
    });

    win.loadFile(path.join(__dirname, '../renderer/index.html'));
}

app.on('ready', createWindow);
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
