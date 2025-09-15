// Importar dotenv para .env directamente
require('dotenv').config();

const { Client, GatewayIntentBits, AttachmentBuilder } = require('discord.js');
const sharp = require('sharp');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

const BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const IMAGE_WIDTH_SIZE = parseInt(process.env.IMAGE_WIDTH_SIZE, 10);
const IMAGE_HEIGHT_SIZE = parseInt(process.env.IMAGE_HEIGHT_SIZE, 10);
const IMAGE_LEFT_START = parseInt(process.env.IMAGE_LEFT_START, 10);
const IMAGE_TOP_START = parseInt(process.env.IMAGE_TOP_START, 10);
const TEMP_DIR = './temp';

const IMAGE_URLS = JSON.parse(process.env.IMAGE_URLS || "[]");

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages]
});

async function ensureTempDirectory() {
    try {
        await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
        console.error('Error creando directorio temporal:', error);
    }
}

async function downloadImage(url, filename) {
    try {
        const response = await axios({method: 'get',url: url,responseType: 'arraybuffer'});
        const filepath = path.join(TEMP_DIR, filename);
        await fs.writeFile(filepath, response.data);
        return filepath;
    } catch (error) {
        console.error(`Error descargando imagen ${url}:`, error.message);
        throw error;
    }
}

async function downloadAllImages() {
    const downloadPromises = IMAGE_URLS.map((url, index) => downloadImage(url, `image_${index}.png`));
    try {
        const imagePaths = await Promise.all(downloadPromises);
        console.log('Todas las imágenes descargadas exitosamente');
        return imagePaths;
    } catch (error) {
        console.error('Error descargando una o más imágenes:', error);
        throw error;
    }
}

async function getImageSize(imagePath) {
    try {
        const metadata = await sharp(imagePath).metadata();
        return {width: metadata.width, height: metadata.height};
    } catch (error) {
        console.error('Error obteniendo tamaño de imagen:', error);
        throw error;
    }
}

async function createImageGrid(imagePaths) {
    try {
        const firstImageSize = await getImageSize(imagePaths[0]);
        const {width: imgWidth, height: imgHeight} = firstImageSize;
        const gridWidth = imgWidth * 2;
        const gridHeight = imgHeight * 2;
        const imageBuffers = await Promise.all(imagePaths.map(async (imagePath) => {
            const buffer = await fs.readFile(imagePath);
            return await sharp(buffer).resize(imgWidth, imgHeight).toBuffer();
        }));
        const gridBuffer = await sharp({create: {width: gridWidth,height: gridHeight,channels: 4,background: {r: 255,g: 255,b: 255,alpha: 1}}})
            .composite([
                {input: imageBuffers[0], top: 0, left: 0},
                {input: imageBuffers[1], top: 0, left: imgWidth},
                {input: imageBuffers[2], top: imgHeight, left: 0},
                {input: imageBuffers[3], top: imgHeight, left: imgWidth}
            ])
            .png()
            .toBuffer();
        return gridBuffer;
    } catch (error) {
        console.error('Error creando el grid de imágenes:', error);
        throw error;
    }
}

async function cropImage(imageBuffer) {
    try {
        const croppedBuffer = await sharp(imageBuffer).extract({left: IMAGE_LEFT_START, top: IMAGE_TOP_START, width: IMAGE_WIDTH_SIZE, height: IMAGE_HEIGHT_SIZE}).png().toBuffer();
        return croppedBuffer;
    } catch (error) {
        console.error('Error recortando imagen:', error);
        throw error;
    }
}

async function processAndSendImage() {
    try {
        console.log('\n=== Iniciando proceso de descarga y procesamiento de imágenes ===');
        await ensureTempDirectory();
        const imagePaths = await downloadAllImages();
        const gridBuffer = await createImageGrid(imagePaths);
        const croppedBuffer = await cropImage(gridBuffer);
        const finalImagePath = path.join(TEMP_DIR, `final_image_${Date.now()}.png`);
        await fs.writeFile(finalImagePath, croppedBuffer);
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            throw new Error('Canal no encontrado o no es un canal de texto');
        }
        const attachment = new AttachmentBuilder(croppedBuffer, {name: `combined_image_${Date.now()}.png`});
        await channel.send({files: [attachment], content: `🖼️ Captura Forocochera - ${new Date().toLocaleString()}`});
        console.log('¡Imagen enviada exitosamente a Discord!');
        await cleanupTempFiles([...imagePaths, finalImagePath]);
    } catch (error) {
        console.error('Error en el proceso principal:', error);
        try {
            const files = await fs.readdir(TEMP_DIR);
            const filePaths = files.map(file => path.join(TEMP_DIR, file));
            await cleanupTempFiles(filePaths);
        } catch (cleanupError) {
            console.error('Error limpiando archivos temporales:', cleanupError);
        }
    }
}

async function cleanupTempFiles(filePaths) {
    try {
        await Promise.all(filePaths.map(async (filePath) => {
            try {
                await fs.unlink(filePath);
                console.log(`Archivo temporal eliminado: ${filePath}`);
            } catch (error) {
                console.warn(`No se pudo eliminar archivo: ${filePath}`, error.message);
            }
        }));
    } catch (error) {
        console.error('Error durante la limpieza de archivos:', error);
    }
}

client.once('ready', () => {
    console.log(`🤖 Bot conectado como ${client.user.tag}`);
    console.log(`📅 Bot iniciado el ${new Date().toLocaleString()}`);
    console.log('⏰ Ejecución automática cada 30 minutos usando setInterval');

    // Ejecutar inmediatamente la primera vez
    processAndSendImage();

    // Configurar intervalo cada 30 minutos
    setInterval(processAndSendImage, 15 * 60 * 1000); // 30 minutos en ms
});

client.on('messageCreate', async (message) => {
    if (message.content === '!test-images' && !message.author.bot) {
        await message.reply('🔄 Procesando imágenes manualmente...');
        await processAndSendImage();
    }
});

client.on('error', (error) => {
    console.error('Error del cliente Discord:', error);
});

process.on('unhandledRejection', (error) => {
    console.error('Promesa rechazada no manejada:', error);
});

process.on('uncaughtException', (error) => {
    console.error('Excepción no capturada:', error);
    process.exit(1);
});

if (!BOT_TOKEN) {
    console.error('❌ Error: DISCORD_BOT_TOKEN no está definido en variables de entorno');
    process.exit(1);
}

client.login(BOT_TOKEN).catch(error => {
    console.error('Error al iniciar sesión:', error);
    process.exit(1);
})