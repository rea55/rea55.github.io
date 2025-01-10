const axios = require('axios');

// Example data to send
const dataToSend = {
  name: 'John',
  age: 30
};

// Send a POST request with data
axios.post('http://localhost:3000/data', dataToSend)
  .then(response => {
    console.log('Response from server:', response.data); // Log the response
  })
  .catch(error => {
    console.error('Error:', error); // Log any errors
  });
