import Notice from '../models/Notice.js';

export const createNotice = async (req, res, next) => {
  try {
    const notice = await Notice.create({
      ...req.body,
      author: req.user._id
    });
    res.status(201).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const getNotices = async (req, res, next) => {
  try {
    const role = req.user.role;
    
    // Principals see all notices, others see notices targeted to them
    let query = { isActive: true };
    if (role !== 'principal') {
        query.targetRoles = { $in: [role, 'all'] };
    }

    const notices = await Notice.find(query)
      .populate('author', 'name profileImage')
      .sort({ isPinned: -1, createdAt: -1 });

    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    next(error);
  }
};

export const getNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id).populate('author', 'name profileImage');
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const updateNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};

export const deleteNotice = async (req, res, next) => {
  try {
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });
    res.status(200).json({ success: true, message: 'Notice deleted' });
  } catch (error) {
    next(error);
  }
};

export const togglePin = async (req, res, next) => {
  try {
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: 'Notice not found' });

    notice.isPinned = !notice.isPinned;
    await notice.save();
    
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    next(error);
  }
};
