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

#remove the container
#docker rm timescaledb

#remove the image
#docker rmi timescale/timescaledb-ha:pg17

