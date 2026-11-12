import type { Core } from '@strapi/strapi';

const allowedMediaTypes = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.*',
  'text/plain',
  'text/csv',
];

const deniedTypes = [
  'image/svg+xml',
  'application/vnd.microsoft.portable-executable',
  'application/x-msdownload',
  'application/x-msdos-program',
  'application/x-executable',
  'application/x-dosexec',
  'application/x-sh',
  'text/x-shellscript',
  'application/x-mach-binary',
];

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({
  'users-permissions': {
    config: {
      jwtManagement: 'refresh',
      sessions: {
        httpOnly: true,
      },
    },
  },
  email: {
    config: {
      // SMTP when SMTP_HOST is set, otherwise the local sendmail provider, which
      // keeps `strapi develop` booting on a laptop with no mail server.
      ...(env('SMTP_HOST')
        ? {
            provider: 'nodemailer',
            providerOptions: {
              host: env('SMTP_HOST'),
              port: env.int('SMTP_PORT', 587),
              secure: env.bool('SMTP_SECURE', false),
              auth: { user: env('SMTP_USERNAME'), pass: env('SMTP_PASSWORD') },
            },
          }
        : { provider: 'sendmail' }),
      settings: {
        defaultFrom: env('SMTP_FROM', 'no-reply@aitoauto.fi'),
        defaultReplyTo: env('SMTP_FROM', 'no-reply@aitoauto.fi'),
      },
    },
  },
  upload: {
    config: {
      // The Railway bucket when it is wired up, otherwise Strapi's own local
      // provider so `strapi develop` needs no object storage on a laptop.
      //
      // The bucket is private: baseUrl points media URLs at the website, which
      // serves them from the bucket over a signed request (see the frontend's
      // app/uploads/[...path] route). That also keeps image traffic off this
      // service entirely.
      ...(env('BUCKET_NAME')
        ? {
            provider: 'aws-s3',
            providerOptions: {
              baseUrl: `${env('FRONTEND_URL', '').replace(/\/$/, '')}/uploads`,
              s3Options: {
                endpoint: env('BUCKET_ENDPOINT'),
                region: env('BUCKET_REGION', 'auto'),
                credentials: {
                  accessKeyId: env('BUCKET_ACCESS_KEY_ID'),
                  secretAccessKey: env('BUCKET_SECRET_ACCESS_KEY'),
                },
                params: {
                  Bucket: env('BUCKET_NAME'),
                  // Railway buckets reject canned ACLs; objects are private and
                  // read back with a signed request.
                  ACL: null,
                },
              },
            },
          }
        : {}),
      security: {
        allowedTypes: allowedMediaTypes,
        deniedTypes,
      },
    },
  },
});

export default config;
