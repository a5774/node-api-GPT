if gg.getTargetPackage() ~= "com.theonegames.gunshipbattle" then
    gg.alert("进程错误,请重新选择游戏进程")
    os.exit()
end
gg.setRanges(gg.REGION_C_ALLOC)
gg.toast("当前为ca内存")

function Main()
    gg.clearResults()
    -- select list  nil :not default select
    menu = gg.choice({ "金币修改", "美金修改", "技能数量", "游戏速度", "退出辅助" }, nil, "货币功能")
    if menu == 1 then mglod() end
    if menu == 2 then mdoll() end
    if menu == 3 then gability() end
    if menu == 4 then gspeed() end
    if menu == 5 then kprocess() end
    CODE = -1
end


function mglod()
    gg.searchNumber("150;100;80;50;20:17", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    local t =  gg.getResults(10)  
    for i, v in ipairs(t) do
        t[i].value = '-17000'
    end
    gg.setValues(t)
    gg.toast("已修改:"..gg.getResultCount().." 条数据")
    gg.clearResults()
end


function mdoll()
    gg.searchNumber("292;293;3,000;41:110", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.searchNumber("3000", gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    local t =  gg.getResults(5)  
    for i, v in ipairs(t) do
        t[i].value = '-1000000'
    end
    gg.setValues(t)
    gg.toast("已修改:"..gg.getResultCount().." 条数据")
    gg.clearResults()
end 


function gspeed()
    submenu = gg.choice({ "1.5x倍速", "2.0x倍速","4.0x倍速", "自定义速度","恢复速度"}, nil, "加速")
    if submenu == 1 then gg.setSpeed(1.5) end
    if submenu == 2 then gg.setSpeed(2.0) end
    if submenu == 3 then gg.setSpeed(4.0) end
    if submenu == 4 then
        local zdy = gg.prompt({ "请输入速度" }, { nil }, { "number" })
        if type(zdy) == "nil" or type(tonumber(zdy[1])) == "nil" then
            gg.alert("请输入正确的数字!")
            return nil
        end
        gg.setSpeed(tonumber(zdy[1]))
    end
    if submenu == 5 then gg.setSpeed(1.0) end
    gg.toast("当前速度"..gg.getSpeed().."X")
end


function gability()
    local idx = 1
    local abtyk = {}
    while idx <= 5 do
        local zdy = gg.prompt({ "第"..idx.."个技能数量" }, { nil }, { "number" })
        if type(zdy) == "nil" or type(tonumber(zdy[1])) == "nil" then
            gg.alert("请输入正确的数字!")
            return nil
        end
        gg.setVisible(false)
        abtyk[idx] = tonumber(zdy[1])
        idx=idx+1
        while true do 
            if gg.isVisible(true) then 
                break;
            end
        end 
    end
    local text = ""
    for i = 1,idx do
        if not (abtyk[i] == nil) then 
            text = text..";"..abtyk[i]
        end
    end
    local ss =  string.gsub(text.."::17",";",'',1)
    gg.searchNumber(ss, gg.TYPE_DWORD, false, gg.SIGN_EQUAL, 0, -1, 0)
    gg.getResults(10)
    gg.editAll(9999,gg.TYPE_DWORD)
    gg.toast("已修改:"..gg.getResultCount().." 条数据")
    gg.clearResults()
end 

function kprocess()
    gg.skipRestoreState()
    gg.processKill()
    os.exit()
end

while true do
    if gg.isVisible(true) then
        CODE = 1
        gg.setVisible(false)
    end
    if CODE == 1 then
        Main()
    end
end

