import { MEME_TEMPLATES } from "@/lib/memes";
import { canvasToVideoBlob } from "@/lib/video-converter";

export async function renderMemeToVideoBlob(
    templateId: string,
    texts: string[]
): Promise<Blob | null> {
    const template = MEME_TEMPLATES.find(t => t.id === templateId);
    if (!template) {
        console.error("Template not found");
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1920; // Reels format
    const ctx = canvas.getContext('2d');

    if (!ctx) {
        console.error("Failed to get canvas context");
        return null;
    }

    // Draw meme on canvas with proper text rendering
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = template.url;

    await new Promise((resolve, reject) => {
        img.onload = () => {
            // Fill background
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 1080, 1920);

            // Calculate image dimensions to fit in reels format
            const imgAspect = template.width / template.height;
            let imgWidth = 1080;
            let imgHeight = 1080 / imgAspect;

            // If image is taller than space, fit by height (rare for memes, usually fit width)
            if (imgHeight > 1920) {
                imgHeight = 1920;
                imgWidth = 1920 * imgAspect;
            }

            const imgX = (1080 - imgWidth) / 2;
            const imgY = (1920 - imgHeight) / 2;

            ctx.drawImage(img, imgX, imgY, imgWidth, imgHeight);

            // Draw text overlays using template coordinates
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            texts.forEach((text, i) => {
                // Safety check for missing text or template data
                if (!text || !template.textData[i]) return;

                const textPos = template.textData[i];

                // Calculate precise position relative to the image on canvas
                const x = imgX + (textPos.x / 100) * imgWidth;
                const y = imgY + (textPos.y / 100) * imgHeight;

                // Font size calculation relative to image width on canvas
                let fontSize = (textPos.fontSize / 1000) * imgWidth * (textPos.style === 'impact' ? 1.5 : 1);
                let lines: string[] = [];
                let lineHeight = 0;
                let totalBlockHeight = 0;

                // Dynamic Font Scaling Loop
                // Reduce font size until text fits reasonably within height constraints
                const maxBlockHeight = imgHeight * 0.15; // Limit each text block to 15% of image height (Aggressive)
                const minFontSize = 20; // Minimum readable font size

                let iterations = 0;
                while (iterations < 10) {
                    ctx.font = `900 ${fontSize}px ${textPos.style === 'impact' ? 'Impact, Arial Black' : 'Arial, Helvetica'}, sans-serif`;
                    const maxWidth = (textPos.maxWidth ? textPos.maxWidth / 100 : 0.9) * imgWidth;

                    const words = (textPos.allCaps !== false ? text.toUpperCase() : text).split(' ');
                    lines = [];
                    let currentLine = words[0];

                    for (let j = 1; j < words.length; j++) {
                        const testLine = currentLine + ' ' + words[j];
                        const metrics = ctx.measureText(testLine);
                        if (metrics.width > maxWidth) {
                            lines.push(currentLine);
                            currentLine = words[j];
                        } else {
                            currentLine = testLine;
                        }
                    }
                    lines.push(currentLine);

                    lineHeight = fontSize * 1.2;
                    totalBlockHeight = lines.length * lineHeight;

                    // Check if fits
                    if (totalBlockHeight <= maxBlockHeight || fontSize <= minFontSize) {
                        break;
                    }

                    // Reduce and retry
                    // Reduce and retry AGGRESSIVELY
                    fontSize *= 0.8;
                    iterations++;
                }

                ctx.textAlign = textPos.anchor === 'middle' ? 'center' : textPos.anchor as CanvasTextAlign;
                if (textPos.anchor === 'top') ctx.textBaseline = 'top';
                else if (textPos.anchor === 'bottom') ctx.textBaseline = 'bottom';
                else ctx.textBaseline = 'middle';

                // Colors
                ctx.fillStyle = textPos.color;
                ctx.strokeStyle = textPos.stroke;
                ctx.lineWidth = fontSize / 15; // Proportional stroke
                ctx.lineJoin = 'round';
                ctx.miterLimit = 2;

                // Transform for rotation if needed
                ctx.save();
                ctx.translate(x, y);
                if (textPos.rotation) {
                    ctx.rotate((textPos.rotation * Math.PI) / 180);
                }

                // Adjust start Y based on anchor for multi-line block center adjustment if needed
                let startYOffset = 0;
                if (ctx.textBaseline === 'middle') {
                    startYOffset = -((totalBlockHeight - lineHeight) / 2);
                } else if (ctx.textBaseline === 'bottom') {
                    startYOffset = -(totalBlockHeight - lineHeight);
                }

                lines.forEach((line, lineIndex) => {
                    const lineY = startYOffset + (lineIndex * lineHeight);

                    // Draw stroke first
                    if (textPos.stroke !== 'transparent') {
                        ctx.strokeText(line, 0, lineY);
                    }
                    // Then fill
                    ctx.fillText(line, 0, lineY);
                });

                ctx.restore();
            });

            resolve(null);
        };
        img.onerror = reject;
    });

    // Convert to video - WebM format (browsers don't support MP4 encoding)
    const rawVideoBlob = await canvasToVideoBlob(canvas, {
        duration: 10, // Increased to 10s as requested
        fps: 30,
        format: 'webm'
    });

    return rawVideoBlob;
}
