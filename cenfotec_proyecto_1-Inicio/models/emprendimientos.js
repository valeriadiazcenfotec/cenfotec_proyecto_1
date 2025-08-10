const mongoose = require('mongoose');

const emprendimientoSchema = new mongoose.Schema({
  nombreN: { type: String, required: true, trim: true },
  descripcion: { type: String, required: true, trim: true },
  categoria: {
    type: String,
    required: true,
    enum: ['alimentos', 'ropa', 'tecnologia', 'servicios'],
    lowercase: true,
    trim: true
  },

  // Imágenes
  imagenNegocio: { type: String, default: '' },
  imagenesProductos: { type: [String], default: [] },

  // Estado
  status: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente',
    index: true
  },
  rejectionReason: { type: String, default: null },

  // quien
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'Registro', required: false },

  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

module.exports = mongoose.model('Emprendimiento', emprendimientoSchema, 'emprendimientos');
