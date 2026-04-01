const { Administrateur, GroupeAdmin } = require('../models');
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');
const { getEffectiveInterfaceLinks, normalizeInterfaceLinks } = require('../constants/interfaceLinks');

/**
 * Controller pour la gestion des administrateurs
 */
class AdministrateurController {
    /**
     * Authentification d'un administrateur
     * POST /api/administrateurs/login
     */
    static async login(req, res) {
        try {
            const { login, password } = req.body;

            // Validation des données
            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Le login et le mot de passe sont requis'
                });
            }

            // Rechercher l'administrateur par login
            const administrateur = await Administrateur.findOne({
                where: { login }
            });

            if (!administrateur) {
                return res.status(401).json({
                    success: false,
                    message: 'Identifiants invalides'
                });
            }

            // Vérifier que le compte est actif
            if (!administrateur.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'Compte administrateur désactivé'
                });
            }

            // Vérifier la période de validité du compte utilisateur
            const now = new Date();
            if (administrateur.userValidFrom && now < administrateur.userValidFrom) {
                return res.status(403).json({
                    success: false,
                    message: 'Compte pas encore valide (date de début non atteinte)'
                });
            }
            if (administrateur.userValidTo && now > administrateur.userValidTo) {
                return res.status(403).json({
                    success: false,
                    message: 'Compte expiré (date de fin dépassée)'
                });
            }

            // Vérifier le mot de passe
            const isPasswordValid = await administrateur.comparePassword(password);
            if (!isPasswordValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Identifiants invalides'
                });
            }

            // Mettre à jour la date de dernière connexion
            administrateur.lastLogin = new Date();
            await administrateur.save();

            // Générer le token JWT
            const JWT_SECRET = process.env.JWT_SECRET || '1ts@assurassistance-$ecret-k3y_f4r==projEct-ch@nge-in-p@';
            const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';
            
            const token = jwt.sign(
                { 
                    id: administrateur.id,
                    login: administrateur.login,
                    role: administrateur.role || 'SUPER_ADMIN',
                    groupeId: administrateur.groupeId || null
                },
                JWT_SECRET,
                { expiresIn: JWT_EXPIRES_IN }
            );

            return res.status(200).json({
                success: true,
                message: 'Authentification réussie',
                data: {
                    token,
                    administrateur: {
                        id: administrateur.id,
                        login: administrateur.login,
                        nom: administrateur.nom,
                        prenom: administrateur.prenom,
                        email: administrateur.email,
                        role: administrateur.role || 'SUPER_ADMIN',
                        groupeId: administrateur.groupeId,
                        interfaceLinks: getEffectiveInterfaceLinks(administrateur.role || 'SUPER_ADMIN', administrateur.interfaceLinks),
                        isActive: administrateur.isActive,
                        lastLogin: administrateur.lastLogin
                    }
                }
            });
        } catch (error) {
            console.error('Erreur lors de l\'authentification:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de l\'authentification'
            });
        }
    }

    /**
     * Créer un nouvel administrateur
     * POST /api/administrateurs
     */
    static async create(req, res) {
        try {
            const {
                login,
                password,
                nom,
                prenom,
                email,
                isActive,
                role = 'SUPER_ADMIN',
                groupeId = null,
                userValidFrom = null,
                userValidTo = null,
                interfaceLinks = []
            } = req.body;

            // Validation des données requises
            if (!login || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Le login et le mot de passe sont requis'
                });
            }

            // Vérifier si le login existe déjà
            const existingAdministrateur = await Administrateur.findOne({
                where: { login }
            });

            if (existingAdministrateur) {
                return res.status(409).json({
                    success: false,
                    message: 'Un administrateur avec ce login existe déjà'
                });
            }

            if (!['SUPER_ADMIN', 'AGENT'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'role invalide (SUPER_ADMIN ou AGENT)'
                });
            }
            if (role === 'AGENT' && !groupeId) {
                return res.status(400).json({
                    success: false,
                    message: 'groupeId est requis pour un AGENT'
                });
            }

            // Créer l'administrateur
            const administrateur = await Administrateur.create({
                login,
                password,
                nom: nom || null,
                prenom: prenom || null,
                email: email || null,
                isActive: isActive !== undefined ? isActive : true,
                role,
                groupeId,
                userValidFrom,
                userValidTo,
                interfaceLinks: role === 'SUPER_ADMIN' ? getEffectiveInterfaceLinks('SUPER_ADMIN', []) : normalizeInterfaceLinks(interfaceLinks)
            });

            return res.status(201).json({
                success: true,
                message: 'Administrateur créé avec succès',
                data: administrateur
            });
        } catch (error) {
            console.error('Erreur lors de la création de l\'administrateur:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur de validation',
                    errors: error.errors.map(err => err.message)
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la création de l\'administrateur'
            });
        }
    }

    /**
     * Récupérer tous les administrateurs (paginé, 10 par page par défaut)
     * GET /api/administrateurs?page=1&limit=10&isActive=true
     */
    static async getAll(req, res) {
        try {
            const { isActive, page = 1, limit = 10 } = req.query;
            const where = {};

            if (isActive !== undefined) {
                where.isActive = isActive === 'true';
            }

            const pageNum = Math.max(1, parseInt(page, 10) || 1);
            const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
            const offset = (pageNum - 1) * limitNum;

            const { count, rows } = await Administrateur.findAndCountAll({
                where,
                attributes: { exclude: ['password'] },
                include: [
                    {
                        model: GroupeAdmin,
                        as: 'groupe',
                        attributes: ['id', 'nom']
                    }
                ],
                order: [['createdAt', 'DESC']],
                limit: limitNum,
                offset
            });
            const administrateurs = rows.map((admin) => {
                const item = admin.toJSON();
                const groupName = item.groupe?.nom || null;
                item.groupName = groupName;
                item.groupeNom = groupName;
                item.group_name = groupName;
                return item;
            });

            return res.status(200).json({
                success: true,
                data: administrateurs,
                meta: {
                    page: pageNum,
                    limit: limitNum,
                    total: count,
                    totalPages: Math.ceil(count / limitNum)
                }
            });
        } catch (error) {
            console.error('Erreur lors de la récupération des administrateurs:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération des administrateurs'
            });
        }
    }

    /**
     * Récupérer un administrateur par ID
     * GET /api/administrateurs/:id
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;

            const administrateur = await Administrateur.findByPk(id, {
                attributes: { exclude: ['password'] }
            });

            if (!administrateur) {
                return res.status(404).json({
                    success: false,
                    message: 'Administrateur non trouvé'
                });
            }

            return res.status(200).json({
                success: true,
                data: administrateur
            });
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'administrateur:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération de l\'administrateur'
            });
        }
    }

    /**
     * Mettre à jour un administrateur
     * PUT /api/administrateurs/:id
     */
    static async update(req, res) {
        try {
            const { id } = req.params;
            const { login, password, nom, prenom, email, isActive, role, groupeId, userValidFrom, userValidTo, interfaceLinks } = req.body;

            const administrateur = await Administrateur.findByPk(id);

            if (!administrateur) {
                return res.status(404).json({
                    success: false,
                    message: 'Administrateur non trouvé'
                });
            }

            // Vérifier si le login est modifié et s'il existe déjà
            if (login && login !== administrateur.login) {
                const existingAdministrateur = await Administrateur.findOne({
                    where: { 
                        login,
                        id: { [Op.ne]: id }
                    }
                });

                if (existingAdministrateur) {
                    return res.status(409).json({
                        success: false,
                        message: 'Un administrateur avec ce login existe déjà'
                    });
                }
                administrateur.login = login;
            }

            // Mettre à jour les autres champs
            if (password) administrateur.password = password;
            if (nom !== undefined) administrateur.nom = nom;
            if (prenom !== undefined) administrateur.prenom = prenom;
            if (email !== undefined) administrateur.email = email;
            if (isActive !== undefined) administrateur.isActive = isActive;
            if (role !== undefined) {
                if (!['SUPER_ADMIN', 'AGENT'].includes(role)) {
                    return res.status(400).json({
                        success: false,
                        message: 'role invalide (SUPER_ADMIN ou AGENT)'
                    });
                }
                administrateur.role = role;
            }
            if (groupeId !== undefined) administrateur.groupeId = groupeId;
            if (userValidFrom !== undefined) administrateur.userValidFrom = userValidFrom;
            if (userValidTo !== undefined) administrateur.userValidTo = userValidTo;
            if (interfaceLinks !== undefined) {
                const currentRole = administrateur.role || 'SUPER_ADMIN';
                administrateur.interfaceLinks = currentRole === 'SUPER_ADMIN'
                    ? getEffectiveInterfaceLinks('SUPER_ADMIN', [])
                    : normalizeInterfaceLinks(interfaceLinks);
            }

            await administrateur.save();

            return res.status(200).json({
                success: true,
                message: 'Administrateur mis à jour avec succès',
                data: {
                    id: administrateur.id,
                    login: administrateur.login,
                    nom: administrateur.nom,
                    prenom: administrateur.prenom,
                    email: administrateur.email,
                    role: administrateur.role,
                    groupeId: administrateur.groupeId,
                    interfaceLinks: getEffectiveInterfaceLinks(administrateur.role || 'SUPER_ADMIN', administrateur.interfaceLinks),
                    isActive: administrateur.isActive,
                    lastLogin: administrateur.lastLogin,
                    updatedAt: administrateur.updatedAt
                }
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de l\'administrateur:', error);
            
            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur de validation',
                    errors: error.errors.map(err => err.message)
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour de l\'administrateur'
            });
        }
    }

    /**
     * Récupérer le profil de l'administrateur connecté (via token uniquement)
     * GET /api/administrateurs/me ou route dédiée
     */
    static async getProfileConnected(req, res) {
        try {
            const administrateur = req.administrateur.toJSON ? req.administrateur.toJSON() : req.administrateur;
            administrateur.interfaceLinks = getEffectiveInterfaceLinks(administrateur.role || 'SUPER_ADMIN', administrateur.interfaceLinks);

            return res.status(200).json({
                success: true,
                data: administrateur
            });
        } catch (error) {
            console.error('Erreur lors de la récupération du profil connecté:', error);
            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la récupération du profil connecté'
            });
        }
    }

    /**
     * Mettre à jour le profil de l'administrateur connecté
     * PUT /api/administrateurs/me
     */
    static async updateProfileConnected(req, res) {
        try {
            const { login, password, nom, prenom, email, isActive } = req.body;
            const administrateur = req.administrateur;

            if (!administrateur) {
                return res.status(404).json({
                    success: false,
                    message: 'Administrateur non trouvé'
                });
            }

            if (login && login !== administrateur.login) {
                const existingAdministrateur = await Administrateur.findOne({
                    where: { login }
                });

                if (existingAdministrateur) {
                    return res.status(409).json({
                        success: false,
                        message: 'Un administrateur avec ce login existe déjà'
                    });
                }
                administrateur.login = login;
            }

            if (password) administrateur.password = password;
            if (nom !== undefined) administrateur.nom = nom;
            if (prenom !== undefined) administrateur.prenom = prenom;
            if (email !== undefined) administrateur.email = email;
            if (isActive !== undefined) administrateur.isActive = isActive;

            await administrateur.save();

            return res.status(200).json({
                success: true,
                message: 'Profil connecté mis à jour avec succès',
                data: administrateur
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour du profil connecté:', error);

            if (error.name === 'SequelizeValidationError') {
                return res.status(400).json({
                    success: false,
                    message: 'Erreur de validation',
                    errors: error.errors.map(err => err.message)
                });
            }

            return res.status(500).json({
                success: false,
                message: 'Erreur lors de la mise à jour du profil connecté'
            });
        }
    }
}

module.exports = AdministrateurController;
