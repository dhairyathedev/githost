# GitHost Repository README

## Overview

GitHost is a platform designed to streamline the deployment and management of web applications using Next.js, Supabase, and Cloudflare Workers. This repository contains the source code for the frontend, backend, and Cloudflare Worker components.

## Components

### 1. Frontend (www)

- **Framework**: Next.js
- **Styling**: Tailwind CSS
- **Environment Variables**: Managed via `.env.local`
- **Development**: 
  - To start the development server, run:
    ```bash
    npm run dev
    ```
  - The application will be available at [localhost:3000](http://localhost:3000).

### 2. Backend (upload-service)

- **Framework**: Express.js
- **Database**: Supabase
- **Queue Management**: BullMQ
- **Environment Variables**: Managed via `.env`
- **Docker Configuration**: Includes Dockerfile and docker-compose.yml for containerization
- **Development**:
  - To start the development server, run:
    ```bash
    npm install
    npm run dev
    ```
  - The service will be available at [localhost:3000](http://localhost:3000).

### 3. Cloudflare Worker (cf-request-handler)

- **Functionality**: Proxies requests, serves static files, and manages CORS
- **Configuration**: Managed via `wrangler.toml`
- **Testing**: Uses Vitest for unit and integration tests
- **Deployment**:
  - Use Wrangler to deploy and manage Cloudflare Workers.

## Deployment

### NGINX Configuration

The NGINX server is configured to redirect HTTP traffic to HTTPS and proxy requests to the backend service running on localhost.

### Docker and Docker Compose

- **Dockerfile**: Defines the build process for the upload-service.
- **docker-compose.yml**: Manages multi-container applications, specifying environment variables and volume mappings.

### Cloudflare Worker Deployment

- **Wrangler**: Used for deploying and managing Cloudflare Workers.
- **R2 Storage**: Utilized for storing and serving static assets.

## Getting Started

### Prerequisites

- Node.js and npm
- Docker and Docker Compose
- Cloudflare account for Worker deployment
- Supabase account for database management

### Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-repo/githost.git
   cd githost
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment variables**:
   - Rename `.env.example` to `.env` and update the necessary variables.

4. **Run the services**:
   - Use Docker Compose to start all services:
     ```bash
     docker-compose up
     ```

5. **Access the application**:
   - Frontend: [localhost:3000](http://localhost:3000)
   - Backend: [localhost:3000](http://localhost:3000)

## Contributing

We welcome contributions to improve GitHost. Please fork the repository and submit a pull request with your changes.

## License

This project is licensed under the MIT License. See the LICENSE file for details.

## Feedback and Issues

Please file feedback and issues on the [GitHub Issues page](https://github.com/your-repo/githost/issues).

## Acknowledgments

- [Next.js](https://nextjs.org)
- [Supabase](https://supabase.com)
- [Cloudflare Workers](https://workers.cloudflare.com)

For more examples and detailed guides, refer to the respective documentation of the technologies used.