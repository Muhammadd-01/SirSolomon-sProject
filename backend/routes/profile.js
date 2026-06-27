import express from 'express';
import { getProfile, updateProfile, changePassword, uploadProfileImage } from '../controllers/profileController.js';
import { protect } from '../middlewares/auth.js';
import upload from '../middlewares/upload.js';

const router = express.Router();

router.use(protect);

router.route('/')
  .get(getProfile)
  .put(updateProfile);

router.put('/password', changePassword);
router.post('/upload', upload.single('image'), uploadProfileImage);

export default router;
