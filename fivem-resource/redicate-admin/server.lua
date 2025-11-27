-- Redicate Admin Panel Integration
-- This resource communicates with your web admin panel

local ADMIN_PANEL_URL = "https://api.redicate.dk/api"

-- HTTP endpoint to get players
SetHttpHandler(function(req, res)
    if req.path == '/players.json' then
        local players = {}
        for _, playerId in ipairs(GetPlayers()) do
            table.insert(players, {
                id = tonumber(playerId),
                name = GetPlayerName(playerId),
                ping = GetPlayerPing(playerId),
                identifiers = GetPlayerIdentifiers(playerId)
            })
        end
        res.send(json.encode(players))
        return
    end
    
    -- Admin actions
    if req.path == '/admin/kick' and req.method == 'POST' then
        local data = json.decode(req.body)
        local playerId = data.player_id
        local reason = data.reason or "Kicked by admin"
        local admin = data.admin or "Admin"
        
        if playerId then
            DropPlayer(playerId, reason .. " (By: " .. admin .. ")")
            print("[Admin] " .. admin .. " kicked player " .. GetPlayerName(playerId) .. ": " .. reason)
            res.send(json.encode({success = true}))
        else
            res.send(json.encode({success = false, error = "Invalid player ID"}))
        end
        return
    end
    
    if req.path == '/admin/ban' and req.method == 'POST' then
        local data = json.decode(req.body)
        local playerId = data.player_id
        local reason = data.reason or "Banned by admin"
        local duration = data.duration or 0
        local admin = data.admin or "Admin"
        
        if playerId then
            -- Get player identifiers
            local identifiers = GetPlayerIdentifiers(playerId)
            local license = nil
            for _, id in pairs(identifiers) do
                if string.match(id, "license:") then
                    license = id
                    break
                end
            end
            
            -- Drop player
            DropPlayer(playerId, "Du er blevet banned: " .. reason .. " (By: " .. admin .. ")")
            
            -- Save ban to file (you can also save to database)
            local banData = {
                license = license,
                name = GetPlayerName(playerId),
                reason = reason,
                admin = admin,
                duration = duration,
                timestamp = os.time()
            }
            
            -- TODO: Add to ban list/database
            print("[Admin] " .. admin .. " banned player " .. GetPlayerName(playerId) .. ": " .. reason)
            res.send(json.encode({success = true}))
        else
            res.send(json.encode({success = false, error = "Invalid player ID"}))
        end
        return
    end
    
    if req.path == '/admin/teleport' and req.method == 'POST' then
        local data = json.decode(req.body)
        local playerId = data.player_id
        local coords = data.coordinates
        
        if playerId then
            -- Send to client
            TriggerClientEvent('redicate:teleport', playerId, coords)
            print("[Admin] Teleporting player " .. GetPlayerName(playerId))
            res.send(json.encode({success = true}))
        else
            res.send(json.encode({success = false, error = "Invalid player ID"}))
        end
        return
    end
    
    if req.path == '/admin/heal' and req.method == 'POST' then
        local data = json.decode(req.body)
        local playerId = data.player_id
        
        if playerId then
            TriggerClientEvent('redicate:heal', playerId)
            print("[Admin] Healing player " .. GetPlayerName(playerId))
            res.send(json.encode({success = true}))
        else
            res.send(json.encode({success = false, error = "Invalid player ID"}))
        end
        return
    end
    
    if req.path == '/admin/announce' and req.method == 'POST' then
        local data = json.decode(req.body)
        local message = data.message
        local admin = data.admin or "Admin"
        
        if message then
            TriggerClientEvent('chat:addMessage', -1, {
                color = {255, 0, 0},
                multiline = true,
                args = {"[ANNOUNCEMENT - " .. admin .. "]", message}
            })
            print("[Admin] " .. admin .. " sent announcement: " .. message)
            res.send(json.encode({success = true}))
        else
            res.send(json.encode({success = false, error = "No message provided"}))
        end
        return
    end
    
    res.send('Redicate Admin Panel - Resource Running')
end)

print("^2[Redicate Admin]^7 Resource started successfully!")
print("^3[Redicate Admin]^7 HTTP endpoints available on port " .. GetConvar('netPort', '30120'))
