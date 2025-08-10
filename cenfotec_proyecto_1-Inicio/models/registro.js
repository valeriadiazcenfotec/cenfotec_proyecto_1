const mongoose = require('mongoose');

const registerScheme = mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    cellphone:{
        type:String,
        required:true
    },
    user:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    }
},{versionKey:false})   

const register = mongoose.model('Registro', registerScheme)

module.exports = register