const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const bcrypt = require('bcrypt');

/**
 * Modèle Administrateur
 * Représente les administrateurs du système
 */
const Administrateur = sequelize.define('Administrateur', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false
    },
    login: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
            notEmpty: {
                msg: 'Le login ne peut pas être vide'
            },
            len: {
                args: [3, 100],
                msg: 'Le login doit contenir entre 3 et 100 caractères'
            }
        }
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'Le mot de passe ne peut pas être vide'
            },
            len: {
                args: [6, 255],
                msg: 'Le mot de passe doit contenir au moins 6 caractères'
            }
        }
    },
    nom: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    prenom: {
        type: DataTypes.STRING(100),
        allowNull: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
            isEmail: {
                msg: 'L\'email doit être valide'
            }
        }
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        allowNull: false
    },
    lastLogin: {
        type: DataTypes.DATE,
        allowNull: true
    }
}, {
    tableName: 'administrateurs',
    timestamps: true,
    paranoid: true,
    indexes: [
        {
            unique: true,
            fields: ['login']
        },
        {
            fields: ['email']
        },
        {
            fields: ['isActive']
        }
    ],
    hooks: {
        beforeCreate: async (administrateur) => {
            if (administrateur.password) {
                administrateur.password = await bcrypt.hash(administrateur.password, 10);
            }
        },
        beforeUpdate: async (administrateur) => {
            if (administrateur.changed('password')) {
                administrateur.password = await bcrypt.hash(administrateur.password, 10);
            }
        }
    }
});

/**
 * Méthode pour comparer le mot de passe
 * @param {string} plainPassword - Mot de passe en clair
 * @returns {boolean} - True si le mot de passe correspond
 */
Administrateur.prototype.comparePassword = async function(plainPassword) {
    return await bcrypt.compare(plainPassword, this.password);
};

/**
 * Méthode pour exclure le mot de passe lors de la sérialisation
 */
Administrateur.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    return values;
};

module.exports = Administrateur;
