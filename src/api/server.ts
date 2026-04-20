import app from './app';
import { startScheduler } from '../shared/scheduler/cron.scheduler';

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`💚 Health check at http://localhost:${PORT}/health`);
});

if (process.env.NODE_ENV !== 'test') {
  startScheduler();
}
