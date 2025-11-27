-- Client-side script for admin actions

RegisterNetEvent('redicate:teleport')
AddEventHandler('redicate:teleport', function(coords)
    local playerPed = PlayerPedId()
    
    if coords == "me" then
        -- Teleport to admin (would need admin coords sent from server)
        print("^3Teleport to admin not yet implemented^7")
    else
        -- Parse coordinates
        local x, y, z = string.match(coords, "([%d%.%-]+),([%d%.%-]+),([%d%.%-]+)")
        if x and y and z then
            SetEntityCoords(playerPed, tonumber(x), tonumber(y), tonumber(z), false, false, false, true)
            print("^2Teleported to " .. coords .. "^7")
        else
            print("^1Invalid coordinates format^7")
        end
    end
end)

RegisterNetEvent('redicate:heal')
AddEventHandler('redicate:heal', function()
    local playerPed = PlayerPedId()
    
    -- Heal player
    SetEntityHealth(playerPed, GetEntityMaxHealth(playerPed))
    
    -- Repair armor
    SetPedArmour(playerPed, 100)
    
    -- Show notification
    SetNotificationTextEntry("STRING")
    AddTextComponentString("~g~Du er blevet healet af en admin!")
    DrawNotification(false, false)
    
    print("^2You have been healed by an admin^7")
end)

print("^2[Redicate Admin Client]^7 Client script loaded!")
