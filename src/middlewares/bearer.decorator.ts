import {
	applyDecorators,
	UseGuards,
	type CanActivate,
	type ExecutionContext
} from "@nestjs/common"
import { ApiHeader, ApiParam } from "@nestjs/swagger"

export function UseBearerAuthentication(config: IAuthenticationGuardConfig) {
	return applyDecorators(
		UseGuards(AuthenticationGuard(config)),
		ApiHeader({
			name: "Authorization",
			required: true,
			example: "Bearer ey..."
		})
	)
}
export interface IAuthenticationGuardConfig {
	aud: string
	issuer: string
	secret: string
}
import type { Request } from "express"
import { PATH_METADATA } from "@nestjs/common/constants"
import type { GezcezJWTPayload, InternalGezcezJWTPayload } from "../types"
import { GezcezError } from "../GezcezError"
import { jwtVerify, type JWK, type KeyObject } from "jose"

function AuthenticationGuard(config: IAuthenticationGuardConfig) {
	return class AuthorizationGuardInner implements CanActivate {
		async canActivate(context: ExecutionContext) {
			const handler = context.getHandler()
			const controller = context.getClass()

			const methodPath = Reflect.getMetadata(PATH_METADATA, handler) || ""
			const controllerPath =
				Reflect.getMetadata(PATH_METADATA, controller) || ""

			const req = context.switchToHttp().getRequest() as Request

			const token = req.headers.authorization?.split(" ")[1]
			if (!token) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						"Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım. (token undefined)"
				})
			}
			const payload = await verifyJWT({
				aud: config.aud,
				issuer: "internal.gezcez.com",
				secret: new TextEncoder().encode(config.secret),
				token: token
			})
			if (!payload) {
				throw GezcezError("UNAUTHORIZED", {
					__message:
						"Bu işlemi gerçekleştirmek için giriş yapmış olmanız lazım."
				})
			}
			if (payload.type !== "internal-token")
				throw GezcezError("BAD_REQUEST", {
					__message: `token.type geçersiz ('access' beklenirken '${payload.type} bulundu')`
				})
			let can_activate = false
			if (!can_activate) {
				throw GezcezError("FORBIDDEN", {
					__message: "Bu işlemi gerçekleştirmek için yetkiniz yok."
				})
			}
			req["payload"] = payload as any
			return true
		}
	}
}

async function verifyJWT(
	args: Omit<IAuthenticationGuardConfig, "secret"> & {
		token: string
		secret: CryptoKey | KeyObject | JWK | Uint8Array
	}
) {
	const { secret, token,aud } = args
	let payload
	try {
		payload = (
			await jwtVerify(token, secret, {
				issuer: "internal.gezcez.com",
				audience: aud
			})
		).payload
	} catch {
		return
	}
	if (!payload) return

	return {
		...payload
	} as InternalGezcezJWTPayload
}
