// Name: Mark Nemrod
// Student Number: 8767549
//---------------------------------------------------

//Import r=equired modules
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const PORT = 3000;

// Middleware to parse JSON requests
app.use(express.json());

//Connect to SQLite DB
const db = new sqlite3.Database('./greetings.db', (err) => {
    if (err) {
        console.error('Error connecting to SQLite database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
    }
});

//reate and seed the database if it doesn't exist
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS Greetings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timeOfDay TEXT NOT NULL,
            language TEXT NOT NULL,
            greetingMessage TEXT NOT NULL,
            tone TEXT NOT NULL
        )
    `, (err) => {
        if (err) {
            console.error('Error creating table:', err.message);
        }
    });

    const greetings = [
        ['Morning', 'English', 'Good Morning!', 'Formal'],
        ['Morning', 'English', 'Morning!', 'Casual'],
        ['Morning', 'French', 'Bonjour!', 'Formal'],
        ['Morning', 'Spanish', '¡Buenos días!', 'Formal'],
        ['Afternoon', 'English', 'Good Afternoon!', 'Formal'],
        ['Afternoon', 'English', 'Afternoon!', 'Casual'],
        ['Afternoon', 'French', 'Bon après-midi!', 'Formal'],
        ['Evening', 'English', 'Good Evening!', 'Formal'],
        ['Evening', 'English', 'Evening!', 'Casual'],
        ['Evening', 'Spanish', '¡Buenas noches!', 'Formal']
    ];

    //Insert seed data if the table is empty
    db.get('SELECT COUNT(*) AS count FROM Greetings', (err, row) => {
        if (err) {
            console.error('Error querying database:', err.message);
        } else if (row.count === 0) {
            const insert = db.prepare(`
                INSERT INTO Greetings (timeOfDay, language, greetingMessage, tone)
                VALUES (?, ?, ?, ?)
            `);

            greetings.forEach(([timeOfDay, language, greetingMessage, tone]) => {
                insert.run(timeOfDay, language, greetingMessage, tone, (err) => {
                    if (err) console.error('Error inserting data:', err.message);
                });
            });

            insert.finalize(() => console.log('Database seeded with initial greetings.'));
        } else {
            console.log('Database already seeded.');
        }
    });
});

//Endpoint
// 1 Greet Endpoint: Responds with a greeting based on timeOfDay, language, and tone
app.post('/greet', (req, res) => {
    const { timeOfDay, language, tone } = req.body;

    if (!timeOfDay || !language || !tone) {
        return res.status(400).json({ error: 'timeOfDay, language, and tone are required.' });
    }

    const query = `
        SELECT greetingMessage 
        FROM Greetings 
        WHERE timeOfDay = ? AND language = ? AND tone = ?
    `;

    db.get(query, [timeOfDay, language, tone], (err, row) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (row) {
            res.json({ greetingMessage: row.greetingMessage });
        } else {
            res.status(404).json({ error: 'Greeting not found' });
        }
    });
});

// 2.get AllTimes of Day Endpoint: Returns all available timeOfDay values
app.get('/timesOfDay', (req, res) => {
    const query = `SELECT DISTINCT timeOfDay FROM Greetings`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(rows.map(row => row.timeOfDay));
    });
});

// 3 Get Supported Languages Endpoint: Returns all supported languages
app.get('/languages', (req, res) => {
    const query = `SELECT DISTINCT language FROM Greetings`;

    db.all(query, [], (err, rows) => {
        if (err) {
            console.error('Database query error:', err.message);
            return res.status(500).json({ error: 'Internal server error' });
        }

        res.json(rows.map(row => row.language));
    });
});

//4 strart the server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
