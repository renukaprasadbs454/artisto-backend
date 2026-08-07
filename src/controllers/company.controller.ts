import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { OrderStatus } from '@prisma/client';
import { prisma } from '../utils/prisma';
import { uploadToStorage, deleteFromStorage } from '../services/storage.service';
import { ALLOWED_TRANSITIONS, TRANSITION_AUTHORIZATION } from '../utils/constants';

const link = z.string().url().or(z.literal('')).optional();
const companyFields = { name: z.string().trim().min(2).max(100), username: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,30}$/), description: z.string().max(3000).optional(), location: z.string().max(120).optional(), deliveryDetails: z.string().max(1000).optional(), websiteUrl: link, instagramUrl: link, portfolioUrl: link, services: z.array(z.object({ title: z.string().min(2).max(100), price: z.coerce.number().positive(), unit: z.string().max(30), description: z.string().max(500).optional() })).max(30).optional(), projects: z.array(z.object({ title: z.string().min(2).max(150), workUrl: link, description: z.string().max(1000).optional() })).max(50).optional() };
export const companySchema = z.object(companyFields);
export const updateCompanySchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9_-]{3,30}$/).optional(),
  description: z.string().max(3000).optional(),
  location: z.string().max(120).optional(),
  deliveryDetails: z.string().max(1000).optional(),
  websiteUrl: link,
  instagramUrl: link,
  portfolioUrl: link,
  services: z.array(z.object({ title: z.string().min(2).max(100), price: z.coerce.number().positive(), unit: z.string().max(30), description: z.string().max(500).optional() })).max(30).optional(),
  projects: z.array(z.object({ title: z.string().min(2).max(150), workUrl: link, description: z.string().max(1000).optional() })).max(50).optional(),
}).strict();
export const openingSchema = z.object({ title: z.string().min(2).max(150), location: z.string().max(120).optional(), schedule: z.string().max(100).optional(), duration: z.string().max(100).optional(), startTime: z.string().datetime().optional(), endTime: z.string().datetime().optional(), workType: z.string().max(100).optional(), salary: z.string().max(120).optional(), description: z.string().min(10).max(5000), responsibilities: z.string().max(3000).optional(), skillsRequired: z.array(z.string().max(80)).max(25).optional(), peopleRequired: z.coerce.number().int().min(1).max(1000).optional(), personalityDetails: z.string().max(2000).optional() });
export const applicationSchema = z.object({
  applicantName: z.string().trim().min(2, 'Your name is required.').max(100),
  portfolioUrl: z.string().trim().url('Enter a valid work or portfolio URL.').max(500),
  note: z.string().trim().max(1200).optional(),
}).strict();

export const companyApplicationStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
}).strict();
const include = { openings: { orderBy: { createdAt: 'desc' as const } }, owner: { select: { id: true, username: true, isVerified: true, profile: { select: { displayName: true, avatarUrl: true } } } } };
export async function list(req: Request, res: Response, next: NextFunction) { try { const q = String(req.query.q || ''); const data = await prisma.companyProfile.findMany({ where: q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }] } : undefined, include, orderBy: { createdAt: 'desc' } }); res.json({ data }); } catch (e) { next(e); } }
export async function checkUsername(req: Request, res: Response, next: NextFunction) { try { const username = String(req.query.username || '').trim().toLowerCase(); const valid = /^[a-z0-9_-]{3,30}$/.test(username); if (!valid) { res.json({ data: { username, valid: false, available: false } }); return; } const found = await prisma.companyProfile.findUnique({ where: { username }, select: { id: true } }); res.json({ data: { username, valid: true, available: !found } }); } catch (e) { next(e); } }
export async function get(req: Request, res: Response, next: NextFunction) { try { const data = await prisma.companyProfile.findUnique({ where: { username: String(req.params.username).toLowerCase() }, include }); if (!data) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found' } }); return; } res.json({ data }); } catch (e) { next(e); } }
export async function create(req: Request, res: Response, next: NextFunction) { try { const data = await prisma.companyProfile.create({ data: { ...req.body, ownerId: req.user!.userId }, include }); res.status(201).json({ data }); } catch (e) { next(e); } }
export async function update(req: Request, res: Response, next: NextFunction) { try { const company = await prisma.companyProfile.findUnique({ where: { id: String(req.params.id) }, select: { ownerId: true } }); if (!company || company.ownerId !== req.user!.userId) { res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this company' } }); return; } const data = await prisma.companyProfile.update({ where: { id: String(req.params.id) }, data: { ...req.body, ...(typeof req.body.username === 'string' ? { username: req.body.username.toLowerCase() } : {}) }, include }); res.json({ data }); } catch (e) { next(e); } }
export async function remove(req: Request, res: Response, next: NextFunction) { try { const company = await prisma.companyProfile.findUnique({ where: { id: String(req.params.id) }, select: { ownerId: true } }); if (!company || company.ownerId !== req.user!.userId) { res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this company' } }); return; } await prisma.companyProfile.delete({ where: { id: String(req.params.id) } }); res.json({ data: { success: true } }); } catch (e) { next(e); } }
export async function addOpening(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await prisma.companyProfile.findUnique({ where: { id: String(req.params.id) } });
    if (!company || company.ownerId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this company' } });
      return;
    }

    const payload: any = { ...req.body, companyId: company.id };
    if (req.body.startTime) payload.startTime = new Date(String(req.body.startTime));
    if (req.body.endTime) payload.endTime = new Date(String(req.body.endTime));

    const data = await prisma.companyOpening.create({ data: payload });
    res.status(201).json({ data });
  } catch (e) {
    next(e);
  }
}
export async function apply(req: Request, res: Response, next: NextFunction) { try { const opening = await prisma.companyOpening.findUnique({ where: { id: String(req.params.openingId) } }); if (!opening || !opening.isOpen) { res.status(404).json({ error: { code: 'NOT_FOUND', message: 'This hiring post is no longer open' } }); return; } const { applicantName, portfolioUrl, note } = req.body; const savedNote = `Name: ${applicantName}\nPortfolio: ${portfolioUrl}${note ? `\nNote: ${note}` : ''}`; const data = await prisma.companyApplication.create({ data: { openingId: opening.id, applicantId: req.user!.userId, note: savedNote, status: OrderStatus.PENDING } }); res.status(201).json({ data }); } catch (e: any) { if (e.code === 'P2002') { res.status(409).json({ error: { code: 'CONFLICT', message: 'You have already applied to this role' } }); return; } next(e); } }
export async function getApplicants(req: Request, res: Response, next: NextFunction) { try { const opening = await prisma.companyOpening.findUnique({ where: { id: String(req.params.openingId) }, include: { company: { select: { ownerId: true } } } }); if (!opening || opening.company.ownerId !== req.user!.userId) { res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this hiring post' } }); return; } const data = await prisma.companyApplication.findMany({ where: { openingId: opening.id }, orderBy: { createdAt: 'desc' }, include: { applicant: { select: { id: true, username: true, isVerified: true, profile: { select: { displayName: true, avatarUrl: true, headline: true, location: true } } } } } }); res.json({ data }); } catch (e) { next(e); } }

export async function updateApplicantStatus(req: Request, res: Response, next: NextFunction) {
  try {
    const openingId = String(req.params.openingId);
    const applicationId = String(req.params.applicationId);
    const userId = req.user!.userId;
    const { status: newStatus } = req.body as { status: OrderStatus };

    const application = await prisma.companyApplication.findUnique({
      where: { id: applicationId },
      include: {
        opening: { include: { company: true } },
      },
    });

    if (!application || application.opening.id !== openingId || application.opening.company.ownerId !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to update this application' } });
      return;
    }

    const currentStatus = application.status;
    const allowed = ALLOWED_TRANSITIONS[currentStatus];
    if (!allowed.includes(newStatus)) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: `Cannot transition from ${currentStatus} to ${newStatus}` } });
      return;
    }

    const transitionKey = `${currentStatus}->${newStatus}`;
    const authorizedSide = TRANSITION_AUTHORIZATION[transitionKey] || 'both';
    const isSeller = application.opening.company.ownerId === userId;
    const isBuyer = application.applicantId === userId;

    if (authorizedSide === 'buyer' && !isBuyer) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the applicant can perform this action' } });
      return;
    }

    if (authorizedSide === 'seller' && !isSeller) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only the hiring company owner can perform this action' } });
      return;
    }

    const updated = await prisma.companyApplication.update({
      where: { id: applicationId },
      data: { status: newStatus },
      include: {
        applicant: { select: { id: true, username: true, isVerified: true, profile: { select: { displayName: true, avatarUrl: true, headline: true, location: true } } } },
      },
    });

    res.status(200).json({ data: updated });
  } catch (e) {
    next(e);
  }
}

export async function convertApplicantToOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const openingId = String(req.params.openingId);
    const applicationId = String(req.params.applicationId);
    const userId = req.user!.userId;

    const application = await prisma.companyApplication.findUnique({
      where: { id: applicationId },
      include: {
        opening: { include: { company: true } },
      },
    });

    if (!application || application.opening.id !== openingId || application.opening.company.ownerId !== userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to convert this application' } });
      return;
    }

    const existingOrder = await prisma.order.findFirst({
      where: { openingId: application.openingId, buyerId: application.applicantId },
    });

    if (existingOrder) {
      await prisma.companyApplication.delete({ where: { id: application.id } });
      res.status(200).json({ data: existingOrder });
      return;
    }

    const order = await prisma.order.create({
      data: {
        openingId: application.openingId,
        buyerId: application.applicantId,
        sellerId: userId,
        status: OrderStatus.PENDING,
        requirements: application.note || undefined,
      },
      include: {
        opening: {
          include: {
            company: {
              include: {
                page: { select: { id: true, name: true } },
              },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true, headline: true, location: true } },
          },
        },
        conversation: { select: { id: true } },
      },
    });

    await prisma.companyApplication.delete({ where: { id: application.id } });

    res.status(201).json({ data: order });
  } catch (e) {
    next(e);
  }
}

export async function deleteApplicant(req: Request, res: Response, next: NextFunction) { try { const application = await prisma.companyApplication.findUnique({ where: { id: String(req.params.applicationId) }, include: { opening: { include: { company: { select: { ownerId: true } } } } } }); if (!application || application.opening.id !== String(req.params.openingId) || application.opening.company.ownerId !== req.user!.userId) { res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not have permission to delete this application' } }); return; } await prisma.companyApplication.delete({ where: { id: application.id } }); res.json({ data: { success: true } }); } catch (e) { next(e); } }

export async function uploadBanner(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await prisma.companyProfile.findUnique({ where: { id: String(req.params.id) }, select: { ownerId: true } });
    if (!company || company.ownerId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this company' } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No banner image uploaded' } });
      return;
    }
    const uploaded = await uploadToStorage(req.file, `company-banners/${req.params.id}`);
    const bannerUrl = String((uploaded as any).url);
    await prisma.companyProfile.update({ where: { id: String(req.params.id) }, data: { bannerUrl } as any });
    res.json({ data: { bannerUrl } });
  } catch (e) {
    next(e);
  }
}

export async function uploadAvatar(req: Request, res: Response, next: NextFunction) {
  try {
    const company = await prisma.companyProfile.findUnique({ where: { id: String(req.params.id) }, select: { ownerId: true } });
    if (!company || company.ownerId !== req.user!.userId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this company' } });
      return;
    }
    if (!req.file) {
      res.status(400).json({ error: { code: 'BAD_REQUEST', message: 'No avatar image uploaded' } });
      return;
    }
    const uploaded = await uploadToStorage(req.file, `company-avatars/${req.params.id}`);
    const avatarUrl = String((uploaded as any).url);
    await prisma.companyProfile.update({ where: { id: String(req.params.id) }, data: { avatarUrl } as any });
    res.json({ data: { avatarUrl } });
  } catch (e) {
    next(e);
  }
}