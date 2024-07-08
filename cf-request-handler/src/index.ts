interface Env {
	SOURCE: R2Bucket;
  }
  
  export default {
	async fetch(
	  request: Request,
	  env: Env,
	  ctx: ExecutionContext
	): Promise<Response> {
	  const url = new URL(request.url);
	  const host = url.hostname;
	  const id = host.split('.')[0];
	  let filePath = url.pathname.substring(1); // remove leading slash
	  if (filePath === '') {
		filePath = 'index.html';
	  }
	  const key = `builds/${id}/${filePath}`;
	  console.log(`Requesting key: ${key}`);
  
	  try {
		// List objects in the bucket to check if the key exists
		const listed = await env.SOURCE.list({ prefix: key, limit: 1 });
		console.log(`Listed objects:`, listed.objects);
  
		if (listed.objects.length === 0) {
		  console.log(`No objects found with key: ${key}`);
		  return new Response(`File not found: ${key}`, { status: 404 });
		}
  
		const object = await env.SOURCE.get(key);
  
		if (object === null) {
		  console.log(`Object is null for key: ${key}`);
		  return new Response(`File not found: ${key}`, { status: 404 });
		}
  
		const headers = new Headers();
		object.writeHttpMetadata(headers);
		headers.set('etag', object.httpEtag);
  
		const type = filePath.endsWith('html') ? 'text/html' :
					 filePath.endsWith('css') ? 'text/css' :
					 'application/javascript';
		headers.set('Content-Type', type);
  
		console.log(`Successfully retrieved object for key: ${key}`);
		return new Response(object.body, {
		  headers,
		});
	  } catch (err) {
		console.error(`Error processing request for key ${key}:`, err);
		return new Response(`Error fetching file: ${err instanceof Error ? err.message : String(err)}`, { status: 500 });
	  }
	}
  };