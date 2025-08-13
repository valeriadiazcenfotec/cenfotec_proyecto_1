require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
const multer = require('multer');
const session = require('express-session');
const bcrypt = require('bcrypt');

// Modelos para DB
const anuncio = require('../models/anuncios');
const register = require('../models/registro');
const evento = require('../models/eventos');
const Emprendimiento = require('../models/emprendimientos');
const oferta = require('../models/ofertas')
const Reporte = require('../models/reportes');

require('../db'); // conexión a Mongo

const app = express();

app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

/*  Sesiones  */
app.use(session({
    secret: process.env.SESSION_SECRET || 'cambiar',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true }
}));

/*  Carpetas de uploads  */
const dirImg = path.join(__dirname, 'public', 'img');
const dirReportes = path.join(dirImg, 'reportes');
fs.mkdirSync(dirImg, { recursive: true });
fs.mkdirSync(dirReportes, { recursive: true });

/*  Autorización  */
function requireAuth(req, res, next) {
    if (!req.session?.user) return res.status(401).send('No autenticado');
    next();
}
function requireRole(...roles) {
    return (req, res, next) => {
        const role = req.session?.user?.role;
        if (!role) return res.status(401).send('No autenticado');
        if (!roles.includes(role)) return res.status(403).send('No autorizado');
        next();
    };
}

// Exponer usuario a vistas
app.use((req, res, next) => {
    res.locals.currentUser = req.session?.user || null;
    res.locals.isLoggedIn = !!res.locals.currentUser;
    res.locals.isAdmin = res.locals.currentUser?.role === 'admin';
    next();
});

/*  Info de sesión  */

app.get('/sesion', async (req, res) => {
    try {
        const s = req.session?.user;
        if (!s) return res.json({ loggedIn: false });

        // Trae nombre/username de la BD
        const u = await register
            .findById(s.id)
            .select('name user role')
            .lean();

        return res.json({
            loggedIn: true,
            id: s.id,
            username: u?.user || s.user || null,
            name: u?.name || null,
            role: u?.role || s.role || null,
            isAdmin: (u?.role || s.role) === 'admin'
        });
    } catch (e) {
        console.error('Error en /sesion:', e);
        res.status(500).json({ loggedIn: false });
    }
});

/*   INICIO   */
app.get('/', (req, res) => res.redirect('/inicio'));
app.get('/inicio', (req, res) => {
    res.render('Inicio/inicio.html');
});

app.get('/Inicio', (req, res) => res.redirect(301, '/inicio'));


/*   LOGIN   */
app.get('/login', (req, res) => {
    res.render('Login/login.html');
});
app.get('/Login', (req, res) => res.redirect(301, '/login'));

app.post('/login', async (req, res) => {
    try {
        const { user, password } = req.body;
        const usuario = await register.findOne({
            $or: [{ user }, { cellphone: user }]
        }).select('+password');

        if (!usuario) return res.redirect('/login');

        const ok = usuario.comparePassword
            ? await usuario.comparePassword(password)
            : await bcrypt.compare(password, usuario.password);

        if (!ok) return res.redirect('/login');

        // Guarda username + nombre real + rol en sesión
        req.session.user = {
            id: usuario._id.toString(),
            user: usuario.user,
            name: usuario.name,
            role: usuario.role
        };

        res.redirect('/inicio');
    } catch (e) {
        console.error(e);
        res.redirect('/login');
    }
});

/*   REGISTRO   */

app.get('/registro', (req, res) => {
    res.render('Registro/registro.html');
});

app.post('/registrar_usuario', async (req, res) => {
    try {
        const role = (req.body.role === 'emprendedor') ? 'emprendedor' : 'ciudadano';
        await new register({
            name: req.body.name,
            cellphone: req.body.cellphone,
            user: req.body.user,
            email: req.body.email,
            password: req.body.password,
            role
        }).save();
        res.redirect('/login');
    } catch (e) {
        console.error(e);
        res.status(500).send('Error al registrar usuario');
    }
});

/*   LOGOUT   */
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.clearCookie('connect.sid');
        res.redirect('/login?msg=Sesion%20cerrada');
    });
});

/*   ANUNCIOS   */app.get('/anuncios', (req, res) => {
    res.render('Anuncios/anuncios.html');
});
app.get('/Anuncios', (req, res) => res.redirect(301, '/anuncios'));

// Crear nueva petición de anuncio
app.post('/peticion_anuncio', requireAuth, async (req, res) => {
    const { name, description, image } = req.body;

    // Validación básica
    if (!name || !description) {
        return res.status(400).json({ error: 'Nombre y descripción son obligatorios' });
    }

    try {
        const nuevoAnuncio = new anuncio({
            name: name.trim(),
            description: description.trim(),
            image: image || null,
            userId: req.session.user.id,
            estado: 'pendiente',
            fecha: new Date()
        });

        await nuevoAnuncio.save();
        res.status(200).json({
            message: 'Anuncio guardado exitosamente',
            id: nuevoAnuncio._id
        });
    } catch (error) {
        console.error('Error guardando anuncio:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// Obtener todos los anuncios (solo para admin)
app.get('/anuncios_todos', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const anuncios = await anuncio.find()
            .populate('userId', 'name user')
            .sort({ fecha: -1 });
        res.json(anuncios);
    } catch (error) {
        console.error('Error obteniendo anuncios:', error);
        res.status(500).json({ error: 'Error al obtener los anuncios' });
    }
});

// Obtener anuncios públicos (aprobados)
app.get('/anuncios_publicos', async (req, res) => {
    try {
        const anunciosAprobados = await anuncio.find({ estado: 'aprobado' })
            .select('-userId -rejectionReason') // No exponer datos sensibles
            .sort({ fecha: -1 });
        res.json(anunciosAprobados);
    } catch (error) {
        console.error('Error obteniendo anuncios públicos:', error);
        res.status(500).json({ error: 'Error al obtener los anuncios' });
    }
});

// Obtener mis anuncios (del usuario logueado)
app.get('/anuncios_mios', requireAuth, async (req, res) => {
    try {
        const misAnuncios = await anuncio.find({ userId: req.session.user.id })
            .sort({ fecha: -1 });
        res.json(misAnuncios);
    } catch (error) {
        console.error('Error obteniendo anuncios del usuario:', error);
        res.status(500).json({ error: 'Error al obtener tus anuncios' });
    }
});

// Cancelar petición de anuncio (solo el autor puede cancelar sus propios anuncios pendientes)
app.delete('/peticion_anuncio_cancelar', requireAuth, async (req, res) => {
    const { _id } = req.body;

    if (!_id) {
        return res.status(400).json({ error: 'ID del anuncio es requerido' });
    }

    try {
        // Buscar el anuncio y verificar que pertenece al usuario
        const anuncioAEliminar = await anuncio.findOne({
            _id,
            userId: req.session.user.id
        });

        if (!anuncioAEliminar) {
            return res.status(404).json({ error: 'Anuncio no encontrado o no tienes permisos' });
        }

        // Solo permitir cancelar anuncios pendientes
        if (anuncioAEliminar.estado !== 'pendiente') {
            return res.status(400).json({
                error: 'Solo se pueden cancelar anuncios pendientes'
            });
        }

        await anuncio.deleteOne({ _id });
        res.json({ message: 'Anuncio eliminado correctamente' });
    } catch (error) {
        console.error('Error eliminando anuncio:', error);
        res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

// Aprobar anuncio (solo admin)
app.post('/anuncios/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const resultado = await anuncio.findByIdAndUpdate(
            req.params.id,
            {
                estado: 'aprobado',
                rejectionReason: null
            },
            { new: true }
        );

        if (!resultado) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }

        res.json({ message: 'Anuncio aprobado exitosamente', anuncio: resultado });
    } catch (error) {
        console.error('Error aprobando anuncio:', error);
        res.status(500).json({ error: 'Error al aprobar anuncio' });
    }
});

// Rechazar anuncio (solo admin)
app.post('/anuncios/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    const { reason } = req.body;

    try {
        const resultado = await anuncio.findByIdAndUpdate(
            req.params.id,
            {
                estado: 'rechazado',
                rejectionReason: reason || 'Sin motivo especificado'
            },
            { new: true }
        );

        if (!resultado) {
            return res.status(404).json({ error: 'Anuncio no encontrado' });
        }

        res.json({ message: 'Anuncio rechazado', anuncio: resultado });
    } catch (error) {
        console.error('Error rechazando anuncio:', error);
        res.status(500).json({ error: 'Error al rechazar anuncio' });
    }
});

// Obtener estadísticas de anuncios (para admin)
app.get('/anuncios/stats', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const stats = await anuncio.aggregate([
            {
                $group: {
                    _id: '$estado',
                    count: { $sum: 1 }
                }
            }
        ]);

        const resultado = {
            pendientes: 0,
            aprobados: 0,
            rechazados: 0
        };

        stats.forEach(stat => {
            resultado[stat._id + 's'] = stat.count;
        });

        res.json(resultado);
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});
/*   Transporte   */
app.get('/transporte', (req, res) => {
    res.render('Transporte/transporte.html');
});
app.get('/Transporte', (req, res) => res.redirect(301, '/transporte'));

/*   EVENTOS   */
app.get('/eventos', (req, res) => {
    res.render('Eventos/eventos.html');
});
app.get('/Eventos', (req, res) => res.redirect(301, '/eventos'));

app.post('/peticion_evento', async (req, res) => {
    const { name, place, date, description, image } = req.body;
    try {
        await new evento({ name, place, date, description, image }).save();
        res.status(200).json({ message: 'Evento guardado' });
    } catch {
        res.status(500).json({ error: 'Error al guardar evento' });
    }
});

app.get('/eventos_todos', async (req, res) => {
    try { res.json(await evento.find()); }
    catch { res.status(500).json({ error: 'Error al obtener los eventos' }); }
});

app.get('/eventos_publicos', async (req, res) => {
    try { res.json(await evento.find({ status: 'aprobado' })); }
    catch { res.status(500).json({ error: 'Error al obtener los eventos' }); }
});

app.delete('/peticion_evento_cancelar', async (req, res) => {
    try { await evento.deleteOne({ _id: req.body._id }); res.json({ message: 'Evento eliminado correctamente' }); }
    catch { res.status(500).json({ error: 'Error al eliminar evento' }); }
});

app.post('/eventos/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await evento.findByIdAndUpdate(req.params.id, { status: 'aprobado', rejectionReason: null }); res.json({ message: 'Evento aprobado' }); }
    catch { res.status(500).json({ error: 'Error al aprobar evento' }); }
});
app.post('/eventos/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await evento.findByIdAndUpdate(req.params.id, { status: 'rechazado', rejectionReason: req.body.reason || '' }); res.json({ message: 'Evento rechazado' }); }
    catch { res.status(500).json({ error: 'Error al rechazar evento' }); }
});
app.get('/eventos_mios', requireAuth, async (req, res) => {
    try { res.json(await evento.find({ userId: req.session.user.id }).sort({ fecha: -1 })); }
    catch { res.status(500).json({ error: 'Error al obtener tus eventos' }); }
});

/*   REPORTES   */
const storageReportes = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dirReportes),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname || '');
        cb(null, `${unique}${ext}`);
    }
});
const uploadReportes = multer({ storage: storageReportes });

app.get('/reportes', (req, res) => {
    res.render('Reportes/reportes.html');
});
app.get('/Reportes', (req, res) => res.redirect(301, '/reportes'));

app.post('/reportes', requireAuth, uploadReportes.single('foto'), async (req, res) => {
    try {
        const { tipo, titulo, descripcion } = req.body;
        await Reporte.create({
            tipo, titulo, descripcion,
            imagen: req.file ? req.file.filename : null,
            userId: req.session.user.id,
            estado: 'pendiente'
        });
        res.redirect('/reportes');
    } catch (e) {
        console.error(e);
        res.status(500).send('Error al registrar el reporte');
    }
});

// Listas en formato JSON que se saca del DB
app.get('/reportes_todos', async (req, res) => {
    try { res.json(await Reporte.find().sort({ fecha: -1 })); }
    catch { res.status(500).json({ error: 'Error al obtener los reportes' }); }
});
app.get('/reportes_publicos', async (req, res) => {
    try { res.json(await Reporte.find({ estado: 'aprobado' }).sort({ fecha: -1 })); }
    catch { res.status(500).json({ error: 'Error al obtener los reportes públicos' }); }
});
app.get('/reportes_mios', requireAuth, async (req, res) => {
    try { res.json(await Reporte.find({ userId: req.session.user.id }).sort({ fecha: -1 })); }
    catch { res.status(500).json({ error: 'Error al obtener tus reportes' }); }
});
app.delete('/peticion_reporte_cancelar', requireAuth, async (req, res) => {
    try { await Reporte.deleteOne({ _id: req.body._id, userId: req.session.user.id }); res.json({ message: 'Reporte eliminado correctamente' }); }
    catch { res.status(500).json({ error: 'Error al eliminar el reporte' }); }
});
app.post('/reportes/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await Reporte.findByIdAndUpdate(req.params.id, { estado: 'aprobado', rejectionReason: null }); res.json({ message: 'Reporte aprobado' }); }
    catch { res.status(500).json({ error: 'Error al aprobar reporte' }); }
});
app.post('/reportes/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await Reporte.findByIdAndUpdate(req.params.id, { estado: 'rechazado', rejectionReason: req.body.reason || '' }); res.json({ message: 'Reporte rechazado' }); }
    catch { res.status(500).json({ error: 'Error al rechazar reporte' }); }
});

app.post('/quejas/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await Reporte.findByIdAndUpdate(req.params.id, { estado: 'aprobado', rejectionReason: null }); res.json({ message: 'Reporte aprobado' }); }
    catch { res.status(500).json({ error: 'Error al aprobar reporte' }); }
});
app.post('/quejas/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await Reporte.findByIdAndUpdate(req.params.id, { estado: 'rechazado', rejectionReason: req.body.reason || '' }); res.json({ message: 'Reporte rechazado' }); }
    catch { res.status(500).json({ error: 'Error al rechazar reporte' }); }
});

/*   EMPRENDIMIENTOS   */
app.get('/emprendimientos', async (req, res) => {
    const categoria = req.query.categoria || 'all';
    const role = req.session?.user?.role;
    let emprendimientos;
    if (categoria === 'all') {
        emprendimientos = await Emprendimiento.find();
    } else {
        emprendimientos = await Emprendimiento.find({
            categoria: { $regex: `^${categoria.trim()}$`, $options: 'i' }
        });
    }
    (role !== 'emprendedor') ? res.render('Emprendimientos/emprendimientos', { emprendimientos, categoria }) : res.render('Emprendimientos/emprendedor', { emprendimientos, categoria })

});
app.get('/Emprendimientos', (req, res) => res.redirect(301, '/emprendimientos'));

app.get("/nuevo%20emprendimiento", requireAuth, (req, res) => {
    res.render("Emprendimientos/VistaGenerica.html")
})

const storageEmpr = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dirImg),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${unique}-${file.originalname}`);
    }
});
const uploadEmpr = multer({ storage: storageEmpr });

app.post('/addbusiness',
    requireAuth,
    uploadEmpr.fields([
        { name: 'imagenNegocio', maxCount: 1 },
        { name: 'imagenesProductos[]', maxCount: 10 }
    ]),
    async (req, res) => {
        try {
            const files = req.files;
            await new Emprendimiento({
                nombreN: req.body.nombre,
                descripcion: req.body.descripcion,
                categoria: req.body.categoria,
                imagenNegocio: files?.imagenNegocio ? files.imagenNegocio[0].filename : '',
                imagenesProductos: files?.['imagenesProductos[]'] ? files['imagenesProductos[]'].map(f => f.filename) : []
            }).save();
            res.redirect('/nuevo%20emprendimiento');
        } catch (e) {
            console.error(e);
            res.status(500).send('Error al registrar el emprendimiento');
        }
    }
);

/*  OFERTAS */

app.get("/ofertas", async (req, res) => {
    const categoria = req.query.categoria || 'all';
    const role = req.session?.user?.role;
    let ofertas;
    if (categoria === 'all') {
        ofertas = await oferta.find();
    } else {
        ofertas = await oferta.find({
            categoria: { $regex: `^${categoria.trim()}$`, $options: 'i' }
        });
    }
    (role !== 'emprendedor') ? res.render('Ofertas/Ofertas', { ofertas, categoria }) : res.render('Ofertas/OfertasEmprendedor', { ofertas, categoria })
});

app.get('/nuevaoferta', async (req, res) => {

    res.render('Ofertas/CrearOferta.html')
})

app.post('/addoffer',
    requireAuth, requireRole('emprendedor', 'admin'),
    uploadEmpr.fields([
        { name: 'imagenNegocio', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const files = req.files;
            await new oferta({
                titulo: req.body.nombre,
                descripcion: req.body.descripcion,
                categoria: req.body.categoria,
                imagenOferta: files?.imagenNegocio ? files.imagenNegocio[0].filename : '',
            }).save();
            res.redirect('/nuevaoferta');
        } catch (e) {
            console.error(e);
            res.status(500).send('Error al registrar la oferta');
        }
    }
);

// Admin: aprobar / rechazar Emprendimientos
app.post('/emprendimientos/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await Emprendimiento.findByIdAndUpdate(req.params.id, { status: 'aprobado', rejectionReason: null });
        res.json({ message: 'Emprendimiento aprobado' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al aprobar emprendimiento' });
    }
});
app.post('/emprendimientos/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await Emprendimiento.findByIdAndUpdate(req.params.id, { status: 'rechazado', rejectionReason: req.body.reason || '' });
        res.json({ message: 'Emprendimiento rechazado' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al rechazar emprendimiento' });
    }
});

/*   MAPA   */
app.get('/mapa', (req, res) => {
    res.render('Mapa/mapa.html');
});

app.get('/Mapa', (req, res) => res.redirect(301, '/mapa'));

/*   ADMIN   */
app.get('/admin', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const [
            anunciosList,
            eventosList,
            reportesList,
            emprendimientosList,
            usuariosList
            // ofertasList Quitar el comment cuando exista ofertas
        ] = await Promise.all([
            anuncio.find().sort({ _id: -1 }).lean(),
            evento.find().sort({ _id: -1 }).lean(),
            Reporte.find().sort({ fecha: -1 }).lean(),
            Emprendimiento.find().sort({ _id: -1 }).lean(),
            register.find().sort({ _id: -1 }).lean()
            // Oferta.find().sort({ _id: -1 }).lean() Quitar el comment cuando exista ofertas
        ]);

        res.render('Admin/admin', {
            anuncios: anunciosList,
            eventos: eventosList,
            reportes: reportesList,
            quejas: reportesList.filter(r => r.tipo === 'queja'),
            emprendimientos: emprendimientosList,
            usuarios: usuariosList,
            ofertas: [] // placeholder Quitar cuando exista ofertas
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error cargando admin');
    }
});

// Eliminar desde Admin

// ANUNCIOS
app.delete('/anuncios/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await anuncio.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Anuncio eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

// EVENTOS
app.delete('/eventos/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await evento.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Evento eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

// REPORTES 
app.delete('/reportes/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await Reporte.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Reporte eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar reporte' });
    }
});

app.delete('/quejas/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await Reporte.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Queja eliminada' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar queja' });
    }
});

// EMPRENDIMIENTOS
app.delete('/emprendimientos/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await Emprendimiento.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Emprendimiento eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar emprendimiento' });
    }
});

// OFERTAS
app.delete('/ofertas/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await oferta.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Oferta eliminada' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar oferta' });
    }
});

//   Levantar el servidor 

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor conectado en puerto ${PORT}`);
});
