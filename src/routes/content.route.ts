import { Context, Hono, Next } from 'hono';
import { jwt } from 'hono/jwt';

type Bindings = {
	R2_BUCKET: R2Bucket;
};

const app = new Hono<{ Bindings: Bindings }>();

app.get('/:fileName', async (c) => {
	const fileName = c.req.param('fileName');
	if (!fileName) {
		return c.json("Query param 'name' is required", 400);
	}
	const object = await c.env.R2_BUCKET.get(fileName);
	if (!object) {
		return c.json(`${fileName} not found`, 404);
	}

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);

	return new Response(object.body, {
		headers,
	});
});

app.use('/edit/*', async (c: Context, next: Next) => {
	try {
		await jwt({
			cookie: 'token',
			secret: c.env.JWT_SECRET_KEY,
		})(c, next);
	} catch (error) {
		return c.json({ error: 'Unauthorized' }, 403);
	}
});

app.post('/edit', async (c) => {
	const body = await c.req.parseBody();
	const file = body['content'];

	console.log(body['test']);

	if (!file || !(file instanceof File)) {
		console.error('File uploaded is not a file');
		return c.json('File uploaded is not a file', 400);
	}

	const r2Object = await c.env.R2_BUCKET.put(file.name, file);
	if (!r2Object) {
		console.error('Failed upload to R2', r2Object);
		return c.json('Failed upload to R2', 500);
	}

	return c.json('File uploaded successfully', 201);
});

app.delete('/edit/:fileName', async (c) => {
	const fileName = c.req.param('fileName');
	if (!fileName) {
		return c.json("Query param 'name' is required", 400);
	}

	c.env.R2_BUCKET.delete(fileName);

	return c.json('File deleted with success', 200);
});

export default app;
