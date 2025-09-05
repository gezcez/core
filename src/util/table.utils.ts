import { ColumnDataType } from "drizzle-orm"
import { ColumnBuilderBaseConfig } from "drizzle-orm"
import { SQLiteTableExtraConfigValue } from "drizzle-orm/sqlite-core"
import { sqliteTableCreator } from "drizzle-orm/sqlite-core"
import {
	SQLiteColumnBuilderBase,
	sqliteTable,
	text
} from "drizzle-orm/sqlite-core"
import type { SQLiteColumnBuilder } from "drizzle-orm/sqlite-core"
import { int } from "drizzle-orm/sqlite-core"
export const TABLE_ACTIONS = {
	created_by: int().notNull(),
	updated_by: int(),
	created_at: int({ mode: "timestamp_ms" }).defaultNow(),
	updated_at: int({ mode: "timestamp_ms" })
}
type ValueTypeToString<T> = T extends number
	? "int"
	: T extends string
		? "text"
		: T extends boolean
			? "boolean"
			: T extends Date
				? "timestamp"
				: "unknown"
export function buildConfigurableMatrix<
	TABLE_NAME extends string,
	EXTRA_COLUMNS extends object
>(args: { table_name: TABLE_NAME; extra_columns?: EXTRA_COLUMNS }) {
	const { extra_columns: extra_rows, table_name } = args
	const main_table = sqliteTable(`matrix_${table_name}_main`, {
		id: int().primaryKey({ autoIncrement: true }).unique().notNull(),
		...(extra_rows as EXTRA_COLUMNS)
	})
	const logs_table = sqliteTable(`matrix_${table_name}_logs`, {
		id: int().primaryKey({ autoIncrement: true }).unique().notNull(),
		target_id: int()
			.references(() => main_table.id)
			.notNull(),
		created_by: int().notNull(),
		created_at: int({ mode: "timestamp_ms" }).defaultNow().notNull(),
		description: text(),
		changes: text().$type<
			{
				[K in keyof typeof main_table.$inferSelect]: {
					column: K
					previous_value: (typeof main_table.$inferSelect)[K]
					new_value: (typeof main_table.$inferSelect)[K]
					type: ValueTypeToString<(typeof main_table.$inferSelect)[K]>
				}
			}[keyof typeof main_table.$inferSelect][]
		>()
	})
	const mainKey = `${table_name}MatrixTable` as const
	const logsKey = `${table_name}MatrixLogsTable` as const
	type IDynamicSchema = {
		[K in typeof mainKey]: typeof main_table
	} & {
		[K in typeof logsKey]: typeof logs_table
	}
	return {
		[mainKey]: main_table,
		[logsKey]: logs_table
	} as any as IDynamicSchema
}
