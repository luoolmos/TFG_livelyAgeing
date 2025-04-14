#install docker
#docker pull timescale/timescaledb-ha:pg17

#run the container
#docker run -d --name timescaledb -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb-ha:pg17


#stop the container
#docker stop timescaledb

#start the container
#docker start timescaledb

#connect to the container
#docker exec -it timescaledb bash

#as root
#docker exec -it --user root timescaledb bash

#remove the container
#docker rm timescaledb

#remove the image
#docker rmi timescale/timescaledb-ha:pg17

#connect to port 5433
#psql -h localhost -p 5433 -U postgres




#### 
pip install python-dotenv
pip install psycopg2-binary

npm install sqlite3

