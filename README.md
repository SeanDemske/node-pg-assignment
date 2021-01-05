## Biztime
An invoice management app

## How To Setup The Developer Environment  (Windows OS)
-Install Node v12.17.0+
-Install psql (PostgreSQL) 13.0
-CD into project directory
-Run 'npm install' to install dependencies 
-Run 'createdb biztime' with a password of developer
-Seed the data with the terminal command 'psql biztime < data.sql'
-Install nodemon
-Run the application with 'nodemon server.js'  

## How to run tests  
-Run 'createdb biztime_test' with a password of developer
-Seed the test database with 'psql biztime_test < data_test.sql'
-Install Jest
-Run tests with the command 'jest -i'

