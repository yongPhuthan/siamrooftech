#!/usr/bin/env node
/**
 * Test script สำหรับทดสอบ Firebase Admin connection
 * วิธีใช้: node scripts/test-firebase-admin.js
 */

require('dotenv').config({ path: '.env.local' });

const admin = require('firebase-admin');

async function testFirebaseAdmin() {
  console.log('🧪 Testing Firebase Admin SDK Connection...\n');

  // ตรวจสอบ Environment Variables
  console.log('📋 Environment Variables:');
  console.log(`FIREBASE_SERVICE_ACCOUNT_KEY: ${process.env.FIREBASE_SERVICE_ACCOUNT_KEY ? '✅ Set' : '❌ Not set'}`);
  console.log(`NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '❌ Not set'}`);
  console.log('');

  try {
    // Initialize Firebase Admin
    if (admin.apps.length === 0) {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || serviceAccount.project_id,
        });
        console.log('✅ Firebase Admin initialized with service account');
      } else {
        console.log('❌ No service account key found');
        return;
      }
    }

    // Test Firestore connection
    const db = admin.firestore();
    console.log('📊 Testing Firestore connection...');

    // Try to fetch projects
    const projectsCol = db.collection('projects');
    const snapshot = await projectsCol.limit(1).get();
    
    console.log(`✅ Firestore connection successful!`);
    console.log(`📄 Total projects found: ${snapshot.size}`);

    if (!snapshot.empty) {
      const firstDoc = snapshot.docs[0];
      console.log(`📝 Sample project: ${firstDoc.id} - ${firstDoc.data().title}`);
    }

    console.log('\n🎉 All tests passed! Firebase Admin is working correctly.');

  } catch (error) {
    console.error('❌ Error during testing:', error);
    
    if (error.code === 'permission-denied') {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check Firestore security rules');
      console.log('2. Verify service account permissions');
      console.log('3. Make sure the project ID is correct');
    }
  }
}

testFirebaseAdmin().catch(console.error);