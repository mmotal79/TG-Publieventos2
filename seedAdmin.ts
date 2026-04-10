import mongoose from 'mongoose';
import User from './src/models/User.model.js';

const MONGODB_URI = "mongodb+srv://mmotal:mmotal5379@cluster0.lcdpyvx.mongodb.net/uniformes_db?appName=Cluster0";

async function seed() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');
    
    const email = 'mmotal@gmail.com';
    let user = await User.findOne({ email });
    
    if (!user) {
      user = new User({
        nombre: 'Admin Principal',
        email: email,
        rol: 0,
        estado: 'Activo',
        salarioBaseUSD: 0,
        porcentajeComision: 0
      });
      await user.save();
      console.log('✅ Admin user created successfully.');
    } else {
      user.rol = 0;
      await user.save();
      console.log('✅ Admin user already exists, ensured role is 0 (Admin).');
    }
  } catch (error) {
    console.error('❌ Error seeding admin user:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

seed();
