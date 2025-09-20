export class ApiError extends Error {
  constructor(
    public message: string,
    public status: number = 500
  ) {
    super(message)
    this.name = 'ApiError'
  }
}