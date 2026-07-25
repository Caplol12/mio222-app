export async function extractDominantColor(imageUrl: string): Promise<{ primary: string, board: string } | null> {
  return new Promise((resolve) => {
    const img = new Image();
    // Only set crossOrigin for remote URLs — data: URLs don't need it,
    // and crossOrigin can silently break data: URLs in some browsers.
    if (!imageUrl.startsWith('data:')) {
      img.crossOrigin = "Anonymous";
    }
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      // Resize for performance — keep enough detail to detect dominant colors
      const MAX_DIM = 256;
      let width = img.width;
      let height = img.height;
      if (width > MAX_DIM || height > MAX_DIM) {
        if (width > height) {
          height = Math.floor((height / width) * MAX_DIM);
          width = MAX_DIM;
        } else {
          width = Math.floor((width / height) * MAX_DIM);
          height = MAX_DIM;
        }
      }

      canvas.width = width;
      canvas.height = height;
      let imageData;
      try {
        ctx.drawImage(img, 0, 0, width, height);
        imageData = ctx.getImageData(0, 0, width, height).data;
      } catch (e) {
        console.warn("[colorExtractor] canvas tainted (CORS); falling back", e);
        resolve(null);
        return;
      }
      
      const colorCounts: Record<string, number> = {};
      let maxCount = 0;
      let dominantRGB = [0, 0, 0];

      // Sample every 4th pixel for speed (16 bytes)
      for (let i = 0; i < imageData.length; i += 16) {
        const r = imageData[i];
        const g = imageData[i + 1];
        const b = imageData[i + 2];
        const a = imageData[i + 3];

        if (a < 128) continue; // Skip transparent
        
        // Skip only the extremes to keep mid tones
        const sum = r + g + b;
        if (sum > 740 || sum < 30) continue; 
        
        // Skip mostly-grayscale pixels
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        if (max - min < 15) continue;

        // Quantize colors by 16 to group similar ones
        const rQ = Math.round(r / 16) * 16;
        const gQ = Math.round(g / 16) * 16;
        const bQ = Math.round(b / 16) * 16;
        
        const key = `${rQ},${gQ},${bQ}`;
        colorCounts[key] = (colorCounts[key] || 0) + 1;

        if (colorCounts[key] > maxCount) {
          maxCount = colorCounts[key];
          dominantRGB = [rQ, gQ, bQ];
        }
      }
      
      // Fallback if no vibrant color found
      if (maxCount === 0) {
        let rTotal = 0, gTotal = 0, bTotal = 0, count = 0;
        for (let i = 0; i < imageData.length; i += 16) {
           rTotal += imageData[i];
           gTotal += imageData[i+1];
           bTotal += imageData[i+2];
           count++;
        }
        if (count > 0) {
           dominantRGB = [Math.floor(rTotal/count), Math.floor(gTotal/count), Math.floor(bTotal/count)];
        }
      }

      // Convert dominant to HEX for primary
      const toHex = (c: number) => {
        const hex = c.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      };
      const primaryHex = `#${toHex(dominantRGB[0])}${toHex(dominantRGB[1])}${toHex(dominantRGB[2])}`;
      
      const darkRGB = [
        Math.floor(dominantRGB[0] * 0.15),
        Math.floor(dominantRGB[1] * 0.15),
        Math.floor(dominantRGB[2] * 0.15)
      ];
      const boardHex = `#${toHex(darkRGB[0])}${toHex(darkRGB[1])}${toHex(darkRGB[2])}`;

      resolve({ primary: primaryHex, board: boardHex });
    };

    img.onerror = () => {
      console.warn("[colorExtractor] Failed to load image for color extraction:", imageUrl.substring(0, 120));
      resolve(null);
    };
    img.src = imageUrl;
  });
}
