wrk.method = "POST"
wrk.headers["Content-Type"] = "application/json"

math.randomseed(os.time())

-- Função para gerar email aleatório
local function randomEmail()
  local user = "myname" .. math.random(100000, 999999)
  local domain = "gmail.com"
  return user .. "@" .. domain
end

-- Função para gerar telefone aleatório (9 dígitos)
local function randomPhone()
  return string.format("%09d", math.random(100000000, 999999999))
end



-- Função para gerar nome aleatório
local function randomName()
    local user = "customer " .. math.random(100000, 999999)
    return user
end

wrk.body = string.format('{"email":"%s","name":"%s","phone":"%s"}',
  randomEmail(),
  randomName(),
  randomPhone()
)
