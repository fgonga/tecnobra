import "@fastify/jwt";

declare module "@fastify/jwt" {
  interface FastifyJWT {
    payload: { username: string; role: string }; // quando assina o token
    user: { username: string; role: string }; // depois de verificar
  }
}

declare module "fastify" {
  interface FastifyRequest {
    jwtSign: (payload: FastifyJWT["payload"], options?: any) => Promise<string>;
    jwtVerify: (options?: any) => Promise<FastifyJWT["user"]>;
    user: FastifyJWT["user"];
  }
}
