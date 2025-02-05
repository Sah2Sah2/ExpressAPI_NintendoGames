const https = require('https');
const express = require("express");
const app = express();

app.use(express.json()); // The code in the db is written in JSON

const DOTNET_API_URL = 'https://localhost:7258'; // Your .NET API URL on Azure (ensure it's HTTPS)

// Get all games from the .NET API
app.get('/game', (req, res) => {
    https.get(`${DOTNET_API_URL}/games`, (response) => { 
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            if (response.statusCode === 200) {
                res.status(200).json(JSON.parse(data)); // Sending back the data from the .NET API
            } else {
                res.status(response.statusCode).send(`Failed to fetch games: ${data}`);
            }
        });
    }).on('error', (err) => {
        console.error('Error connecting to .NET API:', err.message);
        res.status(500).send('Error connecting to the .NET API');
    });
});

// Get a specific game by name
app.get('/game/:name', (req, res) => {
    const gameName = req.params.name;

    https.get(`${DOTNET_API_URL}/api/game?name=${gameName}`, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            if (response.statusCode === 200) {
                res.status(200).json(JSON.parse(data)); // Sending back the data from the .NET API
            } else if (response.statusCode === 404) {
                res.status(404).send(`Game with name '${gameName}' not found`);
            } else if (response.statusCode === 400) {
                res.status(400).send('Invalid request');
            } else {
                res.status(response.statusCode).send(`Failed to fetch game: ${data}`);
            }
        });
    }).on('error', (err) => {
        console.error('Error fetching game: ', err.message);
        res.status(500).send('Error fetching game data');
    });
});

// Add a new game to the .NET API
app.post('/game', (req, res) => {
    // Extract game data from request body
    const { name, genre, releaseYear, developer } = req.body;

    if (!name || !genre || !releaseYear || !developer) {
        return res.status(400).send('Missing required fields: name, genre, releaseYear, developer');
    }

    const newGame = {
        name,            // Name of the game
        genre,           // Genre of the game
        releaseYear,     // Release year of the game
        developer        // Developer of the game
    };

    // Convert the new game object to JSON string
    const newGameJson = JSON.stringify(newGame);

    const options = {
        hostname: 'yourapp.azurewebsites.net', // Ensure this is the Azure-hosted domain
        path: '/api/game',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': newGameJson.length
        }
    };

    const request = https.request(options, (response) => {
        let data = '';

        response.on('data', (chunk) => {
            data += chunk;
        });

        response.on('end', () => {
            if (response.statusCode === 201) {
                res.status(201).send('Game successfully added to the .NET API!');
            } else {
                res.status(response.statusCode).send(`Failed to add game: ${data}`);
            }
        });
    });

    request.on('error', (err) => {
        console.error('Error adding game:', err.message);
        res.status(500).send('Error connecting to the .NET API');
    });

    request.write(newGameJson);  // Send the game data
    request.end();
});

// Start the local server (HTTP since you're running this locally)
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Node API running on port ${PORT}`);
});
