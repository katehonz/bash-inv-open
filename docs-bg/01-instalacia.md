# Инсталация и Стартиране - Bash Inv Web Електронно Фактуриране

## Предварителни изисквания

### Системни изисквания

- **Операционна система:** Linux, macOS, или Windows (с WSL2)
- **RAM:** Минимум 4GB (препоръчва се 8GB)
- **Диск:** Минимум 2GB свободно пространство
- **Интернет:** За изтегляне на dependencies и валутни курсове

### Софтуер

1. **Java Development Kit (JDK) 17 или по-нова версия**
   ```bash
   # Проверка на версията
   java -version

   # Трябва да видите нещо като:
   # openjdk version "17.0.x"
   ```

   Инсталация на Ubuntu/Debian:
   ```bash
   sudo apt update
   sudo apt install openjdk-17-jdk
   ```

2. **Apache Maven 3.8 или по-нова версия**
   ```bash
   # Проверка на версията
   mvn -version
   ```

   Инсталация на Ubuntu/Debian:
   ```bash
   sudo apt install maven
   ```

3. **Node.js 16+ и npm**
   ```bash
   # Проверка на версията
   node -v
   npm -v
   ```

   Инсталация (препоръчва се nvm):
   ```bash
   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
   nvm install 18
   nvm use 18
   ```

4. **PostgreSQL 15 или по-нова версия**
   ```bash
   # Проверка на версията
   psql --version
   ```

   Инсталация на Ubuntu/Debian:
   ```bash
   sudo apt install postgresql postgresql-contrib
   sudo systemctl start postgresql
   sudo systemctl enable postgresql
   ```

## Инсталация стъпка по стъпка

### 1. Клониране на проекта

```bash
git clone <repository-url>
cd sp-inv
```

### 2. Настройка на базата данни

#### 2.1. Създаване на база данни и потребител

```bash
# Влизане в PostgreSQL като postgres потребител
sudo -u postgres psql

# В PostgreSQL конзолата:
CREATE DATABASE sp-inv-app;
CREATE USER postgres WITH PASSWORD 'YOUR_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON DATABASE sp-inv-app TO postgres;
\q
```

#### 2.2. Проверка на връзката

```bash
psql -h localhost -U postgres -d sp-inv-app
# Въведете паролата: YOUR_PASSWORD_HERE
# Ако влезете успешно, напишете \q за изход
```

### 3. Конфигуриране на Backend

#### 3.1. Редактиране на application.properties

```bash
cd backend
nano src/main/resources/application.properties
```

Основни настройки за промяна:

```properties
# Database Configuration
spring.datasource.url=jdbc:postgresql://localhost:5432/sp-inv-app
spring.datasource.username=postgres
spring.datasource.password=pas+123

# Currency Configuration (преди 2026)
currency.default-currency=BGN
currency.force-eurozone-mode=false
currency.enable-bnb-rates=true
currency.enable-ecb-rates=false

# Currency Configuration (след 2026)
# currency.default-currency=EUR
# currency.force-eurozone-mode=true
# currency.enable-bnb-rates=false
# currency.enable-ecb-rates=true

# VIES Configuration
vies.enabled=true
vies.timeout=5000
vies.cache.ttl=1800
```

#### 3.2. Build на Backend

```bash
# В папката backend/
mvn clean install

# Ако виждате "BUILD SUCCESS" - всичко е наред!
```

### 4. Конфигуриране на Frontend

```bash
cd ../frontend
npm install
```

Ако срещнете проблеми с dependencies:
```bash
npm install --legacy-peer-deps
```

### 5. Първоначално стартиране

#### Опция 1: Използване на скриптовете (препоръчва се)

```bash
# От главната папка на проекта
./start.sh
```

Скриптът ще:
- Стартира Backend на порт 8080
- Стартира Frontend на порт 3000
- Съхрани process IDs в .pids/

За спиране:
```bash
./stop.sh
```

#### Опция 2: Ръчно стартиране

**Терминал 1 - Backend:**
```bash
cd backend
mvn spring-boot:run
```

**Терминал 2 - Frontend:**
```bash
cd frontend
npm start
```

### 6. Проверка на инсталацията

След стартиране, отворете браузър и проверете:

1. **Frontend:** http://localhost:3000
   - Трябва да видите login страница

2. **Backend GraphQL:** http://localhost:8080/graphiql
   - Трябва да видите GraphiQL playground

3. **Backend Health:** http://localhost:8080/actuator/health
   - Трябва да видите: `{"status":"UP"}`

## Първоначална настройка

### Създаване на SUPER_ADMIN потребител

SUPER_ADMIN потребителите се създават само чрез Linux скриптове за сигурност.

```bash
# От главната папка на проекта
cd reset
./create-super-admin.sh
```

Следвайте инструкциите за създаване на първия администраторски акаунт.

### Login в системата

1. Отворете http://localhost:3000
2. Въведете credentials на SUPER_ADMIN потребителя
3. Ще бъдете пренасочени към Dashboard

### Създаване на първата фирма

1. От менюто изберете **Global Settings** (само за SUPER_ADMIN)
2. Кликнете **Add Company**
3. Попълнете данните за фирмата:
   - Име на фирмата
   - ЕИК
   - ДДС номер (ако фирмата е ДДС регистрирана)
   - Адрес
   - Телефон и имейл
4. Кликнете **Create**

### Създаване на администраторски потребител за фирмата

1. След създаване на фирмата, отидете на **Users**
2. Кликнете **Add User**
3. Попълнете данните:
   - Username
   - Password
   - Email
   - Role: ADMIN
   - Company: Изберете създадената фирма
4. Кликнете **Create**

Сега можете да се logout-нете като SUPER_ADMIN и да влезете като ADMIN на фирмата.

## Конфигурация на SMTP (опционално)

За да изпращате имейли (password reset, известия):

1. Влезте като ADMIN
2. Отидете на **Company Settings** → **SMTP Settings**
3. Попълнете данните:
   - SMTP Host: smtp.gmail.com (за Gmail)
   - SMTP Port: 587
   - Username: your-email@gmail.com
   - Password: [App Password за Gmail]
   - From Email: your-email@gmail.com
4. Кликнете **Test Connection** за проверка
5. Кликнете **Save**

**Забележка за Gmail:** Трябва да създадете App Password, не използвайте обикновената си парола.

## Импортиране на начални данни (опционално)

### Валути

Системата автоматично създава основните валути при първо стартиране:
- BGN (Български лев)
- EUR (Евро)
- USD (Американски долар)
- GBP (Британска лира)
- CHF (Швейцарски франк)

### Валутни курсове

Курсовете се изтеглят автоматично:
- БНБ курсове: Всеки ден в 14:30
- ЕЦБ курсове: Всеки ден в 16:00 (след 2026)

За ръчно изтегляне:
```bash
curl -X POST http://localhost:8080/api/exchange-rates/fetch
```

### ДДС ставки

Системата автоматично създава българските ДДС ставки:
- 20% (стандартна)
- 9% (намалена)
- 0% (нулева)

## Troubleshooting

### Backend не стартира

**Проблем:** Port 8080 е зает
```bash
# Намерете процеса, който използва порта
lsof -i :8080
# Убийте процеса
kill -9 <PID>
```

**Проблем:** Database connection failed
- Проверете дали PostgreSQL е стартиран:
  ```bash
  sudo systemctl status postgresql
  ```
- Проверете credentials в application.properties
- Проверете дали базата данни съществува:
  ```bash
  psql -U postgres -l
  ```

**Проблем:** Flyway migration failed
```bash
# Изтрийте базата данни и я създайте отново
psql -U postgres
DROP DATABASE sp-inv-app;
CREATE DATABASE sp-inv-app;
\q
```

### Frontend не стартира

**Проблем:** Port 3000 е зает
```bash
# Намерете процеса
lsof -i :3000
# Убийте процеса
kill -9 <PID>
```

**Проблем:** Dependencies грешки
```bash
# Изтрийте node_modules и package-lock.json
rm -rf node_modules package-lock.json
# Инсталирайте отново
npm install --legacy-peer-deps
```

**Проблем:** Cannot connect to GraphQL API
- Проверете дали Backend е стартиран на порт 8080
- Проверете в browser console за CORS грешки
- Уверете се, че frontend конфигурацията сочи към правилния backend URL

### VIES не работи

**Проблем:** VIES validation timeout
- Проверете интернет връзката
- VIES API понякога е недостъпен - изчакайте и опитайте отново
- Системата автоматично прави fallback към SOAP API

### Валутни курсове не се обновяват

**Проблем:** БНБ/ЕЦБ API недостъпни
- Проверете логовете: `tail -f backend/logs/app.log`
- Системата използва fallback курсове ако API не работи
- Можете да въведете курсове ръчно от Currency Settings

## Следващи стъпки

След успешна инсталация:

1. **Прочетете документацията за функционалностите:** [02-funkcionalnisti.md](./02-funkcionalnisti.md)
2. **Разгледайте GraphQL API:** [03-graphql-api.md](./03-graphql-api.md)
3. **Подгответе се за deployment:** [05-deployment-vps.md](./05-deployment-vps.md)

## Поддръжка

За въпроси и проблеми:
- Email: [Вашият имейл]
- GitHub Issues: [Repository URL]/issues

---

**Последна актуализация:** 24 ноември 2025
