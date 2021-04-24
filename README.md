# S&O Website and Content Management System
Website for S&O Maldives. 

Work in progress.
## Requirements
 - nodejs (v14+)
 - MySQL or MariaDB server

## How to run

1. Clone the project
2. Install the npm modules
```
npm install
```
3.  To run the project in developement mode:
```
npm run start
```

I still havent written the script for production.

## Setting up the database
Install MySQL or MariaDB server

Create a user and database. Run the following query if you like.

``` sql
CREATE database sno;
CREATE USER 'user'@'localhost' IDENTIFIED BY '1234';
GRANT ALL PRIVILEGES ON sno.* TO 'user'@'localhost';
flush privileges;
```

## Creating the config file
Backend API will not function unless it can find config.json file in the root directory.
You must create the config.json file for your own project.

It may look something like this:

``` json
{
    "mysql": {
        "database": "sno",
        "user": "user",
        "password": "password",
        "host": "127.0.0.1"
    },
    "secret": "123456"
}
```

ng build

# Developement notes
 - 'html' folder contains the static html and css files

