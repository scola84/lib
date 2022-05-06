./dist/cli/index.js html-sql "src/common/snippets/auth/form/*.html" ".docker/mssql/docker-entrypoint-initdb.d/lib/00_auth.sql" -d mssql -D scola
./dist/cli/index.js html-sql "src/common/snippets/auth/form/*.html" ".docker/mysql/docker-entrypoint-initdb.d/lib/00_auth.sql" -d mysql -D scola
./dist/cli/index.js html-sql "src/common/snippets/auth/form/*.html" ".docker/pgsql/docker-entrypoint-initdb.d/lib/00_auth.sql" -d pgsql -D scola
./dist/cli/index.js html-sql "src/common/snippets/queue/form/*.html" ".docker/mssql/docker-entrypoint-initdb.d/lib/01_queue.sql" -d mssql -D scola
./dist/cli/index.js html-sql "src/common/snippets/queue/form/*.html" ".docker/mysql/docker-entrypoint-initdb.d/lib/01_queue.sql" -d mysql -D scola
./dist/cli/index.js html-sql "src/common/snippets/queue/form/*.html" ".docker/pgsql/docker-entrypoint-initdb.d/lib/01_queue.sql" -d pgsql -D scola
