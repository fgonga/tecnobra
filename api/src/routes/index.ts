import { Routes } from "./routes";
export default function registerRoutes(fastify) {
  Routes.registerAll(fastify);
}
