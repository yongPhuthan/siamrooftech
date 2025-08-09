// Utility function for generating file hashes
export async function generateFileHash(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Get short hash for file identification
export async function getShortFileHash(file: File): Promise<string> {
  const fullHash = await generateFileHash(file);
  return fullHash.substring(0, 16); // Use first 16 chars for shorter ID
}

// Check if two files have the same content
export async function areFilesIdentical(file1: File, file2: File): Promise<boolean> {
  const hash1 = await generateFileHash(file1);
  const hash2 = await generateFileHash(file2);
  return hash1 === hash2;
}