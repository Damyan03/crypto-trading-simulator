/** A failed request; the UI turns it into text in the user's language */
export class RequestError extends Error {
	/** e.g. "Binance" */
	readonly service: string;
	/** HTTP status; undefined if the service couldn't be reached */
	readonly status?: number;

	constructor(service: string, status?: number) {
		super(status === undefined ? `Can't reach ${service}` : `${service} request failed (${status})`);
		this.service = service;
		this.status = status;
	}
}

/** GET a JSON response; throws a RequestError naming the `service` */
export async function getJson<T>(url: string, service: string): Promise<T> {
	let res: Response;
	try {
		res = await fetch(url);
	} catch {
		throw new RequestError(service);
	}
	if (!res.ok) throw new RequestError(service, res.status);
	return res.json() as Promise<T>;
}
