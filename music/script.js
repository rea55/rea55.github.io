// Import axios (if not already imported in your project)
import axios from 'axios';

// Define the test_backend function
function test_backend() {
  // Backend URL
  const backendUrl = 'http://127.0.0.1:8080/test';

  // Send a GET request to the backend
  axios
    .get(backendUrl)
    .then((response) => {
      console.log('Response from backend:', response.data); // Log the response data
    })
    .catch((error) => {
      console.error('Error connecting to backend:', error); // Log any errors
    });
}

// Example usage: Call the function
test_backend();
