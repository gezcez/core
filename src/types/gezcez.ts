import type { JWTPayload } from "jose"
export type InternalGezcezJWTPayload = {
	jti: string
	sub: string
	aud: string
} & JWTPayload
export type GezcezJWTPayload = {
	jti: string
	sub: number
	scopes: { [key: string]: number }
	roles: { [key: string]: number }
	is_activated: boolean
} & Omit<JWTPayload, "sub">
