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
app.get('/landing', (req, res) => {
    res.render('Landing/landing_page.html');
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

/*   ANUNCIOS   */
app.get('/anuncios', (req, res) => {
    res.render('Anuncios/anuncios.html');
});
app.get('/Anuncios', (req, res) => res.redirect(301, '/anuncios'));

app.post('/peticion_anuncio', async (req, res) => {
    const { name, description, image } = req.body;
    try {
        await new anuncio({ name, description, image }).save();
        res.status(200).json({ message: 'Anuncio guardado' });
    } catch {
        res.status(500).json({ error: 'Error al guardar anuncio' });
    }
});

app.get('/anuncios_todos', async (req, res) => {
    try { res.json(await anuncio.find()); }
    catch { res.status(500).json({ error: 'Error al obtener los anuncios' }); }
});

app.get('/anuncios_publicos', async (req, res) => {
    try { res.json(await anuncio.find({ status: 'aprobado' })); }
    catch { res.status(500).json({ error: 'Error al obtener los anuncios' }); }
});

app.delete('/peticion_anuncio_cancelar', async (req, res) => {
    try { await anuncio.deleteOne({ _id: req.body._id }); res.json({ message: 'Anuncio eliminado correctamente' }); }
    catch { res.status(500).json({ error: 'Error al eliminar anuncio' }); }
});

app.post('/anuncios/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await anuncio.findByIdAndUpdate(req.params.id, { status: 'aprobado', rejectionReason: null }); res.json({ message: 'Anuncio aprobado' }); }
    catch { res.status(500).json({ error: 'Error al aprobar anuncio' }); }
});
app.post('/anuncios/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await anuncio.findByIdAndUpdate(req.params.id, { status: 'rechazado', rejectionReason: req.body.reason || '' }); res.json({ message: 'Anuncio rechazado' }); }
    catch { res.status(500).json({ error: 'Error al rechazar anuncio' }); }
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
    try { res.json(await evento.find({ estado: 'aprobado' })); }
    catch { res.status(500).json({ error: 'Error al obtener los eventos' }); }
});

app.delete('/peticion_evento_cancelar', async (req, res) => {
    try { await evento.deleteOne({ _id: req.body._id }); res.json({ message: 'Evento eliminado correctamente' }); }
    catch { res.status(500).json({ error: 'Error al eliminar evento' }); }
});

app.post('/eventos/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await evento.findByIdAndUpdate(req.params.id, { estado: 'aprobado', rejectionReason: null }); res.json({ message: 'Evento aprobado' }); }
    catch { res.status(500).json({ error: 'Error al aprobar evento' }); }
});
app.post('/eventos/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try { await evento.findByIdAndUpdate(req.params.id, { estado: 'rechazado', rejectionReason: req.body.reason || '' }); res.json({ message: 'Evento rechazado' }); }
    catch { res.status(500).json({ error: 'Error al rechazar evento' }); }
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
app.get('/emprendimientos', (req, res) => {
    const role = req.session?.user?.role;
    const categoria = (req.query.categoria || 'all').trim();
    (role !== 'emprendedor' && role !== 'admin') ? res.render('Emprendimientos/emprendimientos', { Emprendimiento, categoria }) : res.render('Emprendimientos/emprendedor', { Emprendimiento, categoria })
});
app.get('/Emprendimientos', (req, res) => res.redirect(301, '/emprendimientos'));

app.get('/emprendimientos_publicos', async (req, res) => {
    try {
        const categoria = (req.query.categoria || 'all').trim();
        const base = { status: 'aprobado' };
        const query = (categoria === 'all')
            ? base
            : { ...base, categoria: { $regex: `^${categoria}$`, $options: 'i' } };
        const docs = await Emprendimiento.find(query).sort({ _id: -1 }).lean();
        res.json(docs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al obtener los emprendimientos públicos' });
    }
});

app.get('/nuevo%20emprendimiento', requireAuth, (req, res) => {
    res.render('Emprendimientos/VistaGenerica.html');
});

const storageEmpr = multer.diskStorage({
    destination: (req, file, cb) => cb(null, dirImg),
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${unique}-${file.originalname}`);
    }
});
const uploadEmpr = multer({ storage: storageEmpr });

app.post('/addbusiness', requireAuth,
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
                imagenesProductos: files?.['imagenesProductos[]']
                    ? files['imagenesProductos[]'].map(f => f.filename)
                    : [],
                userId: req.session.user.id, // dueño
                status: 'pendiente'          // queda pendiente hasta aprobación
            }).save();
            res.redirect('/nuevo%20emprendimiento');
        } catch (e) {
            console.error(e);
            res.status(500).send('Error al registrar el emprendimiento');
        }
    }
);

/*  OFERTAS */

app.get('/ofertas', (req, res) => {
    const role = req.session?.user?.role;
    const categoria = (req.query.categoria || 'all').trim();
    (role !== 'emprendedor' && role !== 'admin') ? res.render('Ofertas/Ofertas', { oferta, categoria }) : res.render('Ofertas/OfertasEmprendedor', { oferta, categoria })
});

app.get('/Ofertas', (req, res) => res.redirect(301, '/ofertas'));

app.get('/nuevaOferta', async (req, res) => {

    res.render('Ofertas/CrearOferta.html')
})

app.get('/ofertas_publicas', async (req, res) => {
    try {
        const categoria = (req.query.categoria || 'all').trim();
        const base = { status: 'aprobado' };
        const query = (categoria === 'all')
            ? base
            : { ...base, categoria: { $regex: `^${categoria}$`, $options: 'i' } };
        const docs = await oferta.find(query).sort({ _id: -1 }).lean();
        res.json(docs);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al obtener las ofertas publicas' });
    }
});

app.post('/addoffer', requireAuth, requireRole('emprendedor', 'admin'),
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
                userId: req.session.user.id, // dueño
                status: 'pendiente'
            }).save();
            res.redirect('/nuevaoferta');
        } catch (e) {
            console.error(e);
            res.status(500).send('Error al registrar la oferta');
        }
    }
);

// Admin: aprobar / rechazar Emprendimientos y Ofertas
app.post('/emprendimientos/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const emp = await Emprendimiento.findByIdAndUpdate(
            req.params.id,
            { status: 'aprobado', rejectionReason: null },
            { new: true }
        ).lean();

        if (!emp) return res.status(404).json({ error: 'No encontrado' });

        // Promueve al dueño a emprendedor
        if (emp.userId) {
            await register.findByIdAndUpdate(emp.userId, { role: 'emprendedor' });
        }

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

/* OFERTAS */

app.post('/ofertas/:id/aprobar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const o = await oferta.findByIdAndUpdate(
            req.params.id,
            { status: 'aprobado', rejectionReason: null },
            { new: true }
        ).lean();

        if (!o) return res.status(404).json({ error: 'No encontrado' });

        // Promueve al dueño a emprendedor
        if (o.userId) {
            await register.findByIdAndUpdate(o.userId, { role: 'emprendedor' });
        }

        res.json({ message: 'Oferta aprobada' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al aprobar oferta' });
    }
});
app.post('/ofertas/:id/rechazar', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        await oferta.findByIdAndUpdate(req.params.id, { status: 'rechazado', rejectionReason: req.body.reason || '' });
        res.json({ message: 'Oferta rechazada' });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Error al rechazar oferta' });
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
            usuariosList,
            ofertasList
        ] = await Promise.all([
            anuncio.find().sort({ _id: -1 }).lean(),
            evento.find().sort({ _id: -1 }).lean(),
            Reporte.find().sort({ fecha: -1 }).lean(),
            Emprendimiento.find().sort({ _id: -1 }).lean(),
            register.find().sort({ _id: -1 }).lean(),
            oferta.find().sort({ _id: -1 }).lean()
        ]);

        res.render('Admin/admin', {
            anuncios: anunciosList,
            eventos: eventosList,
            reportes: reportesList,
            quejas: reportesList.filter(r => r.tipo === 'queja'),
            emprendimientos: emprendimientosList,
            usuarios: usuariosList,
            ofertas: ofertasList // placeholder Quitar cuando exista ofertas
        });
    } catch (e) {
        console.error(e);
        res.status(500).send('Error cargando admin');
    }
});

app.post('/usuarios/:id/promover', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const r = await register.updateOne(
      { _id: req.params.id },
      { $set: { role: 'admin' } }
    );
    if (r.matchedCount === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario promovido a admin' });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al promover usuario' });
  }
});

// Opcion para eliminar data desde admin

// ANUNCIOS - eliminar
app.delete('/anuncios/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await anuncio.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Anuncio eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar anuncio' });
    }
});

// EVENTOS - eliminar
app.delete('/eventos/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await evento.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Evento eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar evento' });
    }
});

// REPORTES/QUEJAS - eliminar (misma colección)
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

// EMPRENDIMIENTOS - eliminar
app.delete('/emprendimientos/:id', requireAuth, requireRole('admin'), async (req, res) => {
    try {
        const r = await Emprendimiento.deleteOne({ _id: req.params.id });
        if (r.deletedCount === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ message: 'Emprendimiento eliminado' });
    } catch (e) {
        console.error(e); res.status(500).json({ error: 'Error al eliminar emprendimiento' });
    }
});

// OFERTAS - eliminar
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
