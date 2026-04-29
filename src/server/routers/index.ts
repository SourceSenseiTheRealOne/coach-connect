import { router } from '../trpc';
import { authRouter } from './auth';
import { profileRouter } from './profile';
import { exerciseRouter } from './exercise';
import { plannerRouter } from './planner';
import { tacticBoardRouter } from './tacticBoard';
import { feedRouter } from './feed';
import { connectionRouter } from './connection';
import { messagingRouter } from './messaging';
import { jobsRouter } from './jobs';
import { forumRouter } from './forum';
import { matchesRouter } from './matches';
import { matchMakerRouter } from './matchMaker';
import { marketplaceRouter } from './marketplace';
import { notificationsRouter } from './notifications';
import { uploadRouter } from './upload';
import { clubRouter } from './club';
import { subscriptionRouter } from './subscription';

export const appRouter = router({
    auth: authRouter,
    profile: profileRouter,
    exercise: exerciseRouter,
    planner: plannerRouter,
    tacticBoard: tacticBoardRouter,
    feed: feedRouter,
    connection: connectionRouter,
    messaging: messagingRouter,
    jobs: jobsRouter,
    forum: forumRouter,
    matches: matchesRouter,
    matchMaker: matchMakerRouter,
    marketplace: marketplaceRouter,
    notifications: notificationsRouter,
    upload: uploadRouter,
    club: clubRouter,
    subscription: subscriptionRouter,
});

export type AppRouter = typeof appRouter;