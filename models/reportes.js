const mongoose = require('mongoose');

const ReporteSchema = new mongoose.Schema({
  tipo: {
    type: String,
    enum: ['reporte', 'queja'],
    required: true
  },
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String,
    required: true
  },
  imagen: {
    type: String,
    default: null
  },
  estado: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },
  rejectionReason: {
    type: String,
    default: null
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Registro',
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { versionKey: false });

module.exports = mongoose.model('Reporte', ReporteSchema);
