import * as path from "path";
import * as fs from "fs-extra";
import * as lib from "@clusterio/lib";

// Copied from lib/database.ts but without items being used
export class DictionaryDatabase<T> extends Map<string, T> {

	constructor(serialized?: object) {
		super()
		// Verify the content of the serialized database
		if (serialized !== undefined) {
			for (let [key, value] of Object.entries(serialized)) {
				this.set(key, value as T);
			}
		}
	}

	serialize() {
		let obj: Record<string, T> = {};
		for (let [key, value] of this) {
			obj[key] = value;
		}
		return obj;
	}

	static async load(
		config: lib.ControllerConfig,
		logger: lib.Logger,
		dbFile: string,
	): Promise<DictionaryDatabase<unknown>> {
		let itemsPath = path.resolve(config.get("controller.database_directory"), dbFile);
		logger.verbose(`Loading ${itemsPath}`);
		try {
			let content = await fs.readFile(itemsPath, { encoding: "utf8" });
			return new DictionaryDatabase(JSON.parse(content));
	
		} catch (err: any) {
			if (err.code === "ENOENT") {
				logger.verbose("Creating new item database");
				return new DictionaryDatabase();
			}
			throw err;
		}
	}

	static async save(
		controllerConfig: lib.ControllerConfig,
		logger: lib.Logger,
		dbFile: string,
		database: DictionaryDatabase<unknown> | undefined,
	) {
		if (database && database.size < 50000) {
			let file = path.resolve(controllerConfig.get("controller.database_directory"), dbFile);
			logger.verbose(`writing ${file}`);
			let content = JSON.stringify(database.serialize());
			await lib.safeOutputFile(file, content);
		} else if (database) {
			logger.error(`Database too large, not saving (${database.size})`);
		}
	}
}
