const fs = require('fs');
const path = require('path');
const { Administrateur, TypeContrat } = require('../models');

const DEFAULT_TYPES_CONTRAT = [
    { code: 'Business', libelle: 'Business', ordre: 1 },
    { code: 'Platinum', libelle: 'Platinum', ordre: 2 },
    { code: 'Premier', libelle: 'Premier', ordre: 3 }
];

/**
 * Copie les PDF de contrats sources vers uploads/contrats.
 * @returns {{ pdfPath: string, pdfFileName: string } | null}
 */
const copyContratPdf = (code, sourceDir, destDir) => {
    const pdfFileName = `${code}.pdf`;
    const sourcePath = path.join(sourceDir, pdfFileName);
    if (!fs.existsSync(sourcePath)) {
        return null;
    }
    const destPath = path.join(destDir, pdfFileName);
    fs.copyFileSync(sourcePath, destPath);
    return {
        pdfPath: `/uploads/contrats/${pdfFileName}`,
        pdfFileName
    };
};

/**
 * Crée ou met à jour les types de contrat par défaut avec leurs PDF.
 */
const seedTypesContrat = async () => {
    const contratsDir = path.join(process.cwd(), 'uploads', 'contrats');
    if (!fs.existsSync(contratsDir)) {
        fs.mkdirSync(contratsDir, { recursive: true });
    }

    const sourceDir = process.env.CONTRATS_SOURCE_DIR
        || path.resolve(__dirname, '../../../assurassistance/public/contrats');

    for (const typeData of DEFAULT_TYPES_CONTRAT) {
        const pdfInfo = copyContratPdf(typeData.code, sourceDir, contratsDir);
        const defaults = {
            ...typeData,
            isActive: true,
            pdfPath: pdfInfo?.pdfPath || null,
            pdfFileName: pdfInfo?.pdfFileName || null
        };

        const [typeContrat, created] = await TypeContrat.findOrCreate({
            where: { code: typeData.code },
            defaults
        });

        if (!created) {
            typeContrat.libelle = typeData.libelle;
            typeContrat.ordre = typeData.ordre;
            typeContrat.isActive = true;
            if (pdfInfo) {
                typeContrat.pdfPath = pdfInfo.pdfPath;
                typeContrat.pdfFileName = pdfInfo.pdfFileName;
            }
            await typeContrat.save();
        }

        const pdfStatus = pdfInfo ? `PDF: ${pdfInfo.pdfPath}` : 'PDF non trouvé';
        console.log(`${created ? 'Type de contrat créé' : 'Type de contrat mis à jour'}: ${typeData.code} (${pdfStatus})`);
    }
};

/**
 * Script pour peupler la base de données avec des données initiales
 */
const seedDatabase = async () => {
    try {
        console.log('Démarrage du seeding...');

        await seedTypesContrat();

        const administrateurs = [
            {
                login: 'assurassistance_user',
                password: 'M@nagement_123',
                nom: 'Assur',
                prenom: 'Assistance',
                email: 'assurassistanceyao@gmail.com',
                isActive: true
            },
            {
                login: 'romdja',
                password: 'Secure@1234',
                nom: 'Detty',
                prenom: 'Romaric',
                email: 'romaricdetty@gmail.com',
                isActive: true
            },
            {
                login: 'angem',
                password: 'Secure@1234',
                nom: 'Ange-Emmanuel',
                prenom: 'ATTOUMBRE',
                email: 'angemattoumbre@gmail.com',
                isActive: true
            }
        ];

        for (const administrateurData of administrateurs) {
            try {
                const [, created] = await Administrateur.findOrCreate({
                    where: { login: administrateurData.login },
                    defaults: administrateurData
                });
                if (created) {
                    console.log(`Administrateur créé: ${administrateurData.login}`);
                } else {
                    console.log(`Administrateur déjà existant: ${administrateurData.login}`);
                }
            } catch (error) {
                console.error(`Erreur lors de la création de l'administrateur ${administrateurData.login}:`, error.message);
            }
        }

        console.log('\nSeeding terminé avec succès !');
        if (require.main === module) {
            process.exit(0);
        }
    } catch (error) {
        console.error('Erreur lors du seeding:', error);
        if (require.main === module) {
            process.exit(1);
        } else {
            throw error;
        }
    }
};

module.exports = seedDatabase;

if (require.main === module) {
    seedDatabase();
}
