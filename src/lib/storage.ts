import { storage } from './firebase';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  path: string;
  name: string;
}

export const storageService = {
  // Upload image to Firebase Storage
  async uploadImage(file: File, folder: string = 'projects'): Promise<UploadResult> {
    if (!file.type.startsWith('image/')) {
      throw new Error('ไฟล์ต้องเป็นรูปภาพเท่านั้น');
    }

    // Generate unique filename
    const fileExtension = file.name.split('.').pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const imagePath = `${folder}/${fileName}`;
    
    // Create storage reference
    const imageRef = ref(storage, imagePath);
    
    try {
      // Upload file
      const snapshot = await uploadBytes(imageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      return {
        url: downloadURL,
        path: imagePath,
        name: fileName
      };
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('เกิดข้อผิดพลาดในการอัพโหลดรูปภาพ');
    }
  },

  // Upload multiple images
  async uploadMultipleImages(files: File[], folder: string = 'projects'): Promise<UploadResult[]> {
    const uploadPromises = files.map(file => this.uploadImage(file, folder));
    return Promise.all(uploadPromises);
  },

  // Delete image from Firebase Storage
  async deleteImage(imagePath: string): Promise<void> {
    try {
      const imageRef = ref(storage, imagePath);
      await deleteObject(imageRef);
    } catch (error) {
      console.error('Error deleting image:', error);
      throw new Error('เกิดข้อผิดพลาดในการลบรูปภาพ');
    }
  },

  // Resize image before upload (client-side)
  async resizeImage(file: File, maxWidth: number = 1200, maxHeight: number = 800, quality: number = 0.8): Promise<File> {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        // Set canvas size
        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], file.name, {
              type: file.type,
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, file.type, quality);
      };

      img.src = URL.createObjectURL(file);
    });
  },

  // Validate image file
  validateImageFile(file: File): { valid: boolean; error?: string } {
    // Check file type
    if (!file.type.startsWith('image/')) {
      return { valid: false, error: 'ไฟล์ต้องเป็นรูปภาพเท่านั้น' };
    }

    // Check file size (5MB limit)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { valid: false, error: 'ขนาดไฟล์ต้องไม่เกิน 5MB' };
    }

    // Check image dimensions (optional)
    return { valid: true };
  }
};