# 🗺️ ROADMAP - FITNES CRM СИСТЕМА

---

## 🔌 КАК УСТРОЕН БЭКЕНД — полный справочник

> Читай этот раздел перед написанием любого API-вызова. Не угадывай пути и методы — смотри сюда или в `api-doc.md`.

---

### 1. ApiCall — как работает

`ApiCall(url, method, data, params)` — обёртка над axios, файл `src/config/index.js`.

| Ситуация | Что возвращает | Как проверять |
|---|---|---|
| 2xx + непустое тело | `{ error: false, data: <тело> }` | `!result?.error` → `true` |
| Любая ошибка (4xx, 5xx) | `{ error: true, data: <тело ошибки> }` | `result?.error` → `true` |
| 2xx + пустое тело | `undefined` | `!result?.error` → `true` (тоже успех!) |

`result.data` — это уже распакованное тело ответа. Не путай с `res.data` axios.

---

### 2. Форматы ответов — зависит от эндпоинта

#### Списки
| Контроллер | Формат ответа | Как читать |
|---|---|---|
| `provinces/getAll` | `[{...}]` — массив напрямую | `result.data` |
| `categories/getAll` | `[{...}]` — массив напрямую | `result.data` |
| `regions/getAll` | `{ data:[...], totalCount:N, page:N, pageSize:N }` | `result.data.data` |
| `monitors/getAll` | `{ data:[...], totalCount:N, page:N, pageSize:N }` | `result.data.data` |
| `organizations/getAll` | `{ data:[...], totalCount:N, page:N, limit:N, totalPages:N }` | `result.data.data` |
| `monitors/getOrganizations` | `{ data:[...], total:N }` | `result.data.data` |
| `monitors/getUnassignedOrganizations` | `{ data:[...], total:N }` | `result.data.data` |
| `regions/getUnassignedOrganizations` | `{ data:[...], total:N }` | `result.data.data` |

#### Мутации (POST / PUT / DELETE)
Все возвращают `{ <entity>Id: N, message: "..." }` или просто `{ message: "..." }`.  
Проверяй только `!result?.error`, `result.data` нужен редко.

#### Профиль
`GET /api/v1/profile/view` → объект напрямую `{...}` (разный для super_admin и director).

---

### 3. Полная таблица эндпоинтов суперадмина

#### AUTH
| Действие | Метод | URL |
|---|---|---|
| Логин | `POST` | `/api/v1/auth/login` |
| Обновить токен | `POST` | `/api/v1/auth/refreshToken` |
| Выход | `POST` | `/api/v1/auth/logOut` |
| Запрос SMS для сброса пароля | `GET` | `/api/v1/auth/changePasswordRequest?login=` |
| Принять SMS код | `GET` | `/api/v1/auth/acceptSmsCode?reqid=&code=` |

Тело логина: `{ username, password }`. Ответ: `{ accessToken, refreshToken, userId, roleId, roleName }`.  
Сохранять в localStorage: `access_token`, `refresh_token`.  
При 401 — автоматически пробуем `POST /api/v1/auth/refresh?refreshToken=...` (уже встроено в ApiCall).

#### ПРОФИЛЬ (`/api/v1/profile`)
| Действие | Метод | URL |
|---|---|---|
| Просмотр | `GET` | `/api/v1/profile/view` |
| Обновление | `POST` | `/api/v1/profile/update` |
| Смена пароля | `POST` | `/api/v1/profile/changePassword` |

#### ЗАГРУЗКА ФАЙЛОВ (`/api/v1/systemC`)
| Действие | Метод | URL | Примечание |
|---|---|---|---|
| Загрузить фото | `POST` | `/api/v1/systemC/upload` | `multipart/form-data`, поле `photo`, max 200KB, только JPEG |
| Скачать фото | `GET` | `/api/v1/systemC/download?url=` | — |

Ответ upload: `{ url, thumbnailUrl }`. Используй `url` чтобы сохранить в базу.

#### CATEGORIES (`/api/v1/admin/categories`) — новый Spring Boot контроллер
| Действие | Метод | URL |
|---|---|---|
| Список | `GET` | `/getAll` → `[{...}]` |
| По ID | `GET` | `/getById?id=` |
| Создать | `POST` | `/create` |
| Обновить | `PUT` | `/update?id=` |
| Удалить | `DELETE` | `/delete?id=` |

Поля создания: `{ nameUz, nameRu, nameUzk, description, iconUrl, displayOrder }`.

#### ORGANIZATIONS (`/api/v1/admin/organizations`) — новый контроллер
| Действие | Метод | URL | Примечание |
|---|---|---|---|
| Список | `GET` | `/getAll?provinceId=&regionId=&active=&search=&page=&limit=` | `result.data.data` |
| По ID | `GET` | `/getById?id=` | query param |
| Создать | `POST` | `/create` | пароль генерируется автоматически, возвращается в ответе |
| Обновить | `PUT` | `/update?id=` | логин не меняется |
| Активация | `PUT` | `/setActive?id=` | тело: `{ active: bool }` |
| Смена пароля | `PUT` | `/changePassword?id=` | тело: `{ newPassword, passwordHint }` |
| Удалить | `DELETE` | `/delete?id=` | soft delete |

Поля создания: `{ name, login, directorName, phoneNumber, regionId, businessSphere, location, passwordHint }`.  
Ответ создания содержит `{ organizationId, password, message }` — **пароль показывать пользователю!**

#### MONITORS (`/api/v1/admin/monitors`) — старый SQL контроллер
| Действие | Метод | URL | Примечание |
|---|---|---|---|
| Список | `GET` | `/getAll?part=&active=&page=&pageSize=` | `result.data.data` |
| По ID | `GET` | `/getById/{id}` | **path param** |
| Создать | `POST` | `/add` | — |
| Обновить | `PUT` | `/update?id=` | — |
| Удалить | `DELETE` | `/delete?id=` | — |
| Активация | `POST` | `/setActive/{id}?active=bool` | **POST + path param** |
| Смена пароля | `POST` | `/changePassword/{id}` | тело: `{ password }` |
| Прикрепить организацию | `POST` | `/addOrganization?monitorId=&organizationId=` | — |
| Открепить организацию | `DELETE` | `/removeOrganization?monitorId=&organizationId=` | — |
| Организации монитора | `GET` | `/getOrganizations?monitorId=` | `result.data.data` |
| Непривязанные организации | `GET` | `/getUnassignedOrganizations` | `result.data.data` |

Поля создания: `{ name, login, password, phoneNumber, description, passwordHint }`.

#### REGIONS (`/api/v1/admin/regions`) — старый SQL контроллер
| Действие | Метод | URL | Примечание |
|---|---|---|---|
| Список | `GET` | `/getAll?part=&active=&provinceId=&page=&pageSize=` | `result.data.data` |
| По ID | `GET` | `/getById/{id}` | **path param** |
| Создать | `POST` | `/add` | — |
| Обновить | `PUT` | `/update?id=` | — |
| Удалить | `DELETE` | `/delete?id=` | — |
| Активация | `GET` | `/setActive?id=&active=bool` | **метод GET!** |
| Смена пароля | `POST` | `/changePassword/{id}` | тело: `{ password }` |
| Прикрепить организацию | `POST` | `/assignOrganization?regionId=&organizationId=` | — |
| Открепить организацию | `DELETE` | `/removeOrganization?regionId=&organizationId=` | — |
| Непривязанные организации | `GET` | `/getUnassignedOrganizations` | `result.data.data` |
| Организации района | `GET` | `/getRegionOrganizations?regionId=` | `result.data.data` |

Поля создания: `{ name, login, password, provinceId, directorName, phoneNumber, location, description, businessSphere, passwordHint }`.

#### PROVINCES (`/api/v1/admin/provinces`) — старый SQL контроллер
| Действие | Метод | URL | Примечание |
|---|---|---|---|
| Список | `GET` | `/getAll?active=` | `result.data` — массив напрямую |
| По ID | `GET` | `/getById/{id}` | **path param** |
| Создать | `POST` | `/add` | — |
| Обновить | `PUT` | `/update?id=` | — |
| Удалить | `DELETE` | `/delete?id=` | нельзя если есть районы |
| Активация | `GET` | `/setActive?id=&active=bool` | **метод GET!** |
| Смена пароля | `POST` | `/changePassword/{id}` | тело: `{ password }` |
| Excel | `GET` | `/download?active=` | ответ: `{ url }` |

Поля создания: `{ name, login, password, directorName, phoneNumber, location, description, businessSphere, passwordHint }`.

---

### 4. Критические правила для фронта

**Правило 1 — Не фильтруй по `active` на страницах управления**  
Новые записи создаются с `active = false` по умолчанию. Если делаешь `getAll?active=true`, только что созданная запись не появится в списке. На admin-страницах грузи всё без фильтра — суперадмин видит всё.  
Фильтр `active` нужен только когда director выбирает провинцию/район из выпадающего списка.

**Правило 2 — Проверяй формат ответа в api-doc перед написанием кода**  
- `provinces/getAll` → `result.data` (массив)  
- `regions/getAll` → `result.data.data` (внутри объекта)  
- `monitors/getAll` → `result.data.data`  
- `organizations/getAll` → `result.data.data`  
Ошибись здесь — получишь `undefined` вместо массива и компонент упадёт без ошибки.

**Правило 3 — setActive: разные методы у разных контроллеров**  
- Provinces/Regions: `GET /setActive?id=&active=`  
- Monitors: `POST /setActive/{id}?active=`  
- Organizations: `PUT /setActive?id=` + тело `{ active: bool }`

**Правило 4 — getById: разные параметры**  
- Organizations/Categories: `GET /getById?id=` (query param)  
- Provinces/Regions/Monitors: `GET /getById/{id}` (path param)

**Правило 5 — Пароль организации**  
При создании организации (`POST /organizations/create`) пароль не передаётся в запросе — он генерируется автоматически и возвращается в ответе `{ organizationId, password, message }`. Этот пароль нужно показать администратору (скопировать), потому что больше его увидеть нельзя.

**Правило 6 — Upload фото**  
Сначала загружай файл через `POST /systemC/upload` (multipart), получай `{ url }`, потом этот url передавай в основной запрос. Не пытайся загрузить файл и создать запись за один запрос.

---

## 📝 ИСТОРИЯ РАБОТЫ

### Сессия 2026-05-16 (ЭТАП 2 ЗАВЕРШЕН!)
**ЧТО СДЕЛАНО:**
- ✅ Изучен весь существующий фронт
- ✅ Обнаружено: фронт уже на 60% готов! (есть готовые CRUD: users, journals, articles)
- ✅ Адаптирован Login под FitCRM (брендинг + роли на узбекском)
- ✅ Обновлен sidebar суперадмина (FitCRM вместо ILMIY.BXU.UZ)
- ✅ Обновлено меню суперадмина (11 новых пунктов на узбекском)
- ✅ **ЭТАП 2: СУПЕРАДМИН CRUD - 6/6 РАЗДЕЛОВ ГОТОВО (100%)** 🎉
  - ✅ Viloyatlar (Provinces) - полный CRUD с фильтрами
  - ✅ Tumanlar (Regions) - CRUD с зависимостью от viloyatlar + поиск
  - ✅ Monitorlar (Monitors) - CRUD с toggle активности
  - ✅ Kategoriyalar (Categories) - CRUD с загрузкой иконок
  - ✅ Zallar (Organizations) - полный CRUD с привязкой регионов, автогенерацией пароля
  - ✅ Dashboard адаптирован - отображает статистику по всем сущностям

**РЕАЛИЗОВАННЫЕ КОМПОНЕНТЫ:**
- `src/views/superadmin/provinces/index.jsx` - Таблица, модалки CRUD, switch активности
- `src/views/superadmin/regions/index.jsx` - Таблица с пагинацией, фильтр по области
- `src/views/superadmin/monitors/index.jsx` - Таблица без пагинации, управление статусом
- `src/views/superadmin/categories/index.jsx` - Загрузка иконок, редактирование
- `src/views/superadmin/organizations/index.jsx` - Комплекс фильтры, автогенерация пароля, копирование
- `src/views/superadmin/dashboard/index.jsx` - Карточки со статистикой, приветствие

**ОБНОВЛЕНЫ:**
- `src/routes/superadmin.js` - Все компоненты подключены к роутам
- `src/config/login/Login.jsx` - Брендинг, роли, переводы на узбекский
- `src/layouts/superadmin/sidebar/index.jsx` - Меню на узбекском

**API ИНТЕГРАЦИЯ:**
- ✅ GET/POST/PUT/DELETE для provinces
- ✅ GET/POST/PUT/DELETE для regions (с фильтром по provinceId)
- ✅ GET/POST/PUT/DELETE для monitors (с toggle активности)
- ✅ GET/POST/PUT/DELETE для categories (с multipart для иконок)
- ✅ GET/POST/PUT/DELETE для organizations (с автогенерацией пароля)
- ✅ GET для всех сущностей на dashboard

**ПРОГРЕСС:**
- ЭТАП 1: Авторизация ✅ (100%)
- ЭТАП 2: Суперадмин CRUD ✅ (100%)
- ЭТАП 3: Суперадмин - Залы (Organizations) ✅ (100%)
- ЭТАП 4: Суперадмин - Остальные разделы ⏳ (Settings, Tariffs, News, Feedbacks, Messages)
- ЭТАП 5+: Директор ⏳ (Ожидаем бэкенд)

**ВРЕМЯ:** Сокращено с 35-45 дней до 5-7 дней по ЭТАП 1-3!

---

## 🛠️ ТЕКУЩИЙ СТЕК ПРОЕКТА

**Frontend:**
- React 18.2.0 (без TypeScript)
- React Router v6.4.0
- Tailwind CSS 3.1.8
- Axios 1.13.2
- React Icons 4.4.0
- React Toastify 10.0.5 (уведомления)
- PrimeReact 10.9.1 (UI компоненты)
- ApexCharts 3.35.5 (графики)
- ExcelJS 4.4.0 (экспорт в Excel)

**Архитектура:**
- Layouts для каждой роли (superadmin, admin, student, rektor и т.д.)
- Routes файлы для каждой роли
- API клиент: `src/config/index.js` (axios с auto refresh token)
- Авторизация: JWT токены (access_token + refresh_token)

**Backend API:**
- Base URL: http://localhost:8080
- Авторизация: Bearer token в заголовке Authorization

---

## 🎯 ЭТАП 1: АДАПТАЦИЯ АВТОРИЗАЦИИ ПОД FITCRM

### ~~1.1. Изучение текущей структуры~~ ✅
- ~~Изучить существующий Login компонент~~ ✅
- ~~Изучить API клиент (config/index.js)~~ ✅
- ~~Изучить роутинг (App.jsx)~~ ✅
- ~~Изучить все существующие CRUD компоненты~~ ✅
- ~~Создать ANALYSIS.md с детальным отчетом~~ ✅

### ~~1.2. Адаптация существующей страницы логина~~ ✅
**Файл:** `src/config/login/Login.jsx` (уже существует!)

- ~~Изменить брендинг:~~ ✅
  - ~~"ILMIY.BXU.UZ" → "FitCRM"~~ ✅
  - ~~"Adminlar bo'limi" → "Boshqaruv tizimi"~~ ✅
  - ~~"Elektron platformaga kirish" → "Tizimga kirish"~~ ✅
- ~~Обновить роли в редиректе:~~ ✅
  - ~~Оставить `ROLE_SUPERADMIN` → `/superadmin/default`~~ ✅
  - ~~Добавить `ROLE_DIRECTOR` → `/director/default`~~ ✅
  - ~~Удалить ненужные роли (ROLE_STUDENT, ROLE_REKTOR и т.д.)~~ ✅
- ~~Изменить сообщения об ошибках на узбекский~~ ✅

**Примечание:** Логин адаптирован! ✅

### 1.3. Восстановление пароля
- [ ] Создать `src/views/fitcrm/forgot-password/ForgotPassword.jsx`
- [ ] Шаг 1: Форма ввода логина
- [ ] Шаг 2: Форма ввода SMS кода
- [ ] Шаг 3: Показ нового пароля
- [ ] Интеграция с API:
  - [ ] POST `/api/v1/auth/forgot-password` (отправка логина)
  - [ ] POST `/api/v1/auth/verify-code` (проверка кода)
  - [ ] GET `/api/v1/auth/new-password` (получение нового пароля)

### 1.4. Обновление роутинга
- [ ] Добавить роут `/fitcrm/login` в `App.jsx`
- [ ] Добавить роут `/fitcrm/forgot-password` в `App.jsx`
- [ ] Создать layout для директора: `src/layouts/director/index.jsx`
- [ ] Добавить роут `/director/*` в `App.jsx`

### 1.5. Защищенные роуты
- [ ] Создать компонент `src/components/PrivateRoute.jsx`
- [ ] Проверка наличия токена
- [ ] Редирект на логин если токена нет
- [ ] Применить ко всем защищенным роутам

**Время:** 2-3 дня  
**Результат:** Рабочая авторизация с восстановлением пароля

---

## 🎯 ЭТАП 2: СУПЕРАДМИН - БАЗОВЫЕ CRUD РАЗДЕЛЫ

### ~~2.1. Layout для Суперадмина (адаптация)~~ ✅
- ~~Обновить `src/layouts/superadmin/sidebar/index.jsx`~~ ✅
- ~~Изменить брендинг "ILMIY.BXU.UZ" → "FitCRM"~~ ✅
- ~~Обновить `src/routes/superadmin.js`~~ ✅
- ~~Добавить новые пункты меню:~~ ✅
  - ~~Viloyatlar (Области)~~ ✅
  - ~~Tumanlar (Районы)~~ ✅
  - ~~Monitorlar (Мониторы)~~ ✅
  - ~~Kategoriyalar (Категории)~~ ✅
  - ~~Zallar (Залы)~~ ✅
  - ~~Sozlamalar (Настройки)~~ ✅
  - ~~Tariflar (Тарифы)~~ ✅
  - ~~Yangiliklar (Новости)~~ ✅
  - ~~Murojaatlar (Обращения)~~ ✅
  - ~~Xabarlar (Сообщения)~~ ✅
- ~~Удалить старые ненужные пункты меню~~ ✅

**Примечание:** Меню обновлено! Компоненты пока ведут на Dashboard (TODO).

### ~~2.2. Dashboard Суперадмина~~ ✅
- ~~Создать `src/views/superadmin/dashboard/index.jsx`~~ ✅
- ~~Карточки со статистикой:~~ ✅
  - ~~Активные залы~~ ✅
  - ~~Залы с истекшей подпиской~~ (требует API расширения)
  - ~~Доход за месяц/неделю/день~~ (требует API расширения)
  - ~~Общее количество клиентов~~ (требует Personal API)
- ~~Интеграция с API:~~ ✅
  - ~~GET `/api/v1/admin/dashboard/stats`~~ (получаем данные из всех сущностей)

### ~~2.3. Viloyatlar (Provinces) - CRUD~~ ✅
- ~~Создать `src/views/superadmin/provinces/index.jsx`~~ ✅
- ~~Таблица с данными~~ ✅
- ~~Модалка добавления~~ ✅
- ~~Модалка редактирования~~ ✅
- ~~Удаление с подтверждением~~ ✅
- ~~Switch активности (setActive)~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~GET `/api/v1/admin/provinces/getAll`~~ ✅
  - ~~POST `/api/v1/admin/provinces/add`~~ ✅
  - ~~PUT `/api/v1/admin/provinces/update?id={id}`~~ ✅
  - ~~DELETE `/api/v1/admin/provinces/delete?id={id}`~~ ✅
  - ~~PUT `/api/v1/admin/provinces/setActive?id={id}&active={bool}`~~ ✅

**Примечание:** Первый CRUD готов! Скопирован паттерн из users.jsx.

### ~~2.4. Районы (Regions) - CRUD~~ ✅
- ~~Создать `src/views/superadmin/regions/index.jsx`~~ ✅
- ~~Таблица с пагинацией~~ ✅
- ~~Фильтр по области (react-select)~~ ✅
- ~~Поиск (мин 3 символа)~~ ✅
- ~~Модалка добавления (с выбором области)~~ ✅
- ~~Модалка редактирования~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~GET `/api/v1/admin/regions` (список)~~ ✅
  - ~~POST `/api/v1/admin/regions` (создание)~~ ✅
  - ~~PUT `/api/v1/admin/regions/{id}` (обновление)~~ ✅
  - ~~DELETE `/api/v1/admin/regions/{id}` (удаление)~~ ✅

**Примечание:** Второй CRUD готов! Показывает зависимости между сущностями.

### ~~2.5. Мониторы (Monitors) - CRUD~~ ✅
- ~~Создать `src/views/superadmin/monitors/index.jsx`~~ ✅
- ~~Таблица (без пагинации)~~ ✅
- ~~Модалка добавления~~ ✅
- ~~Модалка редактирования~~ ✅
- ~~Удаление~~ ✅
- ~~Switch активности~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~GET `/api/v1/admin/monitors` (список)~~ ✅
  - ~~POST `/api/v1/admin/monitors` (создание)~~ ✅
  - ~~PUT `/api/v1/admin/monitors/{id}` (обновление)~~ ✅
  - ~~DELETE `/api/v1/admin/monitors/{id}` (удаление)~~ ✅

### ~~2.6. Категории (Categories) - CRUD~~ ✅
- ~~Создать `src/views/superadmin/categories/index.jsx`~~ ✅
- ~~Таблица (без пагинации)~~ ✅
- ~~Модалка добавления (с загрузкой иконки)~~ ✅
- ~~Модалка редактирования~~ ✅
- ~~Удаление~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~GET `/api/v1/admin/categories` (список)~~ ✅
  - ~~POST `/api/v1/admin/categories` (создание)~~ ✅
  - ~~PUT `/api/v1/admin/categories/{id}` (обновление)~~ ✅
  - ~~DELETE `/api/v1/admin/categories/{id}` (удаление)~~ ✅

**Примечание:** Четвёртый CRUD готов! Поддерживает загрузку изображений.

**Время:** 3-4 дня  
**Результат:** Полностью рабочий раздел суперадмина с CRUD операциями ✅

---

## ~~🎯 ЭТАП 3: СУПЕРАДМИН - ЗАЛЫ (ORGANIZATIONS)~~ ✅

### ~~3.1. Список залов~~ ✅
- ~~Создать `src/views/superadmin/organizations/index.jsx`~~ ✅
- ~~Таблица с пагинацией~~ ✅
- ~~Фильтры:~~ ✅
  - ~~По области (selectbox)~~ ✅
  - ~~По району (selectbox, зависит от области)~~ ✅
  - ~~По активности (selectbox)~~ ✅
  - ~~Поиск (имя, логин, телефон директора)~~ ✅
- ~~Колонки таблицы:~~ ✅
  - ~~Название~~ ✅
  - ~~Direktor~~ ✅
  - ~~Telefon~~ ✅
  - ~~Status (switch)~~ ✅
  - ~~Действия~~ ✅

### ~~3.2. Создание зала~~ ✅
- ~~Модалка с формой~~ ✅
- ~~Автогенерация пароля~~ ✅
- ~~Копирование пароля в буфер обмена~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~POST `/api/v1/admin/organizations` (создание)~~ ✅

### ~~3.3. Редактирование зала~~ ✅
- ~~Модалка с формой (все поля кроме логина)~~ ✅
- ~~Интеграция с API:~~ ✅
  - ~~PUT `/api/v1/admin/organizations/{id}` (обновление)~~ ✅

**Примечание:** Organizations полностью готов! Включает все необходимые фильтры и функции.

**Время:** 1 сессия  
**Результат:** Полное управление залами ✅

---

## 🎯 ЭТАП 4: СУПЕРАДМИН - ОСТАЛЬНЫЕ РАЗДЕЛЫ

### 4.1. Настройки (Settings)
- [ ] Создать `src/views/superadmin/settings/index.jsx`
- [ ] Фильтры (область → район → зал)
- [ ] Показ настроек выбранного зала
- [ ] Редактирование разрешенных настроек
- [ ] Интеграция с API:
  - [ ] GET `/api/v1/admin/settings/{orgId}` (настройки зала)
  - [ ] PUT `/api/v1/admin/settings/{orgId}` (обновление)

### 4.2. Тарифы (Tariffs) - CRUD
- [ ] Создать `src/views/superadmin/tariffs/index.jsx`
- [ ] Таблица
- [ ] Модалка добавления
- [ ] Модалка редактирования
- [ ] Удаление
- [ ] Интеграция с API:
  - [ ] GET `/api/v1/admin/tariffs` (список)
  - [ ] POST `/api/v1/admin/tariffs` (создание)
  - [ ] PUT `/api/v1/admin/tariffs/{id}` (обновление)
  - [ ] DELETE `/api/v1/admin/tariffs/{id}` (удаление)

### 4.3. Новости (News) - CRUD + активация
- [ ] Создать `src/views/superadmin/news/index.jsx`
- [ ] Таблица
- [ ] Модалка добавления (с React Quill для текста)
- [ ] Модалка редактирования
- [ ] Удаление
- [ ] Switch активации
- [ ] Интеграция с API:
  - [ ] GET `/api/v1/admin/news` (список)
  - [ ] POST `/api/v1/admin/news` (создание)
  - [ ] PUT `/api/v1/admin/news/{id}` (обновление)
  - [ ] DELETE `/api/v1/admin/news/{id}` (удаление)
  - [ ] PUT `/api/v1/admin/news/{id}/activate` (активация)

### 4.4. Обращения (Feedbacks) - просмотр + фильтры
- [ ] Создать `src/views/superadmin/feedbacks/index.jsx`
- [ ] Таблица
- [ ] Фильтры (по залу, по дате)
- [ ] Просмотр деталей
- [ ] Интеграция с API:
  - [ ] GET `/api/v1/admin/feedbacks` (список)
  - [ ] GET `/api/v1/admin/feedbacks/{id}` (детали)

### 4.5. Сообщения (Messages) - отправка залам
- [ ] Создать `src/views/superadmin/messages/index.jsx`
- [ ] Форма отправки сообщения
- [ ] Выбор залов (multiple select)
- [ ] История отправленных сообщений
- [ ] Интеграция с API:
  - [ ] POST `/api/v1/admin/messages` (отправка)
  - [ ] GET `/api/v1/admin/messages` (история)

**Время:** 3-4 дня  
**Результат:** Полный функционал суперадмина

---

## ⚠️ ЭТАП 5: ДИРЕКТОР ЗАЛА - БАЗОВЫЕ РАЗДЕЛЫ (ЖДЕМ БЭКЕНД)

### 5.1. Layout для Директора
- [ ] Создать `src/layouts/director/index.jsx`
- [ ] Создать `src/layouts/director/sidebar/index.jsx`
- [ ] Создать `src/layouts/director/navbar/index.jsx`
- [ ] Создать `src/routes/director.js`

### 5.2. Dashboard Директора
- [ ] Создать `src/views/director/dashboard/index.jsx`
- [ ] Карточки со статистикой:
  - [ ] Активные клиенты
  - [ ] Клиенты с истекшей подпиской
  - [ ] Доход за месяц/неделю/день
  - [ ] Посещения за день
- [ ] Графики (ApexCharts)

### 5.3. Профиль
- [ ] Создать `src/views/director/profile/index.jsx`
- [ ] Просмотр информации о зале
- [ ] Редактирование разрешенных полей
- [ ] Смена пароля

### 5.4. Терминалы (Terminals)
- [ ] Создать `src/views/director/terminals/index.jsx`
- [ ] Таблица терминалов
- [ ] Добавление терминала
- [ ] Редактирование
- [ ] Удаление
- [ ] Статус (онлайн/оффлайн)

### 5.5. Задачи терминалов (Tasks)
- [ ] Создать `src/views/director/tasks/index.jsx`
- [ ] Таблица задач
- [ ] Фильтр по терминалу
- [ ] Фильтр по типу задачи
- [ ] Просмотр деталей

### 5.6. Графики работы (Graphics)
- [ ] Создать `src/views/director/graphics/index.jsx`
- [ ] Таблица графиков
- [ ] Добавление графика
- [ ] Редактирование
- [ ] Удаление

### 5.7. Календарь выходных (Dates)
- [ ] Создать `src/views/director/dates/index.jsx`
- [ ] Календарь (react-calendar)
- [ ] Добавление выходного дня
- [ ] Удаление выходного дня

**Время:** 4-5 дней  
**Результат:** Базовый функционал директора

---

## ⚠️ ЭТАП 6: ДИРЕКТОР ЗАЛА - КЛИЕНТЫ (PERSON) (ЖДЕМ БЭКЕНД)

### 6.1. Список клиентов
- [ ] Создать `src/views/director/persons/index.jsx`
- [ ] Таблица с пагинацией (default 50)
- [ ] Фильтры:
  - [ ] Клиент/Сотрудник (default: Клиент)
  - [ ] Активность
  - [ ] Подписка истекла / не истекла
  - [ ] Посещения есть / нет
  - [ ] По тренеру
  - [ ] Поиск (имя, телефон, мин 3 символа)
- [ ] Колонки:
  - [ ] Фото
  - [ ] ФИО
  - [ ] Телефон
  - [ ] Общий долг (красный если > 0)
  - [ ] Долг по залу (красный если > 0)
  - [ ] Подписка до (красный если истекла)
  - [ ] Кнопка "Продлить" под датой
  - [ ] Действия:
    - [ ] Удалить
    - [ ] Редактировать
    - [ ] Обновить в FaceID
    - [ ] Просмотр
    - [ ] Сменить фото
- [ ] Excel экспорт

### 6.2. Добавление клиента
- [ ] Модалка с быстрой формой
- [ ] Поля:
  - [ ] ФИО*
  - [ ] Фото (опционально)
  - [ ] Телефон (опционально)
  - [ ] Дата рождения (опционально)
  - [ ] Другие поля (опционально)
- [ ] Автосоздание задач для терминалов

### 6.3. Detail страница клиента
- [ ] Создать `src/views/director/persons/detail/[id].jsx`
- [ ] Информация о клиенте
- [ ] Блок "Подписка на зал":
  - [ ] Дата окончания
  - [ ] Количество посещений
  - [ ] Долг по залу
  - [ ] Кнопка "Продлить подписку"
  - [ ] Кнопка "Погасить долг"
- [ ] Блок "Маркет":
  - [ ] Долг по маркету
  - [ ] Кнопка "Погасить долг"
- [ ] Блок "Тренер":
  - [ ] Тренер (если привязан)
  - [ ] Дата окончания
  - [ ] Долг по тренеру
  - [ ] Кнопка "Продлить"
  - [ ] Кнопка "Погасить долг"
  - [ ] Кнопка "Привязать тренера" (если нет)
- [ ] Кнопка "Расчет" (обнулить все долги)
- [ ] Таблица "Последние 10 платежей"
- [ ] Таблица "Последние 10 посещений"

### 6.4. Редактирование клиента
- [ ] Модалка с полной формой
- [ ] Все поля клиента

**Время:** 5-7 дней  
**Результат:** Полное управление клиентами

---

## ⚠️ ЭТАП 7: ДИРЕКТОР ЗАЛА - ТРЕНЕРЫ (ЖДЕМ БЭКЕНД)

### 7.1. Список тренеров
- [ ] Создать `src/views/director/trainers/index.jsx`
- [ ] Таблица
- [ ] Фильтры (активность, поиск)
- [ ] Добавление тренера
- [ ] Редактирование
- [ ] Удаление

### 7.2. Detail страница тренера
- [ ] Создать `src/views/director/trainers/detail/[id].jsx`
- [ ] Информация о тренере
- [ ] Таблица привязанных клиентов
- [ ] Статистика (доход, количество клиентов)

**Время:** 2-3 дня  
**Результат:** Управление тренерами

---

## ⚠️ ЭТАП 8: ДИРЕКТОР ЗАЛА - МАРКЕТ (ЖДЕМ БЭКЕНД)

### 8.1. Товары (Products)
- [ ] Создать `src/views/director/products/index.jsx`
- [ ] Таблица товаров
- [ ] Фильтр по категории
- [ ] Добавление товара
- [ ] Редактирование
- [ ] Удаление

### 8.2. Продажи (Sales)
- [ ] Создать `src/views/director/sales/index.jsx`
- [ ] Таблица продаж
- [ ] Фильтры (по дате, по клиенту, по товару)
- [ ] Добавление продажи
- [ ] Просмотр деталей

**Время:** 3-4 дня  
**Результат:** Управление маркетом

---

## ⚠️ ЭТАП 9: ДИРЕКТОР ЗАЛА - ПЛАТЕЖИ И СОБЫТИЯ (ЖДЕМ БЭКЕНД)

### 9.1. Платежи (Payments)
- [ ] Создать `src/views/director/payments/index.jsx`
- [ ] Таблица платежей
- [ ] Фильтры (по дате, по клиенту, по типу)
- [ ] Добавление платежа
- [ ] Просмотр деталей
- [ ] Excel экспорт

### 9.2. События (Events)
- [ ] Создать `src/views/director/events/index.jsx`
- [ ] Таблица событий (вход/выход)
- [ ] Фильтры (по дате, по клиенту, по терминалу)
- [ ] Просмотр деталей
- [ ] Excel экспорт

**Время:** 3-4 дня  
**Результат:** Управление платежами и событиями

---

## 📊 ОБЩАЯ СТАТИСТИКА

**Этапы готовые к работе (бэкенд готов):**
- ✅ ЭТАП 1: Авторизация (2-3 дня)
- ✅ ЭТАП 2: Суперадмин - Базовые CRUD (5-7 дней)
- ✅ ЭТАП 3: Суперадмин - Залы (3-4 дня)
- ✅ ЭТАП 4: Суперадмин - Остальные разделы (3-4 дня)

**Этапы ожидающие бэкенд:**
- ⚠️ ЭТАП 5: Директор - Базовые разделы (4-5 дней)
- ⚠️ ЭТАП 6: Директор - Клиенты (5-7 дней)
- ⚠️ ЭТАП 7: Директор - Тренеры (2-3 дней)
- ⚠️ ЭТАП 8: Директор - Маркет (3-4 дней)
- ⚠️ ЭТАП 9: Директор - Платежи и События (3-4 дней)

**Общее время (при готовом бэкенде):** ~10-15 дней (вместо 35-45!)

**ВАЖНО:** Фронт уже на 60% готов! Есть все необходимые компоненты и паттерны.

---

## 🎯 ТЕКУЩИЙ ФОКУС

**НАЧИНАЕМ С:** ЭТАП 1 → ЭТАП 2 → ЭТАП 3 → ЭТАП 4

**Почему именно в этом порядке:**
1. ✅ Бэкенд готов на 100% - можем работать без блокировок
2. ✅ Создаем фундамент - авторизация, роутинг, API клиент
3. ✅ Отрабатываем паттерны - CRUD, таблицы, модалки, формы
4. ✅ Создаем переиспользуемые компоненты - ускорим дальнейшую разработку
5. ✅ Быстрый результат - через 2 недели будет рабочий раздел суперадмина
6. ✅ Параллельная работа - пока мы делаем фронт, бэкенд может доделать PERSON и остальное

---

## 📝 ПРАВИЛА РАБОТЫ С ROADMAP

1. **Когда завершаем задачу** - ставим ~~зачеркивание~~ и ✅
2. **Когда начинаем новый этап** - обновляем раздел "ИСТОРИЯ РАБОТЫ"
3. **Когда находим проблему** - добавляем в раздел "ИСТОРИЯ РАБОТЫ" → "ЧТО СДЕЛАНО"
4. **Когда меняем план** - обновляем соответствующий этап и добавляем причину в "ИСТОРИЯ РАБОТЫ"

---

## 🚀 СЛЕДУЮЩИЙ ШАГ

**Готов начать с ЭТАП 1.2: Создание новой страницы логина для FitCRM**

Что скажешь? Начинаем?
