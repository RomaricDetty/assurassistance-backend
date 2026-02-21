const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Configuration du stockage multer en mémoire
 * Les fichiers sont stockés en mémoire pour conversion en base64
 */
const storage = multer.memoryStorage();

/**
 * Filtre pour accepter uniquement les images
 */
const fileFilter = (req, file, cb) => {
    // Types MIME acceptés
    const allowedMimes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml'
    ];

    if (allowedMimes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Type de fichier non autorisé. Formats acceptés : JPEG, PNG, GIF, WEBP, SVG'), false);
    }
};

/**
 * Configuration multer pour l'upload de fichiers
 */
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB max par fichier
    }
});

/**
 * Middleware pour uploader l'image principale
 */
const uploadMainImage = upload.single('imagePrincipale');

/**
 * Middleware pour uploader plusieurs images
 */
const uploadMultipleImages = upload.array('images', 10); // Max 10 images

/**
 * Middleware pour uploader l'image principale ET plusieurs images
 */
const uploadProductImages = upload.fields([
    { name: 'imagePrincipale', maxCount: 1 },
    { name: 'images', maxCount: 10 }
]);

module.exports = {
    uploadMainImage,
    uploadMultipleImages,
    uploadProductImages,
    upload
};
