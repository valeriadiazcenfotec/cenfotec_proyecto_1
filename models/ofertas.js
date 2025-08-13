const mongoose = require('mongoose');


let ofertasSchema = new mongoose.Schema({
    titulo: { type: String, required: true },
    descripcion: { type: String, required: true },
    categoria: {
        type: String,
        required: true,
        enum: ['alimentos', 'ropa', 'tecnologia', 'servicios']
    },
    imagenOferta: { type: String, required: true }, // Ruta o nombre de archivo

    // Estado
    status: {
        type: String,
        enum: ['pendiente', 'aprobado', 'rechazado'],
        default: 'pendiente',
        index: true
    },
    rejectionReason: { type: String, default: null },

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro', required: false },

    createdAt: { type: Date, default: Date.now }

}, { versionKey: false });

module.exports = mongoose.model('Oferta', ofertasSchema, 'ofertas');