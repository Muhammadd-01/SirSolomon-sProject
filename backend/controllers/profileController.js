import User from '../models/User.js';
import Teacher from '../models/Teacher.js';

export const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    let profileData = null;

    if (user.role === 'teacher') {
      profileData = await Teacher.findOne({ user: user._id });
    }

    res.status(200).json({ success: true, data: { user, profile: profileData } });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    // Basic user updates
    const userUpdates = {};
    if (req.body.name) userUpdates.name = req.body.name;
    
    // Only allow updating these fields through this route
    const user = await User.findByIdAndUpdate(req.user._id, userUpdates, { new: true }).select('-password');

    let profileData = null;
    if (user.role === 'teacher') {
      profileData = await Teacher.findOneAndUpdate({ user: user._id }, req.body, { new: true });
    }

    res.status(200).json({ success: true, data: { user, profile: profileData } });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);

    if (!(await user.matchPassword(currentPassword))) {
      return res.status(401).json({ success: false, message: 'Incorrect current password' });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    next(error);
  }
};

export const uploadProfileImage = async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'Please upload a file' });
        }

        const imagePath = `/uploads/${req.file.filename}`;
        
        await User.findByIdAndUpdate(req.user._id, { profileImage: imagePath });

        if (req.user.role === 'teacher') {
            await Teacher.findOneAndUpdate({ user: req.user._id }, { profileImage: imagePath });
        }

        res.status(200).json({ success: true, data: imagePath, message: 'Image uploaded successfully' });
    } catch (error) {
        next(error);
    }
};
