import Fastify, { FastifyReply, FastifyRequest } from 'fastify';
import fjwt from 'fastify-jwt';
import fastifySwagger from '@fastify/swagger';
import { withRefResolver } from 'fastify-zod';
import userRoutes from './modules/user/user.route';
import productRoutes from './modules/product/product.route';
import { userSchemas } from './modules/user/user.schema';
import { productSchemas } from './modules/product/product.schema';
import { version } from '../package.json';

export const server = Fastify();

declare module 'fastify' {
  export interface FastifyInstance {
    authenticate: any;
  }
}

declare module 'fastify-jwt' {
  export interface FastifyJWT {
    user: {
      id: number;
      email: string;
      name: string;
    };
  }
}

server.register(fjwt, {
  secret: 'sjksdfjkdhkjf8239hd',
});

server.decorate(
  'authenticate',
  async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      await request.jwtVerify();
    } catch (e) {
      return reply.send(e);
    }
  }
);

server.get('/healthcheck', async function () {
  return {
    status: 'OK',
  };
});

export async function main() {
  for (const schema of [...userSchemas, ...productSchemas]) {
    server.addSchema(schema);
  }

  server.register(
    fastifySwagger,
    withRefResolver({
      routePrefix: '/docs',
      exposeRoute: true,
      staticCSP: true,
      openapi: {
        info: {
          title: 'Fastify API',
          description: 'API for products',
          version,
        },
      },
    })
  );

  server.register(userRoutes, { prefix: 'api/users' });
  server.register(productRoutes, { prefix: 'api/products' });

  try {
    await server.listen(3000, '0.0.0.0');

    console.log('Server ready at http://localhost:3000 🎉🟢');
  } catch (e) {
    console.log(e);
    console.log('Something went wrong ❌');
    process.exit(1);
  }
}

main();
