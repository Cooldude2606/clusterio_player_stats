import React, { useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { Typography } from "antd";
const { Paragraph } = Typography;

import {
	BaseWebPlugin, PageLayout, Control, ControlContext, notifyErrorHandler,
} from "@clusterio/web_ui";

import * as lib from "@clusterio/lib";
import { PlayerSessionUpdateEvent, PlayerTrainHit, PlayerTrainHitUpdateEvent } from "../messages";

function PlayerStatsPage() {
	const control = useContext(ControlContext);
	const plugin = control.plugins.get("player_stats") as WebPlugin;
	const [sessions, synced] = plugin.usePlayerSessions();

	return <PageLayout nav={[{ name: "Player Stats" }]}>
		<h2>Player Stats</h2>
		Synced: {String(synced)} Data: {JSON.stringify([...sessions.values()])}
	</PageLayout>;
}

function TrainDeathsPage() {
	const control = useContext(ControlContext);
	const plugin = control.plugins.get("player_stats") as WebPlugin;
	const [trainHits, synced] = plugin.usePlayerTrainHits();

	return <PageLayout nav={[{ name: "Latest Train Death" }]}>
		<h2>Latest Train Death</h2>
		Synced: {String(synced)} Data: {JSON.stringify([...trainHits.values()])}
	</PageLayout>;
}

export class WebPlugin extends BaseWebPlugin {
	playerSessions = new lib.EventSubscriber(PlayerSessionUpdateEvent, this.control);
	playerTrainHits = new lib.EventSubscriber(PlayerTrainHitUpdateEvent, this.control);

	async init() {
		this.pages = [
			{
				path: "/player_stats",
				sidebarName: "Player Stats",
				permission: "player_stats.main_page.view",
				content: <PlayerStatsPage/>,
			},
			{
				path: "/train_hits",
				sidebarName: "Train Hits",
				permission: "player_stats.train_hit.view",
				content: <TrainDeathsPage/>,
			},
		];
	}

	usePlayerSessions() {
		const control = useContext(ControlContext);
		const subscribe = useCallback((callback: () => void) => this.playerSessions.subscribe(callback), []);
		return useSyncExternalStore(subscribe, () => this.playerSessions.getSnapshot());
	}

	usePlayerSession(id?: string) {
		const [sessions, synced] = this.usePlayerSessions();
		return [id !== undefined ? sessions.get(id) : undefined, synced] as const;
	}

	usePlayerTrainHits() {
		const subscribe = useCallback((callback: () => void) => this.playerTrainHits.subscribe(callback), []);
		return useSyncExternalStore(subscribe, () => this.playerTrainHits.getSnapshot());
	}

	useLatestTrainHit() {
		const [sessions, synced] = this.usePlayerTrainHits();
		const latest = [...sessions.values()].reduce(
			(candidate, next) => next.updatedAtMs > candidate.updatedAtMs ? next : candidate
		)
		return [latest, synced] as const;
	}
}
