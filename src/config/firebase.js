const admin = require('firebase-admin');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH || './firebase-service-account.json';
const resolvedPath = path.resolve(process.cwd(), serviceAccountPath);

let credential = null;

// Try loading service account JSON file if it exists
if (fs.existsSync(resolvedPath)) {
  try {
    const serviceAccount = require(resolvedPath);
    credential = admin.cert(serviceAccount);
    console.log('Firebase Admin SDK: Initialized using credentials JSON file.');
  } catch (error) {
    console.error('Failed to load Firebase Service Account JSON:', error.message);
  }
}

// Fall back to environment variables if JSON file is not present or failed to load
if (!credential) {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY 
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') 
    : undefined;

  if (projectId && clientEmail && privateKey) {
    try {
      credential = admin.cert({
        projectId,
        clientEmail,
        privateKey
      });
      console.log('Firebase Admin SDK: Initialized using environment variables.');
    } catch (error) {
      console.error('Failed to initialize Firebase Admin SDK using environment variables:', error.message);
    }
  }
}

// Error out gracefully if neither option is available
if (!credential) {
  console.error('\n========================================================================');
  console.error('ERROR: Firebase Admin SDK could not be initialized.');
  console.error(`1. Ensure '${serviceAccountPath}' exists in the project root.`);
  console.error('2. OR configure FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file.');
  console.error('========================================================================\n');
  process.exit(1);
}

try {
  admin.initializeApp({ credential });
} catch (error) {
  console.error('Firebase Admin SDK initializeApp failed:', error.message);
  process.exit(1);
}

module.exports = admin;
