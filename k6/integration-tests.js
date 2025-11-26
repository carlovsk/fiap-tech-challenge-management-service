import http from 'k6/http';
import { check, fail, sleep } from 'k6';

// Configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';

// Test options - run sequentially, not as load test
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    checks: ['rate==1.0'], // All checks must pass
  },
};

// Store created vehicle ID for subsequent tests
let createdVehicleId = null;

// Test data
const testVehicle = {
  brand: 'Toyota',
  model: 'Corolla',
  year: 2024,
  color: 'Silver',
  price: 35000.00,
  status: 'AVAILABLE',
};

const updatedVehicle = {
  brand: 'Toyota',
  model: 'Corolla XLE',
  year: 2024,
  color: 'Midnight Black',
  price: 38500.00,
  status: 'AVAILABLE',
};

// Helper function for JSON requests
function jsonRequest(method, url, body = null) {
  const params = {
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (method === 'GET' || method === 'DELETE') {
    return http.request(method, url, null, params);
  }
  return http.request(method, url, JSON.stringify(body), params);
}

// Main test function
export default function () {
  // ============================================
  // Test 1: Health Check
  // ============================================
  console.log('🏥 Testing Health Check...');
  
  const healthResponse = http.get(`${BASE_URL}/health`);
  
  const healthCheckPassed = check(healthResponse, {
    'Health check - status is 200': (r) => r.status === 200,
    'Health check - returns healthy: true': (r) => {
      const body = JSON.parse(r.body);
      return body.healthy === true;
    },
    'Health check - has timestamp': (r) => {
      const body = JSON.parse(r.body);
      return body.timestamp !== undefined;
    },
  });

  if (!healthCheckPassed) {
    fail('❌ Health check failed! Stopping tests.');
  }
  
  console.log('✅ Health check passed');
  sleep(0.5);

  // ============================================
  // Test 2: Create Vehicle
  // ============================================
  console.log('🚗 Testing Create Vehicle...');
  
  const createResponse = jsonRequest('POST', `${BASE_URL}/api/vehicles`, testVehicle);
  
  const createCheckPassed = check(createResponse, {
    'Create vehicle - status is 201': (r) => r.status === 201,
    'Create vehicle - returns vehicle with ID': (r) => {
      const body = JSON.parse(r.body);
      if (body.id) {
        createdVehicleId = body.id;
        return true;
      }
      return false;
    },
    'Create vehicle - brand matches': (r) => {
      const body = JSON.parse(r.body);
      return body.brand === testVehicle.brand;
    },
    'Create vehicle - model matches': (r) => {
      const body = JSON.parse(r.body);
      return body.model === testVehicle.model;
    },
    'Create vehicle - year matches': (r) => {
      const body = JSON.parse(r.body);
      return body.year === testVehicle.year;
    },
    'Create vehicle - color matches': (r) => {
      const body = JSON.parse(r.body);
      return body.color === testVehicle.color;
    },
    'Create vehicle - status is AVAILABLE': (r) => {
      const body = JSON.parse(r.body);
      return body.status === 'AVAILABLE';
    },
  });

  if (!createCheckPassed || !createdVehicleId) {
    fail('❌ Create vehicle failed! Cannot continue tests.');
  }
  
  console.log(`✅ Vehicle created with ID: ${createdVehicleId}`);
  sleep(0.5);

  // ============================================
  // Test 3: Get Vehicle by ID
  // ============================================
  console.log('🔍 Testing Get Vehicle by ID...');
  
  const getByIdResponse = jsonRequest('GET', `${BASE_URL}/api/vehicles/${createdVehicleId}`);
  
  const getByIdCheckPassed = check(getByIdResponse, {
    'Get vehicle by ID - status is 200': (r) => r.status === 200,
    'Get vehicle by ID - correct ID returned': (r) => {
      const body = JSON.parse(r.body);
      return body.id === createdVehicleId;
    },
    'Get vehicle by ID - brand matches': (r) => {
      const body = JSON.parse(r.body);
      return body.brand === testVehicle.brand;
    },
    'Get vehicle by ID - model matches': (r) => {
      const body = JSON.parse(r.body);
      return body.model === testVehicle.model;
    },
  });

  if (!getByIdCheckPassed) {
    fail('❌ Get vehicle by ID failed!');
  }
  
  console.log('✅ Get vehicle by ID passed');
  sleep(0.5);

  // ============================================
  // Test 4: Update Vehicle
  // ============================================
  console.log('✏️ Testing Update Vehicle...');
  
  const updateResponse = jsonRequest('PUT', `${BASE_URL}/api/vehicles/${createdVehicleId}`, updatedVehicle);
  
  const updateCheckPassed = check(updateResponse, {
    'Update vehicle - status is 200': (r) => r.status === 200,
    'Update vehicle - ID unchanged': (r) => {
      const body = JSON.parse(r.body);
      return body.id === createdVehicleId;
    },
    'Update vehicle - model updated': (r) => {
      const body = JSON.parse(r.body);
      return body.model === updatedVehicle.model;
    },
    'Update vehicle - color updated': (r) => {
      const body = JSON.parse(r.body);
      return body.color === updatedVehicle.color;
    },
    'Update vehicle - price updated': (r) => {
      const body = JSON.parse(r.body);
      // Price might be returned as string from Prisma Decimal
      const price = typeof body.price === 'string' ? parseFloat(body.price) : body.price;
      return price === updatedVehicle.price;
    },
  });

  if (!updateCheckPassed) {
    fail('❌ Update vehicle failed!');
  }
  
  console.log('✅ Update vehicle passed');
  sleep(0.5);

  // ============================================
  // Test 5: List All Vehicles
  // ============================================
  console.log('📋 Testing List All Vehicles...');
  
  const listResponse = jsonRequest('GET', `${BASE_URL}/api/vehicles`);
  
  const listCheckPassed = check(listResponse, {
    'List vehicles - status is 200': (r) => r.status === 200,
    'List vehicles - returns array': (r) => {
      const body = JSON.parse(r.body);
      return Array.isArray(body);
    },
    'List vehicles - contains created vehicle': (r) => {
      const body = JSON.parse(r.body);
      return body.some((v) => v.id === createdVehicleId);
    },
    'List vehicles - created vehicle has updated values': (r) => {
      const body = JSON.parse(r.body);
      const vehicle = body.find((v) => v.id === createdVehicleId);
      return vehicle && vehicle.model === updatedVehicle.model;
    },
  });

  if (!listCheckPassed) {
    fail('❌ List vehicles failed!');
  }
  
  console.log('✅ List vehicles passed');
  sleep(0.5);

  // ============================================
  // Test 6: Delete Vehicle
  // ============================================
  console.log('🗑️ Testing Delete Vehicle...');
  
  const deleteResponse = jsonRequest('DELETE', `${BASE_URL}/api/vehicles/${createdVehicleId}`);
  
  const deleteCheckPassed = check(deleteResponse, {
    'Delete vehicle - status is 200': (r) => r.status === 200,
    'Delete vehicle - success message': (r) => {
      const body = JSON.parse(r.body);
      return body.message === 'Vehicle deleted successfully';
    },
  });

  if (!deleteCheckPassed) {
    fail('❌ Delete vehicle failed!');
  }
  
  console.log('✅ Delete vehicle passed');
  sleep(0.5);

  // ============================================
  // Test 7: Verify Deletion (404 expected)
  // ============================================
  console.log('🔍 Verifying vehicle was deleted...');
  
  const verifyDeleteResponse = jsonRequest('GET', `${BASE_URL}/api/vehicles/${createdVehicleId}`);
  
  const verifyDeleteCheckPassed = check(verifyDeleteResponse, {
    'Verify deletion - status is 404': (r) => r.status === 404,
    'Verify deletion - vehicle not found error': (r) => {
      const body = JSON.parse(r.body);
      return body.error === 'Vehicle not found';
    },
  });

  if (!verifyDeleteCheckPassed) {
    fail('❌ Delete verification failed!');
  }
  
  console.log('✅ Delete verification passed');
  console.log('\n🎉 All integration tests passed successfully!');
}

// Summary handler
export function handleSummary(data) {
  const passed = data.metrics.checks.values.passes;
  const failed = data.metrics.checks.values.fails;
  const total = passed + failed;
  
  console.log('\n========================================');
  console.log('Integration Test Summary');
  console.log('========================================');
  console.log(`Total Checks: ${total}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(2)}%`);
  console.log('========================================\n');
  
  return {};
}

