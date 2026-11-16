/** GET a JSON response; errors name the `service` so the UI can show them as-is */
export async function getJson<T>(url: string, service: string): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url);
	} catch {
		throw new Error(`Can't reach ${service}. Check your connection.`);
	}
	if (!res.ok) throw new Error(`${service} request failed (${res.status})`);
	return res.json() as Promise<T>;
}
