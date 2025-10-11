#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Revalidate Cache Script
 * เคลียแคช Next.js และรีสตาร์ท development server
 */

// 1. ลบ .next/cache directory
const nextCachePath = path.join(process.cwd(), '.next/cache');
try {
  if (fs.existsSync(nextCachePath)) {
    fs.rmSync(nextCachePath, { recursive: true, force: true });
  } else {
    console.warn('ℹ️  .next/cache directory not found (already clean)');
  }
} catch (error) {
  console.error('⚠️  Failed to clear .next/cache:', error.message);
}

// 2. ลบ .next/server/app directory (server cache)
const nextServerPath = path.join(process.cwd(), '.next/server/app');
try {
  if (fs.existsSync(nextServerPath)) {
    fs.rmSync(nextServerPath, { recursive: true, force: true });
  }
} catch (error) {
  console.error('⚠️  Failed to clear .next/server/app:', error.message);
}

// 3. เรียก revalidate API (หากเซิร์ฟเวอร์กำลังทำงาน)
async function callRevalidateAPI() {
  try {
    const response = await fetch('http://localhost:3000/api/projects', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        secret: process.env.REVALIDATION_SECRET_TOKEN || 'dev-revalidate-token'
      })
    });
    
    if (response.ok) {
      console.info('✅ Called revalidate API successfully');
    } else {
      console.warn('ℹ️  Revalidate API call failed (server may not be running)');
    }
  } catch (error) {
    console.warn('ℹ️  Could not call revalidate API (server may not be running)');
  }
}

// ถ้าใส่ --with-api flag จะพยายามเรียก API
if (process.argv.includes('--with-api')) {
  callRevalidateAPI();
}
