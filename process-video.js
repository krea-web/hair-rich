const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

ffmpeg.setFfmpegPath(ffmpegStatic);

const inputVideo = path.join(__dirname, 'video-hero.mp4');
const outDir = path.join(__dirname, 'public', 'hero-seq');
const fps = 24; // target FPS

if (fs.existsSync(outDir)) {
    fs.rmSync(outDir, { recursive: true, force: true });
}
fs.mkdirSync(outDir, { recursive: true });

console.log('Extracting frames from video-hero.mp4...');

ffmpeg(inputVideo)
    .outputOptions([
        `-vf fps=${fps},crop=iw*0.85:ih*0.75:iw*0.075:ih*0.2,scale=-1:800`, // Cropping 25% from bottom and 15% horizontally to aggressively remove watermark
        '-qscale:v 2' // high quality
    ])
    .on('end', async () => {
        console.log('Extraction complete. Now intelligently trimming leading black/empty frames...');
        await trimEmptyFrames();
    })
    .on('error', (err) => {
        console.error('An error occurred: ' + err.message);
    })
    .save(path.join(outDir, 'frame_%04d.jpg'));


async function trimEmptyFrames() {
    const files = fs.readdirSync(outDir)
        .filter(f => f.endsWith('.jpg'))
        .sort();

    let firstActionFrameIndex = -1;

    for (let i = 0; i < files.length; i++) {
        const file = path.join(outDir, files[i]);
        // Use sharp to get average brightness of center region
        const { dominant } = await sharp(file).stats();
        // dominant.r,g,b gives most common color, 
        // or we can use sharp's raw pixel data to check luminance.
        const buffer = await sharp(file).resize(50, 50).raw().toBuffer();

        let totalLuminance = 0;
        for (let j = 0; j < buffer.length; j += 3) {
            const r = buffer[j];
            const g = buffer[j + 1];
            const b = buffer[j + 2];
            const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
            totalLuminance += lum;
        }
        const avgLum = totalLuminance / (50 * 50);

        // If average luminance is greater than a very dark threshold (e.g., 5)
        if (avgLum > 3) {
            firstActionFrameIndex = i;
            break;
        }
    }

    if (firstActionFrameIndex > 0) {
        console.log(`Action starts at frame ${firstActionFrameIndex}. Deleting earlier frames...`);
        for (let i = 0; i < firstActionFrameIndex; i++) {
            fs.unlinkSync(path.join(outDir, files[i]));
        }
    } else if (firstActionFrameIndex === -1) {
        console.log(`Warning: all frames seem dark. Not deleting any.`);
    } else {
        console.log(`Action starts at frame 0. No trimming needed.`);
    }

    // Rename remaining files to start from 1 sequentially
    const remainingFiles = fs.readdirSync(outDir)
        .filter(f => f.endsWith('.jpg'))
        .sort();

    console.log(`Converting ${remainingFiles.length} optimized frames to WEBP with transparency...`);

    // We will convert them to webp and apply chroma-key if needed,
    // BUT Wait: The user said "rendilo in trasparenza". If the video has a black background, 
    // We can just use the images natively in the canvas and apply mix-blend-mode: screen or lighten!
    // OR we can make it transparent through Canvas in React directly.
    // We will just rename them sequentially to webp to save huge amount of space.
    for (let i = 0; i < remainingFiles.length; i++) {
        const oldPath = path.join(outDir, remainingFiles[i]);
        const newIndex = String(i + 1).padStart(3, '0');
        const newPath = path.join(outDir, `frame_${newIndex}.webp`);

        // convert to webp
        await sharp(oldPath).webp({ quality: 80 }).toFile(newPath);
        fs.unlinkSync(oldPath); // delete old jpg
    }

    console.log(`Done! Extracted ${remainingFiles.length} final WebP frames.`);
}
