local MyModule = require("./control")

-- Can contain anything you plan to use with send_rcon from functions, modules, or data
ipc_player_stats = MyModule

-- Can contain anything you want to allow other plugins to have access to, this example exposes the whole module
return MyModule
