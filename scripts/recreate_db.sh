mysql  -p1234 --host localhost --user user -e "drop database sno; create database sno;"
mysql  -p1234 --database sno --host localhost --user user < create_db.sql
