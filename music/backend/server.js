import axios from 'axios';

const express = require('express'); // Import Express
const app = express(); // Create an Express app
const port = 3000; // Define the server port

// Define a route for '/test'
app.get('/test', (req, res) => {
  res.send('hello world'); // Respond with "hello world"
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
