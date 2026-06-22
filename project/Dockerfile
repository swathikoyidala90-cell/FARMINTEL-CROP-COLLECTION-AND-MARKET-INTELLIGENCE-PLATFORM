# Use a supported OpenJDK base image
FROM eclipse-temurin:17-jdk

# Set working directory
WORKDIR /app

# Copy project files
COPY . .

# Give mvnw permission to run
RUN chmod +x mvnw

# Build the app
RUN ./mvnw clean package -DskipTests

# Run the jar
CMD ["java", "-jar", "target/farmintel-0.0.1-SNAPSHOT.jar"]
