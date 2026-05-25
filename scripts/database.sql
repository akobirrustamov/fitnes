-- Database: dent

-- DROP DATABASE IF EXISTS dent;

CREATE DATABASE fit_crm
    WITH
    OWNER = triple_seven
    ENCODING = 'UTF8'
    LC_COLLATE = 'C.UTF-8'
    LC_CTYPE = 'C.UTF-8'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1
    IS_TEMPLATE = False;

COMMENT ON DATABASE dent
    IS 'FitCRMning yangi databasesi. Yangi API uchun kerak bo''ladi. Buni to''liq to''g''ri ko''tarish shart.';