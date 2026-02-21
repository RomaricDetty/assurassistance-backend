/**
 * Utilitaire pour gérer les images des produits
 * Supporte à la fois le format base64, les fichiers uploadés et les chemins de fichiers
 */
class ImageHandler {
    /**
     * Vérifie si une chaîne est une image base64
     * @param {string} imageData - Données de l'image à vérifier
     * @returns {boolean} - True si c'est du base64
     */
    static isBase64(imageData) {
        if (!imageData || typeof imageData !== 'string') return false;
        // Vérifie si c'est une chaîne base64 (commence par data:image/)
        return imageData.startsWith('data:image/');
    }

    /**
     * Vérifie si une chaîne est un chemin de fichier (URL relative)
     * @param {string} imageData - Données de l'image à vérifier
     * @returns {boolean} - True si c'est un chemin de fichier
     */
    static isFilePath(imageData) {
        if (!imageData || typeof imageData !== 'string') return false;
        // Vérifie si c'est un chemin de fichier (commence par /uploads/ ou ne contient pas data:)
        return imageData.startsWith('/uploads/') || (!imageData.startsWith('data:') && !imageData.startsWith('http'));
    }

    /**
     * Convertit un fichier Buffer en base64
     * @param {Buffer} fileBuffer - Buffer du fichier
     * @param {string} mimeType - Type MIME du fichier (ex: 'image/jpeg')
     * @returns {string} - Chaîne base64 avec préfixe
     */
    static fileToBase64(fileBuffer, mimeType) {
        if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
            throw new Error('Le fichier doit être un Buffer valide');
        }

        // Normaliser le type MIME
        const normalizedMimeType = this.normalizeMimeType(mimeType);
        
        // Convertir le buffer en base64
        const base64String = fileBuffer.toString('base64');
        
        // Retourner avec le préfixe data:image/[type];base64,[data]
        return `data:${normalizedMimeType};base64,${base64String}`;
    }

    /**
     * Normalise le type MIME pour les images
     * @param {string} mimeType - Type MIME original
     * @returns {string} - Type MIME normalisé
     */
    static normalizeMimeType(mimeType) {
        if (!mimeType) return 'image/jpeg';
        
        // Mapping des types MIME
        const mimeTypeMap = {
            'image/jpeg': 'image/jpeg',
            'image/jpg': 'image/jpeg',
            'image/png': 'image/png',
            'image/gif': 'image/gif',
            'image/webp': 'image/webp',
            'image/svg+xml': 'image/svg+xml'
        };

        return mimeTypeMap[mimeType.toLowerCase()] || 'image/jpeg';
    }

    /**
     * Traite une image principale (fichier uploadé, base64 ou chemin de fichier)
     * @param {string|Buffer} imageData - Image principale (base64, chemin ou fichier)
     * @param {string} mimeType - Type MIME (si c'est un fichier)
     * @returns {string|null} - Image principale formatée pour stockage en base64
     */
    static processMainImage(imageData, mimeType = null) {
        if (!imageData) return null;
        
        // Si c'est un Buffer (fichier uploadé), convertir en base64
        if (Buffer.isBuffer(imageData)) {
            return this.fileToBase64(imageData, mimeType);
        }
        
        // Si c'est du base64, on le garde tel quel
        if (typeof imageData === 'string' && this.isBase64(imageData)) {
            return imageData;
        }
        
        // Si c'est un chemin de fichier, on le garde tel quel (pour compatibilité)
        if (typeof imageData === 'string' && this.isFilePath(imageData)) {
            return imageData;
        }
        
        // Sinon, on retourne la valeur telle quelle (peut être une URL externe)
        return imageData;
    }

    /**
     * Traite un tableau d'images (fichiers uploadés, base64 ou chemins de fichiers)
     * @param {Array} imagesArray - Tableau d'images (base64, chemins ou fichiers)
     * @returns {Array} - Tableau d'images formatées pour stockage
     */
    static processImagesArray(imagesArray) {
        if (!imagesArray || !Array.isArray(imagesArray)) return [];
        
        return imagesArray.map(image => {
            if (!image) return image;
            
            // Si c'est un Buffer (fichier uploadé), convertir en base64
            if (Buffer.isBuffer(image)) {
                return this.fileToBase64(image, image.mimetype || 'image/jpeg');
            }
            
            // Si c'est un objet avec buffer et mimetype (format multer)
            if (image.buffer && Buffer.isBuffer(image.buffer)) {
                return this.fileToBase64(image.buffer, image.mimetype || 'image/jpeg');
            }
            
            // Si c'est une chaîne base64, on la garde tel quel
            if (typeof image === 'string' && this.isBase64(image)) {
                return image;
            }
            
            // Si c'est un chemin de fichier, on le garde tel quel
            if (typeof image === 'string' && this.isFilePath(image)) {
                return image;
            }
            
            // Sinon, on retourne la valeur telle quelle
            return image;
        });
    }

    /**
     * Valide le format d'une image base64
     * @param {string} base64String - Chaîne base64 à valider
     * @returns {boolean} - True si le format est valide
     */
    static validateBase64(base64String) {
        if (!base64String || typeof base64String !== 'string') return false;
        
        // Format attendu: data:image/[type];base64,[data]
        const base64Regex = /^data:image\/(jpeg|jpg|png|gif|webp|svg\+xml);base64,/i;
        return base64Regex.test(base64String);
    }

    /**
     * Obtient le type MIME d'une image base64
     * @param {string} base64String - Chaîne base64
     * @returns {string|null} - Type MIME ou null
     */
    static getBase64MimeType(base64String) {
        if (!this.isBase64(base64String)) return null;
        const match = base64String.match(/^data:image\/([^;]+);base64,/);
        return match ? match[1] : null;
    }
}

module.exports = ImageHandler;
