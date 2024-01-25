local clusterio_api = require("modules/clusterio/api")
local floor = math.floor

local PlayerStats = {
	events = {},
	on_nth_tick = {},
}

local allowed_afk_time = 5*3600 -- 5 minutes

--- playerStats contains all stats for a players current session
local sessionData = {}
PlayerStats.events[clusterio_api.events.on_server_startup] = function()
	if global["player_stats-session_data"] == nil then
		global["player_stats-session_data"] = {}
	end
	sessionData = global["player_stats-session_data"]
end

--- Increment a statistic
local function increment(player_index, stat_name)
	local stats = sessionData[player_index]
	local current_value = stats[stat_name]
	if current_value then
		stats[stat_name] = current_value + 1
	else
		stats[stat_name] = 1
	end
end

--- Increment a statistic by a set amount
local function increment_by(player_index, stat_name, count)
	local stats = sessionData[player_index]
	local current_value = stats[stat_name]
	if current_value then
		stats[stat_name] = current_value + count
	else
		stats[stat_name] = count
	end
end

--- When a player joins the game, create an empty table to track their stats
PlayerStats.events[defines.events.on_player_joined_game] = function(event)
	sessionData[event.player_index] = {}
end

--- When a player leave the game, upload their stats and then reset them
PlayerStats.events[defines.events.on_player_left_game] = function(event)
	local stats = sessionData[event.player_index]
	sessionData[event.player_index] = nil

	local player = game.get_player(event.player_index)
	clusterio_api.send_json("player_stats-session_export", {
		player_name = player.name,
		session_data = stats,
	})
end

--- Every minute increment the afk counter if the player has been afk for longer than the allowed time
local allowed_afk_time_plus_frequency = allowed_afk_time + 3600
PlayerStats.on_nth_tick[3600] = function()
	for _, player in pairs(game.connected_players) do
		local afk_time = player.afk_time
		if afk_time > allowed_afk_time then
			if afk_time < allowed_afk_time_plus_frequency then
				increment_by(player.index, "AfkTime", allowed_afk_time)
			else
				increment(player.index, "AfkTime")
			end
		end
	end
end

--- When a player moves increment their distance travelled but only when not afk
PlayerStats.events[defines.events.on_player_changed_position] = function(event)
	local player_index = event.player_index
	local player = game.get_player(player_index)
	if player.valid and player.connected and player.afk_time > allowed_afk_time then
		increment(player_index, "DistanceTravelled")
	end
end

--- When a player removes something or marks something for deconstruction then increment the correct counter
local function entity_removed(event)
	local player_index = event.player_index
	local player = game.get_player(player_index)
	if not player.valid or not player.connected then return end

	local entity = event.entity
	if not entity.valid then return end

	if entity.type == "resource" then
		increment(player_index, "OreMined")
	elseif entity.type == "tree" then
		increment(player_index, "TreesDestroyed")
	elseif entity.type == "simple-entity" and entity.prototype.count_as_rock_for_filtered_deconstruction then
		increment(player_index, "RocksDestroyed")
	elseif entity.force == player.force then
		increment(player_index, "MachinesRemoved")
	end
end
PlayerStats.events[defines.events.on_marked_for_deconstruction] = entity_removed
PlayerStats.events[defines.events.on_player_mined_entity] = entity_removed

--- When a player deals damage increase their counter by the amount they dealt
PlayerStats.events[defines.events.on_entity_damaged] = function(event)
	local cause = event.cause
	if not cause or not cause.valid then return end

	-- Check if its a train for the special hit by train event
	-- https://discord.com/channels/1193199619740540978/1193199620336144476/1199831581028794419
	if cause.type == "locomotive" or cause.type == "cargo-wagon" or cause.type == "fluid-wagon" then
		local entity = event.entity
		if not entity.valid or entity.type ~= "character" then return end

		local player = entity.player
		if not player.valid or not player.connected then return end

		increment(player.index, "HitByTrain")
		clusterio_api.send_json("player_stats-train-hit", {
			player_name = player.name
		})

	elseif cause.type == "character" then
		local player = cause.player
		if not player.valid or not player.connected then return end

		local entity = event.entity
		if not entity.valid or entity.force.is_friend(player.force) then return end

		increment_by(player.index, "DamageDealt", floor(event.final_damage_amount))
	end
end

--- When a player kills something increment their counter
PlayerStats.events[defines.events.on_entity_died] = function(event)
	local character = event.cause
	if not character or not character.valid or character.type ~= "character" then return end

	local player = character.player
	if not player.valid or not player.connected then return end

	local entity = event.entity
	if not entity.valid or entity.force.is_friend(player.force) then return end

	increment(player.index, "Kills")
end

--- Adds a counter for an event
local function add_event_counter(name, eventId)
	PlayerStats.events[eventId] = function(event)
		local player_index = event.player_index
		if player_index == nil or player_index <= 0 then return end
		local player = game.get_player(player_index)
		if not player.valid or not player.connected then return end
		increment(player_index, name)
	end
end

--- Add the counters for the remaining events
local e = defines.events
add_event_counter("MachinesBuilt", e.on_built_entity)
add_event_counter("MapTagsMade", e.on_chart_tag_added)
add_event_counter("ChatMessages", e.on_console_chat)
add_event_counter("CommandsUsed", e.on_console_command)
add_event_counter("ItemsPickedUp", e.on_picked_up_item)
add_event_counter("TilesBuilt", e.on_player_built_tile)
add_event_counter("ItemsCrafted", e.on_player_crafted_item)
add_event_counter("DeconstructionPlannerUsed", e.on_player_deconstructed_area)
add_event_counter("Deaths", e.on_player_died)
add_event_counter("TilesRemoved", e.on_player_mined_tile)
add_event_counter("CapsulesUsed", e.on_player_used_capsule)
add_event_counter("EntityRepaired", e.on_player_repaired_entity)

return PlayerStats
