-- Redicate Admin Panel Integration with ESX
ESX = nil

TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)

-- Wait for ESX to be ready
Citizen.CreateThread(function()
    while ESX == nil do
        Citizen.Wait(10)
    end
    print("^2[Redicate Admin]^7 ESX loaded successfully!")
end)

-- HTTP endpoint handler
SetHttpHandler(function(req, res)
    -- Get players list
    if req.path == '/players.json' then
        local players = {}
        for _, playerId in ipairs(GetPlayers()) do
            local xPlayer = ESX.GetPlayerFromId(playerId)
            table.insert(players, {
                id = tonumber(playerId),
                name = GetPlayerName(playerId),
                ping = GetPlayerPing(playerId),
                job = xPlayer and xPlayer.job.name or "N/A",
                money = xPlayer and xPlayer.getMoney() or 0
            })
        end
        res.send(json.encode(players))
        return
    end
    
    -- Kick player
    if req.path == '/admin/kick' and req.method == 'POST' then
        local data = json.decode(req.body)
        DropPlayer(data.player_id, data.reason .. " (By: " .. data.admin .. ")")
        print("[Admin] " .. data.admin .. " kicked " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Ban player
    if req.path == '/admin/ban' and req.method == 'POST' then
        local data = json.decode(req.body)
        local playerId = data.player_id
        local identifiers = GetPlayerIdentifiers(playerId)
        
        DropPlayer(playerId, "Du er blevet banned: " .. data.reason .. " (By: " .. data.admin .. ")")
        print("[Admin] " .. data.admin .. " banned " .. GetPlayerName(playerId))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Revive player
    if req.path == '/admin/revive' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('esx_ambulancejob:revive', data.player_id)
        print("[Admin] " .. data.admin .. " revived " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Heal player
    if req.path == '/admin/heal' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:heal', data.player_id)
        print("[Admin] " .. data.admin .. " healed " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Give armor
    if req.path == '/admin/armor' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:armor', data.player_id)
        print("[Admin] " .. data.admin .. " gave armor to " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Freeze player
    if req.path == '/admin/freeze' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:freeze', data.player_id, true)
        print("[Admin] " .. data.admin .. " froze " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Unfreeze player
    if req.path == '/admin/unfreeze' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:freeze', data.player_id, false)
        print("[Admin] " .. data.admin .. " unfroze " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Teleport
    if req.path == '/admin/teleport' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:teleport', data.player_id, data.coordinates)
        print("[Admin] Teleporting " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Give money
    if req.path == '/admin/give-money' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            xPlayer.addAccountMoney(data.account, data.amount)
            TriggerClientEvent('esx:showNotification', data.player_id, 'Du fik $' .. data.amount .. ' (' .. data.account .. ') fra en admin')
            print("[Admin] " .. data.admin .. " gave $" .. data.amount .. " (" .. data.account .. ") to " .. xPlayer.name)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Set job
    if req.path == '/admin/set-job' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            xPlayer.setJob(data.job, data.grade)
            TriggerClientEvent('esx:showNotification', data.player_id, 'Dit job er blevet ændret til: ' .. data.job .. ' grade: ' .. data.grade)
            print("[Admin] " .. data.admin .. " set job for " .. xPlayer.name .. " to " .. data.job .. " grade " .. data.grade)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Give item
    if req.path == '/admin/give-item' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            xPlayer.addInventoryItem(data.item, data.count)
            TriggerClientEvent('esx:showNotification', data.player_id, 'Du fik ' .. data.count .. 'x ' .. data.item)
            print("[Admin] " .. data.admin .. " gave " .. data.count .. "x " .. data.item .. " to " .. xPlayer.name)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Give weapon
    if req.path == '/admin/give-weapon' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            xPlayer.addWeapon(data.weapon, data.ammo)
            TriggerClientEvent('esx:showNotification', data.player_id, 'Du fik et våben: ' .. data.weapon)
            print("[Admin] " .. data.admin .. " gave weapon " .. data.weapon .. " to " .. xPlayer.name)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Bring player
    if req.path == '/admin/bring' and req.method == 'POST' then
        local data = json.decode(req.body)
        -- Find admin player (you'd need to track this)
        TriggerClientEvent('redicate:bring', data.player_id, data.admin)
        print("[Admin] " .. data.admin .. " brought " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Goto player
    if req.path == '/admin/goto' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:goto', data.player_id)
        print("[Admin] " .. data.admin .. " went to " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Spectate
    if req.path == '/admin/spectate' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('redicate:spectate', data.player_id)
        print("[Admin] " .. data.admin .. " spectating " .. GetPlayerName(data.player_id))
        res.send(json.encode({success = true}))
        return
    end
    
    -- Clear inventory
    if req.path == '/admin/clear-inventory' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            for k,v in pairs(xPlayer.inventory) do
                if v.count > 0 then
                    xPlayer.setInventoryItem(v.name, 0)
                end
            end
            TriggerClientEvent('esx:showNotification', data.player_id, 'Dit inventory er blevet cleared af en admin')
            print("[Admin] " .. data.admin .. " cleared inventory for " .. xPlayer.name)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Wipe player
    if req.path == '/admin/wipe-player' and req.method == 'POST' then
        local data = json.decode(req.body)
        local xPlayer = ESX.GetPlayerFromId(data.player_id)
        if xPlayer then
            -- Clear all money
            xPlayer.setAccountMoney('cash', 0)
            xPlayer.setAccountMoney('bank', 0)
            xPlayer.setAccountMoney('black_money', 0)
            
            -- Clear inventory
            for k,v in pairs(xPlayer.inventory) do
                if v.count > 0 then
                    xPlayer.setInventoryItem(v.name, 0)
                end
            end
            
            -- Remove all weapons
            for k,v in pairs(xPlayer.loadout) do
                xPlayer.removeWeapon(v.name)
            end
            
            -- Set to unemployed
            xPlayer.setJob('unemployed', 0)
            
            TriggerClientEvent('esx:showNotification', data.player_id, '⚠️ Din karakter er blevet wipet af en admin')
            print("[Admin] " .. data.admin .. " WIPED " .. xPlayer.name)
        end
        res.send(json.encode({success = true}))
        return
    end
    
    -- Announcement
    if req.path == '/admin/announce' and req.method == 'POST' then
        local data = json.decode(req.body)
        TriggerClientEvent('chat:addMessage', -1, {
            color = {255, 0, 0},
            multiline = true,
            args = {"[ANNOUNCEMENT - " .. data.admin .. "]", data.message}
        })
        print("[Admin] " .. data.admin .. " sent announcement: " .. data.message)
        res.send(json.encode({success = true}))
        return
    end
    
    res.send('Redicate Admin Panel - ESX Resource Running')
end)

print("^2[Redicate Admin ESX]^7 Resource started!")
