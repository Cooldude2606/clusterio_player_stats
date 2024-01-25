import * as lib from "@clusterio/lib";
import { BaseControllerPlugin } from "@clusterio/controller";
import { DictionaryDatabase } from "./database";

import {
	PlayerHitByTrainEvent, PlayerSession, PlayerSessionExportEvent,
	PlayerSessionUpdateEvent, PlayerTrainHit, PlayerTrainHitUpdateEvent, SessionData
} from "./messages";

export class ControllerPlugin extends BaseControllerPlugin {
	playerDatabase!: DictionaryDatabase<PlayerSession>;
	storageDirty = false;

	lastTrainHit?: PlayerTrainHit;

	async init() {
		this.controller.handle(PlayerSessionExportEvent, this.handlePlayerSessionExportEvent.bind(this));
		this.controller.handle(PlayerHitByTrainEvent, this.handlePlayerSessionExportEvent.bind(this));
		this.controller.subscriptions.handle(PlayerSessionUpdateEvent, this.handlePlayerSessionSubscription.bind(this));
		this.controller.subscriptions.handle(PlayerTrainHitUpdateEvent, this.handlePlayerTrainHitSubscription.bind(this));
		this.playerDatabase = await DictionaryDatabase.load(this.controller.config, this.logger, "player_stats.json") as DictionaryDatabase<PlayerSession>;
	}

	async onSaveData() {
		if (this.storageDirty) {
			this.storageDirty = false;
			await DictionaryDatabase.save(this.controller.config, this.logger, "player_stats.json", this.playerDatabase);
		}
	}

	async handlePlayerSessionExportEvent(event: PlayerSessionExportEvent) {
		this.logger.info(JSON.stringify(event));
		
		let playerSessionDate = this.playerDatabase.get(event.playerName);
		if (playerSessionDate === undefined) {
			// The player has no data so we set the incoming data as their current
			playerSessionDate = new PlayerSession(event.playerName, event.sessionData, Date.now(), false);
			this.playerDatabase.set(event.playerName, playerSessionDate);

		} else {
			// The player has existing data so we need to merge it
			playerSessionDate.updatedAtMs = Date.now();
			const sessionData = playerSessionDate.sessionData
			for (let [statistic, delta] of Object.entries(event.sessionData)) {
				const current_value = sessionData[statistic as keyof SessionData] ?? 0;
				sessionData[statistic as keyof SessionData] = current_value + delta;
			}
		}

		this.storageDirty = true;
		this.controller.subscriptions.broadcast(new PlayerSessionUpdateEvent([playerSessionDate]));
	}

	async handlePlayerSessionSubscription(request: lib.SubscriptionRequest) {
		const sessions = [...this.playerDatabase.values()].filter(
			playerSessionData => playerSessionData.updatedAtMs > request.lastRequestTimeMs,
		);
		return sessions.length ? new PlayerSessionUpdateEvent(sessions) : null;
	}

	async handlePlayerHitByTrainEvent(event: PlayerHitByTrainEvent) {
		this.lastTrainHit = new PlayerTrainHit(event.playerName, Date.now(), false);
		this.controller.subscriptions.broadcast(new PlayerTrainHitUpdateEvent([this.lastTrainHit]));
	}

	async handlePlayerTrainHitSubscription() {
		return this.lastTrainHit ? new PlayerTrainHitUpdateEvent([this.lastTrainHit]) : null;
	}
}
