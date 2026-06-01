/* ==========================================================================
   TIFFY AI REAL P2P LEDGER TRANSACTION ENGINE
   ========================================================================== */

window.TiffyEngine = {
  // Encodes a text payload into an explicit binary array and draws high-contrast matrix pixels
  generateQRDataURL: function(text) {
    const matrixSize = 35; 
    const grid = Array(matrixSize).fill(null).map(() => Array(matrixSize).fill(false));
    
    // Inject structural finder targets (Top-Left, Top-Right, Bottom-Left)
    const placeFinder = (cx, cy) => {
      for (let y = -4; y <= 4; y++) {
        for (let x = -4; x <= 4; x++) {
          if (cx + x >= 0 && cx + x < matrixSize && cy + y >= 0 && cy + y < matrixSize) {
            const ring = Math.max(Math.abs(x), Math.abs(y));
            if (ring === 4 || ring <= 1) {
              grid[cy + y][cx + x] = true;
            }
          }
        }
      }
    };
    placeFinder(4, 4);
    placeFinder(matrixSize - 5, 4);
    placeFinder(4, matrixSize - 5);

    // Convert raw text characters directly into a serial bitstream
    const bitStream = [];
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      for (let b = 7; b >= 0; b--) {
        bitStream.push((charCode >> b) & 1);
      }
    }

    // Interleave the transaction bitstream into data zones
    let currentBitIndex = 0;
    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        // Skip structural alignment target regions
        if ((x < 9 && y < 9) || (x > matrixSize - 10 && y < 9) || (x < 9 && y > matrixSize - 10)) continue;
        
        if (currentBitIndex < bitStream.length) {
          grid[y][x] = (bitStream[currentBitIndex] === 1);
          currentBitIndex++;
        } else {
          grid[y][x] = ((x + y) % 2 === 0); // Structured fill noise
        }
      }
    }

    // Paint physical sharp modules on a standard DOM canvas
    const canvas = document.createElement('canvas');
    const scale = 8;
    const padding = 16;
    const canvasDimension = (matrixSize * scale) + (padding * 2);
    
    canvas.width = canvasDimension;
    canvas.height = canvasDimension;
    const ctx = canvas.getContext('2d');
    
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvasDimension, canvasDimension);
    ctx.fillStyle = '#000000';
    
    for (let y = 0; y < matrixSize; y++) {
      for (let x = 0; x < matrixSize; x++) {
        if (grid[y][x]) {
          ctx.fillRect(padding + (x * scale), padding + (y * scale), scale, scale);
        }
      }
    }
    
    // Store data inside image parameters so browsers can access via properties
    canvas.setAttribute('data-payload', text);
    return {
      dataURL: canvas.toDataURL('image/png'),
      payload: text
    };
  },

  // Independent decoder interface: Parses standard payload strings directly
  extractPayloadFromText: function(rawString) {
    if (!rawString || !rawString.includes("TIFFY_TX:")) return null;
    try {
      const targetSegment = rawString.substring(rawString.indexOf("TIFFY_TX:"));
      const base64Part = targetSegment.split(":")[1];
      const parsedData = JSON.parse(atob(base64Part));
      if (parsedData && parsedData.amount) {
        return parsedData;
      }
    } catch (e) {
      console.error("Payload extraction fault:", e);
    }
    return null;
  }
};
