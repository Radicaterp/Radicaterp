-- Client-side ESX Admin Commands
ESX = nil

Citizen.CreateThread(function()
    while ESX == nil do
        TriggerEvent('esx:getSharedObject', function(obj) ESX = obj end)
        Citizen.Wait(0)
    end
end)

-- Heal
RegisterNetEvent('redicate:heal')
AddEventHandler('redicate:heal', function()
    local playerPed = PlayerPedId()
    SetEntityHealth(playerPed, GetEntityMaxHealth(playerPed))
    ESX.ShowNotification('~g~Du er blevet healet af en admin!')
end)

-- Give armor
RegisterNetEvent('redicate:armor')
AddEventHandler('redicate:armor', function()
    local playerPed = PlayerPedId()
    SetPedArmour(playerPed, 100)
    ESX.ShowNotification('~b~Du fik armor fra en admin!')
end)

-- Freeze/Unfreeze
local isFrozen = false
RegisterNetEvent('redicate:freeze')
AddEventHandler('redicate:freeze', function(freeze)
    local playerPed = PlayerPedId()
    isFrozen = freeze
    
    if freeze then
        FreezeEntityPosition(playerPed, true)
        ESX.ShowNotification('~r~Du er blevet frozen af en admin!')
    else
        FreezeEntityPosition(playerPed, false)
        ESX.ShowNotification('~g~Du er blevet unfrozen!')
    end
end)

-- Teleport
RegisterNetEvent('redicate:teleport')
AddEventHandler('redicate:teleport', function(coords)
    local playerPed = PlayerPedId()
    
    if coords == "me" then
        ESX.ShowNotification('~y~Admin teleporterer til dig...')
    else
        local x, y, z = string.match(coords, "([%d%.%-]+),([%d%.%-]+),([%d%.%-]+)")
        if x and y and z then
            SetEntityCoords(playerPed, tonumber(x), tonumber(y), tonumber(z), false, false, false, true)
            ESX.ShowNotification('~g~Du er blevet teleporteret!')
        end
    end
end)

-- Bring (teleport to admin)
RegisterNetEvent('redicate:bring')
AddEventHandler('redicate:bring', function(adminName)
    ESX.ShowNotification('~y~' .. adminName .. ' teleporterer dig...')
end)

-- Goto (admin comes to you)
RegisterNetEvent('redicate:goto')
AddEventHandler('redicate:goto', function()
    ESX.ShowNotification('~y~En admin teleporterer til dig...')
end)

-- Spectate
local isSpectating = false
local spectateTarget = nil

RegisterNetEvent('redicate:spectate')
AddEventHandler('redicate:spectate', function()
    ESX.ShowNotification('~r~En admin overvåger dig...')
end)

print('^2[Redicate Admin ESX Client]^7 Client script loaded!')
