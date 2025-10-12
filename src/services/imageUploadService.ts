import { deleteObject, getDownloadURL, ref, uploadBytesResumable } from 'firebase/storage';
import { storage } from './firebase/firebase';

export interface UploadProgress {
  progress: number;
  message: string;
  isComplete: boolean;
}

/**
 * Generate a placeholder avatar URL using a service like Dicebear or Gravatar
 */
export function generatePlaceholderAvatar(userId: string, displayName: string): string {
  // Clean the display name for URL usage
  const cleanName = encodeURIComponent(displayName.trim() || 'User');
  
  // Use Dicebear API for consistent, beautiful avatars
  // Options: avataaars, big-smile, bottts, identicon, initials, lorelei, micah, miniavs, open-peeps, personas, pixel-art
  const style = 'initials'; // Using initials style for professional look
  
  // Generate consistent seed based on userId
  const seed = userId || Math.random().toString(36).substring(7);
  
  // Additional parameters for customization
  const params = new URLSearchParams({
    seed: seed,
    size: '200',
    backgroundColor: '3B82F6,EF4444,10B981,F59E0B,8B5CF6', // Nice color palette
    textColor: 'ffffff',
    fontSize: '36',
    bold: 'true'
  });
  
  return `https://api.dicebear.com/7.x/${style}/svg?${params.toString()}`;
}

/**
 * Upload profile image to Firebase Storage
 */
export async function uploadProfileImage(
  imageUri: string, 
  userId: string,
  onProgress?: (progress: UploadProgress) => void
): Promise<string> {
  try {
    // Create a unique filename
    const timestamp = Date.now();
    const filename = `profile_images/${userId}/${timestamp}.jpg`;
    const storageRef = ref(storage, filename);
    
    // Convert URI to blob for upload
    const response = await fetch(imageUri);
    const blob = await response.blob();
    
    // Start upload with progress tracking
    const uploadTask = uploadBytesResumable(storageRef, blob);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Progress tracking
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          const progressData: UploadProgress = {
            progress,
            message: `Uploading... ${Math.round(progress)}%`,
            isComplete: false
          };
          
          if (onProgress) {
            onProgress(progressData);
          }
          
          console.log(`Upload progress: ${progress}%`);
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          reject(new Error(`Upload failed: ${error.message}`));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            if (onProgress) {
              onProgress({
                progress: 100,
                message: 'Upload complete!',
                isComplete: true
              });
            }
            
            console.log('✅ Image uploaded successfully:', downloadURL);
            resolve(downloadURL);
          } catch (error: any) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  } catch (error: any) {
    console.error('❌ Upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
}

/**
 * Delete profile image from Firebase Storage
 */
export async function deleteProfileImage(imageUrl: string): Promise<void> {
  try {
    // Check if it's a Firebase Storage URL
    if (!imageUrl.includes('firebase') && !imageUrl.includes('googleapis.com')) {
      console.log('Not a Firebase Storage URL, skipping deletion');
      return;
    }
    
    // Extract the path from the URL
    const url = new URL(imageUrl);
    const path = decodeURIComponent(url.pathname.split('/o/')[1]?.split('?')[0] || '');
    
    if (!path) {
      throw new Error('Could not extract file path from URL');
    }
    
    // Create reference and delete
    const fileRef = ref(storage, path);
    await deleteObject(fileRef);
    
    console.log('✅ Profile image deleted successfully');
  } catch (error: any) {
    console.error('❌ Error deleting profile image:', error);
    // Don't throw error for deletion failures to avoid blocking user operations
    console.warn('Continuing despite deletion error...');
  }
}

/**
 * Compress image before upload (optional helper)
 */
export function compressImage(uri: string, quality: number = 0.8): Promise<string> {
  return new Promise((resolve) => {
    // For now, just return the original URI
    // In a production app, you might want to use a library like expo-image-manipulator
    resolve(uri);
  });
}

/**
 * Validate image file
 */
export function validateImage(uri: string, maxSizeMB: number = 5): { valid: boolean; error?: string } {
  try {
    // Basic validation - in a real app you might want to check file size, type, etc.
    if (!uri) {
      return { valid: false, error: 'No image selected' };
    }
    
    if (!uri.startsWith('file://') && !uri.startsWith('http')) {
      return { valid: false, error: 'Invalid image URI' };
    }
    
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Image validation failed' };
  }
}

/**
 * Get image dimensions (helper function)
 */
export function getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({ width: image.width, height: image.height });
    };
    image.onerror = () => {
      reject(new Error('Failed to load image dimensions'));
    };
    image.src = uri;
  });
}

export default {
  generatePlaceholderAvatar,
  uploadProfileImage,
  deleteProfileImage,
  compressImage,
  validateImage,
  getImageDimensions
};