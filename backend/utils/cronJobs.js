import cron from 'node-cron';
import Notification from '../models/Notification.js';
import User from '../models/User.js';

export const initCronJobs = () => {
  // Run daily at 23:59
  cron.schedule('59 23 * * *', async () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    // If tomorrow is the 1st of the month, today is the last day of the month
    if (tomorrow.getDate() === 1) {
      console.log('Last day of the month detected. Generating month-end notifications...');
      
      try {
        const principals = await User.find({ role: 'principal' });
        
        const notifications = principals.map(principal => ({
          user: principal._id,
          title: 'Month-End Reports Ready',
          message: 'Attendance and Salary processing is complete for this month. Please generate and download the system reports.',
          type: 'info',
          link: '/reports'
        }));

        if (notifications.length > 0) {
          await Notification.insertMany(notifications);
          console.log(`Successfully created month-end notifications for ${principals.length} principals.`);
        }
      } catch (error) {
        console.error('Failed to generate month-end notifications:', error);
      }
    }
  });
  console.log('✅ Cron jobs initialized.');
};
