import { MEME_TEMPLATES, MemeTemplate, TextPosition } from "@/lib/memes";
import { canvasToVideoBlob } from "@/lib/video-converter";

interface RenderedTextBlock {
    lines: string[];
    x: number;
    y: number;
    font: string;
    lineHeight: number;
    color: string;
    stroke: string;
    strokeWidth: number;
    rotation: number;
    anchor: TextPosition['anchor'];
    totalBlockHeight: number;
}

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

    // Load image first
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = template.url;

    await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
    });

    // --- 1. PRE-CALCULATE LAYOUT ---
    // We calculate the layout ONCE to avoid expensive text measurement in the loop.

    // Calculate base image dimensions to fit in reels format
    const imgAspect = template.width / template.height;
    let baseImgWidth = 1080;
    let baseImgHeight = 1080 / imgAspect;

    if (baseImgHeight > 1920) {
        baseImgHeight = 1920;
        baseImgWidth = 1920 * imgAspect;
    }

    const baseImgX = (1080 - baseImgWidth) / 2;
    const baseImgY = (1920 - baseImgHeight) / 2;

    // Prepare text layouts
    const textBlocks: RenderedTextBlock[] = [];

    // Helper to setup context for measurement
    const setupContext = (fontSize: number, style: string) => {
        ctx.font = `900 ${fontSize}px ${style === 'impact' ? 'Impact, Arial Black' : 'Arial, Helvetica'}, sans-serif`;
    };

    texts.forEach((text, i) => {
        if (!text || !template.textData[i]) return;

        const textPos = template.textData[i];

        // Position relative to the IMAGE (0-100%)
        const relX = textPos.x / 100;
        const relY = textPos.y / 100;

        // Font sizing logic
        let fontSize = (textPos.fontSize / 1000) * baseImgWidth * (textPos.style === 'impact' ? 1.5 : 1);
        const maxBlockHeight = baseImgHeight * 0.15;
        const minFontSize = 20;

        let lines: string[] = [];
        let lineHeight = 0;
        let totalBlockHeight = 0;
        let finalFontSize = fontSize;

        // Font scaling loop
        let iterations = 0;
        while (iterations < 10) {
            finalFontSize = fontSize;
            setupContext(finalFontSize, textPos.style || 'label');

            const maxWidth = (textPos.maxWidth ? textPos.maxWidth / 100 : 0.9) * baseImgWidth;
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

            lineHeight = finalFontSize * 1.2;
            totalBlockHeight = lines.length * lineHeight;

            if (totalBlockHeight <= maxBlockHeight || finalFontSize <= minFontSize) {
                break;
            }

            fontSize *= 0.8;
            iterations++;
        }

        // Store the calculated block
        textBlocks.push({
            lines,
            // Store RELATIVE positions to the image top-left
            x: relX,
            y: relY,
            font: `900 ${finalFontSize}px ${textPos.style === 'impact' ? 'Impact, Arial Black' : 'Arial, Helvetica'}, sans-serif`,
            lineHeight,
            color: textPos.color,
            stroke: textPos.stroke,
            strokeWidth: finalFontSize / 15,
            rotation: textPos.rotation || 0,
            anchor: textPos.anchor,
            totalBlockHeight
        });
    });

    // --- 2. RENDER LOOP ---
    // The loop will be called by canvasToVideoBlob

    const renderFrame = (progress: number) => {
        // Clear background
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1080, 1920);

        // --- ANIMATION PARAMETERS ---
        // Subtle slow zoom (Ken Burns)
        // Zoom from 1.0 to 1.15 over 10 seconds
        const zoomBase = 1.0;
        const zoomMax = 0.15;
        const scale = zoomBase + (zoomMax * progress);

        // Center point for zoom (center of the screen)
        const cx = 1080 / 2;
        const cy = 1920 / 2;

        ctx.save();

        // Apply camera zoom to everything
        ctx.translate(cx, cy);
        ctx.scale(scale, scale);
        ctx.translate(-cx, -cy);

        // Draw Image
        ctx.drawImage(img, baseImgX, baseImgY, baseImgWidth, baseImgHeight);

        // Draw Texts
        textBlocks.forEach(block => {
            ctx.save();

            // Calculate actual position based on formatted image rect
            const x = baseImgX + (block.x * baseImgWidth);
            const y = baseImgY + (block.y * baseImgHeight);

            ctx.translate(x, y);
            if (block.rotation) {
                ctx.rotate((block.rotation * Math.PI) / 180);
            }

            // Text Styles
            ctx.font = block.font;
            ctx.fillStyle = block.color;
            ctx.strokeStyle = block.stroke;
            ctx.lineWidth = block.strokeWidth;
            ctx.lineJoin = 'round';
            ctx.miterLimit = 2;

            ctx.textAlign = block.anchor === 'middle' ? 'center' : block.anchor as CanvasTextAlign;

            // Baseline adjustment
            let startYOffset = 0;
            // Since we use middle/center for layout usually, we adjust to center the block
            // But we already pre-calculated positions based on anchors.
            // Wait, existing logic sets textBaseline.
            if (block.anchor === 'top') ctx.textBaseline = 'top';
            else if (block.anchor === 'bottom') ctx.textBaseline = 'bottom';
            else {
                ctx.textBaseline = 'middle';
                // Adjust for multiline vertical centering
                startYOffset = -((block.totalBlockHeight - block.lineHeight) / 2);
            }

            if (block.anchor === 'bottom') {
                startYOffset = -(block.totalBlockHeight - block.lineHeight);
            }

            // Draw each line
            block.lines.forEach((line, lineIndex) => {
                const lineY = startYOffset + (lineIndex * block.lineHeight);

                if (block.stroke !== 'transparent') {
                    ctx.strokeText(line, 0, lineY);
                }
                ctx.fillText(line, 0, lineY);
            });

            ctx.restore();
        });

        ctx.restore();
    };

    // --- 3. EXECUTE RECORDING ---
    const rawVideoBlob = await canvasToVideoBlob(canvas, {
        duration: 10,
        fps: 30,
        format: 'webm',
        onFrame: renderFrame
    });

    return rawVideoBlob;
}
