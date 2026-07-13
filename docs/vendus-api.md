# Cegid Vendus API (v1.1) — Resumo

> Fonte: <https://www.vendus.co.ao/ws/> · SDK PHP: <https://github.com/vendus/vendus-sdk-php> (com [docs](https://github.com/vendus/vendus-sdk-php/tree/master/docs) e [exemplos](https://github.com/vendus/vendus-sdk-php/tree/master/docs/examples))

API REST orientada a recursos, com URLs limpas, métodos HTTP padrão e respostas JSON. Versão por omissão: **1.1** (existem também `1.0` e `1.2`).

---

## 1. Base URL e versionamento

- **Base URL:** `https://www.vendus.co.ao/ws/v1.1/`
- Pode-se especificar versão no caminho (`/ws/v1.2/...`). Sem versão usa-se a default.

## 2. Autenticação

É preciso uma **API key** (pedir à aplicação/suporte). Todos os pedidos têm de a enviar — três formas equivalentes:

| Método | Exemplo |
| --- | --- |
| HTTP Bearer | `Authorization: Bearer <api_key>` |
| HTTP Basic | `curl -u <api_key>: https://.../account/` |
| Query param | `?api_key=<api_key>` |

Permissões = capacidades do utilizador associado à key.

## 3. Convenções de request

- **Métodos:** `GET` (ler), `POST` (criar), `PATCH` (modificar), `PUT` (substituir), `DELETE`.
- **Body:** `POST/PUT/PATCH` devem ser `application/json` — caso contrário pode devolver `415`.
- **Paginação:** `?page=N&per_page=M` (default 20, máx 1000). Headers de resposta: `X-Paginator-Items`, `X-Paginator-Pages`.
- **Ordenação:** `?sort=campo,-outro` (`-` = descendente). Nem todos os campos suportam.
- **Formato de saída:** `JSON` por defeito; alguns endpoints suportam `.xml`, `.csv`, `.pdf` (apêndice à URL, ex.: `/account.xml`).
- **Clientes HTTP limitados:**
  - Forçar método via `?action=PATCH`.
  - Enviar params via querystring em vez de body.
  - **Envelope:** `?envelope=true` → resposta sempre `200`, com `status`, `headers` e `response` no corpo.

## 4. Rate limiting

Headers presentes em cada resposta (se aplicável):

| Header | Significado |
| --- | --- |
| `Rate-Limit-Limit` | Crédito total no período |
| `Rate-Limit-Remaining` | Crédito restante |
| `Rate-Limit-Used` | Créditos gastos neste pedido |
| `Rate-Limit-Reset` | Segundos até reset |

## 5. Códigos HTTP

**Sucesso:** `200 OK`, `201 Created` (URL no header `Location`), `204 No Content`.
**Erro:** `400` parse, `401` auth, `403` sem acesso, `404` não encontrado, `415` content-type inválido, `422` validação, `429` rate limit, `5xx` erro do servidor.

---

## 6. Endpoints (resumo por recurso)

> Notação: `*` indica path com `{id}`. Todos os endpoints prefixados por `https://www.vendus.co.ao/ws/v1.1`.

### Account
- `GET /account` · `GET /account/{id}` · `PATCH /account/{id}`
- Dados da empresa: `company`, `address`, `tax_id` (taxa default), `tax_exemption` (motivos M00…M94), `country`, `locale`, `irs`.
- Users: `GET /account/users` · `GET|PATCH /account/users/{id}` (campos: `email`, `name`, `password`, `pin`, `timeout`).

### Clients
- `GET /clients` (filtros: `q`, `fiscal_id`, `name`, `email`, `external_reference`, `status`, `date`, `id` min/max).
- `POST /clients` · `GET|PATCH|DELETE /clients/{id}`
- Saldos: `GET /clients/{id}/balance` (filtros `since`, `until`, `status`, `aggregate`); `POST /clients/{id}/balance` (`amount`, `operation_type` `in|out`, `notes`).
- Resumo: `GET /clients/{id}/resume` → `balance`, `balanceWithin`, `balanceExpired`.

### Covenants (recorrências automáticas)
- `GET /covenants` (filtros: `search`, `status`, `end_from`, `end_to`, `type`).
- `POST /covenants` — agenda geração automática de um documento para um cliente em dias específicos. Aceita praticamente o mesmo payload de `POST /documents` mais `recurrency_type`, `recurrency_start_date`, `date_execution_end`.
- `DELETE /covenants/{id}`.

### Delivery (pedidos / KDS)
- `GET /delivery` (filtros: `type`, `status`, `kitchen_id`, `order_id`, `reference`).
- `POST /delivery` — `type` ∈ `table|delivery|takeaway|pickup`; `source` ∈ `office|pos|vendusgo|api|deliverect|flipdish|eatz`; status ∈ `received|pending|cooking|waiting_to_delivery|delivered|canceled`.
- `GET|PATCH /delivery/{id}` (PATCH só altera `status`, `extra_info`, `update_hook`).

### Discountcards
- `GET /discountcards` (filtros: `code`, `status`, `category`, `store_id`).
- `POST /discountcards` (`code`, `category`, `type` `money|percent`, `amount`, `date_expire`, `output` `html|pdf|escpos`).
- `GET /discountcards/{id}`.

### Documents (núcleo facturação)
Tipos suportados: `FT`, `FG`, `FR`, `NC`, `DC`, `PF`, `OT`, `EC`, `GT`, `GR`, `RG`.

- `GET /documents` (filtros: `store_id`, `register_id`, `client_id`, `client_fiscal_id`, `client_country`, `type`, `subtype`, `since`, `until`, `q`, `external_reference`, `status`, `view`, `mode`).
- `POST /documents` — cria documento. Regras:
  - **Faturas:** só `items` é obrigatório (`qty` + `id`/`reference`). Cliente opcional; nunca enviar `fiscal_id=999999990`. Cliente não existente é criado.
  - **Notas de crédito (`NC`):** cada item precisa de `reference_document` (`document_number`, `document_row`) e `notes` justificativas.
  - **Recibos (`RG`):** usar `payments` + `invoices` (com `document_number`); **não** enviar `items`.
  - Outros campos: `register_id`, `discount_*`, `payments[]`, `mode` `normal|tests`, `date`, `date_supply`, `notes`, `stock_operation` `in|none|out`, `ifthenpay`, `eupago`, `multibanco`, `movement_of_goods`, `output` (`auto|pdf_url|pdf|html|escpos|tpasibs`), `output_template_id`, `tx_id`, `return_qrcode`, `agt_corrected_invoice_id`, etc.
- `GET /documents/{id}` (params: `mode`, `copies`, `output`, `output_version`, `download`, etc.). Aceita `.pdf` no `{id}`.
- `PATCH /documents/{id}` — alterar `status` (`N` Normal, `A` Canceled, `F` Invoiced); permite `stock`, `mode`.
- Resposta inclui `hash`, `atcud`, `qrcode`/`qrcode_data`, `multibanco`, `venduspay` (`payment_url`, `payment_qrcode`), `agt` (`document_number`, `qrcode_image`).

**Métodos de pagamento:** `GET|POST /documents/paymentmethods`, `GET /documents/paymentmethods/{id}`.
Tipos: `NU` numerário, `CC`/`CD`/`CO`/`DE`, `TR`, `MB`, `CH`, `LC`, `TB`, `MBWAY`, `ZARPH`, `ALICE`, `CASHMATIC`, `CASHLOGY`, `ITHINKIOT`, `MYPOS`, `TPASIBS`, `VENDUSPAY`, `DNP`, `PR`, `CS`, `OU`.

**Tipos de documento:** `GET /documents/types` (filtros `visible_filter`, `visible_finalize`).

### Helpdesk (artigos e categorias do centro de ajuda)
- `GET /helpdesk` (filtros `search`, `popular`, `category`, `available`, `seo_url`).
- `POST /helpdesk` · `GET|PATCH|DELETE /helpdesk/{id}`.
- Categorias: `GET|POST /helpdesk/categories` · `GET|PATCH|DELETE /helpdesk/categories/{id}`.

### Integrations
- `GET /integrations` · `POST /integrations` · `GET /integrations/{id}`.
- `type` único actual: `kds`.

### Kitchens
- `GET /kitchens` (`store_id`) · `GET /kitchens/{id}`.
- Impressora: `GET|POST /kitchens/{id}/printer` (`status`, `printer`, `ip`, `port`, `data`).

### Products
- `GET /products` (filtros: `q`, `ids`, `title`, `store_id`, `reference`, `barcode`, `category_id`, `brand_id`, `status`, `type`).
- `POST /products` · `GET|PATCH|DELETE /products/{id}`.
- Campos: `reference`, `barcode`, `supplier_code`, `title`, `description`, `supply_price`, `gross_price`, `prices[]`, `unit_id`, `type_id` (`P|S|O|I|E`), `class_id` (`ALI`, `ALT`, `CUL`, `DEP`, `EDM`, `CAS`, `PCS`, `MOD`, `PER`, `JOI`), `lot_control`, `stock_control`, `stock_type` (`M|P|A|S|T`), `tax_id` (`NOR|OUT|INT|IVA-CAB|RED|ISE`), `tax_exemption` (M00…M94), `category_id`, `brand_id`, `image`, `status`.

#### Sub-recursos de Products
- **Brands:** `GET|POST /products/brands` · `GET /products/brands/{id}`.
- **Categories:** `GET|POST /products/categories` · `GET /products/categories/{id}`.
- **Deposits:** `GET|POST /products/deposits` · `GET|PATCH /products/deposits/{id}`.
- **Lots:** `GET|POST /products/{id}/lots` (filtro `status` `active|expired`).
- **Pricegroups:** `GET|POST /products/pricegroups` · `GET /products/pricegroups/{id}`.
- **Stocks:** `GET /products/stocks/{id}` · `POST /products/stocks` (`type` `reset|add|remove|transfer`; usa `store_id_target` para transferir).
- **Units:** `GET /products/units` · `GET /products/units/{id}`.
- **Variants:** `GET /products/variants` (`parent_id`).

### Receipts (templates de impressão)
- `GET /receipts` (filtros `status`) · `POST /receipts` · `GET|PATCH /receipts/{id}`.
- Layouts: `receipt` (térmica) ou `layouta4`.

### Registers (POS / caixas)
- `GET /registers` (filtros `store_id`, `type`, `isActive`). Tipos: `auto`, `pos`, `rest`, `api`, `office`, `rest_terminal`.
- `GET /registers/{id}` — devolve detalhes incluindo `prices_group`, opções de impressão, `default_pay_due`.
- Saldo: `GET /registers/balance`.
- Movimentos: `GET /registers/{id}/movements` (`since`, `until`, `return`, `operation`). `POST /registers/{id}/movements` (`operation` ∈ `in|out|open|close|point`, `type` (método de pagamento), `amount`, `obs`, `output` `pdf|escpos|html|email`).

### Rooms & Tables (restauração)
- `GET /rooms` (`store_id`) · `GET /rooms/{id}`.
- `GET /tables` (`parent`) · `GET /tables/{id}`. Inclui `occupation`, `people_request`.

### Selfconsumption (auto-consumo funcionários)
- `GET /selfconsumption` (filtros: `search_employee`, `refresh`, `date_start`, `date_end`, `store_id`).
- `POST /selfconsumption` · `GET|PATCH|DELETE /selfconsumption/{id}`.

### Stores
- `GET /stores` (filtro `type` `all|store|warehouse`) · `GET /stores/{id}`.

### Suppliers
- `GET /suppliers` (`q`, `fiscal_id`, `name`, `email`, `status`).
- `POST /suppliers` · `GET|PATCH /suppliers/{id}`.

### Taxes
- `GET /taxes` (filtro `all`).
- `GET /taxes/exemptions` — códigos M00…M94 + lei aplicável.

### Tax Authority (SAF-T)
- `GET /taxauthority/saft?year=YYYY&month=MM` → `xml` em base64.

### VendusPay
- `POST /venduspay/register` — registo na pasarela Vendus Pay.

### Courses (formação)
- `GET /courses/classes` · `GET /courses/classes/{id}`
- `GET /courses/modules` · `GET /courses/modules/{id}`
- `POST /courses/percentage`
- `GET /courses/users/{id}`

---

## 7. SDK PHP oficial

- Repo: <https://github.com/vendus/vendus-sdk-php>
- Encapsula autenticação e endpoints — recomendado quando o stack é PHP.
- Pasta `docs/` no repo contém referência e a `docs/examples/` exemplos prontos a correr.

## 8. Notas práticas

1. Os exemplos do portal mostram autenticação **HTTP Basic** com a key no campo `user` e password vazia — é o padrão a usar via cURL.
2. Os campos `tax_id` / `tax_exemption` seguem o normativo angolano (AGT) e português (AT). Validar consoante `country` da conta.
3. Para criar facturas com **referência multibanco**: enviar `multibanco` (entity/reference/amount) ou activar `ifthenpay` / `eupago`.
4. Geração de **PDF**: passar `.pdf` no `{id}` ou `output=pdf` no `POST /documents`.
5. Para imprimir directo no POS Térmico use `output=escpos` (resposta base64).
6. **`mode=tests`** em `documents`/`covenants` permite emitir documentos não fiscais para testes.
7. **ATCUD + QR code** vêm de fábrica na resposta de criação de facturas.
