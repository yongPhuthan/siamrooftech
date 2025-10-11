#!/usr/bin/env node
/**
 * Test script สำหรับทดสอบ Firebase Admin connection
 * วิธีใช้: node scripts/test-firebase-admin.js
 */

require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

async function testFirebaseAdmin() {
  console.info('🧪 Testing Firebase Admin SDK Connection...\n');

  // ตรวจสอบ Environment Variables
  console.info('📋 Environment Variables:');
  console.info(`FIREBASE_SERVICE_ACCOUNT_KEY: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Not set'}`);
  console.info(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Not set'}`);
  console.info('');

  try {
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });
        console.info('✅ Firebase Admin initialized with service account');
      } else {
        console.warn('❌ No service account key found');
        return;
      }
    }

    // Test Firestore connection
    const db = admin.firestore();
    console.info('📊 Testing Firestore connection...');

    // Try to fetch projects
    const projectsCol = db.collection('projects');
    const snapshot = await projectsCol.limit(1).get();
    
    console.info(`✅ Firestore connection successful!`);
    console.info(`📄 Total projects found: ${snapshot.size}`);

    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      console.info(`📝 Sample project: ${firstDoc.id} - ${firstDoc.data().title}`);
    }

    console.info('\n🎉 All tests passed! Firebase Admin is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    
    if (error.code === 'permission-denied') {
      console.info('\n💡 Possible solutions:');
      console.info('1. Check Firestore security rules');
      console.info('2. Verify service account permissions');
      console.info('3. Make sure the project ID is correct');
    }
  }
}

testFirebaseAdmin().catch(console.error);
