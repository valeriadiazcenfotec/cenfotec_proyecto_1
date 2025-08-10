const mongoose = require('mongoose');

const EventoSchema = new mongoose.Schema({
  name: { type: String, required: true },
  place: { type: String, required: true },
  date:  { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String },

  // Campos para moderación:
  status: {
    type: String,
    enum: ['pendiente', 'aprobado', 'rechazado'],
    default: 'pendiente'
  },
  rejectionReason: { type: String, default: '' }
}, { versionKey: false, timestamps: true });

module.exports = mongoose.model('Evento', EventoSchema);
