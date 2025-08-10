const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const anuncio = require('../models/anuncios');
const register = require('../models/registro');
const evento = require('../models/eventos');
const multer = require('multer');
const newbusiness = require('../models/emprendimientos.js');


require('../db');
const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

// Static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Start server
app.listen(3000, () => {
    console.log("El server se conecto");
});

// Routes
app.get('/anuncios', (req, res) => {
    res.render("Anuncios/anuncios.html");
});
// Login --------------------------------------------------------------------------------------- 

app.get('/login', (req, res) => {
    res.render("Login/login.html");
});
app.get('/inicio', (req, res) => {
    res.render("Inicio/inicio.html");
});

app.get('/register', (req, res) => {
    res.render("Registro/Registro.html");
});

app.get('/emprendimientos', async (req, res) => {
    const categoria = req.query.categoria || 'all';

    let emprendimientos;

    if (categoria === 'all') {
        emprendimientos = await newbusiness.find();
    } else {
        emprendimientos = await newbusiness.find({
            categoria: { $regex: `^${categoria.trim()}$`, $options: 'i' }
        });
    }

    res.render('Emprendimientos/emprendimientos', { emprendimientos, categoria });
});

app.get('/eventos', (req, res) => {
    res.render("Eventos/eventos.html");
});

app.get('/admin', (req, res) => {
    res.render("Admin/admin.html");
});

app.post('/login', (req, res) => {
    let data = {
        user: req.body.user,
        password: req.body.password
    }
    const existUser = async () => {
        const usuario = await register.findOne({
            $or: [
                { user: data.user },
                { cellphone: data.cellphone }
            ]
        });
        if (usuario != null) {
            if (data.password == usuario.password) {
                console.log('Login exitoso');
                res.redirect('./inicio');

            } else {
                console.log('Login fallido');

            }
        } else {
            console.log('Login fallido');
            res.redirect('./login');
        }
    }
    existUser();
})


app.post('/registrar_usuario', (req, res) => {
    console.log("Datos recibidos:", req.body);
    let data = new register({
        name: req.body.name,
        cellphone: req.body.cellphone,
        user: req.body.user,
        email: req.body.email,
        password: req.body.password
    })

    data.save()
        .then(() => {
            console.log("Usario registrado")
        })
        .catch((err) => {
            console.log("Usuario no guardado", err)
        })

});


// Anuncios----------------------------------------------------------------------------------------------------

app.post('/peticion_anuncio', (req, res) => {
    const { name, description, image } = req.body;

    const data = new anuncio({
        name,
        description,
        image
    });

    data.save()
        .then(() => {
            console.log("Anuncio registrado");
            res.status(200).json({ message: "Anuncio guardado" });
        })
        .catch((err) => {
            console.error("Usuario no guardado", err);
            res.status(500).json({ error: "Error al guardar anuncio" });
        });
});

app.get('/anuncios', async (req, res) => {
    try {
        const anuncios = await anuncio.find();
        res.json(anuncios);
    } catch (err) {
        console.error('Error al obtener los anuncios:', err);
        res.status(500).json({ error: 'Error al obtener los anuncios' });
    }
});

app.delete('/peticion_anuncio_cancelar', async (req, res) => {
    try {
        await anuncio.deleteOne({ _id: req.body._id });
        res.json({ message: 'Anuncio eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

//Eventos--------------------------------------------------------------------------------------------------

app.post('/peticion_evento', (req, res) => {
    const { name, place, date, description, image } = req.body;

    const data = new evento({
        name,
        place,
        date,
        description,
        image
    });

    data.save()
        .then(() => {
            console.log("Evento registrado");
            res.status(200).json({ message: "Evento guardado" });
        })
        .catch((err) => {
            console.error("Evento no guardado", err);
            res.status(500).json({ error: "Error al guardar evento" });
        });
});

app.get('/eventos_todos', async (req, res) => {
    try {
        const eventos = await evento.find();
        res.json(eventos);
    } catch (err) {
        console.error('Error al obtener los evento:', err);
        res.status(500).json({ error: 'Error al obtener los eventos' });
    }
});

app.delete('/peticion_evento_cancelar', async (req, res) => {
    try {
        await evento.deleteOne({ _id: req.body._id });
        res.json({ message: 'Evento eliminado correctamente' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

// Admin----------------------------------------------------------------------------------------------------------

app.get('/admin_anuncios', async (req, res) => {
    try {
        const anuncios = await anuncio.find();
        res.json(anuncios);
    } catch (err) {
        console.error('Error al obtener los anuncios:', err);
        res.status(500).json({ error: 'Error al obtener los anuncios' });
    }
});

// Emprendimientos------------------------------------------------------------------------------------------------

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '../src/public/img'));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + '-' + file.originalname);
    }
});

const upload = multer({ storage: storage });

app.post('/addbusiness', upload.fields([
    { name: 'imagenNegocio', maxCount: 1 },
    { name: 'imagenesProductos[]', maxCount: 10 }
]), (req, res) => {
    const files = req.files;

    let data = new newbusiness({
        nombreN: req.body.nombre,
        descripcion: req.body.descripcion,
        categoria: req.body.categoria,
        imagenNegocio: files.imagenNegocio ? files.imagenNegocio[0].filename : '',
        imagenesProductos: files['imagenesProductos[]'] ? files['imagenesProductos[]'].map(img => img.filename) : []
    });

    data.save()
        .then(() => {
            console.log("Emprendiempmiento se registró");
            res.redirect('/nuevo%20emprendimiento');
        })
        .catch((err) => {
            console.log("ERROR", err);
            res.status(500).send("Error al registrar el emprendimiento");
        });
});