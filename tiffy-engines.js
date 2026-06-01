/* ==========================================================================
   TIFFY AI REAL MULTI-DEVICE P2P LEDGER ENGINE (UNIVERSAL DECODER)
   ========================================================================== */

window.TiffyEngine = {
  // Uses a reliable standard base payload parser
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
      console.error("Payload extraction failed:", e);
    }
    return null;
  }
};

// STANDARD PIXEL MATRIX SCANNER WRAPPER
window.TiffyTerminalScanner = {
  scanFileAsset: function(imageFile) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
          try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Let the standard library read the physical visual matrix coordinates
            if (window.jsQR) {
              const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = window.jsQR(imgData.data, imgData.width, imgData.height);
              if (code && code.data) {
                const parsed = window.TiffyEngine.extractPayloadFromText(code.data);
                if (parsed) {
                  resolve(parsed);
                  return;
                }
              }
            }
            
            // Fast text-string backup check in case metadata survived browser transfer
            const rawBytes = e.target.result;
            const match = rawBytes.match(/TIFFY_TX:[A-Za-z0-9+/=]+/);
            if (match) {
              const parsed = window.TiffyEngine.extractPayloadFromText(match[0]);
              if (parsed) {
                resolve(parsed);
                return;
              }
            }

            reject("Verification Error: Unable to extract valid transaction data from this visual layout.");
          } catch (err) {
            reject("Matrix processing runtime error across terminal interfaces.");
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(imageFile);
    });
  }
};
