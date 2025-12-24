-- V3: Full UN/ECE Recommendation 20 Units of Measure
-- Reference: https://unece.org/trade/uncefact/cl-recommendations

-- Clear existing units and add complete list
TRUNCATE TABLE units_of_measure;

-- Insert comprehensive UN/ECE Rec 20 units with Bulgarian and English names
INSERT INTO units_of_measure (code, name, name_en, symbol, category) VALUES
-- === ЕДИНИЦИ / UNITS ===
('C62', 'Единица', 'One (unit)', 'бр.', 'UNIT'),
('EA', 'Брой', 'Each', 'бр.', 'UNIT'),
('PCE', 'Парче', 'Piece', 'бр.', 'UNIT'),
('SET', 'Комплект', 'Set', 'к-т', 'UNIT'),
('PR', 'Чифт', 'Pair', 'чифт', 'UNIT'),
('DZN', 'Дузина', 'Dozen', 'дуз.', 'UNIT'),
('GRO', 'Грос (144 бр.)', 'Gross', 'грос', 'UNIT'),
('MLN', 'Милион единици', 'Million units', 'млн.', 'UNIT'),
('MIL', 'Хиляда единици', 'Thousand units', 'хил.', 'UNIT'),
('CEN', 'Сто единици', 'Hundred', 'стотици', 'UNIT'),

-- === МАСА / MASS ===
('KGM', 'Килограм', 'Kilogram', 'кг', 'MASS'),
('GRM', 'Грам', 'Gram', 'г', 'MASS'),
('MGM', 'Милиграм', 'Milligram', 'мг', 'MASS'),
('TNE', 'Метричен тон', 'Tonne (metric ton)', 'т', 'MASS'),
('DTN', 'Децитон (100 кг)', 'Decitonne', 'дт', 'MASS'),
('LBR', 'Фунт', 'Pound', 'lb', 'MASS'),
('ONZ', 'Унция', 'Ounce', 'oz', 'MASS'),
('APZ', 'Тройска унция', 'Troy ounce', 'oz t', 'MASS'),
('GRN', 'Гран', 'Grain', 'gr', 'MASS'),
('CTM', 'Карат', 'Metric carat', 'ct', 'MASS'),

-- === ДЪЛЖИНА / LENGTH ===
('MTR', 'Метър', 'Metre', 'м', 'LENGTH'),
('CMT', 'Сантиметър', 'Centimetre', 'см', 'LENGTH'),
('MMT', 'Милиметър', 'Millimetre', 'мм', 'LENGTH'),
('KMT', 'Километър', 'Kilometre', 'км', 'LENGTH'),
('DMT', 'Дециметър', 'Decimetre', 'дм', 'LENGTH'),
('INH', 'Инч', 'Inch', 'in', 'LENGTH'),
('FOT', 'Фут', 'Foot', 'ft', 'LENGTH'),
('YRD', 'Ярд', 'Yard', 'yd', 'LENGTH'),
('SMI', 'Миля (статутна)', 'Mile (statute)', 'mi', 'LENGTH'),
('NMI', 'Морска миля', 'Nautical mile', 'nmi', 'LENGTH'),
('A11', 'Ангстрьом', 'Angstrom', 'Å', 'LENGTH'),

-- === ПЛОЩ / AREA ===
('MTK', 'Квадратен метър', 'Square metre', 'м²', 'AREA'),
('CMK', 'Квадратен сантиметър', 'Square centimetre', 'см²', 'AREA'),
('MMK', 'Квадратен милиметър', 'Square millimetre', 'мм²', 'AREA'),
('KMK', 'Квадратен километър', 'Square kilometre', 'км²', 'AREA'),
('DMK', 'Квадратен дециметър', 'Square decimetre', 'дм²', 'AREA'),
('HAR', 'Хектар', 'Hectare', 'ха', 'AREA'),
('ARE', 'Ар', 'Are', 'а', 'AREA'),
('ACR', 'Акър', 'Acre', 'ac', 'AREA'),
('INK', 'Квадратен инч', 'Square inch', 'in²', 'AREA'),
('FTK', 'Квадратен фут', 'Square foot', 'ft²', 'AREA'),
('YDK', 'Квадратен ярд', 'Square yard', 'yd²', 'AREA'),

-- === ОБЕМ / VOLUME ===
('MTQ', 'Кубичен метър', 'Cubic metre', 'м³', 'VOLUME'),
('LTR', 'Литър', 'Litre', 'л', 'VOLUME'),
('MLT', 'Милилитър', 'Millilitre', 'мл', 'VOLUME'),
('CLT', 'Центилитър', 'Centilitre', 'сл', 'VOLUME'),
('DLT', 'Децилитър', 'Decilitre', 'дл', 'VOLUME'),
('HLT', 'Хектолитър', 'Hectolitre', 'хл', 'VOLUME'),
('CMQ', 'Кубичен сантиметър', 'Cubic centimetre', 'см³', 'VOLUME'),
('MMQ', 'Кубичен милиметър', 'Cubic millimetre', 'мм³', 'VOLUME'),
('DMQ', 'Кубичен дециметър', 'Cubic decimetre', 'дм³', 'VOLUME'),
('INQ', 'Кубичен инч', 'Cubic inch', 'in³', 'VOLUME'),
('FTQ', 'Кубичен фут', 'Cubic foot', 'ft³', 'VOLUME'),
('YDQ', 'Кубичен ярд', 'Cubic yard', 'yd³', 'VOLUME'),
('GLI', 'Галон (UK)', 'Gallon (UK)', 'gal UK', 'VOLUME'),
('GLL', 'Галон (US)', 'Gallon (US)', 'gal US', 'VOLUME'),
('PTI', 'Пинта (UK)', 'Pint (UK)', 'pt UK', 'VOLUME'),
('PTL', 'Пинта (US)', 'Pint (US)', 'pt US', 'VOLUME'),
('QTI', 'Кварта (UK)', 'Quart (UK)', 'qt UK', 'VOLUME'),
('QTL', 'Кварта (US)', 'Quart (US)', 'qt US', 'VOLUME'),
('OZI', 'Течна унция (UK)', 'Fluid ounce (UK)', 'fl oz UK', 'VOLUME'),
('OZA', 'Течна унция (US)', 'Fluid ounce (US)', 'fl oz US', 'VOLUME'),
('BLL', 'Барел (нефт)', 'Barrel (petroleum)', 'bbl', 'VOLUME'),

-- === ВРЕМЕ / TIME ===
('SEC', 'Секунда', 'Second', 'сек', 'TIME'),
('MIN', 'Минута', 'Minute', 'мин', 'TIME'),
('HUR', 'Час', 'Hour', 'ч', 'TIME'),
('DAY', 'Ден', 'Day', 'дни', 'TIME'),
('WEE', 'Седмица', 'Week', 'седм.', 'TIME'),
('MON', 'Месец', 'Month', 'мес.', 'TIME'),
('ANN', 'Година', 'Year', 'год.', 'TIME'),

-- === ОПАКОВКИ / PACKAGING ===
('PK', 'Пакет', 'Pack', 'пак.', 'PACKAGING'),
('BX', 'Кутия', 'Box', 'кут.', 'PACKAGING'),
('CT', 'Кашон', 'Carton', 'каш.', 'PACKAGING'),
('CS', 'Каса', 'Case', 'каса', 'PACKAGING'),
('PA', 'Пакет', 'Packet', 'пакет', 'PACKAGING'),
('BG', 'Торба', 'Bag', 'торба', 'PACKAGING'),
('CG', 'Клетка', 'Cage', 'клетка', 'PACKAGING'),
('CR', 'Щайга', 'Crate', 'щайга', 'PACKAGING'),
('DR', 'Барабан', 'Drum', 'барабан', 'PACKAGING'),
('BE', 'Връзка', 'Bundle', 'връзка', 'PACKAGING'),
('RL', 'Ролка', 'Reel', 'ролка', 'PACKAGING'),
('ROL', 'Ролка', 'Roll', 'рол.', 'PACKAGING'),
('SH', 'Лист', 'Sheet', 'лист', 'PACKAGING'),
('ST', 'Лист (тънък)', 'Sheet (thin)', 'лист', 'PACKAGING'),
('BT', 'Бутилка', 'Bottle', 'бут.', 'PACKAGING'),
('CAN', 'Кутия (метална)', 'Can', 'кутия', 'PACKAGING'),
('JR', 'Буркан', 'Jar', 'буркан', 'PACKAGING'),
('TU', 'Тубичка', 'Tube', 'тубичка', 'PACKAGING'),
('PL', 'Кофа', 'Pail', 'кофа', 'PACKAGING'),
('CY', 'Цилиндър', 'Cylinder', 'цил.', 'PACKAGING'),
('NE', 'Непакетирано', 'Unpacked', 'непак.', 'PACKAGING'),

-- === ЕЛЕКТРИЧЕСТВО / ELECTRICAL ===
('WTT', 'Ват', 'Watt', 'W', 'ELECTRICAL'),
('KWT', 'Киловат', 'Kilowatt', 'kW', 'ELECTRICAL'),
('MAW', 'Мегават', 'Megawatt', 'MW', 'ELECTRICAL'),
('WHR', 'Ватчас', 'Watt hour', 'Wh', 'ELECTRICAL'),
('KWH', 'Киловатчас', 'Kilowatt hour', 'kWh', 'ELECTRICAL'),
('MWH', 'Мегаватчас', 'Megawatt hour', 'MWh', 'ELECTRICAL'),
('GWH', 'Гигаватчас', 'Gigawatt hour', 'GWh', 'ELECTRICAL'),
('AMP', 'Ампер', 'Ampere', 'A', 'ELECTRICAL'),
('VLT', 'Волт', 'Volt', 'V', 'ELECTRICAL'),
('OHM', 'Ом', 'Ohm', 'Ω', 'ELECTRICAL'),

-- === ИНФОРМАЦИЯ / INFORMATION ===
('E34', 'Гигабайт', 'Gigabyte', 'GB', 'INFORMATION'),
('E35', 'Терабайт', 'Terabyte', 'TB', 'INFORMATION'),
('4L', 'Мегабайт', 'Megabyte', 'MB', 'INFORMATION'),
('AD', 'Байт', 'Byte', 'B', 'INFORMATION'),
('E36', 'Петабайт', 'Petabyte', 'PB', 'INFORMATION'),

-- === ТЕМПЕРАТУРА / TEMPERATURE ===
('CEL', 'Градус Целзий', 'Degree Celsius', '°C', 'TEMPERATURE'),
('FAH', 'Градус Фаренхайт', 'Degree Fahrenheit', '°F', 'TEMPERATURE'),
('KEL', 'Келвин', 'Kelvin', 'K', 'TEMPERATURE'),

-- === НАЛЯГАНЕ / PRESSURE ===
('BAR', 'Бар', 'Bar', 'bar', 'PRESSURE'),
('MBR', 'Милибар', 'Millibar', 'mbar', 'PRESSURE'),
('PAL', 'Паскал', 'Pascal', 'Pa', 'PRESSURE'),
('KPA', 'Килопаскал', 'Kilopascal', 'kPa', 'PRESSURE'),
('MPA', 'Мегапаскал', 'Megapascal', 'MPa', 'PRESSURE'),
('ATM', 'Стандартна атмосфера', 'Standard atmosphere', 'atm', 'PRESSURE'),
('PSI', 'Фунт на кв. инч', 'Pound-force per square inch', 'psi', 'PRESSURE'),

-- === ЧЕСТОТА / FREQUENCY ===
('HTZ', 'Херц', 'Hertz', 'Hz', 'FREQUENCY'),
('KHZ', 'Килохерц', 'Kilohertz', 'kHz', 'FREQUENCY'),
('MHZ', 'Мегахерц', 'Megahertz', 'MHz', 'FREQUENCY'),
('GHZ', 'Гигахерц', 'Gigahertz', 'GHz', 'FREQUENCY'),

-- === СКОРОСТ / SPEED ===
('KMH', 'Километър в час', 'Kilometre per hour', 'км/ч', 'SPEED'),
('MTS', 'Метър в секунда', 'Metre per second', 'м/с', 'SPEED'),
('KNT', 'Възел', 'Knot', 'kn', 'SPEED'),
('HM', 'Миля в час', 'Mile per hour', 'mph', 'SPEED'),

-- === ПРОЦЕНТ И ДРОБИ / PERCENT AND FRACTIONS ===
('P1', 'Процент', 'Percent', '%', 'PERCENT'),
('E40', 'Промил', 'Per mille', '‰', 'PERCENT'),

-- === СПЕЦИАЛНИ ЗА УСЛУГИ / SPECIAL FOR SERVICES ===
('LS', 'Еднократна сума', 'Lump sum', 'ед.с.', 'SERVICE'),
('E48', 'Услуга единица', 'Service unit', 'усл.', 'SERVICE'),
('ACT', 'Дейност', 'Activity', 'дейн.', 'SERVICE'),
('E49', 'Работен ден', 'Working day', 'раб.ден', 'SERVICE'),

-- === ДРУГИ / MISCELLANEOUS ===
('NMP', 'Брой опаковки', 'Number of packs', 'бр.оп.', 'MISCELLANEOUS'),
('NPR', 'Брой чифтове', 'Number of pairs', 'бр.ч.', 'MISCELLANEOUS'),
('NPL', 'Брой палети', 'Number of pallets', 'бр.пал.', 'MISCELLANEOUS'),
('NCL', 'Брой клетки', 'Number of cells', 'бр.кл.', 'MISCELLANEOUS'),
('NAR', 'Брой артикули', 'Number of articles', 'бр.арт.', 'MISCELLANEOUS'),
('H87', 'Парче (piece)', 'Piece', 'бр.', 'MISCELLANEOUS'),
('XPP', 'Парче', 'Piece', 'бр.', 'MISCELLANEOUS')

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    name_en = EXCLUDED.name_en,
    symbol = EXCLUDED.symbol,
    category = EXCLUDED.category;

-- Create index for faster searching
CREATE INDEX IF NOT EXISTS idx_units_name ON units_of_measure (name);
CREATE INDEX IF NOT EXISTS idx_units_name_en ON units_of_measure (name_en);
CREATE INDEX IF NOT EXISTS idx_units_category ON units_of_measure (category);
