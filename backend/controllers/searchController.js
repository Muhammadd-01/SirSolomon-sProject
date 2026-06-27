import Teacher from '../models/Teacher.js';

export const globalSearch = async (req, res, next) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }

    const regex = new RegExp(query, 'i');

    const teachers = await Teacher.find({
      $or: [{ fullName: regex }, { department: regex }, { subjects: { $in: [regex] } }]
    }).limit(5).select('fullName department profileImage');

    res.status(200).json({
      success: true,
      data: {
        teachers
      }
    });
  } catch (error) {
    next(error);
  }
};
