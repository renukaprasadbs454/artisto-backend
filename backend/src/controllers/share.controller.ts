import { Request, Response, NextFunction } from 'express';
import { prisma } from '../utils/prisma';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const generateOgHtml = (title: string, description: string, image: string, redirectUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    
    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="website">
    <meta property="og:url" content="${redirectUrl}">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    <meta property="og:image" content="${image}">

    <!-- Twitter -->
    <meta property="twitter:card" content="summary_large_image">
    <meta property="twitter:url" content="${redirectUrl}">
    <meta property="twitter:title" content="${title}">
    <meta property="twitter:description" content="${description}">
    <meta property="twitter:image" content="${image}">

    <!-- Meta Refresh Redirect for humans -->
    <meta http-equiv="refresh" content="0; url=${redirectUrl}">
</head>
<body>
    <p>Redirecting to <a href="${redirectUrl}">${title}</a>...</p>
    <script>
        window.location.href = "${redirectUrl}";
    </script>
</body>
</html>
`;

/**
 * GET /api/v1/share/profile/:username
 */
export async function shareProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.params.username as string;

    const user = await prisma.user.findUnique({
      where: { username },
      include: { profile: true }
    });

    if (!user?.profile) {
      res.status(404).send('Profile not found');
      return;
    }

    const { profile } = user;
    const title = `${profile.displayName} | Artisto Profile`;
    const description = profile.headline || `Check out ${profile.displayName}'s creative profile on Artisto.`;
    const image = profile.avatarUrl || `${FRONTEND_URL}/default-avatar.png`;
    const redirectUrl = `${FRONTEND_URL}/u/${username}`;

    res.send(generateOgHtml(title, description, image, redirectUrl));
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/share/actor/:username
 */
export async function shareActorProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const username = req.params.username as string;

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        profile: true,
        actorProfile: true
      }
    });

    if (!user?.profile || !user?.actorProfile) {
      res.status(404).send('Actor profile not found');
      return;
    }

    const { profile } = user;
    const title = `${profile.displayName} | Artisto Actor Profile`;
    const description = profile.headline || `View ${profile.displayName}'s acting portfolio on Artisto.`;
    const image = profile.avatarUrl || `${FRONTEND_URL}/default-avatar.png`;
    const redirectUrl = `${FRONTEND_URL}/actor/u/${username}`;

    res.send(generateOgHtml(title, description, image, redirectUrl));
  } catch (err) {
    next(err);
  }
}
