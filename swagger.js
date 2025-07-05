// swagger.js
import swaggerJSDoc from 'swagger-jsdoc';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Weather Bot Admin API',
    version: '1.0.0',
    description: 'API documentation for Admin login and Google OAuth',
  },
  servers: [
    {
      url: 'http://localhost:5000',
      description: 'Local development server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
      },
    },
  },
};

const options = {
  swaggerDefinition,
  apis: ['./routes/*.js'], // path to your routes
};

export const swaggerSpec = swaggerJSDoc(options);
