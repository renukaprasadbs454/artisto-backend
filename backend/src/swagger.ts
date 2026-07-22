export const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'Artisto API Documentation',
    version: '1.0.0',
    description: 'Interactive Swagger UI for testing all Artisto platform API endpoints.',
    contact: {
      name: 'Artisto Support',
      url: 'https://github.com/renukaprasadbs454/artisto-backend',
    },
  },
  servers: [
    {
      url: 'http://localhost:4000/api/v1',
      description: 'Local Development Server (API v1)',
    },
    {
      url: 'http://localhost:4000',
      description: 'Root Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Enter your JWT access token (obtained from /auth/login or /auth/register).',
      },
    },
  },
  security: [
    {
      bearerAuth: [],
    },
  ],
  tags: [
    { name: 'Auth', description: 'Authentication and User session management' },
    { name: 'Profiles', description: 'User Profile details, avatar/banner uploads, and roles' },
    { name: 'Actors', description: 'Actor discovery, film credits, and availability' },
    { name: 'Listings', description: 'Casting calls, marketplace services, and opportunity listings' },
    { name: 'Orders', description: 'Recruiter applications, order status management, and pitching' },
    { name: 'Payments', description: 'Razorpay order creation and payment signature verification' },
    { name: 'Conversations', description: 'Real-time messaging, inbox, and chat history' },
    { name: 'Posts & Feed', description: 'Social feed posts, likes, and comments' },
    { name: 'Portfolio', description: 'Actor & Creator showcase portfolio items and media' },
    { name: 'Dashboard', description: 'Recruiter/Seller analytics, revenue, and stats' },
    { name: 'Admin', description: 'Moderation portal, user suspension, and system stats' },
    { name: 'Health', description: 'Service health and status checks' },
  ],
  paths: {
    '/': {
      get: {
        tags: ['Health'],
        summary: 'Root API Welcome',
        responses: {
          '200': { description: 'API status message' },
        },
      },
    },
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'System Health Check',
        responses: {
          '200': { description: 'Status OK' },
        },
      },
    },

    // ─── AUTH ─────────────────────────────────────────────────────────────
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'email', 'password', 'displayName'],
                properties: {
                  username: { type: 'string', example: 'alex_actor' },
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'password123' },
                  displayName: { type: 'string', example: 'Alex Smith' },
                  role: { type: 'string', enum: ['BUYER', 'SELLER'], default: 'SELLER' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User created successfully' },
          '409': { description: 'Email or username already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in with credentials',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'alex@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful, returns tokens and user data' },
          '401': { description: 'Invalid email or password' },
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Refresh access token using HTTP-only cookie',
        responses: {
          '200': { description: 'New access token issued' },
          '401': { description: 'Invalid or expired refresh token' },
        },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        summary: 'Log out and clear refresh token cookie',
        responses: {
          '200': { description: 'Logged out successfully' },
        },
      },
    },
    '/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Get current authenticated user profile',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Authenticated user details' },
          '401': { description: 'Unauthorized' },
        },
      },
    },

    // ─── PROFILES ──────────────────────────────────────────────────────────
    '/profiles/me': {
      patch: {
        tags: ['Profiles'],
        summary: 'Update current user profile info',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  displayName: { type: 'string', example: 'Alex Smith' },
                  headline: { type: 'string', example: 'Professional Method Actor & Voice Artist' },
                  bio: { type: 'string', example: '5 years experience in theatre and feature films.' },
                  location: { type: 'string', example: 'Mumbai, India' },
                  skills: { type: 'array', items: { type: 'string' }, example: ['Improv', 'Stunts', 'Voiceover'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Profile updated' },
        },
      },
    },
    '/profiles/role': {
      patch: {
        tags: ['Profiles'],
        summary: 'Switch user role (BUYER / SELLER)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['role'],
                properties: {
                  role: { type: 'string', enum: ['BUYER', 'SELLER'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Role updated, fresh access token returned' },
        },
      },
    },
    '/profiles/{userId}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get user profile by User ID (Public)',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Profile details' },
          '404': { description: 'User profile not found' },
        },
      },
    },
    '/profiles/u/{username}': {
      get: {
        tags: ['Profiles'],
        summary: 'Get user profile by Username (Public)',
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Profile details' },
          '404': { description: 'Username not found' },
        },
      },
    },

    // ─── ACTORS ────────────────────────────────────────────────────────────
    '/actor': {
      get: {
        tags: ['Actors'],
        summary: 'Browse / search actors directory (Public)',
        parameters: [
          { name: 'q', in: 'query', schema: { type: 'string' }, description: 'Search keyword (name/location)' },
          { name: 'location', in: 'query', schema: { type: 'string' } },
          { name: 'availability', in: 'query', schema: { type: 'string', enum: ['AVAILABLE', 'BUSY', 'NOT_LOOKING'] } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
        ],
        responses: {
          '200': { description: 'List of actor profiles with pagination' },
        },
      },
    },
    '/actor/u/{username}': {
      get: {
        tags: ['Actors'],
        summary: 'Get actor profile & film credits by username (Public)',
        parameters: [
          { name: 'username', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Actor profile & film credits' },
          '404': { description: 'Actor not found' },
        },
      },
    },
    '/actor/me': {
      post: {
        tags: ['Actors'],
        summary: 'Upsert actor profile availability status',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  availabilityStatus: { type: 'string', enum: ['AVAILABLE', 'BUSY', 'NOT_LOOKING'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Actor profile updated' },
        },
      },
    },

    // ─── LISTINGS ──────────────────────────────────────────────────────────
    '/listings': {
      get: {
        tags: ['Listings'],
        summary: 'Browse active marketplace listings / casting calls (Public)',
        parameters: [
          { name: 'category', in: 'query', schema: { type: 'string' } },
          { name: 'minPrice', in: 'query', schema: { type: 'number' } },
          { name: 'maxPrice', in: 'query', schema: { type: 'number' } },
          { name: 'q', in: 'query', schema: { type: 'string' } },
          { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 10 } },
        ],
        responses: {
          '200': { description: 'List of listings' },
        },
      },
      post: {
        tags: ['Listings'],
        summary: 'Create a new listing (SELLER role required)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['title', 'description', 'category', 'price', 'deliveryDays'],
                properties: {
                  title: { type: 'string', example: 'Lead Actor for Short Film' },
                  description: { type: 'string', example: 'Looking for male actor aged 25-30 for drama short film.' },
                  category: { type: 'string', example: 'Acting' },
                  price: { type: 'number', example: 5000 },
                  deliveryDays: { type: 'integer', example: 7 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Listing created' },
        },
      },
    },
    '/listings/{id}': {
      get: {
        tags: ['Listings'],
        summary: 'Get listing details by ID (Public)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Listing details' },
          '404': { description: 'Listing not found' },
        },
      },
      delete: {
        tags: ['Listings'],
        summary: 'Delete listing (Owner only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Listing deleted' },
          '409': { description: 'Cannot delete listing with active orders' },
        },
      },
    },

    // ─── ORDERS ────────────────────────────────────────────────────────────
    '/orders': {
      get: {
        tags: ['Orders'],
        summary: 'List orders / applications for authenticated user',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'role', in: 'query', schema: { type: 'string', enum: ['BUYER', 'SELLER'] } },
          { name: 'status', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Orders list' },
        },
      },
      post: {
        tags: ['Orders'],
        summary: 'Apply for a casting call / order a listing',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['listingId'],
                properties: {
                  listingId: { type: 'string' },
                  requirements: { type: 'string', example: 'Pitch: Excited for this role!' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Order created' },
        },
      },
    },
    '/orders/{id}/status': {
      patch: {
        tags: ['Orders'],
        summary: 'Update application / order status (ACCEPT, DECLINE, COMPLETE)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['status'],
                properties: {
                  status: { type: 'string', enum: ['IN_PROGRESS', 'ACCEPTED', 'COMPLETED', 'CANCELLED', 'DECLINED'] },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Order status updated' },
        },
      },
    },

    // ─── PAYMENTS ──────────────────────────────────────────────────────────
    '/payments/create-order': {
      post: {
        tags: ['Payments'],
        summary: 'Create a Razorpay order for subscription or escrow',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['paymentType'],
                properties: {
                  paymentType: { type: 'string', enum: ['SUBSCRIPTION', 'ORDER_ESCROW'] },
                  plan: { type: 'string', enum: ['PRO', 'AGENCY'] },
                  listingId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Razorpay order & payment record created' },
        },
      },
    },
    '/payments/verify': {
      post: {
        tags: ['Payments'],
        summary: 'Verify Razorpay payment HMAC signature',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['razorpay_order_id', 'razorpay_payment_id', 'razorpay_signature', 'paymentId'],
                properties: {
                  razorpay_order_id: { type: 'string' },
                  razorpay_payment_id: { type: 'string' },
                  razorpay_signature: { type: 'string' },
                  paymentId: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Payment verified & subscription activated' },
          '400': { description: 'Invalid signature or mismatch' },
        },
      },
    },

    // ─── CONVERSATIONS ─────────────────────────────────────────────────────
    '/conversations': {
      get: {
        tags: ['Conversations'],
        summary: 'Get conversations inbox for current user',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Inbox conversations with unread badge count' },
        },
      },
    },

    // ─── POSTS & FEED ──────────────────────────────────────────────────────
    '/posts': {
      get: {
        tags: ['Posts & Feed'],
        summary: 'Get activity feed posts (Public)',
        responses: {
          '200': { description: 'List of posts with author details and like counts' },
        },
      },
      post: {
        tags: ['Posts & Feed'],
        summary: 'Create a new feed post',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['content'],
                properties: {
                  content: { type: 'string', example: 'Wrapped up filming for the new sci-fi project! 🎬' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Post created' },
        },
      },
    },
    '/posts/{id}/like': {
      post: {
        tags: ['Posts & Feed'],
        summary: 'Toggle like / unlike on a post',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Like toggled' },
        },
      },
    },

    // ─── DASHBOARD ─────────────────────────────────────────────────────────
    '/dashboard/stats': {
      get: {
        tags: ['Dashboard'],
        summary: 'Get Recruiter / Creator dashboard analytics',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Dashboard metrics & recent applications' },
        },
      },
    },

    // ─── ADMIN ─────────────────────────────────────────────────────────────
    '/admin/stats': {
      get: {
        tags: ['Admin'],
        summary: 'Get platform-wide admin statistics (Admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Total users, listings, orders, and revenue' },
          '403': { description: 'Forbidden — Admin role required' },
        },
      },
    },
    '/admin/users/{identifier}/suspend': {
      patch: {
        tags: ['Admin'],
        summary: 'Suspend / unsuspend user by Username, Email, or UUID (Admin only)',
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'identifier', in: 'path', required: true, schema: { type: 'string' }, description: 'Username, Email, or UUID' },
        ],
        responses: {
          '200': { description: 'User suspension status updated' },
        },
      },
    },
  },
};
