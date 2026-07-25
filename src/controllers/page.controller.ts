import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

// ─── Zod Schemas ────────────────────────────────────────────────────

export const createPageSchema = z.object({
  name: z.string().min(2, 'Page name must be at least 2 characters').max(100),
  description: z.string().max(2000).optional(),
  logoUrl: z.string().url('Invalid logo URL').or(z.string().length(0)).optional(),
  bannerUrl: z.string().url('Invalid banner URL').or(z.string().length(0)).optional(),
});

export const updatePageSchema = createPageSchema.partial();

export const createCompanySchema = z.object({
  name: z.string().min(2, 'Company name must be at least 2 characters').max(100),
  industry: z.string().max(100).optional(),
  logoUrl: z.string().url('Invalid logo URL').or(z.string().length(0)).optional(),
  websiteUrl: z.string().url('Invalid website URL').or(z.string().length(0)).optional(),
  isRecruitmentOpen: z.boolean().optional(),
});

export const updateCompanySchema = createCompanySchema.partial();

export const createOpeningSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(150),
  roleCategory: z.string().min(2).max(100),
  description: z.string().min(10, 'Description must be at least 10 characters').max(5000),
  location: z.string().max(100).optional(),
  salaryRange: z.string().max(100).optional(),
  isOpen: z.boolean().optional(),
});

export const updateOpeningSchema = createOpeningSchema.partial();

// ─── Controllers ────────────────────────────────────────────────────

/**
 * POST /pages
 * Create a new Recruiter Page (e.g., Paramount Media Group).
 */
export async function createPage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const { name, description, logoUrl, bannerUrl } = req.body;

    const page = await prisma.recruiterPage.create({
      data: {
        ownerId,
        name,
        description: description || null,
        logoUrl: logoUrl || null,
        bannerUrl: bannerUrl || null,
      },
      include: {
        companies: {
          include: { openings: true },
        },
      },
    });

    res.status(201).json({ data: page });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /pages
 * List all public Recruiter Pages with company & opening counts.
 */
export async function getPages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const q = req.query.q as string | undefined;

    const pages = await prisma.recruiterPage.findMany({
      where: q ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        companies: {
          include: {
            openings: true,
          },
        },
      },
    });

    res.status(200).json({ data: pages });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /pages/my
 * List pages owned by the authenticated recruiter.
 */
export async function getMyPages(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;

    const pages = await prisma.recruiterPage.findMany({
      where: { ownerId },
      orderBy: { createdAt: 'desc' },
      include: {
        companies: {
          include: {
            openings: true,
          },
        },
      },
    });

    res.status(200).json({ data: pages });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /pages/:id
 * Get single page with full company & opening details.
 */
export async function getPage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const id = req.params.id as string;

    const page = await prisma.recruiterPage.findUnique({
      where: { id },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            profile: { select: { displayName: true, avatarUrl: true } },
          },
        },
        companies: {
          include: {
            openings: { orderBy: { createdAt: 'desc' } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!page) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Recruiter page not found' } });
      return;
    }

    res.status(200).json({ data: page });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /pages/:id
 * Update page details (Owner only).
 */
export async function updatePage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.recruiterPage.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found' } });
      return;
    }

    if (existing.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    const page = await prisma.recruiterPage.update({
      where: { id },
      data: req.body,
      include: {
        companies: { include: { openings: true } },
      },
    });

    res.status(200).json({ data: page });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /pages/:id
 * Delete a page (Owner only).
 */
export async function deletePage(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const id = req.params.id as string;

    const existing = await prisma.recruiterPage.findUnique({ where: { id } });

    if (!existing) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found' } });
      return;
    }

    if (existing.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    await prisma.recruiterPage.delete({ where: { id } });

    res.status(200).json({ data: { message: 'Page deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /pages/:id/companies
 * Add a company under a Recruiter Page (Owner only).
 */
export async function addCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const pageId = req.params.id as string;

    const page = await prisma.recruiterPage.findUnique({ where: { id: pageId } });

    if (!page) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Page not found' } });
      return;
    }

    if (page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    const { name, industry, logoUrl, websiteUrl, isRecruitmentOpen } = req.body;

    const company = await prisma.recruiterCompany.create({
      data: {
        pageId,
        name,
        industry: industry || null,
        logoUrl: logoUrl || null,
        websiteUrl: websiteUrl || null,
        isRecruitmentOpen: isRecruitmentOpen ?? true,
      },
      include: { openings: true },
    });

    res.status(201).json({ data: company });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /pages/companies/:companyId
 * Update company info or toggle recruitment status (Owner only).
 */
export async function updateCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const companyId = req.params.companyId as string;

    const company = await prisma.recruiterCompany.findUnique({
      where: { id: companyId },
      include: { page: true },
    });

    if (!company) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    if (company.page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    const updated = await prisma.recruiterCompany.update({
      where: { id: companyId },
      data: req.body,
      include: { openings: true },
    });

    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /pages/companies/:companyId
 * Remove a company (Owner only).
 */
export async function deleteCompany(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const companyId = req.params.companyId as string;

    const company = await prisma.recruiterCompany.findUnique({
      where: { id: companyId },
      include: { page: true },
    });

    if (!company) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    if (company.page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    await prisma.recruiterCompany.delete({ where: { id: companyId } });

    res.status(200).json({ data: { message: 'Company deleted successfully' } });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /pages/companies/:companyId/openings
 * Add a job/role opening for a company (Owner only).
 */
export async function addOpening(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const companyId = req.params.companyId as string;

    const company = await prisma.recruiterCompany.findUnique({
      where: { id: companyId },
      include: { page: true },
    });

    if (!company) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Company not found' } });
      return;
    }

    if (company.page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    const { title, roleCategory, description, location, salaryRange, isOpen } = req.body;

    const opening = await prisma.recruiterOpening.create({
      data: {
        companyId,
        title,
        roleCategory,
        description,
        location: location || null,
        salaryRange: salaryRange || null,
        isOpen: isOpen ?? true,
      },
    });

    res.status(201).json({ data: opening });
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /pages/openings/:openingId
 * Update opening info or toggle status (Owner only).
 */
export async function updateOpening(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const openingId = req.params.openingId as string;

    const opening = await prisma.recruiterOpening.findUnique({
      where: { id: openingId },
      include: { company: { include: { page: true } } },
    });

    if (!opening) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Opening not found' } });
      return;
    }

    if (opening.company.page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    const updated = await prisma.recruiterOpening.update({
      where: { id: openingId },
      data: req.body,
    });

    res.status(200).json({ data: updated });
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /pages/openings/:openingId
 * Remove an opening (Owner only).
 */
export async function deleteOpening(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const ownerId = req.user!.userId;
    const openingId = req.params.openingId as string;

    const opening = await prisma.recruiterOpening.findUnique({
      where: { id: openingId },
      include: { company: { include: { page: true } } },
    });

    if (!opening) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Opening not found' } });
      return;
    }

    if (opening.company.page.ownerId !== ownerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this page' } });
      return;
    }

    await prisma.recruiterOpening.delete({ where: { id: openingId } });

    res.status(200).json({ data: { message: 'Opening deleted successfully' } });
  } catch (err) {
    next(err);
  }
}
