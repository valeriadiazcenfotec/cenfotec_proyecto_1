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
    }

},{versionKey:false})   

const anuncio = mongoose.model('Anuncios', peticionAnuncioScheme)

module.exports = anuncio