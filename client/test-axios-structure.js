// Test axios response structure
import api from '../utils/api';

async function testAPI() {
  try {
    console.log('Testing API response structure...');
    const response = await api.get('/expenses/categories');
    console.log('Full response:', response);
    console.log('Response.data:', response.data);
    console.log('Response.data.data:', response.data.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

testAPI();