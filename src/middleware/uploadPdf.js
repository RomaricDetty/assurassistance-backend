const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const contratsDir = path.join(process.cwd(), 'uploads', 'contrats');

/**
 * Crée le dossier de stockage des PDF de contrats s'il n'existe pas.
 */
const ensureContratsDir = () => {
    if (!fs.existsSync(contratsDir)) {
        fs.mkdirSync(contratsDir, { recursive: true });
    }
};

/**
 * Filtre multer pour n'accepter que les fichiers PDF.
 */
const pdfFileFilter = (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
        cb(null, true);
        return;
    }
    cb(new Error('Seuls les fichiers PDF sont autorisés'), false);
};

/**
 * Stockage disque des PDF de contrats.
 */
const pdfStorage = multer.diskStorage({
    destination: (req, file, cb) => {
        ensureContratsDir();
        cb(null, contratsDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname) || '.pdf';
        cb(null, `${uuidv4()}${ext}`);
    }
});

const uploadPdf = multer({
    storage: pdfStorage,
    fileFilter: pdfFileFilter,
    limits: { fileSize: 20 * 1024 * 1024 }
});

/**
 * Middleware pour uploader un PDF de contrat (champ "pdf").
 */
const uploadContratPdf = uploadPdf.single('pdf');

module.exports = {
    uploadContratPdf,
    contratsDir
};
