# Etapa 1: compilar la aplicación con Java 21 y Maven
FROM maven:3.9.9-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -DskipTests clean package

# Etapa 2: ejecutar solo el artefacto compilado
FROM eclipse-temurin:21-jre
WORKDIR /app
COPY --from=build /app/target/observatorio-mininter-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 10000
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -Dserver.port=${PORT:-10000} -Dserver.address=0.0.0.0 -jar /app/app.jar"]
