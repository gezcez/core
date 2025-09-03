import type {Request} from "express"
import type { GezcezJWTPayload } from "./gezcez"
export interface GezcezRequest extends Request {
	payload: GezcezJWTPayload
	network_id: number
}

declare global {
	namespace Express {
		interface Request {
			payload: GezcezJWTPayload
			network_id: number
		}
	}
}
export {}
