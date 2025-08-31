
export type ProperPromise<T> = Promise<[T]|[false,string]>
export async function fetchJSON(input: string | URL | globalThis.Request, init?: RequestInit) {
	const request = await fetch(input, init)
	const json = await request.json()
	return json
}
export type TJoinStrings<A extends string, B extends string> = `${A}${B}`