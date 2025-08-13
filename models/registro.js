const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '10', 10);

const registerSchema = new mongoose.Schema({
  name:      { type: String, required: true },
  cellphone: { type: String, required: true },
  user:      { type: String, required: true, unique: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:  { type: String, required: true, select: false },
  role:      { type: String, enum: ['ciudadano','emprendedor','admin'], default: 'ciudadano', index: true }
}, { versionKey:false, timestamps:true });

registerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  next();
});

registerSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password);
};

module.exports = mongoose.model('Registro', registerSchema);
