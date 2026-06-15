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
 * Detects if the storage is full (QuotaExceededError) and presents a user-friendly modal alert
 * instead of crashing the site into a white screen.
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
      alert(
        '⚠️ 브라우저 저장공간(로컬 스토리지) 용량이 초과되었습니다!\n\n' +
        '해결 방법:\n' +
        '1. 더 높은 압축률이나 해상도가 조금 낮은(작은 용량의) 이미지로 변경해 주세요.\n' +
        '2. 불필요하게 많이 업로드된 고용량 아카이브 기록 카드를 삭제해 주세요.'
      );
    } else {
      alert('⚠️ 데이터를 로컬 브라우저에 저장하지 못했습니다: ' + (error.message || '알 수 없는 오류'));
    }
    return false;
  }
}
