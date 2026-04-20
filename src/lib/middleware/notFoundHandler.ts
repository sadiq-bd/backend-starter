import { Context } from "hono";

export default () => ((c: Context) => {
    return c.json({ message: 'Not found' }, 404);
});
