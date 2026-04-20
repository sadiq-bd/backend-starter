export class AppError extends Error {
    constructor(
        message: string,
        public status: number = 400,
        public headers: Record<string, string> = {}
    ) {
        super(message);
    }
}
