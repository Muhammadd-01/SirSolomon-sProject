import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Teacher from '../models/Teacher.js';
import Student from '../models/Student.js';
import Class from '../models/Class.js';
import Subject from '../models/Subject.js';
import Settings from '../models/Settings.js';
import { connectDB } from '../config/db.js';

dotenv.config();

await connectDB();

const importData = async () => {
  try {
    await User.deleteMany();
    await Teacher.deleteMany();
    await Student.deleteMany();
    await Class.deleteMany();
    await Subject.deleteMany();
    await Settings.deleteMany();

    const createdPrincipal = await User.create({
      name: 'Admin Principal',
      email: 'principal@school.com',
      password: 'Password123',
      role: 'principal'
    });

    await Settings.create({
      schoolName: 'Greenwood Academy',
      address: '123 Education Lane, City',
      phone: '+923001234567',
      email: 'info@greenwood.edu'
    });

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`${error}`);
    process.exit(1);
  }
};

if (process.argv[2] === '-d') {
  console.log('Destroy data not implemented');
  process.exit();
} else {
  importData();
}
