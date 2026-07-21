import { Profile } from '@prisma/client';

export function isProfileComplete(profile: Profile | null): boolean {
  if (!profile) return false;
  return Boolean(
    profile.displayName &&
    profile.avatarUrl &&
    profile.bio &&
    profile.location &&
    profile.skills.length > 0
  );
}
