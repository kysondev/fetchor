export class FetchorError extends Error {
  status: number;
  body: any;

  constructor(message: string, status: number, body?: any) {
    super(message);
    this.name = "FetchorError";
    this.status = status;
    this.body = body;
  }
}
