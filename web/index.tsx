import React, { useContext, useEffect, useState, useCallback, useSyncExternalStore } from "react";
import { Typography } from "antd";
const { Paragraph } = Typography;

import {
	BaseWebPlugin, PageLayout, Control, ControlContext, notifyErrorHandler, useInstance,
} from "@clusterio/web_ui";

import * as lib from "@clusterio/lib";
import { PlayerSessionUpdateEvent, PlayerTrainHitUpdateEvent } from "../messages";

function useSecondsSince(timestampMs: number) {
	const [seconds, setSeconds] = useState(Math.floor((Date.now() - timestampMs) / 1000));
	useEffect(() => {
		const interval = setInterval(() => {
			setSeconds(Math.floor((Date.now() - timestampMs) / 1000));
		}, 1000);
		return () => {
			clearInterval(interval);
		};
	}, [timestampMs]);
	return seconds;
}
  
function PlayerStatsPage() {
	const control = useContext(ControlContext);
	const plugin = control.plugins.get("player_stats") as WebPlugin;
	const [sessions, synced] = plugin.usePlayerSessions();

	return <PageLayout nav={[{ name: "Player Stats" }]}>
		<h2>Player Stats</h2>
		Synced: {String(synced)} Data: {JSON.stringify([...sessions.values()])}
	</PageLayout>;
}

function TimeSinceComponent(props: { timestampMs: number }) {
	const seconds = useSecondsSince(props.timestampMs);
	return <>Seconds since someone was last hit: {seconds}</>;
  }

function TrainDeathsPage() {
	const control = useContext(ControlContext);
	const plugin = control.plugins.get("player_stats") as WebPlugin;
	const [trainHits, synced] = plugin.usePlayerTrainHits();
	const [latestTrainHit] = plugin.useLatestTrainHit();
	const [instance] = useInstance(latestTrainHit?.instanceId);

	return <PageLayout nav={[{ name: "Latest Train Death" }]}>
		<h2>Latest Train Death</h2>
		<ul>
		<li>Synced: {String(synced)}</li>
		<li>Data: {JSON.stringify([...trainHits.values()])}</li>
		{ latestTrainHit != null ? <li><TimeSinceComponent timestampMs={latestTrainHit.updatedAtMs}/></li> : null }
		{ instance != undefined ? <li>Accident occurred on server: {instance.name}</li> : null }
		</ul>
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
		const [trainHits, synced] = this.usePlayerTrainHits();
		if (trainHits.size === 0) {
			return [null, synced] as const;
		}
		const latest = [...trainHits.values()].reduce(
			(candidate, next) => next.updatedAtMs > candidate.updatedAtMs ? next : candidate
		)
		return [latest, synced] as const;
	}
}
