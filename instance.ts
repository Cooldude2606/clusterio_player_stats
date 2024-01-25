import * as lib from "@clusterio/lib";
import { BaseInstancePlugin } from "@clusterio/host";
import { PlayerHitByTrainEvent, PlayerSessionExportEvent, SessionData } from "./messages";

type SessionDataIPC = {
	player_name: string
	session_data: SessionData
};

type HitByTrainIPC = {
	player_name: string
};

const sessionStatsCounter = new lib.Counter(
	"clusterio_player_stats_by_instance",
	"Player Statistics",
	{ labels: ["instance_id", "statistic"] }
);

export class InstancePlugin extends BaseInstancePlugin {
	async init() {
		this.instance.server.on("ipc-player_stats-session_export", (event) => this.handleSessionExportIPC(event).catch(
			(err) => this.logger.error(`Error handling ipc event:\n${err.stack}`)
		));
		this.instance.server.on("ipc-player_stats-train-hit", (event) => this.handleHitByTrainIPC(event).catch(
			(err) => this.logger.error(`Error handling ipc event:\n${err.stack}`)
		));
	}

	async handleSessionExportIPC(event: SessionDataIPC) {
		this.instance.sendTo("controller", new PlayerSessionExportEvent(event.player_name, event.session_data));

		const instanceId = String(this.instance.id);
		for (let [statistic, delta] of Object.entries(event.session_data)) {
			sessionStatsCounter.labels(instanceId, statistic).inc(delta);
		}
	}

	async handleHitByTrainIPC(event: HitByTrainIPC) {
		this.instance.send(new PlayerHitByTrainEvent(event.player_name));
	}
}
