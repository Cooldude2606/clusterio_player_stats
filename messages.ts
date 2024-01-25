import { Type, Static } from "@sinclair/typebox";

const SessionDataSchema = Type.Object({
	AfkTime: Type.Optional(Type.Number()),
	ChatMessages: Type.Optional(Type.Number()),
	CommandsUsed: Type.Optional(Type.Number()),
	MachinesBuilt: Type.Optional(Type.Number()),
	MachinesRemoved: Type.Optional(Type.Number()),
	TilesBuilt: Type.Optional(Type.Number()),
	TilesRemoved: Type.Optional(Type.Number()),
	TreesDestroyed: Type.Optional(Type.Number()),
	OreMined: Type.Optional(Type.Number()),
	ItemsCrafted: Type.Optional(Type.Number()),
	ItemsPickedUp: Type.Optional(Type.Number()),
	Kills: Type.Optional(Type.Number()),
	Deaths: Type.Optional(Type.Number()),
	DamageDealt: Type.Optional(Type.Number()),
	DistanceTravelled: Type.Optional(Type.Number()),
	CapsulesUsed: Type.Optional(Type.Number()),
	EntityRepaired: Type.Optional(Type.Number()),
	DeconstructionPlannerUsed: Type.Optional(Type.Number()),
	MapTagsMade: Type.Optional(Type.Number()),
	HitByTrain: Type.Optional(Type.Number()),
});

export type SessionData = Static<typeof SessionDataSchema>;

export class PlayerSession {
	constructor(
		public id: string,
		public sessionData: SessionData,
		public updatedAtMs: number,
		public isDeleted: boolean,
	) { }

	static jsonSchema = Type.Object({
		id: Type.String(),
		sessionData: SessionDataSchema,
		updatedAtMs: Type.Number(),
		isDeleted: Type.Boolean(),
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(
			json.id, json.sessionData, json.updatedAtMs, json.isDeleted
		);
	}
}

export class PlayerSessionUpdateEvent {
	declare ["constructor"]: typeof PlayerSessionUpdateEvent;
	static type = "event" as const;
	static src = "controller" as const;
	static dst = "control" as const;
	static plugin = "player_stats" as const;
	static permission = "player_stats.main_page.subscribe" as const;

	constructor(
		public updates: PlayerSession[],
	) { }

	static jsonSchema = Type.Object({
		"updates": Type.Array(PlayerSession.jsonSchema),
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(json.updates.map(update => PlayerSession.fromJSON(update)));
	}
}

export class PlayerSessionExportEvent {
	declare ["constructor"]: typeof PlayerSessionExportEvent;
	static type = "event" as const;
	static src = "instance" as const;
	static dst = "controller" as const;
	static plugin = "player_stats" as const;

	constructor(
		public playerName: string,
		public sessionData: SessionData,
	) {
	}

	static jsonSchema = Type.Object({
		playerName: Type.String(),
		sessionData: SessionDataSchema,
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(json.playerName, json.sessionData);
	}
}

export class PlayerTrainHit {
	constructor(
		public id: string,
		public instanceId: number,
		public updatedAtMs: number,
		public isDeleted: boolean,
	) {
	}

	static jsonSchema = Type.Object({
		id: Type.String(),
		instanceId: Type.Number(),
		updatedAtMs: Type.Number(),
		isDeleted: Type.Boolean(),
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(json.id, json.instanceId, json.updatedAtMs, json.isDeleted);
	}
}

export class PlayerTrainHitUpdateEvent {
	declare ["constructor"]: typeof PlayerTrainHitUpdateEvent;
	static type = "event" as const;
	static src = "controller" as const;
	static dst = "control" as const;
	static plugin = "player_stats" as const;
	static permission = "player_stats.train_hit.subscribe" as const;

	constructor(
		public updates: PlayerTrainHit[],
	) { }

	static jsonSchema = Type.Object({
		"updates": Type.Array(PlayerTrainHit.jsonSchema),
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(json.updates.map(update => PlayerTrainHit.fromJSON(update)));
	}
}

export class PlayerHitByTrainEvent {
	declare ["constructor"]: typeof PlayerHitByTrainEvent;
	static type = "event" as const;
	static src = "instance" as const;
	static dst = "controller" as const;
	static plugin = "player_stats" as const;

	constructor(
		public playerName: string,
	) {
	}

	static jsonSchema = Type.Object({
		playerName: Type.String(),
	});

	static fromJSON(json: Static<typeof this.jsonSchema>) {
		return new this(json.playerName);
	}
}
