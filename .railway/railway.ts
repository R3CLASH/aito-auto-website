import { defineRailway, github, postgres, preserve, project, ref, service, volume } from "railway/iac";

/**
 * Aito Auto on Railway: three resources, one GitHub repo.
 *
 *   postgres  – managed database, replaces the AWS RDS instance
 *   cms       – Strapi, builds from backend/
 *   web       – Next.js site, builds from frontend/
 *
 * Both services deploy automatically on every push to `main`; `watchPatterns`
 * keeps a backend-only change from rebuilding the frontend and vice versa.
 *
 * Secrets are declared here but never stored here: `preserve()` means "this key
 * exists, keep whatever value is set in Railway". Set them with
 * `railway variables --service <svc> --set KEY=value`.
 */

const REPO = "R3CLASH/aito-auto-website";
const BRANCH = "main";
const CMS_PORT = "1337";
const WEB_PORT = "3000";

export default defineRailway(() => {
  const db = postgres("postgres");

  // Strapi writes uploads to disk; a container filesystem is wiped on every
  // deploy, so the media directory needs a volume to survive.
  const uploads = volume("cms-uploads", { sizeMB: 5000, region: "iad" });

  const cms = service("cms", {
    source: github(REPO, { branch: BRANCH, rootDirectory: "backend" }),
    build: {
      builder: "NIXPACKS",
      buildCommand: "npm run build",
      watchPatterns: ["backend/**"],
    },
    deploy: {
      startCommand: "npm run start",
      restartPolicyType: "ON_FAILURE",
    },
    volumeMounts: {
      "cms-uploads": { mountPath: "/app/public/uploads" },
    },
    variables: {
      NODE_ENV: "production",
      HOST: "0.0.0.0",
      PORT: CMS_PORT,
      // Strapi sits behind Railway's proxy, so it must trust the forwarded host.
      PUBLIC_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",
      IS_PROXIED: "true",

      DATABASE_CLIENT: "postgres",
      DATABASE_URL: ref(db, "DATABASE_URL"),
      DATABASE_SSL: "false",

      // Where Strapi pings /api/revalidate after a content change.
      FRONTEND_URL: "https://${{web.RAILWAY_PUBLIC_DOMAIN}}",

      // Never reseed demo content over real data.
      SEED_DEMO_DATA: "false",

      APP_KEYS: preserve(),
      API_TOKEN_SALT: preserve(),
      ADMIN_JWT_SECRET: preserve(),
      TRANSFER_TOKEN_SALT: preserve(),
      JWT_SECRET: preserve(),
      ENCRYPTION_KEY: preserve(),
      REVALIDATE_SECRET: preserve(),
      LEAD_FORM_SECRET: preserve(),

      SMTP_HOST: preserve(),
      SMTP_PORT: preserve(),
      SMTP_SECURE: preserve(),
      SMTP_USERNAME: preserve(),
      SMTP_PASSWORD: preserve(),
      SMTP_FROM: preserve(),
      INQUIRY_NOTIFY_TO: preserve(),
    },
  });

  const web = service("web", {
    source: github(REPO, { branch: BRANCH, rootDirectory: "frontend" }),
    build: {
      builder: "NIXPACKS",
      buildCommand: "npm run build",
      watchPatterns: ["frontend/**"],
    },
    deploy: {
      startCommand: "npm run start",
      restartPolicyType: "ON_FAILURE",
    },
    variables: {
      NODE_ENV: "production",
      // Pinned so the service port matches the public domain's target port.
      PORT: WEB_PORT,
      // Server-side only. The browser never calls Strapi directly: API reads are
      // server components and /uploads/* is rewritten through Next, so this stays
      // on Railway's private network -- no public egress, no extra latency.
      STRAPI_URL: `http://\${{cms.RAILWAY_PRIVATE_DOMAIN}}:${CMS_PORT}`,
      NEXT_PUBLIC_SITE_URL: "https://${{RAILWAY_PUBLIC_DOMAIN}}",

      // Must match the CMS values.
      REVALIDATE_SECRET: preserve(),
      LEAD_FORM_SECRET: preserve(),
    },
  });

  return project("aito-auto", {
    resources: [db, uploads, cms, web],
  });
});
