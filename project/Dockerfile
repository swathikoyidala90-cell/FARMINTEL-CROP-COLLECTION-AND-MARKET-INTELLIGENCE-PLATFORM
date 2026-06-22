# Use a supported OpenJDK base image
FROM eclipse-temurin:17-jdk

WORKDIR /app

COPY . .

RUN chmod +x mvnw

# Build the app
RUN ./mvnw clean package -DskipTests

# Run the jar (correct name!)
CMD ["java", "-jar", "target/project-0.0.1-SNAPSHOT.jar"]
