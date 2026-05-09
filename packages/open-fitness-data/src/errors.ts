export class OfdApiError extends Error {
  readonly status: number;
  readonly statusText: string;
  readonly url: string;
  readonly body: unknown;

  constructor({ status, statusText, url, body }: { status: number; statusText: string; url: string; body: unknown }) {
    const detail = typeof body === 'string' ? body : body && typeof body === 'object' ? JSON.stringify(body) : '';
    super(
      detail
        ? `OFD API request failed (${status} ${statusText}): ${detail}`
        : `OFD API request failed (${status} ${statusText})`,
    );
    this.name = 'OfdApiError';
    this.status = status;
    this.statusText = statusText;
    this.url = url;
    this.body = body;
  }
}
