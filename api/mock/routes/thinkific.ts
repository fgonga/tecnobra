import { Router } from "express";
import { store } from "../store.js";

export const thinkificRouter = Router();

// ── Dados mock (edita aqui para simular o teu catálogo) ───
const MOCK_COURSES = [
  { id: 1001, name: "Curso Mock A", slug: "curso-mock-a", course_card_image_url: null },
  { id: 1002, name: "Curso Mock B", slug: "curso-mock-b", course_card_image_url: null },
];
const MOCK_BUNDLES = [
  { id: 3001, name: "Bundle Mock A", slug: "bundle-mock-a", bundle_card_image_url: null },
];
const MOCK_PRODUCTS = [
  {
    id: 2001, name: "Produto Mock A", slug: "produto-mock-a",
    productable_type: "Course", productable_id: 1001,
    description: null, price: 20000, days_until_expiry: 365,
  },
  {
    id: 2002, name: "Produto Mock B", slug: "produto-mock-b",
    productable_type: "Course", productable_id: 1002,
    description: null, price: 5000, days_until_expiry: 365,
  },
  {
    id: 2003, name: "Bundle Mock A", slug: "bundle-mock-a",
    productable_type: "Bundle", productable_id: 3001,
    description: null, price: 10000, days_until_expiry: 365,
  },
];

// ── Auth middleware (ignora, só valida presença) ───────────
thinkificRouter.use((req, _res, next) => {
  console.log(`[Thinkific Mock] ${req.method} ${req.path}`);
  next();
});

// ── Users ──────────────────────────────────────────────────
thinkificRouter.post("/users", (req, res) => {
  const { first_name, last_name, email, roles, external_id } = req.body;

  const existing = store.getUserByEmail(email);
  if (existing) {
    return res.status(422).json({
      errors: { email: ["has already been taken"] },
    });
  }

  const user = store.createUser({
    first_name,
    last_name,
    email,
    roles: roles || ["student"],
    external_id,
  });

  console.log(`[Thinkific Mock] Utilizador criado: #${user.id} ${email}`);
  res.status(201).json(user);
});

thinkificRouter.get("/users", (req, res) => {
  const email = req.query["query[email]"] as string;
  if (email) {
    const user = store.getUserByEmail(email);
    return res.json({ items: user ? [user] : [], meta: { total_count: user ? 1 : 0 } });
  }
  const items = [...store.users.values()];
  res.json({ items, meta: { total_count: items.length } });
});

thinkificRouter.delete("/users/:id", (req, res) => {
  const id = Number(req.params.id);
  store.users.delete(id);
  console.log(`[Thinkific Mock] Utilizador removido: #${id}`);
  res.status(204).send();
});

// ── Courses ────────────────────────────────────────────────
thinkificRouter.get("/courses", (_req, res) => {
  res.json({
    items: MOCK_COURSES,
    meta: { total_count: MOCK_COURSES.length, pagination: { next_page: null } },
  });
});

thinkificRouter.get("/courses/:id", (req, res) => {
  const id = Number(req.params.id);
  const course = MOCK_COURSES.find((c) => c.id === id) || {
    id,
    name: `Curso Mock #${id}`,
    slug: `curso-mock-${id}`,
    course_card_image_url: null,
  };
  res.json(course);
});

// ── Products ───────────────────────────────────────────────
thinkificRouter.get("/products", (_req, res) => {
  res.json({
    items: MOCK_PRODUCTS,
    meta: { total_count: MOCK_PRODUCTS.length, pagination: { next_page: null } },
  });
});

thinkificRouter.get("/products/:id", (req, res) => {
  const id = Number(req.params.id);
  const product = MOCK_PRODUCTS.find((p) => p.id === id) || {
    id,
    name: `Produto Mock #${id}`,
    slug: `produto-mock-${id}`,
    productable_type: "Course",
    productable_id: id,
    description: null,
    price: 0,
    days_until_expiry: 365,
  };
  res.json(product);
});

// ── Bundles ────────────────────────────────────────────────
thinkificRouter.get("/bundles/:id", (req, res) => {
  const id = Number(req.params.id);
  const bundle = MOCK_BUNDLES.find((b) => b.id === id) || {
    id,
    name: `Bundle Mock #${id}`,
    slug: `bundle-mock-${id}`,
    bundle_card_image_url: null,
  };
  res.json(bundle);
});

thinkificRouter.post("/bundles/:id/enrollments", (req, res) => {
  const { user_id, activated_at, expiry_date } = req.body;
  const bundle_id = Number(req.params.id);

  const existing = [...store.enrollments.values()].find(
    (e) => e.user_id === user_id && e.bundle_id === bundle_id && e.type === "bundle"
  );
  if (existing) {
    return res.status(422).json({ errors: { base: ["already enrolled"] } });
  }

  const enrollment = store.createEnrollment({ user_id, bundle_id, type: "bundle", activated_at, expiry_date });
  console.log(`[Thinkific Mock] Bundle enrollment: user #${user_id} → bundle #${bundle_id}`);
  res.status(201).json(enrollment);
});

thinkificRouter.get("/bundles/:id/enrollments", (req, res) => {
  const bundle_id = Number(req.params.id);
  const items = [...store.enrollments.values()].filter(
    (e) => e.bundle_id === bundle_id && e.type === "bundle"
  );
  res.json({ items, meta: { total_count: items.length } });
});

// ── Course Enrollments ─────────────────────────────────────
thinkificRouter.post("/enrollments", (req, res) => {
  const { user_id, course_id, activated_at, expiry_date } = req.body;

  const existing = [...store.enrollments.values()].find(
    (e) => e.user_id === user_id && e.course_id === course_id && e.type === "course"
  );
  if (existing) {
    return res.status(422).json({ errors: { base: ["already enrolled"] } });
  }

  const enrollment = store.createEnrollment({ user_id, course_id, type: "course", activated_at, expiry_date });
  console.log(`[Thinkific Mock] Course enrollment: user #${user_id} → curso #${course_id}`);
  res.status(201).json(enrollment);
});

thinkificRouter.get("/enrollments", (_req, res) => {
  const items = [...store.enrollments.values()];
  res.json({ items, meta: { total_count: items.length } });
});
