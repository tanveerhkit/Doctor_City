# Doctor City

## Overview

Doctor City is a full-stack civic issue reporting platform for connecting residents with local administrators. Citizens can report community problems, attach locations and images, follow progress, and support reports, while administrative views provide issue-management workflows.

## Features

- Civic issue submission, browsing, status tracking, and upvoting
- User authentication, profiles, and role-aware routes
- Location-based experiences built with Leaflet
- Image upload support through the backend
- Administrative issue and contributor views
- Civic education quizzes, resources, and an interactive civic simulator
- Frontend, backend, and end-to-end test tooling

## Tech Stack

- React 18, React Router, Tailwind CSS, and Leaflet
- Node.js and Express
- Mongoose models with MongoDB-oriented test infrastructure
- JWT authentication, Multer, Cloudinary, Swagger, and security middleware
- Vitest, Jest, Supertest, MongoDB Memory Server, and Cypress

## Getting Started

Install and start the backend:

```bash
cd backend
npm install
npm run dev
```

In a second terminal, install and start the React frontend from the repository root:

```bash
npm install
npm start
```

Use the provided `.env.example` files to identify required variable names. Supply your own local values and keep credentials out of version control.

## Testing

```bash
cd backend
npm test
```

From the repository root, use `npm test` for frontend tests or `npm run cypress:open` for the Cypress runner.

## License

The project is distributed under the MIT License; see `LICENSE`.
