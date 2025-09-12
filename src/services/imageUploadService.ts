import * as ImageManipulator from 'expo-image-manipulator';
import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from './firebase';

export interface UploadProgress {
  progress: number;
  status: 'uploading' | 'processing' | 'complete' | 'error';
  message?: string;
}

// Compress and resize image for optimal storage
export const processImage = async (uri: string): Promise<string> => {
  try {
    const manipulatedImage = await ImageManipulator.manipulateAsync(
      uri,
      [
        { resize: { width: 800, height: 800 } }, // Resize to max 800x800
      ],
      {
        compress: 0.7, // 70% quality
        format: ImageManipulator.SaveFormat.JPEG,
      }
    );
    return manipulatedImage.uri;
  } catch (error) {
    console.error('Error processing image:', error);
    throw new Error('Failed to process image');
  }
};

// Upload image to Firebase Storage with retry mechanism
export const uploadProfileImage = async (
  userId: string,
  imageUri: string,
  onProgress?: (progress: UploadProgress) => void,
  maxRetries: number = 2
): Promise<string> => {
  let retryCount = 0;
  
  while (retryCount <= maxRetries) {
    try {
      console.log(`Upload attempt ${retryCount + 1}/${maxRetries + 1} for user:`, userId);
      console.log('Image URI:', imageUri);
      console.log('Storage instance:', storage);
      
      // Process image first
      onProgress?.({ progress: 10, status: 'processing', message: 'Processing image...' });
      const processedUri = await processImage(imageUri);
      console.log('Image processed successfully:', processedUri);
      
      onProgress?.({ progress: 30, status: 'uploading', message: 'Uploading image...' });
      
      // Convert image to blob
      const response = await fetch(processedUri);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      const blob = await response.blob();
      console.log('Image converted to blob, size:', blob.size, 'type:', blob.type);
      
      onProgress?.({ progress: 50, status: 'uploading', message: 'Uploading to cloud...' });
      
      // Create reference with timestamp to avoid conflicts
      const timestamp = Date.now();
      const filename = `profile_${userId}_${timestamp}.jpg`;
      const imageRef = ref(storage, `profile-pictures/${filename}`);
      console.log('Storage reference created:', imageRef.fullPath);
      
      onProgress?.({ progress: 70, status: 'uploading', message: 'Finalizing upload...' });
      
      // Upload the blob with metadata
      const metadata = {
        contentType: 'image/jpeg',
        customMetadata: {
          'uploaded-by': userId,
          'upload-timestamp': timestamp.toString()
        }
      };
      
      const uploadResult = await uploadBytes(imageRef, blob, metadata);
      console.log('Upload successful:', uploadResult);
      
      onProgress?.({ progress: 90, status: 'uploading', message: 'Getting download URL...' });
      
      // Get the download URL
      const downloadURL = await getDownloadURL(imageRef);
      console.log('Download URL obtained:', downloadURL);
      
      onProgress?.({ progress: 100, status: 'complete', message: 'Upload complete!' });
      
      return downloadURL;
    } catch (error: any) {
      console.error(`Upload attempt ${retryCount + 1} failed:`, {
        error: error,
        message: error.message,
        code: error.code,
        serverResponse: error.serverResponse,
        customData: error.customData
      });
      
      retryCount++;
      
      if (retryCount > maxRetries) {
        onProgress?.({ progress: 0, status: 'error', message: 'Upload failed' });
        
        // Provide more specific error messages
        if (error.code === 'storage/unauthorized') {
          throw new Error('Permission denied. Please check storage rules or contact support.');
        } else if (error.code === 'storage/quota-exceeded') {
          throw new Error('Storage quota exceeded. Please try again later.');
        } else if (error.code === 'storage/unauthenticated') {
          throw new Error('User not authenticated. Please log in again.');
        } else if (error.code === 'storage/retry-limit-exceeded') {
          throw new Error('Upload failed after multiple retries. Please check your connection.');
        } else if (error.code === 'storage/invalid-format') {
          throw new Error('Invalid image format. Please use JPG or PNG.');
        } else if (error.code === 'storage/unknown') {
          throw new Error('Storage service temporarily unavailable. Please check your Firebase project configuration and try again.');
        } else {
          throw new Error(`Upload failed: ${error.message || 'Unknown error'}`);
        }
      } else {
        console.log(`Retrying upload in 1 second... (${retryCount}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        onProgress?.({ progress: 5, status: 'uploading', message: `Retrying... (${retryCount}/${maxRetries})` });
      }
    }
  }
  
  throw new Error('Maximum retry attempts exceeded');
};

// Delete old profile image
export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    if (imageUrl && imageUrl.includes('firebase')) {
      // Extract the path from the URL
      const pathStart = imageUrl.indexOf('/o/') + 3;
      const pathEnd = imageUrl.indexOf('?');
      const encodedPath = imageUrl.substring(pathStart, pathEnd);
      const path = decodeURIComponent(encodedPath);
      
      const imageRef = ref(storage, path);
      await deleteObject(imageRef);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw error here as it's not critical
  }
};

// Generate a placeholder avatar URL with more customization
export const generatePlaceholderAvatar = (userId: string, name?: string): string => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';
  
  // Create a more diverse set of background colors based on userId
  const colors = [
    '4facfe', '00f2fe', '667eea', '764ba2', 'ff9a9e', 'fecfef',
    'ffecd2', 'fcb69f', 'a8edea', 'd299c2', 'fad0c4', 'ffd1ff',
    'c2e9fb', '8fd3f4', 'fdbb2d', '22c1c3', 'f093fb', '53a0fd',
    'cd9cf2', 'de6262', '74b9ff', '6c5ce7', 'fab1a0', 'ff7675'
  ];
  
  // Use userId to generate consistent color selection
  const colorIndex = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  const backgroundColor = colors[colorIndex];
  
  // Determine text color for better contrast
  const textColor = 'ffffff';
  
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=${backgroundColor}&color=${textColor}&size=400&bold=true&font-size=0.6&rounded=true`;
};
