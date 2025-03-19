# Value Compass

A stock valuation and analysis tool that helps users identify undervalued stocks based on a customizable scoring system.

## Overview

Value Compass uses financial indicators, historical data, and peer comparisons to provide data-driven insights for long-term investment decisions. The project is built with a microservices architecture for scalability and maintainability.

## Architecture

The project consists of the following components:

### Microservices

1. **Data Service**: Abstracts data retrieval from various financial data sources using an adapter pattern
2. **Valuation Service**: Calculates valuation scores based on user-defined criteria
3. **User Service**: Handles authentication, authorization, and profile management
4. **Report Service**: Generates reports and sends alerts

### Frontend

- Built with Next.js/React
- Provides an intuitive dashboard for portfolio management and stock analysis

### Database

- PostgreSQL for storing stock data, user data, and portfolio information

## Development Setup

### Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)
- [Node.js](https://nodejs.org/) (v18 or later)
- [PostgreSQL](https://www.postgresql.org/download/) (if running services locally without Docker)

### Environment Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/LeandroOrdonez/value-compass.git
   cd value-compass
   ```

2. Create environment variables for each service (examples provided in each service directory)

### Running with Docker Compose

The easiest way to run the entire application with all its dependencies:

1. Start all services:
   ```bash
   docker-compose up -d
   ```

2. The application will be available at:
   - Frontend: http://localhost:3000
   - Data Service API: http://localhost:8000
   - Valuation Service API: http://localhost:8001
   - User Service API: http://localhost:8002
   - Report Service API: http://localhost:8003

3. To stop all services:
   ```bash
   docker-compose down
   ```

### Running Services Individually

#### Frontend (Next.js)

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. The frontend will be available at http://localhost:3000

#### Backend Microservices

Each microservice can be run individually:

##### Data Service

1. Navigate to the service directory:
   ```bash
   cd services/data_service
   ```

2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Run the service:
   ```bash
   uvicorn app.main:app --reload --port 8000
   ```

4. The API will be available at http://localhost:8000

##### Valuation Service, User Service, Report Service

Follow similar steps as above, changing the directory and port:

- Valuation Service: port 8001
- User Service: port 8002
- Report Service: port 8003

### Database Setup

If running services locally without Docker:

1. Create PostgreSQL databases for each service:
   ```bash
   createdb value_compass_data
   createdb value_compass_valuation
   createdb value_compass_user
   createdb value_compass_report
   ```

2. Update the database connection strings in each service's environment variables.

## API Documentation

When services are running, API documentation is available at:

- Data Service: http://localhost:8000/docs
- Valuation Service: http://localhost:8001/docs
- User Service: http://localhost:8002/docs
- Report Service: http://localhost:8003/docs

## Deployment

For production deployment, additional steps are recommended:

1. Set up proper environment variables for production.
2. Configure a reverse proxy like Nginx.
3. Set up proper SSL certificates.
4. Configure Kubernetes for orchestration (optional but recommended for scalability).

## License

This project is licensed under the MIT License - see the LICENSE file for details.
