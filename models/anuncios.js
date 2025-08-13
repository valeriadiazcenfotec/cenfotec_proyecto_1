const mongoose = require('mongoose');

const peticionAnuncioScheme = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    description:{
        type:String,
        required:true,
    },
    image:{
        type:String,
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

},{versionKey:false})   

const anuncio = mongoose.model('Anuncios', peticionAnuncioScheme)

module.exports = anuncio