/**
 * Image compression utility to make high-resolution uploads extremely lightweight
 * and fits easily within browser's 5MB localStorage limits.
 */
export function compressImage(file: File, maxWidth = 900, maxHeight = 900, quality = 0.65): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it is not an image (e.g., application/pdf), read as default data URL
    if (!file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Smart proportional scale calculation
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }

        // Draw image in correct proportion
        ctx.drawImage(img, 0, 0, width, height);
        
        // Export to a compressed JPEG
        try {
          const dataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(dataUrl);
        } catch (e) {
          // Canvas export failure fallback to original base64
          resolve(event.target?.result as string);
        }
      };
      
      img.onerror = () => {
        resolve(event.target?.result as string);
      };
      
      img.src = event.target?.result as string;
    };
    
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

/**
 * Safely saves data to browser's localStorage.
 * Detects if the storage is full (QuotaExceededError) and automatically strips heavy base64
 * cache payloads to prevent the app from freezing or presenting blocker alerts.
 */
export function safeSetLocalStorage(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.error('LocalStorage write error caught:', error);
    
    // Check if error is related to quota exceeded
    const isQuotaExceeded = 
      error.name === 'QuotaExceededError' || 
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED' || 
      error.code === 22 || 
      error.code === 1014;

    if (isQuotaExceeded) {
      // Self-healing recovery mechanism for local database caches
      if (key === 'archive-records') {
        try {
          const items = JSON.parse(value);
          if (Array.isArray(items)) {
            // Evict large base64 image strings from the cache to shrink space usage significantly
            const cleanedItems = items.map(item => {
              if (item.imageUrl && item.imageUrl.startsWith('data:') && item.imageUrl.length > 30000) {
                return { ...item, imageUrl: 'placeholder-base64-cache-evicted' };
              }
              return item;
            });
            
            // Attempt to write the clean, lightweight text and metadata payload
            localStorage.setItem(key, JSON.stringify(cleanedItems));
            console.warn('[LocalStorage] QuotaExceededError successfully recovered by stripping large offline cache base64 image strings.');
            return true;
          }
        } catch (e) {
          console.error('[LocalStorage] Failed to run self-cleaning eviction for records cache:', e);
        }
      }
      
      // Secondary fallback - notify the console but prevent crashing
      console.warn('⚠️ LocalStorage full. Cached images evicted to maintain application integrity.');
    } else {
      console.error('⚠️ Unknown LocalStorage write failure:', error.message || error);
    }
    return false;
  }
}
