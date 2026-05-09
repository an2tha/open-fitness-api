import app from 'api/src/app';

export const runtime = 'nodejs';

async function handler(req: Request) {
  return app.fetch(req);
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const DELETE = handler;
export const PATCH = handler;
