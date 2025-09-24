import type { Response, Request, NextFunction } from "express"
import { logger } from "../util/logger"

export function LoggerMiddleware(
	req: Request,
	res: Response,
	next: NextFunction
) {
	const res_status = res.statusCode
	const ip = process.env.NODE_ENV !== "dev" ? req.headers["CF-Connecting-IP"] : req.ip
	const is_prod = process.env.NODE_ENV !== "dev"
	logger.log(`${res_status} - [${req.method}] [${ip}]] ${req.url}`)
	next()
}
