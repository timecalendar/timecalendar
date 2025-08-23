# TimeCalendar Web

This is the web component of TimeCalendar, built with [Next.js](https://nextjs.org/). The web project serves two main purposes:

1. **Landing Page**: A public-facing website to showcase TimeCalendar features and information
2. **Assistant WebViews**: Interactive web interfaces embedded within the mobile app for:
   - Assistant to help users select the right school groups
   - Tutorial to guide users through importing calendars from school systems

## Getting Started

First, install dependencies:

```bash
npm install
```

Copy the environment configuration file:

```bash
cp .env.local.sample .env.local
```

Then, run the development server:

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the landing page.

## Project Structure

- `/pages` - Next.js pages and API routes
  - `/assistants` - WebView pages for mobile app integration
  - `index.tsx` - Landing page
- `/modules` - Feature modules
  - `/assistant` - Assistant functionality for group selection
  - `/home` - Landing page components
  - `/shared` - Shared components and utilities

## WebView Integration

The assistant pages are designed to be embedded as WebViews in the TimeCalendar mobile app. These provide rich, interactive experiences for:

- **Group Selection Assistant** (`/assistants/[assistantName]`): Helps users identify and select their correct school groups
- **Calendar Import Tutorial**: Step-by-step guidance for importing school calendars

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial

## Deployment

The web application is deployed using Docker and Kubernetes. See the main project README for deployment instructions.
