# Factor 13: API First

## Design and document APIs before implementation

### Modern Principle

Modern applications live or die by their APIs. API-first design means defining the interface before implementation, enabling parallel development, clear contracts between services, and better developer experience. This factor addresses a gap in the original twelve - the critical importance of well-designed, documented, and versioned APIs.

#### Why API First?

- **Parallel Development**: Frontend and backend teams can work simultaneously
- **Contract Testing**: Ensure compatibility before deployment
- **Documentation**: Generated from specifications
- **Mock Servers**: Test against APIs before they exist
- **Client Generation**: Auto-generate SDKs in multiple languages

#### OpenAPI Specification

```yaml
# api-spec.yaml
openapi: 3.0.3
info:
  title: User Service API
  version: 1.0.0
  description: |
    User management service providing authentication and profile management
servers:
  - url: https://api.example.com/v1
    description: Production
  - url: https://staging-api.example.com/v1
    description: Staging

paths:
  /users:
    post:
      summary: Create a new user
      operationId: createUser
      tags:
        - Users
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/CreateUserRequest'
      responses:
        '201':
          description: User created successfully
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
          headers:
            Location:
              schema:
                type: string
              description: URL of the created user
        '400':
          $ref: '#/components/responses/BadRequest'
        '409':
          $ref: '#/components/responses/Conflict'

  /users/{userId}:
    get:
      summary: Get user by ID
      operationId: getUser
      tags:
        - Users
      parameters:
        - $ref: '#/components/parameters/userId'
      responses:
        '200':
          description: User found
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/User'
        '404':
          $ref: '#/components/responses/NotFound'

components:
  schemas:
    User:
      type: object
      required:
        - id
        - email
        - createdAt
      properties:
        id:
          type: string
          format: uuid
          example: "123e4567-e89b-12d3-a456-426614174000"
        email:
          type: string
          format: email
          example: "user@example.com"
        name:
          type: string
          example: "John Doe"
        createdAt:
          type: string
          format: date-time
        updatedAt:
          type: string
          format: date-time
```