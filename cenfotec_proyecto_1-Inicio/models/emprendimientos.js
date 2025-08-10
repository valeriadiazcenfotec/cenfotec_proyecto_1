const mongoose = require('mongoose');

const DB_URI = 'mongodb://localhost:27017/db'

mongoose.connect(DB_URI, {})

    .then(console.log("DB CONECTADA"))
    .catch(err => console.log(err))

let emprendimientoSchema = new mongoose.Schema({
    nombreN: { type: String, required: true },
    descripcion: { type: String, required: true },
    categoria: {
        type: String,
        required: true,
        enum: ['alimentos', 'ropa', 'tecnologia', 'servicios'] // Validación estricta
    },
    imagenNegocio: { type: String, required: true }, // Ruta o nombre de archivo
    imagenesProductos: { type: [String], required: true } // Array de rutas o nombres de archivos
}, { versionKey: false });

let Emprendimiento = new mongoose.model('emprendimientos', emprendimientoSchema);

module.exports = Emprendimiento;