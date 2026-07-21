import { Router } from 'express';
import authRoutes from './auth.routes';
import profileRoutes from './profile.routes';
import listingRoutes from './listing.routes';
import orderRoutes from './order.routes';
import portfolioRoutes from './portfolio.routes';
import conversationRoutes from './conversation.routes';
import dashboardRoutes from './dashboard.routes';
import postRoutes from './post.routes';
import actorRoutes from './actor.routes';
import paymentRoutes from './payment.routes';
import moviesRoutes from './movies.routes';
import shareRoutes from './share.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/listings', listingRoutes);
router.use('/orders', orderRoutes);
router.use('/portfolio', portfolioRoutes);
router.use('/conversations', conversationRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/posts', postRoutes);
router.use('/actor', actorRoutes);
router.use('/payments', paymentRoutes);
router.use('/movies', moviesRoutes);
router.use('/share', shareRoutes);
router.use('/admin', adminRoutes);

export default router;
