const mongoose = require('mongoose');

const peticionEventoScheme = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    place:{
        type:String,
        required:true
    },
    date:{
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

const evento = mongoose.model('Evento', peticionEventoScheme)

module.exports = evento