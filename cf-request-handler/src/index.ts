interface Env {
	SOURCE: R2Bucket;
  }
  
  function getContentType(filePath: string): string {
	const extension = filePath.split('.').pop()?.toLowerCase();
	switch (extension) {
	  case 'html': return 'text/html';
	  case 'css': return 'text/css';
	  case 'js': return 'application/javascript';
	  case 'svg': return 'image/svg+xml';
	  case 'png': return 'image/png';
	  case 'jpg':
	  case 'jpeg': return 'image/jpeg';
	  case 'gif': return 'image/gif';
	  case 'webp': return 'image/webp';
	  case 'json': return 'application/json';
	  default: return 'application/octet-stream';
	}
  }
  
  async function proxyRequest(url: string): Promise<Response> {
	const response = await fetch(url);
	const newHeaders = new Headers(response.headers);
	newHeaders.set('Access-Control-Allow-Origin', '*');
	return new Response(response.body, {
	  status: response.status,
	  statusText: response.statusText,
	  headers: newHeaders,
	});
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
  
	  // Check if this is a request for an external resource
	  if (url.pathname.startsWith('/proxy/')) {
		const originalUrl = decodeURIComponent(url.pathname.slice(7)); // Remove '/proxy/' prefix
		return proxyRequest(originalUrl);
	  }
  
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
  
		const contentType = getContentType(filePath);
		headers.set('Content-Type', contentType);
  
		// Add caching headers
		headers.set('Cache-Control', 'public, max-age=3600');
  
		// Add CORS headers
		headers.set('Access-Control-Allow-Origin', '*');
  
		// Add basic security headers
		headers.set('X-Content-Type-Options', 'nosniff');
		headers.set('X-Frame-Options', 'DENY');
		headers.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline' 'unsafe-eval';");
  
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