# Artisto Backend

This is the backend for Artisto, a freelance services marketplace. It is a Node.js application built with Express, TypeScript, and Prisma.

## Getting Started

These instructions will get you a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later recommended)
- [npm](https://www.npmjs.com/)
- A running PostgreSQL database

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/renukaprasadbs454/artisto-backend.git
    cd artisto-backend/backend
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up environment variables:**
    Create a `.env` file in the `backend` directory and add the necessary environment variables. You can use `.env.example` as a template.
    ```bash
    cp .env.example .env
    ```
    You will need to fill in your database connection string and other secrets.

4.  **Run database migrations:**
    ```bash
    npm run prisma:migrate
    ```

5.  **Seed the database (optional):**
    If you want to populate your database with initial data, run:
    ```bash
    npm run prisma:seed
    ```

## Available Scripts

In the project directory, you can run:

-   `npm run dev`: Runs the app in development mode using `ts-node-dev`.
-   `npm run build`: Compiles the TypeScript code to JavaScript.
-   `npm run start`: Starts the compiled app.
-   `npm run test`: Runs the test suite using `vitest`.
-   `npm run prisma:generate`: Generates the Prisma client.
-   `npm run prisma:migrate`: Applies database migrations.
-   `npm run prisma:studio`: Opens the Prisma Studio to view and edit your data.
-   `npm run prisma:seed`: Seeds the database.
-   `npm run create-admin`: Runs a script to create a new admin user.

## API Endpoints

The API routes are defined in `src/routes`. Here is a brief overview:

-   `/api/auth`: Authentication routes (login, register)
-   `/api/actors`: Actor-related routes
-   `/api/admin`: Admin-only routes
-   `/api/conversations`: Messaging and conversation routes
-   `/api/dashboard`: User dashboard routes
-   `/api/listings`: Service listing routes
-   `/api/movies`: Movie-related routes
-   `/api/orders`: Order management routes
-   `/api/payments`: Payment processing routes
-   `/api/portfolio`: User portfolio routes
-   `/api/posts`: Post and social routes
-   `/api/profile`: User profile management
-   `/api/share`: Sharing routes

For more details, the API is documented with Swagger. Once the server is running, you can access the Swagger UI at `/api-docs`.

## Technologies Used

-   **[Node.js](https://nodejs.org/)**: JavaScript runtime environment
-   **[Express](https://expressjs.com/)**: Web framework for Node.js
-   **[TypeScript](https://www.typescriptlang.org/)**: Typed superset of JavaScript
-   **[Prisma](https://www.prisma.io/)**: Next-generation ORM for Node.js and TypeScript
-   **[PostgreSQL](https://www.postgresql.org/)**: Open source object-relational database
-   **[Socket.IO](https://socket.io/)**: For real-time communication (e.g., messaging)
-   **[Zod](https://zod.dev/)**: TypeScript-first schema validation
-   **[JWT](https://jwt.io/)**: For authentication
-   **[Swagger](https://swagger.io/)**: For API documentation
-   **[Vitest](https://vitest.dev/)**: For unit and integration testing